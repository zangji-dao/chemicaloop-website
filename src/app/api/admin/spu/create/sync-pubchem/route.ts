import { NextRequest, NextResponse } from 'next/server';
import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import { sql, eq } from 'drizzle-orm';
import * as schema from '@/db';
import { API_CONFIG } from '@/lib/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { translateText as translateTextBase } from '@/services/productSyncService';

const execAsync = promisify(exec);

// PubChem API 基础URL
const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const PUBCHEM_VIEW_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';

// 请求超时和重试配置
const FETCH_TIMEOUT = 60000;
const VIEW_TIMEOUT = 90000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

// 内存缓存（缓存5分钟，用于预览模式）
const previewCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCachedPreview(cas: string): any | null {
  const cached = previewCache.get(cas);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache] Preview hit for ${cas}`);
    return cached.data;
  }
  return null;
}

function setCachedPreview(cas: string, data: any): void {
  previewCache.set(cas, { data, timestamp: Date.now() });
  console.log(`[Cache] Preview cached for ${cas}`);
}

// 中文名称识别正则（包含中文Unicode范围）
const CHINESE_REGEX = /[\u4e00-\u9fff]+/;

/**
 * 从同义词列表中提取中文名称
 */
function extractChineseName(synonyms: string[]): string | null {
  for (const synonym of synonyms) {
    if (CHINESE_REGEX.test(synonym)) {
      const chineseParts = synonym.match(/[\u4e00-\u9fff]+/g);
      if (chineseParts && chineseParts.length > 0) {
        const chineseName = chineseParts.find(part => part.length >= 2 && part.length <= 10);
        if (chineseName) return chineseName;
      }
    }
  }
  return null;
}

/**
 * 翻译文本（调用内部翻译 API）
 * 包装 productSyncService 的 translateText，失败时返回原文本
 */
async function translateText(text: string, targetLang: string): Promise<string> {
  const result = await translateTextBase(text, targetLang);
  return result || text;
}

/**
 * 翻译内容到多语言
 */
async function translateContent(
  description: string | null,
  applications: string[] | null,
  physicalDescription: string | null,
  hazardClasses: string | null,
  healthHazards: string | null = null,
  ghsClassification: string | null = null
): Promise<{
  descriptionZh: string | null;
  applicationsZh: string[] | null;
  physicalDescriptionZh: string | null;
  hazardClassesZh: string | null;
  healthHazardsZh: string | null;
  ghsClassificationZh: string | null;
}> {
  const result = {
    descriptionZh: null as string | null,
    applicationsZh: null as string[] | null,
    physicalDescriptionZh: null as string | null,
    hazardClassesZh: null as string | null,
    healthHazardsZh: null as string | null,
    ghsClassificationZh: null as string | null,
  };
  
  try {
    // 翻译描述
    if (description) {
      result.descriptionZh = await translateText(description, 'zh');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 翻译应用（只翻译前5个）
    if (applications && applications.length > 0) {
      const toTranslate = applications.slice(0, 5);
      const translated: string[] = [];
      
      for (const app of toTranslate) {
        const translatedApp = await translateText(app, 'zh');
        translated.push(translatedApp);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      result.applicationsZh = translated;
    }
    
    // 翻译物理描述
    if (physicalDescription) {
      result.physicalDescriptionZh = await translateText(physicalDescription, 'zh');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 翻译危险分类
    if (hazardClasses) {
      result.hazardClassesZh = await translateText(hazardClasses, 'zh');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 翻译健康危害
    if (healthHazards) {
      result.healthHazardsZh = await translateText(healthHazards, 'zh');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    // 翻译 GHS 分类
    if (ghsClassification) {
      result.ghsClassificationZh = await translateText(ghsClassification, 'zh');
    }
  } catch (error) {
    console.error('[Translate] Error translating content:', error);
  }
  
  return result;
}

/**
 * 使用 curl 作为备选的 fetch 方法（解决 Node.js 网络限制）
 */
async function fetchWithCurl(url: string, timeoutMs: number = 30000): Promise<any> {
  try {
    console.log(`[PubChem] Using curl fallback: ${url}`);
    const timeoutSeconds = Math.floor(timeoutMs / 1000);
    
    // 使用临时文件存储响应（避免 stdout buffer 限制）
    const tempFile = `/tmp/pubchem_${Date.now()}.json`;
    const command = `curl -s --connect-timeout 15 --max-time ${timeoutSeconds} '${url}' -o ${tempFile}`;
    
    await execAsync(command, { timeout: timeoutMs + 15000 });
    
    // 读取文件内容
    const fs = require('fs');
    if (fs.existsSync(tempFile)) {
      const content = fs.readFileSync(tempFile, 'utf-8');
      fs.unlinkSync(tempFile); // 清理临时文件
      
      if (content && content.trim()) {
        try {
          const result = JSON.parse(content);
          console.log(`[PubChem] Curl success, got ${content.length} bytes`);
          return { ok: true, json: () => Promise.resolve(result) };
        } catch (parseError) {
          console.error(`[PubChem] Curl JSON parse error`);
          return null;
        }
      }
    }
    return null;
  } catch (error: any) {
    console.error(`[PubChem] Curl error:`, error?.message);
    return null;
  }
}

/**
 * 带超时和重试的 fetch 请求（支持 curl 备选）
 */
async function fetchWithRetry(url: string, retries: number = MAX_RETRIES, timeout: number = FETCH_TIMEOUT): Promise<Response | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        return response;
      }
      
      if (response.status === 429 || response.status >= 500) {
        console.log(`[PubChem] Retry ${attempt + 1}/${retries} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
        continue;
      }
      
      return response;
    } catch (error: any) {
      console.error(`[PubChem] Attempt ${attempt + 1} failed for ${url}:`, error?.message);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }
  
  // 所有 fetch 重试失败后，尝试 curl 备选
  console.log(`[PubChem] All fetch attempts failed, trying curl fallback...`);
  const curlResult = await fetchWithCurl(url, timeout);
  return curlResult as any;
}

/**
 * 完整的 PubChem 数据结构
 */
interface PubChemData {
  cid: number;
  // 标识符
  formula?: string | null;
  molecularWeight?: string | null;
  exactMass?: string | null;
  smiles?: string | null;
  smilesCanonical?: string | null;
  smilesIsomeric?: string | null;
  inchi?: string | null;
  inchiKey?: string | null;
  // 计算属性
  xlogp?: string | null;
  tpsa?: string | null;
  complexity?: number | null;
  hBondDonorCount?: number | null;
  hBondAcceptorCount?: number | null;
  rotatableBondCount?: number | null;
  heavyAtomCount?: number | null;
  formalCharge?: number | null;
  stereoCenterCount?: number | null;
  // 物理化学性质
  description?: string | null;
  physicalDescription?: string | null;
  colorForm?: string | null;
  odor?: string | null;
  boilingPoint?: string | null;
  meltingPoint?: string | null;
  flashPoint?: string | null;
  density?: string | null;
  solubility?: string | null;
  vaporPressure?: string | null;
  refractiveIndex?: string | null;
  // 安全信息
  hazardClasses?: string | null;
  healthHazards?: string | null;
  ghsClassification?: string | null;
  toxicitySummary?: string | null;
  carcinogenicity?: string | null;
  firstAid?: string | null;
  storageConditions?: string | null;
  incompatibleMaterials?: string | null;
  // 同义词与应用
  synonyms?: string[];
  applications?: string[];
  // 结构图片
  structureUrl?: string | null;
  structureImageKey?: string | null;
  structureSdf?: string | null;          // SDF 结构数据（用于重绘）
  structure2dSvg?: string | null;
}

/**
 * 从 PubChem Pug View 数据中提取完整的物理化学性质
 */
function extractPubChemProperties(data: any): Partial<PubChemData> {
  const result: Partial<PubChemData> = {};
  const applications: string[] = [];
  
  try {
    const sections = data?.Record?.Section || [];
    
    for (const section of sections) {
      const heading = section.TOCHeading || '';
      
      // ========== 名称与标识符 ==========
      if (heading === 'Names and Identifiers') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          // 记录描述
          if (subHeading === 'Record Description') {
            const info = sub.Information?.[0];
            if (info?.Value?.StringWithMarkup?.[0]?.String) {
              result.description = info.Value.StringWithMarkup[0].String;
            }
          }
          
          // 同义词
          if (subHeading === 'Synonyms') {
            const synonyms: string[] = [];
            for (const info of sub.Information || []) {
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                synonyms.push(info.Value.StringWithMarkup[0].String);
              }
            }
            if (synonyms.length > 0 && !result.synonyms) {
              result.synonyms = synonyms.slice(0, 20);
            }
          }
        }
      }
      
      // ========== 化学与物理性质 ==========
      if (heading === 'Chemical and Physical Properties') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          // 计算属性
          if (subHeading === 'Computed Properties') {
            for (const prop of sub.Section || []) {
              const propName = prop.TOCHeading || '';
              const info = prop.Information?.[0];
              const value = info?.Value?.StringWithMarkup?.[0]?.String || info?.Value?.Fvec?.[0];
              
              if (propName.includes('XLogP3')) result.xlogp = value?.toString();
              else if (propName.includes('TPSA')) result.tpsa = value?.toString();
              else if (propName.includes('Complexity')) result.complexity = parseInt(value) || null;
              else if (propName.includes('Hydrogen Bond Donor')) result.hBondDonorCount = parseInt(value) || null;
              else if (propName.includes('Hydrogen Bond Acceptor')) result.hBondAcceptorCount = parseInt(value) || null;
              else if (propName.includes('Rotatable Bond')) result.rotatableBondCount = parseInt(value) || null;
              else if (propName.includes('Heavy Atom')) result.heavyAtomCount = parseInt(value) || null;
              else if (propName.includes('Formal Charge')) result.formalCharge = parseInt(value) || null;
            }
          }
          
          // 实验性质
          if (subHeading === 'Experimental Properties') {
            for (const prop of sub.Section || []) {
              const propName = prop.TOCHeading || '';
              const info = prop.Information?.[0];
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const value = info.Value.StringWithMarkup[0].String;
                
                if (propName.includes('Boiling Point')) result.boilingPoint = value;
                else if (propName.includes('Melting Point')) result.meltingPoint = value;
                else if (propName.includes('Flash Point')) result.flashPoint = value;
                else if (propName.includes('Density')) result.density = value;
                else if (propName.includes('Solubility')) result.solubility = value;
                else if (propName.includes('Vapor Pressure')) result.vaporPressure = value;
                else if (propName.includes('Refractive Index')) result.refractiveIndex = value;
                else if (propName.includes('Physical Description') || propName.includes('Appearance')) {
                  result.physicalDescription = value;
                }
                else if (propName.includes('Color')) result.colorForm = value;
                else if (propName.includes('Odor')) result.odor = value;
              }
            }
          }
        }
      }
      
      // ========== 化学安全 ==========
      if (heading === 'Chemical Safety') {
        const info = section.Information?.[0];
        if (info?.Value?.StringWithMarkup?.[0]?.String) {
          if (!result.description) {
            result.description = info.Value.StringWithMarkup[0].String;
          }
        }
      }
      
      // ========== 安全与危害 ==========
      if (heading === 'Safety and Hazards') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          if (subHeading === 'Hazards Identification') {
            for (const haz of sub.Section || []) {
              const hazHeading = haz.TOCHeading || '';
              
              if (hazHeading === 'GHS Classification') {
                // 遍历所有 Information 条目提取完整信息
                const ghsStatements: string[] = [];
                const hazardClassesSet = new Set<string>(); // 使用 Set 去重
                let signalWord = '';
                
                for (const info of haz.Information || []) {
                  const infoName = info.Name || '';
                  
                  // 提取 Pictogram(s) - 危险类别图标
                  if (infoName === 'Pictogram(s)') {
                    const markup = info?.Value?.StringWithMarkup?.[0]?.Markup;
                    if (markup && Array.isArray(markup)) {
                      for (const m of markup) {
                        if (m?.Extra) {
                          hazardClassesSet.add(m.Extra); // Set 自动去重
                        }
                      }
                    }
                  }
                  
                  // 提取 Signal - 信号词
                  if (infoName === 'Signal') {
                    const signal = info?.Value?.StringWithMarkup?.[0]?.String;
                    if (signal) {
                      signalWord = signal;
                    }
                  }
                  
                  // 提取 GHS Hazard Statements - GHS 危险说明
                  if (infoName === 'GHS Hazard Statements') {
                    for (const swm of info?.Value?.StringWithMarkup || []) {
                      if (swm.String) {
                        ghsStatements.push(swm.String);
                      }
                    }
                  }
                }
                
                // 组装 GHS 分类信息（去重）
                const uniqueGhsStatements = [...new Set(ghsStatements)];
                if (uniqueGhsStatements.length > 0) {
                  result.ghsClassification = uniqueGhsStatements.join('\n');
                }
                if (hazardClassesSet.size > 0) {
                  result.hazardClasses = [...hazardClassesSet].join(', ');
                }
              }
              
              if (hazHeading === 'Hazards Identification') {
                const info = haz.Information?.[0];
                if (info?.Value?.StringWithMarkup?.[0]?.String) {
                  if (!result.hazardClasses) {
                    result.hazardClasses = info.Value.StringWithMarkup[0].String;
                  }
                }
              }
            }
          }
          
          // 急救措施
          if (subHeading === 'First Aid' || subHeading === 'First Aid Measures') {
            const firstAidSet = new Set<string>();
            // 提取顶层信息
            for (const info of sub.Information || []) {
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                firstAidSet.add(info.Value.StringWithMarkup[0].String);
              }
            }
            // 提取子节信息
            for (const subSub of sub.Section || []) {
              for (const info of subSub.Information || []) {
                if (info?.Value?.StringWithMarkup?.[0]?.String) {
                  firstAidSet.add(info.Value.StringWithMarkup[0].String);
                }
              }
            }
            if (firstAidSet.size > 0) {
              result.firstAid = [...firstAidSet].join('\n');
            }
          }
          
          // 存储条件 - Handling and Storage
          if (subHeading === 'Handling and Storage') {
            const storageSet = new Set<string>();
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              // Storage Conditions 子节
              if (subSubHeading.includes('Storage') || subSubHeading === 'Safe Storage') {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    storageSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
              }
            }
            if (storageSet.size > 0) {
              result.storageConditions = [...storageSet].join('\n');
            }
          }
          
          // 不相容物质 - Stability and Reactivity
          if (subHeading === 'Stability and Reactivity') {
            const incompatSet = new Set<string>();
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              // Hazardous Reactivities and Incompatibilities 子节
              if (subSubHeading.includes('Incompatib') || subSubHeading.includes('Reactivity')) {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    incompatSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
              }
            }
            if (incompatSet.size > 0) {
              result.incompatibleMaterials = [...incompatSet].join('\n');
            }
          }
        }
      }
      
      // ========== 毒性信息 ==========
      if (heading === 'Toxicity') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          // 毒理学信息子节
          if (subHeading.includes('Toxicological Information')) {
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              
              // 毒性摘要
              if (subSubHeading === 'Toxicity Summary') {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    result.toxicitySummary = info.Value.StringWithMarkup[0].String;
                    break;
                  }
                }
              }
              
              // 致癌性证据
              if (subSubHeading.includes('Evidence for Carcinogenicity') || subSubHeading === 'Carcinogen Classification') {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    result.carcinogenicity = info.Value.StringWithMarkup[0].String;
                    break;
                  }
                }
              }
              
              // 健康效应
              if (subSubHeading === 'Health Effects') {
                const healthHazardsSet = new Set<string>();
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    // 去重：使用 Set 存储
                    healthHazardsSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
                if (healthHazardsSet.size > 0) {
                  // 如果已有数据，合并并去重
                  if (result.healthHazards) {
                    const existing = new Set(result.healthHazards.split('\n'));
                    healthHazardsSet.forEach(item => existing.add(item));
                    result.healthHazards = [...existing].join('\n');
                  } else {
                    result.healthHazards = [...healthHazardsSet].join('\n');
                  }
                }
              }
              
              // 不良反应 (Adverse Effects) - 这是健康危害的重要来源
              if (subSubHeading === 'Adverse Effects') {
                const adverseEffectsSet = new Set<string>();
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    adverseEffectsSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
                if (adverseEffectsSet.size > 0) {
                  if (result.healthHazards) {
                    const existing = new Set(result.healthHazards.split('\n'));
                    adverseEffectsSet.forEach(item => existing.add(item));
                    result.healthHazards = [...existing].join('\n');
                  } else {
                    result.healthHazards = [...adverseEffectsSet].join('\n');
                  }
                }
              }
              
              // 症状和体征 (Signs and Symptoms) - 健康危害的重要组成部分
              if (subSubHeading === 'Signs and Symptoms') {
                const symptomsSet = new Set<string>();
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    symptomsSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
                if (symptomsSet.size > 0) {
                  if (result.healthHazards) {
                    const existing = new Set(result.healthHazards.split('\n'));
                    symptomsSet.forEach(item => existing.add(item));
                    result.healthHazards = [...existing].join('\n');
                  } else {
                    result.healthHazards = [...symptomsSet].join('\n');
                  }
                }
              }
              
              // 暴露途径 (Exposure Routes) - 健康危害的补充信息
              if (subSubHeading === 'Exposure Routes') {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    const exposureRoutes = info.Value.StringWithMarkup[0].String;
                    // 添加到健康危害的开头作为概述
                    if (result.healthHazards) {
                      result.healthHazards = `Exposure Routes: ${exposureRoutes}\n\n${result.healthHazards}`;
                    } else {
                      result.healthHazards = `Exposure Routes: ${exposureRoutes}`;
                    }
                    break;
                  }
                }
              }
              
              // 急性效应
              if (subSubHeading === 'Acute Effects') {
                const acuteEffectsSet = new Set<string>();
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    acuteEffectsSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
                // 如果没有健康危害，用急性效应补充；否则合并
                if (acuteEffectsSet.size > 0) {
                  if (!result.healthHazards) {
                    result.healthHazards = [...acuteEffectsSet].join('\n');
                  } else {
                    // 合并并去重
                    const existing = new Set(result.healthHazards.split('\n'));
                    acuteEffectsSet.forEach(item => existing.add(item));
                    result.healthHazards = [...existing].join('\n');
                  }
                }
              }
              
              // 目标器官
              if (subSubHeading === 'Target Organs') {
                const targetOrgans: string[] = [];
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    targetOrgans.push(info.Value.StringWithMarkup[0].String);
                  }
                }
                // 存储到毒性摘要中补充
                if (targetOrgans.length > 0 && result.toxicitySummary) {
                  result.toxicitySummary += '\n\nTarget Organs: ' + targetOrgans.join(', ');
                }
              }
            }
          }
        }
      }
      
      // ========== 用途与制造 ==========
      if (heading === 'Use and Manufacturing') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          // 用途
          if (subHeading === 'Uses') {
            for (const info of sub.Information || []) {
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const use = info.Value.StringWithMarkup[0].String;
                if (use && !applications.includes(use) && use.length < 500) {
                  applications.push(use);
                }
              }
            }
          }
          
          // 消费模式
          if (subHeading === 'Consumption Patterns') {
            for (const info of sub.Information || []) {
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const use = info.Value.StringWithMarkup[0].String;
                if (use && !applications.includes(use) && use.length < 500) {
                  applications.push(use);
                }
              }
            }
          }
          
          // 制造信息
          if (subHeading === 'General Manufacturing Information') {
            for (const info of sub.Information || []) {
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const use = info.Value.StringWithMarkup[0].String;
                if (use && !applications.includes(use) && use.length < 500) {
                  applications.push(use);
                }
              }
            }
          }
        }
      }
    }
    
    // 添加应用信息
    if (applications.length > 0) {
      result.applications = applications;
    }
    
    // 对于 PubChem 没有数据的物理性质字段，标记为 "-"
    // 这些是 PubChem 可能提供但当前化学品没有数据的字段
    const physicalProps = [
      'boilingPoint', 'meltingPoint', 'flashPoint', 'density', 
      'solubility', 'vaporPressure', 'refractiveIndex',
      'physicalDescription', 'colorForm', 'odor'
    ];
    physicalProps.forEach(prop => {
      if (!result[prop as keyof typeof result]) {
        (result as any)[prop] = '-';
      }
    });
    
    // 安全信息字段也标记
    const safetyProps = [
      'hazardClasses', 'healthHazards', 'ghsClassification',
      'firstAid', 'storageConditions', 'incompatibleMaterials'
    ];
    safetyProps.forEach(prop => {
      if (!result[prop as keyof typeof result]) {
        (result as any)[prop] = '-';
      }
    });
  } catch (error) {
    console.error('Error extracting PubChem properties:', error);
  }
  
  return result;
}

/**
 * 安全获取数值（处理空字符串和无效值）
 */
function safeNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseInt(value);
  return isNaN(num) ? null : num;
}

/**
 * 安全获取字符串（空字符串转 null）
 */
function safeString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value);
}

/**
 * 从 PubChem 获取完整的化合物信息
 */
async function fetchPubChemData(cas: string): Promise<PubChemData | null> {
  try {
    // 1. 获取 CID
    const cidResponse = await fetchWithRetry(
      `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(cas)}/cids/JSON`
    );
    
    if (!cidResponse || !cidResponse.ok) {
      return null;
    }
    
    const cidData = await cidResponse.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    
    if (!cid) {
      return null;
    }
    
    const result: PubChemData = { cid };
    
    // 2. 获取基础属性（使用有效的 PubChem 属性名）
    // 参考文档: https://pubchem.ncbi.nlm.nih.gov/docs/pug-rest
    const propsResponse = await fetchWithRetry(
      `${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,ExactMass,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,XLogP,TPSA,Complexity,HeavyAtomCount/JSON`
    );
    
    if (propsResponse && propsResponse.ok) {
      const propsData = await propsResponse.json();
      const props = propsData?.PropertyTable?.Properties?.[0];
      if (props) {
        result.formula = props.MolecularFormula || null;
        result.molecularWeight = props.MolecularWeight?.toString() || null;
        result.exactMass = props.ExactMass?.toString() || null;
        // CanonicalSMILES 可能在某些情况下返回为 ConnectivitySMILES 或 SMILES
        result.smiles = props.CanonicalSMILES || props.SMILES || props.ConnectivitySMILES || null;
        result.smilesCanonical = props.CanonicalSMILES || props.SMILES || props.ConnectivitySMILES || null;
        result.smilesIsomeric = props.IsomericSMILES || null;
        result.inchi = props.InChI || null;
        result.inchiKey = props.InChIKey || null;
        // XLogP 属性
        result.xlogp = props.XLogP?.toString() || null;
        result.tpsa = props.TPSA?.toString() || null;
        result.complexity = props.Complexity || null;
        result.heavyAtomCount = props.HeavyAtomCount || null;
      }
    }
    
    // 2.5 获取计算属性（H键供体、H键受体、可旋转键数、形式电荷）
    // 这些属性需要从 JSON 格式的完整记录中提取
    try {
      const jsonRecordResponse = await fetchWithRetry(
        `${PUBCHEM_BASE_URL}/compound/cid/${cid}/JSON`
      );
      if (jsonRecordResponse && jsonRecordResponse.ok) {
        const jsonData = await jsonRecordResponse.json();
        const compound = jsonData?.PC_Compounds?.[0];
        const props = compound?.props || [];
        
        // 形式电荷在 compound 的顶层，不在 props 中
        if (compound?.charge !== undefined) {
          result.formalCharge = compound.charge;
        }
        
        for (const prop of props) {
          const urn = prop.urn || {};
          const label = urn.label || '';
          const name = urn.name || '';
          const value = prop.value;
          
          if (label === 'Count') {
            // 使用 ?? 而不是 ||，因为 0 是有效值（如 h_bond_donor_count 可能是 0）
            if (name === 'Hydrogen Bond Donor') {
              result.hBondDonorCount = value?.ival ?? null;
            } else if (name === 'Hydrogen Bond Acceptor') {
              result.hBondAcceptorCount = value?.ival ?? null;
            } else if (name === 'Rotatable Bond') {
              result.rotatableBondCount = value?.ival ?? null;
            }
          }
        }
      }
    } catch (jsonError) {
      console.error(`[PubChem] Error fetching JSON record:`, jsonError);
    }
    
    // 3. 获取同义词
    const synResponse = await fetchWithRetry(
      `${PUBCHEM_BASE_URL}/compound/cid/${cid}/synonyms/JSON`
    );
    
    if (synResponse && synResponse.ok) {
      const synData = await synResponse.json();
      result.synonyms = synData?.InformationList?.Information?.[0]?.Synonym?.slice(0, 20) || [];
    }
    
    // 4. 获取详细物理化学性质和安全性（使用更长超时）
    const viewResponse = await fetchWithRetry(
      `${PUBCHEM_VIEW_URL}/data/compound/${cid}/JSON`,
      MAX_RETRIES,
      VIEW_TIMEOUT
    );
    
    if (viewResponse && viewResponse.ok) {
      try {
        const viewData = await viewResponse.json();
        const extracted = extractPubChemProperties(viewData);
        
        // 合并提取的数据（只合并非 "-" 的值，保留用户手动输入的数据）
        const mergeIfHasData = (extractedValue: string | null | undefined, currentValue: string | null | undefined) => {
          // 如果提取的数据是 "-"（表示 PubChem 无数据），保留当前值
          if (extractedValue === '-') {
            // 但如果当前值也是空的，就标记为 "-" 表示已查询但无数据
            return currentValue || '-';
          }
          // 否则使用提取的数据
          return extractedValue || currentValue;
        };
        
        Object.assign(result, {
          description: extracted.description || result.description,
          physicalDescription: mergeIfHasData(extracted.physicalDescription, result.physicalDescription),
          colorForm: mergeIfHasData(extracted.colorForm, result.colorForm),
          odor: mergeIfHasData(extracted.odor, result.odor),
          boilingPoint: mergeIfHasData(extracted.boilingPoint, result.boilingPoint),
          meltingPoint: mergeIfHasData(extracted.meltingPoint, result.meltingPoint),
          flashPoint: mergeIfHasData(extracted.flashPoint, result.flashPoint),
          density: mergeIfHasData(extracted.density, result.density),
          solubility: mergeIfHasData(extracted.solubility, result.solubility),
          vaporPressure: mergeIfHasData(extracted.vaporPressure, result.vaporPressure),
          refractiveIndex: mergeIfHasData(extracted.refractiveIndex, result.refractiveIndex),
          hazardClasses: mergeIfHasData(extracted.hazardClasses, result.hazardClasses),
          healthHazards: mergeIfHasData(extracted.healthHazards, result.healthHazards),
          ghsClassification: mergeIfHasData(extracted.ghsClassification, result.ghsClassification),
          toxicitySummary: extracted.toxicitySummary || result.toxicitySummary,
          carcinogenicity: extracted.carcinogenicity || result.carcinogenicity,
          firstAid: mergeIfHasData(extracted.firstAid, result.firstAid),
          storageConditions: mergeIfHasData(extracted.storageConditions, result.storageConditions),
          incompatibleMaterials: mergeIfHasData(extracted.incompatibleMaterials, result.incompatibleMaterials),
          applications: extracted.applications,
          synonyms: extracted.synonyms || result.synonyms,
          // 计算属性（使用 ?? 因为 0 是有效值）
          xlogp: result.xlogp ?? extracted.xlogp,
          tpsa: result.tpsa ?? extracted.tpsa,
          complexity: result.complexity ?? extracted.complexity,
          hBondDonorCount: result.hBondDonorCount ?? extracted.hBondDonorCount,
          hBondAcceptorCount: result.hBondAcceptorCount ?? extracted.hBondAcceptorCount,
          rotatableBondCount: result.rotatableBondCount ?? extracted.rotatableBondCount,
          heavyAtomCount: result.heavyAtomCount ?? extracted.heavyAtomCount,
          formalCharge: result.formalCharge ?? extracted.formalCharge,
        });
      } catch (parseError) {
        console.error(`[PubChem] Failed to parse view data:`, parseError);
      }
    }
    
    // 5. 获取 2D 结构图并上传到对象存储
    try {
      const pngUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`;
      const pngResponse = await fetchWithRetry(pngUrl, MAX_RETRIES, FETCH_TIMEOUT);
      
      if (pngResponse && pngResponse.ok) {
        const pngBuffer = Buffer.from(await pngResponse.arrayBuffer());
        
        const storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: '',
          secretKey: '',
          bucketName: process.env.COZE_BUCKET_NAME,
          region: 'cn-beijing',
        });
        
        const fileName = `structure-images/${cid}_${Date.now()}.png`;
        result.structureImageKey = await storage.uploadFile({
          fileContent: pngBuffer,
          fileName,
          contentType: 'image/png',
        });
        console.log(`[PubChem] Uploaded structure image for CID ${cid}: ${result.structureImageKey}`);
      }
    } catch (uploadError) {
      console.error(`[PubChem] Failed to upload structure image for CID ${cid}:`, uploadError);
    }
    
    // 保留原始 URL 作为备份
    result.structureUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`;
    
    // 6. 获取 SVG 结构（可选，用于直接展示）
    try {
      const svgUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/record/SVG`;
      const svgResponse = await fetchWithRetry(svgUrl, 2, FETCH_TIMEOUT);
      
      if (svgResponse && svgResponse.ok) {
        result.structure2dSvg = await svgResponse.text();
      }
    } catch (svgError) {
      console.error(`[PubChem] Failed to fetch SVG for CID ${cid}:`, svgError);
    }
    
    // 7. 获取 SDF 结构数据（用于重绘美化的 SVG）
    try {
      const sdfUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SDF?record_type=2d`;
      const sdfResponse = await fetchWithRetry(sdfUrl, 2, FETCH_TIMEOUT);
      
      if (sdfResponse && sdfResponse.ok) {
        result.structureSdf = await sdfResponse.text();
        console.log(`[PubChem] Fetched SDF for CID ${cid}, length: ${result.structureSdf?.length}`);
      }
    } catch (sdfError) {
      console.error(`[PubChem] Failed to fetch SDF for CID ${cid}:`, sdfError);
    }
    
    return result;
  } catch (error) {
    console.error(`Error fetching PubChem data for ${cas}:`, error);
    return null;
  }
}

/**
 * POST /api/admin/spu/create/sync-pubchem
 * 批量同步 SPU 的 PubChem 数据
 * 
 * 参数：
 * - preview: boolean - 如果为 true，只获取数据不写入数据库（用于前端预览）
 * - cas: string - preview 模式下必填，单个 CAS 号
 * - forceUpdate: boolean - 强制更新已有数据的 SPU
 * - limit: number - 批量模式下限制数量
 * - casList: string[] - 批量模式下指定 CAS 列表
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    const { 
      preview = false,
      cas,
      forceUpdate = false,
      limit = 10,
      casList = null,
      createIfNotExist = false,
    } = body;
    
    // ========== 预览模式：只获取数据，不写入数据库 ==========
    if (preview && cas) {
      const trimmedCas = cas.trim();
      console.log(`[Sync-PubChem] Preview mode for CAS: ${trimmedCas}`);
      
      // 检查缓存
      const cachedData = getCachedPreview(trimmedCas);
      if (cachedData) {
        return NextResponse.json({
          success: true,
          source: 'cache',
          data: cachedData,
        });
      }
      
      const pubchemData = await fetchPubChemData(trimmedCas);
      
      if (!pubchemData) {
        return NextResponse.json({
          success: false,
          error: 'PUBCHEM_NOT_FOUND',
          message: 'This CAS number does not exist in PubChem',
        });
      }
      
      // 提取中文名称（从同义词中识别）
      const nameZh = pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null;
      
      // 构建返回数据
      const responseData = {
        pubchemCid: pubchemData.cid,
        pubchemSyncedAt: new Date().toISOString(),
        // 基本信息
        nameZh,
        nameEn: pubchemData.synonyms?.[0] || null, // 英文名称取第一个同义词
        formula: pubchemData.formula,
        molecularWeight: pubchemData.molecularWeight,
        exactMass: pubchemData.exactMass,
        smiles: pubchemData.smiles,
        smilesCanonical: pubchemData.smilesCanonical,
        smilesIsomeric: pubchemData.smilesIsomeric,
        inchi: pubchemData.inchi,
        inchiKey: pubchemData.inchiKey,
        // 计算属性
        xlogp: pubchemData.xlogp,
        tpsa: pubchemData.tpsa,
        complexity: pubchemData.complexity,
        hBondDonorCount: pubchemData.hBondDonorCount,
        hBondAcceptorCount: pubchemData.hBondAcceptorCount,
        rotatableBondCount: pubchemData.rotatableBondCount,
        heavyAtomCount: pubchemData.heavyAtomCount,
        formalCharge: pubchemData.formalCharge,
        // 物理化学性质
        description: pubchemData.description,
        physicalDescription: pubchemData.physicalDescription,
        colorForm: pubchemData.colorForm,
        odor: pubchemData.odor,
        boilingPoint: pubchemData.boilingPoint,
        meltingPoint: pubchemData.meltingPoint,
        flashPoint: pubchemData.flashPoint,
        density: pubchemData.density,
        solubility: pubchemData.solubility,
        vaporPressure: pubchemData.vaporPressure,
        refractiveIndex: pubchemData.refractiveIndex,
        // 安全信息
        hazardClasses: pubchemData.hazardClasses,
        healthHazards: pubchemData.healthHazards,
        ghsClassification: pubchemData.ghsClassification,
        toxicitySummary: pubchemData.toxicitySummary,
        carcinogenicity: pubchemData.carcinogenicity,
        firstAid: pubchemData.firstAid,
        storageConditions: pubchemData.storageConditions,
        incompatibleMaterials: pubchemData.incompatibleMaterials,
        // 同义词和应用
        synonyms: pubchemData.synonyms,
        applications: pubchemData.applications,
        // 结构图
        structureUrl: pubchemData.structureUrl,
        structureImageKey: pubchemData.structureImageKey,
        structureSdf: pubchemData.structureSdf,
        structure2dSvg: pubchemData.structure2dSvg,
      };
      
      // 缓存结果
      setCachedPreview(trimmedCas, responseData);
      
      return NextResponse.json({
        success: true,
        source: 'pubchem',
        data: responseData,
      });
    }
    
    // ========== 单个CAS同步模式：更新现有产品或创建新产品 ==========
    if (cas && !preview && !casList) {
      const trimmedCas = cas.trim();
      console.log(`[Sync-PubChem] Single CAS sync mode for: ${trimmedCas}`);
      
      const db = await getDb(schema);
      
      // 从PubChem获取数据（先获取，因为创建时需要）
      const pubchemData = await fetchPubChemData(trimmedCas);
      
      if (!pubchemData) {
        return NextResponse.json({
          success: false,
          error: 'PUBCHEM_NOT_FOUND',
          message: 'This CAS number does not exist in PubChem',
        });
      }
      
      // 查询产品是否存在
      const existingProduct = await db.execute(sql`
        SELECT id, cas, name, status FROM products WHERE cas = ${trimmedCas}
      `);
      
      if (existingProduct.rows.length === 0) {
        // 产品不存在，创建新产品（状态DRAFT）
        if (createIfNotExist) {
          console.log(`[Sync-PubChem] Creating new product for CAS: ${trimmedCas}`);
          
          // 提取中文名称
          const nameZh = pubchemData.synonyms ? extractChineseName(pubchemData.synonyms) : null;
          
          // 创建新产品
          const insertResult = await db.execute(sql`
            INSERT INTO products (
              cas, name, name_en, formula, description,
              pubchem_cid, pubchem_data_source, status,
              molecular_weight, exact_mass, smiles, smiles_canonical, smiles_isomeric,
              inchi, inchi_key, xlogp, tpsa, complexity,
              h_bond_donor_count, h_bond_acceptor_count, rotatable_bond_count,
              heavy_atom_count, formal_charge,
              physical_description, color_form, odor,
              boiling_point, melting_point, flash_point, density, solubility,
              vapor_pressure, refractive_index,
              hazard_classes, health_hazards, ghs_classification,
              toxicity_summary, carcinogenicity, first_aid,
              storage_conditions, incompatible_materials,
              structure_url, structure_image_key, structure_sdf, structure_2d_svg,
              synonyms, applications,
              pubchem_synced_at, created_at, updated_at
            ) VALUES (
              ${trimmedCas},
              ${nameZh || pubchemData.synonyms?.[0] || trimmedCas},
              ${pubchemData.synonyms?.[0] || null},
              ${safeString(pubchemData.formula)},
              ${safeString(pubchemData.description)},
              ${pubchemData.cid || null},
              'pubchem',
              'DRAFT',
              ${safeString(pubchemData.molecularWeight)},
              ${safeString(pubchemData.exactMass)},
              ${safeString(pubchemData.smiles)},
              ${safeString(pubchemData.smilesCanonical)},
              ${safeString(pubchemData.smilesIsomeric)},
              ${safeString(pubchemData.inchi)},
              ${safeString(pubchemData.inchiKey)},
              ${safeString(pubchemData.xlogp)},
              ${safeString(pubchemData.tpsa)},
              ${safeNumber(pubchemData.complexity)},
              ${safeNumber(pubchemData.hBondDonorCount)},
              ${safeNumber(pubchemData.hBondAcceptorCount)},
              ${safeNumber(pubchemData.rotatableBondCount)},
              ${safeNumber(pubchemData.heavyAtomCount)},
              ${safeNumber(pubchemData.formalCharge)},
              ${safeString(pubchemData.physicalDescription)},
              ${safeString(pubchemData.colorForm)},
              ${safeString(pubchemData.odor)},
              ${safeString(pubchemData.boilingPoint)},
              ${safeString(pubchemData.meltingPoint)},
              ${safeString(pubchemData.flashPoint)},
              ${safeString(pubchemData.density)},
              ${safeString(pubchemData.solubility)},
              ${safeString(pubchemData.vaporPressure)},
              ${safeString(pubchemData.refractiveIndex)},
              ${safeString(pubchemData.hazardClasses)},
              ${safeString(pubchemData.healthHazards)},
              ${safeString(pubchemData.ghsClassification)},
              ${safeString(pubchemData.toxicitySummary)},
              ${safeString(pubchemData.carcinogenicity)},
              ${safeString(pubchemData.firstAid)},
              ${safeString(pubchemData.storageConditions)},
              ${safeString(pubchemData.incompatibleMaterials)},
              ${safeString(pubchemData.structureUrl)},
              ${safeString(pubchemData.structureImageKey)},
              ${safeString(pubchemData.structureSdf)},
              ${safeString(pubchemData.structure2dSvg)},
              ${pubchemData.synonyms && pubchemData.synonyms.length > 0 ? JSON.stringify(pubchemData.synonyms) : null},
              ${pubchemData.applications && pubchemData.applications.length > 0 ? JSON.stringify(pubchemData.applications) : null},
              NOW(),
              NOW(),
              NOW()
            )
            RETURNING *
          `);
          
          return NextResponse.json({
            success: true,
            message: 'Product created successfully',
            product: insertResult.rows[0],
            isNew: true,
          });
        } else {
          return NextResponse.json({
            success: false,
            error: 'PRODUCT_NOT_FOUND',
            message: 'Product not found in database',
          });
        }
      }
      
      const product = existingProduct.rows[0] as any;
      
      // 更新产品数据
      await db.update(schema.products)
        .set({
          pubchemCid: pubchemData.cid || null,
          pubchemDataSource: 'pubchem',
          description: safeString(pubchemData.description),
          formula: safeString(pubchemData.formula),
          molecularWeight: safeString(pubchemData.molecularWeight),
          exactMass: safeString(pubchemData.exactMass),
          smiles: safeString(pubchemData.smiles),
          smilesCanonical: safeString(pubchemData.smilesCanonical),
          smilesIsomeric: safeString(pubchemData.smilesIsomeric),
          inchi: safeString(pubchemData.inchi),
          inchiKey: safeString(pubchemData.inchiKey),
          xlogp: safeString(pubchemData.xlogp),
          tpsa: safeString(pubchemData.tpsa),
          complexity: safeNumber(pubchemData.complexity),
          hBondDonorCount: safeNumber(pubchemData.hBondDonorCount),
          hBondAcceptorCount: safeNumber(pubchemData.hBondAcceptorCount),
          rotatableBondCount: safeNumber(pubchemData.rotatableBondCount),
          heavyAtomCount: safeNumber(pubchemData.heavyAtomCount),
          formalCharge: safeNumber(pubchemData.formalCharge),
          physicalDescription: safeString(pubchemData.physicalDescription),
          colorForm: safeString(pubchemData.colorForm),
          odor: safeString(pubchemData.odor),
          boilingPoint: safeString(pubchemData.boilingPoint),
          meltingPoint: safeString(pubchemData.meltingPoint),
          flashPoint: safeString(pubchemData.flashPoint),
          density: safeString(pubchemData.density),
          solubility: safeString(pubchemData.solubility),
          vaporPressure: safeString(pubchemData.vaporPressure),
          refractiveIndex: safeString(pubchemData.refractiveIndex),
          hazardClasses: safeString(pubchemData.hazardClasses),
          healthHazards: safeString(pubchemData.healthHazards),
          ghsClassification: safeString(pubchemData.ghsClassification),
          toxicitySummary: safeString(pubchemData.toxicitySummary),
          carcinogenicity: safeString(pubchemData.carcinogenicity),
          firstAid: safeString(pubchemData.firstAid),
          storageConditions: safeString(pubchemData.storageConditions),
          incompatibleMaterials: safeString(pubchemData.incompatibleMaterials),
          structureUrl: safeString(pubchemData.structureUrl),
          structureImageKey: safeString(pubchemData.structureImageKey),
          structureSdf: safeString(pubchemData.structureSdf),
          structure2dSvg: safeString(pubchemData.structure2dSvg),
          synonyms: pubchemData.synonyms && pubchemData.synonyms.length > 0 ? pubchemData.synonyms : null,
          applications: pubchemData.applications && pubchemData.applications.length > 0 ? pubchemData.applications : null,
          pubchemSyncedAt: sql`NOW()`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(schema.products.id, product.id));
      
      // 返回更新后的产品信息
      const updatedProduct = await db.execute(sql`
        SELECT * FROM products WHERE id = ${product.id}
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Product synced successfully',
        product: updatedProduct.rows[0],
      });
    }
    
    // ========== 批量同步模式：写入数据库 ==========
    const db = await getDb(schema);
    
    // 查询需要更新的 SPU
    let queryText: string;
    if (casList && Array.isArray(casList) && casList.length > 0) {
      const casValues = casList.map((cas: string) => `'${cas.replace(/'/g, "''")}'`).join(',');
      queryText = `SELECT id, cas, name FROM products WHERE cas IN (${casValues})`;
    } else if (forceUpdate) {
      queryText = `SELECT id, cas, name FROM products ORDER BY created_at DESC LIMIT ${limit}`;
    } else {
      queryText = `SELECT id, cas, name FROM products WHERE pubchem_cid IS NULL ORDER BY created_at DESC LIMIT ${limit}`;
    }
    
    const spuResult = await db.execute(sql.raw(queryText));
    const spuList = spuResult.rows;
    
    if (spuList.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No SPU need to be updated',
        updated: 0,
        failed: 0,
      });
    }
    
    const results = {
      updated: [] as any[],
      failed: [] as any[],
    };
    
    for (const spu of spuList) {
      const { id, cas, name } = spu as any;
      
      console.log(`[Sync] Processing SPU CAS: ${cas}`);
      
      try {
        const pubchemData = await fetchPubChemData(cas);
        
        if (!pubchemData) {
          results.failed.push({ cas, name, reason: 'PubChem data not found' });
          continue;
        }
        
        // 使用 drizzle ORM update 方法（直接覆盖，不用 COALESCE）
        await db.update(schema.products)
          .set({
            pubchemCid: pubchemData.cid || null,
            pubchemDataSource: 'pubchem',
            description: safeString(pubchemData.description),
            formula: safeString(pubchemData.formula),
            molecularWeight: safeString(pubchemData.molecularWeight),
            exactMass: safeString(pubchemData.exactMass),
            smiles: safeString(pubchemData.smiles),
            smilesCanonical: safeString(pubchemData.smilesCanonical),
            smilesIsomeric: safeString(pubchemData.smilesIsomeric),
            inchi: safeString(pubchemData.inchi),
            inchiKey: safeString(pubchemData.inchiKey),
            xlogp: safeString(pubchemData.xlogp),
            tpsa: safeString(pubchemData.tpsa),
            complexity: safeNumber(pubchemData.complexity),
            hBondDonorCount: safeNumber(pubchemData.hBondDonorCount),
            hBondAcceptorCount: safeNumber(pubchemData.hBondAcceptorCount),
            rotatableBondCount: safeNumber(pubchemData.rotatableBondCount),
            heavyAtomCount: safeNumber(pubchemData.heavyAtomCount),
            formalCharge: safeNumber(pubchemData.formalCharge),
            physicalDescription: safeString(pubchemData.physicalDescription),
            colorForm: safeString(pubchemData.colorForm),
            odor: safeString(pubchemData.odor),
            boilingPoint: safeString(pubchemData.boilingPoint),
            meltingPoint: safeString(pubchemData.meltingPoint),
            flashPoint: safeString(pubchemData.flashPoint),
            density: safeString(pubchemData.density),
            solubility: safeString(pubchemData.solubility),
            vaporPressure: safeString(pubchemData.vaporPressure),
            refractiveIndex: safeString(pubchemData.refractiveIndex),
            hazardClasses: safeString(pubchemData.hazardClasses),
            healthHazards: safeString(pubchemData.healthHazards),
            ghsClassification: safeString(pubchemData.ghsClassification),
            toxicitySummary: safeString(pubchemData.toxicitySummary),
            carcinogenicity: safeString(pubchemData.carcinogenicity),
            firstAid: safeString(pubchemData.firstAid),
            storageConditions: safeString(pubchemData.storageConditions),
            incompatibleMaterials: safeString(pubchemData.incompatibleMaterials),
            structureUrl: safeString(pubchemData.structureUrl),
            structureImageKey: safeString(pubchemData.structureImageKey),
            structureSdf: safeString(pubchemData.structureSdf),
            structure2dSvg: safeString(pubchemData.structure2dSvg),
            synonyms: pubchemData.synonyms && pubchemData.synonyms.length > 0 ? pubchemData.synonyms : null,
            applications: pubchemData.applications && pubchemData.applications.length > 0 ? pubchemData.applications : null,
            // 同步时清空这些字段的翻译（因为数据已更新，旧翻译不再适用）
            translations: sql`(
              SELECT jsonb_object_agg(key, value)
              FROM jsonb_each(COALESCE(translations, '{}'::jsonb))
              WHERE key NOT IN (
                'description', 'applications', 'boilingPoint', 'meltingPoint', 'flashPoint', 'hazardClasses', 
                'healthHazards', 'ghsClassification', 'firstAid', 'storageConditions', 
                'incompatibleMaterials', 'solubility', 'vaporPressure', 'refractiveIndex',
                'physicalDescription'
              )
            )::jsonb`,
            pubchemSyncedAt: sql`NOW()`,
            updatedAt: sql`NOW()`,
          })
          .where(eq(schema.products.id, id as string));
        
        // 不再自动翻译，让前端处理翻译流程
        // 用户点击"翻译并保存"时会重新翻译这些字段
        
        results.updated.push({ cas, name, cid: pubchemData.cid });
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error: any) {
        console.error(`[Sync] Error updating ${cas}:`, error?.message);
        console.error(`[Sync] Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error)));
        results.failed.push({ cas, name, reason: error?.message || 'Unknown error' });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Synced ${results.updated.length} SPU, ${results.failed.length} failed`,
      updated: results.updated.length,
      failed: results.failed.length,
      details: results,
    });
    
  } catch (error: any) {
    console.error('Error syncing PubChem data:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to sync PubChem data' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/spu/create/sync-pubchem
 * 获取 SPU 同步状态统计
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) as total_spu,
        COUNT(pubchem_cid) as with_pubchem,
        COUNT(*) - COUNT(pubchem_cid) as need_sync,
        COUNT(physical_description) as with_physical_desc,
        COUNT(hazard_classes) as with_hazard,
        COUNT(ghs_classification) as with_ghs,
        COUNT(first_aid) as with_first_aid
      FROM products
    `);
    
    const stats = statsResult.rows[0] as any;
    
    return NextResponse.json({
      success: true,
      data: {
        totalSpu: parseInt(stats.total_spu || '0'),
        withPubchem: parseInt(stats.with_pubchem || '0'),
        needSync: parseInt(stats.need_sync || '0'),
        withPhysicalDesc: parseInt(stats.with_physical_desc || '0'),
        withHazard: parseInt(stats.with_hazard || '0'),
        withGhs: parseInt(stats.with_ghs || '0'),
        withFirstAid: parseInt(stats.with_first_aid || '0'),
      },
    });
    
  } catch (error: any) {
    console.error('Error getting sync stats:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to get sync stats' },
      { status: 500 }
    );
  }
}

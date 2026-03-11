import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// PubChem API 基础URL
const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const PUBCHEM_VIEW_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';

// 内存缓存（缓存5分钟）
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Cache] Hit for ${key}`);
    return cached.data;
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
  console.log(`[Cache] Set for ${key}`);
}

// 中文名称识别正则（包含中文Unicode范围）
const CHINESE_REGEX = /[\u4e00-\u9fff]+/;

/**
 * 从同义词列表中提取中文名称
 */
function extractChineseName(synonyms: string[]): string | null {
  for (const synonym of synonyms) {
    if (CHINESE_REGEX.test(synonym)) {
      // 优先选择较短的中文别名（通常是常用名）
      const chineseParts = synonym.match(/[\u4e00-\u9fff]+/g);
      if (chineseParts && chineseParts.length > 0) {
        // 返回第一个纯中文名称
        const chineseName = chineseParts.find(part => part.length >= 2 && part.length <= 10);
        if (chineseName) return chineseName;
      }
    }
  }
  return null;
}

/**
 * 从同义词列表中提取英文名称
 */
function extractEnglishName(synonyms: string[]): string | null {
  // 优先选择 IUPAC 名称或常用英文名
  for (const synonym of synonyms) {
    if (/^[A-Za-z0-9\s\-(),]+$/.test(synonym) && synonym.length > 2) {
      // 跳过纯数字或太长的名称
      if (!/^\d+$/.test(synonym) && synonym.length < 100) {
        return synonym;
      }
    }
  }
  return null;
}

/**
 * 从Pug View数据中提取物理化学性质、简介和行业应用
 */
function extractPhysicochemicalProperties(data: any) {
  const properties: Record<string, any> = {};
  const applications: string[] = [];
  
  try {
    const sections = data?.Record?.Section || [];
    
    // 查找物理化学性质部分
    for (const section of sections) {
      const heading = section.TOCHeading || '';
      
      // 产品简介/描述
      if (heading === 'Description') {
        const info = section.Information?.[0];
        if (info?.Value?.StringWithMarkup?.[0]?.String) {
          properties.description = info.Value.StringWithMarkup[0].String;
        }
      }
      
      // 行业应用
      if (heading === 'Use and Manufacturing') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          // 工业用途
          if (subHeading === 'Industrial/Commercial Uses' || subHeading === 'Industrial use') {
            for (const info of sub.Information || []) {
              if (info.Value?.StringWithMarkup?.[0]?.String) {
                const use = info.Value.StringWithMarkup[0].String;
                if (use && !applications.includes(use)) {
                  applications.push(use);
                }
              }
            }
          }
          
          // 消费者用途
          if (subHeading === 'Consumer Uses' || subHeading === 'Consumer use') {
            for (const info of sub.Information || []) {
              if (info.Value?.StringWithMarkup?.[0]?.String) {
                const use = info.Value.StringWithMarkup[0].String;
                if (use && !applications.includes(use)) {
                  applications.push(use);
                }
              }
            }
          }
          
          // 一般制造信息（可能包含应用场景）
          if (subHeading === 'General Manufacturing Information') {
            for (const info of sub.Information || []) {
              if (info.Value?.StringWithMarkup?.[0]?.String) {
                const infoText = info.Value.StringWithMarkup[0].String;
                // 提取应用相关的关键词
                if (infoText && (infoText.includes('used') || infoText.includes('use'))) {
                  if (!applications.includes(infoText) && applications.length < 10) {
                    applications.push(infoText);
                  }
                }
              }
            }
          }
        }
      }
      
      // 化学和物理性质
      if (heading === 'Chemical and Physical Properties') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          // 实验性质
          if (subHeading === 'Experimental Properties') {
            for (const prop of sub.Section || []) {
              const propName = prop.TOCHeading || '';
              const info = prop.Information?.[0];
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const value = info.Value.StringWithMarkup[0].String;
                // 映射属性名称
                if (propName.includes('Boiling Point')) properties.boilingPoint = value;
                else if (propName.includes('Melting Point')) properties.meltingPoint = value;
                else if (propName.includes('Flash Point')) properties.flashPoint = value;
                else if (propName.includes('Solubility')) properties.solubility = value;
                else if (propName.includes('Density')) properties.density = value;
                else if (propName.includes('Vapor Pressure')) properties.vaporPressure = value;
                else if (propName.includes('Physical Description')) properties.physicalDescription = value;
                else if (propName.includes('Color/Form')) properties.colorForm = value;
                else if (propName.includes('Odor')) properties.odor = value;
              }
            }
          }
          
          // 计算属性
          if (subHeading === 'Computed Properties') {
            for (const prop of sub.Section || []) {
              const propName = prop.TOCHeading || '';
              const info = prop.Information?.[0];
              if (info?.Value) {
                const value = info.Value.String || info.Value.Number?.toString();
                if (value) {
                  if (propName.includes('XLogP3')) properties.xlogp = value;
                  else if (propName.includes('Hydrogen Bond Donor')) properties.hBondDonorCount = value;
                  else if (propName.includes('Hydrogen Bond Acceptor')) properties.hBondAcceptorCount = value;
                  else if (propName.includes('Rotatable Bond')) properties.rotatableBondCount = value;
                  else if (propName.includes('Topological Polar Surface Area')) properties.tpsa = value;
                  else if (propName.includes('Heavy Atom')) properties.heavyAtomCount = value;
                  else if (propName.includes('Complexity')) properties.complexity = value;
                }
              }
            }
          }
        }
      }
      
      // 安全与危险信息
      if (heading === 'Safety and Hazards') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          if (subHeading === 'Hazards Identification') {
            for (const haz of sub.Section || []) {
              const hazName = haz.TOCHeading || '';
              const info = haz.Information?.[0];
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const value = info.Value.StringWithMarkup[0].String;
                if (hazName.includes('Health Hazards')) properties.healthHazards = value;
                else if (hazName.includes('Hazard Classes')) properties.hazardClasses = value;
                else if (hazName.includes('GHS Classification')) properties.ghsClassification = value;
              }
            }
          }
        }
      }
      
      // 毒性信息
      if (heading === 'Toxicity') {
        for (const sub of section.Section || []) {
          if (sub.TOCHeading === 'Toxicological Information') {
            for (const tox of sub.Section || []) {
              const toxName = tox.TOCHeading || '';
              const info = tox.Information?.[0];
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                const value = info.Value.StringWithMarkup[0].String;
                if (toxName.includes('Toxicity Summary')) properties.toxicitySummary = value;
                else if (toxName.includes('Carcinogenicity')) properties.carcinogenicity = value;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error extracting properties:', error);
  }
  
  // 将应用信息添加到属性中
  if (applications.length > 0) {
    properties.applications = applications;
  }
  
  return properties;
}

/**
 * 使用 curl 作为备选的 fetch 方法（解决 Node.js 网络限制）
 */
async function fetchWithCurl(url: string, timeout: number = 10000, maxBufferMB: number = 50): Promise<any> {
  try {
    console.log(`[PubChem] Using curl fallback: ${url}`);
    const timeoutSeconds = Math.floor(timeout / 1000);
    
    // 对于大数据，使用临时文件存储
    const useTempFile = maxBufferMB > 10;
    
    if (useTempFile) {
      // 使用临时文件存储大响应
      const tempFile = `/tmp/pubchem_${Date.now()}.json`;
      const command = `curl -s --connect-timeout 15 --max-time ${timeoutSeconds} '${url}' -o ${tempFile}`;
      
      await execAsync(command, { timeout: timeout + 15000 });
      
      // 使用 fs 读取文件
      const fs = require('fs');
      if (fs.existsSync(tempFile)) {
        const content = fs.readFileSync(tempFile, 'utf-8');
        fs.unlinkSync(tempFile); // 清理临时文件
        
        if (content && content.trim()) {
          try {
            const result = JSON.parse(content);
            console.log(`[PubChem] Curl success (via file), got ${content.length} bytes`);
            return result;
          } catch (parseError) {
            console.error(`[PubChem] JSON parse error:`, content.substring(0, 200));
            return null;
          }
        }
      }
      return null;
    }
    
    // 小数据直接使用 stdout
    const { stdout, stderr } = await execAsync(
      `curl -s --connect-timeout 10 --max-time ${timeoutSeconds} '${url}'`,
      {
        timeout: timeout + 10000,
        maxBuffer: 1024 * 1024 * maxBufferMB,
      }
    );
    
    if (stdout && stdout.trim()) {
      try {
        const result = JSON.parse(stdout);
        console.log(`[PubChem] Curl success, got ${stdout.length} bytes`);
        return result;
      } catch (parseError) {
        console.error(`[PubChem] JSON parse error:`, stdout.substring(0, 200));
        return null;
      }
    }
    
    if (stderr) {
      console.error(`[PubChem] Curl stderr:`, stderr);
    }
    return null;
  } catch (error: any) {
    console.error(`[PubChem] Curl error:`, error?.message || error);
    return null;
  }
}

/**
 * 带超时的 fetch 请求
 */
async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    console.log(`[PubChem] Fetching: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 
        'Accept': 'application/json',
        'User-Agent': 'Chemicaloop/1.0',
      },
      signal: controller.signal,
      cache: 'no-store',
      next: { revalidate: 0 },
    });
    
    clearTimeout(timeoutId);
    console.log(`[PubChem] Response: ${response.status} for ${url}`);
    return response;
  } catch (error: any) {
    console.error(`[PubChem] Error fetching ${url}:`, error?.message || error);
    return null;
  }
}

/**
 * 调用 PubChem API 获取化合物信息
 */
async function fetchFromPubChem(cas: string) {
  try {
    // 1. 通过CAS号获取CID（先用 fetch，失败后用 curl 备选）
    let cidData: any = null;
    
    const cidResponse = await fetchWithTimeout(
      `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(cas)}/cids/JSON`,
      10000
    );

    if (cidResponse && cidResponse.ok) {
      cidData = await cidResponse.json();
    } else {
      // 使用 curl 备选
      console.log('[PubChem] Fetch failed, trying curl fallback...');
      cidData = await fetchWithCurl(
        `${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(cas)}/cids/JSON`,
        10000
      );
    }

    const cid = cidData?.IdentifierList?.CID?.[0];

    if (!cid) {
      console.error('[PubChem] No CID found');
      return null;
    }

    console.log(`[PubChem] Found CID: ${cid}`);

    // 2. 获取化合物属性（分子式、分子量、IUPAC名称、SMILES等）
    let propertyData: any = null;
    const propertyResponse = await fetchWithTimeout(
      `${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,Title,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,XLogP,ExactMass/JSON`,
      15000
    );
    
    if (propertyResponse && propertyResponse.ok) {
      propertyData = await propertyResponse.json();
    } else {
      propertyData = await fetchWithCurl(
        `${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,Title,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,XLogP,ExactMass/JSON`,
        15000
      );
    }

    // 3. 获取同义词（包含中文名称）
    let synonymsData: any = null;
    const synonymsResponse = await fetchWithTimeout(
      `${PUBCHEM_BASE_URL}/compound/cid/${cid}/synonyms/JSON`,
      15000
    );
    
    if (synonymsResponse && synonymsResponse.ok) {
      synonymsData = await synonymsResponse.json();
    } else {
      synonymsData = await fetchWithCurl(
        `${PUBCHEM_BASE_URL}/compound/cid/${cid}/synonyms/JSON`,
        15000
      );
    }

    // 4. 获取详细物理化学性质（View API 较慢，使用异步方式）
    let detailedProperties: Record<string, any> = {};
    
    try {
      // 尝试使用较快的方式获取部分属性
      // PubChem View API 太慢，尝试使用简化请求
      const viewUrl = `${PUBCHEM_VIEW_URL}/data/compound/${cid}/JSON?heading=Chemical+and+Physical+Properties`;
      
      const viewData = await fetchWithCurl(
        viewUrl,
        45000,  // 45秒超时
        50      // 50MB buffer
      );
      
      if (viewData) {
        detailedProperties = extractPhysicochemicalProperties(viewData);
        console.log('[PubChem] Extracted detailed properties:', Object.keys(detailedProperties));
      }
    } catch (e) {
      console.warn('[PubChem] Failed to get detailed properties:', e);
    }
    
    // 5. 获取产品描述和行业应用
    let description = '';
    let applications: string[] = [];
    
    try {
      // 获取描述信息 (Record Description 在 Names and Identifiers 下面)
      const descUrl = `${PUBCHEM_VIEW_URL}/data/compound/${cid}/JSON?heading=Record+Description`;
      const descData = await fetchWithCurl(descUrl, 20000, 10);
      
      if (descData?.Record?.Section) {
        // 遍历顶级 Section 查找 Names and Identifiers
        for (const section of descData.Record.Section) {
          if (section.TOCHeading === 'Names and Identifiers' && section.Section) {
            // 在子 Section 中查找 Record Description
            for (const subSection of section.Section) {
              if (subSection.TOCHeading === 'Record Description' && subSection.Information?.[0]?.Value?.StringWithMarkup?.[0]?.String) {
                description = subSection.Information[0].Value.StringWithMarkup[0].String;
                console.log('[PubChem] Got description:', description.substring(0, 100));
                break;
              }
            }
          }
          if (description) break;
        }
      }
    } catch (e) {
      console.warn('[PubChem] Failed to get description:', e);
    }
    
    try {
      // 获取行业应用信息 (Use and Manufacturing)
      const useUrl = `${PUBCHEM_VIEW_URL}/data/compound/${cid}/JSON?heading=Use+and+Manufacturing`;
      const useData = await fetchWithCurl(useUrl, 30000, 50);
      
      if (useData?.Record?.Section) {
        for (const section of useData.Record.Section) {
          if (section.TOCHeading === 'Use and Manufacturing') {
            // 提取用途
            for (const sub of section.Section || []) {
              const subHeading = sub.TOCHeading || '';
              // 匹配多种可能的 heading 名称
              if (subHeading.includes('Industry Use') || subHeading.includes('Consumer Use') || 
                  subHeading.includes('Industrial') || subHeading === 'Uses') {
                for (const info of sub.Information || []) {
                  if (info.Value?.StringWithMarkup?.[0]?.String) {
                    const use = info.Value.StringWithMarkup[0].String;
                    if (use && !applications.includes(use) && applications.length < 10) {
                      applications.push(use);
                    }
                  }
                }
              }
            }
          }
        }
      }
      if (applications.length > 0) {
        console.log('[PubChem] Got applications:', applications.length);
      }
    } catch (e) {
      console.warn('[PubChem] Failed to get applications:', e);
    }

    // 提取属性
    const properties = propertyData?.PropertyTable?.Properties?.[0] || {};
    const synonyms = synonymsData?.InformationList?.Information?.[0]?.Synonym || [];

    // 提取名称
    const nameEn = properties.IUPACName || properties.Title || extractEnglishName(synonyms) || '';
    const nameZh = extractChineseName(synonyms) || '';

    return {
      cid,
      cas,
      nameEn,
      nameZh,
      formula: properties.MolecularFormula || '',
      molecularWeight: properties.MolecularWeight || '',
      // 结构信息 - 处理不同的SMILES字段名
      smiles: properties.CanonicalSMILES || properties.SMILES || properties.ConnectivitySMILES || '',
      isomericSmiles: properties.IsomericSMILES || properties.SMILES || '',
      inchi: properties.InChI || '',
      inchiKey: properties.InChIKey || '',
      xlogp: properties.XLogP || '',
      // 2D结构图URL
      structure2dUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG`,
      structure2dSvgUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/SVG`,
      // 3D结构图URL（如果需要）
      structure3dUrl: `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?record_type=3d`,
      // 同义词
      synonyms: synonyms.slice(0, 20), // 返回前20个别名
      // 产品描述与应用
      description,
      applications,
      // 详细物理化学性质
      ...detailedProperties,
    };
  } catch (error) {
    console.error('PubChem API error:', error);
    return null;
  }
}

// 本地缓存数据库（常用化学品）
const localDatabase = [
  {
    cas: '64-17-5',
    nameZh: '乙醇',
    nameEn: 'Ethanol',
    formula: 'C2H6O',
    molecularWeight: '46.07',
    smiles: 'CCO',
    synonyms: ['Ethanol', 'Ethyl alcohol', 'Alcohol', 'Grain alcohol'],
  },
  {
    cas: '50-00-0',
    nameZh: '甲醛',
    nameEn: 'Formaldehyde',
    formula: 'CH2O',
    molecularWeight: '30.03',
    smiles: 'C=O',
    synonyms: ['Formaldehyde', 'Methanal', 'Formalin'],
  },
  {
    cas: '7732-18-5',
    nameZh: '水',
    nameEn: 'Water',
    formula: 'H2O',
    molecularWeight: '18.02',
    smiles: 'O',
    synonyms: ['Water', 'Dihydrogen oxide'],
  },
  {
    cas: '64-19-7',
    nameZh: '乙酸',
    nameEn: 'Acetic Acid',
    formula: 'C2H4O2',
    molecularWeight: '60.05',
    smiles: 'CC(=O)O',
    synonyms: ['Acetic acid', 'Ethanoic acid', 'Vinegar acid'],
  },
  {
    cas: '7664-93-9',
    nameZh: '硫酸',
    nameEn: 'Sulfuric Acid',
    formula: 'H2SO4',
    molecularWeight: '98.08',
    smiles: 'OS(=O)(=O)O',
    synonyms: ['Sulfuric acid', 'Oil of vitriol'],
  },
  {
    cas: '67-56-1',
    nameZh: '甲醇',
    nameEn: 'Methanol',
    formula: 'CH4O',
    molecularWeight: '32.04',
    smiles: 'CO',
    synonyms: ['Methanol', 'Methyl alcohol', 'Wood alcohol'],
  },
  {
    cas: '67-63-0',
    nameZh: '异丙醇',
    nameEn: 'Isopropyl Alcohol',
    formula: 'C3H8O',
    molecularWeight: '60.10',
    smiles: 'CC(C)O',
    synonyms: ['Isopropanol', '2-Propanol', 'Isopropyl alcohol'],
  },
  {
    cas: '108-88-3',
    nameZh: '甲苯',
    nameEn: 'Toluene',
    formula: 'C7H8',
    molecularWeight: '92.14',
    smiles: 'Cc1ccccc1',
    synonyms: ['Toluene', 'Methylbenzene', 'Phenylmethane'],
  },
  {
    cas: '71-43-2',
    nameZh: '苯',
    nameEn: 'Benzene',
    formula: 'C6H6',
    molecularWeight: '78.11',
    smiles: 'c1ccccc1',
    synonyms: ['Benzene', 'Benzol', 'Cyclohexatriene'],
  },
  {
    cas: '108-90-7',
    nameZh: '氯苯',
    nameEn: 'Chlorobenzene',
    formula: 'C6H5Cl',
    molecularWeight: '112.56',
    smiles: 'Clc1ccccc1',
    synonyms: ['Chlorobenzene', 'Phenyl chloride'],
  },
  {
    cas: '65-85-0',
    nameZh: '苯甲酸',
    nameEn: 'Benzoic Acid',
    formula: 'C7H6O2',
    molecularWeight: '122.12',
    smiles: 'O=C(O)c1ccccc1',
    synonyms: ['Benzoic acid', 'Dracylic acid', 'Phenylformic acid'],
  },
  {
    cas: '108-05-4',
    nameZh: '乙酸乙烯酯',
    nameEn: 'Vinyl Acetate',
    formula: 'C4H6O2',
    molecularWeight: '86.09',
    smiles: 'CC(=O)OC=C',
    synonyms: ['Vinyl acetate', 'Vinyl acetate monomer', 'VAM', 'Acetic acid vinyl ester'],
  },
];

// CAS 检索 API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const cas = searchParams.get('cas');

  if (!cas) {
    return NextResponse.json(
      { success: false, error: 'CAS number is required' },
      { status: 400 }
    );
  }
  
  // 查找本地缓存（支持带/不带连字符的CAS号比较）
  const localMatch = localDatabase.find(
    (chemical) => chemical.cas === cas || chemical.cas.replace(/-/g, '') === cas.replace(/-/g, '')
  );

  // 优先调用 PubChem API 获取完整数据（即使是本地匹配的CAS号）
  // 检查缓存
  const cachedData = getCachedData(cas);
  if (cachedData) {
    return NextResponse.json({
      success: true,
      source: 'cache',
      data: cachedData,
    });
  }

  const pubchemData = await fetchFromPubChem(cas);

  if (pubchemData) {
    // 如果本地有匹配，合并本地数据（如中文名称可能更准确）
    const mergedData = localMatch ? {
      ...pubchemData,
      nameZh: pubchemData.nameZh || localMatch.nameZh,
    } : pubchemData;
    
    // 缓存结果
    setCachedData(cas, mergedData);
    
    return NextResponse.json({
      success: true,
      source: 'pubchem',
      data: mergedData,
    });
  }

  // 如果 PubChem 调用失败，回退到本地数据
  if (localMatch) {
    return NextResponse.json({
      success: true,
      source: 'local',
      data: localMatch,
    });
  }

  // 3. 模糊匹配本地数据库作为建议
  const suggestions = localDatabase.filter(
    (chemical) => chemical.cas.includes(cas) || cas.includes(chemical.cas.replace(/[\s\-]/g, ''))
  );

  return NextResponse.json({
    success: false,
    error: 'Chemical not found',
    suggestions: suggestions.slice(0, 5),
  });
}

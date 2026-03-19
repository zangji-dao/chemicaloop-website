/**
 * PubChem API 调用服务
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { PUBCHEM_CONFIG, PubChemData } from './types';
import { extractPubChemProperties } from './parser';
import { STORAGE_CONFIG, STORAGE_CREDENTIALS, COS_CONFIG, COS_CREDENTIALS, isSandbox } from '@/lib/env';

const execAsync = promisify(exec);

/**
 * 对象存储客户端
 * 
 * 沙箱环境：使用系统提供的对象存储
 * 生产环境：使用腾讯云 COS
 */
const createStorageClient = () => {
  if (isSandbox && STORAGE_CREDENTIALS.accessKeyId) {
    // 沙箱环境：使用系统对象存储
    return new S3Client({
      region: STORAGE_CONFIG.region || 'auto',
      endpoint: STORAGE_CONFIG.endpointUrl,
      credentials: {
        accessKeyId: STORAGE_CREDENTIALS.accessKeyId,
        secretAccessKey: STORAGE_CREDENTIALS.secretAccessKey,
        ...(STORAGE_CREDENTIALS.sessionToken && { sessionToken: STORAGE_CREDENTIALS.sessionToken }),
      },
      forcePathStyle: true,
    });
  } else if (COS_CREDENTIALS.accessKeyId) {
    // 生产环境：使用腾讯云 COS
    return new S3Client({
      region: COS_CONFIG.region,
      endpoint: `https://cos.${COS_CONFIG.region}.myqcloud.com`,
      credentials: {
        accessKeyId: COS_CREDENTIALS.accessKeyId,
        secretAccessKey: COS_CREDENTIALS.secretAccessKey,
      },
      forcePathStyle: false,
    });
  }
  return null;
};

const storageClient = createStorageClient();

// 获取当前使用的 bucket
const getBucketName = () => {
  if (isSandbox && STORAGE_CONFIG.bucket) {
    return STORAGE_CONFIG.bucket;
  }
  return COS_CONFIG.bucket;
};

/**
 * 使用 curl 作为备选的 fetch 方法（解决 Node.js 网络限制）
 * 支持 JSON、文本（SDF/SVG）和二进制（PNG）响应
 */
async function fetchWithCurl(url: string, timeoutMs: number = 30000): Promise<any> {
  try {
    console.log(`[PubChem] Using curl fallback: ${url}`);
    const timeoutSeconds = Math.floor(timeoutMs / 1000);
    
    // 使用临时文件存储响应（避免 stdout buffer 限制）
    const tempFile = `/tmp/pubchem_${Date.now()}`;
    const command = `curl -s --connect-timeout 15 --max-time ${timeoutSeconds} '${url}' -o ${tempFile}`;
    
    await execAsync(command, { timeout: timeoutMs + 15000 });
    
    // 读取文件内容
    const fs = require('fs');
    if (fs.existsSync(tempFile)) {
      const content = fs.readFileSync(tempFile);
      fs.unlinkSync(tempFile); // 清理临时文件
      
      if (content && content.length > 0) {
        const contentStr = content.toString('utf-8');
        
        // 检测是否为 JSON
        if (contentStr.trim().startsWith('{') || contentStr.trim().startsWith('[')) {
          try {
            const result = JSON.parse(contentStr);
            console.log(`[PubChem] Curl JSON success, got ${content.length} bytes`);
            return { ok: true, json: () => Promise.resolve(result) };
          } catch (parseError) {
            // 不是有效 JSON，当作文本处理
          }
        }
        
        // 检测是否为 PNG（二进制）
        if (content[0] === 0x89 && content[1] === 0x50 && content[2] === 0x4E && content[3] === 0x47) {
          console.log(`[PubChem] Curl PNG success, got ${content.length} bytes`);
          return { 
            ok: true, 
            arrayBuffer: () => Promise.resolve(content.buffer.slice(content.byteOffset, content.byteOffset + content.byteLength))
          };
        }
        
        // 其他情况当作文本处理（SDF、SVG 等）
        console.log(`[PubChem] Curl text success, got ${content.length} bytes`);
        return { ok: true, text: () => Promise.resolve(contentStr) };
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
export async function fetchWithRetry(
  url: string,
  retries: number = PUBCHEM_CONFIG.MAX_RETRIES,
  timeout: number = PUBCHEM_CONFIG.FETCH_TIMEOUT
): Promise<Response | null> {
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
        await new Promise(resolve => setTimeout(resolve, PUBCHEM_CONFIG.RETRY_DELAY * (attempt + 1)));
        continue;
      }
      
      return response;
    } catch (error: any) {
      console.error(`[PubChem] Attempt ${attempt + 1} failed for ${url}:`, error?.message);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, PUBCHEM_CONFIG.RETRY_DELAY));
      }
    }
  }
  
  // 所有 fetch 重试失败后，尝试 curl 备选
  console.log(`[PubChem] All fetch attempts failed, trying curl fallback...`);
  const curlResult = await fetchWithCurl(url, timeout);
  return curlResult as any;
}

/**
 * 上传结构图到对象存储
 */
async function uploadStructureImage(cid: number, pngBuffer: Buffer): Promise<string | null> {
  try {
    if (!storageClient) {
      console.warn('[PubChem] Storage client not configured, skipping image upload');
      return null;
    }
    
    const fileName = `structure-images/${cid}_${Date.now()}.png`;
    const bucket = getBucketName();
    
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileName,
      Body: pngBuffer,
      ContentType: 'image/png',
    });
    
    await storageClient.send(command);
    
    console.log(`[PubChem] Uploaded structure image for CID ${cid}: ${fileName}`);
    return fileName;
  } catch (error) {
    console.error(`[PubChem] Failed to upload structure image for CID ${cid}:`, error);
    return null;
  }
}

/**
 * 从 PubChem 获取完整的化合物信息
 */
export async function fetchPubChemData(cas: string): Promise<PubChemData | null> {
  try {
    // 1. 获取 CID
    const cidResponse = await fetchWithRetry(
      `${PUBCHEM_CONFIG.BASE_URL}/compound/name/${encodeURIComponent(cas)}/cids/JSON`
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
    
    // 2. 获取基础属性
    const propsResponse = await fetchWithRetry(
      `${PUBCHEM_CONFIG.BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,ExactMass,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,XLogP,TPSA,Complexity,HeavyAtomCount/JSON`
    );
    
    if (propsResponse && propsResponse.ok) {
      const propsData = await propsResponse.json();
      const props = propsData?.PropertyTable?.Properties?.[0];
      if (props) {
        result.formula = props.MolecularFormula || null;
        result.molecularWeight = props.MolecularWeight?.toString() || null;
        result.exactMass = props.ExactMass?.toString() || null;
        result.smiles = props.CanonicalSMILES || props.SMILES || props.ConnectivitySMILES || null;
        result.smilesCanonical = props.CanonicalSMILES || props.SMILES || props.ConnectivitySMILES || null;
        result.smilesIsomeric = props.IsomericSMILES || null;
        result.inchi = props.InChI || null;
        result.inchiKey = props.InChIKey || null;
        result.xlogp = props.XLogP?.toString() || null;
        result.tpsa = props.TPSA?.toString() || null;
        result.complexity = props.Complexity || null;
        result.heavyAtomCount = props.HeavyAtomCount || null;
      }
    }
    
    // 2.5 获取计算属性（H键供体、H键受体、可旋转键数、形式电荷）
    try {
      const jsonRecordResponse = await fetchWithRetry(
        `${PUBCHEM_CONFIG.BASE_URL}/compound/cid/${cid}/JSON`
      );
      if (jsonRecordResponse && jsonRecordResponse.ok) {
        const jsonData = await jsonRecordResponse.json();
        const compound = jsonData?.PC_Compounds?.[0];
        const props = compound?.props || [];
        
        if (compound?.charge !== undefined) {
          result.formalCharge = compound.charge;
        }
        
        for (const prop of props) {
          const urn = prop.urn || {};
          const label = urn.label || '';
          const name = urn.name || '';
          const value = prop.value;
          
          if (label === 'Count') {
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
      `${PUBCHEM_CONFIG.BASE_URL}/compound/cid/${cid}/synonyms/JSON`
    );
    
    if (synResponse && synResponse.ok) {
      const synData = await synResponse.json();
      result.synonyms = synData?.InformationList?.Information?.[0]?.Synonym?.slice(0, 20) || [];
    }
    
    // 4. 获取详细物理化学性质和安全性
    const viewResponse = await fetchWithRetry(
      `${PUBCHEM_CONFIG.VIEW_URL}/data/compound/${cid}/JSON`,
      PUBCHEM_CONFIG.MAX_RETRIES,
      PUBCHEM_CONFIG.VIEW_TIMEOUT
    );
    
    if (viewResponse && viewResponse.ok) {
      try {
        const viewData = await viewResponse.json();
        const extracted = extractPubChemProperties(viewData);
        
        // 合并提取的数据
        const merge = (extractedValue: string | null | undefined, currentValue: string | null | undefined) => {
          if (extractedValue === '-') {
            return currentValue || '-';
          }
          return extractedValue || currentValue;
        };
        
        Object.assign(result, {
          description: extracted.description || result.description,
          physicalDescription: merge(extracted.physicalDescription, result.physicalDescription),
          colorForm: merge(extracted.colorForm, result.colorForm),
          odor: merge(extracted.odor, result.odor),
          boilingPoint: merge(extracted.boilingPoint, result.boilingPoint),
          meltingPoint: merge(extracted.meltingPoint, result.meltingPoint),
          flashPoint: merge(extracted.flashPoint, result.flashPoint),
          density: merge(extracted.density, result.density),
          solubility: merge(extracted.solubility, result.solubility),
          vaporPressure: merge(extracted.vaporPressure, result.vaporPressure),
          refractiveIndex: merge(extracted.refractiveIndex, result.refractiveIndex),
          hazardClasses: merge(extracted.hazardClasses, result.hazardClasses),
          healthHazards: merge(extracted.healthHazards, result.healthHazards),
          ghsClassification: merge(extracted.ghsClassification, result.ghsClassification),
          toxicitySummary: extracted.toxicitySummary || result.toxicitySummary,
          carcinogenicity: extracted.carcinogenicity || result.carcinogenicity,
          firstAid: merge(extracted.firstAid, result.firstAid),
          storageConditions: merge(extracted.storageConditions, result.storageConditions),
          incompatibleMaterials: merge(extracted.incompatibleMaterials, result.incompatibleMaterials),
          applications: extracted.applications,
          synonyms: extracted.synonyms || result.synonyms,
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
      const pngUrl = `${PUBCHEM_CONFIG.BASE_URL}/compound/cid/${cid}/PNG`;
      const pngResponse = await fetchWithRetry(pngUrl, PUBCHEM_CONFIG.MAX_RETRIES, PUBCHEM_CONFIG.FETCH_TIMEOUT);
      
      if (pngResponse && pngResponse.ok) {
        const pngBuffer = Buffer.from(await pngResponse.arrayBuffer());
        result.structureImageKey = await uploadStructureImage(cid, pngBuffer);
      }
    } catch (uploadError) {
      console.error(`[PubChem] Failed to upload structure image for CID ${cid}:`, uploadError);
    }
    
    // 保留原始 URL 作为备份
    result.structureUrl = `${PUBCHEM_CONFIG.BASE_URL}/compound/cid/${cid}/PNG`;
    
    // 6. 获取 SVG 结构
    try {
      const svgUrl = `${PUBCHEM_CONFIG.BASE_URL}/compound/cid/${cid}/record/SVG`;
      const svgResponse = await fetchWithRetry(svgUrl, 2, PUBCHEM_CONFIG.FETCH_TIMEOUT);
      
      if (svgResponse && svgResponse.ok) {
        result.structure2dSvg = await svgResponse.text();
      }
    } catch (svgError) {
      console.error(`[PubChem] Failed to fetch SVG for CID ${cid}:`, svgError);
    }
    
    // 7. 获取 SDF 结构数据
    try {
      const sdfUrl = `${PUBCHEM_CONFIG.BASE_URL}/compound/cid/${cid}/SDF?record_type=2d`;
      const sdfResponse = await fetchWithRetry(sdfUrl, 2, PUBCHEM_CONFIG.FETCH_TIMEOUT);
      
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

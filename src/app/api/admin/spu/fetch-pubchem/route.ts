import { NextRequest, NextResponse } from 'next/server';

// PubChem API 基础URL
const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug';
const PUBCHEM_VIEW_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug_view';

// 请求超时和重试配置
const FETCH_TIMEOUT = 60000;
const VIEW_TIMEOUT = 90000;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

/**
 * 带超时和重试的 fetch 请求
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
  return null;
}

/**
 * 完整的 PubChem 数据结构
 */
interface PubChemData {
  cid: number;
  formula?: string | null;
  molecularWeight?: string | null;
  exactMass?: string | null;
  smiles?: string | null;
  smilesCanonical?: string | null;
  smilesIsomeric?: string | null;
  inchi?: string | null;
  inchiKey?: string | null;
  xlogp?: string | null;
  tpsa?: string | null;
  complexity?: number | null;
  hBondDonorCount?: number | null;
  hBondAcceptorCount?: number | null;
  rotatableBondCount?: number | null;
  heavyAtomCount?: number | null;
  formalCharge?: number | null;
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
  hazardClasses?: string | null;
  healthHazards?: string | null;
  ghsClassification?: string | null;
  toxicitySummary?: string | null;
  carcinogenicity?: string | null;
  firstAid?: string | null;
  storageConditions?: string | null;
  incompatibleMaterials?: string | null;
  synonyms?: string[];
  applications?: string[];
  structureUrl?: string | null;
  structureImageKey?: string | null;
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
          
          if (subHeading === 'Record Description') {
            const info = sub.Information?.[0];
            if (info?.Value?.StringWithMarkup?.[0]?.String) {
              result.description = info.Value.StringWithMarkup[0].String;
            }
          }
          
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
          result.hazardClasses = info.Value.StringWithMarkup[0].String;
        }
      }
      
      // ========== 安全与危害 ==========
      if (heading === 'Safety and Hazards') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          if (subHeading === 'Hazards Identification') {
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              
              if (subSubHeading === 'GHS Classification') {
                const ghsSet = new Set<string>();
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    ghsSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
                if (ghsSet.size > 0) {
                  result.ghsClassification = [...ghsSet].join('\n');
                }
              }
            }
          }
          
          if (subHeading === 'First Aid') {
            const firstAidParts: string[] = [];
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              for (const info of subSub.Information || []) {
                if (info?.Value?.StringWithMarkup?.[0]?.String) {
                  firstAidParts.push(`${subSubHeading}: ${info.Value.StringWithMarkup[0].String}`);
                }
              }
            }
            if (firstAidParts.length > 0) {
              result.firstAid = firstAidParts.join('\n\n');
            }
          }
          
          if (subHeading === 'Exposure Controls and Personal Protection') {
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              if (subSubHeading === 'Personal Precautions' || subSubHeading === 'Storage') {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    if (subSubHeading === 'Storage') {
                      result.storageConditions = info.Value.StringWithMarkup[0].String;
                    }
                  }
                }
              }
            }
          }
          
          if (subHeading === 'Stability and Reactivity') {
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              if (subSubHeading === 'Incompatible Materials') {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    result.incompatibleMaterials = info.Value.StringWithMarkup[0].String;
                  }
                }
              }
            }
          }
        }
      }
      
      // ========== 毒理学 ==========
      if (heading === 'Toxicity') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
          if (subHeading === 'Toxicological Information') {
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
              
              if (subSubHeading === 'Health Hazards' || subSubHeading === 'Adverse Effects') {
                const hazardsSet = new Set<string>();
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    hazardsSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
                if (hazardsSet.size > 0) {
                  if (result.healthHazards) {
                    const existing = new Set(result.healthHazards.split('\n'));
                    hazardsSet.forEach(item => existing.add(item));
                    result.healthHazards = [...existing].join('\n');
                  } else {
                    result.healthHazards = [...hazardsSet].join('\n');
                  }
                }
              }
              
              if (subSubHeading === 'Symptoms and Signs' || subSubHeading === 'Signs and Symptoms') {
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
            }
          }
        }
      }
      
      // ========== 用途 ==========
      if (heading === 'Use and Manufacturing') {
        for (const sub of section.Section || []) {
          const subHeading = sub.TOCHeading || '';
          
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
        }
      }
    }
    
    if (applications.length > 0) {
      result.applications = applications.slice(0, 10);
    }
    
  } catch (error) {
    console.error('[PubChem] Error extracting properties:', error);
  }
  
  return result;
}

/**
 * 从 PubChem 获取完整数据
 */
async function fetchPubChemData(cas: string): Promise<PubChemData | null> {
  try {
    // 1. 通过 CAS 获取 CID
    const cidResponse = await fetchWithRetry(`${PUBCHEM_BASE_URL}/compound/name/${encodeURIComponent(cas)}/cids/JSON`);
    if (!cidResponse) {
      console.log(`[PubChem] No CID found for CAS: ${cas}`);
      return null;
    }
    
    const cidData = await cidResponse.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    
    if (!cid) {
      console.log(`[PubChem] No CID in response for CAS: ${cas}`);
      return null;
    }
    
    console.log(`[PubChem] Found CID ${cid} for CAS: ${cas}`);
    
    // 2. 获取分子式、分子量等基本信息
    const propsResponse = await fetchWithRetry(
      `${PUBCHEM_BASE_URL}/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,ExactMass,IsomericSMILES,CanonicalSMILES,InChI,InChIKey,XLogP3,TPSA,Complexity,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,HeavyAtomCount,Charge/JSON`
    );
    
    let props: any = {};
    if (propsResponse) {
      const propsData = await propsResponse.json();
      props = propsData?.PropertyTable?.Properties?.[0] || {};
    }
    
    // 3. 获取详细属性数据 (Pug View)
    const viewResponse = await fetchWithRetry(`${PUBCHEM_VIEW_URL}/data/compound/${cid}/JSON`, MAX_RETRIES, VIEW_TIMEOUT);
    
    let extractedProps: Partial<PubChemData> = {};
    if (viewResponse) {
      const viewData = await viewResponse.json();
      extractedProps = extractPubChemProperties(viewData);
    }
    
    // 4. 获取 2D 结构图
    let structure2dSvg: string | null = null;
    const svgResponse = await fetchWithRetry(`${PUBCHEM_BASE_URL}/compound/cid/${cid}/SVG`);
    if (svgResponse) {
      structure2dSvg = await svgResponse.text();
    }
    
    // 5. 组装完整数据
    const result: PubChemData = {
      cid,
      formula: props.MolecularFormula || null,
      molecularWeight: props.MolecularWeight?.toString() || null,
      exactMass: props.ExactMass?.toString() || null,
      smiles: props.IsomericSMILES || props.CanonicalSMILES || null,
      smilesCanonical: props.CanonicalSMILES || null,
      smilesIsomeric: props.IsomericSMILES || null,
      inchi: props.InChI || null,
      inchiKey: props.InChIKey || null,
      xlogp: props.XLogP3?.toString() || null,
      tpsa: props.TPSA?.toString() || null,
      complexity: props.Complexity || null,
      hBondDonorCount: props.HBondDonorCount || null,
      hBondAcceptorCount: props.HBondAcceptorCount || null,
      rotatableBondCount: props.RotatableBondCount || null,
      heavyAtomCount: props.HeavyAtomCount || null,
      formalCharge: props.Charge || null,
      structureUrl: `https://pubchem.ncbi.nlm.nih.gov/image/imgsrv.fcgi?cid=${cid}&t=l`,
      structure2dSvg,
      ...extractedProps,
    };
    
    return result;
    
  } catch (error: any) {
    console.error(`[PubChem] Error fetching data for CAS ${cas}:`, error?.message);
    return null;
  }
}

/**
 * POST /api/admin/spu/fetch-pubchem
 * 仅获取 PubChem 数据，不写入数据库
 * 用于前端预览同步结果，用户确认后才保存
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { cas } = body;
    
    if (!cas) {
      return NextResponse.json(
        { success: false, error: 'CAS number is required' },
        { status: 400 }
      );
    }
    
    console.log(`[FetchPubChem] Fetching data for CAS: ${cas}`);
    
    const pubchemData = await fetchPubChemData(cas);
    
    if (!pubchemData) {
      return NextResponse.json({
        success: false,
        error: 'PubChem data not found for this CAS number',
      });
    }
    
    // 返回数据，不写入数据库
    return NextResponse.json({
      success: true,
      data: {
        pubchemCid: pubchemData.cid,
        pubchemSyncedAt: new Date().toISOString(),
        // 基本信息
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
        structure2dSvg: pubchemData.structure2dSvg,
      },
    });
    
  } catch (error: any) {
    console.error('[FetchPubChem] Error:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Failed to fetch PubChem data' },
      { status: 500 }
    );
  }
}

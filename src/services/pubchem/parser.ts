/**
 * PubChem 数据解析器
 * 从 PubChem Pug View 数据中提取完整的物理化学性质
 */

import { PubChemData } from './types';

/**
 * 从 PubChem Pug View 数据中提取完整的物理化学性质
 */
export function extractPubChemProperties(data: any): Partial<PubChemData> {
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
                const ghsStatements: string[] = [];
                const hazardClassesSet = new Set<string>();
                
                for (const info of haz.Information || []) {
                  const infoName = info.Name || '';
                  
                  // 提取 Pictogram(s)
                  if (infoName === 'Pictogram(s)') {
                    const markup = info?.Value?.StringWithMarkup?.[0]?.Markup;
                    if (markup && Array.isArray(markup)) {
                      for (const m of markup) {
                        if (m?.Extra) {
                          hazardClassesSet.add(m.Extra);
                        }
                      }
                    }
                  }
                  
                  // 提取 GHS Hazard Statements
                  if (infoName === 'GHS Hazard Statements') {
                    for (const swm of info?.Value?.StringWithMarkup || []) {
                      if (swm.String) {
                        ghsStatements.push(swm.String);
                      }
                    }
                  }
                }
                
                const uniqueGhsStatements = [...new Set(ghsStatements)];
                if (uniqueGhsStatements.length > 0) {
                  result.ghsClassification = uniqueGhsStatements.join('\n');
                }
                if (hazardClassesSet.size > 0) {
                  result.hazardClasses = [...hazardClassesSet].join(', ');
                }
              }
            }
          }
          
          // 急救措施
          if (subHeading === 'First Aid' || subHeading === 'First Aid Measures') {
            const firstAidSet = new Set<string>();
            for (const info of sub.Information || []) {
              if (info?.Value?.StringWithMarkup?.[0]?.String) {
                firstAidSet.add(info.Value.StringWithMarkup[0].String);
              }
            }
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
          
          // 存储条件
          if (subHeading === 'Handling and Storage') {
            const storageSet = new Set<string>();
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
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
          
          // 不相容物质
          if (subHeading === 'Stability and Reactivity') {
            const incompatSet = new Set<string>();
            for (const subSub of sub.Section || []) {
              const subSubHeading = subSub.TOCHeading || '';
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
                    healthHazardsSet.add(info.Value.StringWithMarkup[0].String);
                  }
                }
                if (healthHazardsSet.size > 0) {
                  result.healthHazards = [...healthHazardsSet].join('\n');
                }
              }
              
              // 不良反应
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
              
              // 症状和体征
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
              
              // 暴露途径
              if (subSubHeading === 'Exposure Routes') {
                for (const info of subSub.Information || []) {
                  if (info?.Value?.StringWithMarkup?.[0]?.String) {
                    const exposureRoutes = info.Value.StringWithMarkup[0].String;
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
                if (acuteEffectsSet.size > 0) {
                  if (!result.healthHazards) {
                    result.healthHazards = [...acuteEffectsSet].join('\n');
                  } else {
                    const existing = new Set(result.healthHazards.split('\n'));
                    acuteEffectsSet.forEach(item => existing.add(item));
                    result.healthHazards = [...existing].join('\n');
                  }
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

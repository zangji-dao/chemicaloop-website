/**
 * 美化版化学结构 SVG 生成器
 * 从 PubChem 获取分子结构数据，用专业的视觉风格重新绘制
 */

import { LLMClient, Config } from 'coze-coding-dev-sdk';

export interface ChemicalInfo {
  name: string;
  cas?: string;
  formula?: string;
  sdf?: string;  // 本地存储的 SDF 数据，优先使用
}

export interface SVGGenerationResult {
  success: boolean;
  svg?: string;
  formula?: string;
  error?: string;
}

// 配色方案 - 专业化学软件风格
const COLORS = {
  // 背景
  bgGradientStart: '#f8fafc',
  bgGradientEnd: '#e2e8f0',
  
  // 原子颜色（CPK 配色方案简化版）
  C: '#1e293b',    // 碳 - 深蓝灰
  O: '#dc2626',    // 氧 - 红色
  N: '#2563eb',    // 氮 - 蓝色
  S: '#ca8a04',    // 硫 - 黄色
  Cl: '#16a34a',   // 氯 - 绿色
  F: '#22c55e',    // 氟 - 绿色
  Br: '#9333ea',   // 溴 - 紫色
  I: '#7c3aed',    // 碘 - 紫色
  P: '#ea580c',    // 磷 - 橙色
  K: '#64748b',    // 钾 - 灰色
  Na: '#64748b',   // 钠 - 灰色
  H: '#64748b',    // 氢 - 灰色
  
  // 键
  bond: '#334155',
  bondDouble: '#475569',
  
  // 文字
  text: '#1e293b',
  textLight: '#64748b',
  
  // 装饰
  accent: '#3b82f6',
};

/**
 * SDF 文件解析结果
 */
interface SDFStructure {
  cid: number;
  formula: string;
  atoms: Array<{
    x: number;
    y: number;
    symbol: string;
    index: number;
  }>;
  bonds: Array<{
    from: number;
    to: number;
    order: number;
  }>;
}

const FETCH_TIMEOUT = 30000; // 30秒超时
const MAX_RETRIES = 2;

/**
 * 使用 curl 作为备选的 fetch 方法（解决 Node.js 网络限制）
 */
async function fetchWithCurl(url: string, timeoutMs: number = 30000): Promise<string | null> {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    const fs = await import('fs');
    
    const timeoutSeconds = Math.floor(timeoutMs / 1000);
    const tempFile = `/tmp/sdf_${Date.now()}.txt`;
    
    const command = `curl -s --connect-timeout 10 --max-time ${timeoutSeconds} '${url}' -o ${tempFile}`;
    await execAsync(command, { timeout: timeoutMs + 5000 });
    
    if (fs.existsSync(tempFile)) {
      const content = fs.readFileSync(tempFile, 'utf-8');
      fs.unlinkSync(tempFile);
      return content || null;
    }
    return null;
  } catch (error) {
    console.error('Curl fetch error:', error);
    return null;
  }
}

/**
 * 从 PubChem 获取 2D SDF 结构数据（带超时和重试）
 */
async function getSDFStructure(identifier: string): Promise<SDFStructure | null> {
  const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(identifier)}/SDF?record_type=2d`;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[SDF] Attempt ${attempt}/${MAX_RETRIES} for: ${identifier}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      const response = await fetch(url, {
        headers: { 'Accept': 'chemical/x-mdl-sdfile' },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.log(`[SDF] HTTP ${response.status}, retrying...`);
        await new Promise(r => setTimeout(r, 1000));
        continue;
      }
      
      const sdfText = await response.text();
      const result = parseSDF(sdfText);
      if (result) {
        console.log(`[SDF] Successfully fetched SDF for: ${identifier}`);
        return result;
      }
    } catch (error: any) {
      console.error(`[SDF] Fetch error (attempt ${attempt}):`, error?.message || error);
      
      // 如果是超时错误，尝试使用 curl
      if (error?.name === 'AbortError' || error?.code === 'ETIMEDOUT') {
        console.log(`[SDF] Trying curl fallback...`);
        const sdfText = await fetchWithCurl(url, FETCH_TIMEOUT);
        if (sdfText) {
          const result = parseSDF(sdfText);
          if (result) {
            console.log(`[SDF] Curl fallback succeeded for: ${identifier}`);
            return result;
          }
        }
      }
      
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }
  }
  
  console.error(`[SDF] All attempts failed for: ${identifier}`);
  return null;
}

/**
 * 解析 SDF 文件内容
 */
function parseSDF(sdfText: string): SDFStructure | null {
  try {
    const lines = sdfText.split('\n');
    
    const cid = parseInt(lines[0], 10) || 0;
    const countsLine = lines[3].trim().split(/\s+/);
    const atomCount = parseInt(countsLine[0], 10);
    const bondCount = parseInt(countsLine[1], 10);
    
    const atoms: SDFStructure['atoms'] = [];
    for (let i = 0; i < atomCount; i++) {
      const line = lines[4 + i].trim();
      const parts = line.split(/\s+/);
      atoms.push({
        x: parseFloat(parts[0]),
        y: parseFloat(parts[1]),
        symbol: parts[3],
        index: i,
      });
    }
    
    const bondStartLine = 4 + atomCount;
    const bonds: SDFStructure['bonds'] = [];
    for (let i = 0; i < bondCount; i++) {
      const line = lines[bondStartLine + i].trim();
      const parts = line.split(/\s+/);
      bonds.push({
        from: parseInt(parts[0], 10) - 1,
        to: parseInt(parts[1], 10) - 1,
        order: parseInt(parts[2], 10),
      });
    }
    
    let formula = '';
    const formulaMatch = sdfText.match(/> <PUBCHEM_MOLECULAR_FORMULA>\n([^\n]+)/);
    if (formulaMatch) formula = formulaMatch[1];
    
    return { cid, formula, atoms, bonds };
  } catch (error) {
    console.error('Error parsing SDF:', error);
    return null;
  }
}

/**
 * 坐标转换：将 SDF 坐标转换为 SVG 坐标，并计算边界框
 */
function transformCoordinates(
  atoms: SDFStructure['atoms'],
  svgWidth: number,
  svgHeight: number,
  margin: number
): { 
  atoms: Array<{ x: number; y: number; symbol: string; index: number }>;
  atomMap: Map<number, { x: number; y: number; symbol: string }>;
} {
  if (atoms.length === 0) return { atoms: [], atomMap: new Map() };
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const atom of atoms) {
    minX = Math.min(minX, atom.x);
    maxX = Math.max(maxX, atom.x);
    minY = Math.min(minY, atom.y);
    maxY = Math.max(maxY, atom.y);
  }
  
  const width = maxX - minX || 1;
  const height = maxY - minY || 1;
  
  const availableWidth = svgWidth - 2 * margin;
  const availableHeight = svgHeight - 2 * margin;
  
  const scale = Math.min(availableWidth / width, availableHeight / height, 35);
  
  const offsetX = margin + (availableWidth - width * scale) / 2;
  const offsetY = margin + (availableHeight - height * scale) / 2;
  
  const transformedAtoms = atoms.map(atom => ({
    x: Math.round((atom.x - minX) * scale + offsetX),
    y: Math.round((atom.y - minY) * scale + offsetY),
    symbol: atom.symbol,
    index: atom.index,
  }));
  
  const atomMap = new Map(transformedAtoms.map(a => [a.index, a]));
  
  return { atoms: transformedAtoms, atomMap };
}

/**
 * 格式化分子式（带 HTML 下标）
 */
function formatFormulaHTML(formula: string): string {
  return formula.replace(/(\d+)/g, '<tspan baseline-shift="sub" font-size="12">$1</tspan>');
}

/**
 * 生成美化版 SVG
 */
function generateBeautifulSVG(
  name: string,
  structure: SDFStructure
): string {
  const svgWidth = 400;
  const svgHeight = 300;
  const margin = 60;
  
  const { atoms, atomMap } = transformCoordinates(structure.atoms, svgWidth, svgHeight - 50, margin);
  
  // 过滤掉氢原子（骨架式）
  const nonHAtoms = atoms.filter(a => a.symbol !== 'H');
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}">
  <defs>
    <!-- 背景渐变 -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${COLORS.bgGradientStart};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${COLORS.bgGradientEnd};stop-opacity:1" />
    </linearGradient>
    
    <!-- 卡片阴影 -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000" flood-opacity="0.1"/>
    </filter>
    
    <!-- 原子发光效果 -->
    <filter id="glow">
      <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <!-- 背景 -->
  <rect width="100%" height="100%" fill="url(#bgGrad)"/>
  
  <!-- 装饰圆形 -->
  <circle cx="350" cy="50" r="80" fill="${COLORS.accent}" opacity="0.05"/>
  <circle cx="50" cy="250" r="60" fill="${COLORS.accent}" opacity="0.03"/>
  
  <!-- 分子结构区域 -->
  <g id="molecule">
`;

  // 绘制键
  svg += `    <!-- Bonds -->\n`;
  for (const bond of structure.bonds) {
    const fromAtom = atomMap.get(bond.from);
    const toAtom = atomMap.get(bond.to);
    
    if (!fromAtom || !toAtom) continue;
    
    // 跳过涉及氢的键
    if (fromAtom.symbol === 'H' || toAtom.symbol === 'H') continue;
    
    const dx = toAtom.x - fromAtom.x;
    const dy = toAtom.y - fromAtom.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    
    if (bond.order === 2) {
      // 双键 - 两条平行线
      const offsetX = (dy / len) * 2.5;
      const offsetY = (-dx / len) * 2.5;
      
      svg += `    <line x1="${fromAtom.x + offsetX}" y1="${fromAtom.y + offsetY}" x2="${toAtom.x + offsetX}" y2="${toAtom.y + offsetY}" stroke="${COLORS.bond}" stroke-width="2.5" stroke-linecap="round"/>
`;
      svg += `    <line x1="${fromAtom.x - offsetX}" y1="${fromAtom.y - offsetY}" x2="${toAtom.x - offsetX}" y2="${toAtom.y - offsetY}" stroke="${COLORS.bond}" stroke-width="2.5" stroke-linecap="round"/>
`;
    } else if (bond.order === 3) {
      // 三键
      const offsetX = (dy / len) * 3.5;
      const offsetY = (-dx / len) * 3.5;
      
      svg += `    <line x1="${fromAtom.x}" y1="${fromAtom.y}" x2="${toAtom.x}" y2="${toAtom.y}" stroke="${COLORS.bond}" stroke-width="2.5" stroke-linecap="round"/>
`;
      svg += `    <line x1="${fromAtom.x + offsetX}" y1="${fromAtom.y + offsetY}" x2="${toAtom.x + offsetX}" y2="${toAtom.y + offsetY}" stroke="${COLORS.bond}" stroke-width="2.5" stroke-linecap="round"/>
`;
      svg += `    <line x1="${fromAtom.x - offsetX}" y1="${fromAtom.y - offsetY}" x2="${toAtom.x - offsetX}" y2="${toAtom.y - offsetY}" stroke="${COLORS.bond}" stroke-width="2.5" stroke-linecap="round"/>
`;
    } else if (bond.order === 4) {
      // 芳香键 - 实线 + 虚线
      const offsetX = (dy / len) * 2;
      const offsetY = (-dx / len) * 2;
      
      svg += `    <line x1="${fromAtom.x}" y1="${fromAtom.y}" x2="${toAtom.x}" y2="${toAtom.y}" stroke="${COLORS.bond}" stroke-width="2.5" stroke-linecap="round"/>
`;
      svg += `    <line x1="${fromAtom.x + offsetX}" y1="${fromAtom.y + offsetY}" x2="${toAtom.x + offsetX}" y2="${toAtom.y + offsetY}" stroke="${COLORS.bondDouble}" stroke-width="2" stroke-dasharray="4,3" stroke-linecap="round"/>
`;
    } else {
      // 单键
      svg += `    <line x1="${fromAtom.x}" y1="${fromAtom.y}" x2="${toAtom.x}" y2="${toAtom.y}" stroke="${COLORS.bond}" stroke-width="2.5" stroke-linecap="round"/>
`;
    }
  }

  // 绘制原子节点
  svg += `  </g>
  
  <!-- Atoms -->
  <g id="atoms">
`;
  
  for (const atom of nonHAtoms) {
    const color = (COLORS as any)[atom.symbol] || COLORS.C;
    
    if (atom.symbol === 'C') {
      // 碳原子 - 小节点
      svg += `    <circle cx="${atom.x}" cy="${atom.y}" r="4" fill="${color}"/>
`;
    } else {
      // 非碳原子 - 带标签的圆圈
      const radius = atom.symbol.length > 1 ? 14 : 12;
      svg += `    <circle cx="${atom.x}" cy="${atom.y}" r="${radius}" fill="${color}" filter="url(#glow)"/>
`;
      svg += `    <text x="${atom.x}" y="${atom.y + 4}" text-anchor="middle" fill="white" font-size="11" font-weight="600" font-family="system-ui, sans-serif">${atom.symbol}</text>
`;
    }
  }

  // 名称和分子式
  const formulaHTML = formatFormulaHTML(structure.formula || '');
  
  svg += `  </g>
  
  <!-- 底部分隔线 -->
  <line x1="30" y1="260" x2="370" y2="260" stroke="${COLORS.textLight}" stroke-width="1" opacity="0.3"/>
  
  <!-- 分子式 -->
  <text x="200" y="280" text-anchor="middle" fill="${COLORS.text}" font-size="16" font-weight="600" font-family="system-ui, sans-serif">${formulaHTML}</text>
  
  <!-- CAS 标签 -->
  <rect x="140" y="288" width="120" height="10" rx="5" fill="${COLORS.accent}" opacity="0.1"/>
</svg>`;

  return svg;
}

/**
 * 使用 LLM 生成结构（后备方案）
 */
async function generateWithLLM(name: string): Promise<SVGGenerationResult> {
  try {
    const config = new Config();
    const client = new LLMClient(config);

    const systemPrompt = `You are a chemistry expert. Given a chemical compound name, output ONLY a JSON object with the molecular structure.

Output format (JSON only):
{
  "atoms": [{"x": number (50-350), "y": number (50-200), "symbol": "C|O|N|S|Cl|F|Br|I|P"}],
  "bonds": [{"from": number, "to": number, "order": 1|2|3}],
  "formula": "molecular formula with subscripts like C2H6O"
}

Rules:
1. Canvas is 400x260, center around (200, 130)
2. Do NOT include H atoms explicitly - combine as CH3, CH2, OH etc.
3. Use proper bond angles: 120° for sp2, 109.5° for sp3
4. For benzene rings: hexagon with alternating double bonds
5. Output ONLY the JSON object.`;

    const response = await client.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Generate molecular structure for: ${name}` },
    ], {
      model: 'doubao-seed-1-6-251015',
      temperature: 0.2,
    });

    let jsonStr = response.content.trim();
    jsonStr = jsonStr.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
    
    const structure = JSON.parse(jsonStr);
    const svg = generateBeautifulSVG(name, { 
      cid: 0, 
      formula: structure.formula, 
      atoms: structure.atoms.map((a: any, i: number) => ({ ...a, index: i })),
      bonds: structure.bonds 
    });
    
    return { success: true, svg, formula: structure.formula };
  } catch (error: any) {
    console.error('LLM generation error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 主函数：生成美化版化学结构 SVG
 */
export async function generateChemicalSVG(
  chemical: ChemicalInfo,
  _customHeaders?: Record<string, string>
): Promise<SVGGenerationResult> {
  try {
    const name = chemical.name;
    const cas = chemical.cas;
    const sdf = chemical.sdf;
    
    // 1. 优先使用本地存储的 SDF 数据（避免重复从 PubChem 获取）
    let structure = null;
    
    if (sdf) {
      console.log(`[ChemicalSVG] Using local SDF data, length: ${sdf.length}`);
      structure = parseSDF(sdf);
    }
    
    // 2. 如果没有本地数据，从 PubChem 获取（优先用 CAS）
    if (!structure && cas) {
      console.log(`[ChemicalSVG] Fetching from PubChem using CAS: ${cas}`);
      structure = await getSDFStructure(cas);
    }
    
    if (!structure && name) {
      console.log(`[ChemicalSVG] Fetching from PubChem using name: ${name}`);
      structure = await getSDFStructure(name);
    }
    
    if (structure) {
      const svg = generateBeautifulSVG(chemical.name || cas || 'Unknown', structure);
      return { success: true, svg, formula: structure.formula };
    }
    
    // 3. 使用 LLM 生成（最后的备选方案）
    console.log(`[ChemicalSVG] PubChem not found, using LLM: ${name || cas}`);
    return generateWithLLM(name || cas || 'Unknown');
    
  } catch (error: any) {
    console.error('Error generating chemical SVG:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate SVG',
    };
  }
}

/**
 * 验证 SVG 内容
 */
export function validateSVG(svg: string): boolean {
  if (!svg || typeof svg !== 'string') return false;
  if (!svg.includes('<svg')) return false;
  if (!svg.includes('</svg>')) return false;
  return true;
}

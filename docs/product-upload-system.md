# 产品上架系统设计文档

## 1. 系统概述

### 1.1 目标
构建一个面向供应商的产品上架系统，支持三阶段产品录入流程，确保数据规范性和业务灵活性。

### 1.2 核心特性
- **SPU（Standard Product Unit）以 CAS 号为核心标识**：通过 CAS 号实现产品唯一性校验和基础信息复用
- **规格维度化管理**：产品规格包括形态、级别、纯度、包装方式、单位、国家
- **纯度梯度系统**：用户上传时输入具体纯度值，系统自动识别并归入对应等级
- **多供应商跟卖**：同一 CAS 号支持多个供应商上架不同规格
- **参考价格计算**：根据规格组合计算所有供应商的平均价
- **标签体系筛选**：支持行业标签和应用标签筛选

### 1.3 核心概念
```
SPU (Standard Product Unit) = CAS号
  ├─ 基础信息：名称、分子式、结构图
  ├─ 行业标签：涂料、胶粘剂、医药、电子等
  └─ 应用标签：溶剂、防腐剂、分散剂、乳化剂等

Product (供应商产品) = SPU + 供应商ID + 规格组合
  ├─ 形态：粉末、液体、晶体
  ├─ 级别：工业级、医药级、电子级等
  ├─ 纯度：≥99%、≥99.9%、≥99.99%等
  ├─ 包装方式：桶、瓶、袋、散装
  ├─ 单位：kg、L、g、ml
  ├─ 国家：中国、德国、美国、日本
  └─ SKU：价格、库存、MOQ、交付时间
```

---

## 2. 数据库设计

### 2.1 核心表结构

#### 2.1.1 `chemical_base` - 化学基础信息表（SPU基础）
```sql
CREATE TABLE chemical_base (
  id VARCHAR(50) PRIMARY KEY,
  cas VARCHAR(50) UNIQUE NOT NULL COMMENT 'CAS号，唯一标识',
  name_zh VARCHAR(255) COMMENT '中文名称',
  name_en VARCHAR(255) COMMENT '英文名称',
  formula VARCHAR(100) COMMENT '分子式',
  structure_url TEXT COMMENT '结构图URL',
  description TEXT COMMENT '化学物质描述',
  industry_tags JSON COMMENT '行业标签 ["paint", "adhesive"]',
  application_tags JSON COMMENT '应用标签 ["solvent", "preservative"]',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cas (cas),
  INDEX idx_industry_tags ((CAST(industry_tags AS CHAR(255)))),
  INDEX idx_application_tags ((CAST(application_tags AS CHAR(255))))
) COMMENT='化学基础信息表，SPU标识';
```

**说明**：
- CAS 号作为 SPU 唯一标识
- 存储化学物质的标准化基础信息
- 行业标签和应用标签用于筛选
- 支持中英文双语

#### 2.1.2 `products` - 产品主表（供应商产品）
```sql
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  cas VARCHAR(50) NOT NULL COMMENT 'CAS号，关联SPU',
  supplier_id VARCHAR(50) NOT NULL COMMENT '供应商ID',
  
  -- 产品规格（核心筛选维度）
  physical_state VARCHAR(50) NOT NULL COMMENT '物理形态：powder, liquid, crystal, gas, granular, block',
  purity_grade VARCHAR(50) NOT NULL COMMENT '纯度等级：industrial, laboratory, pharmaceutical, reagent, electronic',
  purity_value VARCHAR(50) NOT NULL COMMENT '纯度值：99.3%, 99.95%, 99.995%等',
  packaging_type VARCHAR(50) NOT NULL COMMENT '包装方式：drum, bottle, bag, bulk, box, tank',
  unit VARCHAR(20) NOT NULL COMMENT '单位：kg, L, g, ml, ton',
  country VARCHAR(50) NOT NULL COMMENT '国家：china, germany, usa, japan, india',
  
  -- 产品描述
  description TEXT COMMENT '产品详细描述',
  detailed_applications TEXT COMMENT '详细应用说明',
  
  -- 状态
  status ENUM('draft', 'published', 'sold_out') DEFAULT 'draft' COMMENT '状态：草稿、已发布、已售罄',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 唯一约束：SPU + 供应商 + 规格组合唯一
  UNIQUE KEY unique_product (cas, supplier_id, physical_state, purity_grade, purity_value, packaging_type, unit, country),
  
  -- 索引
  INDEX idx_cas_supplier (cas, supplier_id),
  INDEX idx_physical_state (physical_state),
  INDEX idx_purity_grade (purity_grade),
  INDEX idx_country (country),
  
  FOREIGN KEY (cas) REFERENCES chemical_base(cas),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
) COMMENT='产品主表，存储供应商产品及规格';
```

**说明**：
- 产品唯一性由 `CAS + 供应商 + 规格组合` 决定
- 纯度同时存储等级和具体值
- 支持多供应商同规格比价
- **所有价格均为出厂价（EXW - Ex Works），不含运费、保险、关税等额外成本**

#### 2.1.3 `product_skus` - SKU 表（商业信息）
```sql
CREATE TABLE product_skus (
  id VARCHAR(50) PRIMARY KEY,
  product_id VARCHAR(50) NOT NULL UNIQUE COMMENT '产品ID，一对一关系',
  
  -- 商业信息（出厂价 EXW）
  price DECIMAL(10, 2) NOT NULL COMMENT '出厂价 (EXW)，不含运费、保险、关税等',
  stock INT DEFAULT 0 COMMENT '库存',
  moq INT DEFAULT 1 COMMENT '最小起订量',
  delivery_time VARCHAR(50) COMMENT '交付时间',
  
  -- 状态
  status ENUM('available', 'out_of_stock') DEFAULT 'available' COMMENT '库存状态',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_product_id (product_id),
  INDEX idx_price (price),
  
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) COMMENT='SKU表，存储出厂价、库存、MOQ等商业信息';
```

**说明**：
- 一个产品对应一个 SKU
- SKU 只包含商业信息差异
- **price 字段为出厂价（EXW - Ex Works）**：
  - 不含国际运费
  - 不含保险费
  - 不含关税和增值税
  - 不含卸货费
  - 仅包含产品成本和包装成本
- 买方需自行承担从供应商工厂到目的地的所有物流成本
- 一对一关系，简化数据模型

#### 2.1.4 `suppliers` - 供应商表
```sql
CREATE TABLE suppliers (
  id VARCHAR(50) PRIMARY KEY,
  name_zh VARCHAR(255) NOT NULL,
  name_en VARCHAR(255),
  contact_person VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  country VARCHAR(50),
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_status (status)
) COMMENT='供应商信息表';
```

### 2.2 数据关系图
```
suppliers (供应商)
  ↓ (1:N)
products (产品主表)
  ↓ (FK: cas)
chemical_base (化学基础信息 - SPU)
  ↓ (1:1)
product_skus (SKU 表)
```

---

## 3. 纯度梯度系统

### 3.1 纯度等级定义

```typescript
const PURITY_GRADES = {
  industrial: {
    key: 'industrial',
    label: { zh: '工业级', en: 'Industrial' },
    range: [99, 99.5),           // 99% ≤ 纯度 < 99.5%
    minValue: 99,
    maxValue: 99.5,
    description: { zh: '适用于一般工业用途', en: 'For general industrial use' },
    examples: ['≥99%', '99.2%', '99.3%', '99.4%']
  },
  laboratory: {
    key: 'laboratory',
    label: { zh: '实验室级', en: 'Laboratory' },
    range: [99.5, 99.9),         // 99.5% ≤ 纯度 < 99.9%
    minValue: 99.5,
    maxValue: 99.9,
    description: { zh: '适用于实验室研究和分析', en: 'For laboratory research and analysis' },
    examples: ['≥99.5%', '99.6%', '99.7%', '99.8%']
  },
  pharmaceutical: {
    key: 'pharmaceutical',
    label: { zh: '医药级', en: 'Pharmaceutical' },
    range: [99.9, 99.95),        // 99.9% ≤ 纯度 < 99.95%
    minValue: 99.9,
    maxValue: 99.95,
    description: { zh: '符合药品生产标准', en: 'Meets pharmaceutical production standards' },
    examples: ['≥99.9%', '99.91%', '99.92%', '99.93%', '99.94%']
  },
  reagent: {
    key: 'reagent',
    label: { zh: '试剂级', en: 'Reagent' },
    range: [99.95, 99.99),       // 99.95% ≤ 纯度 < 99.99%
    minValue: 99.95,
    maxValue: 99.99,
    description: { zh: '高纯度试剂，用于精密分析', en: 'High purity reagents for precision analysis' },
    examples: ['≥99.95%', '99.96%', '99.97%', '99.98%']
  },
  electronic: {
    key: 'electronic',
    label: { zh: '电子级', en: 'Electronic' },
    range: [99.99, 100],         // 99.99% ≤ 纯度 ≤ 100%
    minValue: 99.99,
    maxValue: 100,
    description: { zh: '超高纯度，用于电子行业', en: 'Ultra-high purity for electronics industry' },
    examples: ['≥99.99%', '99.991%', '99.995%', '99.999%']
  }
};
```

### 3.2 纯度等级识别算法

```typescript
/**
 * 根据纯度值计算等级
 * @param purityValue 纯度值，支持 "99.3%", "≥99.3%", ">99.3%" 等格式
 * @returns 纯度等级
 */
function calculatePurityGrade(purityValue: string): string {
  // 提取数值（支持多种格式）
  const numericValue = parseFloat(purityValue.replace(/[^\d.]/g, ''));
  
  if (isNaN(numericValue)) {
    throw new Error('Invalid purity value format');
  }
  
  if (numericValue >= 99.99) return 'electronic';
  if (numericValue >= 99.95) return 'reagent';
  if (numericValue >= 99.9) return 'pharmaceutical';
  if (numericValue >= 99.5) return 'laboratory';
  if (numericValue >= 99) return 'industrial';
  
  throw new Error('Purity value too low, minimum is 99%');
}

/**
 * 验证纯度值是否在指定等级范围内
 * @param purityValue 纯度值
 * @param grade 等级
 * @returns 是否匹配
 */
function isPurityInGrade(purityValue: string, grade: string): boolean {
  const numericValue = parseFloat(purityValue.replace(/[^\d.]/g, ''));
  const gradeInfo = PURITY_GRADES[grade];
  
  if (!gradeInfo) return false;
  
  return numericValue >= gradeInfo.minValue && numericValue < gradeInfo.maxValue;
}
```

---

## 4. 数据字典

### 4.1 物理形态 (Physical State)
| Key | 中文 | 英文 | 描述 |
|-----|------|------|------|
| powder | 粉末 | Powder | 细小固体颗粒 |
| granular | 颗粒 | Granular | 较大固体颗粒 |
| liquid | 液体 | Liquid | 常温下为液态 |
| gas | 气体 | Gas | 常温下为气态 |
| crystal | 晶体 | Crystal | 有规则结构的固体 |
| block | 块状 | Block | 块状固体 |

### 4.2 纯度等级 (Purity Grade)
| Key | 中文 | 英文 | 纯度范围 | 描述 |
|-----|------|------|----------|------|
| industrial | 工业级 | Industrial | 99% - 99.5% | 一般工业用途 |
| laboratory | 实验室级 | Laboratory | 99.5% - 99.9% | 实验室研究分析 |
| pharmaceutical | 医药级 | Pharmaceutical | 99.9% - 99.95% | 药品生产标准 |
| reagent | 试剂级 | Reagent | 99.95% - 99.99% | 精密分析试剂 |
| electronic | 电子级 | Electronic | 99.99% - 100% | 电子行业专用 |

### 4.3 包装方式 (Packaging Type)
| Key | 中文 | 英文 | 描述 |
|-----|------|------|------|
| drum | 桶 | Drum | 铁桶、塑料桶 |
| bottle | 瓶 | Bottle | 玻璃瓶、塑料瓶 |
| bag | 袋 | Bag | 编织袋、塑料袋 |
| bulk | 散装 | Bulk | 散装运输 |
| box | 箱 | Box | 纸箱、木箱 |
| tank | 罐 | Tank | 储罐、槽罐 |

### 4.4 单位 (Unit)
| Key | 中文 | 英文 | 适用场景 |
|-----|------|------|----------|
| kg | 千克 | Kilogram | 固体 |
| L | 升 | Liter | 液体 |
| g | 克 | Gram | 小量固体 |
| ml | 毫升 | Milliliter | 小量液体 |
| ton | 吨 | Ton | 大批量 |

### 4.5 国家 (Country)
| Key | 中文 | 英文 |
|-----|------|------|
| china | 中国 | China |
| germany | 德国 | Germany |
| usa | 美国 | USA |
| japan | 日本 | Japan |
| india | 印度 | India |
| south_korea | 韩国 | South Korea |
| uk | 英国 | UK |
| france | 法国 | France |

### 4.6 行业标签 (Industry Tags)
| Key | 中文 | 英文 |
|-----|------|------|
| paint | 涂料 | Paint |
| adhesive | 胶粘剂 | Adhesive |
| personal_care | 个人护理 | Personal Care |
| pharmaceutical | 医药 | Pharmaceutical |
| electronics | 电子 | Electronics |
| textile | 纺织 | Textile |
| agriculture | 农业 | Agriculture |
| automotive | 汽车 | Automotive |
| construction | 建筑 | Construction |
| food_beverage | 食品饮料 | Food & Beverage |

### 4.7 应用标签 (Application Tags)
| Key | 中文 | 英文 |
|-----|------|------|
| solvent | 溶剂 | Solvent |
| preservative | 防腐剂 | Preservative |
| dispersant | 分散剂 | Dispersant |
| emulsifier | 乳化剂 | Emulsifier |
| thickener | 增稠剂 | Thickener |
| catalyst | 催化剂 | Catalyst |
| stabilizer | 稳定剂 | Stabilizer |
| drying_agent | 干燥剂 | Drying Agent |
| surfactant | 表面活性剂 | Surfactant |
| antioxidant | 抗氧化剂 | Antioxidant |

### 4.8 价格类型 (Price Type)

**统一价格标准：出厂价（EXW - Ex Works）**

| 定义 | 说明 |
|------|------|
| **EXW (Ex Works)** | 工厂交货价，买方在卖方工厂自提货物，承担所有后续费用和风险 |

**EXW 价格包含内容：**
- ✅ 产品成本
- ✅ 包装成本
- ✅ 国内运输到工厂仓库的费用

**EXW 价格不含内容：**
- ❌ 国际运费
- ❌ 海运保险
- ❌ 目的港卸货费
- ❌ 进口关税
- ❌ 增值税
- ❌ 目的地内陆运输
- ❌ 清关代理费用

**价格示例：**
```
产品：乙醇 (CAS: 64-17-5)
规格：液体 | 工业级 ≥99% | 桶 | kg | 中国
EXW 出厂价：¥200.00/kg

买方需额外承担：
- 国际运费（海运/空运）：约 ¥5-20/kg
- 保险：约 ¥1-3/kg
- 关税：0-10%（根据目的国）
- 增值税：13%（中国）或相应国家税率
- 内陆运输：约 ¥2-5/kg

实际到货成本 ≈ ¥215-250/kg（不含税）
```

**价格计算说明：**
- 所有供应商报价均为 EXW 出厂价
- 买方在询盘时可询问供应商推荐的物流方案
- 平台不提供物流服务，物流由买卖双方自行协商
- 不同国家的供应商 EXW 价格可直接比较，无需换算到岸价

---

## 5. API 接口设计

### 5.1 CAS 检索接口
**Endpoint**: `GET /api/products/lookup`

**请求参数**：
- `cas` (string): CAS 号，支持模糊匹配

**响应示例**：
```json
{
  "success": true,
  "exactMatch": {
    "cas": "64-17-5",
    "nameZh": "乙醇",
    "nameEn": "Ethanol",
    "formula": "C2H6O",
    "structure": "https://coze-coding-project.tos.coze.site/...",
    "industryTags": ["paint", "adhesive", "pharmaceutical"],
    "applicationTags": ["solvent", "preservative", "disinfectant"]
  },
  "suggestions": []
}
```

### 5.2 纯度等级查询接口
**Endpoint**: `GET /api/products/purity-grades`

**响应示例**：
```json
{
  "success": true,
  "grades": [
    {
      "key": "industrial",
      "label": { "zh": "工业级", "en": "Industrial" },
      "range": [99, 99.5],
      "minValue": 99,
      "maxValue": 99.5,
      "description": { "zh": "适用于一般工业用途", "en": "For general industrial use" }
    },
    {
      "key": "laboratory",
      "label": { "zh": "实验室级", "en": "Laboratory" },
      "range": [99.5, 99.9],
      "minValue": 99.5,
      "maxValue": 99.9,
      "description": { "zh": "适用于实验室研究和分析", "en": "For laboratory research and analysis" }
    }
  ]
}
```

### 5.3 SPU 列表接口
**Endpoint**: `GET /api/products/spus`

**请求参数**：
- `search` (string): 搜索关键词（CAS号或名称）
- `industry` (string): 行业标签筛选
- `application` (string): 应用标签筛选
- `page` (int): 页码，默认1
- `limit` (int): 每页数量，默认20

**响应示例**：
```json
{
  "success": true,
  "spus": [
    {
      "cas": "64-17-5",
      "nameZh": "乙醇",
      "nameEn": "Ethanol",
      "formula": "C2H6O",
      "structure": "https://...",
      "industryTags": ["paint", "adhesive", "pharmaceutical"],
      "applicationTags": ["solvent", "preservative", "disinfectant"],
      "description": "无色透明液体，具有特殊香味",
      "supplierCount": 5,
      "priceRange": {
        "min": 180,
        "max": 220,
        "unit": "kg"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### 5.4 规格价格计算接口
**Endpoint**: `POST /api/products/calculate-price`

**请求体**：
```json
{
  "cas": "64-17-5",
  "physicalState": "liquid",
  "purityGrade": "industrial",
  "purityMin": 99.0,
  "purityMax": 99.5,
  "packagingType": "drum",
  "unit": "kg",
  "country": "china"
}
```

**响应示例**：
```json
{
  "success": true,
  "referencePrice": 200.00,
  "priceUnit": "kg",
  "priceType": "EXW (Ex Works)",
  "priceDescription": "出厂价，不含运费、保险、关税等",
  "purityRange": "≥99%",
  "supplierCount": 5,
  "suppliers": [
    {
      "productId": "PROD-001",
      "supplierId": "SUPP-001",
      "supplierName": "某某化工有限公司",
      "supplierCountry": "中国",
      "purityValue": "99.3%",
      "purityGrade": "industrial",
      "price": 200.00,
      "priceType": "EXW",
      "priceDescription": "EXW 出厂价，不含国际运费和保险",
      "stock": 500,
      "moq": 100,
      "deliveryTime": "7天",
      "country": "中国"
    },
    {
      "productId": "PROD-002",
      "supplierId": "SUPP-002",
      "supplierName": "另一化工有限公司",
      "supplierCountry": "德国",
      "purityValue": "99.4%",
      "purityGrade": "industrial",
      "price": 195.00,
      "priceType": "EXW",
      "priceDescription": "EXW 出厂价，不含国际运费和保险",
      "stock": 300,
      "moq": 50,
      "deliveryTime": "5天",
      "country": "德国"
    }
  ]
}
```

### 5.5 产品创建接口
**Endpoint**: `POST /api/products/create`

**请求体**：
```json
{
  "cas": "64-17-5",
  "supplierId": "SUPP-001",
  "physicalState": "liquid",
  "purityGrade": "industrial",
  "purityValue": "99.3%",
  "packagingType": "drum",
  "unit": "kg",
  "country": "china",
  "description": "高纯度乙醇，适用于工业用途",
  "sku": {
    "price": 200.00,
    "priceType": "EXW",
    "stock": 500,
    "moq": 100,
    "deliveryTime": "7天"
  }
}
```

**价格说明**：
- `price`: EXW 出厂价，不含国际运费、保险、关税等
- `priceType`: 固定值为 "EXW"
- 所有供应商统一使用 EXW 价格标准

**响应示例**：
```json
{
  "success": true,
  "product": {
    "id": "PROD-1234567890",
    "cas": "64-17-5",
    "supplierId": "SUPP-001",
    ...
  },
  "message": "Product created successfully",
  "note": "Price is EXW (Ex Works), buyer responsible for shipping, insurance, and import duties"
}
```

---

## 6. 前端页面设计

### 6.1 产品上架页面

#### 第一阶段：核心识别（CAS 号输入）
```
┌─────────────────────────────────────────────────┐
│  Step 1: Product Identification                  │
├─────────────────────────────────────────────────┤
│  CAS Number:                                    │
│  ┌─────────────────────────────────────────┐   │
│  │ [ 64-17-5 ]                          🔍 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ✅ Found in database:                          │
│     - 中文名: 乙醇                              │
│     - English Name: Ethanol                     │
│     - Formula: C2H6O                           │
│     - Structure: [图片预览]                     │
│     - Industry: 涂料, 胶粘剂, 医药              │
│     - Applications: 溶剂, 防腐剂, 消毒剂        │
│                                                 │
│  [Next →]                                       │
└─────────────────────────────────────────────────┘
```

#### 第二阶段：产品规格定义
```
┌─────────────────────────────────────────────────┐
│  Step 2: Product Specification                  │
├─────────────────────────────────────────────────┤
│  Physical State (物理形态):                      │
│  [液体] [粉末] [晶体] [气体] [块状]              │
│                                                 │
│  Purity (纯度):                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [ 99.3 ] %                              │   │
│  │ (系统自动识别为: 工业级)                 │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  或选择预设等级:                                │
│  [ 工业级 ≥99% ] [ 实验室级 ≥99.5% ]          │
│  [ 医药级 ≥99.9% ] [ 试剂级 ≥99.95% ]         │
│  [ 电子级 ≥99.99% ]                            │
│                                                 │
│  Packaging Type (包装方式):                     │
│  [桶] [瓶] [袋] [散装] [箱]                     │
│                                                 │
│  Unit (单位):                                   │
│  [kg] [L] [g] [ml] [吨]                         │
│                                                 │
│  Country (国家):                                │
│  [中国] [德国] [美国] [日本] [印度]             │
│                                                 │
│  Description (可选):                            │
│  ┌─────────────────────────────────────────┐   │
│  │ 高纯度乙醇，适用于工业用途               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [← Previous]  [Next →]                         │
└─────────────────────────────────────────────────┘
```

#### 第三阶段：商业信息
```
┌─────────────────────────────────────────────────┐
│  Step 3: Commercial Information                 │
├─────────────────────────────────────────────────┤
│  💡 价格标准：EXW 出厂价                         │
│     - 不含国际运费、保险、关税等                │
│     - 买方自行承担从工厂到目的地的所有成本      │
│                                                 │
│  Price (出厂价 ¥):                              │
│  ┌─────────────────────────────────────────┐   │
│  │ [ 200.00 ]                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Stock (库存):                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ [ 500 ] kg                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  MOQ (最小起订量):                              │
│  ┌─────────────────────────────────────────┐   │
│  │ [ 100 ] kg                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  Delivery Time (交付时间):                      │
│  ┌─────────────────────────────────────────┐   │
│  │ [ 7 ] days                              │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [← Previous]  [Publish Product]                │
└─────────────────────────────────────────────────┘
```

### 6.2 产品列表页面

```
┌─────────────────────────────────────────────────────┐
│  Products Management                               │
├─────────────────────────────────────────────────────┤
│  [+ Add Product]  [Export]                          │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ Search                                       │   │
│  │ ┌─────────────────────────────────────┐    │   │
│  │ │ [ 乙醇 ]                    🔍      │    │   │
│  │ └─────────────────────────────────────┘    │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Filters:                                            │
│  Industry: [☑ 涂料] [☑ 胶粘剂] [☐ 个人护理]          │
│  Application: [☑ 溶剂] [☐ 防腐剂] [☐ 分散剂]         │
│  Price Range (EXW): [¥0] - [¥1000] / kg             │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │ 乙醇 (CAS: 64-17-5)                         │   │
│  │ C2H6O | [结构图]                            │   │
│  │ 行业: 涂料, 胶粘剂, 医药                     │   │
│  │ 用途: 溶剂, 防腐剂, 消毒剂                  │   │
│  │ 供应商: 5家 | EXW 价格: ¥180-220/kg         │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  Showing 1 of 1 SPU                                 │
└─────────────────────────────────────────────────────┘
```

### 6.3 产品详情页面（规格选择）

```
┌─────────────────────────────────────────────────┐
│  产品详情: 乙醇 (CAS: 64-17-5)                   │
├─────────────────────────────────────────────────┤
│  基础信息:                                      │
│  中文名: 乙醇 | 英文名: Ethanol                  │
│  分子式: C2H6O                                  │
│  [结构图预览]                                   │
│                                                 │
│  行业: 涂料, 胶粘剂, 医药, 个人护理             │
│  用途: 溶剂, 防腐剂, 消毒剂, 分散剂             │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  规格选择                              │   │
│  ├─────────────────────────────────────────┤   │
│  │  形态: [液体] [粉末] [晶体]            │   │
│  │                                         │   │
│  │  纯度:                                  │   │
│  │  [ 工业级 ≥99% ]                        │   │
│  │  [ 实验室级 ≥99.5% ]                    │   │
│  │  [ 医药级 ≥99.9% ]                      │   │
│  │  [ 试剂级 ≥99.95% ]                     │   │
│  │  [ 电子级 ≥99.99% ]                     │   │
│  │                                         │   │
│  │  包装方式: [桶] [瓶] [袋] [散装]        │   │
│  │                                         │   │
│  │  单位: [kg] [L] [g] [ml]                │   │
│  │                                         │   │
│  │  国家: [中国] [德国] [美国] [日本]      │   │
│  │                                         │   │
│  │  参考价格: ¥200.00/kg                   │   │
│  │  (EXW 出厂价，基于5个供应商的平均价)    │   │
│  │  💡 不含国际运费、保险、关税等          │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [查看供应商详情] [发起询盘]                     │
└─────────────────────────────────────────────────┘
```

### 6.4 供应商列表页面

```
┌─────────────────────────────────────────────────┐
│  匹配的供应商 (5家)                              │
├─────────────────────────────────────────────────┤
│  规格: 液体 | 工业级 ≥99% | 桶 | kg | 中国      │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  某某化工有限公司 | 中国                   │   │
│  │  纯度: 99.3%                              │   │
│  │  EXW 出厂价: ¥200/kg                     │   │
│  │  库存: 500kg | MOQ: 100kg | 交付: 7天    │   │
│  │  💡 不含国际运费和保险                    │   │
│  │  [查看详情] [发起询盘]                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │  另一化工有限公司 | 德国                   │   │
│  │  纯度: 99.4%                              │   │
│  │  EXW 出厂价: ¥195/kg                     │   │
│  │  库存: 300kg | MOQ: 50kg | 交付: 5天     │   │
│  │  💡 不含国际运费和保险                    │   │
│  │  [查看详情] [发起询盘]                   │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [返回] [批量询盘]                              │
└─────────────────────────────────────────────────┘
```

**价格说明提示**：
- 买方需自行承担从供应商工厂到目的地的所有物流成本
- 国际运费约 ¥5-20/kg（根据目的地）
- 海运保险约 ¥1-3/kg
- 进口关税根据目的国法规收取
- 建议买方在询盘时询问供应商推荐的物流方案

---

## 7. 业务流程

### 7.1 产品上架流程
```
供应商登录
  ↓
进入产品上架页面
  ↓
输入 CAS 号
  ↓
系统检索 chemical_base
  ├─ 存在 → 自动回显基础信息（只读）
  └─ 不存在 → 手动输入基础信息 → 保存到 chemical_base
  ↓
选择产品规格
  ├─ 物理形态：液体、粉末、晶体等
  ├─ 纯度：输入具体值或选择等级
  │   ├─ 输入 99.3% → 系统识别为工业级
  │   └─ 选择工业级 → 系统填充 ≥99%
  ├─ 包装方式：桶、瓶、袋等
  ├─ 单位：kg、L、g等
  └─ 国家：中国、德国等
  ↓
填写商业信息（EXW 出厂价）
  ├─ 价格（EXW 出厂价，不含运费、保险、关税等）
  ├─ 库存
  ├─ MOQ
  └─ 交付时间
  ↓
确认并发布
  ↓
保存到 products 和 product_skus 表
```

### 7.2 产品搜索流程
```
用户搜索/浏览产品
  ├─ 按 CAS 号精确搜索
  └─ 按名称模糊搜索
  ↓
应用筛选条件
  ├─ 行业标签筛选
  ├─ 应用标签筛选
  └─ 价格范围筛选
  ↓
显示 SPU 列表
  ├─ 基本信息：名称、CAS、分子式
  ├─ 标签：行业、应用
  └─ 汇总：供应商数量、价格范围
  ↓
用户点击 SPU
  ↓
进入产品详情页
  ↓
选择规格组合
  ├─ 形态、纯度、包装、单位、国家
  └─ 实时计算参考价格（均价）
  ↓
查看供应商列表
  ├─ 按价格排序
  ├─ 按库存排序
  └─ 按交付时间排序
  ↓
选择最优供应商
  ↓
发起询盘
```

### 7.3 参考价格计算流程
```
用户选择规格组合
  ↓
系统查询匹配的产品
  WHERE cas = '64-17-5'
    AND physical_state = 'liquid'
    AND purity_grade = 'industrial'
    AND packaging_type = 'drum'
    AND unit = 'kg'
    AND country = 'china'
    AND purity_value BETWEEN 99.0 AND 99.5
  ↓
获取所有匹配供应商的价格
  ↓
计算平均价格（EXW 出厂价）
  avg_price = sum(price) / count(suppliers)
  ↓
显示参考价格
  "¥200.00/kg EXW 出厂价 (基于5个供应商的平均价)"
  "不含国际运费、保险、关税等"
  ↓
显示供应商列表
  按价格升序排列
```

---

## 8. 技术方案

### 8.1 前端技术栈
- **框架**: Next.js 16 (App Router)
- **UI 组件**: shadcn/ui
- **表单管理**: React Hook Form + Zod
- **状态管理**: Zustand
- **国际化**: next-intl
- **类型**: TypeScript

### 8.2 后端技术栈
- **API**: Next.js API Routes
- **数据库**: PostgreSQL (Drizzle ORM)
- **数据验证**: Zod
- **类型**: TypeScript

### 8.3 关键技术实现

#### 8.3.1 纯度等级自动识别
```typescript
// 前端组件
const PurityInput = ({ value, onChange }) => {
  const [purityValue, setPurityValue] = useState(value);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPurityValue(newValue);
    
    // 实时计算等级
    try {
      const grade = calculatePurityGrade(newValue);
      onChange({ purityValue: newValue, purityGrade: grade });
    } catch (error) {
      // 无效值，不更新
    }
  };
  
  return (
    <div>
      <input
        type="text"
        value={purityValue}
        onChange={handleChange}
        placeholder="99.3"
      />
      <span className="text-sm text-gray-500">
        系统识别: {getGradeLabel(purityGrade)}
      </span>
    </div>
  );
};
```

#### 8.3.2 规格价格计算
```typescript
// API 路由
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { cas, physicalState, purityGrade, packagingType, unit, country } = body;
  
  // 查询匹配的产品
  const products = await db
    .select()
    .from(productsTable)
    .where(
      and(
        eq(productsTable.cas, cas),
        eq(productsTable.physicalState, physicalState),
        eq(productsTable.purityGrade, purityGrade),
        eq(productsTable.packagingType, packagingType),
        eq(productsTable.unit, unit),
        eq(productsTable.country, country)
      )
    );
  
  // 获取 SKU 信息
  const skus = await db
    .select()
    .from(productSkusTable)
    .where(inArray(productSkusTable.productId, products.map(p => p.id)));
  
  // 合并数据
  const suppliers = products.map((product, index) => ({
    ...product,
    ...skus[index],
  }));
  
  // 计算平均价格
  const totalPrice = suppliers.reduce((sum, s) => sum + s.price, 0);
  const averagePrice = suppliers.length > 0 ? totalPrice / suppliers.length : 0;
  
  return NextResponse.json({
    success: true,
    referencePrice: averagePrice,
    supplierCount: suppliers.length,
    suppliers: suppliers.sort((a, b) => a.price - b.price),
  });
}
```

#### 8.3.3 数据验证
```typescript
const productSchema = z.object({
  cas: z.string().regex(/^\d{2,7}-\d{2}-\d$/, 'Invalid CAS format'),
  supplierId: z.string().min(1, 'Supplier ID is required'),
  physicalState: z.enum(['powder', 'granular', 'liquid', 'gas', 'crystal', 'block']),
  purityValue: z.string().regex(/^[\d.]+%$/, 'Invalid purity format'),
  purityGrade: z.enum(['industrial', 'laboratory', 'pharmaceutical', 'reagent', 'electronic']),
  packagingType: z.enum(['drum', 'bottle', 'bag', 'bulk', 'box', 'tank']),
  unit: z.enum(['kg', 'L', 'g', 'ml', 'ton']),
  country: z.enum(['china', 'germany', 'usa', 'japan', 'india']),
  sku: z.object({
    price: z.number().positive('Price must be positive').describe('EXW 出厂价，不含运费、保险、关税等'),
    stock: z.number().int().min(0),
    moq: z.number().int().positive('MOQ must be positive'),
  }),
});

// 验证纯度值与等级匹配
const validatePurityMatch = (purityValue: string, purityGrade: string): boolean => {
  const numericValue = parseFloat(purityValue.replace(/[^\d.]/g, ''));
  const gradeInfo = PURITY_GRADES[purityGrade];
  
  return numericValue >= gradeInfo.minValue && numericValue < gradeInfo.maxValue;
};
```

---

## 9. 用户权限与角色

### 9.1 角色定义
- **供应商 (SUPPLIER)**: 可以创建和管理自己的产品
- **管理员 (ADMIN)**: 可以管理所有产品和供应商
- **普通用户 (USER)**: 只能浏览、搜索和询盘

### 9.2 权限矩阵
| 操作 | SUPPLIER | ADMIN | USER |
|------|----------|-------|------|
| 创建产品 | ✅ | ✅ | ❌ |
| 编辑产品 | ✅ (仅自己) | ✅ | ❌ |
| 删除产品 | ✅ (仅自己) | ✅ | ❌ |
| 查看所有产品 | ✅ | ✅ | ✅ |
| 发起询盘 | ✅ | ❌ | ✅ |
| 查看供应商信息 | ✅ | ✅ | ✅ |

---

## 10. 未来扩展

### 10.1 计划功能
- **批量导入**: 支持 Excel 批量上传产品
- **价格预警**: 供应商价格变动通知
- **库存同步**: 自动同步库存状态
- **智能推荐**: 基于历史推荐相关产品
- **竞品分析**: 查看同规格其他供应商价格
- **价格趋势**: 显示产品历史价格变化
- **供应商评级**: 基于交易记录的供应商信誉评分

### 10.2 性能优化
- **CAS 号缓存**: Redis 缓存热门化学品信息
- **分页加载**: 产品列表无限滚动
- **图片压缩**: 自动压缩产品图片
- **搜索优化**: Elasticsearch 全文搜索
- **CDN 加速**: 静态资源 CDN 加速

### 10.3 功能增强
- **规格模板**: 供应商保存常用规格组合
- **一键复制**: 快速复制产品并修改规格
- **批量编辑**: 批量修改产品价格、库存
- **询盘模板**: 常用询盘消息模板
- **订单管理**: 直接生成订单和付款

---

## 11. 附录

### 11.1 CAS 号格式
CAS 号格式：`NNNNNN-NN-N`
- 第一部分：最多 7 位数字（0-9）
- 第二部分：2 位数字
- 第三部分：1 位数字（校验码）

示例：`64-17-5`

### 11.2 纯度梯度计算公式
```typescript
// 纯度等级识别
if (purity >= 99.99) return 'electronic';
if (purity >= 99.95) return 'reagent';
if (purity >= 99.9) return 'pharmaceutical';
if (purity >= 99.5) return 'laboratory';
if (purity >= 99) return 'industrial';

// 纯度值标准化
function normalizePurityValue(value: string): string {
  const numericValue = parseFloat(value.replace(/[^\d.]/g, ''));
  
  if (numericValue >= 99.99) return `≥99.99%`;
  if (numericValue >= 99.95) return `≥99.95%`;
  if (numericValue >= 99.9) return `≥99.9%`;
  if (numericValue >= 99.5) return `≥99.5%`;
  if (numericValue >= 99) return `≥99%`;
  
  return `${numericValue}%`;
}
```

### 11.3 参考资源
- [CAS Registry Number](https://www.cas.org/cas-data/cas-registry)
- [Chemical Structure Visualization](https://www.chemspider.com/)
- [化工产品分类标准](https://www.customs.gov.cn/)

---

**文档版本**: v2.0
**最后更新**: 2025-02-08
**维护者**: Chemicaloop Team

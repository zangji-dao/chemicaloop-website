# CHEMICALOOP 管理后台功能设计文档 v2.7

## 📋 目录
- [1. 系统架构](#1-系统架构)
- [2. 用户角色定义](#2-用户角色定义)
- [3. 用户注册流程](#3-用户注册流程)
- [4. 产品管理系统](#4-产品管理系统)
- [5. 询盘系统（核心）](#5-询盘系统核心)
- [6. 代理功能模块](#6-代理功能模块)
- [7. 管理后台模块](#7-管理后台模块)
- [8. 数据统计分析](#8-数据统计分析)
- [9. 付费功能预留（暂不实现）](#9-付费功能预留暂不实现)
- [10. 技术实现建议](#10-技术实现建议)
- [11. 分阶段实施计划](#11-分阶段实施计划)

---

## 1. 系统架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                  CHEMICALOOP 系统架构 v2.0                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   前端展示网站    │         │    管理后台       │          │
│  │  (Next.js 16)    │         │  (Next.js 16)    │          │
│  │  - 首页/产品      │         │  - 管理面板       │          │
│  │  - 询盘功能      │         │  - 代理审核       │          │
│  │  - 用户个人中心  │         │  - 数据统计       │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│           ┌──────────▼──────────┐                            │
│           │   后端 API 服务     │                            │
│           │  (Node.js + Express)│                            │
│           │  - 用户认证         │                            │
│           │  - 询盘管理         │                            │
│           │  - 产品管理         │                            │
│           │  - 权限验证         │                            │
│           └──────────┬──────────┘                            │
│                      │                                       │
│           ┌──────────▼──────────┐                            │
│           │   PostgreSQL 数据库  │                            │
│           └─────────────────────┘                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 核心业务流程

```
【注册流程】
用户注册 → 创建USER账户 → 自动登录 → 浏览平台

【代理申请流程】
已登录用户 → 访问代理招募页面 → 填写申请表单 → 提交审核 → 管理员审核 → 成为代理

【普通用户通过专属链接访问】
用户通过专属链接访问 → 浏览产品 → 查看产品详情（显示：代理：专属链接的代理）→ 发起询盘 → 询盘发给【专属链接的代理】→ 专属链接的代理联系【产品上架的代理】→ 专属链接的代理回复给客户 → 线下成交

【代理用户浏览产品】
代理登录 → 浏览产品 → 查看产品详情（显示：所有供应商列表，仅代理可见）→ 自主选择向哪个代理询盘 → 发起询盘 → 询盘发给【选中的产品上架代理】→ 两个代理通过平台内询盘系统沟通 → 线下成交

【普通用户直接访问网站（无专属链接）】
用户直接访问网站 → 浏览产品 → 查看产品详情（显示：代理：平台直营）→ 发起询盘 → 询盘发给【平台直营代理】→ 平台直营代理回复或联系产品上架代理 → 线下成交（平台赚取差价）

【平台直营代理】
系统初始化时自动创建 → 特殊代理账户 → 可以上架产品 → 可以接收平台默认询盘 → 拥有特殊权限（编辑所有产品、管理员权限等）

### 1.3 前端路由结构

#### 前台网站路由
```
/                           # 首页
/products                   # 产品列表
/products/:id               # 产品详情（含供应商列表）
/trading                    # 购销信息
/agent                      # 代理招募介绍页
/agent/apply                # 代理申请页面（需登录）
/contact                    # 联系我们
/user/profile               # 用户个人中心（需登录）
/user/inquiries             # 我的询盘（需登录）
/user/agent-application     # 我的代理申请（需登录）
```

#### 管理后台路由
```
/admin                      # 管理后台首页（需超级管理员权限）
/admin/dashboard            # 数据看板
/admin/users                # 用户管理
/admin/agents               # 代理管理
/admin/products             # 产品管理
/admin/inquiries            # 询盘管理
/admin/settings             # 系统设置
/admin/logs                 # 操作日志
```

#### 代理门户路由
```
/agent/portal               # 代理门户首页
/agent/dashboard            # 代理数据看板
/agent/products             # 我的产品
/agent/inquiries            # 我的询盘
/agent/customers            # 我的客户
/agent/link                 # 专属链接生成
/agent/profile              # 代理资料设置
```

---

## 2. 用户角色定义

### 2.1 角色层级（简化版）

| 角色代码 | 角色名称 | 权限级别 | 登录后台 | 访问范围 | 特殊标识 | 创建方式 |
|---------|---------|---------|---------|---------|---------|---------|
| `SUPER_ADMIN` | 超级管理员 | Level 1 | ✅ 是 | 全部功能 | - | 系统初始化 |
| `OPERATOR` | 运营管理员 | Level 1.2 | ✅ 是 | 管理后台+运营功能 | - | 超级管理员创建 |
| `PLATFORM_AGENT` | 平台直营代理 | Level 1.5 | ✅ 是 | 代理门户+管理功能 | `is_platform_agent: true` | 超级管理员创建 |
| `AGENT` | 平台贸易代理 | Level 2 | ✅ 是 | 代理门户 | - | 申请审核 |
| `USER` | 普通用户 | Level 3 | ❌ 否 | 前台功能 | - | 自助注册 |

### 2.2 角色详细说明

#### 2.2.1 超级管理员 (SUPER_ADMIN)
- **描述**：系统最高权限拥有者，通常1-3人
- **权限**：
  - 管理所有用户（包括运营管理员和平台直营代理）
  - 创建和管理运营管理员账号
  - 创建和管理平台直营代理账号
  - 审核代理申请
  - 查看所有数据统计
  - 系统配置管理
  - 查看操作日志
  - 管理产品（全部）
- **创建方式**：系统初始化时默认创建（默认账号：admin）

#### 2.2.2 运营管理员 (OPERATOR)
- **描述**：负责网站日常运营管理的人员
- **权限**：
  - 管理网站素材（Banner、轮播图、新闻、公告）
  - 产品上下架审核和管理
  - 多语言翻译内容管理
  - 网站配置管理（SEO、社交媒体链接等）
  - 查看运营数据统计
  - 管理用户和代理（查看和编辑，不可删除超级管理员）
- **创建方式**：仅由超级管理员创建
- **数量**：无限制，按需创建

#### 2.2.3 平台直营代理 (PLATFORM_AGENT)
- **描述**：代表平台直接参与贸易的特殊代理账户
- **特殊属性**：
  - `is_platform_agent: true`（标识为平台代理）
  - `agent_code`：唯一标识符（由超级管理员指定）
  - 支持多个，每个可配置负责的地区和产品类别
  - 不可禁用，只能由超级管理员删除
- **权限**：
  - 拥有普通代理的所有权限
  - 可以上架平台直营产品
  - 接收无专属链接用户的询盘（按规则分配）
  - 可以编辑所有产品（特殊权限）
  - 可以查看所有询盘统计数据
- **创建方式**：仅由超级管理员创建
- **数量**：支持多个，按地区和产品类别配置
- **分配规则**：
  1. **第一优先级**：地区（根据用户注册地区或IP定位）
  2. **第二优先级**：产品类别（根据产品所属类别）
  3. **默认兜底**：当无法匹配时，分配给默认平台直营代理
- **作用**：
  - 作为平台的贸易窗口
  - 接收平台默认询盘（无专属链接用户）
  - 平台直接赚取差价
  - 保护平台利益
  - 按地区和产品线分流，提升服务效率

#### 2.2.4 平台贸易代理 (AGENT)
- **描述**：负责上架产品、接收询盘、线下交易的合作伙伴
- **权限**：
  - 上架和管理自己的产品
  - 生成和管理专属推广链接
  - 接收和回复询盘
  - 查看自己的询盘统计
  - 管理客户信息
  - 自定义联系信息（绑定到专属链接）
  - 查看所有供应商列表（仅代理可见）
  - 向其他代理发起询盘
- **数量**：无限制
- **创建方式**：用户申请 → 超级管理员审核 → 成为代理

#### 2.2.5 普通用户 (USER)
- **描述**：网站的最终用户，浏览产品、发起询盘
- **权限**：
  - 浏览网站内容
  - 搜索和筛选产品
  - 查看产品详情（显示专属链接的代理或平台直营）
  - 发起询盘（仅能发给专属链接的代理或平台直营）
  - 查看自己的询盘历史
  - 修改个人资料
  - 申请成为代理
- **数量**：无限制
- **创建方式**：自助注册

### 2.3 用户类型与产品详情页显示

| 用户类型 | 代理信息显示 | 联系方式显示 | 价格显示 | 询盘发给 |
|---------|------------|------------|---------|---------|
| 普通用户 | ❌ 不显示 | ❌ 不显示 | ✅ 参考价格（均价，去掉最高最低）<br>✅ 各等级参考价格 | 专属链接的代理 或 平台直营代理 |
| 代理用户 | ✅ 显示所有供应商列表（仅代理可见） | ✅ 显示每个代理的联系方式 | ✅ 显示每个代理的具体价格 | 选中的产品上架代理 |

**产品详情页展示逻辑详细说明**：

#### 普通用户看到的内容：
- ✅ 产品基本信息（名称、描述、规格、CAS号等）
- ✅ 产品图片
- ✅ **参考价格**（所有代理均价，去掉最高最低）
- ✅ **各等级参考价格**（如有等级，如：工业级、试剂级、医药级）
- ✅ 询盘按钮（发起询盘给对应的代理）
- ❌ 不显示代理信息
- ❌ 不显示联系方式

#### 代理用户看到的内容：
- ✅ 产品基本信息（名称、描述、规格、CAS号等）
- ✅ 产品图片
- ✅ **所有供应商列表**（仅代理可见）：
  - 代理公司名称
  - 代理联系方式（邮箱、电话、WhatsApp）
  - 每个代理的具体价格
  - 产品等级信息
- ✅ 向特定代理发起询盘的按钮

#### 参考价格计算规则：
1. 收集该产品所有代理的报价
2. 如果有多个等级，按等级分组
3. 对每个等级的价格：
   - 排序
   - 去掉最高价
   - 去掉最低价
   - 计算剩余价格的平均值
4. 如果该等级只有1-2个报价，显示范围而非均价

**示例**：
- 产品：乙醇（Ethanol）
- 等级：试剂级、工业级
- 试剂级报价：$800, $850, $900, $950, $1000
  - 去掉最高最低：$850, $900, $950
  - 均价：$900
- 工业级报价：$500, $550, $600, $650
  - 去掉最高最低：$550, $600
  - 均价：$575
- 普通用户显示：
  - 试剂级参考价格：$900
  - 工业级参考价格：$575

---

## 3. 用户注册流程

### 3.1 注册流程图

```
┌─────────┐
│ 用户访问 │
│ 注册页面 │
└────┬────┘
     │
     ▼
┌─────────────────┐
│ 输入邮箱        │
│ - 点击发送验证码 │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 系统发送验证码  │
│ 到用户邮箱      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 用户填写注册信息│
│ - 用户名        │
│ - 邮箱（已填写） │
│ - 验证码（6位）  │
│ - 密码          │
│ - 确认密码      │
│ - 基本信息      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 同意条款        │
│ - 服务条款      │
│ - 隐私政策      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 提交注册        │
│ - 验证验证码    │
│ - 验证邮箱唯一性│
│ - 创建用户账户  │
└────┬────────────┘
     │
     ├────────────┐
     │            │
     ▼            ▼
┌────────┐  ┌────────────┐
│注册成功│  │注册失败    │
│发送邮件│  │显示错误    │
│自动登录│  │            │
└───┬────┘  └────────────┘
    │
    ▼
┌─────────────────┐
│ 跳转到首页      │
└─────────────────┘

【可选：后续申请成为代理】

用户登录 → 访问代理招募页面 → 查看代理介绍 → 点击"申请成为代理" → 填写代理申请表单 → 提交审核 → 等待管理员审核 → 审核结果通知

### 3.2 注册字段定义

#### 3.2.1 用户注册字段
```typescript
interface RegisterRequest {
  // 账号信息
  username: string;          // 用户名（唯一）
  email: string;             // 邮箱（唯一，用于登录）
  emailVerificationCode: string;  // 邮箱验证码（6位数字）
  password: string;          // 密码（加密存储）
  confirmPassword: string;   // 确认密码
  
  // 个人信息
  firstName: string;         // 名
  lastName: string;          // 姓
  phone?: string;            // 手机号（可选）
  country: string;           // 国家（ISO代码）
  
  // 同意条款
  agreeTerms: boolean;       // 同意服务条款
  agreePrivacy: boolean;     // 同意隐私政策
}
```

**注意**：
- 注册时固定创建USER角色，无需选择角色类型
- `emailVerificationCode` 必须正确才能注册成功
- 验证码有效期为10分钟

#### 3.2.2 代理申请字段（通过代理招募页面提交）
```typescript
interface AgentApplicationRequest {
  // 必须是已登录用户
  userId: string;  // 自动从当前登录用户获取
  
  // 公司信息
  companyName: string;       // 公司名称
  companyType: string;       // 公司类型（个人/企业）
  businessLicense?: string;  // 营业执照（上传文件）
  
  // 经营信息
  businessScope: string[];   // 经营范围（多选）
  mainProducts: string[];    // 主要经营产品
  
  // 联系信息（用于专属链接）
  contactEmail: string;      // 联系邮箱
  contactPhone: string;      // 联系电话
  contactAddress: string;    // 联系地址
  contactWhatsApp?: string;  // WhatsApp（可选）
  
  // 其他
  experience: string;        // 从业经验描述
  
  // 推荐人（可选）
  referrerCode?: string;     // 推荐人代理码
}
```

### 3.3 注册验证规则

```typescript
// 用户名验证
username: {
  required: true,
  minLength: 4,
  maxLength: 20,
  pattern: /^[a-zA-Z0-9_]+$/,
  unique: true
}

// 邮箱验证
email: {
  required: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  unique: true
}

// 密码验证
password: {
  required: true,
  minLength: 8,
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
  match: 'confirmPassword'
}

// 公司名称验证
companyName: {
  required: true,
  minLength: 2,
  maxLength: 100
}
```

### 3.4 注册后处理

#### 3.4.1 用户注册
1. 创建用户记录（角色 = USER）
2. 发送欢迎邮件
3. 自动登录并跳转到首页
4. 提示用户可以访问代理招募页面申请成为代理（可选）

#### 3.4.2 代理申请流程

**访问路径**：`/agent/apply` （代理招募页面）

**流程**：
1. 用户登录后访问 `/agent/apply`
2. 查看代理介绍和申请条件
3. 点击"申请成为代理"按钮
4. 填写代理申请表单（公司信息、经营信息、联系方式等）
5. 提交申请
6. 创建代理申请记录（状态 = PENDING）
7. 发送确认邮件
8. 通知超级管理员审核
9. 跳转到"申请已提交"页面
10. 用户可以在"个人中心 > 我的申请"中查看审核进度

**审核结果**：
- 通过：创建AGENT角色，发送欢迎邮件，代理可以登录代理门户
- 拒绝：发送拒绝通知，用户可以重新申请

---

## 4. 产品管理系统

### 4.1 产品数据结构

#### 4.1.1 产品信息模板（Product Template）

**定义**：由运营管理员创建的产品信息模板，规范代理上架产品时的字段结构和填写要求。

**用途**：
- 标准化产品信息展示
- 确保关键信息完整性
- 支持不同产品类别的差异化模板

**模板数据结构**：

```typescript
interface ProductTemplate {
  id: string;
  templateName: string;           // 模板名称（如：有机溶剂模板、无机化学品模板）
  category: string;               // 适用产品类别
  description: string;            // 模板描述

  // 模板字段配置
  fields: TemplateField[];

  // 默认产品等级配置
  defaultGrades?: ProductGrade[];

  // 状态
  isActive: boolean;              // 是否启用
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;              // 创建者（运营管理员）
}

interface TemplateField {
  fieldKey: string;               // 字段标识（如：purity, concentration）
  fieldName: string;              // 字段显示名称（多语言支持）
  fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'DATE' | 'RICH_TEXT';
  isRequired: boolean;            // 是否必填
  placeholder?: string;           // 占位符
  defaultValue?: any;             // 默认值

  // SELECT/MULTI_SELECT 专用
  options?: Array<{
    value: string;
    label: string;                // 多语言支持
  }>;

  // 验证规则
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };

  // 显示顺序
  order: number;
}

interface ProductGrade {
  gradeId: string;                // 等级ID（如：REAGENT, INDUSTRIAL, PHARMACEUTICAL）
  gradeName: string;              // 等级名称（如：试剂级、工业级、医药级）
  gradeCode: string;              // 等级代码（如：GR, IR, PH）
  description?: string;           // 等级描述
  isActive: boolean;              // 是否启用
}
```

**模板示例**：

```typescript
// 有机溶剂模板
{
  templateName: "有机溶剂模板",
  category: "solvents",
  description: "适用于有机溶剂类产品的标准模板",

  fields: [
    {
      fieldKey: "purity",
      fieldName: "纯度",
      fieldType: "SELECT",
      isRequired: true,
      options: [
        { value: "≥99%", label: "≥99%" },
        { value: "≥99.5%", label: "≥99.5%" },
        { value: "≥99.9%", label: "≥99.9%" },
        { value: "≥99.99%", label: "≥99.99%" }
      ],
      order: 1
    },
    {
      fieldKey: "moisture",
      fieldName: "水分",
      fieldType: "NUMBER",
      isRequired: true,
      placeholder: "请输入水分含量（%）",
      validation: { min: 0, max: 100 },
      order: 2
    },
    {
      fieldKey: "appearance",
      fieldName: "外观",
      fieldType: "TEXT",
      isRequired: true,
      placeholder: "如：无色透明液体",
      order: 3
    }
  ],

  defaultGrades: [
    {
      gradeId: "REAGENT",
      gradeName: "试剂级",
      gradeCode: "GR",
      description: "符合试剂级标准",
      isActive: true
    },
    {
      gradeId: "INDUSTRIAL",
      gradeName: "工业级",
      gradeCode: "IR",
      description: "符合工业级标准",
      isActive: true
    }
  ]
}
```

#### 4.1.2 产品数据结构（更新版）

```typescript
interface Product {
  id: string;
  agentId: string;           // 关联的代理ID
  templateId: string;        // 使用的模板ID

  // 产品基本信息
  name: string;              // 产品名称
  displayName?: string;      // 显示名称（代理可自定义）
  description: string;       // 产品描述
  category: string;          // 产品分类
  subcategory?: string;      // 子分类

  // CAS号（化学产品唯一标识）
  casNumber?: string;        // CAS号（可选，用于化学产品）

  // 根据模板填写的详细信息
  specifications: Record<string, any>;  // 动态字段（基于模板）

  // 应用领域和包装
  applications: string[];    // 应用领域
  packaging: string;         // 包装方式
  deliveryTime: string;      // 交付时间

  // 价格信息（支持多等级）
  currency: string;          // 货币（USD/CNY/EUR等）
  minOrder: number;          // 最小起订量
  unit: string;              // 单位（KG/TON等）

  // 分级价格
  gradePrices: ProductGradePrice[];  // 各等级价格

  // 媒体资源
  images: string[];          // 产品图片URL数组
  documents?: string[];      // 产品文档（COA, MSDS等）

  // 参考价格（系统自动计算）
  referencePrices?: ReferencePrice[];  // 参考价格（用于普通用户显示）

  // 审核状态
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;       // 审核人ID
  reviewedAt?: Date;
  reviewNotes?: string;

  // 统计数据
  stats: {
    views: number;           // 浏览量
    inquiries: number;       // 询盘数
    clickRate: number;       // 点击率
  };

  createdAt: Date;
  updatedAt: Date;
}

interface ProductGradePrice {
  gradeId: string;           // 等级ID（从模板获取）
  gradeName: string;         // 等级名称
  price: number;             // 该等级的单价
  currency: string;          // 货币

  // 价格阶梯（可选）
  priceRanges?: Array<{
    minQty: number;
    maxQty?: number;
    price: number;
  }>;

  // 库存信息
  stockQuantity?: number;    // 库存量
  isAvailable: boolean;      // 是否有货
}

interface ReferencePrice {
  gradeId: string;           // 等级ID
  gradeName: string;         // 等级名称
  referencePrice: number;    // 参考价格（均价，去掉最高最低）
  currency: string;          // 货币
  priceRange?: {             // 价格范围（报价过少时显示）
    min: number;
    max: number;
  };
  supplierCount: number;     // 供应商数量
}
```

#### 4.1.3 参考价格计算逻辑

**算法说明**：

```typescript
// 计算产品的参考价格（按等级分组）
async function calculateReferencePrices(productId: string): Promise<ReferencePrice[]> {
  // 步骤1：获取该产品的所有已上架版本
  const products = await getApprovedProductsByNameOrId(productId);

  // 步骤2：按等级分组
  const gradeGroups = new Map<string, Product[]>();

  products.forEach(product => {
    product.gradePrices.forEach(gradePrice => {
      if (!gradeGroups.has(gradePrice.gradeId)) {
        gradeGroups.set(gradePrice.gradeId, []);
      }
      gradeGroups.get(gradePrice.gradeId)?.push({
        ...product,
        currentGradePrice: gradePrice
      });
    });
  });

  // 步骤3：计算每个等级的参考价格
  const referencePrices: ReferencePrice[] = [];

  for (const [gradeId, gradeProducts] of gradeGroups) {
    const prices = gradeProducts.map(p => p.currentGradePrice.price).filter(p => p > 0);

    // 如果只有1-2个报价，显示范围
    if (prices.length <= 2) {
      referencePrices.push({
        gradeId,
        gradeName: gradeProducts[0].currentGradePrice.gradeName,
        referencePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        currency: gradeProducts[0].currentGradePrice.currency,
        priceRange: {
          min: Math.min(...prices),
          max: Math.max(...prices)
        },
        supplierCount: prices.length
      });
      continue;
    }

    // 去掉最高和最低，计算均价
    prices.sort((a, b) => a - b);
    const trimmedPrices = prices.slice(1, -1);  // 去掉第一个（最低）和最后一个（最高）

    const averagePrice = trimmedPrices.reduce((a, b) => a + b, 0) / trimmedPrices.length;

    referencePrices.push({
      gradeId,
      gradeName: gradeProducts[0].currentGradePrice.gradeName,
      referencePrice: averagePrice,
      currency: gradeProducts[0].currentGradePrice.currency,
      supplierCount: prices.length
    });
  }

  return referencePrices;
}
```

**计算示例**：

```
产品：乙醇（Ethanol）
已上架产品：3个代理

代理A：
  - 试剂级：$800
  - 工业级：$500

代理B：
  - 试剂级：$900
  - 工业级：$550

代理C：
  - 试剂级：$1000
  - 工业级：$600

计算结果：

试剂级：
  - 价格列表：[800, 900, 1000]
  - 去掉最高最低：[900]
  - 参考价格：$900

工业级：
  - 价格列表：[500, 550, 600]
  - 去掉最高最低：[550]
  - 参考价格：$550

普通用户看到：
  - 试剂级参考价格：$900
  - 工业级参考价格：$550
```

### 4.2 产品上架流程（更新版）

#### 4.2.1 代理上架产品流程

```
┌─────────────────┐
│ 代理访问        │
│ "上传产品"页面  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 选择产品类别    │
│ （如：有机溶剂）│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 系统自动匹配    │
│ 对应的模板      │
│ （由运营管理员  │
│  预先配置）     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 填写产品基本信息│
│ - 产品名称      │
│ - 产品描述      │
│ - CAS号（可选） │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 根据模板填写    │
│ 产品详细信息    │
│ （动态字段）    │
│ - 纯度          │
│ - 水分          │
│ - 外观          │
│ - ...           │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 配置产品等级    │
│ （从模板获取）  │
│ ☑ 试剂级        │
│ ☑ 工业级        │
│ ☐ 医药级        │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 为每个等级      │
│ 设置价格        │
│ - 试剂级：$900  │
│ - 工业级：$550  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 上传产品图片    │
│ 和文档          │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 提交审核        │
│ 状态：PENDING   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 等待运营管理员  │
│ 审核通过        │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 审核通过        │
│ 状态：APPROVED  │
│ 产品上架成功    │
│ 参考价格自动    │
│ 重新计算        │
└─────────────────┘
```

#### 4.2.2 上架产品API（更新版）

```typescript
// 创建产品（代理）
POST /api/agent/products
Request Headers: {
  Authorization: "Bearer <agent_token>",
  X-User-Role: "AGENT"
}

Request Body: {
  templateId: string;           // 选择的模板ID

  // 产品基本信息
  name: string;
  displayName?: string;
  description: string;
  category: string;
  subcategory?: string;
  casNumber?: string;

  // 根据模板填写的详细信息
  specifications: Record<string, any>;

  // 应用领域和包装
  applications: string[];
  packaging: string;
  deliveryTime: string;

  // 价格信息
  currency: string;
  minOrder: number;
  unit: string;

  // 分级价格
  gradePrices: Array<{
    gradeId: string;
    price: number;
    priceRanges?: Array<{
      minQty: number;
      maxQty?: number;
      price: number;
    }>;
    stockQuantity?: number;
    isAvailable: boolean;
  }>;

  // 媒体资源
  images: string[];
  documents?: string[];
}

Response: {
  success: true,
  message: "Product created and submitted for review",
  data: {
    productId: string;
    templateId: string;
    status: "PENDING";
    referencePrices?: ReferencePrice[];  // 参考价格（如果有其他代理已上架）
    createdAt: Date;
  }
}
```

#### 4.2.3 获取可用模板列表

```typescript
// 获取产品模板列表（按类别）
GET /api/products/templates?category=solvents

Response: {
  success: true,
  data: {
    templates: Array<{
      templateId: string;
      templateName: string;
      category: string;
      description: string;
      fieldCount: number;
      defaultGrades: Array<{
        gradeId: string;
        gradeName: string;
        gradeCode: string;
      }>;
      isActive: boolean;
    }>
  }
}

// 获取模板详情（包含所有字段）
GET /api/products/templates/:templateId

Response: {
  success: true,
  data: ProductTemplate
}
```

#### 4.2.4 参考价格自动触发

**触发时机**：
- 新产品上架审核通过后
- 产品价格更新后
- 产品状态变更后

**实现方式**：

```typescript
// 后端：产品审核通过后自动计算参考价格
async function onProductApproved(productId: string) {
  // 1. 获取同一产品的所有已上架版本
  const relatedProducts = await getRelatedProducts(productId);

  // 2. 计算参考价格
  const referencePrices = await calculateReferencePrices(productId);

  // 3. 更新所有相关产品的参考价格
  await updateReferencePrices(relatedProducts, referencePrices);

  // 4. 记录计算日志
  await logReferencePriceCalculation(productId, referencePrices);
}
```

### 4.3 产品详情页展示逻辑（更新版）

#### 4.3.1 普通用户视图

```typescript
// 产品详情页 API（普通用户）
GET /api/products/:id?userType=USER

Response: {
  success: true,
  data: {
    // 产品基本信息
    productId: string;
    name: string;
    description: string;
    category: string;
    casNumber?: string;

    // 根据模板填写的详细信息
    specifications: Record<string, any>;

    // 应用领域和包装
    applications: string[];
    packaging: string;
    deliveryTime: string;

    // 参考价格（关键！）
    referencePrices: Array<{
      gradeId: string;
      gradeName: string;
      referencePrice: number;
      currency: string;
      priceRange?: {
        min: number;
        max: number;
      };
      supplierCount: number;
    }>;

    // 产品图片
    images: string[];

    // 统计信息
    stats: {
      views: number;
      supplierCount: number;  // 供应商数量
    };

    // 询盘按钮信息
    inquiryInfo: {
      targetAgent: string;   // 目标代理（专属链接的代理或平台直营代理）
      targetAgentName: string;
    };
  }
}
```

**普通用户看到的页面**：

```
┌─────────────────────────────────────────────┐
│  乙醇 (Ethanol) - CAS: 64-17-5             │
│                                             │
│  [产品图片轮播]                             │
│                                             │
│  产品描述：                                 │
│  无色透明液体，易挥发，有特殊气味...       │
│                                             │
│  产品规格：                                 │
│  - 纯度：≥99%                               │
│  - 水分：≤0.5%                              │
│  - 外观：无色透明液体                       │
│                                             │
│  参考价格：                                 │
│  ┌──────────────────────────────────────┐  │
│  │ 试剂级：$900/KG (3个供应商)          │  │
│  │ 工业级：$550/KG (3个供应商)          │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  应用领域：溶剂、化工原料...                │
│                                             │
│  包装方式：200L 铁桶 / ISO TANK             │
│  交付时间：7-14天                           │
│                                             │
│  [立即询盘] 按钮                            │
└─────────────────────────────────────────────┘
```

#### 4.3.2 代理用户视图

```typescript
// 产品详情页 API（代理用户）
GET /api/products/:id?userType=AGENT

Response: {
  success: true,
  data: {
    // 产品基本信息
    productId: string;
    name: string;
    description: string;
    category: string;
    casNumber?: string;

    // 根据模板填写的详细信息
    specifications: Record<string, any>;

    // 应用领域和包装
    applications: string[];
    packaging: string;
    deliveryTime: string;

    // 供应商列表（仅代理可见）
    suppliers: Array<{
      agentId: string;
      agentCode: string;
      companyName: string;
      logoUrl?: string;

      // 联系方式
      contactEmail: string;
      contactPhone: string;
      contactWhatsApp?: string;

      // 价格信息
      gradePrices: Array<{
        gradeId: string;
        gradeName: string;
        price: number;
        currency: string;
        priceRanges?: Array<{
          minQty: number;
          maxQty?: number;
          price: number;
        }>;
      }>;

      // 其他信息
      deliveryTime: string;
      minOrder: number;
      unit: string;

      // 评分和统计
      rating?: number;
      totalInquiries: number;
      responseRate: number;

      // 图片
      images: string[];
    }>;

    // 产品图片（默认图片）
    images: string[];

    // 统计信息
    stats: {
      views: number;
      supplierCount: number;
    };
  }
}
```

**代理用户看到的页面**：

```
┌─────────────────────────────────────────────┐
│  乙醇 (Ethanol) - CAS: 64-17-5             │
│                                             │
│  [产品图片轮播]                             │
│                                             │
│  产品描述：                                 │
│  无色透明液体，易挥发，有特殊气味...       │
│                                             │
│  产品规格：                                 │
│  - 纯度：≥99%                               │
│  - 水分：≤0.5%                              │
│                                             │
│  供应商列表：                               │
│  ┌──────────────────────────────────────┐  │
│  │ ☑ 张三化工有限公司                    │  │
│  │    试剂级：$800/KG  工业级：$500/KG  │  │
│  │    📧 contact@zhangsan.com            │  │
│  │    📞 +86 123 4567 8900               │  │
│  │    评分：4.8 ⭐ | 响应率：95%         │  │
│  │    [向该代理询盘]                      │  │
│  ├──────────────────────────────────────┤  │
│  │ ○ 李四贸易有限公司                    │  │
│  │    试剂级：$900/KG  工业级：$550/KG  │  │
│  │    📧 contact@lisi.com                │  │
│  │    📞 +86 098 7654 3210               │  │
│  │    评分：4.5 ⭐ | 响应率：90%         │  │
│  │    [向该代理询盘]                      │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [向选中的代理询盘] 按钮                    │
└─────────────────────────────────────────────┘
```

### 4.4 重复产品处理机制

#### 4.4.1 产品唯一性识别
- **化学产品**：使用 `casNumber` 作为唯一标识
- **非化学产品**：使用 `name + category` 组合作为标识

#### 4.4.2 产品匹配规则

**场景1：单一代理上架**
```
产品名称：某化工产品 (CAS: 123-45-6)
供应商：代理A
价格：$100/KG
[询盘] 按钮
```

**场景2：多个代理上架同一产品**
```
产品名称：某化工产品 (CAS: 123-45-6)

供应商列表：
┌─────────────────────────────────────┐
│ ☑ 代理A (张三化工)                   │
│    价格：$100/KG | 交付：7天 | 评分：4.8 │
│    [选择该供应商]                     │
├─────────────────────────────────────┤
│ ○ 代理B (李四贸易)                   │
│    价格：$95/KG  | 交付：14天 | 评分：4.5│
│    [选择该供应商]                     │
├─────────────────────────────────────┤
│ ○ 代理C (王五集团)                   │
│    价格：$98/KG  | 交付：10天 | 评分：4.7│
│    [选择该供应商]                     │
└─────────────────────────────────────┘

[向选中的供应商询盘] 按钮
```

#### 4.2.3 产品列表API

```typescript
// 获取产品详情（含所有供应商版本）
GET /api/products/:id
Response: {
  success: true,
  data: {
    id: string;
    name: string;
    casNumber: string;
    description: string;
    category: string;
    supplierVersions: Array<{
      productId: string;
      agentId: string;
      agentName: string;
      agentAvatar?: string;
      agentRating: number;
      price: number;
      currency: string;
      unit: string;
      minOrder: number;
      deliveryTime: string;
      images: string[];
    }>;
  }
}

// 搜索产品（支持按代理筛选）
GET /api/products?keyword=xxx&category=xxx&agentId=xxx
Response: {
  success: true,
  data: {
    products: Product[],
    total: number,
    page: number,
    pageSize: number
  }
}
```

### 4.3 产品管理功能

#### 4.3.1 代理端产品管理
- ✅ 上架新产品
- ✅ 编辑产品信息
- ✅ 上传产品图片
- ✅ 上传产品文档（COA、MSDS等）
- ✅ 删除产品（仅草稿或无询盘的产品）
- ✅ 查看产品统计数据（浏览量、询盘数）

#### 4.3.2 管理员端产品管理
- ✅ 审核产品（通过/拒绝）
- ✅ 查看所有产品
- ✅ 管理产品分类
- ✅ 删除违规产品
- ✅ 查看产品统计数据

---

## 5. 询盘系统（核心）

### 5.1 询盘数据结构

```typescript
interface Inquiry {
  id: string;
  
  // 产品信息
  productId: string;
  agentId: string;            // 接收询盘的代理ID
  productName: string;
  productImages: string[];
  
  // 询盘人信息
  inquirerInfo: {
    userId: string;          // 如果用户已登录
    userName: string;
    userEmail: string;
    userPhone?: string;
    company?: string;        // 公司名称（可选）
  };
  
  // 询盘内容
  inquiryContent: {
    quantity: number;        // 询盘数量
    unit: string;            // 单位
    targetPrice?: number;    // 目标价格（可选）
    currency?: string;       // 货币
    deliveryDate?: string;   // 期望交付日期
    specialRequirements?: string;  // 特殊要求
    message: string;         // 留言信息
  };
  
  // 询盘来源
  source: 'PRODUCT_PAGE' | 'SPECIAL_LINK' | 'SEARCH' | 'OTHER';
  sourceDetails?: {
    agentCode?: string;      // 如果来自专属链接
    referrer?: string;       // 来源页面
  };
  
  // 状态
  status: 'PENDING' | 'REPLIED' | 'IN_PROGRESS' | 'CLOSED';
  
  // 回复信息（代理回复）
  replies: Array<{
    id: string;
    from: 'AGENT' | 'INQUIRER';
    message: string;
    attachments?: string[];  // 附件
    createdAt: Date;
  }>;
  
  // 跟进记录
  followUpRecords: Array<{
    id: string;
    notes: string;
    type: 'CALL' | 'EMAIL' | 'MEETING' | 'OTHER';
    createdAt: Date;
  }>;
  
  // 统计数据
  stats: {
    replyTime?: number;      // 响应时间（分钟）
    replyCount: number;      // 回复次数
  };
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
  lastReplyAt?: Date;
}
```

### 5.2 询盘分配机制

### 5.2.1 分配规则（根据用户类型和来源）

```
【普通用户（USER）】
规则1：用户通过专属链接访问 → 询盘分配给【专属链接的代理】
规则2：用户直接访问网站（无专属链接）→ 询盘分配给【平台直营代理】

【代理用户（AGENT）】
规则：代理自主选择供应商 → 询盘分配给【选中的产品上架代理】
```

### 5.2.2 分配流程

```
用户发起询盘
    ↓
检测用户类型
    ↓
┌────────────────────────────────┐
│  普通用户（USER）              │
├────────────────────────────────┤
│  检测是否有专属链接            │
│  ├─ 有专属链接                 │
│  │  → 分配给【专属链接的代理】 │
│  └─ 无专属链接                 │
│     → 分配给【平台直营代理】   │
└────────────────────────────────┘
    ↓
┌────────────────────────────────┐
│  代理用户（AGENT）              │
├────────────────────────────────┤
│  查看所有供应商列表             │
│  代理选择供应商                 │
│  → 分配给【选中的代理】         │
└────────────────────────────────┘
    ↓
创建询盘记录
    ↓
发送通知给对应代理
```

### 5.2.3 产品详情页显示逻辑

#### 普通用户（有专属链接）
```
┌─────────────────────────────────────┐
│ 产品名称：某化工产品 (CAS: 123-45-6)   │
│                                     │
│ 代理：张三（专属链接的代理）           │
│ 联系方式：xxx@xxx.com               │
│                                     │
│ [发起询盘]                          │
└─────────────────────────────────────┘
```

#### 普通用户（无专属链接）
```
┌─────────────────────────────────────┐
│ 产品名称：某化工产品 (CAS: 123-45-6)   │
│                                     │
│ 代理：平台直营                       │
│ 联系方式：support@chemicaloop.com    │
│                                     │
│ [发起询盘]                          │
└─────────────────────────────────────┘
```

#### 代理用户
```
┌─────────────────────────────────────┐
│ 产品名称：某化工产品 (CAS: 123-45-6)   │
│                                     │
│ 供应商列表（代理专属）：              │
│ ○ 张三 - $100/KG - 交付7天           │
│ ○ 李四 - $95/KG  - 交付14天          │
│ ○ 王五 - $98/KG  - 交付10天          │
│ ○ 平台直营 - $98/KG - 交付7天       │
│                                     │
│ [向选中的供应商询盘]                 │
└─────────────────────────────────────┘
```

### 5.2.4 代理间询盘流程

```
专属链接的代理收到询盘（来自客户）
    ↓
代理查看产品信息
    ↓
代理以代理身份访问产品详情页
    ↓
代理查看所有供应商列表
    ↓
代理选择向【产品上架的代理】发起询盘
    ↓
产品上架的代理收到询盘
    ↓
两个代理通过平台内询盘系统沟通
    ↓
专属链接的代理将最终结果回复给客户
    ↓
线下成交
```

### 5.3 询盘流程

### 5.3.1 普通用户发起询盘

```
用户浏览产品详情
    ↓
查看显示的代理信息（专属链接的代理 或 平台直营）
    ↓
填写询盘表单
    - 询盘数量
    - 目标价格（可选）
    - 期望交付日期（可选）
    - 特殊要求（可选）
    - 留言信息
    ↓
提交询盘
    ↓
系统根据用户类型和来源自动分配询盘
    ├─ 有专属链接 → 分配给专属链接的代理
    └─ 无专属链接 → 按规则分配给平台直营代理
        ├─ 第一优先级：根据用户地区匹配
        ├─ 第二优先级：根据产品类别匹配
        └─ 默认兜底：分配给默认平台直营代理
    ↓
显示"询盘已发送，等待回复"
```

### 5.3.2 平台直营代理分配规则（详细）

#### 分配逻辑流程
```
用户发起询盘（无专属链接）
    ↓
获取用户信息
    ├─ 用户注册地区
    └─ 用户IP定位地区（备用）
    ↓
获取产品信息
    └─ 产品所属类别
    ↓
【步骤1：按地区匹配】
查询负责该地区的平台直营代理
    ├─ 找到 → 进入步骤2
    └─ 未找到 → 跳过到步骤3
    ↓
【步骤2：按产品类别匹配】
在负责该地区的代理中，筛选负责该产品类别的代理
    ├─ 找到 → 分配给该代理 → 完成
    └─ 未找到 → 跳过到步骤3
    ↓
【步骤3：按产品类别全局匹配】
查询所有平台直营代理中，负责该产品类别的代理
    ├─ 找到 → 分配给该代理 → 完成
    └─ 未找到 → 进入步骤4
    ↓
【步骤4：按地区全局匹配】
查询所有平台直营代理中，负责该地区的代理
    ├─ 找到 → 分配给该代理 → 完成
    └─ 未找到 → 进入步骤5
    ↓
【步骤5：默认分配】
分配给标记为"默认"的平台直营代理
    ├─ 找到 → 分配给该代理 → 完成
    └─ 未找到 → 报错（系统必须至少有一个默认平台直营代理）
```

#### 分配规则说明

1. **优先级定义**：
   - P1：地区 + 产品类别（精确匹配）
   - P2：仅地区（次要匹配）
   - P3：仅产品类别（全局匹配）
   - P4：默认代理（兜底）

2. **匹配规则**：
   - 地区匹配：支持层级匹配（如：Asia > East Asia > China）
   - 产品类别匹配：支持层级匹配（如：Chemicals > Solvents > Ethanol）

3. **冲突处理**：
   - 如果同一优先级有多个代理匹配，轮询分配
   - 记录分配日志，便于后续优化

4. **配置示例**：

| 代理 | 负责地区 | 负责产品类别 | 是否默认 |
|------|---------|------------|---------|
| Platform-Agent-CN | China | 全部 | 否 |
| Platform-Agent-EU | Europe | Solvents | 否 |
| Platform-Agent-US | USA | 全部 | 否 |
| Platform-Agent-DEFAULT | Global | 全部 | 是 |

5. **实际分配案例**：

| 用户地区 | 产品类别 | 分配给 |
|---------|---------|--------|
| China | Ethanol | Platform-Agent-CN（地区匹配） |
| Germany | Methanol | Platform-Agent-EU（地区+产品类别匹配） |
| USA | Any Chemical | Platform-Agent-US（地区匹配） |
| Unknown Region | Ethanol | Platform-Agent-DEFAULT（兜底） |

### 5.3.3 代理用户发起询盘

```
代理浏览产品详情
    ↓
查看所有供应商列表（仅代理可见）
    ↓
选择供应商（单选）
    ↓
填写询盘表单
    - 询盘数量
    - 目标价格（可选）
    - 期望交付日期（可选）
    - 特殊要求（可选）
    - 留言信息
    ↓
提交询盘
    ↓
系统分配给对应代理
    ↓
显示"询盘已发送，等待回复"
```

### 5.3.2 代理接收询盘

```
代理收到通知
    ↓
查看询盘详情
    ↓
【判断代理类型】
    ├─ 普通代理 → 直接处理询盘
    └─ 平台直营代理 → 选择处理方式
         ├─ 自己处理（直接回复）
         └─ 转发给其他代理（仅平台直营代理）
              ↓
         【转发流程】
         查看该产品的所有上架代理
              ↓
         选择目标代理
              ↓
         填写转发说明（可选）
              ↓
         提交转发
              ↓
         询盘状态变更为 "FORWARDED"
              ↓
         目标代理收到通知
              ↓
         目标代理开始处理
    ↓
【直接回复流程】
决定回复方式
    ├─ 在线回复（平台内消息）
    ├─ 邮件回复
    └─ 电话/WhatsApp联系（线下）
    ↓
记录跟进（可选）
    ↓
更新询盘状态
```

### 5.3.3 平台直营代理转发询盘（新功能）

#### 5.3.3.1 转发权限

**只有平台直营代理可以转发询盘**：
- `is_platform_agent = true` 的代理
- 仅能转发分配给自己的询盘
- 不能转发已经关闭的询盘

#### 5.3.3.2 转发流程

```
平台直营代理查看询盘详情
    ↓
点击"转发询盘"按钮
    ↓
系统显示可转发的代理列表
    - 筛选条件：已上架该产品的代理
    - 排除：已拒绝该代理的代理（如有）
    - 显示：代理名称、评分、响应率、在线状态
    ↓
选择目标代理（单选）
    ↓
填写转发说明（可选）
    - 转发原因
    - 特殊要求
    - 期望处理时间
    ↓
提交转发
    ↓
系统验证
    ├─ 检查转发权限
    ├─ 检查目标代理状态
    └─ 检查询盘状态
    ↓
创建转发记录
    ↓
更新询盘状态为 "FORWARDED"
    ↓
更新询盘的 agent_id 为目标代理
    ↓
发送通知
    ├─ 原代理（平台直营代理）：转发成功通知
    ├─ 目标代理：收到转发的询盘通知
    └─ 用户（可选）：您的询盘已转交给专业代理处理
    ↓
显示"转发成功"
```

#### 5.3.3.3 转发后的处理流程

```
目标代理收到转发的询盘
    ↓
查看询盘详情
    ├─ 显示询盘原始信息
    ├─ 显示转发记录
    │   - 转发时间
    │   - 原代理（平台直营代理）
    │   - 转发说明
    ↓
决定是否接受询盘
    ├─ 接受 → 直接回复询盘
    └─ 拒绝 → 退回给原代理（平台直营代理）
         ↓
    退回流程
         ↓
    创建退回记录
         ↓
    更新询盘状态为 "REJECTED"
         ↓
    通知原代理（平台直营代理）
         ↓
    原代理可以选择：
         - 自己处理
         - 转发给其他代理
```

#### 5.3.3.4 转发场景示例

**场景1：专业领域转发**
```
平台直营代理收到询盘：100吨高纯度乙醇（试剂级）
    ↓
平台直营代理不擅长试剂级产品
    ↓
转发给代理A（专业试剂供应商）
    ↓
代理A处理询盘并回复
    ↓
平台直营代理从差价中获利（可选）
```

**场景2：地区分流转发**
```
平台直营代理（中国）收到德国客户的询盘
    ↓
平台直营代理不熟悉欧洲市场
    ↓
转发给代理B（欧洲区代理商）
    ↓
代理B处理询盘并回复
    ↓
平台直营代理获得部分佣金（可选）
```

**场景3：负载均衡转发**
```
平台直营代理收到大量询盘
    ↓
选择部分询盘转发给其他代理
    ↓
分流处理，提高响应速度
    ↓
所有客户获得及时回复
```

### 5.3.4 询盘状态流转（更新版）

```
PENDING（待回复）
    ↓
    ├─ 直接回复 → REPLIED（已回复）
    ├─ 转发给代理（仅平台直营代理）→ FORWARDED（已转发）
    └─ 拒绝/退回 → REJECTED（已拒绝）
         ↓
REPLIED（已回复）
    ↓
IN_PROGRESS（沟通中）
    ↓
CLOSED（已关闭/成交）

FORWARDED（已转发）
    ↓
    ├─ 目标代理接受 → REPLIED（已回复）
    └─ 目标代理拒绝 → REJECTED（已拒绝，退回给原代理）
         ↓
REJECTED（已拒绝/退回）
    ↓
    ├─ 重新转发 → FORWARDED（已转发）
    ├─ 自己处理 → REPLIED（已回复）
    └─ 关闭询盘 → CLOSED（已关闭）
```

### 5.3.5 询盘状态定义（更新版）

| 状态代码 | 状态名称 | 说明 | 可执行操作 |
|---------|---------|------|----------|
| `PENDING` | 待回复 | 询盘已创建，等待回复 | 回复、转发（仅平台直营代理） |
| `REPLIED` | 已回复 | 代理已回复询盘 | 继续沟通、关闭 |
| `FORWARDED` | 已转发 | 平台直营代理已转发给其他代理 | 目标代理接受/拒绝 |
| `REJECTED` | 已拒绝/退回 | 目标代理拒绝或退回 | 重新转发、自己处理、关闭 |
| `IN_PROGRESS` | 沟通中 | 双方正在沟通中 | 继续沟通、关闭 |
| `CLOSED` | 已关闭 | 询盘已关闭或成交 | 查看记录 |

### 5.4 询盘API

#### 5.4.1 用户端API

```typescript
// 发起询盘
POST /api/inquiries
Request Body: {
  productId: string;
  agentId: string;           // 选择的代理ID
  quantity: number;
  unit: string;
  targetPrice?: number;
  currency?: string;
  deliveryDate?: string;
  specialRequirements?: string;
  message: string;
  source?: string;
  sourceDetails?: {
    agentCode?: string;
    referrer?: string;
  };
}

Response: {
  success: true,
  data: {
    inquiryId: string;
    message: "Inquiry sent successfully"
  }
}

// 获取我的询盘列表
GET /api/user/inquiries?page=1&pageSize=20&status=PENDING
Response: {
  success: true,
  data: {
    inquiries: Inquiry[],
    total: number,
    page: number,
    pageSize: number
  }
}

// 获取询盘详情
GET /api/user/inquiries/:id
Response: {
  success: true,
  data: Inquiry
}

// 回复询盘（仅用户回复）
POST /api/user/inquiries/:id/reply
Request Body: {
  message: string;
  attachments?: string[];
}

Response: {
  success: true,
  message: "Reply sent"
}
```

#### 5.4.2 代理端API

```typescript
// 获取我的询盘列表
GET /api/agent/inquiries?page=1&pageSize=20&status=PENDING
Response: {
  success: true,
  data: {
    inquiries: Inquiry[],
    total: number,
    page: number,
    pageSize: number
  }
}

// 获取询盘详情
GET /api/agent/inquiries/:id
Response: {
  success: true,
  data: Inquiry
}

// 回复询盘
POST /api/agent/inquiries/:id/reply
Request Body: {
  message: string;
  attachments?: string[];
}

Response: {
  success: true,
  message: "Reply sent"
}

// 更新询盘状态
PUT /api/agent/inquiries/:id/status
Request Body: {
  status: 'PENDING' | 'REPLIED' | 'IN_PROGRESS' | 'CLOSED';
  notes?: string;
}

Response: {
  success: true,
  message: "Status updated"
}

// 转发询盘（仅平台直营代理可用）
POST /api/agent/inquiries/:id/forward
Request Headers: {
  Authorization: "Bearer <platform_agent_token>",
  X-User-Role: "AGENT",
  X-Agent-Type: "PLATFORM_AGENT"  // 额外验证：仅平台直营代理
}

Request Body: {
  targetAgentId: string;         // 目标代理ID
  reason?: string;               // 转发原因（可选）
  specialRequirements?: string;  // 特殊要求（可选）
  expectedResponseTime?: string;  // 期望处理时间（可选）
}

Response: {
  success: true,
  message: "Inquiry forwarded successfully",
  data: {
    inquiryId: string;
    originalAgentId: string;     // 原代理ID（平台直营代理）
    targetAgentId: string;       // 目标代理ID
    targetAgentName: string;
    status: "FORWARDED";
    forwardedAt: Date;
    forwardRecordId: string;     // 转发记录ID
  }
}

// 获取可转发的代理列表（仅平台直营代理可用）
GET /api/agent/inquiries/:id/available-agents
Request Headers: {
  Authorization: "Bearer <platform_agent_token>",
  X-Agent-Type: "PLATFORM_AGENT"
}

Response: {
  success: true,
  data: {
    inquiryId: string;
    productId: string;
    productName: string;
    availableAgents: Array<{
      agentId: string;
      agentCode: string;
      companyName: string;
      logoUrl?: string;

      // 产品信息
      productPrices: Array<{
        gradeId: string;
        gradeName: string;
        price: number;
        currency: string;
      }>;

      // 统计信息
      rating?: number;
      responseRate: number;
      totalInquiries: number;
      averageResponseTime: number;  // 平均响应时间（分钟）

      // 状态
      isOnline: boolean;
      status: 'active' | 'busy' | 'offline';
    }>;
    totalCount: number
  }
}

// 接受转发的询盘（目标代理）
POST /api/agent/inquiries/:id/accept
Request Body: {
  message?: string;  // 接受时的留言（可选）
}

Response: {
  success: true,
  message: "Inquiry accepted successfully",
  data: {
    inquiryId: string;
    status: "REPLIED";
    acceptedAt: Date;
    originalAgentId: string;  // 原始平台直营代理ID
  }
}

// 拒绝/退回转发的询盘（目标代理）
POST /api/agent/inquiries/:id/reject
Request Body: {
  reason: string;  // 拒绝原因
}

Response: {
  success: true,
  message: "Inquiry rejected and returned to original agent",
  data: {
    inquiryId: string;
    status: "REJECTED";
    rejectedAt: Date;
    originalAgentId: string;
  }
}

// 查看询盘转发记录
GET /api/agent/inquiries/:id/forward-history

Response: {
  success: true,
  data: {
    inquiryId: string;
    forwardRecords: Array<{
      forwardRecordId: string;
      fromAgentId: string;
      fromAgentName: string;
      toAgentId: string;
      toAgentName: string;
      reason?: string;
      specialRequirements?: string;
      forwardedAt: Date;
      status: 'FORWARDED' | 'ACCEPTED' | 'REJECTED';
      responseTime?: number;  // 响应时间（秒）
    }>
  }
}

// 添加跟进记录
POST /api/agent/inquiries/:id/follow-up
Request Body: {
  notes: string;
  type: 'CALL' | 'EMAIL' | 'MEETING' | 'OTHER';
}

Response: {
  success: true,
  message: "Follow-up recorded"
}
```

#### 5.4.3 管理员端API

```typescript
// 获取所有询盘
GET /api/admin/inquiries?page=1&pageSize=20&agentId=xxx
Response: {
  success: true,
  data: {
    inquiries: Inquiry[],
    total: number,
    page: number,
    pageSize: number
  }
}

// 查看询盘详情
GET /api/admin/inquiries/:id
Response: {
  success: true,
  data: Inquiry
}
```

---

## 6. 代理功能模块

### 6.1 代理门户结构

```
代理门户 (/agent/portal)
├── 数据看板
│   ├── 我的询盘统计
│   │   ├── 总询盘数
│   │   ├── 待回复询盘数
│   │   ├── 已回复询盘数
│   │   └── 已关闭询盘数
│   ├── 我的业绩
│   │   ├── 平均响应时间
│   │   ├── 回复率
│   │   └── 询盘转化率（可选）
│   └── 询盘来源分析
│       ├── 专属链接
│       ├── 产品展示
│       └── 搜索结果
│
├── 我的产品
│   ├── 产品列表
│   ├── 上传新产品
│   ├── 编辑产品
│   ├── 删除产品
│   └── 产品统计（浏览量、询盘数）
│
├── 我的询盘
│   ├── 询盘列表（按状态筛选）
│   ├── 询盘详情
│   ├── 回复询盘
│   ├── 添加跟进记录
│   └── 更新询盘状态
│
├── 我的客户
│   ├── 客户列表（从询盘中提取）
│   ├── 客户详情
│   ├── 客户标签管理
│   └── 客户跟进记录
│
├── 专属链接
│   ├── 获取专属链接
│   ├── 自定义联系信息
│   ├── 链接统计（点击量、询盘数）
│   └── 复制链接/生成二维码
│
└── 个人设置
    ├── 基本资料
    ├── 联系信息
    ├── 密码修改
    └── 通知设置
```

### 6.2 专属链接功能

#### 6.2.1 功能说明

代理可以生成自己的专属推广链接，当用户通过该链接访问网站时：
1. 系统记录代理码
2. 用户浏览产品时，如果点击询盘，默认分配给该代理
3. 如果该代理上架了该产品，直接分配给该代理
4. 如果该代理未上架该产品，显示所有供应商列表，但默认选中该代理

#### 6.2.2 专属链接格式

```
基础格式：https://www.chemicaloop.com?agent={agentCode}

示例：
https://www.chemicaloop.com?agent=CHEM1234567
https://www.chemicaloop.com/products?agent=CHEM1234567
https://www.chemicaloop.com/products/123?agent=CHEM1234567
```

#### 6.2.3 专属链接数据结构

```typescript
interface AgentLink {
  id: string;
  agentId: string;
  agentCode: string;
  
  // 链接信息
  baseUrl: string;
  fullUrl: string;
  shortUrl?: string;
  
  // 自定义联系信息（显示在网站上）
  customContact: {
    contactName: string;
    contactEmail: string;
    contactPhone: string;
    contactWhatsApp?: string;
    contactAddress?: string;
    companyLogo?: string;
  };
  
  // 统计数据
  stats: {
    totalClicks: number;
    uniqueVisitors: number;
    inquiries: number;        // 通过该链接产生的询盘数
    conversionRate: number;
    lastClickDate: Date;
  };
  
  // 状态
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 6.2.4 专属链接API

```typescript
// 获取我的专属链接
GET /api/agent/link
Response: {
  success: true,
  data: AgentLink
}

// 更新联系信息
PUT /api/agent/link/contact
Request Body: {
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactWhatsApp?: string;
  contactAddress?: string;
}

Response: {
  success: true,
  data: AgentLink
}

// 获取链接统计
GET /api/agent/link/stats?dateRange=7d
Response: {
  success: true,
  data: {
    totalClicks: number,
    uniqueVisitors: number,
    inquiries: number,
    conversionRate: number,
    dailyStats: Array<{
      date: string;
      clicks: number;
      inquiries: number;
    }>
  }
}
```

#### 6.2.5 前端实现

```typescript
// 在网站初始化时检测URL中的agent参数
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const agentCode = urlParams.get('agent');
  
  if (agentCode) {
    // 保存到localStorage（有效期7天）
    localStorage.setItem('referredAgent', agentCode);
    localStorage.setItem('referredAgentTime', Date.now().toString());
  }
}, []);

// 发起询盘时，检查是否有推荐的代理
async function sendInquiry(inquiryData: InquiryData) {
  const referredAgent = localStorage.getItem('referredAgent');
  
  const response = await fetch('/api/inquiries', {
    method: 'POST',
    body: JSON.stringify({
      ...inquiryData,
      sourceDetails: {
        agentCode: referredAgent || undefined
      }
    })
  });
  
  return response.json();
}
```

### 6.3 询盘统计

```typescript
interface AgentInquiryStats {
  // 基础统计
  totalInquiries: number;
  pendingInquiries: number;
  repliedInquiries: number;
  inProgressInquiries: number;
  closedInquiries: number;
  
  // 业绩统计
  averageReplyTime: number;   // 平均响应时间（分钟）
  replyRate: number;          // 回复率（已回复/总询盘）
  
  // 来源统计
  sourceStats: {
    productPage: number;      // 产品页面
    specialLink: number;      // 专属链接
    search: number;           // 搜索结果
    other: number;
  };
  
  // 趋势统计（最近30天）
  trendStats: Array<{
    date: string;
    inquiries: number;
    replies: number;
  }>;
}
```

---

## 7. 管理后台模块

### 7.1 模块结构

```
管理后台 (/admin)
├── 数据看板
│   ├── 全站统计
│   │   ├── 总用户数
│   │   ├── 总代理数
│   │   ├── 总产品数
│   │   └── 总询盘数
│   ├── 今日数据
│   │   ├── 新增用户
│   │   ├── 新增代理
│   │   ├── 新增产品
│   │   └── 新增询盘
│   └── 趋势图表
│       ├── 用户增长趋势
│       ├── 询盘趋势
│       └── 产品增长趋势
│
├── 用户管理
│   ├── 用户列表
│   ├── 用户详情
│   ├── 禁用/启用用户
│   └── 用户操作日志
│
├── 代理管理
│   ├── 代理申请列表（待审核）
│   ├── 审核代理申请（通过/拒绝）
│   ├── 代理列表
│   ├── 代理详情
│   ├── 代理统计数据
│   ├── 禁用/启用代理
│   └── 创建平台直营代理（仅超级管理员）
│
├── 运营管理（仅超级管理员）
│   ├── 运营管理员列表
│   ├── 创建运营管理员
│   ├── 运营管理员详情
│   └── 禁用/启用运营管理员
│
├── 产品管理
│   ├── 产品列表（全部）
│   ├── 产品分类管理
│   ├── 审核产品
│   ├── 删除违规产品
│   └── 产品统计
│
├── 询盘管理
│   ├── 询盘列表（全部）
│   ├── 询盘详情
│   ├── 按代理筛选
│   └── 询盘统计
│
├── 内容管理（运营管理员权限）
│   ├── 新闻/文章发布
│   ├── 首页Banner管理
│   ├── 轮播图管理
│   ├── 页面内容编辑
│   └── 多语言翻译管理
│
├── 系统设置（超级管理员权限）
│   ├── 网站配置
│   ├── 邮件配置
│   └── 系统参数
│
└── 操作日志
    ├── 用户操作日志
    └── 系统日志
```

### 7.2 数据看板

```typescript
interface DashboardStats {
  // 用户数据
  totalUsers: number;
  newUsersToday: number;
  newUsersThisMonth: number;
  
  // 代理数据
  totalAgents: number;
  activeAgents: number;
  pendingAgentApplications: number;
  newAgentsToday: number;
  
  // 产品数据
  totalProducts: number;
  approvedProducts: number;
  pendingProducts: number;
  newProductsToday: number;
  
  // 询盘数据
  totalInquiries: number;
  pendingInquiries: number;
  repliedInquiries: number;
  newInquiriesToday: number;
  
  // 网站数据
  todayPageViews: number;
  todayUniqueVisitors: number;
}
```

---

## 8. 数据统计分析

### 8.1 平台级统计（管理员）

```typescript
interface PlatformStats {
  // 用户统计
  userStats: {
    total: number;
    newToday: number;
    newThisMonth: number;
    activeUsers: number;
  };
  
  // 代理统计
  agentStats: {
    total: number;
    active: number;
    pendingApplications: number;
    topAgents: Array<{
      agentId: string;
      agentName: string;
      inquiriesCount: number;
      replyRate: number;
    }>;
  };
  
  // 产品统计
  productStats: {
    total: number;
    approved: number;
    pending: number;
    topCategories: Array<{
      category: string;
      count: number;
    }>;
  };
  
  // 询盘统计
  inquiryStats: {
    total: number;
    newToday: number;
    pending: number;
    replied: number;
    averageReplyTime: number;
  };
  
  // 趋势数据（最近30天）
  trendData: Array<{
    date: string;
    newUsers: number;
    newInquiries: number;
    newProducts: number;
  }>;
}
```

### 8.2 代理级统计（代理）

```typescript
interface AgentStats {
  // 询盘统计
  inquiryStats: {
    total: number;
    pending: number;
    replied: number;
    inProgress: number;
    closed: number;
    newToday: number;
  };
  
  // 业绩统计
  performanceStats: {
    averageReplyTime: number;      // 平均响应时间（分钟）
    replyRate: number;             // 回复率
    conversionRate?: number;       // 转化率（可选）
  };
  
  // 来源统计
  sourceStats: {
    productPage: number;
    specialLink: number;
    search: number;
    other: number;
  };
  
  // 产品统计
  productStats: {
    total: number;
    totalInquiries: number;
    topProducts: Array<{
      productId: string;
      productName: string;
      inquiriesCount: number;
    }>;
  };
  
  // 客户统计
  customerStats: {
    total: number;
    active: number;
    newThisMonth: number;
  };
  
  // 趋势数据（最近30天）
  trendData: Array<{
    date: string;
    inquiries: number;
    replies: number;
  }>;
}
```

### 8.3 询盘来源分析

```typescript
interface InquirySourceAnalysis {
  sourceBreakdown: {
    productPage: {
      count: number;
      percentage: number;
    };
    specialLink: {
      count: number;
      percentage: number;
      topAgents: Array<{
        agentName: string;
        count: number;
      }>;
    };
    search: {
      count: number;
      percentage: number;
    };
    other: {
      count: number;
      percentage: number;
    };
  };
}
```

---

## 9. 付费功能预留（暂不实现）

### 9.1 预留的付费接口

虽然当前阶段为免费模式，但需要预留付费功能的接口，便于后续快速上线付费功能。

#### 9.1.1 询盘次数限制

```typescript
// 代理账户类型（预留）
type AgentAccountType = 'FREE' | 'PRO' | 'ENTERPRISE';

// 代理套餐配置（预留）
interface AgentPlan {
  type: AgentAccountType;
  
  // 询盘限制
  maxInquiriesPerMonth: number;  // 每月最大询盘数
  
  // 产品限制
  maxProducts: number;            // 最大产品数量
  
  // 专属链接限制
  maxSpecialLinks: number;        // 最大专属链接数
  
  // 功能权限
  features: {
    exportInquiries: boolean;     // 导出询盘
    advancedAnalytics: boolean;   // 高级分析
    seoOptimization: boolean;     // SEO优化
    homepagePromotion: boolean;   // 首页推荐
  };
  
  // 价格
  annualFee?: number;             // 年费（仅付费版）
}

// 套餐配置示例（预留）
const PLAN_CONFIG: Record<AgentAccountType, AgentPlan> = {
  FREE: {
    type: 'FREE',
    maxInquiriesPerMonth: 50,
    maxProducts: 10,
    maxSpecialLinks: 1,
    features: {
      exportInquiries: false,
      advancedAnalytics: false,
      seoOptimization: false,
      homepagePromotion: false
    }
  },
  PRO: {
    type: 'PRO',
    maxInquiriesPerMonth: 500,
    maxProducts: 100,
    maxSpecialLinks: 5,
    features: {
      exportInquiries: true,
      advancedAnalytics: true,
      seoOptimization: true,
      homepagePromotion: false
    },
    annualFee: 2999
  },
  ENTERPRISE: {
    type: 'ENTERPRISE',
    maxInquiriesPerMonth: -1,  // -1 表示无限
    maxProducts: -1,
    maxSpecialLinks: -1,
    features: {
      exportInquiries: true,
      advancedAnalytics: true,
      seoOptimization: true,
      homepagePromotion: true
    },
    annualFee: 9999
  }
};
```

#### 9.1.2 付费功能检查（预留）

```typescript
// 检查代理是否超过询盘限制（预留）
function checkInquiryLimit(agentId: string): boolean {
  const agent = getAgentById(agentId);
  const plan = PLAN_CONFIG[agent.accountType];
  
  // 如果无限询盘，直接通过
  if (plan.maxInquiriesPerMonth === -1) {
    return true;
  }
  
  // 检查本月询盘数
  const currentMonthInquiries = getAgentInquiryCount(agentId, 'currentMonth');
  
  return currentMonthInquiries < plan.maxInquiriesPerMonth;
}

// 检查代理是否可以上架产品（预留）
function checkProductLimit(agentId: string): boolean {
  const agent = getAgentById(agentId);
  const plan = PLAN_CONFIG[agent.accountType];
  
  // 如果无限产品，直接通过
  if (plan.maxProducts === -1) {
    return true;
  }
  
  // 检查当前产品数
  const currentProducts = getAgentProductCount(agentId);
  
  return currentProducts < plan.maxProducts;
}
```

#### 9.1.3 付费升级接口（预留）

```typescript
// 升级套餐（预留）
POST /api/agent/upgrade-plan
Request Body: {
  planType: 'PRO' | 'ENTERPRISE';
  paymentMethod: 'ALIPAY' | 'WECHAT' | 'BANK_TRANSFER';
}

Response: {
  success: true,
  data: {
    orderId: string;
    paymentUrl: string;  // 支付链接
    amount: number;
    currency: string;
  }
}

// 查询套餐状态（预留）
GET /api/agent/plan-status
Response: {
  success: true,
  data: {
    currentPlan: AgentAccountType;
    maxInquiriesPerMonth: number;
    usedInquiriesThisMonth: number;
    maxProducts: number;
    usedProducts: number;
    expiryDate?: Date;  // 付费版到期时间
  }
}
```

### 9.2 当前实施状态

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| 询盘次数限制 | ⭕ 预留接口 | 当前所有代理无限询盘 |
| 产品数量限制 | ⭕ 预留接口 | 当前所有代理无限产品 |
| 套餐升级功能 | ❌ 不实现 | 当前所有代理为免费版 |
| 在线支付功能 | ❌ 不实现 | 当前无付费功能 |
| 导出询盘功能 | ❌ 不实现 | 当前不可用 |
| 高级分析功能 | ❌ 不实现 | 当前不可用 |

---

## 10. 技术实现建议

### 10.1 数据库设计

#### 10.1.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  country VARCHAR(2) NOT NULL,
  avatar_url VARCHAR(500),
  
  -- 角色和状态
  role VARCHAR(20) NOT NULL DEFAULT 'USER',  -- 'SUPER_ADMIN', 'AGENT', 'USER'
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  is_disabled BOOLEAN DEFAULT FALSE,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP,
  
  -- 索引
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role)
);

-- 邮箱验证码表
CREATE TABLE email_verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  
  -- 用途
  purpose VARCHAR(50) NOT NULL DEFAULT 'REGISTER',  -- 'REGISTER', 'RESET_PASSWORD', 'CHANGE_EMAIL'
  
  -- 验证信息
  is_used BOOLEAN DEFAULT FALSE,
  is_expired BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,  -- 验证码过期时间
  
  -- 索引
  INDEX idx_email (email),
  INDEX idx_code (code),
  INDEX idx_created_at (created_at)
);

-- 代理表
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  agent_code VARCHAR(20) UNIQUE NOT NULL,
  
  -- 公司信息
  company_name VARCHAR(200),
  company_type VARCHAR(50),
  business_license_url VARCHAR(500),
  
  -- 经营信息
  business_scope JSONB,
  main_products JSONB,
  
  -- 联系信息（用于专属链接）
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_whatsapp VARCHAR(20),
  contact_address TEXT,
  company_logo_url VARCHAR(500),
  
  -- 账户类型（预留付费功能）
  account_type VARCHAR(20) DEFAULT 'FREE',  -- 'FREE', 'PRO', 'ENTERPRISE'
  plan_expiry_date TIMESTAMP,
  
  -- 平台直营代理配置（仅平台直营代理使用）
  is_platform_agent BOOLEAN DEFAULT FALSE,  -- 是否为平台直营代理
  platform_config JSONB DEFAULT '{}',  -- 平台代理配置
  -- platform_config 结构示例：
  -- {
  --   "is_default": false,  -- 是否为默认代理
  --   "assigned_regions": ["CN", "Asia"],  -- 负责的地区列表（支持层级）
  --   "assigned_categories": ["solvents", "ethanol"]  -- 负责的产品类别列表（支持层级）
  -- }
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  
  -- 业绩统计
  total_inquiries INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  average_reply_time INTEGER DEFAULT 0,  -- 秒
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_agent_code (agent_code),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_is_platform_agent (is_platform_agent)
);

-- 代理申请表
CREATE TABLE agent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 申请信息
  application_data JSONB NOT NULL,
  
  -- 审核信息
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_status (status),
  INDEX idx_user_id (user_id)
);

-- 代理专属链接表
CREATE TABLE agent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  agent_code VARCHAR(20) UNIQUE NOT NULL,
  
  -- 链接信息
  base_url VARCHAR(500),
  full_url VARCHAR(500),
  short_url VARCHAR(100),
  
  -- 自定义联系信息
  custom_contact_name VARCHAR(200),
  custom_contact_email VARCHAR(255),
  custom_contact_phone VARCHAR(20),
  custom_contact_whatsapp VARCHAR(20),
  custom_contact_address TEXT,
  custom_company_logo_url VARCHAR(500),
  
  -- 统计数据
  total_clicks INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  last_click_at TIMESTAMP,
  
  -- 状态
  is_active BOOLEAN DEFAULT TRUE,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_agent_code (agent_code),
  INDEX idx_agent_id (agent_id)
);

-- 产品表
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  template_id UUID REFERENCES product_templates(id) ON DELETE SET NULL,

  -- 产品基本信息
  name VARCHAR(500) NOT NULL,
  display_name VARCHAR(500),
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),

  -- CAS号（化学产品）
  cas_number VARCHAR(50),

  -- 详细信息（基于模板的动态字段）
  specifications JSONB,
  applications TEXT[],
  packaging VARCHAR(200),
  delivery_time VARCHAR(100),

  -- 价格信息
  currency VARCHAR(3) DEFAULT 'USD',
  min_order INTEGER DEFAULT 1,
  unit VARCHAR(50) DEFAULT 'KG',

  -- 分级价格（新字段）
  grade_prices JSONB DEFAULT '[]',
  -- grade_prices 结构示例：
  -- [
  --   {
  --     "grade_id": "REAGENT",
  --     "grade_name": "试剂级",
  --     "price": 900,
  --     "currency": "USD",
  --     "price_ranges": [{"min_qty": 100, "max_qty": 1000, "price": 850}],
  --     "stock_quantity": 1000,
  --     "is_available": true
  --   }
  -- ]

  -- 参考价格（系统自动计算）
  reference_prices JSONB DEFAULT '[]',
  -- reference_prices 结构示例：
  -- [
  --   {
  --     "grade_id": "REAGENT",
  --     "grade_name": "试剂级",
  --     "reference_price": 900,
  --     "currency": "USD",
  --     "price_range": {"min": 850, "max": 950},
  --     "supplier_count": 3
  --   }
  -- ]

  -- 媒体资源
  images TEXT[],
  documents TEXT[],

  -- 审核状态
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,

  -- 统计
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_agent_id (agent_id),
  INDEX idx_template_id (template_id),
  INDEX idx_status (status),
  INDEX idx_category (category),
  INDEX idx_cas_number (cas_number),
  INDEX idx_grade_prices ((grade_prices::text)),  -- GIN索引
  INDEX idx_reference_prices ((reference_prices::text))  -- GIN索引
);

-- 产品信息模板表（新表）
CREATE TABLE product_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 模板基本信息
  template_name VARCHAR(200) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,

  -- 模板字段配置
  fields JSONB NOT NULL DEFAULT '[]',
  -- fields 结构示例：
  -- [
  --   {
  --     "field_key": "purity",
  --     "field_name": "纯度",
  --     "field_type": "SELECT",
  --     "is_required": true,
  --     "options": [{"value": "≥99%", "label": "≥99%"}],
  --     "order": 1
  --   }
  -- ]

  -- 默认产品等级配置
  default_grades JSONB DEFAULT '[]',
  -- default_grades 结构示例：
  -- [
  --   {
  --     "grade_id": "REAGENT",
  --     "grade_name": "试剂级",
  --     "grade_code": "GR",
  --     "description": "符合试剂级标准",
  --     "is_active": true
  --   }
  -- ]

  -- 状态
  is_active BOOLEAN DEFAULT TRUE,

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id),

  -- 索引
  INDEX idx_category (category),
  INDEX idx_is_active (is_active),
  UNIQUE (template_name, category)
);


-- 询盘表
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 产品信息
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  product_name VARCHAR(500),
  product_images TEXT[],
  
  -- 询盘人信息
  inquirer_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  inquirer_name VARCHAR(200),
  inquirer_email VARCHAR(255),
  inquirer_phone VARCHAR(20),
  inquirer_company VARCHAR(200),
  
  -- 询盘内容
  inquiry_content JSONB NOT NULL,
  
  -- 询盘来源
  source VARCHAR(50) NOT NULL DEFAULT 'PRODUCT_PAGE',
  source_details JSONB,
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  
  -- 统计
  reply_time INTEGER,  -- 秒
  reply_count INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_reply_at TIMESTAMP,
  
  -- 索引
  INDEX idx_product_id (product_id),
  INDEX idx_agent_id (agent_id),
  INDEX idx_inquirer_user_id (inquirer_user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 询盘回复表
CREATE TABLE inquiry_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,
  
  -- 回复信息
  from_role VARCHAR(20) NOT NULL,  -- 'AGENT' or 'INQUIRER'
  message TEXT NOT NULL,
  attachments TEXT[],
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_inquiry_id (inquiry_id),
  INDEX idx_created_at (created_at)
);

-- 询盘跟进记录表
CREATE TABLE inquiry_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,

  -- 跟进信息
  notes TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,  -- 'CALL', 'EMAIL', 'MEETING', 'OTHER'

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_inquiry_id (inquiry_id)
);

-- 询盘转发记录表（新表）
CREATE TABLE inquiry_forwards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID REFERENCES inquiries(id) ON DELETE CASCADE,

  -- 转发信息
  from_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  from_agent_name VARCHAR(200) NOT NULL,
  to_agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  to_agent_name VARCHAR(200) NOT NULL,

  -- 转发原因和要求
  reason TEXT,  -- 转发原因
  special_requirements TEXT,  -- 特殊要求
  expected_response_time VARCHAR(100),  -- 期望处理时间

  -- 转发状态
  status VARCHAR(20) NOT NULL DEFAULT 'FORWARDED',  -- 'FORWARDED', 'ACCEPTED', 'REJECTED'

  -- 响应时间
  responded_at TIMESTAMP,  -- 目标代理响应时间
  response_time_seconds INTEGER,  -- 响应时间（秒）

  -- 拒绝原因
  rejection_reason TEXT,  -- 目标代理拒绝原因

  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  -- 索引
  INDEX idx_inquiry_id (inquiry_id),
  INDEX idx_from_agent_id (from_agent_id),
  INDEX idx_to_agent_id (to_agent_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 审计日志表
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 操作者信息
  user_id UUID REFERENCES users(id),
  user_role VARCHAR(20),
  user_agent VARCHAR(500),
  ip_address VARCHAR(45),
  
  -- 操作信息
  action VARCHAR(50),
  resource_type VARCHAR(50),
  resource_id UUID,
  
  -- 变更内容
  changes_before JSONB,
  changes_after JSONB,
  
  -- 结果
  status VARCHAR(20),
  error_message TEXT,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_created_at (created_at)
);

-- 产品浏览记录表（用于统计）
CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  
  -- 浏览者信息
  visitor_ip VARCHAR(45),
  visitor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- 来源
  source VARCHAR(50),
  referrer VARCHAR(500),
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_product_id (product_id),
  INDEX idx_agent_id (agent_id),
  INDEX idx_created_at (created_at)
);

-- 专属链接点击记录表
CREATE TABLE agent_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_link_id UUID REFERENCES agent_links(id) ON DELETE CASCADE,
  agent_code VARCHAR(20),
  
  -- 点击者信息
  visitor_ip VARCHAR(45),
  visitor_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- 来源
  referrer VARCHAR(500),
  user_agent VARCHAR(500),
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_agent_link_id (agent_link_id),
  INDEX idx_agent_code (agent_code),
  INDEX idx_created_at (created_at)
);
```

### 10.2 API路由设计

#### 10.2.1 认证相关
```
POST   /api/auth/send-verification-code # 发送邮箱验证码
POST   /api/auth/register               # 用户注册（需验证码）
POST   /api/auth/login                  # 用户登录
POST   /api/auth/logout                 # 用户登出
POST   /api/auth/refresh                # 刷新Token
GET    /api/auth/verify-email/:token    # 验证邮箱
```

**邮箱验证码API详情**：

```typescript
// 发送邮箱验证码
POST /api/auth/send-verification-code
Request Body: {
  email: string;
}

Response: {
  success: true,
  message: "Verification code sent to your email",
  data: {
    expiresIn: 600  // 验证码有效期（秒）
  }
}

// 用户注册（需验证码）
POST /api/auth/register
Request Body: {
  username: string;
  email: string;
  emailVerificationCode: string;  // 6位数字验证码
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  country: string;
  agreeTerms: boolean;
  agreePrivacy: boolean;
}

Response: {
  success: true,
  message: "Registration successful",
  data: {
    user: UserInfo,
    accessToken: string,
    refreshToken: string
  }
}
```

#### 10.2.2 用户相关
```
GET    /api/user/profile                # 获取个人资料
PUT    /api/user/profile                # 更新个人资料
PUT    /api/user/password               # 修改密码
GET    /api/user/inquiries              # 获取我的询盘列表
GET    /api/user/inquiries/:id          # 获取询盘详情
POST   /api/user/inquiries/:id/reply    # 回复询盘
GET    /api/user/agent-application      # 获取我的代理申请记录
POST   /api/user/agent-application      # 提交代理申请
```

#### 10.2.3 产品相关
```
# 产品模板管理（运营管理员）
GET    /api/admin/product-templates             # 获取模板列表
POST   /api/admin/product-templates             # 创建模板
GET    /api/admin/product-templates/:id         # 获取模板详情
PUT    /api/admin/product-templates/:id         # 更新模板
DELETE /api/admin/product-templates/:id         # 删除模板
GET    /api/product-templates?category=xxx      # 获取可用模板（公开）

# 产品管理（代理）
GET    /api/agent/products                      # 获取我的产品列表
POST   /api/agent/products                      # 创建产品
GET    /api/agent/products/:id                  # 获取产品详情
PUT    /api/agent/products/:id                  # 更新产品
DELETE /api/agent/products/:id                  # 删除产品

# 产品浏览（所有用户）
GET    /api/products                            # 获取产品列表
GET    /api/products/:id                        # 获取产品详情
       # ?userType=USER  - 普通用户视图（显示参考价格）
       # ?userType=AGENT - 代理视图（显示供应商列表）
GET    /api/products/categories                 # 获取产品分类
GET    /api/products/search?q=xxx&category=xxx  # 搜索产品
```

#### 10.2.4 询盘相关
```
POST   /api/inquiries                   # 发起询盘
GET    /api/inquiries/:id               # 获取询盘详情（仅本人）
```

#### 10.2.3.1 产品模板API详情（运营管理员）

```typescript
// 创建产品模板
POST /api/admin/product-templates
Request Headers: {
  Authorization: "Bearer <token>",
  X-User-Role: "OPERATOR" | "SUPER_ADMIN"
}

Request Body: {
  templateName: string;
  category: string;
  description: string;
  fields: Array<{
    fieldKey: string;
    fieldName: string;
    fieldType: 'TEXT' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'DATE' | 'RICH_TEXT';
    isRequired: boolean;
    placeholder?: string;
    defaultValue?: any;
    options?: Array<{ value: string; label: string; }>;
    validation?: { min?: number; max?: number; pattern?: string; };
    order: number;
  }>;
  defaultGrades?: Array<{
    gradeId: string;
    gradeName: string;
    gradeCode: string;
    description?: string;
    isActive: boolean;
  }>;
}

Response: {
  success: true,
  data: {
    templateId: string;
    templateName: string;
    category: string;
    createdAt: Date;
  }
}

// 获取模板列表
GET /api/admin/product-templates?category=solvents&isActive=true

Response: {
  success: true,
  data: {
    templates: Array<{
      templateId: string;
      templateName: string;
      category: string;
      description: string;
      fieldCount: number;
      gradeCount: number;
      isActive: boolean;
      createdAt: Date;
      createdBy: string;
    }>,
    total: number
  }
}

// 更新模板
PUT /api/admin/product-templates/:id

Response: {
  success: true,
  message: "Template updated successfully"
}

// 删除模板（仅当没有产品使用时才能删除）
DELETE /api/admin/product-templates/:id

Response: {
  success: true,
  message: "Template deleted successfully"
}

// 错误响应
Response (400): {
  success: false,
  message: "Cannot delete template: products are using this template"
}
```

#### 10.2.3.2 产品管理API详情（代理）

```typescript
// 创建产品（选择模板）
POST /api/agent/products
Request Headers: {
  Authorization: "Bearer <agent_token>",
  X-User-Role: "AGENT"
}

Request Body: {
  templateId: string;           // 选择的模板ID
  name: string;
  displayName?: string;
  description: string;
  category: string;
  subcategory?: string;
  casNumber?: string;
  specifications: Record<string, any>;  // 根据模板填写
  applications: string[];
  packaging: string;
  deliveryTime: string;
  currency: string;
  minOrder: number;
  unit: string;
  gradePrices: Array<{
    gradeId: string;
    price: number;
    currency: string;
    priceRanges?: Array<{
      minQty: number;
      maxQty?: number;
      price: number;
    }>;
    stockQuantity?: number;
    isAvailable: boolean;
  }>;
  images: string[];
  documents?: string[];
}

Response: {
  success: true,
  data: {
    productId: string;
    templateId: string;
    status: "PENDING";
    referencePrices?: ReferencePrice[];  // 如果有其他代理已上架相同产品
    createdAt: Date;
  }
}
```

#### 10.2.3.3 产品浏览API详情（所有用户）

```typescript
// 获取产品详情（根据用户类型显示不同内容）
GET /api/products/:id?userType=USER

Response (普通用户视图): {
  success: true,
  data: {
    productId: string;
    name: string;
    description: string;
    category: string;
    casNumber?: string;
    specifications: Record<string, any>;
    applications: string[];
    packaging: string;
    deliveryTime: string;
    referencePrices: Array<{
      gradeId: string;
      gradeName: string;
      referencePrice: number;
      currency: string;
      priceRange?: { min: number; max: number; };
      supplierCount: number;
    }>;
    images: string[];
    stats: {
      views: number;
      supplierCount: number;
    };
    inquiryInfo: {
      targetAgent: string;
      targetAgentName: string;
    };
  }
}

GET /api/products/:id?userType=AGENT

Response (代理视图): {
  success: true,
  data: {
    productId: string;
    name: string;
    description: string;
    category: string;
    casNumber?: string;
    specifications: Record<string, any>;
    applications: string[];
    packaging: string;
    deliveryTime: string;
    suppliers: Array<{
      agentId: string;
      agentCode: string;
      companyName: string;
      logoUrl?: string;
      contactEmail: string;
      contactPhone: string;
      contactWhatsApp?: string;
      gradePrices: Array<{
        gradeId: string;
        gradeName: string;
        price: number;
        currency: string;
        priceRanges?: Array<{ minQty: number; maxQty?: number; price: number; }>;
      }>;
      deliveryTime: string;
      minOrder: number;
      unit: string;
      rating?: number;
      totalInquiries: number;
      responseRate: number;
      images: string[];
    }>;
    images: string[];
    stats: {
      views: number;
      supplierCount: number;
    };
  }
}
```

#### 10.2.5 代理相关
```
GET    /api/agent/dashboard/stats       # 获取看板统计
GET    /api/agent/products              # 获取我的产品列表
POST   /api/agent/products              # 创建产品
PUT    /api/agent/products/:id          # 更新产品
DELETE /api/agent/products/:id          # 删除产品
GET    /api/agent/inquiries             # 获取我的询盘列表
GET    /api/agent/inquiries/:id         # 获取询盘详情
POST   /api/agent/inquiries/:id/reply   # 回复询盘
PUT    /api/agent/inquiries/:id/status  # 更新询盘状态
POST   /api/agent/inquiries/:id/follow-up  # 添加跟进记录
GET    /api/agent/link                  # 获取专属链接
PUT    /api/agent/link/contact          # 更新联系信息
GET    /api/agent/link/stats            # 获取链接统计
GET    /api/agent/profile               # 获取代理资料
PUT    /api/agent/profile               # 更新代理资料
```

#### 10.2.6 管理员相关
```
GET    /api/admin/dashboard/stats       # 获取看板统计
GET    /api/admin/users                 # 获取用户列表
GET    /api/admin/users/:id             # 获取用户详情
PUT    /api/admin/users/:id             # 更新用户信息
DELETE /api/admin/users/:id             # 删除用户
GET    /api/admin/agents                # 获取代理列表
GET    /api/admin/agents/applications   # 获取代理申请列表
POST   /api/admin/agents/applications/:id/review  # 审核代理申请
GET    /api/admin/agents/:id            # 获取代理详情
PUT    /api/admin/agents/:id/status     # 更新代理状态
GET    /api/admin/products              # 获取产品列表
GET    /api/admin/products/:id          # 获取产品详情
PUT    /api/admin/products/:id/status   # 更新产品状态
DELETE /api/admin/products/:id          # 删除产品
GET    /api/admin/inquiries             # 获取询盘列表
GET    /api/admin/inquiries/:id         # 获取询盘详情
GET    /api/admin/settings              # 获取系统设置
PUT    /api/admin/settings              # 更新系统设置
GET    /api/admin/audit-logs            # 获取审计日志
```

### 10.3 前端技术实现

#### 10.3.1 状态管理

```typescript
// auth store
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  role: UserRole | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}
```

#### 10.3.2 权限组件

```typescript
// 权限守卫组件
interface PermissionGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({ 
  children, 
  allowedRoles, 
  fallback 
}: PermissionGuardProps) {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || <AccessDenied />;
  }
  
  return <>{children}</>;
}

// 使用示例
<PermissionGuard allowedRoles=['SUPER_ADMIN']}>
  <AdminDashboard />
</PermissionGuard>
```

#### 10.3.3 路由保护

```typescript
// middleware.ts (Next.js)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyJWT } from './lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 公开路由
  const publicRoutes = ['/', '/products', '/contact', '/auth'];
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  if (isPublicRoute) {
    return NextResponse.next();
  }
  
  // 管理后台路由
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth-token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    try {
      const payload = verifyJWT(token.value);
      
      // 检查是否为超级管理员
      if (payload.role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
      
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }
  
  // 代理门户路由
  if (pathname.startsWith('/agent/portal')) {
    const token = request.cookies.get('auth-token');
    
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
    
    try {
      const payload = verifyJWT(token.value);
      
      // 检查是否为代理
      if (payload.role !== 'AGENT') {
        return NextResponse.redirect(new URL('/access-denied', request.url));
      }
      
      return NextResponse.next();
    } catch (error) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/agent/portal/:path*',
    '/user/:path*'
  ],
};
```

### 10.4 MVP部署架构与安全防护

#### 10.4.1 MVP阶段最小化架构（低成本）

**设计目标**：
- 月成本 < $200（约 ¥1500）
- 快速上线（1-2周）
- 国内外用户均可访问
- 基础安全防护
- 支持后续平滑扩展

**架构图**：
```
┌─────────────────────────────────────────────────────────┐
│          MVP阶段架构（月成本: $130-$240）                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  用户访问（国内外）                                        │
│    │                                                      │
│    ▼                                                      │
│  ┌────────────────────────────────────────┐              │
│  │  Cloudflare DNS (免费)                   │              │
│  │  - 域名解析                             │              │
│  │  - SSL证书（Let's Encrypt）              │              │
│  └─────────────────┬────────────────────────┘              │
│                    │                                       │
│  ┌─────────────────▼────────────────────────┐              │
│  │  Cloudflare CDN (免费)                   │              │
│  │  - 全球CDN加速                           │              │
│  │  - 静态资源缓存                           │              │
│  │  - DDoS基础防护（免费）                    │              │
│  │  - HTTPS加密                              │              │
│  └─────────────────┬────────────────────────┘              │
│                    │                                       │
│  ┌─────────────────▼────────────────────────┐              │
│  │  Nginx反向代理 (单服务器)                 │              │
│  │  - 静态资源服务                           │              │
│  │  - 负载均衡（预留）                        │              │
│  │  - 限流配置                               │              │
│  └─────────────────┬────────────────────────┘              │
│                    │                                       │
│  ┌─────────────────▼────────────────────────┐              │
│  │  Next.js应用 (Node.js)                   │              │
│  │  - 前端页面                               │              │
│  │  - API服务                               │              │
│  │  - 单实例运行                            │              │
│  └─────────────────┬────────────────────────┘              │
│                    │                                       │
│  ┌─────────────────▼────────────────────────┐              │
│  │  PostgreSQL (单实例)                     │              │
│  │  - 主数据库                              │              │
│  │  - 定期备份                              │              │
│  └─────────────────┬────────────────────────┘              │
│                    │                                       │
│  ┌─────────────────▼────────────────────────┐              │
│  │  对象存储 (阿里云OSS / AWS S3)           │              │
│  │  - 产品图片                              │              │
│  │  - 文档资料                              │              │
│  └──────────────────────────────────────────┘              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### 10.4.2 服务器选择方案

**方案A：国内服务器（推荐，成本最低）**

| 配置 | 参数 |
|------|------|
| 服务商 | 阿里云轻量应用服务器 / 腾讯云轻量 |
| CPU | 2核 |
| 内存 | 4GB |
| 带宽 | 5Mbps |
| 存储 | 80GB SSD |
| 价格 | ¥120/月（$18/月） |

**优点**：
- 成本最低
- 国内访问速度快（50ms以内）
- 符合国内数据合规要求

**缺点**：
- 海外用户访问速度一般（200-500ms延迟）
- 需要ICP备案（2-4周）

---

**方案B：海外服务器（推荐给海外用户优先）**

| 配置 | 参数 |
|------|------|
| 服务商 | DigitalOcean / AWS Lightsail / Vultr |
| CPU | 2核 |
| 内存 | 4GB |
| 流量 | 4TB/月 |
| 存储 | 80GB SSD |
| 价格 | $24/月（¥170/月） |

**优点**：
- 无需ICP备案，立即上线
- 海外用户访问快（50-100ms）
- 可选节点多（新加坡、东京、香港）

**缺点**：
- 成本稍高
- 国内用户访问速度一般（100-200ms）

---

**方案C：双节点方案（平衡国内外访问）**

| 配置 | 参数 |
|------|------|
| 节点1（国内） | 阿里云轻量 ¥120/月 |
| 节点2（海外） | DigitalOcean Singapore $20/月 |
| 负载均衡 | Cloudflare（免费） |
| 总成本 | ¥170/月（$23/月） |

**优点**：
- 国内外用户访问都较好
- 高可用（一个节点故障不影响）
- 可按地区分流

**缺点**：
- 成本较高
- 需要配置数据同步

#### 10.4.3 成本估算表

| 组件 | 方案A（国内） | 方案B（海外） | 方案C（双节点） |
|------|-------------|-------------|---------------|
| 服务器 | ¥120/月 | $24/月 | ¥120 + $20/月 |
| 域名 | $10/年 | $10/年 | $10/年 |
| SSL证书 | 免费（Cloudflare） | 免费（Cloudflare） | 免费（Cloudflare） |
| CDN | 免费（Cloudflare） | 免费（Cloudflare） | 免费（Cloudflare） |
| 数据库 | 包含在服务器内 | 包含在服务器内 | 包含在服务器内 |
| 对象存储 | ¥10/月（100GB） | $10/月（100GB） | ¥10/月（国内） |
| **月成本** | **¥130**（$18） | **$34**（¥240） | **¥170**（$23） |
| **年成本** | **¥1,560**（$216） | **$408**（¥2,880） | **¥2,040**（$280） |

#### 10.4.4 Cloudflare配置（免费版）

**DNS配置**：
```yaml
# A记录
@  → 服务器IP
www → 服务器IP

# CNAME记录
api → 服务器IP
admin → 服务器IP
```

**CDN加速配置**：
```
缓存级别: 标准
缓存时间: 2小时
绕过缓存: /api/*
压缩: 开启Auto Minify
```

**安全配置（免费版）**：
```yaml
防火墙规则:
  - 阻止已知恶意IP
  - 限制单IP访问频率（1000次/分钟）
  - 阻止SQL注入尝试

Bot防护: 轻量级机器人检测
HTTPS: Full模式
```

#### 10.4.5 Nginx配置（单服务器）

```nginx
# /etc/nginx/sites-available/chemicaloop

upstream backend {
    server 127.0.0.1:3000;
    # server 127.0.0.1:3001;  # 后续扩展时启用
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name chemicaloop.com www.chemicaloop.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS主服务器
server {
    listen 443 ssl http2;
    server_name chemicaloop.com www.chemicaloop.com;

    # SSL证书
    ssl_certificate /etc/ssl/certs/cloudflare.pem;
    ssl_certificate_key /etc/ssl/private/cloudflare.key;

    # 限流配置
    limit_req_zone $binary_remote_addr zone=general:10m rate=100r/s;
    limit_req zone=general burst=200 nodelay;

    # 静态资源
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
        try_files $uri @backend;
    }

    # API请求
    location /api/ {
        limit_req zone=general burst=50 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Next.js应用
    location / {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

#### 10.4.6 基础安全防护

**应用层限流**：

```typescript
// middleware/rateLimiter.ts
import { rateLimit } from 'express-rate-limit';

// 全局限流
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15分钟
  max: 1000,  // 每个IP最多1000次请求
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

// API限流（更严格）
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many API requests',
});

// 登录限流（最严格）
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts',
});
```

**防爬虫配置**：

```typescript
// middleware/botDetection.ts
import { Request, Response, NextFunction } from 'express';

const BOT_UA_PATTERNS = [
  /bot/i,
  /crawler/i,
  /spider/i,
  /scraper/i,
];

export function botDetection(req: Request, res: Response, next: NextFunction) {
  const userAgent = req.headers['user-agent'] || '';

  const isBot = BOT_UA_PATTERNS.some(pattern => pattern.test(userAgent));

  if (isBot) {
    // 允许Google、Bing等合法爬虫
    if (/googlebot|bingbot/i.test(userAgent)) {
      return next();
    }

    console.warn(`Blocked bot: ${userAgent} from ${req.ip}`);

    return res.status(403).json({
      success: false,
      message: 'Access denied'
    });
  }

  next();
}
```

**数据库安全**：

```sql
-- 创建只读用户
CREATE USER 'readonly'@'%' IDENTIFIED BY 'strong_password';
GRANT SELECT ON chemicaloop.* TO 'readonly'@'%';

-- 创建应用用户
CREATE USER 'appuser'@'localhost' IDENTIFIED BY 'strong_password';
GRANT SELECT, INSERT, UPDATE, DELETE ON chemicaloop.* TO 'appuser'@'localhost';

-- 定期备份（crontab）
0 2 * * * /usr/bin/pg_dump -U appuser chemicaloop | gzip > /backup/db_$(date +\%Y\%m\%d).sql.gz
```

#### 10.4.7 部署流程

```bash
# 1. 安装基础软件
sudo apt update
sudo apt install -y nginx postgresql redis-server nodejs npm

# 2. 配置Nginx
sudo cp nginx.conf /etc/nginx/sites-available/chemicaloop
sudo ln -s /etc/nginx/sites-available/chemicaloop /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 3. 初始化数据库
sudo -u postgres psql
CREATE DATABASE chemicaloop;
CREATE USER appuser WITH PASSWORD 'strong_password';
GRANT ALL PRIVILEGES ON DATABASE chemicaloop TO appuser;

# 4. 启动应用
cd /opt/chemicaloop
pnpm install
pnpm run build
pnpm run start

# 5. 配置PM2
sudo npm install -g pm2
pm2 start npm --name "chemicaloop" -- start
pm2 startup
pm2 save
```

#### 10.4.8 后续扩展路径

**MVP → 扩展阶段**：
1. 增加Redis缓存
2. 数据库主从复制
3. 增加API服务器节点
4. 配置负载均衡

**扩展 → 生产阶段**：
1. 双数据中心（国内+海外）
2. 数据库主主复制
3. CDN多节点加速
4. 专业的安全防护（WAF）

---

## 11. 分阶段实施计划

## 11. 分阶段实施计划

### 第一阶段：基础功能（当前实施）

#### 目标
- ✅ 建立核心业务流程
- ✅ 免费模式运行
- ✅ 吸引流量

#### 功能列表
1. **用户系统**
   - ✅ 用户注册（普通用户）
   - ✅ 用户登录/登出
   - ✅ JWT认证
   - ✅ 个人中心

2. **代理系统**
   - ✅ 代理申请流程
   - ✅ 代理审核（超级管理员）
   - ✅ 代理门户基础页面
   - ✅ 专属链接生成

3. **产品系统**
   - ✅ 代理上架产品
   - ✅ 产品详情页（含供应商列表）
   - ✅ 产品审核
   - ✅ 产品搜索

4. **询盘系统（核心）**
   - ✅ 用户发起询盘
   - ✅ 询盘分配机制（谁上架发给谁）
   - ✅ 代理接收询盘
   - ✅ 代理回复询盘
   - ✅ 询盘状态管理
   - ✅ 询盘跟进记录

5. **数据统计**
   - ✅ 平台级统计（超级管理员）
   - ✅ 代理级统计（代理自己）
   - ✅ 询盘来源分析

6. **管理后台**
   - ✅ 数据看板
   - ✅ 用户管理
   - ✅ 代理管理
   - ✅ 产品管理
   - ✅ 询盘管理

7. **预留接口**
   - ⭕ 询盘次数限制接口
   - ⭕ 产品数量限制接口
   - ⭕ 套餐升级接口
   - ❌ 暂不实现付费功能

### 第二阶段：付费功能（未来实施）

#### 触发条件
- 询盘量达到一定规模
- 代理数量达到一定规模
- 用户流量稳定增长

#### 功能列表
1. **付费系统**
   - ⭕ 套餐配置（FREE/PRO/ENTERPRISE）
   - ⭕ 在线支付集成（支付宝/微信/银行转账）
   - ⭕ 套餐升级流程
   - ⭕ 订阅管理

2. **功能限制**
   - ⭕ 询盘次数限制
   - ⭕ 产品数量限制
   - ⭕ 专属链接数量限制

3. **高级功能**
   - ⭕ 询盘导出（Excel/PDF）
   - ⭕ 高级数据分析
   - ⭕ SEO优化工具
   - ⭕ 首页推荐位

4. **客服系统**
   - ⭕ 平台客服功能
   - ⭕ 专属客服（付费版）

---

## 12. 待确认事项

### 12.1 当前阶段（第一阶段）
请确认以下设计是否符合需求：

- [ ] 询盘分配机制：谁上架的产品发给谁的代理
- [ ] 重复产品：显示代理列表让用户选择
- [ ] 免费模式：前期所有功能免费
- [ ] 核心功能：询盘系统是核心
- [ ] 移除功能：订单、佣金、在线支付
- [ ] 预留接口：付费功能接口已预留但暂不实现
- [ ] 注册流程：用户注册即创建普通用户账户，无需选择角色
- [ ] 代理申请：通过独立的代理招募页面（/agent/apply）申请
- [ ] 邮箱验证：注册时通过邮箱验证码验证（6位数字，10分钟有效期）

### 12.2 未来阶段（第二阶段）
请确认以下付费方案是否合理：

- [ ] 收费方式：按询盘次数限制收费
- [ ] 套餐等级：FREE / PRO / ENTERPRISE
- [ ] 价格设定：¥2999/年（PRO） / ¥9999/年（ENTERPRISE）
- [ ] 功能限制：产品数量、询盘次数、专属链接数量

---

## 附录

### 附录A：术语表

| 术语 | 说明 |
|-----|------|
| 询盘（Inquiry） | 客户对产品感兴趣，发起的询问 |
| 代理（Agent） | 平台的合作商，负责上架产品、接收询盘、线下成交 |
| 专属链接（Special Link） | 代理的专属推广链接，包含agentCode参数 |
| CAS号 | 化学品的唯一标识编号 |
| 转化率（Conversion Rate） | 询盘转化为成交的比例（可选，需手动录入） |

### 附录B：数据字典

#### 产品状态（Product.status）
- `DRAFT`: 草稿
- `PENDING`: 待审核
- `APPROVED`: 已审核
- `REJECTED`: 已拒绝

#### 询盘状态（Inquiry.status）
- `PENDING`: 待回复
- `REPLIED`: 已回复
- `IN_PROGRESS`: 沟通中
- `CLOSED`: 已关闭

#### 代理申请状态（AgentApplication.status）
- `PENDING`: 待审核
- `APPROVED`: 已通过
- `REJECTED`: 已拒绝

#### 代理账户类型（Agent.accountType）
- `FREE`: 免费版
- `PRO`: 专业版
- `ENTERPRISE`: 企业版

---

---

## 13. 扩展功能：运营管理员与平台直营代理

### 13.1 运营管理员（OPERATOR）

#### 13.1.1 角色定义

运营管理员是由超级管理员创建的专门负责网站日常运营的角色。

**主要职责**：
- 管理网站素材（Banner、轮播图、新闻、公告）
- 产品上下架审核和管理
- 多语言翻译内容管理
- 网站配置管理（SEO、社交媒体链接等）
- 查看运营数据统计

#### 13.1.2 创建运营管理员（仅超级管理员）

**API设计**：

```typescript
// 创建运营管理员
POST /api/admin/operators
Request Headers: {
  Authorization: "Bearer <admin_token>"
  X-User-Role: "SUPER_ADMIN"  // 权限验证
}

Request Body: {
  username: string;           // 用户名（唯一）
  email: string;              // 邮箱（唯一，用于登录）
  password: string;           // 密码（加密存储）
  firstName: string;          // 名
  lastName: string;           // 姓
  phone?: string;             // 手机号（可选）
  department?: string;        // 所属部门（可选）
}

Response: {
  success: true,
  message: "Operator created successfully",
  data: {
    userId: string;
    username: string;
    email: string;
    role: "OPERATOR";
    createdAt: Date;
  }
}

// 错误响应示例
Response (403): {
  success: false,
  message: "Only SUPER_ADMIN can create operator accounts"
}

Response (400): {
  success: false,
  message: "Username or email already exists"
}
```

#### 13.1.3 运营管理员列表（仅超级管理员）

```typescript
// 获取运营管理员列表
GET /api/admin/operators?page=1&pageSize=20
Request Headers: {
  Authorization: "Bearer <admin_token>"
  X-User-Role: "SUPER_ADMIN"
}

Response: {
  success: true,
  data: {
    operators: Array<{
      userId: string;
      username: string;
      email: string;
      firstName: string;
      lastName: string;
      department?: string;
      status: 'active' | 'disabled';
      createdAt: Date;
      lastLoginAt?: Date;
    }>,
    total: number;
    page: number;
    pageSize: number
  }
}
```

#### 13.1.4 禁用/启用运营管理员（仅超级管理员）

```typescript
// 更新运营管理员状态
PUT /api/admin/operators/:userId/status
Request Headers: {
  Authorization: "Bearer <admin_token>"
  X-User-Role: "SUPER_ADMIN"
}

Request Body: {
  status: 'active' | 'disabled';
  reason?: string;  // 禁用原因（可选）
}

Response: {
  success: true,
  message: "Operator status updated"
}
```

#### 13.1.5 运营管理员权限说明

运营管理员的权限范围：

| 功能模块 | 权限 | 说明 |
|---------|------|------|
| 用户管理 | 查看 | 可以查看和编辑用户，但不能删除超级管理员 |
| 代理管理 | 查看 | 可以查看代理信息，但不能创建平台直营代理 |
| 产品管理 | 完全 | 可以审核、上下架、删除产品 |
| 询盘管理 | 查看 | 可以查看所有询盘 |
| 内容管理 | 完全 | 可以管理网站素材、Banner、新闻、公告 |
| 系统设置 | 查看 | 可以查看但不可修改系统配置 |
| 运营统计 | 查看 | 可以查看运营数据统计 |
| 创建运营管理员 | ❌ 无 | 仅超级管理员可创建 |
| 创建平台直营代理 | ❌ 无 | 仅超级管理员可创建 |

### 13.2 平台直营代理（PLATFORM_AGENT）

#### 13.2.1 角色定义

平台直营代理是代表平台直接参与贸易的特殊代理账户，可以配置负责的地区和产品类别。

**主要职责**：
- 接收无专属链接用户的询盘（按规则分配）
- 作为平台的贸易窗口
- 平台直接赚取差价
- 保护平台利益

**特殊权限**：
- 可以上架平台直营产品
- 可以编辑所有产品（特殊权限）
- 可以查看所有询盘统计数据
- 拥有部分管理员权限

#### 13.2.2 创建平台直营代理（仅超级管理员）

**API设计**：

```typescript
// 创建平台直营代理
POST /api/admin/platform-agents
Request Headers: {
  Authorization: "Bearer <admin_token>"
  X-User-Role: "SUPER_ADMIN"
}

Request Body: {
  // 用户账户信息
  username: string;           // 用户名（唯一）
  email: string;              // 邮箱（唯一，用于登录）
  password: string;           // 密码
  firstName: string;          // 名
  lastName: string;           // 姓
  
  // 代理信息
  agentCode: string;          // 代理码（唯一，如：PLATFORM-CN, PLATFORM-EU）
  companyName: string;        // 公司名称
  contactEmail: string;       // 联系邮箱
  contactPhone: string;       // 联系电话
  contactWhatsApp?: string;   // WhatsApp（可选）
  contactAddress?: string;    // 地址（可选）
  
  // 平台代理配置
  platformConfig: {
    isDefault: boolean;       // 是否为默认代理（兜底用）
    assignedRegions: string[];  // 负责的地区列表（ISO代码，如：["CN", "Asia"]）
    assignedCategories: string[];  // 负责的产品类别列表（如：["solvents", "ethanol"]）
  };
}

Response: {
  success: true,
  message: "Platform agent created successfully",
  data: {
    userId: string;
    agentId: string;
    agentCode: string;
    username: string;
    email: string;
    isPlatformAgent: true;
    platformConfig: {
      isDefault: boolean;
      assignedRegions: string[];
      assignedCategories: string[];
    };
    createdAt: Date;
  }
}

// 错误响应示例
Response (403): {
  success: false,
  message: "Only SUPER_ADMIN can create platform agent accounts"
}

Response (400): {
  success: false,
  message: "Agent code already exists"
}
```

#### 13.2.3 平台直营代理列表（仅超级管理员）

```typescript
// 获取平台直营代理列表
GET /api/admin/platform-agents?page=1&pageSize=20
Request Headers: {
  Authorization: "Bearer <admin_token>"
  X-User-Role: "SUPER_ADMIN"
}

Response: {
  success: true,
  data: {
    agents: Array<{
      userId: string;
      agentId: string;
      agentCode: string;
      username: string;
      email: string;
      companyName: string;
      status: 'active' | 'disabled';
      platformConfig: {
        isDefault: boolean;
        assignedRegions: string[];
        assignedCategories: string[];
      };
      totalInquiries: number;
      totalReplies: number;
      createdAt: Date;
    }>,
    total: number;
    page: number;
    pageSize: number
  }
}
```

#### 13.2.4 更新平台直营代理配置（仅超级管理员）

```typescript
// 更新平台直营代理配置
PUT /api/admin/platform-agents/:agentId/config
Request Headers: {
  Authorization: "Bearer <admin_token>"
  X-User-Role: "SUPER_ADMIN"
}

Request Body: {
  platformConfig: {
    isDefault?: boolean;       // 更新是否为默认代理
    assignedRegions?: string[];  // 更新负责的地区
    assignedCategories?: string[];  // 更新负责的产品类别
  };
}

Response: {
  success: true,
  message: "Platform agent config updated",
  data: {
    agentId: string;
    platformConfig: {
      isDefault: boolean;
      assignedRegions: string[];
      assignedCategories: string[];
    };
    updatedAt: Date;
  }
}
```

#### 13.2.5 删除平台直营代理（仅超级管理员）

**注意事项**：
- 不能删除唯一的默认代理
- 删除前必须确认该代理没有未处理的询盘

```typescript
// 删除平台直营代理
DELETE /api/admin/platform-agents/:agentId
Request Headers: {
  Authorization: "Bearer <admin_token>"
  X-User-Role: "SUPER_ADMIN"
}

Response: {
  success: true,
  message: "Platform agent deleted successfully"
}

// 错误响应示例
Response (400): {
  success: false,
  message: "Cannot delete default platform agent"
}

Response (400): {
  success: false,
  message: "Agent has pending inquiries, cannot delete"
}
```

#### 13.2.6 平台直营代理分配规则实现

**后端算法实现（示例）**：

```typescript
// 询盘分配给平台直营代理
async function assignInquiryToPlatformAgent(
  userRegion: string,
  productCategory: string
): Promise<string> {
  // 步骤1：获取所有启用的平台直营代理
  const platformAgents = await getActivePlatformAgents();
  
  // 步骤2：优先级1：地区 + 产品类别（精确匹配）
  const exactMatch = platformAgents.find(agent => 
    agent.platformConfig.assignedRegions.includes(userRegion) &&
    agent.platformConfig.assignedCategories.includes(productCategory)
  );
  
  if (exactMatch) {
    return exactMatch.agentId;
  }
  
  // 步骤3：优先级2：仅地区匹配
  const regionMatch = platformAgents.find(agent =>
    agent.platformConfig.assignedRegions.includes(userRegion)
  );
  
  if (regionMatch) {
    return regionMatch.agentId;
  }
  
  // 步骤4：优先级3：仅产品类别匹配（全局）
  const categoryMatch = platformAgents.find(agent =>
    agent.platformConfig.assignedCategories.includes(productCategory)
  );
  
  if (categoryMatch) {
    return categoryMatch.agentId;
  }
  
  // 步骤5：默认代理（兜底）
  const defaultAgent = platformAgents.find(agent =>
    agent.platformConfig.isDefault === true
  );
  
  if (defaultAgent) {
    return defaultAgent.agentId;
  }
  
  // 步骤6：如果没有默认代理，报错
  throw new Error('No available platform agent found');
}
```

#### 13.2.7 平台直营代理配置示例

```typescript
// 示例配置：创建三个平台直营代理

// 1. 中国区默认代理
{
  agentCode: "PLATFORM-CN",
  companyName: "Chemicaloop China",
  platformConfig: {
    isDefault: false,
    assignedRegions: ["CN", "HK", "TW"],  // 中国大陆、香港、台湾
    assignedCategories: ["*"]  // 所有产品类别
  }
}

// 2. 欧洲区溶剂类产品代理
{
  agentCode: "PLATFORM-EU-SOLVENTS",
  companyName: "Chemicaloop Europe",
  platformConfig: {
    isDefault: false,
    assignedRegions: ["EU", "DE", "FR", "IT"],  // 欧盟及主要国家
    assignedCategories: ["solvents", "ethanol", "methanol"]  // 溶剂类
  }
}

// 3. 全球默认代理（兜底）
{
  agentCode: "PLATFORM-DEFAULT",
  companyName: "Chemicaloop Global",
  platformConfig: {
    isDefault: true,
    assignedRegions: ["*"],  // 所有地区
    assignedCategories: ["*"]  // 所有产品类别
  }
}
```

### 13.3 权限验证中间件

#### 13.3.1 创建运营管理员权限检查

```typescript
// middleware.ts
export async function checkSuperAdminPermission(
  request: NextRequest
): Promise<boolean> {
  const token = request.cookies.get('auth-token');
  
  if (!token) {
    return false;
  }
  
  try {
    const payload = verifyJWT(token.value);
    return payload.role === 'SUPER_ADMIN';
  } catch (error) {
    return false;
  }
}

// API路由示例
export async function POST(request: NextRequest) {
  const hasPermission = await checkSuperAdminPermission(request);
  
  if (!hasPermission) {
    return NextResponse.json(
      { success: false, message: "Only SUPER_ADMIN can perform this action" },
      { status: 403 }
    );
  }
  
  // 继续处理请求...
}
```

#### 13.3.2 运营管理员权限检查

```typescript
// 运营管理员可以访问的功能
const OPERATOR_ACCESSIBLE_ROUTES = [
  '/api/admin/content',      // 内容管理
  '/api/admin/products',     // 产品管理
  '/api/admin/users',        // 用户管理（查看和编辑）
  '/api/admin/agents',       // 代理管理（查看）
  '/api/admin/inquiries',    // 询盘管理（查看）
  '/api/admin/stats',        // 统计数据
];

const OPERATOR_FORBIDDEN_ROUTES = [
  '/api/admin/operators',        // 创建运营管理员
  '/api/admin/platform-agents',  // 创建平台直营代理
  '/api/admin/settings',         // 系统设置
];

export async function checkOperatorPermission(
  request: NextRequest
): Promise<boolean> {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('auth-token');
  
  if (!token) {
    return false;
  }
  
  try {
    const payload = verifyJWT(token.value);
    
    // 检查是否为运营管理员或超级管理员
    if (payload.role !== 'OPERATOR' && payload.role !== 'SUPER_ADMIN') {
      return false;
    }
    
    // 运营管理员不能访问禁止的路由
    if (payload.role === 'OPERATOR' && OPERATOR_FORBIDDEN_ROUTES.some(route => pathname.startsWith(route))) {
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
```

### 13.4 数据库更新

#### 13.4.1 更新users表角色字段

```sql
-- 更新users表的role字段，支持新角色
ALTER TABLE users 
MODIFY COLUMN role ENUM('SUPER_ADMIN', 'OPERATOR', 'PLATFORM_AGENT', 'AGENT', 'USER') NOT NULL DEFAULT 'USER';
```

**注意**：`PLATFORM_AGENT` 实际上是 `AGENT` 角色的一个子类型，通过 `agents` 表的 `is_platform_agent` 字段区分。在 `users` 表中，平台直营代理的角色仍然是 `AGENT`。

#### 13.4.2 验证现有数据

```sql
-- 查看当前所有用户角色
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- 查看所有平台直营代理
SELECT u.*, a.agent_code, a.is_platform_agent, a.platform_config
FROM users u
JOIN agents a ON u.id = a.user_id
WHERE a.is_platform_agent = true;
```

### 13.5 更新日志

#### v2.4 (2025-02-06)
- ✅ 新增"运营管理员（OPERATOR）"角色
- ✅ 运营管理员由超级管理员创建
- ✅ 运营管理员负责网站素材、产品上下架、多语言翻译、网站配置
- ✅ 新增平台直营代理创建API（仅超级管理员）
- ✅ 支持多个平台直营代理，每个可配置负责的地区和产品类别
- ✅ 询盘分配规则：第一优先级地区，第二优先级产品类别
- ✅ 数据库更新：agents表增加platform_config字段（JSONB类型）
- ✅ 权限验证中间件：区分超级管理员、运营管理员、平台直营代理
- ✅ 新增API：创建/列表/更新/删除运营管理员和平台直营代理

---

**文档版本**: v2.7
**创建日期**: 2025-02-06
**最后更新**: 2025-02-06
**状态**: 待确认
**主要变更**: 新增MVP部署架构和安全防护方案，低成本快速上线方案

---

## 更新日志

### v2.7 (2025-02-06)
- ✅ 新增MVP部署架构章节（第10.4节）
  - 提供三种低成本服务器方案（国内/海外/双节点）
  - 月成本控制在$130-$240
  - 快速上线（1-2周）
  - 国内外用户均可访问
- ✅ 新增Cloudflare配置指南
  - 免费DNS解析
  - 免费SSL证书
  - 免费CDN加速
  - 免费DDoS基础防护
- ✅ 新增Nginx配置示例
  - 反向代理配置
  - 限流配置
  - HTTPS配置
  - 静态资源缓存
- ✅ 新增基础安全防护方案
  - 应用层限流（全局/API/登录）
  - 防爬虫检测
  - 数据库安全配置
- ✅ 新增成本估算表
  - 详细对比三种部署方案
  - 明确成本预算
- ✅ 新增部署流程指南
  - 软件安装步骤
  - 数据库初始化
  - 应用启动配置
- ✅ 新增后续扩展路径
  - MVP → 扩展阶段
  - 扩展 → 生产阶段
- ✅ 更新文档版本至v2.7

### v2.6 (2025-02-06)
- ✅ 新增平台直营代理询盘转发功能
  - 平台直营代理可以将询盘转发给其他普通代理
  - 转发原因：专业领域、地区分流、负载均衡
  - 目标代理可以接受或拒绝（拒绝时退回给原代理）
- ✅ 更新询盘状态定义
  - 新增 `FORWARDED`（已转发）状态
  - 新增 `REJECTED`（已拒绝/退回）状态
- ✅ 更新询盘状态流转逻辑
  - 支持转发 → 接受/拒绝 → 重新处理/关闭的完整流程
- ✅ 新增数据库表：inquiry_forwards
  - 记录所有询盘转发记录
  - 包含转发原因、特殊要求、响应时间等信息
- ✅ 新增API接口（平台直营代理）
  - `POST /api/agent/inquiries/:id/forward` - 转发询盘
  - `GET /api/agent/inquiries/:id/available-agents` - 获取可转发的代理列表
- ✅ 新增API接口（目标代理）
  - `POST /api/agent/inquiries/:id/accept` - 接受转发的询盘
  - `POST /api/agent/inquiries/:id/reject` - 拒绝/退回转发的询盘
- ✅ 新增API接口（查询）
  - `GET /api/agent/inquiries/:id/forward-history` - 查看询盘转发记录
- ✅ 增加转发场景示例
  - 专业领域转发：平台直营代理将专业产品询盘转给专业代理
  - 地区分流转发：平台直营代理将地区外询盘转给当地代理
  - 负载均衡转发：平台直营代理将部分询盘转发以减轻负载
- ✅ 更新代理接收询盘流程
  - 增加转发判断逻辑（平台直营代理可以选择转发）
- ✅ 增加权限验证
  - 仅平台直营代理（`is_platform_agent = true`）可以转发询盘

### v2.5 (2025-02-06)
- ✅ 新增产品信息模板系统（Product Template）
  - 运营管理员可创建和管理产品信息模板
  - 模板包含动态字段配置（TEXT、NUMBER、SELECT等）
  - 模板包含默认产品等级配置（如：试剂级、工业级、医药级）
- ✅ 优化产品详情页展示逻辑
  - 普通用户：不显示代理信息和联系方式，显示参考价格（均价，去掉最高最低）
  - 代理用户：显示所有供应商列表，包含联系方式和具体价格
- ✅ 新增分级价格系统
  - 产品可设置多个等级，每个等级独立定价
  - 支持价格阶梯（批量折扣）
- ✅ 新增参考价格自动计算功能
  - 参考价格 = 所有代理均价（去掉最高最低）
  - 按等级分组计算
  - 产品上架审核通过后自动触发重新计算
- ✅ 更新产品上架流程
  - 代理上架产品时先选择模板
  - 根据模板填写动态字段
  - 配置各等级价格
- ✅ 新增数据库表：product_templates
- ✅ 更新产品表结构
  - 新增 template_id 字段
  - 新增 grade_prices 字段（JSONB）
  - 新增 reference_prices 字段（JSONB，自动计算）
- ✅ 新增API接口
  - 产品模板管理API（运营管理员）
  - 产品浏览API（区分普通用户和代理视图）
  - 参考价格计算API（内部使用）
- ✅ 优化用户权限展示逻辑
  - 更新"用户类型与产品详情页显示"表格

### v2.4 (2025-02-06)

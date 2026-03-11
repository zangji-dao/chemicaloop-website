# CHEMICALOOP 管理后台功能设计文档

## 📋 目录
- [1. 系统架构](#1-系统架构)
- [2. 用户角色定义](#2-用户角色定义)
- [3. 用户注册流程](#3-用户注册流程)
- [4. 登录与权限系统](#4-登录与权限系统)
- [5. 管理后台模块](#5-管理后台模块)
- [6. 代理功能模块](#6-代理功能模块)
- [7. 数据权限控制](#7-数据权限控制)
- [8. 技术实现建议](#8-技术实现建议)

---

## 1. 系统架构

### 1.1 整体架构
```
┌─────────────────────────────────────────────────────────────┐
│                      CHEMICALOOP 系统架构                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   前端展示网站    │         │    管理后台       │          │
│  │  (Next.js 16)    │         │  (Next.js 16)    │          │
│  │  - 首页/产品等    │         │  - 管理面板       │          │
│  │  - 用户个人中心   │         │  - 权限管理       │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│           ┌──────────▼──────────┐                            │
│           │   后端 API 服务     │                            │
│           │  (Node.js + Express)│                            │
│           │  - 用户认证         │                            │
│           │  - 权限验证         │                            │
│           │  - 业务逻辑         │                            │
│           └──────────┬──────────┘                            │
│                      │                                       │
│           ┌──────────▼──────────┐                            │
│           │   PostgreSQL 数据库  │                            │
│           └─────────────────────┘                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 前端路由结构

#### 前台网站路由
```
/                           # 首页
/products                   # 产品列表
/trading                    # 购销信息（原News）
/agent                      # 代理招募页面
/contact                    # 联系我们
/user/profile               # 用户个人中心（需登录）
/user/orders                # 用户订单（需登录）
/user/favorites             # 收藏夹（需登录）
```

#### 管理后台路由
```
/admin                      # 管理后台首页（需管理员权限）
/admin/dashboard            # 数据看板
/admin/users                # 用户管理
/admin/agents               # 代理管理
/admin/products             # 产品管理
/admin/orders               # 订单管理
/admin/settings             # 系统设置
/admin/logs                 # 操作日志
```

#### 代理后台路由
```
/agent/portal               # 代理门户首页
/agent/dashboard            # 代理数据看板
/agent/customers            # 客户管理
/agent/products             # 产品管理（仅自己的产品）
/agent/orders               # 订单管理（仅自己的订单）
/agent/link                 # 专属链接生成
/agent/profile              # 代理资料设置
```

---

## 2. 用户角色定义

### 2.1 角色层级

| 角色代码 | 角色名称 | 权限级别 | 登录后台 | 访问范围 |
|---------|---------|---------|---------|---------|
| `SUPER_ADMIN` | 超级管理员 | Level 1 | ✅ 是 | 全部功能 |
| `SITE_ADMIN` | 网站管理员 | Level 2 | ✅ 是 | 部分功能 |
| `AGENT` | 平台贸易代理 | Level 3 | ✅ 是 | 代理门户 |
| `USER` | 普通用户 | Level 4 | ❌ 否 | 前台个人中心 |

### 2.2 角色详细说明

#### 2.2.1 超级管理员 (SUPER_ADMIN)
- **描述**：系统最高权限拥有者
- **权限**：
  - 管理所有用户（包括其他管理员）
  - 分配和调整所有用户角色
  - 查看所有数据和报表
  - 系统配置管理
  - 日志查看和审计
  - 数据库备份和恢复
- **数量限制**：1-3个（建议）

#### 2.2.2 网站管理员 (SITE_ADMIN)
- **描述**：负责网站日常运营和内容管理
- **权限**：
  - 查看用户列表（无法编辑超级管理员）
  - 审核代理申请
  - 管理产品信息（全部产品）
  - 处理订单
  - 查看统计数据（部分维度）
  - 发布新闻和公告
  - 回复用户咨询
- **数量限制**：根据需求

#### 2.2.3 平台贸易代理 (AGENT)
- **描述**：负责开发客户和销售产品的合作伙伴
- **权限**：
  - 生成和管理专属推广链接
  - 查看和管理自己的客户
  - 上架和管理自己的产品
  - 处理自己的订单
  - 查看自己的业绩数据
  - 自定义联系信息（绑定到专属链接）
- **数量限制**：无限制

#### 2.2.4 普通用户 (USER)
- **描述**：网站的最终用户，浏览和购买产品
- **权限**：
  - 浏览网站内容
  - 搜索和筛选产品
  - 下单购买
  - 查看个人订单
  - 收藏产品
  - 修改个人资料
  - 申请成为代理
- **数量限制**：无限制

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
│ 填写注册信息    │
│ - 用户名/邮箱   │
│ - 密码          │
│ - 确认密码      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 选择角色类型    │
│ ○ 普通用户      │
│ ○ 申请成为代理  │
└────┬────────────┘
     │
     ├────────────┐
     │            │
     ▼            ▼
┌────────┐  ┌────────────┐
│普通用户 │  │  申请代理   │
│注册    │  │  流程      │
└───┬────┘  └─────┬──────┘
    │             │
    ▼             ▼
┌────────┐  ┌─────────────┐
│创建USER│  │填写代理信息  │
│角色账户 │  │- 公司信息   │
│直接登录│  │- 联系方式   │
└────────┘  │- 经营范围   │
           └──────┬──────┘
                  │
                  ▼
           ┌──────────────┐
           │ 提交审核申请  │
           └──────┬───────┘
                  │
                  ▼
           ┌──────────────┐
           │ 等待管理员   │
           │ 审核（后台） │
           └──────┬───────┘
                  │
            ┌─────┴─────┐
            │           │
            ▼           ▼
        通过审核      拒绝申请
            │           │
            ▼           ▼
     创建AGENT角色   提示重新申请
    发送通知邮件
```

### 3.2 注册字段定义

#### 3.2.1 基础注册字段（所有角色通用）
```typescript
interface RegisterRequest {
  // 账号信息
  username: string;          // 用户名（唯一）
  email: string;             // 邮箱（唯一，用于登录）
  password: string;          // 密码（加密存储）
  confirmPassword: string;   // 确认密码
  
  // 个人信息
  firstName: string;         // 名
  lastName: string;          // 姓
  phone?: string;            // 手机号（可选）
  country: string;           // 国家（ISO代码）
  
  // 角色信息
  roleType: 'USER' | 'AGENT_APPLICANT';  // 申请的角色类型
  
  // 同意条款
  agreeTerms: boolean;       // 同意服务条款
  agreePrivacy: boolean;     // 同意隐私政策
  
  // 验证
  recaptchaToken?: string;   // 验证码（防机器人）
}
```

#### 3.2.2 代理申请额外字段（仅AGENT_APPLICANT需要）
```typescript
interface AgentApplicationRequest {
  // 基础注册字段（继承自RegisterRequest）
  ...RegisterRequest;
  
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
  
  // 其他
  experience: string;        // 从业经验描述
  expectedCustomers: number; // 预期客户数量
  
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
  pattern: /^[a-zA-Z0-9_]+$/, // 仅允许字母、数字、下划线
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
  // 至少8位，包含大小写字母、数字、特殊字符
  match: 'confirmPassword'
}

// 手机号验证（国际格式）
phone: {
  pattern: /^\+?[1-9]\d{1,14}$/ // E.164格式
}

// 公司名称验证
companyName: {
  required: true,
  minLength: 2,
  maxLength: 100
}
```

### 3.4 注册后处理

#### 3.4.1 普通用户注册
1. 创建用户记录（角色 = USER）
2. 发送欢迎邮件
3. 自动登录并跳转到首页
4. 显示"注册成功"提示

#### 3.4.2 代理申请
1. 创建用户记录（角色 = USER）
2. 创建代理申请记录（状态 = PENDING）
3. 发送确认邮件
4. 通知网站管理员审核
5. 跳转到"申请已提交"页面
6. 显示审核预计时间（1-3个工作日）

---

## 4. 登录与权限系统

### 4.1 登录流程

```
┌─────────┐
│ 用户访问 │
│ 登录页面 │
└────┬────┘
     │
     ▼
┌─────────────────┐
│ 输入登录信息    │
│ - 邮箱/用户名   │
│ - 密码          │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ 后端验证        │
│ - 账号存在性    │
│ - 密码正确性    │
│ - 账号状态      │
└────┬────────────┘
     │
     ├────────────┐
     │            │
     ▼            ▼
┌────────┐  ┌────────────┐
│登录成功 │  │ 登录失败   │
└───┬────┘  └─────┬──────┘
    │             │
    ▼             │
┌────────────┐    │
│ 生成JWT    │    │
│ Token      │    │
└────┬───────┘    │
     │            │
     ▼            ▼
┌────────────┐  ┌────────┐
│ 根据角色   │  │ 提示   │
│ 跳转       │  │ 错误   │
└────┬───────┘  └────────┘
     │
     ├─────────────────────────┐
     │                         │
     ▼                         ▼
┌──────────────┐      ┌──────────────┐
│ SUPER_ADMIN  │      │   AGENT      │
│ SITE_ADMIN   │      │ 跳转到       │
│ 跳转到       │      │ /agent/portal│
│ /admin       │      │              │
└──────────────┘      └──────────────┘
     │
     ▼
┌──────────────┐
│     USER     │
│ 跳转到首页   │
└──────────────┘
```

### 4.2 JWT Token 设计

```typescript
interface JWTPayload {
  // 用户基础信息
  userId: string;           // 用户ID
  email: string;            // 邮箱
  username: string;         // 用户名
  
  // 角色权限信息
  role: UserRole;           // 用户角色
  permissions: string[];    // 具体权限列表
  
  // 代理专属信息（仅AGENT角色）
  agentId?: string;         // 代理ID
  agentCode?: string;       // 代理邀请码
  
  // Token 信息
  iat: number;              // 签发时间
  exp: number;              // 过期时间
}

// Token 有效期配置
const TOKEN_CONFIG = {
  accessTokenExpiry: '2h',      // 访问令牌：2小时
  refreshTokenExpiry: '7d',     // 刷新令牌：7天
  rememberMeExpiry: '30d'       // 记住我：30天
};
```

### 4.3 权限中间件

```typescript
// 路由权限守卫
export function requireAuth(requiredRole?: UserRole) {
  return async (request: Request) => {
    const token = getAuthToken(request);
    
    // 1. 验证Token存在
    if (!token) {
      return redirectToLogin();
    }
    
    // 2. 验证Token有效性
    try {
      const payload = verifyJWT(token);
      
      // 3. 检查角色权限
      if (requiredRole) {
        const userRole = payload.role;
        const hasPermission = checkRolePermission(userRole, requiredRole);
        
        if (!hasPermission) {
          return redirect('/access-denied');
        }
      }
      
      // 4. 将用户信息附加到请求
      request.user = payload;
      return NextResponse.next();
      
    } catch (error) {
      // Token无效或过期
      return redirectToLogin();
    }
  };
}

// 角色权限检查
function checkRolePermission(
  userRole: UserRole, 
  requiredRole: UserRole
): boolean {
  const roleHierarchy = {
    SUPER_ADMIN: 1,
    SITE_ADMIN: 2,
    AGENT: 3,
    USER: 4
  };
  
  return roleHierarchy[userRole] <= roleHierarchy[requiredRole];
}
```

### 4.4 会话管理

```typescript
// 登录API
POST /api/auth/login
Request Body: {
  email: string,
  password: string,
  rememberMe?: boolean
}

Response: {
  success: true,
  data: {
    user: UserInfo,
    accessToken: string,
    refreshToken: string,
    expiresIn: number
  }
}

// 刷新Token
POST /api/auth/refresh
Request Body: {
  refreshToken: string
}

Response: {
  success: true,
  data: {
    accessToken: string,
    expiresIn: number
  }
}

// 登出
POST /api/auth/logout
Headers: Authorization: Bearer <accessToken>

Response: {
  success: true,
  message: "Logged out successfully"
}
```

---

## 5. 管理后台模块

### 5.1 模块结构

```
管理后台
├── 数据看板 (Dashboard)
│   ├── 概览统计（用户数、订单数、销售额等）
│   ├── 实时数据（在线用户、今日访问等）
│   ├── 图表展示（销售趋势、用户增长等）
│   └── 快捷入口（待处理事项）
│
├── 用户管理 (Users)
│   ├── 用户列表（分页、搜索、筛选）
│   ├── 用户详情（查看、编辑、禁用）
│   ├── 角色管理（分配、调整权限）
│   └── 操作日志（查看用户操作历史）
│
├── 代理管理 (Agents)
│   ├── 代理申请列表（待审核、已审核）
│   ├── 代理审核流程（通过/拒绝）
│   ├── 代理列表（查看所有代理）
│   ├── 代理详情（业绩、客户、订单）
│   └── 代理评级和等级
│
├── 产品管理 (Products)
│   ├── 产品列表（全部产品）
│   ├── 产品分类管理
│   ├── 产品上架/下架
│   ├── 产品审核（代理提交的产品）
│   └── 库存管理
│
├── 订单管理 (Orders)
│   ├── 订单列表（全部订单）
│   ├── 订单详情和状态跟踪
│   ├── 订单处理（确认、发货、完成）
│   └── 退款和售后
│
├── 内容管理 (Content)
│   ├── 新闻/文章发布
│   ├── 首页Banner管理
│   ├── 页面内容编辑
│   └── SEO设置
│
├── 系统设置 (Settings)
│   ├── 网站配置（名称、Logo等）
│   ├── 邮件配置（SMTP等）
│   ├── 支付配置
│   ├── 语言配置
│   └── 权限配置
│
└── 操作日志 (Logs)
    ├── 管理员操作日志
    ├── 系统错误日志
    └── 安全审计日志
```

### 5.2 数据看板设计

#### 5.2.1 核心指标卡片
```typescript
interface DashboardStats {
  // 用户指标
  totalUsers: number;          // 总用户数
  newUsersToday: number;       // 今日新增用户
  activeUsers: number;         // 活跃用户数
  
  // 代理指标
  totalAgents: number;         // 总代理数
  pendingAgentApplications: number;  // 待审核代理申请
  activeAgents: number;        // 活跃代理数
  
  // 产品指标
  totalProducts: number;       // 总产品数
  activeProducts: number;      // 上架产品数
  pendingProducts: number;     // 待审核产品
  
  // 订单指标
  totalOrders: number;         // 总订单数
  pendingOrders: number;       // 待处理订单
  todayOrders: number;         // 今日订单数
  
  // 销售指标
  totalRevenue: number;        // 总销售额
  todayRevenue: number;        // 今日销售额
  monthRevenue: number;        // 本月销售额
  
  // 网站指标
  todayPageViews: number;      // 今日页面浏览量
  todayUniqueVisitors: number; // 今日独立访客
  averageSessionDuration: number; // 平均会话时长
}
```

#### 5.2.2 图表组件
1. **销售趋势图**（折线图）
   - X轴：日期
   - Y轴：销售额/订单数
   - 时间范围：近7天/30天/90天

2. **用户增长图**（折线图）
   - X轴：日期
   - Y轴：新增用户数
   - 时间范围：近7天/30天/90天

3. **代理分布图**（饼图）
   - 按国家/地区分布

4. **产品分类占比**（柱状图）
   - 各分类的产品数量

### 5.3 用户管理模块

#### 5.3.1 用户列表功能
```typescript
interface UserListFilters {
  keyword?: string;           // 搜索关键词（用户名、邮箱）
  role?: UserRole;            // 角色筛选
  status?: 'active' | 'disabled' | 'pending'; // 状态筛选
  country?: string;           // 国家筛选
  registerDateStart?: Date;   // 注册开始日期
  registerDateEnd?: Date;     // 注册结束日期
  page: number;               // 页码
  pageSize: number;           // 每页数量
  sortBy?: string;            // 排序字段
  sortOrder?: 'asc' | 'desc'; // 排序方向
}

interface UserListItem {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'disabled' | 'pending';
  country: string;
  registerDate: Date;
  lastLoginDate: Date;
  agentInfo?: {               // 代理专属信息
    agentCode: string;
    status: 'active' | 'suspended';
    totalOrders: number;
    totalRevenue: number;
  };
}
```

#### 5.3.2 角色分配功能
```typescript
// 修改用户角色
POST /api/admin/users/:userId/role
Request Body: {
  role: UserRole,
  reason?: string  // 修改原因（记录日志）
}

Response: {
  success: true,
  message: "Role updated successfully"
}

// 批量修改角色
POST /api/admin/users/batch-role
Request Body: {
  userIds: string[],
  role: UserRole,
  reason?: string
}
```

### 5.4 代理管理模块

#### 5.4.1 代理申请审核
```typescript
interface AgentApplication {
  id: string;
  userId: string;
  applicantInfo: {
    name: string;
    email: string;
    phone: string;
  };
  companyInfo: {
    companyName: string;
    companyType: string;
    businessLicense: string;
  };
  businessInfo: {
    businessScope: string[];
    mainProducts: string[];
  };
  contactInfo: {
    contactEmail: string;
    contactPhone: string;
    contactAddress: string;
  };
  experience: string;
  expectedCustomers: number;
  referrerCode?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  appliedDate: Date;
  reviewedDate?: Date;
  reviewedBy?: string;  // 审核人ID
  reviewNotes?: string; // 审核备注
}

// 审核代理申请
POST /api/admin/agents/applications/:applicationId/review
Request Body: {
  action: 'APPROVE' | 'REJECT',
  reviewNotes: string
}

Response: {
  success: true,
  message: "Application reviewed successfully",
  data: {
    // 如果批准
    agentCode: string,      // 生成的代理码
    agentId: string
  }
}
```

#### 5.4.2 代理码生成规则
```typescript
// 代理码格式：CHEM + 随机6位数字 + 校验位
// 例如：CHEM1234567

function generateAgentCode(): string {
  const prefix = 'CHEM';
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  const checksum = calculateChecksum(random);
  return `${prefix}${random}${checksum}`;
}

// 校验位计算（简单的数字和算法）
function calculateChecksum(digits: string): string {
  const sum = digits.split('').reduce((acc, digit) => acc + parseInt(digit), 0);
  return (sum % 10).toString();
}
```

---

## 6. 代理功能模块

### 6.1 代理门户结构

```
代理门户 (/agent/portal)
├── 数据看板
│   ├── 我的业绩（销售额、订单数、客户数）
│   ├── 我的客户列表
│   ├── 我的产品列表
│   ├── 我的订单列表
│   └── 收入和佣金
│
├── 客户管理
│   ├── 客户列表（从专属链接注册的客户）
│   ├── 客户详情
│   ├── 客户跟进记录
│   └── 客户标签管理
│
├── 产品管理
│   ├── 发布新产品
│   ├── 我的产品列表
│   ├── 产品编辑
│   ├── 产品上下架
│   └── 库存管理
│
├── 订单管理
│   ├── 订单列表
│   ├── 订单详情
│   ├── 订单处理
│   └── 物流跟踪
│
├── 专属链接 (核心功能)
│   ├── 生成专属链接
│   ├── 链接预览
│   ├── 链接分享（复制、二维码）
│   ├── 链接点击统计
│   └── 自定义联系信息
│
└── 个人设置
    ├── 基本资料
    ├── 联系信息（绑定到专属链接）
    ├── 密码修改
    ├── 通知设置
    └── 代理等级信息
```

### 6.2 专属链接功能（核心）

#### 6.2.1 功能说明
代理可以生成自己的专属推广链接，当用户通过该链接访问网站时：
1. 网站的联系信息会显示为该代理的信息
2. 客服功能会绑定到该代理
3. 用户注册后自动成为该代理的客户
4. 用户的所有订单都与该代理关联

#### 6.2.2 专属链接格式
```
基础格式：https://www.chemicaloop.com?agent={agentCode}

示例：
https://www.chemicaloop.com?agent=CHEM1234567
https://www.chemicaloop.com/products?agent=CHEM1234567
https://www.chemicaloop.com/contact?agent=CHEM1234567
```

#### 6.2.3 专属链接数据结构
```typescript
interface AgentLink {
  id: string;
  agentId: string;
  agentCode: string;
  
  // 链接基本信息
  baseUrl: string;
  fullUrl: string;
  shortUrl: string;  // 短链接（可选）
  
  // 自定义信息（绑定到链接）
  customContact: {
    contactName: string;        // 联系人姓名
    contactEmail: string;       // 联系邮箱
    contactPhone: string;       // 联系电话
    contactWhatsApp?: string;   // WhatsApp（可选）
    contactAddress?: string;    // 联系地址（可选）
    companyLogo?: string;       // 公司Logo（可选）
  };
  
  // 统计数据
  stats: {
    totalClicks: number;        // 总点击数
    uniqueVisitors: number;     // 独立访客数
    conversions: number;        // 转化数（注册）
    conversionRate: number;     // 转化率
    lastClickDate: Date;        // 最后点击时间
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

// 更新专属联系信息
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

// 获取链接统计数据
GET /api/agent/link/stats?dateRange=7d
Response: {
  success: true,
  data: {
    totalClicks: number,
    uniqueVisitors: number,
    conversions: number,
    conversionRate: number,
    dailyStats: Array<{
      date: string;
      clicks: number;
      conversions: number;
    }>
  }
}

// 生成短链接（可选）
POST /api/agent/link/shorten
Request Body: {
  url: string;
  customAlias?: string;  // 自定义短链后缀（可选）
}

Response: {
  success: true,
  data: {
    shortUrl: string;
    qrCode: string;  // Base64二维码图片
  }
}
```

#### 6.2.5 专属链接前端实现

```typescript
// 1. 检测链接中的agent参数
// 在网站初始化时检测URL中的agent参数
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const agentCode = urlParams.get('agent');
  
  if (agentCode) {
    // 保存到localStorage
    localStorage.setItem('referredAgent', agentCode);
    
    // 调用API验证代理码并获取代理信息
    verifyAgentCode(agentCode).then(agentInfo => {
      if (agentInfo) {
        // 保存代理信息
        localStorage.setItem('agentInfo', JSON.stringify(agentInfo));
        
        // 替换联系信息
        updateContactInfo(agentInfo.customContact);
      }
    });
  }
}, []);

// 2. 更新联系信息
function updateContactInfo(customContact: CustomContactInfo) {
  // 更新联系页面的显示
  // 更新客服功能的绑定
  // 更新页脚的联系信息
}

// 3. 用户注册时关联代理
async function register(userData: RegisterData) {
  const referredAgent = localStorage.getItem('referredAgent');
  
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      ...userData,
      referredBy: referredAgent  // 传递代理码
    })
  });
  
  // 注册成功后清除
  localStorage.removeItem('referredAgent');
}
```

### 6.3 客户管理功能

#### 6.3.1 客户数据结构
```typescript
interface AgentCustomer {
  id: string;
  agentId: string;
  
  // 客户信息
  customerInfo: {
    userId: string;
    username: string;
    email: string;
    phone?: string;
    country: string;
  };
  
  // 关系信息
  referredAt: Date;            // 被推荐时间
  registrationSource: string;  // 注册来源（专属链接）
  
  // 业务数据
  totalOrders: number;         // 总订单数
  totalSpent: number;          // 总消费金额
  lastOrderDate?: Date;        // 最后下单时间
  
  // 跟进记录
  followUpRecords: Array<{
    id: string;
    type: 'call' | 'email' | 'visit' | 'message';
    notes: string;
    createdAt: Date;
  }>;
  
  // 标签
  tags: string[];
  
  // 状态
  status: 'active' | 'inactive' | 'potential';
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.4 产品管理功能

#### 6.4.1 代理产品数据结构
```typescript
interface AgentProduct {
  id: string;
  agentId: string;
  
  // 产品基本信息
  productInfo: {
    name: string;
    description: string;
    category: string;
    subcategory?: string;
  };
  
  // 详细信息
  details: {
    specifications: Record<string, string>;  // 规格参数
    applications: string[];                   // 应用领域
    packaging: string;                        // 包装方式
    deliveryTime: string;                     // 交付时间
  };
  
  // 价格信息
  pricing: {
    currency: string;
    minOrder: number;          // 最小起订量
    priceRanges: Array<{       // 价格阶梯
      minQty: number;
      maxQty?: number;
      price: number;
    }>;
  };
  
  // 媒体资源
  images: string[];            // 产品图片
  documents?: string[];       // 产品文档（COA, MSDS等）
  
  // 审核状态
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;         // 审核人
  reviewNotes?: string;        // 审核备注
  reviewedAt?: Date;
  
  // 库存
  stock: {
    available: number;         // 可用库存
    reserved: number;          // 预留库存
    unit: string;              // 单位
  };
  
  // 统计
  stats: {
    views: number;             // 浏览量
    inquiries: number;         // 询价次数
    orders: number;            // 订单数量
  };
  
  // 时间戳
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7. 数据权限控制

### 7.1 数据隔离规则

| 角色 | 用户数据 | 代理数据 | 产品数据 | 订单数据 | 系统配置 |
|-----|---------|---------|---------|---------|---------|
| 超级管理员 | 全部 | 全部 | 全部 | 全部 | 全部 |
| 网站管理员 | 全部 | 全部 | 全部 | 全部 | 部分 |
| 代理 | 自己的客户 | 仅自己 | 仅自己 | 仅自己 | 无 |
| 普通用户 | 仅自己 | 无 | 查看 | 仅自己 | 无 |

### 7.2 权限实现策略

#### 7.2.1 基于角色的访问控制（RBAC）
```typescript
// 权限定义
const PERMISSIONS = {
  // 用户管理
  'user:view': ['SUPER_ADMIN', 'SITE_ADMIN'],
  'user:create': ['SUPER_ADMIN'],
  'user:edit': ['SUPER_ADMIN', 'SITE_ADMIN'],
  'user:delete': ['SUPER_ADMIN'],
  'user:assign_role': ['SUPER_ADMIN'],
  
  // 代理管理
  'agent:view': ['SUPER_ADMIN', 'SITE_ADMIN'],
  'agent:approve': ['SUPER_ADMIN', 'SITE_ADMIN'],
  'agent:suspend': ['SUPER_ADMIN'],
  
  // 产品管理
  'product:view': ['SUPER_ADMIN', 'SITE_ADMIN', 'AGENT'],
  'product:create': ['AGENT', 'SUPER_ADMIN', 'SITE_ADMIN'],
  'product:edit': ['AGENT(own)', 'SUPER_ADMIN', 'SITE_ADMIN'],
  'product:delete': ['SUPER_ADMIN', 'SITE_ADMIN'],
  'product:approve': ['SUPER_ADMIN', 'SITE_ADMIN'],
  
  // 订单管理
  'order:view': ['SUPER_ADMIN', 'SITE_ADMIN', 'AGENT'],
  'order:edit': ['SUPER_ADMIN', 'SITE_ADMIN', 'AGENT(own)'],
  'order:delete': ['SUPER_ADMIN'],
  
  // 系统设置
  'settings:view': ['SUPER_ADMIN', 'SITE_ADMIN'],
  'settings:edit': ['SUPER_ADMIN'],
  'settings:email': ['SUPER_ADMIN'],
  'settings:payment': ['SUPER_ADMIN'],
};

// 权限检查函数
function hasPermission(
  userRole: UserRole,
  permission: string,
  resourceOwnerId?: string
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  if (!allowedRoles) return false;
  
  // 检查角色
  if (allowedRoles.includes(userRole)) {
    return true;
  }
  
  // 检查"仅自己"权限
  if (allowedRoles.includes(`${userRole}(own)`)) {
    return resourceOwnerId === getCurrentUserId();
  }
  
  return false;
}
```

#### 7.2.2 数据查询过滤
```typescript
// 通用数据查询过滤器
export function addDataFilter(
  query: QueryBuilder,
  userRole: UserRole,
  userId: string,
  resourceType: string
): QueryBuilder {
  switch (userRole) {
    case 'SUPER_ADMIN':
      // 超级管理员：不过滤
      return query;
      
    case 'SITE_ADMIN':
      // 网站管理员：不过滤
      return query;
      
    case 'AGENT':
      // 代理：只看自己的数据
      if (resourceType === 'customers') {
        return query.where('agentId', userId);
      } else if (resourceType === 'products') {
        return query.where('agentId', userId);
      } else if (resourceType === 'orders') {
        return query.where('agentId', userId);
      }
      return query;
      
    case 'USER':
      // 普通用户：只看自己的数据
      if (resourceType === 'orders') {
        return query.where('customerId', userId);
      }
      return query;
      
    default:
      return query;
  }
}

// 使用示例
async function getAgentProducts(user: User) {
  let query = db.select().from(products);
  
  // 应用权限过滤
  query = addDataFilter(query, user.role, user.id, 'products');
  
  return await query;
}
```

### 7.3 审计日志

```typescript
// 审计日志数据结构
interface AuditLog {
  id: string;
  
  // 操作者信息
  userId: string;
  userRole: UserRole;
  userAgent?: string;
  ipAddress: string;
  
  // 操作信息
  action: string;              // 操作类型（CREATE, UPDATE, DELETE, VIEW）
  resourceType: string;        // 资源类型（USER, PRODUCT, ORDER等）
  resourceId: string;          // 资源ID
  
  // 变更内容
  changes?: {
    before?: Record<string, any>;  // 变更前的值
    after?: Record<string, any>;   // 变更后的值
  };
  
  // 结果
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
  
  // 时间戳
  createdAt: Date;
}

// 记录审计日志
async function logAuditEvent(data: {
  userId: string;
  userRole: UserRole;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: any;
  status: 'SUCCESS' | 'FAILURE';
  errorMessage?: string;
}) {
  await db.insert(auditLogs).values({
    ...data,
    userAgent: getUserAgent(),
    ipAddress: getClientIP(),
    createdAt: new Date()
  });
}
```

---

## 8. 技术实现建议

### 8.1 数据库设计

#### 8.1.1 核心表结构

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
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
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
  
  -- 状态
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  level VARCHAR(20) DEFAULT 'BRONZE',  -- 代理等级
  
  -- 业绩统计
  total_orders INTEGER DEFAULT 0,
  total_revenue DECIMAL(15,2) DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_agent_code (agent_code),
  INDEX idx_user_id (user_id),
  INDEX idx_status (status)
);

-- 代理申请表
CREATE TABLE agent_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 申请信息（JSON存储详细字段）
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
  conversions INTEGER DEFAULT 0,
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

-- 客户关系表（代理的客户）
CREATE TABLE agent_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  customer_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  
  -- 关系信息
  referred_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  registration_source VARCHAR(100),
  
  -- 业务数据
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(15,2) DEFAULT 0,
  last_order_at TIMESTAMP,
  
  -- 跟进记录
  tags VARCHAR(500)[],  -- 数组存储标签
  
  -- 状态
  status VARCHAR(20) DEFAULT 'active',
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  UNIQUE(agent_id, customer_user_id),
  INDEX idx_agent_id (agent_id),
  INDEX idx_customer_user_id (customer_user_id)
);

-- 代理产品表
CREATE TABLE agent_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id) ON DELETE CASCADE,
  
  -- 产品基本信息
  name VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  subcategory VARCHAR(100),
  
  -- 详细信息
  specifications JSONB,
  applications TEXT[],
  packaging VARCHAR(200),
  delivery_time VARCHAR(100),
  
  -- 价格信息
  currency VARCHAR(3) DEFAULT 'USD',
  min_order INTEGER DEFAULT 1,
  price_ranges JSONB,
  
  -- 媒体资源
  images TEXT[],
  documents TEXT[],
  
  -- 库存
  available_stock INTEGER DEFAULT 0,
  reserved_stock INTEGER DEFAULT 0,
  stock_unit VARCHAR(50) DEFAULT 'KG',
  
  -- 审核状态
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  
  -- 统计
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  order_count INTEGER DEFAULT 0,
  
  -- 时间戳
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- 索引
  INDEX idx_agent_id (agent_id),
  INDEX idx_status (status),
  INDEX idx_category (category)
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
```

### 8.2 API 路由设计

#### 8.2.1 认证相关
```
POST   /api/auth/register           # 用户注册
POST   /api/auth/login              # 用户登录
POST   /api/auth/logout             # 用户登出
POST   /api/auth/refresh            # 刷新Token
POST   /api/auth/forgot-password    # 忘记密码
POST   /api/auth/reset-password     # 重置密码
GET    /api/auth/verify-email/:token # 验证邮箱
```

#### 8.2.2 用户相关
```
GET    /api/user/profile            # 获取个人资料
PUT    /api/user/profile            # 更新个人资料
PUT    /api/user/password           # 修改密码
POST   /api/user/avatar             # 上传头像
GET    /api/user/orders             # 获取订单列表
GET    /api/user/orders/:id         # 获取订单详情
```

#### 8.2.3 管理员相关
```
GET    /api/admin/dashboard/stats   # 获取看板统计
GET    /api/admin/users             # 获取用户列表
GET    /api/admin/users/:id         # 获取用户详情
PUT    /api/admin/users/:id         # 更新用户信息
PUT    /api/admin/users/:id/role    # 修改用户角色
DELETE /api/admin/users/:id         # 删除用户

GET    /api/admin/agents            # 获取代理列表
GET    /api/admin/agents/applications # 获取代理申请列表
POST   /api/admin/agents/applications/:id/review # 审核代理申请
PUT    /api/admin/agents/:id        # 更新代理信息
PUT    /api/admin/agents/:id/status # 更新代理状态

GET    /api/admin/products          # 获取产品列表
POST   /api/admin/products          # 创建产品
PUT    /api/admin/products/:id      # 更新产品
DELETE /api/admin/products/:id      # 删除产品
POST   /api/admin/products/:id/approve # 审核产品

GET    /api/admin/orders            # 获取订单列表
GET    /api/admin/orders/:id        # 获取订单详情
PUT    /api/admin/orders/:id/status # 更新订单状态

GET    /api/admin/settings          # 获取系统设置
PUT    /api/admin/settings          # 更新系统设置

GET    /api/admin/audit-logs        # 获取审计日志
```

#### 8.2.4 代理相关
```
GET    /api/agent/dashboard/stats   # 获取看板统计
GET    /api/agent/customers         # 获取客户列表
GET    /api/agent/customers/:id     # 获取客户详情
POST   /api/agent/customers/:id/follow-up # 添加跟进记录

GET    /api/agent/products          # 获取产品列表
POST   /api/agent/products          # 创建产品
PUT    /api/agent/products/:id      # 更新产品
DELETE /api/agent/products/:id      # 删除产品

GET    /api/agent/orders            # 获取订单列表
GET    /api/agent/orders/:id        # 获取订单详情

GET    /api/agent/link              # 获取专属链接
PUT    /api/agent/link/contact      # 更新联系信息
GET    /api/agent/link/stats        # 获取链接统计
POST   /api/agent/link/shorten      # 生成短链接

GET    /api/agent/profile           # 获取代理资料
PUT    /api/agent/profile           # 更新代理资料
```

### 8.3 前端技术实现

#### 8.3.1 状态管理
使用 Zustand 或 React Context API 管理全局状态：
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

#### 8.3.2 权限组件
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
<PermissionGuard allowedRoles={['SUPER_ADMIN', 'SITE_ADMIN']}>
  <UserManagement />
</PermissionGuard>
```

#### 8.3.3 路由保护
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
      
      // 检查是否为管理员
      if (payload.role !== 'SUPER_ADMIN' && payload.role !== 'SITE_ADMIN') {
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

### 8.4 安全考虑

#### 8.4.1 密码安全
```typescript
import bcrypt from 'bcryptjs';

// 加密密码
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

// 验证密码
async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

#### 8.4.2 防止暴力破解
```typescript
// 登录尝试限制
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function checkLoginAttempts(email: string): boolean {
  const attempts = loginAttempts.get(email);
  
  if (!attempts) {
    return true;
  }
  
  // 5分钟内超过5次尝试
  const isBlocked = 
    attempts.count >= 5 &&
    Date.now() - attempts.lastAttempt < 5 * 60 * 1000;
  
  return !isBlocked;
}

function recordLoginAttempt(email: string, success: boolean) {
  if (success) {
    loginAttempts.delete(email);
    return;
  }
  
  const attempts = loginAttempts.get(email) || { count: 0, lastAttempt: 0 };
  attempts.count += 1;
  attempts.lastAttempt = Date.now();
  loginAttempts.set(email, attempts);
}
```

#### 8.4.3 SQL注入防护
使用参数化查询或ORM（如Prisma、Drizzle ORM）防止SQL注入。

#### 8.4.4 XSS防护
```typescript
// 使用DOMPurify清理用户输入
import DOMPurify from 'dompurify';

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input);
}
```

---

## 9. 实施计划

### 阶段1：基础功能（优先级：高）
1. ✅ 用户注册功能（普通用户）
2. ✅ 用户登录/登出
3. ✅ JWT Token认证
4. ✅ 用户个人中心
5. ✅ 基础权限系统

### 阶段2：代理系统（优先级：高）
1. ✅ 代理申请流程
2. ✅ 代理审核功能（管理员）
3. ✅ 代理门户基础页面
4. ✅ 专属链接生成
5. ✅ 专属链接数据统计

### 阶段3：管理后台（优先级：中）
1. ✅ 数据看板
2. ✅ 用户管理模块
3. ✅ 代理管理模块
4. ✅ 系统设置模块
5. ✅ 操作日志

### 阶段4：业务功能（优先级：中）
1. ✅ 代理产品管理
2. ✅ 代理客户管理
3. ✅ 订单管理（基础）
4. ✅ 佣金计算

### 阶段5：高级功能（优先级：低）
1. ⭕ 代理等级系统
2. ⭕ 推荐奖励机制
3. ⭕ 数据分析报表
4. ⭕ 消息通知系统
5. ⭕ 多语言后台

---

## 10. 待确认事项

请确认以下设计是否符合您的需求：

### 10.1 角色权限
- [ ] 超级管理员、网站管理员、代理、普通用户的权限划分是否合理？
- [ ] 是否需要增加其他角色（如客服、财务等）？

### 10.2 代理功能
- [ ] 专属链接的实现方式是否符合预期？
- [ ] 代理上架产品是否需要管理员审核？
- [ ] 代理客户是否可以转卖给其他代理？

### 10.3 数据权限
- [ ] 代理是否可以看到其他代理的产品信息（只读）？
- [ ] 网站管理员是否有权限修改所有代理的产品？

### 10.4 其他功能
- [ ] 是否需要佣金/分成功能？
- [ ] 是否需要代理等级系统（青铜、白银、黄金）？
- [ ] 是否需要推荐奖励机制（A推荐B，B推荐C）？

### 10.5 技术实现
- [ ] 是否同意使用上述数据库设计？
- [ ] 是否同意使用JWT进行认证？
- [ ] 后端API架构是否需要调整？

---

**文档版本**: v1.0  
**创建日期**: 2025-02-06  
**最后更新**: 2025-02-06  
**状态**: 待确认

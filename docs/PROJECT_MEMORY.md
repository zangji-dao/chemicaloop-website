# CHEMICALOOP 项目记忆

> 每次新对话，请先阅读此文档了解项目背景和规则

---

## 1. 项目开发目标

CHEMICALOOP 是一个 AI 驱动的化工外贸工作流平台，利用 AI 能力优化化工行业核心业务流程。

### 核心能力

| 能力 | 说明 |
|------|------|
| 产品知识能力 | 化工产品数据整合、PubChem 同步、智能问答 |
| 交易供需匹配能力 | 询盘系统、代理商匹配、智能推荐 |
| 多语言交流能力 | 用户母语化操作、实时翻译、跨语言沟通 |
| 贸易数据整合能力 | UN Comtrade 数据、HS 编码体系、市场分析 |
| 策略分析能力 | 市场趋势、价格分析、贸易情报 |

### 用户角色体系

| 角色 | 权限级别 | 说明 |
|------|----------|------|
| `ADMIN` | Level 1 | 超级管理员，系统最高权限 |
| `OPERATOR` | Level 2 | 运营管理员，日常运营管理 |
| `PLATFORM_AGENT` | Level 3 | 平台直营代理，平台贸易窗口 |
| `AGENT` | Level 4 | 平台贸易代理，上架产品、接收询盘 |
| `USER` | Level 5 | 普通用户，浏览产品、发起询盘 |

### UI 设计风格

#### 前端用户端（WWW）- 明亮蓝色系

| 设计元素 | 规范 |
|----------|------|
| **主题色** | Blue-600 (`oklch(0.45 0.18 250)`) |
| **背景** | 白色为主，浅灰辅助 |
| **圆角** | 0.625rem (10px) |
| **字体** | Inter + 系统字体回退，支持中日韩文字 |
| **布局** | 全屏 Hero Banner + 响应式卡片 |
| **交互** | 渐变遮罩、淡入动画、轮播控制 |

**核心组件风格**：
```tsx
// 按钮
className="bg-blue-600 text-white hover:bg-blue-700 rounded-lg"

// 卡片
className="bg-white rounded-xl shadow-sm border border-slate-100"

// 输入框
className="bg-white border border-slate-200 rounded-lg focus:ring-blue-500"
```

#### 管理后台（Admin）- 深色 Slate 系

| 设计元素 | 规范 |
|----------|------|
| **主题色** | Blue-600（激活状态） |
| **背景** | Slate-900（主背景）、Slate-800（侧边栏/头部） |
| **文字** | 白色（主标题）、Slate-300（正文）、Slate-400（次要） |
| **边框** | Slate-700 |
| **圆角** | 8px (rounded-lg) |
| **布局** | 固定侧边栏 + 可折叠子菜单 |

**核心组件风格**：
```tsx
// 侧边栏菜单项（激活）
className="bg-blue-600 text-white rounded-lg"

// 侧边栏菜单项（未激活）
className="text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg"

// Header
className="bg-slate-800 border-b border-slate-700"

// 按钮
className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
```

#### 设计一致性原则

| 规则 | 说明 |
|------|------|
| 圆角统一 | 统一使用 `rounded-lg` (8px)，卡片可用 `rounded-xl` (12px) |
| 间距规范 | 页面内边距 `p-4`，组件间距 `gap-4`，表单项间距 `space-y-4` |
| 状态颜色 | 成功 `green-*`、警告 `yellow-*`、错误 `red-*`、信息 `blue-*` |
| 过渡动画 | 统一使用 `transition-colors`，过渡时间默认 150ms |
| 响应式 | 移动优先，断点：`sm:640px`、`md:768px`、`lg:1024px`、`xl:1280px` |

---

## 2. 项目技术架构

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16.1.1 (App Router) |
| 前端 | React 19.2.3 + TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| ORM | Drizzle ORM 0.45.1 |
| 数据库 | PostgreSQL |
| 国际化 | next-intl |
| 后端 | Express (独立服务，端口 3001) |
| 包管理 | pnpm (禁止使用 npm/yarn) |

### BFF 架构

```
┌──────────────┐
│   前端页面    │
└──────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Next.js API Routes (BFF层)  │  ← src/app/api/
│  - 验证前端请求               │
│  - 转发到后端，带上用户信息    │
└──────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Express 后端                 │  ← backend/
│  - 业务逻辑处理               │
│  - 数据库操作                 │
└──────────────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  PostgreSQL 数据库            │
└──────────────────────────────┘
```

**为什么采用 BFF 模式？**
- 未来需要多端适配（Web、App、小程序）
- 每个端可以有独立的 BFF 层，适配不同格式
- Express 后端专注业务逻辑，不关心前端差异

---

## 3. 开发核心原则（不能触碰）

### 3.1 不能改变技术架构
- 尊重现有的 BFF 架构设计
- 不随意删除 `backend/` 或合并层级
- 两套验证逻辑各司其职：
  - `src/lib/auth.ts` — Next.js BFF 层验证
  - `backend/src/middleware/auth.ts` — Express 后端验证

### 3.2 代码考古
- 修改任何代码前，先读取相关现有代码
- 使用 `read_file`、`grep_file` 充分调研
- 不盲目改动，不理解不写代码

### 3.3 不能重复造轮子
- 复用已有代码、组件、函数
- 项目已有 shadcn/ui 组件库，位于 `src/components/ui/`
- 检查是否已有类似功能再动手

### 3.4 包管理约束
- **只允许使用 pnpm**
- 禁止使用 npm 或 yarn

---

## 4. 关键业务逻辑

### 4.1 PubChem 同步预览模式
同步 PubChem 数据时采用预览模式，数据仅保存在前端状态，用户点击"保存"后才写入数据库。

### 4.2 翻译流程
同步后不自动翻译，用户点击"翻译并保存"按钮触发。

### 4.3 权限验证体系
- `src/lib/auth.ts` — Next.js BFF 层统一验证入口
- `src/lib/constants/roles.ts` — 角色常量和权限判断函数
- `src/hooks/useAuth.tsx` — 前端用户认证
- `src/hooks/useAdminAuth.tsx` — 管理后台认证
- `backend/src/middleware/auth.ts` — Express 后端验证中间件

### 4.4 两套登录系统
- `auth_token` — 前端用户登录
- `admin_token` — 管理后台登录

### 4.5 端口规范
- Web 服务必须运行在 **5000** 端口
- Express 后端运行在 **3001** 端口
- 禁止使用 9000 端口（系统保留）

### 4.6 代码复用规范

#### API Route Token 提取
- **禁止**在 API Route 中重复编写 Token 提取逻辑
- **必须**使用 `src/lib/auth.ts` 提供的工具函数：
  - `getToken(request)` — 仅提取 token，不验证
  - `getUserIdFromRequest(request)` — 提取用户 ID
  - `verifyToken(request)` — 验证 token 并返回用户信息
  - `verifyUser(request)` — 验证普通用户
  - `verifyAgent(request)` — 验证代理商权限
  - `verifyAdmin(request)` — 验证管理员权限

```typescript
// ✅ 正确
import { getToken } from '@/lib/auth';
const token = getToken(request);

// ❌ 错误（禁止重复）
const authHeader = request.headers.get('authorization');
const token = authHeader?.replace('Bearer ', '');
```

#### API Route 后端地址
- **禁止**在 API Route 中重复定义后端地址或硬编码
- **必须**使用 `src/config/api.ts` 提供的配置：
  - `API_CONFIG.backendURL` — 后端服务地址（不带 /api 后缀）
  - `API_CONFIG.baseURL` — API 基础地址（带 /api 后缀）

```typescript
// ✅ 正确
import { API_CONFIG } from '@/config/api';
const response = await fetch(`${API_CONFIG.backendURL}/api/auth/login`, ...);

// ❌ 错误（禁止重复）
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
const backendUrl = `http://localhost:3001/api/...`;
```

#### 后端权限中间件
- **禁止**在 Express 路由中重复编写角色判断逻辑
- **必须**使用 `backend/src/middleware/auth.ts` 提供的中间件：
  - `authMiddleware` — 验证用户身份，设置 `req.userId` 和 `req.userRole`
  - `agentOnlyMiddleware` — 仅允许代理商及以上角色
  - `adminOnlyMiddleware` — 仅允许管理员角色
  - `superAdminOnlyMiddleware` — 仅允许超级管理员（可扩展）

```typescript
// ✅ 正确
import { authMiddleware, adminOnlyMiddleware } from '../middleware/auth';
router.get('/users', authMiddleware, adminOnlyMiddleware, async (req, res) => {
  // 直接写业务逻辑
});

// ❌ 错误（禁止重复）
router.get('/users', authMiddleware, async (req, res) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ error: '无权访问' });
  }
  // 业务逻辑
});
```

#### 前端 Token 管理
- **禁止**在前端组件中直接访问 localStorage 获取 token
- **必须**使用统一的服务：
  - 前端用户系统：`src/services/authService.ts`
    - `getToken()` — 获取用户 token
    - `saveToken(token)` — 保存 token
    - `getUser()` — 获取用户信息
    - `saveUser(user)` — 保存用户信息
    - `clearAuth()` — 清除认证信息
  - 管理后台系统：`src/services/adminAuthService.ts`
    - `getAdminToken()` — 获取管理员 token
    - `getAdminUser()` — 获取管理员信息
    - `saveAdminAuth(token, user)` — 保存认证信息
    - `clearAdminAuth()` — 清除认证信息

```typescript
// ✅ 正确（前端用户系统）
import { getToken } from '@/services/authService';
const token = getToken();

// ✅ 正确（管理后台）
import { getAdminToken } from '@/services/adminAuthService';
const token = getAdminToken();

// ❌ 错误（禁止直接访问）
const token = localStorage.getItem('auth_token');
const token = localStorage.getItem('admin_token');
```

#### 已统一项

| 问题 | 现状 | 建议 |
|------|------|------|
| ~~BACKEND_URL~~ | ~~18+ 处重复定义~~ | ✅ 已统一使用 `API_CONFIG.backendURL` |
| ~~后端角色判断~~ | ~~10 处重复~~ | ✅ 已创建 `adminOnlyMiddleware` |
| ~~前端 localStorage~~ | ~~25+ 处直接访问~~ | ✅ 已统一使用 authService/adminAuthService |

---

> **提示**：每次对话结束前，请更新此文档，记录新增的关键决策和已解决的问题。

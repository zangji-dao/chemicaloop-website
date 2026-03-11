# CHEMICALOOP 项目记忆

> 每次新对话，请先阅读此文档了解项目背景和规则

---

## 0. 关键决策摘要

> 本章节记录最近的重要技术决策，方便快速了解项目变更

### 2026-03 前端性能优化

| 决策 | 说明 | 影响 |
|------|------|------|
| 图片懒加载 | 所有非首屏图片添加 `loading="lazy"` | 14 处图片优化，减少首屏加载时间 |
| 翻译并发化 | `productSyncService.ts` 从串行改为并发翻译 | 翻译速度提升 5-10 倍 |
| 搜索防抖 | 管理后台搜索输入统一 300ms 防抖 | 减少不必要的 API 请求 |
| 防抖 Hook | 创建 `src/hooks/useDebounce.ts` 通用 Hook | 统一防抖实现，避免重复代码 |

### 代码复用规范（前期决策）

| 决策 | 说明 | 消除重复 |
|------|------|----------|
| 统一 Token 提取 | `src/lib/auth.ts` | 12+ 处 |
| 统一后端地址 | `src/config/api.ts` | 18+ 处 |
| 后端权限中间件 | `adminOnlyMiddleware` | 10 处 |
| 前端 Token 服务 | `adminAuthService.ts` | 25+ 处 |

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

### 3.5 前端性能原则

#### 请求与接口优化

| 规则 | 说明 | 示例 |
|------|------|------|
| 禁止重复请求 | 相同参数、相同接口只发一次 | 使用缓存或状态管理 |
| 禁止循环内请求 | 绝不在 `for/forEach/while` 里调用 API | 批量接口替代 |
| 批量接口合并 | 多个请求合并为一个 | `/api/items?ids=1,2,3` |
| 按需请求字段 | 只请求需要的字段，不拿多余数据 | `SELECT id, name` 而非 `SELECT *` |

```typescript
// ❌ 错误：循环内发请求
for (const id of ids) {
  await fetch(`/api/items/${id}`);
}

// ✅ 正确：批量请求
await fetch(`/api/items?ids=${ids.join(',')}`);
```

#### 渲染与页面性能

| 规则 | 说明 | 实现方式 |
|------|------|----------|
| 减少不必要渲染 | 数据不变不重新渲染 | `React.memo`、`useMemo`、`useCallback` |
| 长列表优化 | 大量数据不一次性渲染 | 虚拟列表、分页加载、`react-window` |
| DOM 操作最小化 | 不频繁增删 DOM | 批量更新、`React.Fragment` |

```tsx
// ❌ 错误：直接渲染大量数据
{items.map(item => <Item key={item.id} {...item} />)}

// ✅ 正确：虚拟列表
import { FixedSizeList } from 'react-window';
<FixedSizeList height={600} itemCount={items.length} itemSize={50}>
  {({ index, style }) => <Item {...items[index]} style={style} />}
</FixedSizeList>
```

#### 代码与逻辑优化

| 规则 | 说明 |
|------|------|
| DRY 强制 | 相同逻辑抽成函数/工具/公共模块，禁止复制粘贴 |
| 禁止重复计算 | 同样结果只算一次，使用 `useMemo` 缓存 |
| 逻辑扁平化 | 少嵌套、少深度判断，代码越简单执行越快 |

```tsx
// ❌ 错误：渲染内重复计算
function List({ items }) {
  return items.map(item => {
    const processed = heavyProcess(item); // 每次渲染都计算
    return <Item key={item.id} data={processed} />;
  });
}

// ✅ 正确：缓存计算结果
function List({ items }) {
  const processedItems = useMemo(
    () => items.map(item => heavyProcess(item)),
    [items]
  );
  return processedItems.map(item => <Item key={item.id} data={item} />);
}
```

#### 资源与加载速度

| 规则 | 说明 | 实现方式 |
|------|------|----------|
| 图片懒加载 | 看不到的内容不提前加载 | `loading="lazy"`、`IntersectionObserver` |
| 资源体积最小化 | 不加载无用 JS/CSS、大图压缩 | Tree shaking、图片压缩 |
| 依赖按需引入 | 不用的库/组件不引入 | 动态导入 `import()`、`next/dynamic` |

```tsx
// ❌ 错误：全量引入
import { Button, Input, Select, ... } from 'ui-library';

// ✅ 正确：按需引入
import Button from 'ui-library/Button';
import Input from 'ui-library/Input';

// ✅ 正确：动态导入
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
});
```

#### 交互流畅度

| 规则 | 说明 | 实现方式 |
|------|------|----------|
| 避免阻塞主线程 | 大量计算不卡住页面 | Web Worker、`requestIdleCallback` |
| 防抖/节流 | 搜索、滚动、输入高频操作 | `lodash.debounce`、`lodash.throttle` |
| 错误不阻塞流程 | 异常捕获，不崩页面 | `try-catch`、Error Boundary |

```tsx
// ✅ 防抖示例
import { debounce } from 'lodash';

const handleSearch = debounce((value) => {
  fetch(`/api/search?q=${value}`);
}, 300);

// ✅ Error Boundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <Component />
</ErrorBoundary>
```

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

### 4.7 前端性能优化记录

#### 2026-03 执行的优化

| 优化项 | 说明 | 涉及文件 |
|--------|------|----------|
| P0 图片懒加载 | 为非首屏图片添加 `loading="lazy"` | users/page.tsx, spu/page.tsx, products/page.tsx, products/upload/page.tsx, products/[id]/page.tsx, news/page.tsx, InquiryList.tsx, Header.tsx, AdminLanguageSwitcher.tsx |
| P1 循环请求改并发 | 翻译功能从串行改为并发 | productSyncService.ts |
| P2 搜索防抖 | 添加 300ms 防抖 | users/page.tsx, customs/page.tsx, products/page.tsx |

#### 防抖 Hook 使用规范

项目提供了 `src/hooks/useDebounce.ts` 统一防抖能力：

```typescript
// 方式1：防抖值
import { useDebounce } from '@/hooks/useDebounce';
const debouncedSearch = useDebounce(search, 300);

// 方式2：防抖回调
import { useDebouncedCallback } from '@/hooks/useDebounce';
const debouncedSearch = useDebouncedCallback(() => {
  triggerSearch();
}, 300);

// 方式3：支持立即执行的防抖
import { useDebouncedCallbackWithFlush } from '@/hooks/useDebounce';
const { debounced, flush, cancel } = useDebouncedCallbackWithFlush(callback, 300);
```

#### 剩余优化项（待执行）

| 优化项 | 说明 | 优先级 |
|--------|------|--------|
| P3 React.memo | 列表项组件 memo 优化 | 低 |
| P4 虚拟列表 | 大数据列表优化 | 低 |
| P5 大文件拆分 | 5 个 >50KB 文件拆分 | 低 |

---

> **提示**：每次对话结束前，请更新此文档，记录新增的关键决策和已解决的问题。

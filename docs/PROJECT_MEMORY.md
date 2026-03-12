# CHEMICALOOP 项目记忆

> 每次新对话，请先阅读此文档了解项目背景和关键规则

---

## 1. 项目概览

**CHEMICALOOP** 是 AI 驱动的化工外贸工作流平台。

### 用户角色体系

| 角色 | 权限 | 说明 |
|------|------|------|
| `ADMIN` | 最高 | 超级管理员 |
| `OPERATOR` | 高 | 运营管理员 |
| `PLATFORM_AGENT` | 中 | 平台直营代理 |
| `AGENT` | 低 | 贸易代理，上架产品、接收询盘 |
| `USER` | 基础 | 普通用户，浏览产品、发起询盘 |

### 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 + React 19 + TypeScript |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 后端 | Express (端口 3001) |
| 数据库 | PostgreSQL + Drizzle ORM |
| 包管理 | **pnpm (禁止 npm/yarn)** |

---

## 2. 核心业务逻辑

### 2.1 PubChem 同步流程

```
用户输入 CAS → 预览模式（仅前端状态） → 用户确认 → 写入数据库
                    ↓
              不自动翻译
                    ↓
              用户点击"翻译并保存" → 触发翻译
```

**关键点**：数据不会自动写入数据库，必须用户确认。

### 2.2 两套登录系统

| 系统 | Token 名 | 用途 |
|------|----------|------|
| 前端用户 | `auth_token` | 普通用户、代理商登录 |
| 管理后台 | `admin_token` | 管理员登录 |

**关键点**：两套系统独立，Token 不可混用。

### 2.3 权限验证体系

| 层级 | 文件 | 职责 |
|------|------|------|
| BFF 层 | `src/lib/auth.ts` | 前端请求验证，提取用户信息 |
| 后端层 | `backend/src/middleware/auth.ts` | 业务逻辑验证，角色判断 |

**关键点**：两层验证各司其职，不可省略任一层。

### 2.4 API 响应格式

```typescript
// 统一格式
{ code: 0, msg: 'success', data: {...} }  // 成功
{ code: 1, msg: '错误信息', data: null }   // 失败
```

---

## 3. 架构约束（不能触碰）

### 3.1 BFF 架构

```
前端页面 → Next.js API Routes (BFF) → Express 后端 → 数据库
              ↓
         验证请求、转发
```

**禁止**：
- 删除 `backend/` 目录
- 在前端直接调用后端（必须经过 BFF）
- 合并 BFF 层和后端

### 3.2 端口规范

| 服务 | 端口 | 说明 |
|------|------|------|
| Web | **5000** | 必须且只能 |
| 后端 | 3001 | Express |
| 系统保留 | 9000 | 禁止使用 |

### 3.3 代码复用规范

| 场景 | 必须使用 | 禁止 |
|------|----------|------|
| Token 提取 | `src/lib/auth.ts` | 重复编写提取逻辑 |
| 后端地址 | `src/config/api.ts` | 硬编码地址 |
| 后端权限 | `adminOnlyMiddleware` | 重复角色判断 |
| 前端 Token | `adminAuthService.ts` | 直接访问 localStorage |

---

## 4. API 目录规范

### 4.1 设计原则：按调用端分类

**一级目录：按调用端分类**

```
api/
├── admin/     # 管理端独自调用
├── www/       # 用户端独自调用
└── common/    # 双端同时调用
```

**二级目录：按功能模块分类**

```
admin/
├── auth/          # 认证
├── products/      # 产品管理
├── spu/           # SPU管理
├── users/         # 用户管理
├── inquiries/     # 询盘管理
├── data-sync/     # 数据同步
├── customs/       # 海关数据
└── stats/         # 统计

www/
├── auth/          # 认证
├── profile/       # 个人中心
├── messages/      # 消息系统
├── email/         # 邮件
├── agent/         # 代理商
├── contacts/      # 联系人
└── supply-inquiries/

common/
├── products/      # 产品查询
├── inquiries/     # 询价
├── ai/            # AI服务
└── trade-data/    # 贸易数据
```

### 4.2 分类逻辑

| 一级目录 | 说明 | 认证要求 |
|----------|------|----------|
| `admin` | 仅管理端调用 | 需要 admin_token |
| `www` | 仅用户端调用 | 需要 auth_token |
| `common` | 双端共用 | 需要 token（不区分类型） |

### 4.3 示例

| API 功能 | 路径 | 原因 |
|----------|------|------|
| 用户登录 | `/www/auth/login` | 用户端独有 |
| 管理员登录 | `/admin/auth/login` | 管理端独有 |
| 获取用户信息 | `/www/auth/me` | 用户端独有 |
| 产品审核 | `/admin/products/[id]/review` | 管理端独有 |
| 产品列表 | `/common/products` | 双端共用 |
| AI 翻译 | `/common/ai/translate` | 双端共用 |
| 个人资料 | `/www/profile` | 用户端独有 |
| 用户管理 | `/admin/users` | 管理端独有 |

### 4.4 前端调用规范

```typescript
// 用户前端调用
fetch('/api/www/auth/login', ...)      // 登录
fetch('/api/www/profile', ...)         // 获取个人资料
fetch('/api/common/products', ...)     // 产品列表（共用）

// 管理后台调用
fetch('/api/admin/auth/login', ...)    // 管理员登录
fetch('/api/admin/products', ...)      // 产品管理
fetch('/api/common/products', ...)     // 产品列表（共用）

// 两端共用
fetch('/api/common/ai/translate', ...) // AI 翻译
fetch('/api/common/inquiries', ...)    // 询价
```

---

## 5. API 测试记录

### 5.1 测试完成状态

| 日期 | 接口总数 | 测试通过 | 覆盖率 | 状态 |
|------|----------|----------|--------|------|
| 2026-03-13 | 99个 | 99个 | 100% | ✅ 完成 |

### 5.2 接口分布

| 类别 | 数量 | 说明 |
|------|------|------|
| Admin 接口 | 49个 | 管理端独有 |
| WWW 接口 | 40个 | 用户端独有 |
| Common 接口 | 10个 | 双端共用 |

### 5.3 测试场景

- ✅ 正常流程测试：接口正常返回业务数据
- ✅ 权限验证测试：未授权请求返回 Unauthorized
- ✅ 参数验证测试：必填参数缺失返回错误提示

---

## 6. 编程规范（精简版）

### 6.1 代码质量

| 原则 | 说明 |
|------|------|
| DRY | 相同逻辑只写一次 |
| KISS | 保持简单，不嵌套过深 |
| 单一职责 | 一个函数只做一件事 |
| 拒绝魔法值 | 常量命名，不写无意义数字 |

### 5.2 性能原则

| 规则 | 说明 |
|------|------|
| 不重复请求 | 缓存、批量接口 |
| 不重复计算 | useMemo、useCallback |
| 不重复渲染 | React.memo |
| 图片懒加载 | `loading="lazy"` |
| 搜索防抖 | 300ms 延迟 |

### 5.3 安全原则

| 规则 | 说明 |
|------|------|
| 全接口鉴权 | 无白名单 |
| 输入必校验 | zod、类型检查 |
| 防越权 | 校验资源归属 |
| 敏感数据 | 不明文、不暴露 |

### 5.4 健壮性

| 规则 | 说明 |
|------|------|
| 防御性编程 | 处理空值、边界 |
| 异常必捕获 | try-catch，不静默失败 |
| 统一响应 | code + msg + data |

---

### 5.5 多语言翻译（Admin）

### 核心文件

| 文件 | 职责 |
|------|------|
| `src/lib/admin-i18n.ts` | 翻译配置，定义所有语言的翻译键 |
| `src/contexts/AdminLocaleContext.tsx` | 语言上下文，提供 `t()` 翻译函数 |

### 翻译机制

```
用户选择语言 → 存入 localStorage (admin_locale) → Context 更新 → t() 返回对应翻译
```

### 使用方式

**方式一：菜单项配置（推荐）**

```typescript
// 1. 配置阶段 - 定义 labelKey（不是 label）
const menuConfig = [
  { icon: LayoutDashboard, path: '/admin', labelKey: 'nav.dashboard' },
  { icon: Settings, path: '/admin/settings', labelKey: 'nav.settings' },
];

// 2. 运行阶段 - 通过 t() 获取翻译后的文本
const menuItems = menuConfig.map(item => ({
  ...item,
  label: t(item.labelKey),
}));

// 3. 渲染阶段 - 使用翻译后的 label
<span>{item.label}</span>
```

**方式二：直接使用 t() 函数**

```jsx
import { useAdminLocale } from '@/contexts/AdminLocaleContext';

function MyComponent() {
  const { t } = useAdminLocale();
  
  return (
    <button title={t('nav.collapseSidebar')}>
      {t('nav.collapseSidebar')}
    </button>
  );
}
```

### 新增翻译键步骤

1. 在 `src/lib/admin-i18n.ts` 中找到对应语言的 `nav` 对象
2. 添加新的键值对，例如：
   ```typescript
   nav: {
     // ... 现有翻译
     newFeature: 'New Feature',  // 英文
   }
   ```
3. **必须为所有 10 种语言添加翻译**：`en`, `zh`, `ja`, `ko`, `de`, `fr`, `es`, `pt`, `ru`, `ar`
4. 使用时调用 `t('nav.newFeature')`

### 翻译键命名规范

| 前缀 | 用途 | 示例 |
|------|------|------|
| `nav.*` | 导航菜单 | `nav.dashboard`, `nav.users` |
| `common.*` | 通用文本 | `common.save`, `common.cancel` |
| `products.*` | 产品相关 | `products.title`, `products.approve` |
| `users.*` | 用户相关 | `users.title`, `users.email` |

### 注意事项

- ⚠️ **禁止硬编码文字**：不要直接写 `"仪表盘"`，应使用 `t('nav.dashboard')`
- ⚠️ **新增功能必须补全所有语言**：不能只添加英文或中文
- ⚠️ **翻译键不存在时**：`t()` 会返回键名本身作为 fallback

---

## 6. UI 设计规范

### 6.1 前端用户端（WWW）

| 元素 | 规范 |
|------|------|
| 主题色 | Blue-600 |
| 背景 | 白色 |
| 圆角 | rounded-lg (8px) |

### 6.2 管理后台（Admin）

| 元素 | 规范 |
|------|------|
| 主题色 | Blue-600（激活） |
| 背景 | Slate-900 |
| 文字 | 白色/Slate-300 |
| 边框 | Slate-700 |

### 6.3 通用规范

- 圆角：`rounded-lg`（卡片用 `rounded-xl`）
- 间距：`p-4`、`gap-4`
- 状态色：green 成功、yellow 警告、red 错误、blue 信息

---

## 7. 常见陷阱与已解决问题

### 7.1 已统一项

| 问题 | 解决方案 |
|------|----------|
| Token 提取重复 12+ 处 | `src/lib/auth.ts` |
| 后端地址重复 18+ 处 | `src/config/api.ts` |
| 角色判断重复 10 处 | `adminOnlyMiddleware` |
| localStorage 直接访问 25+ 处 | `adminAuthService.ts` |

### 7.2 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| 循环内发请求 | 性能问题 | 批量接口 |
| 搜索无防抖 | 请求过多 | useDebounce |
| 图片无懒加载 | 首屏慢 | loading="lazy" |
| 端口 9000 被占用 | 系统保留 | 使用 5000 |

---

## 8. 工具函数速查

### 8.1 防抖 Hook

```typescript
import { useDebouncedCallback } from '@/hooks/useDebounce';

const debouncedSearch = useDebouncedCallback(() => {
  triggerSearch();
}, 300);
```

### 8.2 权限验证

```typescript
// BFF 层
import { verifyAdmin, getToken } from '@/lib/auth';

// 后端
import { adminOnlyMiddleware } from '../middleware/auth';
```

### 8.3 Token 管理

```typescript
// 前端用户
import { getToken, getUser } from '@/services/authService';

// 管理后台
import { getAdminToken, getAdminUser } from '@/services/adminAuthService';
```

---

> **更新记录**：每次对话结束前，根据新增的关键决策更新此文档。

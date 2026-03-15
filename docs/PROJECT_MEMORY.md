# CHEMICALOOP 项目编程规范

> ⚠️ **重要：每次新对话，必须先阅读此文档。这是编程规范，不是日志！**
>
> 本文档定义的所有规则**必须严格遵守**，禁止随意改动架构设计。

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

## 2. 核心业务逻辑（必须遵守）

### 2.1 PubChem 同步流程

```
用户输入 CAS → 预览模式（仅前端状态） → 用户确认 → 写入数据库
                    ↓
              不自动翻译
                    ↓
              用户点击"翻译并保存" → 触发翻译
```

**⚠️ 强制规则**：数据不会自动写入数据库，必须用户确认。

### 2.2 新建 SPU 流程（完整流程）

```
┌─────────────────────────────────────────────────────────────────────┐
│                         新建 SPU 完整流程                              │
└─────────────────────────────────────────────────────────────────────┘

第一步：搜索页面 (admin/spu/create)
┌─────────────────────────────────────────────────────────────────────┐
│  输入 CAS 号 → 搜索 → 同步 PubChem 数据                               │
│                    ↓                                                  │
│              数据预缓存到 sessionStorage                              │
│                    ↓                                                  │
│              显示"数据已准备好"提示                                    │
│                    ↓                                                  │
│              点击"下一步"进入图片页面                                  │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
第二步：图片页面 (admin/spu/create/image)
┌─────────────────────────────────────────────────────────────────────┐
│  从 sessionStorage 读取预览数据                                       │
│         ↓                                                             │
│  渲染 2D 结构图 (structure2dSvg)                                      │
│         ↓                                                             │
│  用户点击"绘图" → 调用 AI 生成产品图                                   │
│         ↓                                                             │
│  产品图 key 添加到 sessionStorage 预览数据                            │
│         ↓                                                             │
│  点击"下一步"进入信息页面                                             │
└─────────────────────────────────────────────────────────────────────┘
                                    ↓
第三步：信息页面 (admin/spu/create/info)
┌─────────────────────────────────────────────────────────────────────┐
│  从 sessionStorage 读取预览数据                                       │
│         ↓                                                             │
│  用原文（英文）填充表单                                               │
│         ↓                                                             │
│  用户点击"翻译"按钮                                                   │
│         ↓                                                             │
│  ┌─────────────────────────────────────────────┐                     │
│  │ 翻译遮罩层：                                  │                     │
│  │  • 禁止滚动和编辑                             │                     │
│  │  • 并行翻译（Promise.all）                    │                     │
│  │  • 显示每个字段翻译进度                        │                     │
│  │  • 翻译字段：name, description, physicalDesc │                     │
│  └─────────────────────────────────────────────┘                     │
│         ↓                                                             │
│  翻译完成 → 用当前选择语言渲染表单                                     │
│         ↓                                                             │
│  用户点击"保存" → 写入数据库（状态 ACTIVE）                            │
│         ↓                                                             │
│  显示成功弹窗 → 点击确认 → 返回 SPU 列表页                             │
└─────────────────────────────────────────────────────────────────────┘
```

**核心数据流**：
```
sessionStorage (spu_create_preview_data)
    ↓
┌───────────────────────────────────────────────────────────┐
│ 预览数据结构：                                             │
│ {                                                         │
│   cas: string,                                            │
│   nameEn: string,           // 英文名称（原文）             │
│   nameZh: string,           // 中文名称（翻译后）           │
│   description: string,      // 描述                       │
│   physicalDescription: string, // 物理描述                 │
│   structure2dSvg: string,   // 2D 结构图 SVG              │
│   structureImageKey: string, // 结构图存储 key             │
│   productImageKey: string,  // 产品图存储 key              │
│   ...其他 PubChem 字段                                     │
│ }                                                         │
└───────────────────────────────────────────────────────────┘
```

**关键 Hook 文件**：
| 文件 | 职责 |
|------|------|
| `src/hooks/useSPUCreate.ts` | 搜索页面逻辑 |
| `src/hooks/useSPUCreateImage.ts` | 图片页面逻辑 |
| `src/hooks/useSPUCreateInfo.ts` | 信息页面逻辑 |

**⚠️ 强制规则**：
- 翻译必须并行执行（`Promise.all`），禁止串行
- 翻译时必须显示遮罩层，禁止用户操作
- 保存成功后必须清除 sessionStorage 预览数据
- 翻译目标语言根据当前 locale 决定

### 2.3 两套登录系统

| 系统 | Token 名 | 用途 |
|------|----------|------|
| 前端用户 | `auth_token` | 普通用户、代理商登录 |
| 管理后台 | `admin_token` | 管理员登录 |

**⚠️ 强制规则**：两套系统独立，Token 不可混用。

### 2.3 权限验证体系

| 层级 | 文件 | 职责 |
|------|------|------|
| BFF 层 | `src/lib/auth.ts` | 前端请求验证，提取用户信息 |
| 后端层 | `backend/src/middleware/auth.ts` | 业务逻辑验证，角色判断 |

**⚠️ 强制规则**：两层验证各司其职，不可省略任一层。

### 2.4 API 响应格式

```typescript
// 统一格式（必须遵守）
{ code: 0, msg: 'success', data: {...} }  // 成功
{ code: 1, msg: '错误信息', data: null }   // 失败
```

---

## 3. 架构约束（绝对不能触碰）

### 3.1 BFF 架构（核心约束）

```
前端页面 → Next.js API Routes (BFF) → Express 后端 → 数据库
              ↓
         验证请求、转发
```

**❌ 严格禁止**：
- 删除 `backend/` 目录
- 在前端直接调用后端（必须经过 BFF）
- 合并 BFF 层和后端

### 3.2 端口规范（严格执行）

| 服务 | 端口 | 说明 |
|------|------|------|
| Web | **5000** | 必须且只能 |
| 后端 | 3001 | Express |
| 系统保留 | 9000 | 禁止使用 |

### 3.3 代码复用规范（必须使用）

| 场景 | 必须使用 | 禁止 |
|------|----------|------|
| Token 提取 | `src/lib/auth.ts` | 重复编写提取逻辑 |
| 后端地址 | `src/config/api.ts` | 硬编码地址 |
| 后端权限 | `adminOnlyMiddleware` | 重复角色判断 |
| 前端 Token | `adminAuthService.ts` | 直接访问 localStorage |

---

## 4. API 目录分类规范（强制执行）

### 4.1 新建 API 时的决策流程

```
                    新建 API
                        │
          ┌─────────────┴─────────────┐
          │ 谁会调用这个接口？         │
          └─────────────┬─────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
   仅管理后台        仅用户前端       两端都调用
        │               │               │
        ▼               ▼               ▼
   /api/admin/     /api/www/     /api/common/
```

### 4.2 分类决策表

| 问题 | 答案 | 放置目录 |
|------|------|----------|
| 只有管理后台需要调用？ | 是 | `admin/` |
| 只有用户前端需要调用？ | 是 | `www/` |
| 两端都可能调用？ | 是 | `common/` |

### 4.3 典型场景判断

| 接口功能 | 调用方 | 目录 |
|----------|--------|------|
| 用户登录/注册 | 用户前端 | `www/auth/` |
| 管理员登录 | 管理后台 | `admin/auth/` |
| 产品 CRUD（增删改） | 管理后台 | `admin/products/` |
| 产品列表/详情 | 两端 | `common/products/` |
| 用户个人资料 | 用户前端 | `www/profile/` |
| 用户管理（封禁/角色） | 管理后台 | `admin/users/` |
| AI 翻译/润色 | 两端 | `common/ai/` |
| 询盘发送 | 两端 | `common/inquiries/` |
| 询盘管理（审核/分配） | 管理后台 | `admin/inquiries/` |

### 4.4 认证要求

| 目录 | Token 类型 | 验证方式 |
|------|------------|----------|
| `admin/` | `admin_token` | 管理员专属 |
| `www/` | `auth_token` | 用户专属 |
| `common/` | 任一 token | 不区分来源 |

### 4.5 禁止事项

- ❌ 管理后台调用 `www/` 接口
- ❌ 用户前端调用 `admin/` 接口
- ❌ 将两端共用的接口放在 `admin/` 或 `www/`
- ❌ 在 `common/` 中区分用户类型做不同逻辑

---

## 5. 编程规范（严格执行）

### 5.1 代码质量

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

#### 核心文件

| 文件 | 职责 |
|------|------|
| `src/lib/admin-i18n.ts` | 翻译配置，定义所有语言的翻译键 |
| `src/contexts/AdminLocaleContext.tsx` | 语言上下文，提供 `t()` 翻译函数 |

#### 翻译机制

```
用户选择语言 → 存入 localStorage (admin_locale) → Context 更新 → t() 返回对应翻译
```

#### 使用方式

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

#### 新增翻译键步骤

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

#### 翻译键命名规范

| 前缀 | 用途 | 示例 |
|------|------|------|
| `nav.*` | 导航菜单 | `nav.dashboard`, `nav.users` |
| `common.*` | 通用文本 | `common.save`, `common.cancel` |
| `products.*` | 产品相关 | `products.title`, `products.approve` |
| `users.*` | 用户相关 | `users.title`, `users.email` |

#### 注意事项

- ⚠️ **禁止硬编码文字**：不要直接写 `"仪表盘"`，应使用 `t('nav.dashboard')`
- ⚠️ **新增功能必须补全所有语言**：不能只添加英文或中文
- ⚠️ **翻译键不存在时**：`t()` 会返回键名本身作为 fallback

---

## 6. UI 设计规范（必须遵守）

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

## 7. 常见陷阱与规避方案

### 7.1 已统一的工具（必须使用）

| 问题 | 解决方案 |
|------|----------|
| Token 提取重复 | `src/lib/auth.ts` |
| 后端地址重复 | `src/config/api.ts` |
| 角色判断重复 | `adminOnlyMiddleware` |
| localStorage 直接访问 | `adminAuthService.ts` |

### 7.2 常见错误与规避

| 错误 | 原因 | 规避方案 |
|------|------|----------|
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

## 9. 脚本目录规范

### 9.1 目录结构

```
scripts/
├── README.md         # 使用说明
├── SECURITY.md       # 安全规范文档
├── lib/              # 共享库
│   └── env-check.ts  # 环境安全检查
├── dev/              # 项目生命周期脚本
│   ├── prepare.sh    # 依赖安装
│   ├── dev.sh        # 开发环境启动
│   ├── build.sh      # 构建
│   └── start.sh      # 生产启动
├── seed/             # 种子数据/测试数据
├── batch/            # 批量处理脚本
└── sync/             # 数据同步/导入
```

### 9.2 新增脚本分类决策

| 脚本用途 | 放置目录 | 示例 |
|----------|----------|------|
| 项目启动/构建/部署 | `dev/` | `deploy.sh` |
| 生成测试/演示数据 | `seed/` | `seed-users.ts` |
| 批量处理现有数据 | `batch/` | `batch-delete-duplicates.ts` |
| 从外部同步/导入数据 | `sync/` | `sync-from-erp.ts` |

---

## 10. 路由架构规范（2026-03-13 更新）

### 10.1 后端路由挂载

后端路由**必须**按以下分类挂载：

```typescript
// Routes - 按 admin/www/common 分类
app.use('/api/admin', adminRoutes);
app.use('/api/www/auth', authRoutes);
app.use('/api/www/messages', messageRoutes);
app.use('/api/www/contact-requests', contactRequestsRoutes);
app.use('/api/www/contact-members', contactMembersRoutes);
app.use('/api/www/profile', profileRoutes);
app.use('/api/www/email-settings', emailSettingsRoutes);
app.use('/api/common/products', productRoutes);
app.use('/api/common/inquiries', inquiryRoutes);
app.use('/api/common/news', newsRoutes);
```

### 10.2 前端 BFF 路由转发

前端 BFF 路由**必须**转发到对应后端路径：

| 前端路径 | 后端路径 |
|---------|---------|
| `/api/admin/*` | `/api/admin/*` |
| `/api/www/*` | `/api/www/*` |
| `/api/common/*` | `/api/common/*` |

**⚠️ 禁止**：在 BFF 中使用 `replace('/api/www/', '/api/')` 这种临时代理逻辑。

### 10.3 路由映射表

| 功能模块 | 后端路径 | 前端路径 |
|---------|---------|---------|
| 用户认证 | `/api/www/auth/*` | `/api/www/auth/*` |
| 消息系统 | `/api/www/messages/*` | `/api/www/messages/*` |
| 联系人请求 | `/api/www/contact-requests/*` | `/api/www/contact-requests/*` |
| 联系人成员 | `/api/www/contact-members/*` | `/api/www/contact-members/*` |
| 个人资料 | `/api/www/profile/*` | `/api/www/profile/*` |
| 邮箱设置 | `/api/www/email-settings/*` | `/api/www/email-settings/*` |
| 产品 | `/api/common/products/*` | `/api/common/products/*` |
| 询盘 | `/api/common/inquiries/*` | `/api/common/inquiries/*` |
| 新闻 | `/api/common/news/*` | `/api/common/news/*` |
| 管理后台 | `/api/admin/*` | `/api/admin/*` |

---

> 📌 **最后更新**：2026-03-14
>
> 本文档是**编程规范**，不是日志。所有规则**必须严格遵守**。

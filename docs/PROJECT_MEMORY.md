# CHEMICALOOP 项目记忆

> 每次新对话，请先阅读此文档了解项目背景和规则

---

## 1. 项目概览

CHEMICALOOP 是一个化工产品 B2B 交易平台，支持多语言国际化，连接化工产品供应商与采购商。

### 用户角色

| 角色 | 权限级别 | 说明 |
|------|----------|------|
| `SUPER_ADMIN` | Level 1 | 超级管理员，系统最高权限 |
| `OPERATOR` | Level 1.2 | 运营管理员，日常运营管理 |
| `PLATFORM_AGENT` | Level 1.5 | 平台直营代理，平台贸易窗口 |
| `AGENT` | Level 2 | 平台贸易代理，上架产品、接收询盘 |
| `USER` | Level 3 | 普通用户，浏览产品、发起询盘 |

---

## 2. 技术栈

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

---

## 3. 架构设计（BFF 模式）

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

**为什么要 BFF 模式？**
- 未来需要多端适配（Web、App、小程序）
- 每个端可以有独立的 BFF 层，适配不同格式
- Express 后端专注业务逻辑，不关心前端差异

---

## 4. 开发原则（必须遵守）

### 4.1 不能改变技术架构
- 尊重现有的 BFF 架构设计
- 不随意删除 `backend/` 或合并层级
- 两套验证逻辑各司其职：
  - `src/lib/auth.ts` — Next.js BFF 层验证
  - `backend/src/middleware/auth.ts` — Express 后端验证

### 4.2 代码考古
- 修改任何代码前，先读取相关现有代码
- 使用 `read_file`、`grep_file` 充分调研
- 不盲目改动，不理解不写代码

### 4.3 不能重复造轮子
- 复用已有代码、组件、函数
- 项目已有 shadcn/ui 组件库，位于 `src/components/ui/`
- 检查是否已有类似功能再动手

### 4.4 包管理约束
- **只允许使用 pnpm**
- 禁止使用 npm 或 yarn

### 4.5 端口规范
- Web 服务必须运行在 **5000** 端口
- Express 后端运行在 **3001** 端口
- 禁止使用 9000 端口（系统保留）

---

## 5. 关键决策记录

| 决策 | 说明 |
|------|------|
| 同步预览模式 | 同步 PubChem 数据时采用预览模式，数据仅保存在前端状态，用户点击"保存"后才写入数据库 |
| 翻译流程 | 同步后不自动翻译，用户点击"翻译并保存"按钮触发 |
| API 合并 | `fetch-pubchem` 合并到 `sync-pubchem`，通过 `preview` 参数区分 |
| HS码精简 | 删除 `hs_code_source` 和 `hs_code_6`，只保留 `hs_code` 和 `hs_code_extensions` |
| 权限验证统一 | 创建 `src/lib/auth.ts` 统一 API 层验证逻辑，消除 12 处重复代码 |
| 角色常量化 | 创建 `src/lib/constants/roles.ts` 定义可扩展的角色层级和权限判断函数 |
| 前端权限增强 | 创建 `useAdminAuth` hook 和 `PermissionGate` 组件 |

---

## 6. 已解决的问题

| 问题 | 解决方案 |
|------|----------|
| 同步操作直接写入数据库 | 改为预览模式，点击保存才写入 |
| `fetch-pubchem` 和 `sync-pubchem` 代码重复 | 合并为一个 API，通过 `preview` 参数区分 |
| 某些字段翻译后没有渲染 | 复制完整的 `extractPubChemProperties` 函数 |
| 重复点击同步按钮导致多次请求 | 添加 `if (syncingSingle) return` 检查 |
| API 层存在 12 处重复 JWT 验证逻辑 | 创建 `src/lib/auth.ts` 统一验证模块 |
| 前端缺乏统一权限判断机制 | 增强 `useAuth` hook，创建 `useAdminAuth` 和 `PermissionGate` |

---

## 7. 核心文件索引

| 文件/目录 | 用途 |
|-----------|------|
| `src/lib/auth.ts` | Next.js BFF 层权限验证（统一入口） |
| `src/lib/constants/roles.ts` | 角色常量和权限判断函数 |
| `src/hooks/useAuth.tsx` | 前端认证 hook |
| `src/hooks/useAdminAuth.tsx` | 管理后台专用认证 hook |
| `src/components/PermissionGate.tsx` | 按角色控制组件渲染 |
| `src/components/ui/` | shadcn/ui 组件库 |
| `backend/src/middleware/auth.ts` | Express 后端验证中间件 |
| `docs/DEVELOPMENT_GUIDE.md` | 完整开发文档 |

---

## 8. 当前 TODO

（无）

---

## 9. 更新日志

| 日期 | 更新内容 |
|------|----------|
| 2025-01-XX | 初始化项目记忆文档 |

---

> **提示**：每次对话结束前，请更新此文档，记录新增的关键决策和已解决的问题。

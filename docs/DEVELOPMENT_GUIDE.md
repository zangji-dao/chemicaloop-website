# CHEMICALOOP 开发技术文档

> 最后更新: 2025年3月

## 目录

- [1. 项目概述](#1-项目概述)
- [2. 技术栈](#2-技术栈)
- [3. 目录结构](#3-目录结构)
- [4. 架构设计](#4-架构设计)
- [5. 核心模块](#5-核心模块)
- [6. API 设计](#6-api-设计)
- [7. 数据库设计](#7-数据库设计)
- [8. 开发规范](#8-开发规范)
- [9. 部署指南](#9-部署指南)

---

## 1. 项目概述

### 1.1 项目简介

CHEMICALOOP 是一个化工产品 B2B 交易平台，连接化工产品供应商与采购商，支持多语言国际化。

### 1.2 核心功能

| 模块 | 功能描述 |
|------|----------|
| **产品展示** | 化工产品列表、详情、CAS 号检索 |
| **询盘系统** | 用户发起询盘、代理商回复 |
| **消息系统** | 站内消息、实时通知 |
| **代理商系统** | 产品上架、专属链接、客户管理 |
| **管理后台** | 产品审核、用户管理、数据统计 |

### 1.3 用户角色

| 角色 | 权限级别 | 说明 |
|------|----------|------|
| `SUPER_ADMIN` | Level 1 | 超级管理员，系统最高权限 |
| `OPERATOR` | Level 1.2 | 运营管理员，日常运营管理 |
| `PLATFORM_AGENT` | Level 1.5 | 平台直营代理，平台贸易窗口 |
| `AGENT` | Level 2 | 平台贸易代理，上架产品、接收询盘 |
| `USER` | Level 3 | 普通用户，浏览产品、发起询盘 |

---

## 2. 技术栈

### 2.1 前端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | 16.1.1 | 全栈框架 (App Router) |
| **React** | 19.2.3 | UI 库 |
| **TypeScript** | 5.x | 类型安全 |
| **Tailwind CSS** | 4.x | 样式框架 |
| **shadcn/ui** | latest | UI 组件库 |
| **next-intl** | 4.8.2 | 国际化 |
| **React Hook Form** | 7.70.0 | 表单处理 |
| **Zod** | 4.3.5 | 数据验证 |
| **Recharts** | 2.15.4 | 图表库 |
| **Lucide React** | 0.468.0 | 图标库 |

### 2.2 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| **Node.js** | 24.x | 运行时环境 |
| **PostgreSQL** | - | 主数据库 |
| **Drizzle ORM** | 0.45.1 | ORM 框架 |
| **JWT** | 9.0.3 | 身份认证 |
| **bcrypt** | 6.0.0 | 密码加密 |
| **AWS S3** | 3.958.0 | 对象存储 |

### 2.3 开发工具

| 工具 | 用途 |
|------|------|
| **pnpm** | 包管理器 |
| **ESLint** | 代码检查 |
| **Playwright** | E2E 测试 |
| **TypeScript** | 类型检查 |

---

## 3. 目录结构

```
/workspace/projects/
│
├── 📂 src/                          # 主要源代码
│   │
│   ├── 📂 app/                      # Next.js App Router
│   │   ├── 📂 (admin)/              # 路由组: 管理后台
│   │   │   └── admin/               # /admin/* 路由
│   │   │       ├── login/           # 管理员登录
│   │   │       ├── products/        # 产品管理
│   │   │       ├── users/           # 用户管理
│   │   │       ├── inquiries/       # 询盘管理
│   │   │       ├── spu/             # SPU 管理
│   │   │       ├── spu-requests/    # SPU 请求
│   │   │       ├── customs/         # 海关数据
│   │   │       └── data-sync/       # 数据同步
│   │   │
│   │   ├── 📂 (www)/                # 路由组: 前端用户站点
│   │   │   └── [locale]/            # 国际化路由
│   │   │       ├── login/           # 用户登录
│   │   │       ├── register/        # 用户注册
│   │   │       ├── products/        # 产品展示
│   │   │       ├── messages/        # 消息系统
│   │   │       ├── profile/         # 用户中心
│   │   │       ├── agent/           # 代理商大厅
│   │   │       ├── contact/         # 联系页面
│   │   │       └── news/            # 新闻页面
│   │   │
│   │   ├── 📂 api/                  # API 路由
│   │   │   ├── auth/                # 认证相关
│   │   │   ├── admin/               # 管理后台 API
│   │   │   ├── agent/               # 代理商 API
│   │   │   ├── products/            # 产品 API
│   │   │   ├── messages/            # 消息 API
│   │   │   ├── inquiries/           # 询盘 API
│   │   │   ├── profile/             # 用户资料 API
│   │   │   ├── email/               # 邮件 API
│   │   │   ├── data-sync/           # 数据同步 API
│   │   │   └── ...                  # 其他业务 API
│   │   │
│   │   ├── globals.css              # 全局样式
│   │   ├── layout.tsx               # 根布局
│   │   └── page.tsx                 # 首页
│   │
│   ├── 📂 components/               # React 组件
│   │   ├── ui/                      # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── admin/                   # 管理后台专用组件
│   │   └── inquiries/               # 询盘相关组件
│   │
│   ├── 📂 services/                 # 前端服务层
│   │   ├── api.ts                   # API 客户端封装
│   │   ├── productService.ts        # 产品服务
│   │   ├── messageService.ts        # 消息服务
│   │   └── ...
│   │
│   ├── 📂 contexts/                 # React Context
│   │   └── AuthContext.tsx          # 认证上下文
│   │
│   ├── 📂 hooks/                    # 自定义 Hooks
│   │   └── useAuth.ts               # 认证 Hook
│   │
│   ├── 📂 lib/                      # 工具库
│   │   ├── db.ts                    # 数据库连接
│   │   ├── auth.ts                  # 认证工具
│   │   └── utils.ts                 # 通用工具
│   │
│   ├── 📂 utils/                    # 工具函数
│   │   └── ...
│   │
│   ├── 📂 config/                   # 配置文件
│   │   └── ...
│   │
│   ├── 📂 messages/                 # 国际化翻译文件
│   │   ├── en.json                  # 英文
│   │   └── zh.json                  # 中文
│   │
│   └── 📂 storage/                  # 数据存储层
│       └── database/                # 数据库相关
│           ├── shared/              # 共享模块
│           │   └── schema.ts        # 数据库 Schema
│           └── migrations/          # 数据库迁移
│
├── 📂 backend/                      # 独立后端服务 (可选)
│   └── src/
│       ├── routes/                  # 路由定义
│       ├── db/                      # 数据库连接
│       ├── middleware/              # 中间件
│       └── migrations/              # 数据库迁移
│
├── 📂 public/                       # 静态资源
│   └── assets/
│       ├── flags/                   # 国旗图标
│       ├── icons/                   # 图标
│       ├── images/                  # 图片
│       ├── logos/                   # Logo
│       └── social/                  # 社交媒体图标
│
├── 📂 scripts/                      # 脚本文件
│   ├── build.sh                     # 构建脚本
│   ├── dev.sh                       # 开发脚本
│   └── start.sh                     # 启动脚本
│
├── 📂 docs/                         # 文档
│   ├── BACKEND_DESIGN.md
│   ├── BACKEND_DESIGN_V2.md
│   └── ...
│
├── 📄 package.json                  # 项目配置
├── 📄 tsconfig.json                 # TypeScript 配置
├── 📄 tailwind.config.ts            # Tailwind 配置
├── 📄 next.config.ts                # Next.js 配置
├── 📄 drizzle.config.ts             # Drizzle 配置
└── 📄 .coze                         # 部署配置
```

### 3.1 路由组说明

Next.js App Router 使用**路由组**（括号命名）来组织路由，不会出现在 URL 中：

```
src/app/(admin)/admin/login  →  /admin/login
src/app/(www)/[locale]/login →  /en/login, /zh/login
```

| 路由组 | 用途 | 布局文件 |
|--------|------|----------|
| `(admin)` | 管理后台 | 独立的管理后台布局 |
| `(www)` | 前端用户站点 | 带国际化的前端布局 |

### 3.2 国际化路由

`[locale]` 是动态路由参数，支持多语言：

| URL | 语言 |
|-----|------|
| `/en/products` | 英文 |
| `/zh/products` | 中文 |

---

## 4. 架构设计

### 4.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                  CHEMICALOOP 系统架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │   前端展示网站    │         │    管理后台       │          │
│  │  /(www)/[locale] │         │  /(admin)/admin  │          │
│  │  - 首页/产品      │         │  - 管理面板       │          │
│  │  - 询盘功能      │         │  - 代理审核       │          │
│  │  - 用户个人中心  │         │  - 数据统计       │          │
│  └────────┬─────────┘         └────────┬─────────┘          │
│           │                             │                    │
│           └──────────┬──────────────────┘                    │
│                      │                                       │
│           ┌──────────▼──────────┐                            │
│           │   Next.js API       │                            │
│           │   /api/*            │                            │
│           │  - 用户认证         │                            │
│           │  - 询盘管理         │                            │
│           │  - 产品管理         │                            │
│           │  - 权限验证         │                            │
│           └──────────┬──────────┘                            │
│                      │                                       │
│    ┌─────────────────┼─────────────────┐                    │
│    │                 │                 │                    │
│    ▼                 ▼                 ▼                    │
│ ┌──────────┐   ┌──────────┐   ┌──────────┐                 │
│ │PostgreSQL│   │  AWS S3  │   │  Redis   │                 │
│ │  数据库   │   │ 对象存储  │   │  缓存    │                 │
│ └──────────┘   └──────────┘   └──────────┘                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 认证流程

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Route  │────▶│  Database   │
│  (Browser)  │◀────│  /api/auth  │◀────│  (Users)    │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   │
       ▼                   ▼
 ┌─────────────┐     ┌─────────────┐
 │   JWT       │     │   bcrypt    │
 │   Token     │     │   加密      │
 └─────────────┘     └─────────────┘
```

**认证流程**：
1. 用户登录 → 提交邮箱/密码
2. 服务器验证 → bcrypt 对比密码
3. 生成 JWT → 返回给客户端
4. 客户端存储 → localStorage / Cookie
5. 后续请求 → Authorization Header 携带 JWT

### 4.3 询盘流程

```
【普通用户通过专属链接访问】
用户通过专属链接访问 → 浏览产品 → 发起询盘 → 询盘发给【专属链接的代理】
                                        ↓
                              代理回复 → 线下成交

【普通用户直接访问网站】
用户直接访问 → 浏览产品 → 发起询盘 → 询盘发给【平台直营代理】
                                    ↓
                           平台代理回复 → 线下成交
```

---

## 5. 核心模块

### 5.1 认证模块 (Auth)

**位置**: `src/app/api/auth/`

| API | 方法 | 说明 |
|-----|------|------|
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/register` | POST | 用户注册 |
| `/api/auth/logout` | POST | 用户登出 |
| `/api/auth/me` | GET | 获取当前用户信息 |
| `/api/auth/check-email` | GET | 检查邮箱是否已注册 |
| `/api/auth/send-code` | POST | 发送验证码 |

**相关文件**:
- `src/lib/auth.ts` - 认证工具函数
- `src/contexts/AuthContext.tsx` - 认证上下文
- `src/hooks/useAuth.ts` - 认证 Hook

### 5.2 产品模块 (Products)

**位置**: `src/app/api/products/`

| API | 方法 | 说明 |
|-----|------|------|
| `/api/products` | GET | 获取产品列表 |
| `/api/products/[cas]` | GET | 获取产品详情 |
| `/api/products/create` | POST | 创建产品 |
| `/api/products/lookup` | GET | 查询产品 |

**SPU (标准产品单位)**:
- 以 CAS 号为唯一标识
- 包含化学信息（分子式、分子量、结构式等）
- 支持多语言名称

### 5.3 消息模块 (Messages)

**位置**: `src/app/api/messages/`

| API | 方法 | 说明 |
|-----|------|------|
| `/api/messages` | GET/POST | 获取消息列表/发送消息 |
| `/api/messages/[id]` | GET/DELETE | 获取/删除消息 |
| `/api/messages/[id]/read` | POST | 标记已读 |
| `/api/messages/unread/count` | GET | 未读消息数 |
| `/api/messages/contacts/recent` | GET | 最近联系人 |
| `/api/messages/upload` | POST | 上传附件 |

### 5.4 询盘模块 (Inquiries)

**位置**: `src/app/api/inquiries/`

| API | 方法 | 说明 |
|-----|------|------|
| `/api/inquiries` | GET/POST | 获取询盘列表/创建询盘 |
| `/api/inquiries/[id]` | GET | 获取询盘详情 |
| `/api/inquiries/send` | POST | 发送询盘 |

### 5.5 管理后台模块 (Admin)

**位置**: `src/app/api/admin/`

| 子模块 | API | 说明 |
|--------|-----|------|
| 登录 | `/api/admin/login` | 管理员登录 |
| 用户管理 | `/api/admin/users` | 用户 CRUD |
| 产品管理 | `/api/admin/products` | 产品审核、状态管理 |
| SPU管理 | `/api/admin/spu` | SPU 同步、图片管理 |
| 统计数据 | `/api/admin/stats` | 数据统计 |
| 海关数据 | `/api/admin/trade-data` | 海关数据同步 |

### 5.6 代理商模块 (Agent)

**位置**: `src/app/api/agent/`

| API | 方法 | 说明 |
|-----|------|------|
| `/api/agent/info` | GET | 获取代理商信息 |
| `/api/agent/products` | GET/POST | 代理商产品管理 |

---

## 6. API 设计

### 6.1 API 路由映射

```
src/app/api/[...path]/route.ts  →  /api/[...path]
```

**示例**:
```
src/app/api/auth/login/route.ts     →  POST /api/auth/login
src/app/api/products/[cas]/route.ts →  GET /api/products/:cas
```

### 6.2 请求/响应格式

**标准成功响应**:
```json
{
  "success": true,
  "data": { ... }
}
```

**标准错误响应**:
```json
{
  "success": false,
  "error": "错误信息"
}
```

### 6.3 认证方式

API 使用 JWT Bearer Token 认证：

```typescript
// 请求头
Authorization: Bearer <token>

// 服务端验证
const token = request.headers.get('authorization')?.replace('Bearer ', '');
const user = verifyToken(token);
```

### 6.4 分页参数

```typescript
// Query 参数
?page=1&limit=20

// 响应格式
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 7. 数据库设计

### 7.1 核心 Tables

#### users (用户表)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  username VARCHAR(50) UNIQUE,
  avatar_url TEXT,
  role VARCHAR(50) DEFAULT 'USER',  -- SUPER_ADMIN, OPERATOR, PLATFORM_AGENT, AGENT, USER
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  google_id VARCHAR(255) UNIQUE,
  facebook_id VARCHAR(255) UNIQUE,
  apple_id VARCHAR(255) UNIQUE
);
```

#### products (产品/SPU表)

数据主要来源于 PubChem，字段设计遵循 PubChem 数据结构：

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- 基础标识
  cas VARCHAR(100) UNIQUE NOT NULL,         -- CAS 号（唯一标识）
  name VARCHAR(255) NOT NULL,               -- 中文名称
  name_en VARCHAR(255),                     -- 英文名称（IUPAC Name）
  formula VARCHAR(100),                     -- 分子式
  description TEXT,                         -- 产品描述
  status VARCHAR(20) DEFAULT 'ACTIVE',
  
  -- PubChem 基础信息
  pubchem_cid INTEGER,                      -- PubChem Compound ID
  pubchem_data_source VARCHAR(50),          -- 数据来源: pubchem/manual/hybrid
  pubchem_synced_at TIMESTAMP,
  
  -- PubChem 标识符
  molecular_weight VARCHAR(50),             -- 分子量
  exact_mass VARCHAR(50),                   -- 精确质量
  smiles TEXT,                              -- SMILES 字符串
  inchi TEXT,                               -- InChI 标识符
  inchi_key VARCHAR(50),                    -- InChI Key
  
  -- PubChem 计算属性
  xlogp VARCHAR(20),                        -- XLogP3 (辛醇-水分配系数)
  tpsa VARCHAR(20),                         -- 拓扑极性表面积
  complexity INTEGER,                       -- 复杂度
  h_bond_donor_count INTEGER,               -- 氢键供体数
  h_bond_acceptor_count INTEGER,            -- 氢键受体数
  rotatable_bond_count INTEGER,             -- 可旋转键数
  heavy_atom_count INTEGER,                 -- 重原子数
  
  -- PubChem 物理化学性质
  physical_description TEXT,                -- 物理描述（颜色、形态）
  color_form VARCHAR(255),                  -- 颜色/形态
  odor VARCHAR(255),                        -- 气味
  boiling_point VARCHAR(200),               -- 沸点
  melting_point VARCHAR(200),               -- 熔点
  flash_point VARCHAR(200),                 -- 闪点
  density VARCHAR(50),                      -- 密度
  solubility TEXT,                          -- 溶解度
  vapor_pressure VARCHAR(100),              -- 蒸气压
  refractive_index VARCHAR(50),             -- 折射率
  
  -- PubChem 安全与毒性
  hazard_classes TEXT,                      -- 危险类别
  health_hazards TEXT,                      -- 健康危害
  ghs_classification TEXT,                  -- GHS 分类
  toxicity_summary TEXT,                    -- 毒性概述
  carcinogenicity TEXT,                     -- 致癌性
  first_aid TEXT,                           -- 急救措施
  
  -- PubChem 结构图片
  structure_url TEXT,                       -- PubChem 2D 结构图片 URL
  structure_image_key TEXT,                 -- 对象存储 2D 结构图 key
  structure_2d_svg TEXT,                    -- 2D SVG 结构数据
  
  -- 产品图（AI 生成）
  product_image_key TEXT,                   -- 对象存储 key
  
  -- 同义词与应用
  synonyms JSONB,                           -- 同义词列表 string[]
  applications JSONB,                       -- 行业应用 string[]
  categories JSONB,                         -- 分类标签 string[]
  
  -- HS 海关编码
  hs_code VARCHAR(20),                      -- HS 编码
  hs_code_6 VARCHAR(10),                    -- 6位基础编码
  hs_code_extensions JSONB,                 -- 各国扩展码
  
  -- 多语言翻译
  translations JSONB,                       -- 多语言翻译对象
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### inquiries (询盘表)
```sql
CREATE TABLE inquiries (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  specifications TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',  -- pending, replied, closed
  replied_by VARCHAR(255),
  replied_by_user_id VARCHAR(36),
  reply_content TEXT,
  supplier_name VARCHAR(255),
  supplier_phone VARCHAR(50),
  supplier_email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  replied_at TIMESTAMP
);
```

### 7.2 ORM 使用 (Drizzle)

```typescript
// 定义 Schema (src/storage/database/shared/schema.ts)
import { pgTable, varchar, uuid, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid().defaultRandom().primaryKey(),
  email: varchar({ length: 255 }).notNull().unique(),
  // ...
});

// 查询示例
import { db } from '@/lib/db';
import { users } from '@/storage/database/shared/schema';
import { eq } from 'drizzle-orm';

// 查询单个用户
const user = await db.select().from(users).where(eq(users.email, 'test@example.com'));

// 插入用户
await db.insert(users).values({
  email: 'test@example.com',
  name: 'Test User',
  // ...
});
```

---

## 8. 开发规范

### 8.1 代码风格

- **TypeScript**: 所有代码必须使用 TypeScript
- **ESLint**: 遵循项目 ESLint 配置
- **命名约定**:
  - 组件: PascalCase (`UserCard.tsx`)
  - 函数: camelCase (`getUserInfo`)
  - 常量: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
  - 文件: kebab-case (`user-service.ts`)

### 8.2 组件规范

```typescript
// 组件结构示例
'use client';  // 客户端组件需要声明

import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface UserCardProps {
  name: string;
  email: string;
}

export function UserCard({ name, email }: UserCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="font-semibold">{name}</h3>
      <p className="text-gray-500">{email}</p>
      <Button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? '收起' : '展开'}
      </Button>
    </div>
  );
}
```

### 8.3 API Route 规范

```typescript
// src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 1. 认证验证
    const user = await verifyToken(request);
    if (!user) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 2. 业务逻辑
    const data = await db.select().from(/* ... */);

    // 3. 返回响应
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
```

### 8.4 国际化规范

```typescript
// 翻译文件 (src/messages/zh.json)
{
  "common": {
    "login": "登录",
    "logout": "登出"
  },
  "products": {
    "title": "产品列表",
    "detail": "产品详情"
  }
}

// 组件中使用
import { useTranslations } from 'next-intl';

export function ProductPage() {
  const t = useTranslations('products');
  return <h1>{t('title')}</h1>;
}
```

---

## 9. 部署指南

### 9.1 环境要求

- Node.js 24.x
- pnpm 9.x
- PostgreSQL 14+
- Redis (可选)

### 9.2 环境变量

```bash
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/chemicaloop

# JWT
JWT_SECRET=your-jwt-secret

# AWS S3
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket

# 其他
NEXT_PUBLIC_API_URL=https://api.chemicaloop.com
```

### 9.3 构建与部署

```bash
# 安装依赖
pnpm install

# 构建
pnpm build

# 启动生产服务
pnpm start

# 或使用 coze cli
coze build
coze start
```

### 9.4 数据库迁移

```bash
# 生成迁移文件
pnpm drizzle-kit generate

# 执行迁移
pnpm drizzle-kit migrate

# 推送 Schema 变更（开发环境）
pnpm drizzle-kit push
```

---

## 附录

### A. 常用命令

| 命令 | 说明 |
|------|------|
| `pnpm dev` | 启动开发服务器 (端口 5000) |
| `pnpm build` | 构建生产版本 |
| `pnpm start` | 启动生产服务器 |
| `pnpm lint` | 代码检查 |
| `pnpm ts-check` | TypeScript 类型检查 |
| `pnpm drizzle-kit studio` | 打开数据库管理界面 |

### B. 相关文档

- [BACKEND_DESIGN_V2.md](./BACKEND_DESIGN_V2.md) - 后台功能设计文档
- [product-upload-system.md](./product-upload-system.md) - 产品上传系统
- [agent-hall-features.md](./agent-hall-features.md) - 代理商大厅功能

### C. 技术支持

如有问题，请联系开发团队。

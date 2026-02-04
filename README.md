# Chemicaloop Website - 化工网站

专业的化工产品展示平台，采用双前端架构。

## 项目概述

- **前台系统**: Vue 3 + Vite + Vue Router + Vue I18n
- **后台管理系统**: Vue 3 + Vite + Element Plus + Vue Router

## 项目结构

```
chemicaloop-website/
├── frontend/                     # 前台系统（面向用户）
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   │   ├── HomePage.vue
│   │   │   ├── ProductsPage.vue
│   │   │   ├── AboutPage.vue
│   │   │   ├── ContactPage.vue
│   │   │   └── NewsPage.vue
│   │   ├── components/          # 公共组件
│   │   ├── layouts/             # 布局组件
│   │   ├── i18n/                # 国际化（10种语言）
│   │   ├── assets/              # 静态资源
│   │   ├── router/              # 路由配置
│   │   ├── App.vue              # 根组件
│   │   └── main.js              # 应用入口
│   ├── package.json              # 前台依赖
│   └── vite.config.js            # Vite 配置
│
├── admin/                        # 后台管理系统（面向管理员）
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   │   ├── LoginView.vue    # 登录页
│   │   │   ├── Dashboard.vue    # 仪表盘
│   │   │   ├── ContentManage.vue # 内容管理
│   │   │   └── SystemConfig.vue # 系统配置
│   │   ├── layout/              # 布局组件
│   │   ├── api/                 # API 接口
│   │   ├── App.vue              # 根组件
│   │   └── main.js              # 应用入口
│   ├── package.json              # 后台依赖
│   └── vite.config.js            # Vite 配置
│
├── .coze                         # 项目配置（Coze CLI）
└── README.md                     # 项目文档
```

## 技术栈

### 前台系统
- Vue 3.5
- Vite 6.4
- Vue Router 4.6
- Vue I18n 9.14（支持10种语言）
- Axios 1.13
- Sass 1.97

### 后台管理系统
- Vue 3.5
- Vite 7.2
- Element Plus 2.13
- Vue Router 4.6
- Axios 1.13
- JS Cookie 3.0

## 快速开始

### 前置要求
- Node.js 24+
- pnpm 10+

### 前台系统（frontend）

```bash
# 进入前台目录
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器（运行在 5000 端口）
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产版本
pnpm run preview
```

### 后台管理系统（admin）

```bash
# 进入后台目录
cd admin

# 安装依赖
pnpm install

# 启动开发服务器（运行在 5001 端口）
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产版本
pnpm run preview
```

### 使用 coze CLI

```bash
# 启动前台开发环境
coze dev

# 构建前台生产版本
coze build

# 启动前台生产环境
coze start
```

## 端口配置

| 系统 | 端口 | 说明 |
|------|------|------|
| 前台系统 | 5000 | 用户访问的网站 |
| 后台管理系统 | 5001 | 管理员后台 |

## 功能特性

### 前台系统
- ✅ 多语言支持（10种语言）
- ✅ 响应式设计
- ✅ Vue 3 组合式 API
- ✅ 路由懒加载
- ✅ 轮播横幅
- ✅ 悬浮工具栏
- ✅ 语言切换器

### 后台管理系统
- ✅ 登录认证
- ✅ 仪表盘
- ✅ 内容管理
- ✅ 系统配置
- ✅ 权限控制
- ✅ Element Plus UI 组件

## 开发说明

### 前台路由
- `/` - 首页
- `/products` - 产品页
- `/about` - 关于页
- `/contact` - 联系页
- `/news` - 新闻页

### 后台路由
- `/login` - 登录页
- `/home` - 仪表盘（需登录）
- `/home/content` - 内容管理（需登录）
- `/home/system` - 系统配置（需登录，仅管理员）

## 部署

### 前台部署
```bash
cd frontend
pnpm run build
# 将 dist/ 目录的内容部署到 Web 服务器
```

### 后台部署
```bash
cd admin
pnpm run build
# 将 dist/ 目录的内容部署到 Web 服务器（或独立域名）
```

## 许可证

© 2024 Chemicaloop. All rights reserved.

## GitHub 仓库

- 主仓库: https://github.com/zangji-dao/chemicaloop-website

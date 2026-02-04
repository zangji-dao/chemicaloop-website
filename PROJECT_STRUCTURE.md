# Chemicaloop Website - 项目架构文档

## 项目概述

Chemicaloop 网站是一个化工产品展示平台，采用前后端分离的架构。

## 技术栈

### 前端
- **框架**: Vue 3 + Vite
- **路由**: Vue Router
- **国际化**: Vue I18n（支持10种语言）
- **HTTP 客户端**: Axios
- **样式**: Sass
- **构建工具**: Vite

### 后端
- **框架**: Java Spring Boot 3.2
- **ORM**: Spring Data JPA
- **数据库**: MySQL 8.0
- **构建工具**: Maven

### 服务器
- **反向代理**: Nginx
- **容器化**: Docker + Docker Compose

## 项目目录结构

```
chemicaloop-website/              # 根项目
│
├── frontend/                     # 前端项目 ✅
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   │   ├── HomePage.vue
│   │   │   ├── ProductsPage.vue
│   │   │   ├── AboutPage.vue
│   │   │   ├── ContactPage.vue
│   │   │   └── NewsPage.vue
│   │   ├── components/          # 公共组件
│   │   │   ├── AppBanner.vue
│   │   │   ├── AppFooter.vue
│   │   │   ├── AppMainNavbar.vue
│   │   │   ├── FloatingTools.vue
│   │   │   └── LangSelector.vue
│   │   ├── layouts/             # 布局组件
│   │   │   └── DefaultLayout.vue
│   │   ├── i18n/                # 国际化
│   │   │   └── lang/            # 语言文件（10种）
│   │   ├── assets/              # 静态资源
│   │   │   ├── banners/
│   │   │   ├── flags/
│   │   │   ├── fonts/
│   │   │   ├── icons/
│   │   │   └── images/
│   │   ├── router/              # 路由配置
│   │   ├── constants/           # 常量定义
│   │   ├── App.vue              # 根组件
│   │   └── main.js              # 应用入口
│   ├── public/                   # 公共资源
│   ├── package.json              # 前端依赖
│   ├── vite.config.js            # Vite 配置
│   └── dist/                     # 构建产物
│
├── backend/                      # 后端项目 ⏳
│   ├── src/main/java/com/chemicaloop/
│   │   ├── ChemicaloopApplication.java    # 主应用类
│   │   ├── controller/                   # 控制器层
│   │   │   ├── ProductController.java
│   │   │   ├── NewsController.java
│   │   │   └── ContactController.java
│   │   ├── service/                      # 服务层
│   │   ├── entity/                       # 实体类
│   │   │   ├── Product.java
│   │   │   ├── News.java
│   │   │   └── Contact.java
│   │   ├── repository/                   # 数据访问层
│   │   └── config/                       # 配置类
│   ├── src/main/resources/
│   │   ├── application.properties        # 应用配置
│   │   └── application.yml               # YAML 配置
│   ├── pom.xml                           # Maven 配置
│   └── target/                           # 构建产物
│
├── server/                       # 服务器端项目 ⏳
│   ├── nginx/
│   │   ├── nginx.conf           # Nginx 主配置
│   │   └── conf.d/              # 子配置
│   ├── docker/
│   │   ├── Dockerfile.frontend  # 前端 Docker
│   │   ├── Dockerfile.backend   # 后端 Docker
│   │   └── Dockerfile.mysql     # MySQL Docker
│   ├── docker-compose.yml        # Docker 编排
│   └── deploy.sh                 # 部署脚本
│
├── .coze                         # 项目配置（Coze CLI）
├── README.md                     # 项目说明
├── PROJECT_STRUCTURE.md          # 本文档
└── docs/                         # 其他文档
    ├── API.md                   # API 文档
    └── DEPLOYMENT.md            # 部署文档
```

## 端口规划

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务器 | 5000 | Vite 开发环境 |
| 后端 API 服务 | 8080 | Spring Boot |
| 数据库 | 3306 | MySQL |
| Nginx | 80 | 生产环境反向代理 |

## 数据库设计

### 主要数据表

```sql
-- 产品表
CREATE TABLE products (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  price DECIMAL(10, 2),
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 新闻表
CREATE TABLE news (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  author VARCHAR(100),
  publish_date DATE,
  image_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 联系表
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API 接口设计

### 产品相关
- `GET /api/products` - 获取产品列表
- `GET /api/products/{id}` - 获取产品详情
- `POST /api/products` - 创建产品（管理员）
- `PUT /api/products/{id}` - 更新产品（管理员）
- `DELETE /api/products/{id}` - 删除产品（管理员）

### 新闻相关
- `GET /api/news` - 获取新闻列表
- `GET /api/news/{id}` - 获取新闻详情
- `POST /api/news` - 创建新闻（管理员）

### 联系表单
- `POST /api/contact` - 提交联系表单

## 开发流程

### 前端开发
```bash
cd frontend
pnpm install
pnpm run dev
```

### 后端开发
```bash
cd backend
mvn clean install
mvn spring-boot:run
```

### Docker 部署
```bash
cd server
docker-compose up -d
```

## 部署架构

```
用户 → Nginx (80) → 前端静态文件 / API 反向代理
                  ↓
              后端服务 (8080)
                  ↓
              MySQL (3306)
```

## 开发状态

| 模块 | 状态 | 说明 |
|------|------|------|
| 前端 | ✅ 已完成 | Vue3 项目，支持多语言 |
| 后端 | ⏳ 进行中 | 等待克隆仓库或手动创建 |
| 服务器 | ⏳ 规划中 | 需要确定具体方案 |
| 数据库 | ⏳ 规划中 | MySQL 设计 |

## 待办事项

- [ ] 克隆后端仓库或手动创建后端项目
- [ ] 设计并创建数据库表结构
- [ ] 实现后端 API 接口
- [ ] 配置 Nginx 反向代理
- [ ] 创建 Docker 编排文件
- [ ] 编写部署文档
- [ ] 编写 API 文档

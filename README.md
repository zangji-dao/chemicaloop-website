# Chemicaloop Website - 化工网站

专业的化工产品展示平台，采用前后端分离架构。

## 项目概述

- **前端**: Vue 3 + Vite + Vue Router + Vue I18n
- **后端**: Java Spring Boot 3.2 + Spring Data JPA + MySQL
- **部署**: Nginx + Docker

## 项目结构

```
chemicaloop-website/
├── frontend/                     # 前端项目（Vue3）
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
│   ├── public/                   # 公共资源
│   ├── package.json              # 前端依赖
│   ├── vite.config.js            # Vite 配置
│   └── dist/                     # 构建产物
│
├── backend/                      # 后端项目（Java Spring Boot）
│   ├── src/main/java/com/chemicaloop/
│   │   ├── ChemicaloopApplication.java    # 主应用类
│   │   ├── controller/                   # 控制器层
│   │   │   ├── ProductController.java
│   │   │   ├── NewsController.java
│   │   │   ├── ContactController.java
│   │   │   └── HealthController.java
│   │   ├── entity/                       # 实体类
│   │   │   ├── Product.java
│   │   │   ├── News.java
│   │   │   └── Contact.java
│   │   ├── repository/                   # 数据访问层
│   │   │   ├── ProductRepository.java
│   │   │   ├── NewsRepository.java
│   │   │   └── ContactRepository.java
│   │   ├── config/                       # 配置类
│   │   └── dto/                          # 数据传输对象
│   ├── src/main/resources/
│   │   └── application.properties        # 应用配置
│   ├── pom.xml                           # Maven 配置
│   └── target/                           # 构建产物
│
└── .coze                         # 项目配置（Coze CLI）
```

## 技术栈

### 前端
- Vue 3.5
- Vite 6.4
- Vue Router 4.6
- Vue I18n 9.14（支持10种语言）
- Axios 1.13
- Sass 1.97

### 后端
- Java 17
- Spring Boot 3.2
- Spring Data JPA
- MySQL 8.0
- Lombok

## 快速开始

### 前置要求
- Node.js 24+
- Java 17+
- Maven 3.8+
- MySQL 8.0+
- pnpm 10+

### 1. 数据库配置

创建 MySQL 数据库：

```sql
CREATE DATABASE chemicaloop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. 前端开发

```bash
# 安装依赖
cd frontend
pnpm install

# 启动开发服务器（运行在 5000 端口）
pnpm run dev

# 构建生产版本
pnpm run build

# 预览生产版本
pnpm run preview
```

### 3. 后端开发

```bash
# 进入后端目录
cd backend

# 编译项目
mvn clean install

# 运行应用（运行在 8080 端口）
mvn spring-boot:run
```

### 4. 使用 coze CLI

```bash
# 启动前端开发环境
coze dev

# 构建前端生产版本
coze build

# 启动前端生产环境
coze start
```

## 端口配置

| 服务 | 端口 | 说明 |
|------|------|------|
| 前端开发服务器 | 5000 | Vite 开发环境 |
| 后端 API 服务 | 8080 | Spring Boot |
| 数据库 | 3306 | MySQL |

## API 接口

### 健康检查
```
GET /api/health
```

### 产品相关
```
GET    /api/products           # 获取所有产品
GET    /api/products/{id}      # 获取产品详情
GET    /api/products/category/{category}  # 按分类获取产品
POST   /api/products           # 创建产品
PUT    /api/products/{id}      # 更新产品
DELETE /api/products/{id}      # 删除产品
```

### 新闻相关
```
GET    /api/news               # 获取所有新闻
GET    /api/news/{id}          # 获取新闻详情
POST   /api/news               # 创建新闻
PUT    /api/news/{id}          # 更新新闻
DELETE /api/news/{id}          # 删除新闻
```

### 联系表单
```
GET    /api/contacts           # 获取所有联系记录
GET    /api/contacts/{id}      # 获取联系记录详情
POST   /api/contacts           # 提交联系表单
DELETE /api/contacts/{id}      # 删除联系记录
```

## 功能特性

### 前端
- ✅ 多语言支持（10种语言）
- ✅ 响应式设计
- ✅ Vue 3 组合式 API
- ✅ 路由懒加载
- ✅ 轮播横幅
- ✅ 悬浮工具栏
- ✅ 语言切换器

### 后端
- ✅ RESTful API
- ✅ CORS 跨域支持
- ✅ JPA ORM
- ✅ 自动数据库表更新
- ✅ Lombok 简化代码
- ✅ 健康检查接口

## 开发说明

### 前端路由
- `/` - 首页
- `/products` - 产品页
- `/about` - 关于页
- `/contact` - 联系页
- `/news` - 新闻页

### 数据库表结构

#### 产品表（products）
```sql
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
```

#### 新闻表（news）
```sql
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
```

#### 联系表（contacts）
```sql
CREATE TABLE contacts (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 部署

### 前端部署
```bash
cd frontend
pnpm run build
# 将 dist/ 目录的内容部署到 Web 服务器
```

### 后端部署
```bash
cd backend
mvn clean package
java -jar target/chemicaloop-backend-1.0.0.jar
```

## 许可证

© 2024 Chemicaloop. All rights reserved.

## GitHub 仓库

- 前端仓库: https://github.com/zangji-dao/chemicaloop-website
- 后端仓库: https://github.com/zangji-dao/chemicaloop-website-backend

# 生产环境配置指南

本文档记录 Chemicaloop 网站生产环境的配置信息。

## 环境变量

### 1. 数据库配置（腾讯云 PostgreSQL）

```bash
# PostgreSQL 连接 URL
PGDATABASE_URL=postgresql://chemicaloop_user:Chemicaloop2024@152.136.12.122:5432/chemicaloop?sslmode=disable
```

**数据库信息：**
- 主机：152.136.12.122
- 端口：5432
- 数据库名：chemicaloop
- 用户名：chemicaloop_user
- 密码：Chemicaloop2024

### 2. 对象存储配置（腾讯云 COS）

```bash
# 腾讯云 COS 密钥
S3_ACCESS_KEY_ID=<腾讯云 AccessKey>
S3_SECRET_ACCESS_KEY=<腾讯云 SecretKey>

# 存储桶配置（已在代码中配置，无需环境变量）
# BUCKET_NAME=tianzhi-1314611801
# BUCKET_REGION=ap-beijing
# BUCKET_ENDPOINT_URL=https://cos.ap-beijing.myqcloud.com
```

**COS 存储桶信息：**
- 存储桶名称：tianzhi-1314611801
- 地域：ap-beijing
- 公共访问域名：https://tianzhi-1314611801.cos.ap-beijing.myqcloud.com
- 访问权限：公共读

### 3. 安全配置

```bash
# JWT 密钥（生产环境必须设置）
JWT_SECRET=<安全的随机字符串>
```

### 4. AI 服务配置（可选）

```bash
# Coze AI API Key（用于图片生成等功能）
COZE_WORKLOAD_IDENTITY_API_KEY=<Coze API Key>
```

## 部署架构

```
┌─────────────────────────────────────────────────────────────┐
│                      生产服务器                               │
│  (腾讯云 CentOS)                                             │
│                                                             │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │   Nginx         │     │   PM2           │               │
│  │   (反向代理)     │────▶│   (进程管理)     │               │
│  └─────────────────┘     └─────────────────┘               │
│                                  │                          │
│                                  ▼                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Next.js 应用 (端口 5000)                │   │
│  │                                                      │   │
│  │  - 前端页面                                          │   │
│  │  - API Routes (BFF)                                 │   │
│  │  - SSR/SSG                                          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                  │                          │
└──────────────────────────────────┼──────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                     外部服务                                  │
│                                                             │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │  PostgreSQL     │     │  腾讯云 COS      │               │
│  │  (152.136.12.122)│    │  (tianzhi-*)     │               │
│  │  数据存储        │     │  图片存储        │               │
│  └─────────────────┘     └─────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 部署步骤

### 1. 拉取最新代码

```bash
cd /www/wwwroot/chemicaloop-website
git pull origin main
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 配置环境变量

创建或更新 `.env.local` 文件：

```bash
# 数据库
PGDATABASE_URL=postgresql://chemicaloop_user:Chemicaloop2024@152.136.12.122:5432/chemicaloop?sslmode=disable

# 对象存储
S3_ACCESS_KEY_ID=<AccessKey>
S3_SECRET_ACCESS_KEY=<SecretKey>

# 安全配置
JWT_SECRET=<安全的随机字符串>
```

### 4. 构建项目

```bash
pnpm build
```

### 5. 重启服务

```bash
pm2 restart chemicaloop-frontend
```

### 6. 验证部署

```bash
# 检查服务状态
pm2 status

# 查看日志
pm2 logs chemicaloop-frontend

# 测试 API
curl https://chemicaloop.com/api/common/products?limit=1
```

## 沙箱环境 vs 生产环境

| 配置项 | 沙箱环境 | 生产环境 |
|--------|----------|----------|
| 数据库 | 火山引擎 PostgreSQL（系统提供） | 腾讯云 PostgreSQL |
| 对象存储 | 沙箱对象存储（系统提供） | 腾讯云 COS |
| 环境变量 | `COZE_PROJECT_ENV=DEV` | `COZE_PROJECT_ENV=PROD` |
| 域名 | `*.dev.coze.site` | `chemicaloop.com` |

## 注意事项

1. **数据库同步**：沙箱和生产环境使用不同的数据库，数据不会自动同步。如需同步数据，需要手动导出导入。

2. **图片存储**：图片存储在各自环境的对象存储中，跨环境访问可能导致图片无法显示。

3. **环境变量**：敏感信息（密码、密钥）不要提交到 Git，使用 `.env.local` 文件配置。

4. **PM2 配置**：确保 PM2 进程名称为 `chemicaloop-frontend`，端口为 5000。

## 常见问题

### Q: 图片上传失败

检查 COS 密钥是否正确配置：
```bash
echo $S3_ACCESS_KEY_ID
echo $S3_SECRET_ACCESS_KEY
```

### Q: 数据库连接失败

检查数据库连接：
```bash
psql "postgresql://chemicaloop_user:Chemicaloop2024@152.136.12.122:5432/chemicaloop?sslmode=disable"
```

### Q: 服务无法启动

检查端口占用：
```bash
lsof -i:5000
```

查看 PM2 日志：
```bash
pm2 logs chemicaloop-frontend --lines 100
```

## 更新记录

- 2024-03-20: 初始版本，记录生产环境配置信息

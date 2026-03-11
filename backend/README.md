# Chemicaloop Backend API

## 项目结构

```
backend/
├── src/
│   ├── index.ts              # 入口文件
│   ├── db/
│   │   └── db.ts             # 数据库连接
│   ├── middleware/
│   │   └── auth.ts           # 认证中间件
│   ├── routes/
│   │   ├── auth.ts           # 认证路由
│   │   ├── products.ts       # 产品路由
│   │   └── inquiries.ts      # 询盘路由
│   └── migrations/
│       └── init.sql          # 数据库初始化脚本
├── package.json
├── tsconfig.json
└── .env
```

## 环境变量

在 `.env` 文件中配置：

```env
PORT=3001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/chemicaloop
JWT_SECRET=chemicaloop-secret-key-change-in-production
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 安装依赖

```bash
pnpm install
```

## 运行开发服务器

```bash
pnpm run dev
```

服务器将在 `http://localhost:3001` 启动

## API 端点

### 认证 API

#### 发送验证码
```http
POST /api/auth/send-code
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "code": "123456"
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### 获取当前用户
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 产品 API

#### 获取产品列表
```http
GET /api/products?category=solvents&search=acetic&page=1&limit=20
```

#### 获取产品详情
```http
GET /api/products/:id
```

#### 创建产品（仅代理）
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "category_id": "uuid",
  "name": "乙酸",
  "name_en": "Acetic Acid",
  "cas": "64-19-7",
  "formula": "CH3COOH",
  "description": "Description...",
  "specifications": "Specifications...",
  "application": "Application...",
  "image_url": "https://...",
  "reference_price": 1.50
}
```

#### 添加供应商（仅代理）
```http
POST /api/products/:id/suppliers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "John Smith",
  "company": "Chemical Co.",
  "price": 1.45,
  "moq": 1000,
  "delivery_time": "7-10 days",
  "location": "Shanghai, China",
  "rating": 4.8
}
```

### 询盘 API

#### 创建询盘
```http
POST /api/inquiries
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "uuid",
  "quantity": 100,
  "targetPrice": 1.40,
  "message": "I'm interested in this product..."
}
```

#### 获取询盘列表
```http
GET /api/inquiries?status=PENDING
Authorization: Bearer <token>
```

#### 回复询盘（仅代理）
```http
PUT /api/inquiries/:id/reply
Authorization: Bearer <token>
Content-Type: application/json

{
  "response": "Thank you for your inquiry. We can provide..."
}
```

#### 获取用户统计
```http
GET /api/inquiries/stats/summary
Authorization: Bearer <token>
```

### 健康检查
```http
GET /api/health
```

## 数据库初始化

```bash
psql -U postgres -d chemicaloop -f src/migrations/init.sql
```

## 前端配置

在前端 `.env.local` 中配置：

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## 用户角色

- `USER`: 普通用户，可以浏览产品和提交询盘
- `AGENT`: 代理用户，可以管理产品和回复询盘
- `ADMIN`: 管理员
- `OPERATOR`: 运营管理员，处理默认询盘

## 询盘分配逻辑

1. 普通用户通过专属链接访问 → 询盘发送给该链接的代理
2. 普通用户直接访问 → 询盘发送给平台直营代理（OPERATOR）
3. 代理用户 → 可查看所有供应商列表，自主选择询盘对象

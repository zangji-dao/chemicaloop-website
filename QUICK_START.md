# Chemicaloop Website - 快速启动指南

## 🚀 快速开始（3步启动）

### 方法 1：使用启动脚本（推荐）

```bash
# 1. 启动服务
./start.sh

# 2. 访问应用
# 前端: http://localhost:5000
# 后端: http://localhost:8080/api/health

# 3. 停止服务
./stop.sh
```

### 方法 2：手动启动

#### 前端
```bash
cd frontend
pnpm install
pnpm run dev
# 访问: http://localhost:5000
```

#### 后端
```bash
cd backend
mvn clean install
mvn spring-boot:run
# 访问: http://localhost:8080/api/health
```

## 📦 数据库初始化

### 1. 创建数据库
```bash
mysql -u root -p < database/init.sql
```

### 2. 修改数据库配置
编辑 `backend/src/main/resources/application.properties`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/chemicaloop?useSSL=false&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=your_password
```

## 🧪 测试 API

### 健康检查
```bash
curl http://localhost:8080/api/health
```

### 获取所有产品
```bash
curl http://localhost:8080/api/products
```

### 提交联系表单
```bash
curl -X POST http://localhost:8080/api/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","message":"Hello"}'
```

## 📁 项目结构

```
chemicaloop-website/
├── frontend/          # Vue3 前端
├── backend/           # Java 后端
├── database/          # 数据库脚本
├── start.sh           # 启动脚本
├── stop.sh            # 停止脚本
└── README.md          # 项目文档
```

## 🔧 常见问题

### Q: 端口被占用怎么办？
A: 修改 `frontend/vite.config.js` 中的端口为其他值（如 5001）

### Q: 后端启动失败？
A: 检查数据库是否启动，配置是否正确

### Q: 前端无法访问后端？
A: 检查 CORS 配置，确保后端运行在 8080 端口

## 📞 联系方式

- GitHub: https://github.com/zangji-dao
- Email: info@chemicaloop.com

# ChemicaLoop Admin Backend

化工网站后台管理系统后端服务

## 技术栈

- **框架**: Spring Boot 2.7.18
- **数据库**: MySQL 8.0+
- **ORM**: MyBatis-Plus 3.5.3.1
- **安全**: JWT + BCrypt
- **构建工具**: Maven

## 项目结构

```
backend/
├── src/main/java/com/chemicaloop/admin/
│   ├── controller/     # 控制器层
│   ├── service/        # 服务层
│   ├── mapper/         # 数据访问层
│   ├── entity/         # 实体类
│   ├── vo/             # 视图对象
│   ├── utils/          # 工具类
│   ├── exception/      # 异常处理
│   └── AdminBackendApplication.java  # 启动类
├── src/main/resources/
│   ├── application.yml # 配置文件
│   ├── mapper/         # MyBatis映射文件
│   └── sql/            # 数据库脚本
└── pom.xml             # Maven依赖配置
```

## 快速开始

### 1. 环境要求

- JDK 1.8+
- Maven 3.6+
- MySQL 8.0+

### 2. 数据库初始化

执行 `src/main/resources/sql/init.sql` 初始化数据库：

```bash
mysql -u root -p < src/main/resources/sql/init.sql
```

或手动在 MySQL 中执行该 SQL 文件。

### 3. 修改配置

修改 `application.yml` 中的数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/chemicaloop_admin?...
    username: root
    password: your_password
```

### 4. 运行项目

```bash
# 编译项目
mvn clean install

# 运行项目
mvn spring-boot:run
```

或在 IDE 中直接运行 `AdminBackendApplication`。

### 5. 访问服务

项目启动后，访问地址：`http://localhost:8080/api`

## API 接口

### 登录接口

**接口地址**: `POST /api/auth/login`

**请求参数**:

```json
{
  "username": "admin",
  "password": "Admin123!"
}
```

**响应结果**:

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzUxMiJ9...",
    "userId": 1,
    "username": "admin",
    "realName": "系统管理员"
  },
  "timestamp": 1234567890123
}
```

### Token 验证接口

**接口地址**: `GET /api/auth/validate`

**请求头**:

```
Authorization: Bearer {token}
```

**响应结果**:

```json
{
  "code": 200,
  "message": "操作成功",
  "data": true,
  "timestamp": 1234567890123
}
```

### 登出接口

**接口地址**: `POST /api/auth/logout`

**请求头**:

```
Authorization: Bearer {token}
```

**响应结果**:

```json
{
  "code": 200,
  "message": "登出成功",
  "data": null,
  "timestamp": 1234567890123
}
```

## 默认账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | Admin123! | 系统管理员 |

## 接口返回格式

所有接口统一返回 JSON 格式：

```json
{
  "code": 200,      // 200 成功，500 异常，400 参数错误
  "message": "提示信息",
  "data": {},       // 返回数据，无数据则为 null
  "timestamp": 1234567890123
}
```

## 常见问题

### 1. 数据库连接失败

检查 `application.yml` 中的数据库配置是否正确，确保 MySQL 服务已启动。

### 2. 端口被占用

如果 8080 端口被占用，可以在 `application.yml` 中修改端口号：

```yaml
server:
  port: 8081
```

### 3. JWT 密钥问题

确保 `jwt.secret` 配置足够长（建议至少 256 位）。

## 测试

使用 Postman 或 curl 测试接口：

```bash
# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123!"}'

# 验证Token
curl -X GET http://localhost:8080/api/auth/validate \
  -H "Authorization: Bearer {your_token}"
```

## 开发规范

### 包结构规范

- **controller**: 控制器层，处理HTTP请求
- **service**: 服务层，业务逻辑
- **mapper**: 数据访问层，数据库操作
- **entity**: 实体类，对应数据库表
- **vo**: 视图对象，接口请求/响应数据
- **utils**: 工具类
- **exception**: 异常处理

### 代码规范

- 使用 Lombok 简化代码
- 统一异常处理
- 统一返回格式
- 使用 MyBatis-Plus 简化 CRUD 操作

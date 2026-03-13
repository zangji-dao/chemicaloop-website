# 开发工具页面

⚠️ **这些文件仅供开发环境使用，不会部署到生产环境。**

## 文件说明

| 文件 | 用途 |
|------|------|
| `test-accounts.html` | 测试账号清单 |
| `test-login.html` | 登录功能测试页面 |
| `test-responsiveness.html` | 响应式布局测试 |
| `token-debug.html` | Token 调试工具 |
| `diagnosis.html` | 系统诊断工具 |

## 使用方式

开发环境下直接在浏览器打开：

```
http://localhost:5000/dev-tools/test-accounts.html
```

## 部署说明

这些文件应在部署时排除，在 `.gitignore` 或部署脚本中配置：

```bash
# 排除开发工具
rm -rf public/dev-tools
```

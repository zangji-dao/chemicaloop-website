#!/bin/bash
# ==========================================
# Chemicaloop 自动部署脚本
# ==========================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ==========================================
# 配置区
# ==========================================
PROJECT_DIR="/var/www/chemicaloop-website"
REPO_URL="git@github.com:zangji-dao/chemicaloop-website.git"
FRONTEND_PORT=5000
BACKEND_PORT=5001
LOG_FILE="/var/log/chemicaloop-deploy.log"
DB_NAME="chemicaloop"
DB_USER="chemicaloop_user"
DB_PASS="Chemicaloop@2024"

# ==========================================
# 日志函数
# ==========================================
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=========================================="
echo "  Chemicaloop 部署脚本"
echo "  时间: $(date)"
echo "=========================================="

# ==========================================
# 1. 系统信息收集
# ==========================================
log_info "[1/8] 收集系统信息..."
echo "-------------------------------------------"
echo "系统信息:"
echo "  OS: $(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
echo "  内核: $(uname -r)"
echo "  Node: $(node -v)"
echo "  pnpm: $(pnpm -v)"
echo "  PM2: $(pm2 -v)"
echo "  PostgreSQL: $(psql --version)"
echo "  内存: $(free -h | grep Mem | awk '{print $2}')"
echo "  磁盘: $(df -h / | tail -1 | awk '{print $4}') 可用"
echo "-------------------------------------------"

# ==========================================
# 2. 克隆/更新代码
# ==========================================
log_info "[2/8] 克隆/更新代码..."
if [ -d "$PROJECT_DIR" ]; then
  log_info "目录已存在，拉取最新代码..."
  cd $PROJECT_DIR
  git fetch origin
  git reset --hard origin/main
else
  mkdir -p /var/www
  cd /var/www
  git clone $REPO_URL chemicaloop-website
  cd $PROJECT_DIR
fi
log_info "当前提交: $(git log -1 --oneline)"

# ==========================================
# 3. 创建环境变量文件
# ==========================================
log_info "[3/8] 配置环境变量..."
if [ ! -f ".env.local" ]; then
  cat > .env.local << ENVEOF
# 数据库配置
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@localhost:5432/${DB_NAME}

# 后端端口
PORT=${BACKEND_PORT}

# JWT 密钥
JWT_SECRET=$(openssl rand -hex 32)

# 环境标识
NODE_ENV=production
ENVEOF
  log_info "已创建 .env.local"
else
  log_warn ".env.local 已存在，跳过创建"
fi

# 显示环境变量（隐藏敏感信息）
log_info "环境变量配置:"
cat .env.local | sed 's/PASSWORD=.*/PASSWORD=***/' | sed 's/JWT_SECRET=.*/JWT_SECRET=***/'

# ==========================================
# 4. 安装前端依赖并构建
# ==========================================
log_info "[4/8] 安装前端依赖..."
pnpm install

log_info "[5/8] 构建前端..."
pnpm run build

# ==========================================
# 5. 安装后端依赖并构建
# ==========================================
log_info "[6/8] 安装后端依赖..."
cd backend
pnpm install

log_info "[6.5/8] 构建后端..."
pnpm run build
cd ..

# ==========================================
# 6. 数据库迁移
# ==========================================
log_info "[7/8] 检查数据库连接..."
if PGPASSWORD=${DB_PASS} psql -h localhost -U ${DB_USER} -d ${DB_NAME} -c "SELECT 1" > /dev/null 2>&1; then
  log_info "数据库连接成功"
else
  log_error "数据库连接失败，请检查配置"
  exit 1
fi

# ==========================================
# 7. 启动服务
# ==========================================
log_info "[8/8] 启动服务..."

# 停止旧服务
pm2 delete chemicaloop-frontend 2>/dev/null || true
pm2 delete chemicaloop-backend 2>/dev/null || true

# 启动后端
cd backend
pm2 start pnpm --name "chemicaloop-backend" -- run start
cd ..

# 启动前端
pm2 start pnpm --name "chemicaloop-frontend" -- run start

# 保存 PM2 配置
pm2 save

# ==========================================
# 8. 部署结果
# ==========================================
echo "=========================================="
log_info "部署完成！"
echo "=========================================="
echo ""
pm2 list
echo ""
echo "服务地址:"
echo "  前端: http://localhost:${FRONTEND_PORT}"
echo "  后端: http://localhost:${BACKEND_PORT}"
echo ""
echo "日志文件: ${LOG_FILE}"
echo ""

# 健康检查
sleep 3
log_info "健康检查..."
curl -s http://localhost:${FRONTEND_PORT} > /dev/null && log_info "前端: 正常" || log_error "前端: 异常"
curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null && log_info "后端: 正常" || log_error "后端: 异常"

log_info "部署完成！下一步：配置 Nginx 和 SSL"

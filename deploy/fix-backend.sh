#!/bin/bash
# ==========================================
# 快速修复脚本 - 修复后端未构建问题
# ==========================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo "=========================================="
echo "  后端构建修复脚本"
echo "  时间: $(date)"
echo "=========================================="

PROJECT_DIR="/var/www/chemicaloop-website"

cd $PROJECT_DIR/backend

log_info "安装后端依赖..."
pnpm install

log_info "构建后端..."
pnpm run build

log_info "验证构建结果..."
if [ -f "dist/index.js" ]; then
  log_info "构建成功！dist/index.js 存在"
  ls -la dist/
else
  log_error "构建失败！dist/index.js 不存在"
  exit 1
fi

log_info "重启后端服务..."
pm2 restart chemicaloop-backend

sleep 3

log_info "健康检查..."
if curl -s http://localhost:5001/api/health > /dev/null; then
  log_info "后端服务正常！"
else
  log_error "后端服务异常，查看日志："
  pm2 logs chemicaloop-backend --lines 20 --nostream
fi

echo "=========================================="
echo "  修复完成！"
echo "=========================================="
pm2 list

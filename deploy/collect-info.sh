#!/bin/bash
# ==========================================
# 收集服务器信息并推送到 GitHub
# ==========================================

INFO_FILE="/workspace/projects/deploy/server-info.txt"

echo "=========================================="
echo "  服务器信息收集"
echo "  时间: $(date)"
echo "=========================================="

cat > "$INFO_FILE" << EOF
# 服务器信息报告
生成时间: $(date)

## 系统信息
- OS: $(lsb_release -d 2>/dev/null | cut -f2 || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)
- 内核: $(uname -r)
- 主机名: $(hostname)
- IP: $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

## 资源使用
- 内存: $(free -h | grep Mem | awk '{printf "总计 %s / 已用 %s / 可用 %s", $2, $3, $7}')
- 磁盘: $(df -h / | tail -1 | awk '{printf "总计 %s / 已用 %s / 可用 %s", $2, $3, $4}')
- CPU 负载: $(cat /proc/loadavg | awk '{print $1, $2, $3}')

## 软件版本
- Node.js: $(node -v)
- pnpm: $(pnpm -v)
- PM2: $(pm2 -v)
- PostgreSQL: $(psql --version)
- Nginx: $(nginx -v 2>&1)

## 运行服务
$(pm2 list)

## 端口占用
$(ss -tuln | grep -E "LISTEN" | head -20)

## 数据库
$(sudo -u postgres psql -c "\l" 2>/dev/null || echo "无法获取数据库列表")

## Nginx 配置
$(ls -la /etc/nginx/sites-enabled/ 2>/dev/null || echo "无 Nginx 配置")

## 最近部署日志
$(tail -50 /var/log/chemicaloop-deploy.log 2>/dev/null || echo "无部署日志")
EOF

echo "信息已收集到: $INFO_FILE"
echo ""
cat "$INFO_FILE"

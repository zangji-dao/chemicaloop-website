#!/bin/bash

# Chemicaloop Website 快速启动脚本

echo "=========================================="
echo "  Chemicaloop Website - 快速启动"
echo "=========================================="
echo ""

# 检查前端依赖
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 安装前端依赖..."
    cd frontend && pnpm install && cd ..
fi

# 启动前端（后台运行）
echo "🚀 启动前端开发服务器 (端口: 5000)..."
cd frontend && pnpm run dev > /app/work/logs/bypass/frontend-dev.log 2>&1 &
FRONTEND_PID=$!
echo "   前端进程 PID: $FRONTEND_PID"
cd ..

# 等待前端启动
sleep 3

# 检查后端依赖
if [ ! -d "backend/target" ]; then
    echo "📦 编译后端项目..."
    cd backend && mvn clean install -DskipTests && cd ..
fi

# 启动后端（后台运行）
echo "🚀 启动后端 API 服务 (端口: 8080)..."
cd backend && mvn spring-boot:run > /app/work/logs/bypass/backend-dev.log 2>&1 &
BACKEND_PID=$!
echo "   后端进程 PID: $BACKEND_PID"
cd ..

# 等待后端启动
sleep 5

echo ""
echo "=========================================="
echo "  ✅ 启动完成！"
echo "=========================================="
echo ""
echo "📍 访问地址："
echo "   前端: http://localhost:5000"
echo "   后端: http://localhost:8080"
echo "   健康检查: http://localhost:8080/api/health"
echo ""
echo "📝 日志文件："
echo "   前端日志: /app/work/logs/bypass/frontend-dev.log"
echo "   后端日志: /app/work/logs/bypass/backend-dev.log"
echo ""
echo "🛑 停止服务："
echo "   kill $FRONTEND_PID  # 停止前端"
echo "   kill $BACKEND_PID   # 停止后端"
echo ""
echo "=========================================="

# 保存 PID 到文件
echo "$FRONTEND_PID" > /tmp/frontend.pid
echo "$BACKEND_PID" > /tmp/backend.pid

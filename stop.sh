#!/bin/bash

# Chemicaloop Website 停止脚本

echo "=========================================="
echo "  Chemicaloop Website - 停止服务"
echo "=========================================="
echo ""

# 读取 PID 文件
if [ -f "/tmp/frontend.pid" ]; then
    FRONTEND_PID=$(cat /tmp/frontend.pid)
    echo "🛑 停止前端服务 (PID: $FRONTEND_PID)..."
    kill $FRONTEND_PID 2>/dev/null || echo "   前端服务已停止"
    rm /tmp/frontend.pid
fi

if [ -f "/tmp/backend.pid" ]; then
    BACKEND_PID=$(cat /tmp/backend.pid)
    echo "🛑 停止后端服务 (PID: $BACKEND_PID)..."
    kill $BACKEND_PID 2>/dev/null || echo "   后端服务已停止"
    rm /tmp/backend.pid
fi

echo ""
echo "✅ 所有服务已停止"
echo "=========================================="

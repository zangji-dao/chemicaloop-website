#!/bin/bash
set -Eeuo pipefail

PORT=5000
BACKEND_PORT=3001
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# 加载 .env.local 中的环境变量（强制覆盖系统变量）
if [ -f ".env.local" ]; then
  echo "Loading .env.local..."
  # 读取并强制设置每个变量
  while IFS='=' read -r key value; do
    # 跳过注释和空行
    [[ "$key" =~ ^#.*$ ]] && continue
    [[ -z "$key" ]] && continue
    # 移除值两端的引号
    value="${value%\"}"
    value="${value#\"}"
    export "$key=$value"
  done < .env.local
fi

# 强力清理端口 - 使用多种方法确保端口被释放
kill_ports() {
    local ports=("$@")
    
    for port in "${ports[@]}"; do
        echo "Cleaning port ${port}..."
        
        # 方法1: 使用 ss 查找并杀死进程
        local pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | tr '\n' ' ' || true)
        if [[ -n "${pids}" ]]; then
            echo "  Killing processes via ss: ${pids}"
            for pid in ${pids}; do
                kill -9 ${pid} 2>/dev/null || true
            done
        fi
        
        # 方法2: 使用 fuser (更可靠)
        if command -v fuser &> /dev/null; then
            echo "  Using fuser to kill port ${port}"
            fuser -k -9 ${port}/tcp 2>/dev/null || true
        fi
        
        # 方法3: 使用 lsof 作为备用
        if command -v lsof &> /dev/null; then
            local lsof_pids=$(lsof -ti:${port} 2>/dev/null || true)
            if [[ -n "${lsof_pids}" ]]; then
                echo "  Killing processes via lsof: ${lsof_pids}"
                echo "${lsof_pids}" | xargs -r kill -9 2>/dev/null || true
            fi
        fi
    done
    
    # 等待端口完全释放
    echo "Waiting for ports to be released..."
    sleep 2
    
    # 验证端口是否已释放
    for port in "${ports[@]}"; do
        if ss -lntp 2>/dev/null | grep -q ":${port} "; then
            echo "WARNING: Port ${port} still in use, forcing cleanup..."
            fuser -k -9 ${port}/tcp 2>/dev/null || true
            sleep 1
        else
            echo "Port ${port} is free"
        fi
    done
}

echo "=== Starting Dev ==="
kill_ports ${PORT} ${BACKEND_PORT}

# 读取 .env.local 中的变量（使用项目根目录的绝对路径）
get_env() {
  local key=$1
  local value=$(grep "^${key}=" "${COZE_WORKSPACE_PATH}/.env.local" 2>/dev/null | cut -d'=' -f2-)
  echo "$value"
}

# 后端依赖检查（静默）
cd "${COZE_WORKSPACE_PATH}/backend"
if [ ! -d "node_modules" ]; then
    echo "Installing backend deps..."
    pnpm install --prefer-offline -s 2>/dev/null
fi

# 从 .env.local 读取数据库 URL
DB_URL=$(get_env "PGDATABASE_URL")
echo "Using database from .env.local: ${DB_URL:0:50}..."

# 启动后端
(PORT=3001 NODE_NO_WARNINGS=1 PGDATABASE_URL="$DB_URL" npx tsx watch src/index.ts > /app/work/logs/bypass/backend.log 2>&1 &)
cd "${COZE_WORKSPACE_PATH}"

# 等待后端就绪（最多 5 秒，每次 0.2 秒）
echo "Waiting backend..."
for i in $(seq 1 25); do
    if curl -s http://localhost:${BACKEND_PORT}/api/health > /dev/null 2>&1; then
        echo "✓ Backend ready"
        break
    fi
    sleep 0.2
done

# 启动前端
echo "Starting frontend..."
NODE_NO_WARNINGS=1 PGDATABASE_URL="$DB_URL" exec npx next dev --webpack --port ${PORT}

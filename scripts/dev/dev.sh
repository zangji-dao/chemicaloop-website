#!/bin/bash
set -Eeuo pipefail

PORT=5000
BACKEND_PORT=3001
COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

# 快速清理端口
kill_ports() {
    for port in "$@"; do
        pids=$(ss -H -lntp 2>/dev/null | awk -v port="${port}" '$4 ~ ":"port"$"' | grep -o 'pid=[0-9]*' | cut -d= -f2 | paste -sd' ' - || true)
        if [[ -n "${pids}" ]]; then
            echo "Killing processes on port ${port}: ${pids}"
            echo "${pids}" | xargs -r kill -9 2>/dev/null || true
        fi
    done
    sleep 0.5
}

echo "=== Starting Dev ==="
kill_ports ${PORT} ${BACKEND_PORT}

# 后端依赖检查（静默）
cd "${COZE_WORKSPACE_PATH}/backend"
if [ ! -d "node_modules" ]; then
    echo "Installing backend deps..."
    pnpm install --prefer-offline -s 2>/dev/null
fi

# 启动后端（tsx 比 ts-node 快 2-3 倍）
(PORT=3001 NODE_NO_WARNINGS=1 npx tsx watch src/index.ts > /app/work/logs/bypass/backend.log 2>&1 &)
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
NODE_NO_WARNINGS=1 exec npx next dev --webpack --port ${PORT}

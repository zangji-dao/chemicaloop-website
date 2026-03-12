#!/bin/bash
set -Eeuo pipefail

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

echo "Installing dependencies..."
NODE_NO_WARNINGS=1 pnpm install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

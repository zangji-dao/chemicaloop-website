#!/bin/bash
# ==========================================
# 后端诊断脚本 - 结果推送到 GitHub
# ==========================================

REPORT_FILE="/tmp/chemicaloop-website/deploy/backend-report.md"
REPO_DIR="/tmp/chemicaloop-website"

echo "=========================================="
echo "  后端诊断脚本"
echo "  时间: $(date)"
echo "=========================================="

# 创建报告
cat > "$REPORT_FILE" << EOF
# 后端诊断报告

生成时间: $(date)

## 1. PM2 状态

\`\`\`
$(pm2 list)
\`\`\`

## 2. 后端日志 (最近 100 行)

\`\`\`
$(pm2 logs chemicaloop-backend --lines 100 --nostream 2>&1)
\`\`\`

## 3. 后端健康检查

\`\`\`
$(curl -s http://localhost:5001/api/health 2>&1 || echo "连接失败")
\`\`\`

## 4. 后端环境变量检查

\`\`\`
$(cd $REPO_DIR/backend && cat .env 2>/dev/null | sed 's/PASSWORD.*/PASSWORD=***/g' | sed 's/SECRET.*/SECRET=***/g' || echo "无 .env 文件")
\`\`\`

## 5. 后端进程详情

\`\`\`
$(pm2 show chemicaloop-backend 2>&1)
\`\`\`

## 6. 端口占用

\`\`\`
$(ss -tuln | grep -E "5001|5000")
\`\`\`

## 7. 后端目录结构

\`\`\`
$(ls -la $REPO_DIR/backend/ 2>&1)
\`\`\`

## 8. 后端 package.json

\`\`\`
$(cat $REPO_DIR/backend/package.json 2>&1)
\`\`\`

---
报告结束
EOF

echo ""
echo "报告已生成: $REPORT_FILE"
echo ""
cat "$REPORT_FILE"

# 推送到 GitHub
echo ""
echo "=========================================="
echo "  推送报告到 GitHub..."
echo "=========================================="

cd $REPO_DIR
git config user.email "deploy@chemicaloop.com"
git config user.name "Deploy Bot"
git add deploy/backend-report.md
git commit -m "docs: 更新后端诊断报告" || echo "无变更"
git push origin main

echo ""
echo "报告已推送到 GitHub!"

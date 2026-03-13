#!/bin/bash
# 上传 Banner 图片到对象存储的脚本

echo "=== Banner 图片上传工具 ==="
echo ""

# 检查是否安装了 coze-coding-dev-sdk
if ! pnpm list coze-coding-dev-sdk > /dev/null 2>&1; then
    echo "❌ 错误: coze-coding-dev-sdk 未安装"
    echo "请运行: pnpm install"
    exit 1
fi

# 运行 TypeScript 脚本
npx tsx scripts/upload-banner-images.ts

echo ""
echo "✅ 脚本执行完成"

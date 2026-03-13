#!/usr/bin/env node
/**
 * 上传 Banner 图片到对象存储
 *
 * 使用方法：
 * 1. 将你的 banner 图片放到 public/assets/images/banner/ 目录
 * 2. 运行此脚本：node scripts/upload-banner-images.ts
 * 3. 脚本会上传图片并生成签名 URL
 * 4. 将生成的 URL 配置到代码中
 * 
 * ⚠️ 安全警告：此脚本仅限开发环境使用
 */

import { assertDevEnvironment } from '../lib/env-check';

// 安全检查：禁止生产环境运行
assertDevEnvironment();

import { S3Storage } from "coze-coding-dev-sdk";
import * as fs from "fs";
import * as path from "path";

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

const BANNER_DIR = path.join(process.cwd(), "public/assets/images/banner");

async function main() {
  console.log("=== 上传 Banner 图片 ===\n");

  // 检查目录是否存在
  if (!fs.existsSync(BANNER_DIR)) {
    console.log(`创建目录: ${BANNER_DIR}`);
    fs.mkdirSync(BANNER_DIR, { recursive: true });
  }

  // 读取目录中的图片
  const files = fs.readdirSync(BANNER_DIR);
  const imageFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  if (imageFiles.length === 0) {
    console.log("未找到图片文件");
    console.log(`请将图片放到: ${BANNER_DIR}`);
    return;
  }

  console.log(`找到 ${imageFiles.length} 个图片文件\n`);

  for (const file of imageFiles) {
    const filePath = path.join(BANNER_DIR, file);
    const fileContent = fs.readFileSync(filePath);
    const fileName = `banners/${Date.now()}_${file}`;

    console.log(`上传: ${file}`);

    try {
      const imageKey = await storage.uploadFile({
        fileContent,
        fileName,
        contentType: getContentType(file),
      });

      const signedUrl = await storage.generatePresignedUrl({ key: imageKey, expireTime: 3600 * 24 * 365 }); // 1年有效期

      console.log(`  ✅ 上传成功`);
      console.log(`  Key: ${imageKey}`);
      console.log(`  URL: ${signedUrl}\n`);
    } catch (error) {
      console.error(`  ❌ 上传失败:`, error);
    }
  }
}

function getContentType(filename: string): string {
  const ext = path.extname(filename).toLowerCase();
  const types: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
  };
  return types[ext] || 'application/octet-stream';
}

main().catch(console.error);

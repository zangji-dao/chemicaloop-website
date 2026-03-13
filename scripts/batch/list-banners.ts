#!/usr/bin/env node
/**
 * 列出对象存储中的 Banner 图片并生成签名 URL
 *
 * 使用方法：pnpm list-banners
 * 
 * ⚠️ 安全警告：此脚本仅限开发环境使用
 */

import { assertDevEnvironment } from '../lib/env-check';

// 安全检查：禁止生产环境运行
assertDevEnvironment();

import { S3Storage } from "coze-coding-dev-sdk";

// 初始化对象存储
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function main() {
  console.log("=== 查找对象存储中的 Banner 图片 ===\n");

  try {
    // 列出所有文件（可能需要多次调用获取所有文件）
    let allFiles: string[] = [];
    let continuationToken: string | undefined;

    do {
      const result = await storage.listFiles({
        prefix: "",
        maxKeys: 1000,
        continuationToken,
      });

      allFiles = allFiles.concat(result.keys);
      continuationToken = result.nextContinuationToken;
    } while (continuationToken);

    console.log(`找到 ${allFiles.length} 个文件\n`);

    // 过滤出可能的 banner 图片
    const bannerExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const bannerFiles = allFiles.filter(file => {
      const lowerFile = file.toLowerCase();
      return bannerExtensions.some(ext => lowerFile.endsWith(ext)) &&
             (lowerFile.includes('banner') || lowerFile.startsWith('image'));
    });

    console.log(`找到 ${bannerFiles.length} 个 Banner 图片：\n`);

    for (const file of bannerFiles) {
      // 生成签名 URL
      const signedUrl = await storage.generatePresignedUrl({ key: file, expireTime: 3600 });
      console.log(`文件: ${file}`);
      console.log(`签名 URL: ${signedUrl}`);
      console.log('---');
    }

  } catch (error) {
    console.error("获取 Banner 图片列表失败:", error);
    process.exit(1);
  }
}

main();

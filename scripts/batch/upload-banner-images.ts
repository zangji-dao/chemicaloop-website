#!/usr/bin/env node
/**
 * 上传 Banner 图片到对象存储
 *
 * 使用方法：
 * 1. 将你的 banner 图片放到 public/assets/images/banner/ 目录
 * 2. 运行此脚本：node scripts/upload-banner-images.ts
 * 3. 脚本会上传图片并生成签名 URL
 * 4. 将生成的 URL 配置到代码中
 */

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

// Banner 图片目录
const BANNER_DIR = path.join(process.env.WORKSPACE_PATH || process.cwd(), "public/assets/images/banner");

// 上传图片并返回 key
async function uploadImage(filePath: string, fileName: string): Promise<string> {
  console.log(`正在上传: ${fileName}...`);

  const fileContent = fs.readFileSync(filePath);
  const contentType = getContentType(fileName);

  // 上传文件，返回实际的 key
  const key = await storage.uploadFile({
    fileContent,
    fileName: `banners/${fileName}`,
    contentType,
  });

  console.log(`✓ 上传成功: ${fileName} -> ${key}`);
  return key;
}

// 生成签名 URL
async function generateImageUrl(key: string, expireHours: number = 24): Promise<string> {
  const expireTime = expireHours * 3600; // 转换为秒
  const url = await storage.generatePresignedUrl({
    key,
    expireTime,
  });
  return url;
}

// 获取文件 Content-Type
function getContentType(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
  };
  return contentTypes[ext] || "application/octet-stream";
}

// 主函数
async function main() {
  console.log("=== Banner 图片上传工具 ===\n");

  // 检查目录是否存在
  if (!fs.existsSync(BANNER_DIR)) {
    console.error(`❌ 错误: 目录不存在: ${BANNER_DIR}`);
    console.log("请先创建目录并将图片放入其中");
    process.exit(1);
  }

  // 读取目录中的图片文件
  const files = fs.readdirSync(BANNER_DIR).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(ext) && !file.startsWith(".");
  });

  if (files.length === 0) {
    console.log("❌ 目录中没有找到图片文件");
    console.log(`请将图片放到: ${BANNER_DIR}`);
    process.exit(1);
  }

  console.log(`找到 ${files.length} 张图片:\n`);
  files.forEach((file, index) => {
    console.log(`  ${index + 1}. ${file}`);
  });
  console.log("\n开始上传...\n");

  try {
    const results: Array<{ fileName: string; key: string; url: string }> = [];

    // 逐个上传图片
    for (const file of files) {
      const filePath = path.join(BANNER_DIR, file);
      const key = await uploadImage(filePath, file);
      const url = await generateImageUrl(key, 8760); // 1 年有效期
      results.push({ fileName: file, key, url });
    }

    console.log("\n=== 上传完成 ===\n");
    console.log("生成的签名 URL (有效期 1 年):\n");

    // 输出结果
    results.forEach((result, index) => {
      console.log(`${index + 1}. ${result.fileName}`);
      console.log(`   Key: ${result.key}`);
      console.log(`   URL: ${result.url}\n`);
    });

    // 生成配置代码
    console.log("=== 复制以下代码到 src/app/[locale]/page.tsx ===\n");

    if (results.length === 1) {
      console.log("// 单张 banner 图片");
      console.log(`const bannerUrl = "${results[0].url}";`);
    } else {
      console.log("// 多张轮播 banner 图片");
      console.log("const bannerImages = [");
      results.forEach((result) => {
        console.log(`  "${result.url}",`);
      });
      console.log("];");
    }

    console.log("\n✅ 配置完成！");
  } catch (error) {
    console.error("\n❌ 上传失败:", error);
    process.exit(1);
  }
}

// 运行主函数
main();

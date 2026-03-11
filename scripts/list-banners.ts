#!/usr/bin/env node
/**
 * 列出对象存储中的 Banner 图片并生成签名 URL
 *
 * 使用方法：pnpm list-banners
 */

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

    if (bannerFiles.length === 0) {
      console.log("❌ 没有找到 banner 图片");
      console.log("\n所有文件列表：");
      allFiles.forEach((file, index) => {
        console.log(`  ${index + 1}. ${file}`);
      });
      return;
    }

    console.log(`找到 ${bannerFiles.length} 个可能的 banner 图片：\n`);

    // 为每个 banner 图片生成签名 URL
    const bannerUrls: Array<{ key: string; url: string }> = [];

    for (const file of bannerFiles) {
      console.log(`正在处理: ${file}`);

      try {
        const url = await storage.generatePresignedUrl({
          key: file,
          expireTime: 8760 * 3600, // 1 年有效期
        });

        bannerUrls.push({ key: file, url });

        console.log(`✓ 生成签名 URL 成功`);
      } catch (error) {
        console.error(`✗ 生成 URL 失败:`, error);
      }
      console.log();
    }

    console.log("=== 生成的签名 URL ===\n");

    bannerUrls.forEach((item, index) => {
      console.log(`${index + 1}. ${item.key}`);
      console.log(`   URL: ${item.url}\n`);
    });

    console.log("=== 复制以下配置到 src/config/banner.ts ===\n");

    if (bannerUrls.length === 1) {
      console.log("// 单张 banner 图片");
      console.log("export const bannerConfig = {");
      console.log("  mode: 'single' as 'single' | 'carousel',");
      console.log(`  singleBannerUrl: "${bannerUrls[0].url}",`);
      console.log("  carouselBanners: [],");
      console.log("  carousel: {");
      console.log("    autoPlay: true,");
      console.log("    interval: 5000,");
      console.log("    showDots: true,");
      console.log("    showArrows: true,");
      console.log("  },");
      console.log("};");
    } else {
      console.log("// 多张轮播 banner 图片");
      console.log("export const bannerConfig = {");
      console.log("  mode: 'carousel' as 'single' | 'carousel',");
      console.log("  singleBannerUrl: '',");
      console.log("  carouselBanners: [");
      bannerUrls.forEach(item => {
        console.log(`    "${item.url}",`);
      });
      console.log("  ],");
      console.log("  carousel: {");
      console.log("    autoPlay: true,");
      console.log("    interval: 5000,");
      console.log("    showDots: true,");
      console.log("    showArrows: true,");
      console.log("  },");
      console.log("};");
    }

    console.log("\n✅ 配置完成！请复制上面的代码到 src/config/banner.ts");

  } catch (error) {
    console.error("\n❌ 错误:", error);
    process.exit(1);
  }
}

main();

import { S3Storage } from "coze-coding-dev-sdk";

const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: "",
  secretKey: "",
  bucketName: process.env.COZE_BUCKET_NAME,
  region: "cn-beijing",
});

async function listProductImages() {
  try {
    // 列出所有对象
    const result = await storage.listFiles({
      maxKeys: 1000,
    });

    console.log("Total files:", result.keys.length);
    console.log("\nAll files:");
    result.keys.forEach((key, index) => {
      console.log(`${index + 1}. ${key}`);
    });

    // 查找产品相关图片
    const productImages = result.keys.filter(key =>
      key.toLowerCase().includes('product') ||
      key.toLowerCase().includes('chemical') ||
      key.match(/\.(jpg|jpeg|png|webp)$/i)
    );

    console.log("\n\nProduct images:", productImages.length);
    productImages.forEach((key, index) => {
      console.log(`${index + 1}. ${key}`);
    });

  } catch (error) {
    console.error("Error listing files:", error);
  }
}

listProductImages();

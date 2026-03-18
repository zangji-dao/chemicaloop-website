import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// 腾讯云 COS 配置（从环境变量读取）
const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-beijing',
  endpoint: process.env.S3_ENDPOINT || 'https://cos.ap-beijing.myqcloud.com',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = 'tianzhi-1314611801';

async function getSignedUrls() {
  console.log('🔗 生成签名 URL...\n');

  const files = [
    'chemicaloop/banners/home-banner1.jpg',
    'chemicaloop/banners/home-banner2.jpg',
  ];

  for (const key of files) {
    const command = new GetObjectCommand({
      Bucket: BUCKET,
      Key: key,
    });

    // 生成 10 年有效期的签名 URL
    const url = await getSignedUrl(s3Client, command, { expiresIn: 315360000 });
    
    console.log(`文件: ${key}`);
    console.log(`URL: ${url}\n`);
  }
}

getSignedUrls();

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

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
const PREFIX = 'chemicaloop/banners/';

async function uploadFile(localPath, remoteKey) {
  const fileContent = fs.readFileSync(localPath);
  
  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: remoteKey,
    Body: fileContent,
    ContentType: 'image/jpeg',
    ACL: 'public-read',  // 设置为公有读
  });

  try {
    await s3Client.send(command);
    console.log(`✅ 上传成功: ${remoteKey}`);
    return true;
  } catch (error) {
    console.error(`❌ 上传失败: ${remoteKey}`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 开始上传 Banner 图片到腾讯云 COS...\n');
  
  const files = [
    { local: '/tmp/banners/home-banner1.jpg', remote: `${PREFIX}home-banner1.jpg` },
    { local: '/tmp/banners/home-banner2.jpg', remote: `${PREFIX}home-banner2.jpg` },
  ];

  for (const file of files) {
    await uploadFile(file.local, file.remote);
  }

  console.log('\n✨ 上传完成！');
  console.log('\n访问地址：');
  console.log(`https://${BUCKET}.cos.${'ap-beijing'}.myqcloud.com/${PREFIX}home-banner1.jpg`);
  console.log(`https://${BUCKET}.cos.${'ap-beijing'}.myqcloud.com/${PREFIX}home-banner2.jpg`);
}

main();

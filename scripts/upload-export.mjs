import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'ap-beijing',
  endpoint: process.env.S3_ENDPOINT || 'https://cos.ap-beijing.myqcloud.com',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});

const BUCKET = 'tianzhi-1314611801';

async function uploadExport() {
  const filePath = '/tmp/chemicaloop-export.sql';
  const key = 'chemicaloop/backups/chemicaloop-export.sql';

  console.log('📤 上传数据库导出文件到 COS...');

  const command = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: fs.readFileSync(filePath),
    ContentType: 'application/sql',
    ACL: 'public-read',
  });

  await s3Client.send(command);

  console.log(`✅ 上传成功！`);
  console.log(`\n下载地址（7天有效）:`);
  console.log(`https://${BUCKET}.cos.ap-beijing.myqcloud.com/${key}`);
}

uploadExport();

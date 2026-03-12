import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

// 从数据库读取系统配置
const getSystemConfig = async (key: string): Promise<any> => {
  try {
    const db = await getDb(schema);
    const result = await db.execute(
      sql`SELECT value FROM system_configs WHERE key = ${key}`
    );
    if (result.rows.length > 0) {
      return result.rows[0].value;
    }
    return null;
  } catch (error) {
    console.error('Error getting system config:', error);
    return null;
  }
};

// 默认最大文件大小（10MB）
const DEFAULT_MAX_SIZE = 10 * 1024 * 1024;

// 从环境变量或配置获取最大文件大小
const getMaxFileSize = async (): Promise<number> => {
  const config = await getSystemConfig('max_attachment_size');
  if (config && config.size) {
    return config.size;
  }
  return process.env.MAX_ATTACHMENT_SIZE
    ? parseInt(process.env.MAX_ATTACHMENT_SIZE, 10)
    : DEFAULT_MAX_SIZE;
};

// 获取允许的文件类型
const getAllowedTypes = async (): Promise<string[]> => {
  const config = await getSystemConfig('allowed_attachment_types');
  if (config && config.types) {
    return config.types;
  }
  return [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
};

/**
 * 上传消息附件
 * POST /api/messages/upload
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    // 验证文件是否存在
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // 获取配置
    const allowedTypes = await getAllowedTypes();
    const maxSize = await getMaxFileSize();

    // 验证文件类型
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: 'File type not allowed',
          allowedTypes: allowedTypes,
        },
        { status: 400 }
      );
    }

    // 验证文件大小
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
      return NextResponse.json(
        {
          error: `File size exceeds limit of ${maxSizeMB}MB`,
          maxSize: maxSize,
          currentSize: file.size,
        },
        { status: 400 }
      );
    }

    // 初始化 S3Storage
    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    // 生成文件名（带 UUID 前缀）
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `message-attachments/${timestamp}_${file.name}`;

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件到对象存储
    const fileKey = await storage.uploadFile({
      fileContent: buffer,
      fileName: fileName,
      contentType: file.type,
    });

    // 生成签名 URL（有效期 7 天）
    const downloadUrl = await storage.generatePresignedUrl({
      key: fileKey,
      expireTime: 7 * 24 * 60 * 60, // 7 天
    });

    // 返回文件信息
    return NextResponse.json({
      success: true,
      file: {
        key: fileKey,
        url: downloadUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * 获取文件上传配置
 * GET /api/messages/upload
 */
export async function GET() {
  try {
    const maxSize = await getMaxFileSize();
    const allowedTypes = await getAllowedTypes();
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      success: true,
      config: {
        maxSize: maxSize,
        maxSizeMB: maxSizeMB,
        allowedTypes: allowedTypes,
      },
    });
  } catch (error) {
    console.error('Error getting upload config:', error);
    return NextResponse.json(
      {
        error: 'Failed to get upload config',
      },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 获取 SPU 产品图片签名 URL
 * GET /api/admin/spu/image-url?key=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ 
        success: false, 
        error: 'Image key is required' 
      }, { status: 400 });
    }

    const storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });

    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 86400, // 24小时有效期
    });

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: any) {
    console.error('Get image URL error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get image URL',
    }, { status: 500 });
  }
}

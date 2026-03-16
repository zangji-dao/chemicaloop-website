import { NextRequest, NextResponse } from 'next/server';
import { getSignedImageUrl, getSignedImageUrls } from '@/lib/s3-utils';

/**
 * 获取 S3 图片签名 URL（通用 API）
 * 
 * GET /api/common/image-url?key=xxx
 * GET /api/common/image-url?keys=key1,key2,key3
 * 
 * 参数：
 * - key: 单个图片 key
 * - keys: 多个图片 key（逗号分隔）
 * - redirect: 是否直接重定向（默认 true），设为 false 返回 JSON
 * 
 * 返回：
 * - redirect=true: 直接重定向到签名 URL
 * - redirect=false: 返回 JSON { success: true, url: "..." } 或 { success: true, urls: { key1: url1, key2: url2 } }
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const keysParam = searchParams.get('keys');
    const redirect = searchParams.get('redirect') !== 'false'; // 默认重定向

    // 批量获取签名 URL
    if (keysParam) {
      const keys = keysParam.split(',').map(k => k.trim()).filter(Boolean);
      
      if (keys.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'At least one key is required',
        }, { status: 400 });
      }

      const urls = await getSignedImageUrls(keys);
      
      return NextResponse.json({
        success: true,
        urls,
      });
    }

    // 单个 key
    if (!key) {
      return NextResponse.json({
        success: false,
        error: 'Image key is required',
      }, { status: 400 });
    }

    const url = await getSignedImageUrl(key);

    // 默认直接重定向，用于 <img src="...">
    if (redirect) {
      return NextResponse.redirect(url);
    }

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error: any) {
    console.error('Get image URL error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get image URL',
    }, { status: 500 });
  }
}

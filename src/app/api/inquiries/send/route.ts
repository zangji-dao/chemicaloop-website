import { NextRequest, NextResponse } from 'next/server';
import { verifyUser, unauthorizedResponse } from '@/lib/auth';

/**
 * 发送询价站内信
 * POST /api/inquiries/send
 */
export async function POST(request: NextRequest) {
  try {
    const auth = verifyUser(request);
    if (!auth.success) {
      return unauthorizedResponse(auth.error);
    }

    const userId = auth.userId;
    const body = await request.json();
    const {
      toUserId,
      productId,
      productName,
      cas,
      purity,
      quantity,
      message,
      referencePrice,
    } = body;

    // 验证必填字段
    if (!toUserId || !productName || !cas || !quantity) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 获取当前用户信息
    const senderResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/profile/${userId}`, {
      headers: {
        'X-User-ID': userId,
      },
    });
    const senderData = await senderResponse.json();
    const senderName = senderData?.data?.name || senderData?.data?.username || '匿名用户';

    // 构建询价消息内容
    const inquiryTitle = `询价：${productName} (${cas})`;
    const inquiryContent = `
【询价信息】
产品名称：${productName}
CAS码：${cas}
纯度：${purity || '未指定'}
询价数量：${quantity} kg
参考价格：${referencePrice ? `¥${referencePrice}/kg` : '询价'}

【询价说明】
${message || '无'}

--
此询价来自代理大厅报价查询功能，请及时回复。
    `.trim();

    // 代理请求到后端创建消息
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:3001'}/api/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
      },
      body: JSON.stringify({
        type: 'inquiry',
        title: inquiryTitle,
        content: inquiryContent,
        recipient_id: toUserId,
        folder: 'inbox',
        status: 'pending',
        product_name: productName,
        cas: cas,
        quantity: quantity,
        sender_name: senderName,
      }),
    });

    const result = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { success: false, error: result.error || '发送失败' },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: '询价已发送',
      data: result,
    });
  } catch (error: any) {
    console.error('Send inquiry error:', error);
    return NextResponse.json(
      { success: false, error: '发送失败，请重试' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { inquiryManager } from '@/storage/database/inquiryManager';

// POST /api/inquiries - 创建询价
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      productId,
      productName,
      specifications,
      quantity,
      unit,
    } = body;

    // 验证必填字段
    if (!userId || !productId || !productName || !specifications || !quantity || !unit) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 创建询价
    const inquiry = await inquiryManager.createInquiry({
      userId,
      productId,
      productName,
      specifications,
      quantity: parseInt(quantity.toString()),
      unit,
    });

    return NextResponse.json({
      success: true,
      message: 'Inquiry created successfully',
      data: inquiry,
    });
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  }
}

// GET /api/inquiries - 获取询价列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // 'all', 'pending', 'replied'

    // 如果 userId 是 'all'，获取所有询价（管理员用）
    if (userId === 'all') {
      const { inquiryManager } = await import('@/storage/database/inquiryManager');
      const allInquiries = await inquiryManager.getPendingInquiries();
      return NextResponse.json({
        success: true,
        data: allInquiries,
      });
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    let allInquiries = await inquiryManager.getUserInquiries(userId);

    // 根据类型过滤
    if (type === 'pending') {
      allInquiries = allInquiries.filter(i => i.status === 'pending');
    } else if (type === 'replied') {
      allInquiries = allInquiries.filter(i => i.status === 'replied' || i.status === 'completed');
    }

    return NextResponse.json({
      success: true,
      data: allInquiries,
    });
  } catch (error) {
    console.error('Error fetching inquiries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiries' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { inquiryManager } from '@/db/inquiryManager';

// PATCH /api/inquiries/[id]/reply - 回复询价
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      repliedBy,
      repliedByUserId,
      replyContent,
      supplierName,
      supplierPhone,
      supplierEmail,
    } = body;

    // 验证必填字段
    if (!replyContent) {
      return NextResponse.json(
        { error: 'Missing reply content' },
        { status: 400 }
      );
    }

    // 回复询价
    const inquiry = await inquiryManager.replyToInquiry(id, {
      repliedBy,
      repliedByUserId,
      replyContent,
      supplierName,
      supplierPhone,
      supplierEmail,
    });

    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reply sent successfully',
      data: inquiry,
    });
  } catch (error) {
    console.error('Error replying to inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to reply to inquiry' },
      { status: 500 }
    );
  }
}

// GET /api/inquiries/[id] - 获取询价详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inquiry = await inquiryManager.getInquiryById(id);

    if (!inquiry) {
      return NextResponse.json(
        { error: 'Inquiry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    console.error('Error fetching inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inquiry' },
      { status: 500 }
    );
  }
}

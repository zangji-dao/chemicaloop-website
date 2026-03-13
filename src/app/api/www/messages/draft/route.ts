import { NextRequest, NextResponse } from 'next/server';
import { messageRepository } from '@/repositories/messageRepository';

/**
 * POST /api/messages/draft - 保存或更新草稿
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title = '(No Subject)',
      content = '(No content)',
      recipient_address = '',
      product_name,
      cas,
      quantity,
    } = body;

    // 临时使用固定用户 ID（开发模式）
    // TODO: 从 token 中获取真实用户 ID
    const currentUserId = 'c4ca4238-a0b9-2382-0dcc-509a6f75849b';

    // 如果有 id，更新现有草稿；否则创建新草稿
    // 注意：草稿的 recipientId 可以是草稿用户的 ID，或者使用当前用户 ID（自己）
    const toUserId = recipient_address || currentUserId;

    const message = await messageRepository.createMessage({
      id: id, // 如果有 id 则更新
      fromUserId: currentUserId,
      toUserId: toUserId,
      subject: title,
      content: content,
      type: 'draft',
      folder: 'drafts',
      status: 'pending', // 草稿状态
      language: 'en', // 默认语言
      productName: product_name,
      cas: cas,
      quantity: quantity,
    });

    return NextResponse.json({
      success: true,
      message: 'Draft saved successfully',
      data: message,
    });
  } catch (error) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft' },
      { status: 500 }
    );
  }
}

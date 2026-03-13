import { NextRequest, NextResponse } from 'next/server';
import { seedMessages } from '@/db/seedMessages';

/**
 * POST /api/messages/seed
 * 生成测试消息数据（仅用于开发环境）
 */
export async function POST(request: NextRequest) {
  try {
    console.log('Starting message seed...');

    await seedMessages();

    return NextResponse.json({
      success: true,
      message: 'Test messages seeded successfully',
    });
  } catch (error) {
    console.error('Error seeding messages:', error);
    return NextResponse.json(
      {
        error: 'Failed to seed messages',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

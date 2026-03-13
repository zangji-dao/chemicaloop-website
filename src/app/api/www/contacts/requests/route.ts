import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { getUserIdFromToken } from '@/lib/tokenUtils';

/**
 * 获取联系人请求列表
 * GET /api/contact-requests?role=receiver|requester&status=pending|accepted|rejected
 * 
 * - role=receiver: 获取收到的请求
 * - role=requester: 获取发出的请求
 * - status: 筛选状态
 */
export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'receiver';
    const status = searchParams.get('status');

    const db = await getDb(schema);

    // 构建查询条件
    let whereClause = '';
    const params: any[] = [userId];

    if (role === 'requester') {
      whereClause = 'cr.requester_id = $1';
    } else {
      whereClause = 'cr.receiver_id = $1';
    }

    if (status) {
      params.push(status);
      whereClause += ` AND cr.status = $${params.length}`;
    }

    // 获取联系人请求
    const result = await db.execute(sql`
      SELECT 
        cr.id,
        cr.requester_id as "requesterId",
        cr.receiver_id as "receiverId",
        cr.message_id as "messageId",
        cr.requested_contact_ids as "requestedContactIds",
        cr.requester_shared_contacts as "requesterSharedContacts",
        cr.message,
        cr.status,
        cr.rejection_reason as "rejectionReason",
        cr.created_at as "createdAt",
        cr.responded_at as "respondedAt",
        u.id as "userId",
        u.email as "userEmail",
        u.username as "userUsername",
        u.name as "userName",
        u.avatar_url as "userAvatarUrl"
      FROM contact_requests cr
      INNER JOIN users u ON ${
        role === 'requester' 
          ? sql`cr.receiver_id = u.id` 
          : sql`cr.requester_id = u.id`
      }
      WHERE ${role === 'requester' 
        ? sql`cr.requester_id = ${userId}` 
        : sql`cr.receiver_id = ${userId}`}
        ${status ? sql` AND cr.status = ${status}` : sql``}
      ORDER BY cr.created_at DESC
    `);

    const requests = result.rows.map((row: any) => ({
      id: row.id,
      requesterId: row.requesterId,
      receiverId: row.receiverId,
      messageId: row.messageId,
      requestedContactIds: row.requestedContactIds || [],
      requesterSharedContacts: row.requesterSharedContacts || {},
      message: row.message,
      status: row.status,
      rejectionReason: row.rejectionReason,
      createdAt: row.createdAt,
      respondedAt: row.respondedAt,
      // 对方用户信息
      user: {
        id: row.userId,
        email: row.userEmail,
        username: row.userUsername,
        name: row.userName,
        avatarUrl: row.userAvatarUrl,
      },
    }));

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error('[Contact] Get contact requests error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get contact requests' },
      { status: 500 }
    );
  }
}

/**
 * 创建联系人请求
 * POST /api/contact-requests
 * 
 * Body: { receiverId, messageId?, message?, requestedContactIds? }
 */
export async function POST(request: NextRequest) {
  try {
    const requesterId = getUserIdFromToken(request);
    if (!requesterId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { receiverId, messageId, message, requestedContactIds } = body;

    if (!receiverId) {
      return NextResponse.json(
        { error: 'receiverId is required' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 检查是否已存在请求
    const existingResult = await db.execute(sql`
      SELECT id, status FROM contact_requests
      WHERE requester_id = ${requesterId} AND receiver_id = ${receiverId}
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.status === 'pending') {
        return NextResponse.json(
          { error: 'A pending request already exists' },
          { status: 400 }
        );
      }
      if (existing.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already connected with this user' },
          { status: 400 }
        );
      }
    }

    // 创建联系人请求
    const result = await db.execute(sql`
      INSERT INTO contact_requests (
        requester_id,
        receiver_id,
        message_id,
        message,
        requested_contact_ids,
        status
      )
      VALUES (
        ${requesterId},
        ${receiverId},
        ${messageId || null},
        ${message || null},
        ${JSON.stringify(requestedContactIds || [])}::jsonb,
        'pending'
      )
      RETURNING id
    `);

    return NextResponse.json({
      success: true,
      requestId: result.rows[0].id,
      message: 'Contact request sent successfully',
    });
  } catch (error: any) {
    console.error('[Contact] Create contact request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create contact request' },
      { status: 500 }
    );
  }
}

/**
 * 更新联系人请求状态（接受/拒绝）
 * PATCH /api/contact-requests
 * 
 * Body: { id, status: 'accepted'|'rejected', rejectionReason? }
 */
export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, status, rejectionReason } = body;

    if (!id || !status) {
      return NextResponse.json(
        { error: 'id and status are required' },
        { status: 400 }
      );
    }

    if (!['accepted', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'status must be accepted or rejected' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 验证请求是否属于当前用户（作为接收者）
    const checkResult = await db.execute(sql`
      SELECT requester_id, receiver_id FROM contact_requests
      WHERE id = ${id}
    `);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    const requestRecord = checkResult.rows[0];
    if (requestRecord.receiver_id !== userId) {
      return NextResponse.json(
        { error: 'You can only respond to requests sent to you' },
        { status: 403 }
      );
    }

    // 更新请求状态
    await db.execute(sql`
      UPDATE contact_requests
      SET 
        status = ${status},
        rejection_reason = ${status === 'rejected' ? rejectionReason : null},
        responded_at = NOW(),
        updated_at = NOW()
      WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: status === 'accepted' ? 'Contact request accepted' : 'Contact request rejected',
    });
  } catch (error: any) {
    console.error('[Contact] Update contact request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update contact request' },
      { status: 500 }
    );
  }
}

/**
 * 删除联系人请求（取消申请）
 * DELETE /api/contact-requests?id=xxx
 */
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id is required' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 验证请求是否属于当前用户（作为请求者）
    const checkResult = await db.execute(sql`
      SELECT requester_id FROM contact_requests
      WHERE id = ${id}
    `);

    if (checkResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    if (checkResult.rows[0].requester_id !== userId) {
      return NextResponse.json(
        { error: 'You can only cancel your own requests' },
        { status: 403 }
      );
    }

    // 删除请求
    await db.execute(sql`
      DELETE FROM contact_requests WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: 'Contact request cancelled',
    });
  } catch (error: any) {
    console.error('[Contact] Delete contact request error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete contact request' },
      { status: 500 }
    );
  }
}

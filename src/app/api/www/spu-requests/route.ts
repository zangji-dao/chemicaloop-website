import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';

/**
 * POST /api/www/spu-requests
 * 用户提交 SPU 申请（新增化学品申请）
 * 
 * Body:
 * - cas: string (必填)
 * - reason: string (必填) - purchase, supply, data_report, other
 * - reasonDetail?: string
 * - userId?: string (可选，从 token 获取)
 * - userEmail?: string
 * - userName?: string
 */
export async function POST(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    
    const { cas, reason, reasonDetail, userId, userEmail, userName } = body;
    
    // 验证 CAS 码
    if (!cas || !cas.trim()) {
      return NextResponse.json(
        { success: false, error: 'CAS number is required' },
        { status: 400 }
      );
    }
    
    // 验证申请原因
    if (!reason) {
      return NextResponse.json(
        { success: false, error: 'Reason is required' },
        { status: 400 }
      );
    }
    
    const casInput = cas.trim();
    
    // CAS号正则表达式
    const casRegex = /^\d{1,7}-\d{2}-\d$/;
    
    // 清理CAS号：移除空格、转大写
    let casNumber = casInput.replace(/\s+/g, '').toUpperCase();
    
    // 尝试自动格式化：如果用户只输入数字，尝试格式化为标准格式
    if (!casRegex.test(casNumber)) {
      const digitsOnly = casNumber.replace(/[^0-9]/g, '');
      if (digitsOnly.length >= 4) {
        const checkDigit = digitsOnly.slice(-1);
        const middle = digitsOnly.slice(-3, -1);
        const first = digitsOnly.slice(0, -3);
        casNumber = `${first}-${middle}-${checkDigit}`;
      }
    }
    
    // 检查 products 表中是否已存在该 CAS（已审核通过）
    const existingProduct = await db.execute(sql`
      SELECT id FROM products WHERE cas = ${casNumber} AND status = 'ACTIVE'
    `);
    
    if (existingProduct.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'This chemical already exists in our database',
        code: 'SPU_EXISTS',
      }, { status: 400 });
    }
    
    // 检查是否已有相同的待处理申请
    const existingRequest = await db.execute(sql`
      SELECT id, status FROM spu_requests 
      WHERE cas = ${casNumber} AND status = 'pending'
    `);
    
    if (existingRequest.rows.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'A request for this CAS number is already pending review',
        code: 'REQUEST_EXISTS',
      }, { status: 400 });
    }
    
    // 如果没有 userId，使用一个默认的游客 ID
    // 实际应该从认证 token 中获取
    let finalUserId = userId;
    if (!finalUserId) {
      // 查找或创建一个游客用户
      const guestResult = await db.execute(sql`
        SELECT id FROM users WHERE email = 'guest@system.local'
      `);
      
      if (guestResult.rows.length > 0) {
        finalUserId = (guestResult.rows[0] as any).id;
      } else {
        // 创建游客用户
        const newGuest = await db.execute(sql`
          INSERT INTO users (email, password_hash, name, role, verified)
          VALUES ('guest@system.local', '', 'Guest User', 'USER', true)
          RETURNING id
        `);
        finalUserId = (newGuest.rows[0] as any).id;
      }
    }
    
    // 插入申请记录
    const result = await db.execute(sql`
      INSERT INTO spu_requests (
        cas, user_id, user_email, user_name, reason, reason_detail, status
      ) VALUES (
        ${casNumber}, ${finalUserId}, ${userEmail || null}, ${userName || null}, 
        ${reason}, ${reasonDetail || null}, 'pending'
      )
      RETURNING id
    `);
    
    const requestId = (result.rows[0] as any).id;
    
    return NextResponse.json({
      success: true,
      message: 'SPU request submitted successfully',
      data: {
        id: requestId,
        cas: casNumber,
      },
    });
  } catch (error) {
    console.error('Submit SPU request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/www/spu-requests
 * 查询用户提交的 SPU 申请状态
 * 
 * Query params:
 * - cas: string (CAS 号)
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    const cas = searchParams.get('cas');
    
    if (!cas) {
      return NextResponse.json(
        { success: false, error: 'CAS number is required' },
        { status: 400 }
      );
    }
    
    const casNumber = cas.trim().toUpperCase();
    
    // 查询申请状态
    const result = await db.execute(sql`
      SELECT id, cas, status, reject_reason, created_at, reviewed_at
      FROM spu_requests
      WHERE cas = ${casNumber}
      ORDER BY created_at DESC
      LIMIT 1
    `);
    
    if (result.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No request found for this CAS number',
      });
    }
    
    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Get SPU request status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get request status' },
      { status: 500 }
    );
  }
}

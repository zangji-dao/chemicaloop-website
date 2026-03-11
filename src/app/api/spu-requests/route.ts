import { NextRequest, NextResponse } from 'next/server';
import { getDb, S3Storage } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';
import { generateChemicalSVG, validateSVG } from '@/lib/chemical-svg-generator';

/**
 * GET /api/spu-requests
 * 获取 SPU 申请列表（管理员）
 */
export async function GET(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;
    
    // 构建查询条件
    let whereClause = '1=1';
    if (status !== 'all') {
      whereClause += ` AND status = '${status}'`;
    }
    
    // 查询总数
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM spu_requests WHERE ${sql.raw(whereClause)}
    `);
    const total = parseInt(countResult.rows[0].total as string);
    
    // 查询各状态统计
    const statsResult = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'created') as created,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
      FROM spu_requests
    `);
    const stats = statsResult.rows[0];
    
    // 查询列表
    const listResult = await db.execute(sql`
      SELECT 
        sr.*,
        u.internal_email as user_email_full,
        COALESCE(u.username, u.name) as user_name_full
      FROM spu_requests sr
      LEFT JOIN users u ON sr.user_id = u.id
      WHERE ${sql.raw(whereClause)}
      ORDER BY sr.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);
    
    return NextResponse.json({
      success: true,
      data: listResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        pending: parseInt(stats.pending as string) || 0,
        approved: parseInt(stats.approved as string) || 0,
        created: parseInt(stats.created as string) || 0,
        rejected: parseInt(stats.rejected as string) || 0,
      },
    });
  } catch (error) {
    console.error('Get SPU requests error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch requests' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/spu-requests
 * 用户提交 SPU 申请
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
    // CAS格式：XXXXXXX-XX-X（最多7位-2位-1位校验）
    if (!casRegex.test(casNumber)) {
      const digitsOnly = casNumber.replace(/[^0-9]/g, '');
      // 例如：50000 -> 50-00-0, 64175 -> 64-17-5
      if (digitsOnly.length >= 4) {
        const checkDigit = digitsOnly.slice(-1);
        const middle = digitsOnly.slice(-3, -1);
        const first = digitsOnly.slice(0, -3);
        casNumber = `${first}-${middle}-${checkDigit}`;
      }
    }
    
    // 验证 CAS 码格式 (例如: 50-00-0)
    if (!casRegex.test(casNumber)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid CAS number format. Example: 50-00-0 or 64175' 
        },
        { status: 400 }
      );
    }
    
    // 验证 CAS 校验位
    const parts = casNumber.split('-');
    const digits = parts[0] + parts[1];
    const checkDigit = parseInt(parts[2]);
    let calculatedCheck = 0;
    for (let i = 0; i < digits.length; i++) {
      calculatedCheck += parseInt(digits[digits.length - 1 - i]) * (i + 1);
    }
    calculatedCheck = calculatedCheck % 10;
    
    if (calculatedCheck !== checkDigit) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Invalid CAS number: checksum failed. Please verify the CAS number.` 
        },
        { status: 400 }
      );
    }
    
    // 检查 SPU 是否已存在
    const existingSpu = await db.execute(sql`
      SELECT id FROM products WHERE cas = ${casNumber}
    `);
    
    if (existingSpu.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'SPU with this CAS number already exists' },
        { status: 400 }
      );
    }
    
    // 检查是否已有待审核的申请
    const existingRequest = await db.execute(sql`
      SELECT id FROM spu_requests 
      WHERE cas = ${casNumber} AND status = 'pending'
    `);
    
    if (existingRequest.rows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'A pending request for this CAS number already exists' },
        { status: 400 }
      );
    }
    
    // 创建申请
    const result = await db.execute(sql`
      INSERT INTO spu_requests (cas, user_id, user_email, "user_name", reason, reason_detail, status, created_at, updated_at)
      VALUES (${casNumber}, ${userId}, ${userEmail ?? ''}, ${userName ?? ''}, ${reason}, ${reasonDetail || null}, 'pending', NOW(), NOW())
      RETURNING *
    `);
    
    return NextResponse.json({
      success: true,
      data: result.rows[0],
      message: 'SPU request submitted successfully',
    });
  } catch (error) {
    console.error('Create SPU request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit request' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/spu-requests
 * 管理员审核 SPU 申请
 */
export async function PUT(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const body = await request.json();
    
    const { id, action, rejectReason, reviewerId } = body;
    
    if (!id || !action) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 获取申请详情
    const requestResult = await db.execute(sql`
      SELECT * FROM spu_requests WHERE id = ${id}
    `);
    
    if (requestResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Request not found' },
        { status: 404 }
      );
    }
    
    const spuRequest = requestResult.rows[0];
    
    // 拒绝操作：允许对 pending 和 approved 状态进行拒绝
    if (action === 'reject') {
      if (spuRequest.status !== 'pending' && spuRequest.status !== 'approved') {
        return NextResponse.json(
          { success: false, error: 'Request already processed' },
          { status: 400 }
        );
      }
      
      if (!rejectReason || !rejectReason.trim()) {
        return NextResponse.json(
          { success: false, error: 'Reject reason is required' },
          { status: 400 }
        );
      }
      
      // 更新状态为拒绝
      await db.execute(sql`
        UPDATE spu_requests 
        SET status = 'rejected', reject_reason = ${rejectReason}, reviewed_by = ${reviewerId}, reviewed_at = NOW(), updated_at = NOW()
        WHERE id = ${id}
      `);
      
      // 发送站内信通知用户
      const notificationContent = `您申请添加的CAS号 ${spuRequest.cas} 未能通过审核。原因：${rejectReason}。如有疑问请联系客服。`;
        
      await db.execute(sql`
        INSERT INTO messages (
          id, user_id, type, folder, title, content, sender_id, 
          sender_name, sender_address, status, created_at
        ) VALUES (
          gen_random_uuid(),
          ${spuRequest.user_id},
          'system',
          'inbox',
          'SPU申请未通过',
          ${notificationContent},
          ${reviewerId},
          'SYSTEM_NOTIFICATION',
          null,
          'unread',
          NOW()
        )
      `);
      
      return NextResponse.json({
        success: true,
        message: 'Request rejected successfully',
      });
    }
    
    // 通过操作：只允许对 pending 状态
    if (spuRequest.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Request already processed' },
        { status: 400 }
      );
    }
    
    if (action === 'approve') {
      // 检查该 CAS 是否已有 SPU
      const existingSpuResult = await db.execute(sql`
        SELECT id, name FROM products WHERE cas = ${spuRequest.cas}
      `);
      
      let spuId = null;
      let spuName = null;
      
      if (existingSpuResult.rows.length > 0) {
        // 已有 SPU，直接关联
        spuId = (existingSpuResult.rows[0] as any).id;
        spuName = (existingSpuResult.rows[0] as any).name;
        
        await db.execute(sql`
          UPDATE spu_requests 
          SET status = 'created', spu_id = ${spuId}, reviewed_by = ${reviewerId}, reviewed_at = NOW(), updated_at = NOW()
          WHERE id = ${id}
        `);
      } else {
        // 没有 SPU，尝试从 PubChem 获取数据并创建
        try {
          // 调用 PubChem 同步接口获取数据
          const syncResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/pubchem?cas=${spuRequest.cas}`
          );
          const syncData = await syncResponse.json();
          
          if (syncData.success && syncData.data) {
            const pubchemData = syncData.data;
            
            // 创建 SPU
            const insertResult = await db.execute(sql`
              INSERT INTO products (
                cas, name, name_en, formula, molecular_weight,
                smiles, inchi, inchi_key, xlogp,
                synonyms, status, pubchem_synced_at, created_at, updated_at
              ) VALUES (
                ${spuRequest.cas},
                ${pubchemData.nameZh || pubchemData.nameEn || spuRequest.cas},
                ${pubchemData.nameEn || null},
                ${pubchemData.formula || null},
                ${pubchemData.molecularWeight || null},
                ${pubchemData.smiles || null},
                ${pubchemData.inchi || null},
                ${pubchemData.inchiKey || null},
                ${pubchemData.xlogp || null},
                ${pubchemData.synonyms ? JSON.stringify(pubchemData.synonyms) : null}::jsonb,
                'INACTIVE',
                NOW(),
                NOW(),
                NOW()
              )
              RETURNING id, name
            `);
            
            spuId = (insertResult.rows[0] as any).id;
            spuName = (insertResult.rows[0] as any).name;
            
            // 异步同步结构图和生成产品图
            (async () => {
              try {
                const casCode = spuRequest.cas as string;
                
                // 同步 PubChem 结构图
                await fetch(
                  `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5000'}/api/admin/spu/sync-pubchem`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ casList: [casCode], forceUpdate: true }),
                  }
                );
                
                // 生成产品图
                const svgResult = await generateChemicalSVG({ 
                  name: spuName || casCode, 
                  cas: casCode
                });
                
                if (svgResult.success && svgResult.svg && validateSVG(svgResult.svg)) {
                  const storage = new S3Storage({
                    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
                    accessKey: '',
                    secretKey: '',
                    bucketName: process.env.COZE_BUCKET_NAME,
                    region: 'cn-beijing',
                  });
                  
                  const fileName = `chemical-svg/${casCode.replace(/-/g, '_')}_${Date.now()}.svg`;
                  const imageKey = await storage.uploadFile({
                    fileContent: Buffer.from(svgResult.svg, 'utf-8'),
                    fileName,
                    contentType: 'image/svg+xml',
                  });
                  
                  await db.execute(sql`
                    UPDATE products 
                    SET product_image_key = ${imageKey}, product_image_generated_at = NOW()
                    WHERE id = ${spuId}
                  `);
                }
              } catch (err) {
                console.error('[SPU] Failed to sync/generate image:', err);
              }
            })();
            
            await db.execute(sql`
              UPDATE spu_requests 
              SET status = 'created', spu_id = ${spuId}, reviewed_by = ${reviewerId}, reviewed_at = NOW(), updated_at = NOW()
              WHERE id = ${id}
            `);
          } else {
            // PubChem 没有数据，保持 approved 状态等待手动创建
            await db.execute(sql`
              UPDATE spu_requests 
              SET status = 'approved', reviewed_by = ${reviewerId}, reviewed_at = NOW(), updated_at = NOW()
              WHERE id = ${id}
            `);
          }
        } catch (syncError) {
          console.error('[SPU] Failed to fetch PubChem data:', syncError);
          // 出错时保持 approved 状态
          await db.execute(sql`
            UPDATE spu_requests 
            SET status = 'approved', reviewed_by = ${reviewerId}, reviewed_at = NOW(), updated_at = NOW()
            WHERE id = ${id}
          `);
        }
      }
      
      // 发送站内信通知用户
      const notificationContent = spuId 
        ? `您申请添加的CAS号 ${spuRequest.cas} 已通过审核并添加到产品库。感谢您的支持！`
        : `您申请添加的CAS号 ${spuRequest.cas} 已通过审核，预计1-2个工作日将完成添加。感谢您的支持！`;
        
      await db.execute(sql`
        INSERT INTO messages (
          id, user_id, type, folder, title, content, sender_id, 
          sender_name, sender_address, status, created_at
        ) VALUES (
          gen_random_uuid(),
          ${spuRequest.user_id},
          'system',
          'inbox',
          'SPU申请已通过',
          ${notificationContent},
          ${reviewerId},
          'SYSTEM_NOTIFICATION',
          null,
          'unread',
          NOW()
        )
      `);
      
      return NextResponse.json({
        success: true,
        message: spuId ? 'Request approved and SPU created' : 'Request approved',
        spuId,
        spuName,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Review SPU request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/spu-requests
 * 用户取消自己的申请
 */
export async function DELETE(request: NextRequest) {
  try {
    const db = await getDb(schema);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    
    if (!id || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // 只能取消自己的待审核申请
    const result = await db.execute(sql`
      DELETE FROM spu_requests 
      WHERE id = ${id} AND user_id = ${userId} AND status = 'pending'
      RETURNING id
    `);
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Request not found or cannot be cancelled' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Request cancelled',
    });
  } catch (error) {
    console.error('Cancel SPU request error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel request' },
      { status: 500 }
    );
  }
}

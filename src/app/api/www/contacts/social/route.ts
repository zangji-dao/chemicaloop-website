import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * 获取用户的社交联系方式
 * GET /api/social-contacts?userId=xxx
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 获取用户的联系方式
    const result = await db.execute(sql`
      SELECT
        usc.id,
        usc.contact_type_id as "contactTypeId",
        usc.contact_value as "contactValue",
        usc.is_verified as "isVerified",
        usc.is_visible_in_circle as "isVisibleInCircle",
        sct.name,
        sct.name_en as "nameEn",
        sct.icon,
        sct.placeholder,
        sct.placeholder_en as "placeholderEn",
        sct.sort_order as "sortOrder"
      FROM user_social_contacts usc
      INNER JOIN social_contact_types sct ON usc.contact_type_id = sct.id
      WHERE usc.user_id = ${userId}
        AND sct.is_active = true
      ORDER BY sct.sort_order
    `);

    const contacts = result.rows.map((row: any) => ({
      id: row.id,
      contactTypeId: row.contactTypeId,
      contactValue: row.contactValue,
      isVerified: row.isVerified,
      isVisibleInCircle: row.isVisibleInCircle,
      name: row.name,
      nameEn: row.nameEn,
      icon: row.icon,
      placeholder: row.placeholder,
      placeholderEn: row.placeholderEn,
      sortOrder: row.sortOrder,
    }));

    return NextResponse.json({
      success: true,
      contacts,
    });
  } catch (error: any) {
    console.error('Get social contacts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get social contacts' },
      { status: 500 }
    );
  }
}

/**
 * 保存/更新用户的社交联系方式
 * POST /api/social-contacts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, contacts } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!contacts || !Array.isArray(contacts)) {
      return NextResponse.json(
        { error: 'contacts must be an array' },
        { status: 400 }
      );
    }

    const db = await getDb(schema);

    // 删除用户的所有现有联系方式
    await db.execute(sql`
      DELETE FROM user_social_contacts
      WHERE user_id = ${userId}
    `);

    // 插入新的联系方式
    for (const contact of contacts) {
      if (contact.contactValue) {
        await db.execute(sql`
          INSERT INTO user_social_contacts (user_id, contact_type_id, contact_value, is_visible_in_circle)
          VALUES (
            ${userId},
            ${contact.contactTypeId},
            ${contact.contactValue},
            ${contact.isVisibleInCircle || false}
          )
          ON CONFLICT (user_id, contact_type_id)
          DO UPDATE SET
            contact_value = EXCLUDED.contact_value,
            is_visible_in_circle = EXCLUDED.is_visible_in_circle,
            updated_at = NOW()
        `);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Contacts saved successfully',
    });
  } catch (error: any) {
    console.error('Save social contacts error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to save social contacts' },
      { status: 500 }
    );
  }
}

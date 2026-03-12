import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/storage/database/shared/schema';

/**
 * 验证 UUID 格式的工具函数
 */
function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * 验证 CAS 号格式的工具函数
 * CAS 号格式：数字-数字-数字（如 64-17-5）
 */
function isValidCAS(id: string): boolean {
  const casRegex = /^\d{1,7}-\d{2}-\d$/;
  return casRegex.test(id);
}

/**
 * 将下划线命名转换为驼峰命名
 */
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

/**
 * GET /api/admin/products/[id]
 * 获取产品详情
 * 支持通过 UUID 或 CAS 号查询
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb(schema);
    const { id } = await params;

    let productResult;

    if (isValidUUID(id)) {
      // 通过 UUID 查询单个产品
      productResult = await db.execute(sql`
        SELECT 
          ap.*,
          u.name as agent_name,
          u.email as agent_email
        FROM agent_products ap
        LEFT JOIN users u ON ap.agent_id = u.id
        WHERE ap.id = ${id}
      `);
      
      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const product = toCamelCase(productResult.rows[0] as Record<string, any>);
      return NextResponse.json({
        success: true,
        data: product,
      });
    } else if (isValidCAS(id)) {
      // 通过 CAS 号查询 - 返回 SPU 信息和所有供应商报价
      productResult = await db.execute(sql`
        SELECT 
          ap.*,
          u.name as agent_name,
          u.email as agent_email
        FROM agent_products ap
        LEFT JOIN users u ON ap.agent_id = u.id
        WHERE ap.cas = ${id} AND ap.status = 'active'
        ORDER BY ap.price ASC
      `);
      
      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      // 构建供应商列表
      const suppliers = productResult.rows.map((row: any) => ({
        id: row.id,
        productId: row.id,
        name: row.agent_name || 'Unknown',
        company: null,
        price: row.price,
        moq: row.min_order,
        deliveryTime: null,
        location: row.origin,
        rating: null,
        status: row.status,
        purity: row.purity,
        packageSpec: row.package_spec,
        stock: row.stock,
      }));

      // 使用第一个产品作为基础数据
      const firstProduct = toCamelCase(productResult.rows[0] as Record<string, any>);
      
      // 构建完整的返回数据
      const productData = {
        ...firstProduct,
        nameEn: firstProduct.name,
        nameZh: firstProduct.translations?.name?.zh || firstProduct.name,
        formula: null, // TODO: 从 SPU 表获取
        description: null,
        imageUrl: firstProduct.imageKey ? `/api/storage/file?key=${firstProduct.imageKey}` : null,
        referencePrice: suppliers.length > 0 ? suppliers[0].price : null,
        suppliers,
      };

      return NextResponse.json({
        success: true,
        data: productData,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format. Expected UUID or CAS number.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * 删除产品
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const db = await getDb(schema);
    const { id } = await params;

    // 验证 UUID 格式
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    // 检查产品是否存在
    const productResult = await db.execute(sql`
      SELECT id FROM agent_products WHERE id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // 删除产品
    await db.execute(sql`
      DELETE FROM agent_products WHERE id = ${id}
    `);

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}

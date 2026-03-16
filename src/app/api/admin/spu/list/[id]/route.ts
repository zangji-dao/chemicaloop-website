import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import { sql } from 'drizzle-orm';
import * as schema from '@/db';
import { withAdminAuth } from '@/lib/withAuth';

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
 * GET /api/admin/spu/list/[id]
 * 获取 SPU 产品详情
 * 支持通过 UUID 或 CAS 号查询 products 表
 */
export const GET = withAdminAuth(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const db = await getDb(schema);
    const { id } = await params;

    let productResult;

    if (isValidUUID(id)) {
      // 通过 UUID 查询 products 表（SPU 编辑页面）
      productResult = await db.execute(sql`
        SELECT 
          p.*
        FROM products p
        WHERE p.id = ${id}
      `);
      
      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const product = toCamelCase(productResult.rows[0] as Record<string, any>);
      
      // 转换数据格式以匹配前端期望
      const productData = {
        ...product,
        // 结构图 URL（通过签名 URL API 获取）
        structureImageUrl: product.structureImageKey ? `/api/common/image-url?key=${encodeURIComponent(product.structureImageKey)}` : null,
        // 产品图 URL（通过签名 URL API 获取）
        productImageUrl: product.productImageKey ? `/api/common/image-url?key=${encodeURIComponent(product.productImageKey)}` : null,
      };

      return NextResponse.json({
        success: true,
        data: productData,
      });
    } else if (isValidCAS(id)) {
      // 通过 CAS 号查询 products 表
      productResult = await db.execute(sql`
        SELECT 
          p.*
        FROM products p
        WHERE p.cas = ${id}
        LIMIT 1
      `);
      
      if (productResult.rows.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Product not found' },
          { status: 404 }
        );
      }

      const product = toCamelCase(productResult.rows[0] as Record<string, any>);
      
      // 查询关联的供应商报价
      const suppliersResult = await db.execute(sql`
        SELECT 
          ap.*,
          u.name as agent_name,
          u.email as agent_email
        FROM agent_products ap
        LEFT JOIN users u ON ap.agent_id = u.id
        WHERE ap.cas = ${id} AND ap.status = 'active'
        ORDER BY ap.price ASC
      `);
      
      // 构建供应商列表
      const suppliers = suppliersResult.rows.map((row: any) => ({
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

      // 构建完整的返回数据
      const productData = {
        ...product,
        // 结构图 URL（通过签名 URL API 获取）
        structureImageUrl: product.structureImageKey ? `/api/common/image-url?key=${encodeURIComponent(product.structureImageKey)}` : null,
        // 产品图 URL（通过签名 URL API 获取）
        productImageUrl: product.productImageKey ? `/api/common/image-url?key=${encodeURIComponent(product.productImageKey)}` : null,
        nameEn: product.name,
        nameZh: product.translations?.name?.zh || product.name,
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
});

/**
 * DELETE /api/admin/spu/list/[id]
 * 删除 SPU 产品
 */
export const DELETE = withAdminAuth(async (
  request,
  { params }: { params: Promise<{ id: string }> }
) => {
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
      SELECT id FROM products WHERE id = ${id}
    `);

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // 删除产品
    await db.execute(sql`
      DELETE FROM products WHERE id = ${id}
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
});

import { NextRequest, NextResponse } from 'next/server';

// 模拟的产品存储
let productsDatabase: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      cas,
      nameZh,
      nameEn,
      formula,
      structure,
      physicalStates,
      purityLevel,
      customPurity,
      industryTags,
      applications,
      skus,
    } = body;

    // 验证必填字段
    if (!cas || !skus || skus.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'CAS number and at least one SKU are required',
        },
        { status: 400 }
      );
    }

    // 创建产品
    const newProduct = {
      id: `PROD-${Date.now()}`,
      cas,
      nameZh,
      nameEn,
      formula,
      structure,
      physicalStates: physicalStates || [],
      purityLevel: purityLevel || '',
      customPurity: customPurity || '',
      industryTags: industryTags || [],
      applications: applications || '',
      skus: skus.map((sku: any, index: number) => ({
        id: `SKU-${Date.now()}-${index}`,
        physicalState: sku.physicalState,
        packaging: sku.packaging,
        purity: sku.purity,
        stock: parseInt(sku.stock) || 0,
        price: parseFloat(sku.price) || 0,
        moq: parseInt(sku.moq) || 1,
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 保存到数据库（模拟）
    productsDatabase.push(newProduct);

    return NextResponse.json({
      success: true,
      product: newProduct,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create product',
      },
      { status: 500 }
    );
  }
}

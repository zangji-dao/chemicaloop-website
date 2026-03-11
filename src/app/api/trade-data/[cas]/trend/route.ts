import { NextRequest, NextResponse } from 'next/server';
import { getMonthlyTradeData, getQuarterlyTradeData, getTradeDataTrend } from '@/lib/un-comtrade-service';
import { getHSCodeByCAS } from '@/lib/cas-hs-mapping';

/**
 * GET /api/trade-data/[cas]/trend
 * 获取化学品贸易数据趋势
 * 
 * Query params:
 * - type: 'yearly' | 'monthly' | 'quarterly' (default: 'yearly')
 * - year: 年份 (月度/季度时必填)
 * - years: 年份列表，逗号分隔 (年度趋势时使用)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cas: string }> }
) {
  try {
    const { cas } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'yearly';
    const yearParam = searchParams.get('year');
    const yearsParam = searchParams.get('years');

    if (!cas) {
      return NextResponse.json(
        { success: false, error: 'CAS number is required' },
        { status: 400 }
      );
    }

    // 检查是否有 HS 编码映射
    const hsMapping = getHSCodeByCAS(cas);
    if (!hsMapping) {
      return NextResponse.json(
        { success: false, error: 'No HS code mapping found for this CAS' },
        { status: 404 }
      );
    }

    let data;

    switch (type) {
      case 'monthly': {
        const year = yearParam ? parseInt(yearParam) : new Date().getFullYear() - 1;
        data = await getMonthlyTradeData(cas, year);
        break;
      }
      case 'quarterly': {
        const year = yearParam ? parseInt(yearParam) : new Date().getFullYear() - 1;
        data = await getQuarterlyTradeData(cas, year);
        break;
      }
      case 'yearly':
      default: {
        // 解析年份列表，默认最近 5 年
        const currentYear = new Date().getFullYear();
        const years = yearsParam 
          ? yearsParam.split(',').map(y => parseInt(y.trim()))
          : [currentYear - 5, currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1];
        data = await getTradeDataTrend(cas, years);
        break;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        cas,
        hsCode: hsMapping.hsCode6,
        productName: hsMapping.name,
        type,
        items: data,
      },
    });
  } catch (error) {
    console.error('Error fetching trade trend data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trade trend data' },
      { status: 500 }
    );
  }
}

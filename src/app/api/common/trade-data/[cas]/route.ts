import { NextRequest, NextResponse } from 'next/server';
import { getHSCodeByCAS } from '@/lib/cas-hs-mapping';
import { getCountryName } from '@/lib/country-codes';

/**
 * GET /api/trade-data/[cas]
 * 从本地数据库获取化学品海关贸易数据
 * 
 * 参数:
 * - reporterCode: 报告国代码 (默认 '156' 中国)
 * - startYear: 起始年份
 * - endYear: 结束年份
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cas: string }> }
) {
  try {
    const { cas } = await params;
    const { searchParams } = new URL(request.url);
    const locale = searchParams.get('locale') || 'zh';
    
    // 解析参数
    const reporterCode = searchParams.get('reporterCode') || '156';
    const startYearParam = searchParams.get('startYear');
    const endYearParam = searchParams.get('endYear');
    
    // 默认近3年数据
    const currentYear = new Date().getFullYear() - 1;
    const startYear = startYearParam ? parseInt(startYearParam) : currentYear - 2;
    const endYear = endYearParam ? parseInt(endYearParam) : currentYear;

    if (!cas) {
      return NextResponse.json(
        { success: false, error: 'CAS number is required' },
        { status: 400 }
      );
    }

    // 获取 HS 编码映射
    const hsMapping = getHSCodeByCAS(cas);

    // 动态导入数据库管理器
    let dbRecords: any[] = [];
    let availableYears: number[] = [];
    let yearlyData: any[] = [];
    let latestYear = currentYear;
    let latestData: { export: any; import: any } = { export: null, import: null };
    let topExportPartners: any[] = [];
    let topImportPartners: any[] = [];

    try {
      const { 
        queryTradeData, 
        queryTradePartnerData, 
        getAvailableYears,
        formatTradeDataForDisplay 
      } = await import('@/db/tradeDataManager');

      // 1. 从本地数据库查询数据
      dbRecords = await queryTradeData({
        cas,
        reporterCode,
        startYear,
        endYear,
      });

      // 2. 获取可用年份列表
      availableYears = await getAvailableYears({ cas, reporterCode });

      // 3. 格式化数据
      const formatted = formatTradeDataForDisplay(dbRecords, locale as 'zh' | 'en');
      yearlyData = formatted.yearlyData;
      latestYear = formatted.latestYear;
      latestData = formatted.latestData;

      // 4. 获取贸易伙伴数据（全部，按金额降序）
      if (latestData.export || latestData.import) {
        const [exportPartners, importPartners] = await Promise.all([
          queryTradePartnerData({
            cas,
            reporterCode,
            year: latestYear,
            flowCode: 'X',
            limit: 100, // 获取全部
          }),
          queryTradePartnerData({
            cas,
            reporterCode,
            year: latestYear,
            flowCode: 'M',
            limit: 100, // 获取全部
          }),
        ]);

        // 计算总量用于百分比
        const totalExport = exportPartners.reduce((sum: number, p: any) => sum + parseFloat(p.value || '0'), 0);
        const totalImport = importPartners.reduce((sum: number, p: any) => sum + parseFloat(p.value || '0'), 0);

        topExportPartners = exportPartners.map((p: any) => ({
          code: p.partnerCode,
          name: p.partnerName || getCountryName(p.partnerCode, locale as 'zh' | 'en'),
          value: parseFloat(p.value || '0'),
          valueFormatted: formatValue(parseFloat(p.value || '0')),
          percentage: totalExport > 0 ? (parseFloat(p.value || '0') / totalExport) * 100 : 0,
        }));

        topImportPartners = importPartners.map((p: any) => ({
          code: p.partnerCode,
          name: p.partnerName || getCountryName(p.partnerCode, locale as 'zh' | 'en'),
          value: parseFloat(p.value || '0'),
          valueFormatted: formatValue(parseFloat(p.value || '0')),
          percentage: totalImport > 0 ? (parseFloat(p.value || '0') / totalImport) * 100 : 0,
        }));
      }
    } catch (dbError) {
      console.error('Database query error (table may not exist):', dbError);
      // 继续返回空数据，而不是报错
    }

    // 5. 构建响应
    const response = {
      success: true,
      data: {
        cas,
        productName: hsMapping?.name || cas,
        productNameEn: hsMapping?.nameEn || cas,
        hsCode: hsMapping?.hsCode6 || '',
        hsCodeDesc: hsMapping?.description || '',
        reporterCode,
        reporterName: getCountryName(reporterCode, locale as 'zh' | 'en'),
        startYear,
        endYear,
        yearlyData: yearlyData.map(item => ({
          year: item.year,
          export: {
            ...item.export,
            quantity: formatQuantity(item.export.quantity),
          },
          import: {
            ...item.import,
            quantity: formatQuantity(item.import.quantity),
          },
          tradeBalance: item.tradeBalance,
        })),
        latestYear,
        latestData: {
          export: latestData.export ? {
            value: parseFloat(latestData.export.value || '0'),
            valueFormatted: formatValue(parseFloat(latestData.export.value || '0')),
            quantity: formatQuantity(latestData.export.quantity),
            quantityRaw: latestData.export.quantity,
          } : null,
          import: latestData.import ? {
            value: parseFloat(latestData.import.value || '0'),
            valueFormatted: formatValue(parseFloat(latestData.import.value || '0')),
            quantity: formatQuantity(latestData.import.quantity),
            quantityRaw: latestData.import.quantity,
          } : null,
          tradeBalance: {
            value: yearlyData[0]?.tradeBalance.value || 0,
            valueFormatted: formatValue(yearlyData[0]?.tradeBalance.value || 0),
            type: yearlyData[0]?.tradeBalance.type || 'balanced',
          },
          topExportPartners,
          topImportPartners,
        },
        availableYears,
        dataSource: 'un_comtrade' as const,
        generatedAt: new Date().toISOString(),
        disclaimer: locale === 'zh'
          ? '数据来源于联合国商品贸易统计数据库(UN Comtrade)。数据仅供参考，实际贸易数据可能因统计口径、报告延迟等因素存在差异。'
          : 'Data sourced from UN Comtrade (United Nations Commodity Trade Statistics Database). For reference only, actual trade data may vary due to statistical methods and reporting delays.',
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching trade data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch trade data' },
      { status: 500 }
    );
  }
}

/**
 * 格式化金额
 */
function formatValue(value: number): string {
  if (value >= 1000000000) {
    return `${(value / 1000000000).toFixed(2)} 十亿美元`;
  } else if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)} 百万美元`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} 千美元`;
  }
  return `${value.toFixed(2)} 美元`;
}

/**
 * 格式化数量（千克转吨）
 */
function formatQuantity(qtyStr: string | null): string {
  if (!qtyStr) return '-';
  const qty = parseFloat(qtyStr);
  if (isNaN(qty) || qty <= 0) return '-';
  
  const tons = qty / 1000;
  if (tons >= 10000) {
    return `${(tons / 10000).toFixed(2)} 万吨`;
  } else if (tons >= 1000) {
    return `${(tons / 1000).toFixed(2)} 千吨`;
  } else if (tons >= 1) {
    return `${tons.toFixed(2)} 吨`;
  } else {
    return `${qty.toFixed(2)} 千克`;
  }
}

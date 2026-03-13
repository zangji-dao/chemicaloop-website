import { NextRequest, NextResponse } from 'next/server';
import { getDb } from 'coze-coding-dev-sdk';
import * as schema from '@/db';
import { sql, desc, eq, and, inArray } from 'drizzle-orm';

/**
 * GET /api/customs-data
 * 海关数据 API
 * 
 * 参数:
 * - type: 类型 (stats|list|years|overview|partner|region|tradeMode|monthly|yearly)
 * - source: 数据源 (china|un, 默认 china)
 * - page: 页码 (默认 1)
 * - pageSize: 每页数量 (默认 20)
 * - search: 搜索关键词
 * - year: 年份
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'stats';
    const source = searchParams.get('source') || 'china';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const search = searchParams.get('search') || '';
    const year = searchParams.get('year');
    const partnerCode = searchParams.get('partnerCode');
    const regionCode = searchParams.get('regionCode');
    
    const db = await getDb(schema);
    
    switch (type) {
      case 'stats':
        return await getStats(db, source);
      case 'list':
        return await getList(db, source, page, pageSize, search);
      case 'years':
        return await getAvailableYears(db, source);
      case 'overview':
        return await getOverview(db, parseInt(year || '2024'));
      case 'partner':
        return await getPartnerRanking(db, parseInt(year || '2024'), regionCode);
      case 'region':
        return await getRegionRanking(db, parseInt(year || '2024'), partnerCode);
      case 'tradeMode':
        return await getTradeModeAnalysis(db, parseInt(year || '2024'), partnerCode, regionCode);
      case 'monthly':
        return await getMonthlyTrend(db, parseInt(year || '2024'), partnerCode, regionCode);
      case 'yearly':
      case 'yearlyTrend':
        return await getYearlyTrend(db, partnerCode, regionCode);
      default:
        return NextResponse.json({ success: false, error: 'Invalid type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Customs data API error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * 获取统计信息
 */
async function getStats(db: any, source: string) {
  if (source === 'un') {
    // UN Comtrade 数据统计
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_records,
        MIN(year) as year_min,
        MAX(year) as year_max,
        COUNT(DISTINCT hs_code) as hs_codes,
        COUNT(DISTINCT partner_code) as partner_count
      FROM trade_data
    `);
    
    const row = result.rows[0] as any;
    return NextResponse.json({
      success: true,
      stats: {
        totalRecords: parseInt(row.total_records || '0'),
        yearMin: row.year_min || 2020,
        yearMax: row.year_max || 2024,
        hsCodes: [],
        partnerCount: parseInt(row.partner_count || '0'),
      },
      source,
    });
  } else {
    // 中国海关数据统计
    const result = await db.execute(sql`
      SELECT 
        COUNT(*) as total_records,
        MIN(year) as year_min,
        MAX(year) as year_max,
        COUNT(DISTINCT hs_code) as hs_code_count,
        COUNT(DISTINCT partner_name) as partner_count
      FROM customs_data
    `);
    
    const row = result.rows[0] as any;
    
    // 获取HS编码列表
    const hsResult = await db.execute(sql`
      SELECT DISTINCT hs_code 
      FROM customs_data 
      LIMIT 10
    `);
    
    return NextResponse.json({
      success: true,
      stats: {
        totalRecords: parseInt(row.total_records || '0'),
        yearMin: row.year_min || 2020,
        yearMax: row.year_max || 2024,
        hsCodes: hsResult.rows.map((r: any) => r.hs_code),
        partnerCount: parseInt(row.partner_count || '0'),
      },
      source,
    });
  }
}

/**
 * 获取数据列表
 */
async function getList(db: any, source: string, page: number, pageSize: number, search: string) {
  const offset = (page - 1) * pageSize;
  
  if (source === 'un') {
    // UN Comtrade 数据列表
    const whereClause = search 
      ? sql`WHERE cas ILIKE ${`%${search}%`} OR reporter_name ILIKE ${`%${search}%`} OR partner_name ILIKE ${`%${search}%`}`
      : sql``;
    
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM trade_data ${whereClause}
    `);
    
    const result = await db.execute(sql`
      SELECT * FROM trade_data
      ${whereClause}
      ORDER BY year DESC, created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);
    
    const total = parseInt((countResult.rows[0] as any)?.total || '0');
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      source,
    });
  } else {
    // 中国海关数据列表
    const whereClause = search 
      ? sql`WHERE partner_name ILIKE ${`%${search}%`} OR region_name ILIKE ${`%${search}%`} OR hs_code ILIKE ${`%${search}%`}`
      : sql``;
    
    const countResult = await db.execute(sql`
      SELECT COUNT(*) as total FROM customs_data ${whereClause}
    `);
    
    const result = await db.execute(sql`
      SELECT * FROM customs_data
      ${whereClause}
      ORDER BY year DESC, month DESC, created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `);
    
    const total = parseInt((countResult.rows[0] as any)?.total || '0');
    
    return NextResponse.json({
      success: true,
      data: result.rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
      source,
    });
  }
}

/**
 * 获取可用年份列表
 */
async function getAvailableYears(db: any, source: string) {
  const tableName = source === 'un' ? 'trade_data' : 'customs_data';
  
  const result = await db.execute(sql`
    SELECT DISTINCT year 
    FROM ${sql.identifier(tableName)} 
    ORDER BY year DESC
  `);
  
  return NextResponse.json({
    success: true,
    years: result.rows.map((r: any) => r.year),
    source,
  });
}

/**
 * 数据概览
 */
async function getOverview(db: any, year: number) {
  const result = await db.execute(sql`
    SELECT 
      COUNT(*) as total_records,
      COUNT(DISTINCT partner_name) as partner_count,
      COUNT(DISTINCT region_name) as region_count,
      COUNT(DISTINCT trade_mode_name) as trade_mode_count,
      SUM(value) as total_value,
      AVG(value) as avg_value
    FROM customs_data
    WHERE year = ${year}
  `);
  
  // 月度趋势
  const monthlyTrend = await db.execute(sql`
    SELECT 
      month,
      year_month,
      SUM(value) as total_value,
      COUNT(DISTINCT partner_name) as partner_count,
      COUNT(*) as record_count
    FROM customs_data
    WHERE year = ${year}
    GROUP BY month, year_month
    ORDER BY month
  `);
  
  // Top 5 贸易伙伴
  const topPartners = await db.execute(sql`
    SELECT 
      partner_code,
      partner_name,
      SUM(value) as total_value
    FROM customs_data
    WHERE year = ${year}
    GROUP BY partner_code, partner_name
    ORDER BY total_value DESC
    LIMIT 5
  `);
  
  // Top 5 省份
  const topRegions = await db.execute(sql`
    SELECT 
      region_code,
      region_name,
      SUM(value) as total_value
    FROM customs_data
    WHERE year = ${year}
    GROUP BY region_code, region_name
    ORDER BY total_value DESC
    LIMIT 5
  `);
  
  // 计算百分比
  const totalValue = parseFloat((result.rows[0] as any)?.total_value || '0');
  
  const partners = topPartners.rows.map((r: any) => ({
    ...r,
    total_value: parseFloat(r.total_value || '0'),
    percentage: totalValue > 0 ? (parseFloat(r.total_value || '0') / totalValue * 100) : 0,
  }));
  
  const regions = topRegions.rows.map((r: any) => ({
    ...r,
    total_value: parseFloat(r.total_value || '0'),
    percentage: totalValue > 0 ? (parseFloat(r.total_value || '0') / totalValue * 100) : 0,
  }));
  
  return NextResponse.json({
    success: true,
    data: {
      overview: result.rows[0],
      monthlyTrend: monthlyTrend.rows.map((r: any) => ({
        ...r,
        total_value: parseFloat(r.total_value || '0'),
      })),
      topPartners: partners,
      topRegions: regions,
      year,
    }
  });
}

/**
 * 贸易伙伴排名
 */
async function getPartnerRanking(db: any, year: number, regionCode?: string | null) {
  const whereClause = regionCode
    ? sql`WHERE year = ${year} AND region_code = ${regionCode}`
    : sql`WHERE year = ${year}`;
  
  const result = await db.execute(sql`
    SELECT 
      partner_code,
      partner_name,
      SUM(value) as total_value,
      COUNT(DISTINCT region_name) as region_count,
      COUNT(DISTINCT trade_mode_name) as trade_mode_count
    FROM customs_data
    ${whereClause}
    GROUP BY partner_code, partner_name
    ORDER BY total_value DESC
  `);
  
  const totalValue = result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.total_value || '0'), 0);
  const partners = result.rows.map((r: any) => ({
    ...r,
    total_value: parseFloat(r.total_value || '0'),
    percentage: totalValue > 0 ? (parseFloat(r.total_value || '0') / totalValue * 100) : 0,
  }));
  
  return NextResponse.json({
    success: true,
    data: partners,
  });
}

/**
 * 省份排名
 */
async function getRegionRanking(db: any, year: number, partnerCode?: string | null) {
  const whereClause = partnerCode
    ? sql`WHERE year = ${year} AND partner_code = ${partnerCode}`
    : sql`WHERE year = ${year}`;
  
  const result = await db.execute(sql`
    SELECT 
      region_code,
      region_name,
      SUM(value) as total_value,
      COUNT(DISTINCT partner_name) as partner_count,
      COUNT(DISTINCT trade_mode_name) as trade_mode_count
    FROM customs_data
    ${whereClause}
    GROUP BY region_code, region_name
    ORDER BY total_value DESC
  `);
  
  const totalValue = result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.total_value || '0'), 0);
  const regions = result.rows.map((r: any) => ({
    ...r,
    total_value: parseFloat(r.total_value || '0'),
    percentage: totalValue > 0 ? (parseFloat(r.total_value || '0') / totalValue * 100) : 0,
  }));
  
  return NextResponse.json({
    success: true,
    data: regions,
  });
}

/**
 * 贸易方式分析
 */
async function getTradeModeAnalysis(db: any, year: number, partnerCode?: string | null, regionCode?: string | null) {
  const conditions = [sql`year = ${year}`];
  if (partnerCode) conditions.push(sql`partner_code = ${partnerCode}`);
  if (regionCode) conditions.push(sql`region_code = ${regionCode}`);
  
  const result = await db.execute(sql`
    SELECT 
      trade_mode_code,
      trade_mode_name,
      SUM(value) as total_value,
      COUNT(*) as record_count
    FROM customs_data
    WHERE ${sql.join(conditions, sql` AND `)}
    GROUP BY trade_mode_code, trade_mode_name
    ORDER BY total_value DESC
  `);
  
  const totalValue = result.rows.reduce((sum: number, r: any) => sum + parseFloat(r.total_value || '0'), 0);
  const tradeModes = result.rows.map((r: any) => ({
    ...r,
    total_value: parseFloat(r.total_value || '0'),
    percentage: totalValue > 0 ? (parseFloat(r.total_value || '0') / totalValue * 100) : 0,
  }));
  
  return NextResponse.json({
    success: true,
    data: tradeModes,
  });
}

/**
 * 月度趋势
 */
async function getMonthlyTrend(db: any, year: number, partnerCode?: string | null, regionCode?: string | null) {
  const conditions = [sql`year = ${year}`];
  if (partnerCode) conditions.push(sql`partner_code = ${partnerCode}`);
  if (regionCode) conditions.push(sql`region_code = ${regionCode}`);
  
  const result = await db.execute(sql`
    SELECT 
      month,
      year_month,
      SUM(value) as total_value,
      COUNT(DISTINCT partner_name) as partner_count,
      COUNT(DISTINCT region_name) as region_count,
      COUNT(*) as record_count
    FROM customs_data
    WHERE ${sql.join(conditions, sql` AND `)}
    GROUP BY month, year_month
    ORDER BY month
  `);
  
  return NextResponse.json({
    success: true,
    data: result.rows.map((r: any) => ({
      ...r,
      total_value: parseFloat(r.total_value || '0'),
    })),
  });
}

/**
 * 年度趋势
 */
async function getYearlyTrend(db: any, partnerCode?: string | null, regionCode?: string | null) {
  const conditions: any[] = [];
  if (partnerCode) conditions.push(sql`partner_code = ${partnerCode}`);
  if (regionCode) conditions.push(sql`region_code = ${regionCode}`);
  
  const whereClause = conditions.length > 0 
    ? sql`WHERE ${sql.join(conditions, sql` AND `)}`
    : sql``;
  
  const result = await db.execute(sql`
    SELECT 
      year,
      SUM(value) as total_value,
      COUNT(DISTINCT partner_name) as partner_count,
      COUNT(DISTINCT region_name) as region_count,
      COUNT(*) as record_count
    FROM customs_data
    ${whereClause}
    GROUP BY year
    ORDER BY year
  `);
  
  return NextResponse.json({
    success: true,
    data: result.rows.map((r: any) => ({
      ...r,
      total_value: parseFloat(r.total_value || '0'),
    })),
  });
}

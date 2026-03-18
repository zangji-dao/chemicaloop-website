import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// 数据库连接池配置
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL 配置
  ssl: process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.includes('sslmode=require') 
    ? { rejectUnauthorized: false } 
    : false,
  
  // 连接池优化配置
  min: 2,                          // 最小连接数
  max: 15,                         // 最大连接数（增加以支持并发）
  idleTimeoutMillis: 30000,        // 空闲连接超时 30 秒
  connectionTimeoutMillis: 10000,  // 连接超时 10 秒
  
  // 连接验证
  allowExitOnIdle: false,          // 空闲时不退出
});

// 连接成功日志
pool.on('connect', () => {
  console.log('✅ Database connected');
});

// 连接错误处理
pool.on('error', (err) => {
  console.error('❌ Database connection error:', err.message);
  // 不退出进程，允许重试
});

// 连接池状态监控（每分钟输出一次）
setInterval(() => {
  const stats = {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount,
  };
  if (stats.waitingCount > 0 || stats.totalCount > 10) {
    console.log('📊 Pool stats:', stats);
  }
}, 60000);

/**
 * 带重试的数据库查询
 * 在连接超时或临时错误时自动重试
 */
export async function queryWithRetry<T extends pg.QueryResultRow = any>(
  queryText: string,
  values: any[] = [],
  maxRetries: number = 3,
  retryDelayMs: number = 300
): Promise<pg.QueryResult<T>> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await pool.query<T>(queryText, values);
      return result;
    } catch (error: any) {
      lastError = error;
      
      // 判断是否为可重试的错误
      const isRetryable = 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === '57P03' ||  // PostgreSQL: connecting connection
        error.code === '08006' ||  // PostgreSQL: connection failure
        error.code === '08001' ||  // PostgreSQL: connection does not exist
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET');
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(`[DB] Query failed after ${attempt} attempts:`, error.message);
        throw error;
      }
      
      console.warn(`[DB] Retry ${attempt}/${maxRetries} after: ${error.message}`);
      
      // 等待后重试（指数退避）
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
    }
  }
  
  throw lastError;
}

/**
 * 带重试的事务执行
 */
export async function transactionWithRetry<T>(
  callback: (client: pg.PoolClient) => Promise<T>,
  maxRetries: number = 3,
  retryDelayMs: number = 300
): Promise<T> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error: any) {
      await client.query('ROLLBACK');
      lastError = error;
      
      const isRetryable = 
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('timeout') ||
        error.message?.includes('ECONNRESET');
      
      if (!isRetryable || attempt === maxRetries) {
        console.error(`[DB] Transaction failed after ${attempt} attempts:`, error.message);
        throw error;
      }
      
      console.warn(`[DB] Transaction retry ${attempt}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, retryDelayMs * attempt));
    } finally {
      client.release();
    }
  }
  
  throw lastError;
}

export default pool;

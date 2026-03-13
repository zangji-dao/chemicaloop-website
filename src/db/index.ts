/**
 * 数据库模块
 * 导出 schema 和 db 实例获取函数
 */

// 导出所有 schema 表定义
export * from './schema';

// 从 SDK 导出 db 实例获取函数
export { getDb } from 'coze-coding-dev-sdk';

// 类型导出
import type * as schema from './schema';

/**
 * 获取数据库实例的类型
 */
export type Db = Awaited<ReturnType<typeof import('coze-coding-dev-sdk').getDb>>;

/**
 * Schema 类型
 */
export type Schema = typeof schema;

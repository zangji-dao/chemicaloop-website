/**
 * 站内信地址工具函数
 * 格式：username@msg.chemicaloop.com
 */

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'USER' | 'AGENT' | 'ADMIN';
  messageAddress?: string;
}

/**
 * 生成站内信地址
 * @param username 用户名
 * @returns 站内信地址
 */
export function generateMessageAddress(username: string): string {
  // 转换用户名为小写，替换空格和特殊字符为点
  const normalizedUsername = username
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.')
    .replace(/\.+/g, '.')
    .replace(/^\.+|\.+$/g, '');

  return `${normalizedUsername}@msg.chemicaloop.com`;
}

/**
 * 验证站内信地址格式
 * @param address 站内信地址
 * @returns 是否有效
 */
export function validateMessageAddress(address: string): boolean {
  const regex = /^[a-z0-9.]+@msg\.chemicaloop\.com$/;
  return regex.test(address);
}

/**
 * 从站内信地址提取用户名
 * @param address 站内信地址
 * @returns 用户名
 */
export function extractUsername(address: string): string | null {
  if (!validateMessageAddress(address)) {
    return null;
  }
  return address.split('@')[0];
}

/**
 * 格式化显示站内信地址
 * @param address 站内信地址
 * @returns 格式化后的地址（隐藏部分字符以保护隐私）
 */
export function formatMessageAddress(address: string): string {
  if (!address || !validateMessageAddress(address)) {
    return address;
  }
  const [username, domain] = address.split('@');
  if (username.length <= 4) {
    return address;
  }
  const visible = username.slice(0, 2);
  const hidden = '*'.repeat(username.length - 4);
  const suffix = username.slice(-2);
  return `${visible}${hidden}${suffix}@${domain}`;
}

/**
 * 搜索用户（模拟）
 * @param query 搜索查询（用户名或站内信地址）
 * @param users 用户列表
 * @returns 匹配的用户列表
 */
export function searchUsers(query: string, users: User[]): User[] {
  if (!query) return [];

  const lowerQuery = query.toLowerCase();
  return users.filter(user => {
    const usernameMatch = user.username.toLowerCase().includes(lowerQuery);
    const addressMatch = user.messageAddress?.toLowerCase().includes(lowerQuery);
    const emailMatch = user.email.toLowerCase().includes(lowerQuery);
    return usernameMatch || addressMatch || emailMatch;
  });
}

/**
 * 模拟用户数据（实际应该从后端获取）
 */
export const mockUsers: User[] = [
  {
    id: 'user-001',
    username: 'john.smith',
    email: 'john.smith@example.com',
    role: 'USER',
    messageAddress: 'john.smith@msg.chemicaloop.com',
  },
  {
    id: 'agent-001',
    username: 'agent.alex',
    email: 'alex@chemicaloop.com',
    role: 'AGENT',
    messageAddress: 'agent.alex@msg.chemicaloop.com',
  },
  {
    id: 'supplier-001',
    username: 'supplier.chemco',
    email: 'contact@chemco.com',
    role: 'AGENT',
    messageAddress: 'supplier.chemco@msg.chemicaloop.com',
  },
  {
    id: 'user-002',
    username: 'mariagarcia',
    email: 'maria.garcia@company.com',
    role: 'USER',
    messageAddress: 'mariagarcia@msg.chemicaloop.com',
  },
  {
    id: 'agent-002',
    username: 'agent.sarah',
    email: 'sarah@chemicaloop.com',
    role: 'AGENT',
    messageAddress: 'agent.sarah@msg.chemicaloop.com',
  },
];

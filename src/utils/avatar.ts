/**
 * 用户头像工具函数
 */

// 预设的渐变色组合（用于生成默认头像）
const GRADIENT_COLORS = [
  ['#667eea', '#764ba2'], // 紫色
  ['#f093fb', '#f5576c'], // 粉红
  ['#4facfe', '#00f2fe'], // 蓝色
  ['#43e97b', '#38f9d7'], // 绿色
  ['#fa709a', '#fee140'], // 橙粉
  ['#a8edea', '#fed6e3'], // 淡粉
  ['#ff9a9e', '#fecfef'], // 玫瑰
  ['#ffecd2', '#fcb69f'], // 橙色
  ['#a1c4fd', '#c2e9fb'], // 天蓝
  ['#d299c2', '#fef9d7'], // 淡紫
  ['#89f7fe', '#66a6ff'], // 亮蓝
  ['#cd9cf2', '#f6f3ff'], // 淡紫
];

/**
 * 根据用户名生成稳定的颜色索引
 */
function getColorIndex(username: string): number {
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash) % GRADIENT_COLORS.length;
}

/**
 * 获取用户的渐变色
 */
export function getUserGradientColors(username: string): [string, string] {
  const index = getColorIndex(username);
  return GRADIENT_COLORS[index] as [string, string];
}

/**
 * 生成默认头像 URL（使用 DiceBear API）
 * @param username 用户名
 * @param size 尺寸
 */
export function generateAvatarUrl(username: string, size: number = 100): string {
  // 只取第一个字符作为头像文字
  const initial = getInitials(username);
  const colors = getUserGradientColors(username);
  
  // DiceBear API URL - 用 initial 作为 seed，这样只会显示首字符
  return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initial)}&backgroundColor=${colors[0].replace('#', '')}&textColor=ffffff&fontSize=45&size=${size}&fontWeight=600`;
}

/**
 * 获取用户名首字母
 * 只取第一个字符作为头像文字
 */
export function getInitials(name: string): string {
  if (!name) return '?';
  
  // 只取第一个字符
  const firstChar = name.trim().charAt(0);
  return firstChar.toUpperCase();
}

/**
 * 获取用户头像 URL
 * @param user 用户对象
 * @param size 头像尺寸
 */
export function getUserAvatar(user: { avatarUrl?: string | null; username?: string | null; internalEmailName?: string | null; name?: string | null }, size: number = 100): string {
  // 获取应该显示的用户名
  const displayName = user.username || user.internalEmailName || user.name || 'User';
  
  // 如果有上传的自定义头像（非 DiceBear），直接使用
  if (user.avatarUrl && !user.avatarUrl.includes('dicebear')) {
    return user.avatarUrl;
  }
  
  // 如果是 DiceBear 生成的头像，检查是否需要更新
  // 始终根据当前 displayName 生成，确保用户名修改后头像同步更新
  return generateAvatarUrl(displayName, size);
}

/**
 * 生成 Canvas 格式的默认头像（用于服务端渲染或离线场景）
 */
export function generateCanvasAvatar(username: string, size: number = 100): string {
  if (typeof document === 'undefined') {
    // 服务端环境，返回 DiceBear URL
    return generateAvatarUrl(username, size);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return generateAvatarUrl(username, size);
  }
  
  // 绘制渐变背景
  const colors = getUserGradientColors(username);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, colors[0]);
  gradient.addColorStop(1, colors[1]);
  
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  
  // 绘制首字母
  const initials = getInitials(username);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials, size / 2, size / 2 + 2);
  
  return canvas.toDataURL('image/png');
}

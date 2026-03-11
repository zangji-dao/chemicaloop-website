// 社交工具服务
// 用于处理社交联系人的逻辑，包括验证、格式化等

import React from 'react';

// Toast 提示回调（由调用方设置）
let showToastCallback: ((message: string, type: 'success' | 'error' | 'warning' | 'info') => void) | null = null;

export function setToastCallback(callback: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void) {
  showToastCallback = callback;
}

export interface SocialContactType {
  id: string;
  name: string;
  displayName: string;
  icon?: string; // emoji fallback
  iconSvg?: React.ReactNode; // 内联 SVG 图标
  color?: string;
  placeholder?: string;
}

export interface SocialContact {
  id: string;
  type: string;
  value: string;
  visible: boolean;
  createdAt: Date;
}

// 官方风格的 SVG 图标 - 使用currentColor继承父元素颜色
const WeChatIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 0 1 .213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 0 0 .167-.054l1.903-1.114a.864.864 0 0 1 .717-.098 10.16 10.16 0 0 0 2.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178A1.17 1.17 0 0 1 4.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 0 1-1.162 1.178 1.17 1.17 0 0 1-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 0 1 .598.082l1.584.926a.272.272 0 0 0 .14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 0 1-.023-.156.49.49 0 0 1 .201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.004-.27-.026-.406-.032zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 0 1-.969.983.976.976 0 0 1-.969-.983c0-.542.434-.982.969-.982z"/>
  </svg>
);

const WhatsAppIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TelegramIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const LineIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.365 9.863c.526 0 .958.426.958.95 0 .526-.432.95-.958.95s-.958-.424-.958-.95c0-.524.432-.95.958-.95zm-4.443 0c.526 0 .958.426.958.95 0 .526-.432.95-.958.95s-.958-.424-.958-.95c0-.524.432-.95.958-.95zm-5.076 0c.526 0 .958.426.958.95 0 .526-.432.95-.958.95s-.958-.424-.958-.95c0-.524.432-.95.958-.95zm-4.443 0c.526 0 .958.426.958.95 0 .526-.432.95-.958.95s-.958-.424-.958-.95c0-.524.432-.95.958-.95zM22.848 9.48C22.848 5.552 17.856 2.4 12 2.4S1.152 5.552 1.152 9.48c0 3.494 4.06 6.422 9.54 7.058.372.08.878.244 1.006.56.116.288.076.742.036 1.034 0 0-.132.81-.162.984-.05.288-.232 1.128.996.616 1.228-.512 6.592-3.866 8.998-6.622.75-.852 1.096-1.704 1.096-2.658v-.602zm-18.648-.24h.48v2.832h-.48V9.24zm2.214 0h.456v2.448h1.332v.384H6.414V9.24zm3.234 0h.48v2.832h-.48V9.24zm2.118 0h.498l.75 2.082.756-2.082h.498l-1.026 2.832h-.462L11.766 9.24zm3.294 0h1.854v.384h-1.374v.84h1.23v.384h-1.23v.84h1.374v.384h-1.854V9.24zm2.58 0h.48v2.448h1.332v.384h-1.812V9.24z"/>
  </svg>
);

const MessengerIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
  </svg>
);

// 支持的社交工具类型
export const SOCIAL_CONTACT_TYPES: SocialContactType[] = [
  {
    id: 'wechat',
    name: 'WeChat',
    displayName: '微信',
    icon: '💬',
    iconSvg: <WeChatIcon />,
    color: '#07C160',
    placeholder: '请输入您的微信号'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    displayName: 'WhatsApp',
    icon: '📱',
    iconSvg: <WhatsAppIcon />,
    color: '#25D366',
    placeholder: '请输入您的WhatsApp号码（包含国家代码）'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    displayName: 'Telegram',
    icon: '✈️',
    iconSvg: <TelegramIcon />,
    color: '#0088cc',
    placeholder: '请输入您的Telegram用户名'
  },
  {
    id: 'line',
    name: 'LINE',
    displayName: 'LINE',
    icon: '🟢',
    iconSvg: <LineIcon />,
    color: '#06C755',
    placeholder: '请输入您的LINE ID'
  },
  {
    id: 'messenger',
    name: 'Messenger',
    displayName: 'Messenger',
    icon: '💬',
    iconSvg: <MessengerIcon />,
    color: '#0099FF',
    placeholder: '请输入您的Messenger用户名'
  }
];

// 根据ID获取社交工具类型
export function getSocialContactTypeById(id: string): SocialContactType | undefined {
  return SOCIAL_CONTACT_TYPES.find(type => type.id === id);
}

// 验证社交联系方式
export function validateSocialContact(type: string, value: string): { valid: boolean; error?: string } {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return { valid: false, error: '联系方式不能为空' };
  }

  switch (type) {
    case 'wechat':
      // 微信号：6-20字符，支持字母、数字、下划线和减号
      if (!/^[a-zA-Z0-9_-]{6,20}$/.test(trimmedValue)) {
        return { valid: false, error: '微信号格式不正确，应为6-20位字符' };
      }
      break;

    case 'whatsapp':
      // WhatsApp号码：包含国家代码，数字，可选+号，10-15位数字
      if (!/^[\+]?[0-9]{10,15}$/.test(trimmedValue.replace(/\s/g, ''))) {
        return { valid: false, error: 'WhatsApp号码格式不正确，应为10-15位数字' };
      }
      break;

    case 'line':
      // LINE ID：字母、数字、下划线、点、减号，4-30字符
      if (!/^[a-zA-Z0-9_.-]{4,30}$/.test(trimmedValue)) {
        return { valid: false, error: 'LINE ID格式不正确，应为4-30位字符' };
      }
      break;

    case 'telegram':
      // Telegram用户名：以@开头或直接用户名，5-32字符
      if (!/^@?[a-zA-Z0-9_]{5,32}$/.test(trimmedValue)) {
        return { valid: false, error: 'Telegram用户名格式不正确，应为5-32位字符' };
      }
      break;

    case 'messenger':
      // Messenger用户名：字母、数字、点、减号，5-50字符
      if (!/^[a-zA-Z0-9.-]{5,50}$/.test(trimmedValue)) {
        return { valid: false, error: 'Messenger用户名格式不正确，应为5-50位字符' };
      }
      break;

    default:
      return { valid: false, error: '不支持的社交工具类型' };
  }

  return { valid: true };
}

// 格式化社交联系方式用于显示
export function formatSocialContact(type: string, value: string): string {
  const contactType = getSocialContactTypeById(type);
  if (!contactType) return value;

  switch (type) {
    case 'telegram':
      return value.startsWith('@') ? value : `@${value}`;
    case 'whatsapp':
      // 格式化WhatsApp号码，添加空格
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length >= 11) {
        return `+${cleaned.slice(0, cleaned.length - 10)} ${cleaned.slice(-10)}`;
      }
      return value;
    default:
      return value;
  }
}

// 打开社交工具聊天
export function openSocialChat(type: string, value: string): void {
  let url = '';

  switch (type) {
    case 'wechat':
      // 微信：复制微信号，打开网页版让用户扫码
      if (navigator.clipboard) {
        navigator.clipboard.writeText(value);
      }
      showToastCallback?.('微信号已复制，请在网页版微信中登录后搜索添加', 'success');
      // 打开微信网页版
      url = 'https://wx.qq.com';
      break;

    case 'whatsapp':
      // WhatsApp：有网页版，可以直接打开聊天
      const whatsappNumber = value.replace(/\D/g, '');
      showToastCallback?.('正在打开 WhatsApp...', 'info');
      url = `https://wa.me/${whatsappNumber}`;
      break;

    case 'line':
      // LINE：有网页版
      showToastCallback?.('正在打开 LINE...', 'info');
      url = `https://line.me/ti/p/~${value}`;
      break;

    case 'telegram':
      // Telegram：有网页版，可以直接打开聊天
      const telegramUsername = value.replace('@', '');
      showToastCallback?.('正在打开 Telegram...', 'info');
      url = `https://t.me/${telegramUsername}`;
      break;

    case 'messenger':
      // Messenger：有网页版，可以直接打开聊天
      showToastCallback?.('正在打开 Messenger...', 'info');
      url = `https://m.me/${value}`;
      break;

    default:
      return;
  }

  if (url) {
    window.open(url, '_blank');
  }
}

// 判断是否可以在浏览器中直接打开聊天或提供辅助功能
export function canOpenInBrowser(type: string): boolean {
  // 微信有网页版，其他平台也有网页版聊天
  return ['whatsapp', 'telegram', 'messenger', 'line', 'wechat'].includes(type);
}

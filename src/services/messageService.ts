// 消息服务 API
import { getToken } from './authService';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export type MessageFolder = 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive' | 'instantMessaging' | 'settings';
export type MessageType = 'inquiry' | 'reply' | 'system';
export type MessageStatus = 'pending' | 'sent' | 'received' | 'completed';
export type MessageTab = MessageFolder;

// 翻译结果类型（支持字符串或对象格式）
export interface TranslationResult {
  title?: string;
  content: string;
}

export interface Message {
  id: string;
  user_id: string;
  type: MessageType;
  folder: MessageFolder;
  title: string;
  content: string;
  preview?: string;
  time?: string;
  
  // 翻译相关
  language?: string;  // 消息发送者的语言
  translations?: Record<string, string | TranslationResult>;  // 翻译缓存（key: 语言代码, value: 翻译内容或对象）
  
  // 发送者信息
  sender_id?: string;
  sender_name?: string;
  sender_address?: string;
  senderAddress?: string; // 兼容性别名
  sender?: string; // 兼容性别名（显示用）
  sender_internal_email?: string; // 发送者内网邮箱
  sender_registered_user_id?: string; // 外网发件人匹配的站内用户ID
  sender_registered_user_name?: string; // 站内用户名称
  is_im_contact?: boolean; // 是否已经是即时通讯联系人
  
  // 接收者信息
  recipient_id?: string;
  recipient_name?: string;
  recipient_address?: string;
  recipientAddress?: string; // 兼容性别名
  recipient?: string; // 兼容性别名（显示用）
  
  // 产品信息
  product_id?: string;
  product_name?: string;
  productName?: string; // 兼容性别名
  cas?: string;
  quantity?: string;
  
  // 状态
  status: MessageStatus;
  unread: boolean;
  starred: boolean;
  deleted: boolean;
  archived: boolean;
  selected?: boolean; // 前端用于批量选择
  
  // 回复信息
  reply_content?: string;
  replyContent?: string; // 兼容性别名
  reply_from?: string;
  replyFrom?: string; // 兼容性别名
  reply_address?: string;
  replyAddress?: string; // 兼容性别名
  reply_contact?: any;
  replyContact?: any; // 兼容性别名

  // 附件
  attachments?: MessageAttachment[];

  // 时间戳
  auto_saved_at?: string;
  created_at: string;
  createdAt?: string; // 兼容性别名
  sent_at?: string;
  read_at?: string;
}

export interface MessageAttachment {
  key: string;
  url: string;
  name: string;
  type: string;
  size: number;
}

export interface MessageListResponse {
  messages: Message[];
  unreadCount: number;
  total: number;
}

// 获取认证 token（使用 authService 统一管理）
const getAuthToken = () => {
  return getToken();
};

// API 请求辅助函数
const apiRequest = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getAuthToken();
  // 如果 API_BASE_URL 不为空，则拼接；否则直接使用 endpoint
  const url = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    // 对于 401 错误，提示用户重新登录
    if (response.status === 401) {
      // 清除过期的 token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_user_role');
      }
      throw new Error('Unauthorized - Please sign in again');
    }
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
};

// ==================== 消息 API ====================

// 获取消息列表
export const getMessages = async (
  params: {
    folder?: MessageFolder;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<MessageListResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.folder) queryParams.append('folder', params.folder);
  if (params.search) queryParams.append('search', params.search);
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.offset) queryParams.append('offset', params.offset.toString());

  return apiRequest(`/api/messages?${queryParams}`);
};

// 获取单个消息详情
export const getMessage = async (id: string): Promise<Message> => {
  return apiRequest(`/api/messages/${id}`);
};

// 创建新消息
export const createMessage = async (data: Partial<Message>): Promise<Message> => {
  return apiRequest('/api/messages', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 保存/更新草稿（自动保存或手动保存）
export const saveDraft = async (data: {
  id?: string;
  title?: string;
  content?: string;
  recipient_address?: string;
  product_name?: string;
  cas?: string;
  quantity?: string;
}): Promise<Message> => {
  return apiRequest('/api/messages/draft', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// 发送消息
export const sendMessage = async (id: string): Promise<Message> => {
  return apiRequest(`/api/messages/${id}/send`, {
    method: 'POST',
  });
};

// 上传消息附件
export const uploadMessageAttachment = async (file: File): Promise<{ success: boolean; file: MessageAttachment }> => {
  const formData = new FormData();
  formData.append('file', file);

  const token = getAuthToken();
  const url = API_BASE_URL ? `${API_BASE_URL}/api/messages/upload` : '/api/messages/upload';

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      // 不设置 Content-Type，让浏览器自动设置 multipart/form-data boundary
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Upload failed' }));
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
};

// 获取上传配置
export const getUploadConfig = async (): Promise<{
  success: boolean;
  config: {
    maxSize: number;
    maxSizeMB: string;
    allowedTypes: string[];
  };
}> => {
  const url = API_BASE_URL ? `${API_BASE_URL}/api/messages/upload` : '/api/messages/upload';
  return fetch(url).then(res => res.json());
};

// 删除消息
export const deleteMessage = async (id: string): Promise<{ success: boolean; message: string }> => {
  return apiRequest(`/api/messages/${id}`, {
    method: 'DELETE',
  });
};

// 星标/取消星标
export const starMessage = async (id: string, starred: boolean): Promise<Message> => {
  return apiRequest(`/api/messages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ starred }),
  });
};

// 批量操作
export const batchMessages = async (
  ids: string[],
  action: 'delete' | 'archive' | 'mark_read' | 'star'
): Promise<{ success: boolean }> => {
  return apiRequest('/api/messages/batch', {
    method: 'POST',
    body: JSON.stringify({ ids, action }),
  });
};

// 获取未读数量
export const getUnreadCount = async (folder?: string): Promise<{ unreadCount: number }> => {
  let url = '/api/messages/unread/count';
  if (folder) {
    url += `?folder=${folder}`;
  }
  return apiRequest(url);
};

// ==================== 工具函数 ====================

// 格式化消息地址
export const formatMessageAddress = (username: string): string => {
  return `${username}@msg.chemicaloop.com`;
};

// 验证消息地址
export const validateMessageAddress = (address: string): boolean => {
  const regex = /^[a-zA-Z0-9._-]+@msg\.chemicaloop\.com$/;
  return regex.test(address);
};

// 从消息地址提取用户名
export const extractUsernameFromAddress = (address: string): string | null => {
  if (!validateMessageAddress(address)) {
    return null;
  }
  return address.replace('@msg.chemicaloop.com', '');
};

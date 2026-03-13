'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Header from '@/components/layout/Header';
import AuthModal from '@/components/auth/AuthModal';
import ComposeMessage from '@/components/messaging/ComposeMessage';
import IMContactButtons from '@/components/user/IMContactButtons';
import { useAuth } from '@/hooks/useAuth';
import { getToken } from '@/services/authService';
import EmailSettingsContent from './email-settings-content';
import {
  Inbox,
  Send,
  FileText,
  Trash2,
  Bell,
  MessageSquare,
  ArrowLeft,
  ArrowUpFromLine,
  Search,
  Archive,
  Settings,
  RefreshCw,
  MoreVertical,
  CheckSquare,
  Square,
  Reply,
  ReplyAll,
  Edit3,
  X,
  AtSign,
  User,
  Lock,
  ClipboardList,
  CheckCircle,
  Languages,
  ChevronDown,
  ChevronRight,
  Users,
  Plus,
  MessageCircle,
  Copy,
  Mail,
  Server,
  Shield,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  Edit2,
  Paperclip,
  Loader2,
  Sparkles,
  Check,
  Building,
  Briefcase,
  MapPin,
  Globe,
  Phone,
} from 'lucide-react';
import {
  formatMessageAddress,
  validateMessageAddress,
  Message,
  MessageAttachment,
  MessageTab,
  TranslationResult,
  getMessages,
  createMessage,
  saveDraft,
  sendMessage as apiSendMessage,
  deleteMessage as apiDeleteMessage,
  starMessage,
  uploadMessageAttachment,
  getUploadConfig
} from '@/services/messageService';
import { SOCIAL_CONTACT_TYPES, formatSocialContact, openSocialChat, canOpenInBrowser, setToastCallback } from '@/services/socialContactService';
import { useDialog } from '@/components/ui/DialogContext';

export default function MessagesPage() {
  const t = useTranslations('messages');
  const tCommon = useTranslations('common');
  const { toast, confirm: confirmDialog } = useDialog();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 格式化日期时间
  const formatDateTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      // 格式化为 YYYY-MM-DD HH:MM
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  };

  // 设置社交聊天 toast 回调
  useEffect(() => {
    setToastCallback((message, type) => {
      toast[type](message);
    });
  }, [toast]);

  // 从 pathname 中提取语言（验证有效性）
  const validLocales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'];
  const pathParts = pathname.split('/');
  const rawLocale = pathParts[1] || 'en';
  const locale = validLocales.includes(rawLocale) ? rawLocale : 'en';

  // 从 URL 参数读取初始文件夹（支持从用户中心跳转）
  const initialFolder = searchParams.get('folder') as MessageTab;
  // 默认显示收件箱（合并了站内消息）
  const [activeTab, setActiveTab] = useState<MessageTab>(initialFolder || 'inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [selectAll, setSelectAll] = useState(false);

  // 翻译状态（已移除翻译功能，保留接口兼容性）
  const [translatedTitle, setTranslatedTitle] = useState<string>('');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [translationProgress, setTranslationProgress] = useState(0);

  // 撰写消息状态
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeCc, setComposeCc] = useState('');
  const [composeBcc, setComposeBcc] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeContent, setComposeContent] = useState('');
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [lastAutoSave, setLastAutoSave] = useState<number>(0);
  const [showCcBcc, setShowCcBcc] = useState(false); // 是否显示抄送/密送输入框
  
  // 发件邮箱账户状态
  const [emailAccounts, setEmailAccounts] = useState<Array<{
    id: string;
    email: string;
    senderName: string;
    isDefault: boolean;
    isActive: boolean;
    displayName?: string;
  }>>([]);
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState<string | null>(null);
  
  // 即时通讯联系人状态
  const [imContactIds, setImContactIds] = useState<Set<string>>(new Set());
  
  // 联系人自动补全状态
  const [recentContacts, setRecentContacts] = useState<{address: string; name: string}[]>([]);
  const [showContactSuggestions, setShowContactSuggestions] = useState(false);
  const [selectedContactIndex, setSelectedContactIndex] = useState(0);
  const [contactInputFocused, setContactInputFocused] = useState(false);

  // 刷新/同步状态
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState('');

  // 模拟翻译进度（因为后端API是同步的，这里只是模拟效果）
  useEffect(() => {
    if (isTranslating) {
      setTranslationProgress(0);
      const interval = setInterval(() => {
        setTranslationProgress(prev => {
          if (prev >= 99) {
            clearInterval(interval);
            return 99;
          }
          // 每次增加2%，更加平滑
          return prev + 2;
        });
      }, 150); // 间隔150ms，让动画更流畅

      return () => clearInterval(interval);
    }
  }, [isTranslating]); // 只依赖 isTranslating，不依赖 translationProgress

  // 翻译完成后延迟隐藏
  useEffect(() => {
    if (translationProgress === 100) {
      const timer = setTimeout(() => {
        setTranslationProgress(101); // 设置为 101 表示可以隐藏
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [translationProgress]);

  // 获取即时通讯联系人列表（已移除，合并到 loadInitialData 中避免重复请求）
  
  // 初始加载优化：合并所有数据请求（只加载联系人和未读数量，消息由 loadMessages 处理）
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isLoggedIn || !user?.id) return;
      
      try {
        const token = getToken();
        
        // 并行加载联系人和未读数量
        const [countsRes, receivedRes, sentRes, membersRes] = await Promise.all([
          // 获取所有文件夹未读数
          fetch('/api/www/messages/unread/count', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          // 获取收到的联系人请求
          fetch('/api/www/contact-requests?role=receiver&status=pending', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          // 获取已发的联系人请求（只查pending）
          fetch('/api/www/contact-requests?role=requester&status=pending', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          // 获取联系人成员
          fetch('/api/www/contact-members', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);
        
        // 更新未读数量
        if (countsRes.ok) {
          const data = await countsRes.json();
          if (data.countsByFolder) {
            setTabCounts(data.countsByFolder);
          }
        }
        
        // 更新联系人数据
        if (receivedRes.ok) {
          const data = await receivedRes.json();
          setContactRequests(data.requests || []);
        }
        // 已发申请只显示pending状态
        if (sentRes.ok) {
          const data = await sentRes.json();
          setContactSentRequests(data.requests || []);
        }
        if (membersRes.ok) {
          const data = await membersRes.json();
          const members = data.data || data.members || [];
          setContactMembers(members);
          // 更新即时通讯联系人ID集合
          const contactIds = new Set<string>(
            members.map((m: any) => m.contact_user_id || m.contactUserId).filter(Boolean)
          );
          setImContactIds(contactIds);
        }
        
      } catch (error) {
        console.error('Failed to load initial data:', error);
      }
    };

    loadInitialData();
  }, [isLoggedIn, user?.id]); // 只在登录状态变化时触发一次

  // 从 API 加载消息数据
  useEffect(() => {
    const loadMessages = async () => {
      console.log('=== loadMessages called ===');
      console.log('Active tab:', activeTab);
      console.log('Search query:', searchQuery);

      // settings 不是消息文件夹，跳过加载
      if (activeTab === 'settings') {
        console.log('Skipping message load for settings tab');
        setMessages([]);
        return;
      }

      try {
        const data = await getMessages({
          folder: activeTab,
          search: searchQuery
        });
        console.log('API returned unreadCount:', data.unreadCount);
        console.log('API returned messages:', data.messages.length);
        console.log('[loadMessages] Message details:');
        data.messages.forEach((m, index) => {
          console.log(`  ${index}: id=${m.id}, title="${m.title}", language=${m.language}`);
        });

        setMessages(data.messages);

        // 更新当前标签页的数量（未读消息数量）
        setTabCounts(prev => {
          const newCounts = {
            ...prev,
            [activeTab]: data.unreadCount || 0
          };
          console.log('Previous tabCounts:', prev);
          console.log('New tabCounts:', newCounts);
          return newCounts;
        });
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    // 同步更新 URL 的查询参数（inbox 是默认值，不需要添加到 URL）
    const params = new URLSearchParams(searchParams.toString());
    if (activeTab !== 'inbox') {
      params.set('folder', activeTab);
    } else {
      params.delete('folder');
    }
    const newUrl = `${pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });

    loadMessages();
  }, [activeTab, searchQuery, pathname, router]); // 移除 searchParams 依赖，避免循环

  // 监听语言变化，重新翻译当前消息
  useEffect(() => {
    // 不要清空 selectedMessage，保留当前选中的消息
    // 清空翻译状态，准备重新翻译
    setTranslatedTitle('');
    setTranslatedContent('');
    setIsTranslating(false);
    setTranslationProgress(0);
    setShowOriginal(false);

    // 语言切换后，重新翻译当前选中的消息
    if (selectedMessage) {
      // 清空翻译标记，允许重新翻译
      autoTranslatedMessagesRef.current.delete(selectedMessage.id);
      // 延迟调用翻译
      setTimeout(() => {
        translateMessage(selectedMessage.id);
      }, 100);
    }
  }, [locale]);

  // 刷新/同步消息
  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    setRefreshProgress(0);
    
    try {
      if (activeTab === 'inbox' || activeTab === 'sent') {
        // Inbox/Sent: 同步所有已绑定的外部邮箱
        setRefreshStatus(t('refreshConnecting'));
        setRefreshProgress(10);
        
        // 模拟进度更新
        const progressInterval = setInterval(() => {
          setRefreshProgress(prev => {
            if (prev >= 90) return prev;
            return prev + 10;
          });
        }, 300);
        
        try {
          const token = getToken();
          const folder = activeTab === 'inbox' ? 'inbox' : 'sent';
          
          // 调用批量同步API
          const response = await fetch('/api/www/email-settings/sync-all', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ folder }),
          });
          
          clearInterval(progressInterval);
          
          const data = await response.json();
          if (data.success) {
            setRefreshProgress(95);
            setRefreshStatus(t('refreshSyncingMessages'));
            
            // 重新加载消息列表
            const messagesData = await getMessages({ folder: activeTab });
            setMessages(messagesData.messages);
            setTabCounts(prev => ({
              ...prev,
              [activeTab]: messagesData.unreadCount || 0
            }));
            
            setRefreshProgress(100);
            setRefreshStatus(t('refreshCompleted') + (data.accounts ? ` (${data.accounts.length} ${t('accounts')})` : ''));
          } else {
            throw new Error(data.error || 'Sync failed');
          }
        } catch (error: any) {
          clearInterval(progressInterval);
          console.error('Sync error:', error);
          setRefreshStatus(t('refreshFailed') + ': ' + (error.message || 'Unknown error'));
          setRefreshProgress(0);
        }
      } else if (activeTab === 'instantMessaging') {
        // IM: 刷新联系人数据
        setRefreshStatus(t('refreshLoadingContacts'));
        setRefreshProgress(20);
        
        // 加载联系人请求和成员
        const token = getToken();
        const [receivedRes, sentRes, membersRes] = await Promise.all([
          fetch('/api/www/contact-requests?role=receiver&status=pending', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/www/contact-requests?role=requester&status=pending', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('/api/www/contact-members', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);
        
        setRefreshProgress(60);
        
        if (receivedRes.ok) {
          const data = await receivedRes.json();
          setContactRequests(data.requests || []);
        }
        if (sentRes.ok) {
          const data = await sentRes.json();
          setContactSentRequests(data.requests || []);
        }
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setContactMembers(membersData.data || membersData.members || []);
        }
        
        setRefreshProgress(100);
        setRefreshStatus(t('refresh.completed'));
      } else {
        // 其他文件夹: 普通刷新
        setRefreshStatus(t('refreshLoading'));
        setRefreshProgress(30);
        
        const messagesData = await getMessages({ folder: activeTab });
        setMessages(messagesData.messages);
        setTabCounts(prev => ({
          ...prev,
          [activeTab]: messagesData.unreadCount || 0
        }));
        
        setRefreshProgress(100);
        setRefreshStatus(t('refresh.completed'));
      }
    } catch (error: any) {
      console.error('Refresh error:', error);
      setRefreshStatus(t('refreshFailed'));
      setRefreshProgress(0);
    } finally {
      // 2秒后清除状态
      setTimeout(() => {
        setIsRefreshing(false);
        setRefreshProgress(0);
        setRefreshStatus('');
      }, 2000);
    }
  };

  // 联系人请求对话框状态
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactRequestLoading, setContactRequestLoading] = useState(false);
  const [contactRequestMessage, setContactRequestMessage] = useState('');
  const [contactRequestStatus, setContactRequestStatus] = useState<Record<string, 'idle' | 'pending' | 'accepted' | 'rejected' | 'blocked'>>({});

  // 消息发送者的IM联系方式信息
  const [senderIMInfo, setSenderIMInfo] = useState<{
    hasIM: boolean;
    contacts: Array<{ type: string; value: string }>;
    loading: boolean;
  }>({ hasIM: false, contacts: [], loading: false });

  // 消息数据
  const [messages, setMessages] = useState<Message[]>([]);

  // 联系人数据
  const [contactRequests, setContactRequests] = useState<any[]>([]); // 收到的申请
  const [contactSentRequests, setContactSentRequests] = useState<any[]>([]); // 发出的申请
  const [contactMembers, setContactMembers] = useState<any[]>([]); // 我的联系人
  
  // 即时通讯子菜单状态
  const [contactExpanded, setContactExpanded] = useState(true); // 默认展开
  const [contactSubTab, setContactSubTab] = useState<'received' | 'sent' | 'contacts'>('contacts'); // 默认显示我的联系人
  
  // 收件箱子菜单状态
  const [inboxExpanded, setInboxExpanded] = useState(true); // 默认展开
  const [inboxSubTab, setInboxSubTab] = useState<'all' | 'unread' | 'read'>('all'); // 默认显示全部
  
  // 选中的联系人和详细资料
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [selectedContactProfile, setSelectedContactProfile] = useState<any>(null);
  const [loadingContactProfile, setLoadingContactProfile] = useState(false);
  const [contactSearchQuery, setContactSearchQuery] = useState(''); // 联系人搜索关键词

  // 过滤后的联系人列表
  const filteredContactMembers = contactMembers.filter(member => {
    if (!contactSearchQuery) return true;
    const query = contactSearchQuery.toLowerCase();
    return (
      member.userName?.toLowerCase().includes(query) ||
      member.userEmail?.toLowerCase().includes(query)
    );
  });

  // 各标签页消息数量
  const [tabCounts, setTabCounts] = useState<Record<MessageTab, number>>({
    inbox: 0,
    sent: 0,
    drafts: 0,
    trash: 0,
    archive: 0,
    instantMessaging: 0,
    settings: 0,
  });

  // 辅助函数：带认证的 fetch 请求
  const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const token = getToken();

    // 如果 token 已经包含 "Bearer " 前缀，则不再添加
    const authHeader = token?.startsWith('Bearer ')
      ? token
      : token
      ? `Bearer ${token}`
      : undefined;

    console.log('[authFetch] URL:', url);
    console.log('[authFetch] Token exists:', !!token);
    console.log('[authFetch] Auth header:', authHeader ? `${authHeader.substring(0, 30)}...` : 'none');

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
        ...options.headers,
      },
    });
  };

  // 追踪已处理的消息ID，避免重复触发
  const processedMessageIdRef = useRef<string | null>(null);

  // 处理URL参数，自动打开指定消息
  useEffect(() => {
    const messageId = searchParams.get('messageId');
    if (messageId && processedMessageIdRef.current !== messageId) {
      const message = messages.find(m => m.id === messageId);
      if (message) {
        processedMessageIdRef.current = messageId;
        setSelectedMessage(message);
        // 标记为已读
        setMessages(prev => prev.map(m =>
          m.id === messageId ? { ...m, unread: false } : m
        ));
      }
    }
  }, [searchParams, messages]);

  // 追踪已自动翻译的消息ID，避免重复触发
  const autoTranslatedMessagesRef = useRef<Set<string>>(new Set());
  
  // 追踪正在加载的消息ID，避免重复请求
  const loadingMessageRef = useRef<string | null>(null);
  
  // 追踪正在加载联系人状态的消息ID，避免重复请求
  // 追踪正在加载联系人状态的消息ID，避免重复请求
  const loadingContactRef = useRef<string | null>(null);
  // 追踪已完成加载的消息ID，避免同一消息重复加载
  const loadedContactRef = useRef<Set<string>>(new Set());

  // 当选中消息变化时，检查联系人请求状态
  useEffect(() => {
    // 使用消息ID作为依赖，避免对象引用变化导致的重复请求
    const messageId = selectedMessage?.id;
    if (!messageId) {
      setSenderIMInfo({ hasIM: false, contacts: [], loading: false });
      return;
    }
    
    // 如果已经加载过这条消息的联系人状态，跳过
    if (loadedContactRef.current.has(messageId)) {
      console.log('[Contact] Already loaded for message:', messageId);
      return;
    }
    
    // 如果正在加载这条消息，跳过
    if (loadingContactRef.current === messageId) {
      console.log('[Contact] Already loading for message:', messageId);
      return;
    }
    
    // 标记为正在加载
    loadingContactRef.current = messageId;
    // 标记为已加载（防止重复）
    loadedContactRef.current.add(messageId);
    
    loadContactRequestStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMessage?.id]);

  // 翻译消息内容（调用后端 API）
  // 新逻辑：所有消息都尝试翻译成用户目标语言，由后端智能判断是否需要翻译
  // - 后端会检测内容语言，如果已是目标语言则直接返回原文（节省 API 费用）
  // - 这样避免因 language 字段默认值或设置错误导致翻译遗漏
  const translateMessage = async (messageId: string) => {
    // 防止重复调用
    if (isTranslating) {
      console.log('[Translation] Already translating, skip');
      return;
    }

    // 防止同一消息重复翻译
    if (autoTranslatedMessagesRef.current.has(messageId)) {
      console.log('[Translation] Already translated this message, skip');
      return;
    }

    // 获取消息的翻译缓存
    const message = messages.find(m => m.id === messageId);
    if (!message) return;

    const translations = message.translations || {};

    console.log('[Translation] Start:', {
      messageId,
      locale,
      hasCache: !!translations[locale]
    });

    // 如果已经有翻译缓存，直接使用缓存
    if (translations[locale]) {
      console.log('[Translation] Using cached translation');
      if (typeof translations[locale] === 'object') {
        setTranslatedTitle(translations[locale].title || '');
        setTranslatedContent(translations[locale].content || '');
      } else {
        setTranslatedTitle('');
        setTranslatedContent(translations[locale]);
      }
      setShowOriginal(false);
      return;
    }

    // 标记为正在翻译
    autoTranslatedMessagesRef.current.add(messageId);
    setIsTranslating(true);
    setTranslationProgress(0);

    try {
      // 始终调用后端翻译 API
      // 后端会智能判断：如果内容已是目标语言，直接返回原文（不调用 LLM）
      console.log(`[Translation] Requesting translation for message ${messageId} to ${locale}`);
      const response = await authFetch(
        `/api/www/messages/${messageId}/translate?lang=${locale}`
      );

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      console.log(`[Translation] Received:`, { fromCache: data.fromCache, contentLength: data.translatedContent?.length });

      // 验证翻译结果
      if (!data.translatedContent || data.translatedContent.trim().length === 0) {
        throw new Error('Empty translation result');
      }

      setTranslatedTitle(data.translatedTitle || '');
      setTranslatedContent(data.translatedContent);
      setTranslationProgress(100);
      setShowOriginal(false);

      // 延迟更新消息列表（获取最新的缓存状态）
      setTimeout(async () => {
        try {
          const updatedData = await getMessages({ folder: activeTab });
          setMessages(updatedData.messages);

          if (selectedMessage?.id === messageId) {
            const updatedMessage = updatedData.messages.find(m => m.id === messageId);
            if (updatedMessage) {
              setSelectedMessage(updatedMessage);
            }
          }
        } catch (error) {
          console.error('Failed to reload messages:', error);
        }
      }, 100);

    } catch (error) {
      console.error('[Translation] Error:', error);
      setTranslationProgress(100);
      // 翻译失败时显示原文
      setShowOriginal(true);
      // 移除标记，允许重试
      autoTranslatedMessagesRef.current.delete(messageId);
    } finally {
      setIsTranslating(false);
    }
  };

  // 旧的 useEffect 已被移除，翻译逻辑统一由 translateMessage 处理

  // 切换翻译/原文显示
  const toggleTranslation = () => {
    setShowOriginal(!showOriginal);
  };

  // 获取显示内容（原文或翻译）
  // 格式化内容（特别是中文排版优化）
  const formatContent = (content: string): string => {
    if (!content) return '';

    // 尝试解析 JSON 格式的内容
    // 检测内容是否看起来像 JSON 对象或数组
    const trimmedContent = content.trim();
    if (trimmedContent.startsWith('{') || trimmedContent.startsWith('[')) {
      try {
        const parsed = JSON.parse(content);
        console.log('[formatContent] Detected JSON content:', parsed);

        // 如果是对象，尝试提取可读的文本内容
        if (typeof parsed === 'object' && parsed !== null) {
          // 情况 1: 对象包含 title 和 content 字段
          if (parsed.title || parsed.content) {
            const title = parsed.title || '';
            const body = parsed.content || parsed.description || parsed.message || '';
            const fullText = title && body ? `${title}\n\n${body}` : (title || body);
            console.log('[formatContent] Extracted from object:', fullText.substring(0, 100));
            return formatContent(fullText); // 递归处理提取的文本
          }

          // 情况 2: 对象的其他字段
          const keys = Object.keys(parsed);
          if (keys.length > 0) {
            const textParts: string[] = [];
            keys.forEach(key => {
              const value = parsed[key];
              if (typeof value === 'string') {
                textParts.push(`${key}: ${value}`);
              } else if (typeof value === 'object' && value !== null) {
                textParts.push(`${key}: ${JSON.stringify(value)}`);
              }
            });
            const result = textParts.join('\n');
            console.log('[formatContent] Extracted from object keys:', result.substring(0, 100));
            return formatContent(result); // 递归处理
          }
        }

        // 如果是数组，连接所有字符串元素
        if (Array.isArray(parsed)) {
          const result = parsed
            .map(item => typeof item === 'string' ? item : JSON.stringify(item))
            .join('\n');
          console.log('[formatContent] Extracted from array:', result.substring(0, 100));
          return formatContent(result); // 递归处理
        }

        // 如果解析后是原始类型（字符串、数字），直接返回
        if (typeof parsed === 'string') {
          console.log('[formatContent] Parsed as string:', parsed.substring(0, 100));
          return formatContent(parsed); // 递归处理
        }
      } catch (e) {
        // JSON 解析失败，按普通文本处理
        console.log('[formatContent] JSON parse failed, treating as plain text:', e);
      }
    }

    // 检测是否是中文内容（包含中文字符）
    const hasChinese = /[\u4e00-\u9fa5]/.test(content);

    if (hasChinese) {
      // 对中文内容进行格式化
      let formatted = content;

      // 1. 规范化换行符（统一为 \n）
      formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      // 2. 去除行首和行尾的空格（但保留行内的空格）
      const lines = formatted.split('\n');
      formatted = lines.map(line => {
        // 保留行内的空格，只去除行首行尾的空格
        return line.trim();
      }).join('\n');

      // 3. 去除多个连续的空格，但保留单个空格
      formatted = formatted.replace(/[ \t]+/g, ' ');

      // 4. 处理多余的空行（超过 2 个连续空行缩减为 2 个）
      formatted = formatted.replace(/\n{3,}/g, '\n\n');

      return formatted;
    }

    // 非中文内容，也进行基本的格式化
    let formatted = content;

    // 规范化换行符
    formatted = formatted.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    // 去除行首行尾空格
    const lines = formatted.split('\n');
    formatted = lines.map(line => line.trim()).join('\n');

    // 处理多余空行
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    return formatted;
  };

  const getDisplayContent = (message: Message | null): string => {
    if (!message) {
      console.log('[getDisplayContent] Message is null');
      return '';
    }

    const translations = message.translations || {};

    console.log('[getDisplayContent]', {
      currentLocale: locale,
      showOriginal,
      hasTranslation: !!translations[locale],
      translatedContent: translatedContent ? 'exists' : 'empty',
      translationCache: translations[locale],
    });

    // 如果用户选择显示原文，返回原文
    if (showOriginal) {
      console.log('[getDisplayContent] Returning original (showOriginal)');
      return formatContent(message.content);
    }

    // 优先使用最新翻译（如果是当前选中的消息）
    if (selectedMessage?.id === message.id && translatedContent) {
      console.log('[getDisplayContent] Returning translated content (state):', translatedContent.substring(0, 50));
      return formatContent(translatedContent);
    }

    // 如果有缓存翻译，返回翻译
    if (translations[locale]) {
      // 兼容旧的缓存格式（字符串）和新的缓存格式（对象）
      if (typeof translations[locale] === 'object') {
        const content = translations[locale].content || message.content;
        console.log('[getDisplayContent] Returning cached translation (object):', content.substring(0, 50));
        return formatContent(content);
      }
      console.log('[getDisplayContent] Returning cached translation (string):', translations[locale].substring(0, 50));
      return formatContent(translations[locale]);
    }

    // 如果正在翻译当前选中的消息，返回原文
    if (isTranslating && selectedMessage?.id === message.id) {
      console.log('[getDisplayContent] Returning original (translating)');
      return formatContent(message.content);
    }

    // 默认返回原文
    console.log('[getDisplayContent] Returning original (default)');
    return formatContent(message.content);
  };

  // 获取显示标题（原文或翻译）
  // 注意：消息列表始终显示原文，翻译仅在详情页显示
  const getDisplayTitle = (message: Message | null): string => {
    if (!message) return '';

    const translations = message.translations || {};

    // 如果用户选择显示原文，返回原标题
    if (showOriginal) {
      return message.title;
    }

    // 优先使用最新翻译（如果是当前选中的消息）
    if (selectedMessage?.id === message.id && translatedTitle) {
      return translatedTitle;
    }

    // 如果有缓存翻译，返回翻译后的标题
    if (translations[locale]) {
      // 兼容旧的缓存格式（字符串）和新的缓存格式（对象）
      if (typeof translations[locale] === 'object') {
        return (translations[locale] as TranslationResult).title || message.title;
      }
      // 旧格式只有内容翻译，没有标题翻译，返回原标题
      return message.title;
    }

    // 如果正在翻译当前选中的消息，返回原标题
    if (isTranslating && selectedMessage?.id === message.id) {
      return message.title;
    }

    // 默认返回原标题
    return message.title;
  };

  // 筛选消息
  const filteredMessages = messages.filter((msg) => {
    const matchesSearch = searchQuery === '' ||
      msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (msg.productName && msg.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    // 收件箱子分类过滤（未读/已读）
    if (activeTab === 'inbox') {
      if (inboxSubTab === 'unread') {
        return msg.unread === true;
      } else if (inboxSubTab === 'read') {
        return msg.unread !== true;
      }
      // inboxSubTab === 'all' 时不过滤
    }

    return true;
  });

  // 标记已读
  const markAsRead = async (messageId: string) => {
    // 检查消息是否已读
    const message = messages.find(m => m.id === messageId);
    if (!message || !message.unread) {
      return; // 消息已读或不存在，无需处理
    }

    console.log('[markAsRead] Starting for message:', messageId);
    const token = getToken();
    console.log('[markAsRead] Token exists:', !!token);

    try {
      // 立即更新前端消息状态和未读数量（乐观更新）
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, unread: false } : msg
      ));
      setTabCounts(prev => ({
        ...prev,
        [activeTab]: Math.max(0, (prev[activeTab] || 0) - 1)
      }));
      console.log('[markAsRead] Optimistic update completed');

      // 异步调用 API 标记消息为已读
      console.log('[markAsRead] Calling API...');
      const response = await authFetch(`/api/www/messages/${messageId}/read`, {
        method: 'PATCH',
      });

      console.log('[markAsRead] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[markAsRead] API error:', errorText);
        throw new Error(`API call failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('[markAsRead] API response data:', data);

      // API 调用完成后，只通知 Header 组件刷新未读数量
      // 移除 getMessages 调用，避免与 Header 的 loadMessages 冲突
      console.log('[markAsRead] Dispatching header-refresh-messages event');
      window.dispatchEvent(new CustomEvent('header-refresh-messages'));
    } catch (error) {
      console.error('[markAsRead] Failed to mark message as read:', error);
      // 如果失败，恢复未读数量
      setTabCounts(prev => ({
        ...prev,
        [activeTab]: (prev[activeTab] || 0) + 1
      }));
      setMessages(prevMessages => prevMessages.map(msg =>
        msg.id === messageId ? { ...msg, unread: true } : msg
      ));
    }
  };

  // 标记星标
  const toggleStar = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const newStarredStatus = !message.starred;

      // 立即更新前端状态（优化用户体验）
      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, starred: newStarredStatus } : msg
      ));

      // 异步调用 API 更新数据库
      await starMessage(messageId, newStarredStatus);
    } catch (error) {
      console.error('Failed to toggle star status:', error);
      toast.error('Failed to update star status');
      // 失败时恢复原状态
      setMessages(messages.map(msg =>
        msg.id === messageId ? { ...msg, starred: selectedMessage?.starred || false } : msg
      ));
    }
  };

  // 切换选择
  const toggleSelect = (messageId: string) => {
    setMessages(messages.map(msg =>
      msg.id === messageId ? { ...msg, selected: !msg.selected } : msg
    ));
  };

  // 全选/取消全选
  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    setMessages(messages.map(msg => ({ ...msg, selected: !selectAll })));
  };

  // 刷新消息列表
  const refreshMessages = async () => {
    try {
      const data = await getMessages({
        folder: activeTab,
        search: searchQuery
      });
      setMessages(data.messages);
      setTabCounts(prev => ({
        ...prev,
        [activeTab]: data.unreadCount || 0
      }));
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  // 加载最近联系人
  const loadRecentContacts = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/www/messages/contacts/recent?limit=20', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setRecentContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Failed to load recent contacts:', error);
    }
  };

  // 加载邮箱账户列表
  const loadEmailAccounts = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/www/email-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const accounts = data.data.filter((acc: any) => acc.isActive);
          setEmailAccounts(accounts);
          // 设置默认邮箱
          const defaultAccount = accounts.find((acc: any) => acc.isDefault);
          if (defaultAccount) {
            setSelectedEmailAccountId(defaultAccount.id);
          } else if (accounts.length > 0) {
            setSelectedEmailAccountId(accounts[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
    }
  };

  // 筛选匹配的联系人
  const getFilteredContacts = () => {
    if (!composeTo) return recentContacts;
    const input = composeTo.toLowerCase();
    return recentContacts.filter(contact => 
      contact.address.toLowerCase().includes(input) || 
      contact.name.toLowerCase().includes(input)
    );
  };

  // 选择联系人
  const selectContact = (contact: {address: string; name: string}) => {
    setComposeTo(contact.address);
    setShowContactSuggestions(false);
    setSelectedContactIndex(0);
  };

  // 处理联系人输入键盘事件
  const handleContactKeyDown = (e: React.KeyboardEvent) => {
    const filtered = getFilteredContacts();
    
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0 && showContactSuggestions) {
        selectContact(filtered[selectedContactIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedContactIndex(prev => 
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedContactIndex(prev => 
        prev > 0 ? prev - 1 : filtered.length - 1
      );
    } else if (e.key === 'Escape') {
      setShowContactSuggestions(false);
    }
  };

  // 加载联系人成员
  const loadContactMembers = async () => {
    try {
      const response = await authFetch('/api/www/contact-members');
      if (response.ok) {
        const data = await response.json();
        setContactMembers(data.data || data.members || []);
      }
    } catch (error) {
      console.error('Failed to load contact members:', error);
    }
  };

  // 加载联系人请求
  const loadContactRequests = async () => {
    try {
      // 并行加载收到和已发的申请（只查pending状态）
      const [receivedRes, sentRes] = await Promise.all([
        authFetch('/api/www/contact-requests?role=receiver&status=pending'),
        authFetch('/api/www/contact-requests?role=requester&status=pending'),
      ]);
      
      if (receivedRes.ok) {
        const data = await receivedRes.json();
        setContactRequests(data.requests || []);
      }
      if (sentRes.ok) {
        const data = await sentRes.json();
        setContactSentRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load contact requests:', error);
    }
  };

  // 取消申请
  const handleCancelRequest = async (request: any) => {
    const confirmed = await confirmDialog({
      title: tCommon('confirmCancelRequest'),
      message: tCommon('cancelRequestDescription'),
      type: 'warning',
      confirmText: tCommon('confirm'),
      cancelText: tCommon('cancel'),
    });
    
    if (!confirmed) return;
    
    try {
      const token = getToken();
      const response = await fetch(`/api/contact-requests?id=${request.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const result = await response.json();
      if (response.ok) {
        setContactSentRequests(prev => prev.filter(r => r.id !== request.id));
        toast.success(t('requestCancelled') || 'Request cancelled');
      } else {
        toast.error(result.error || 'Failed to cancel request');
      }
    } catch (error) {
      console.error('Failed to cancel request:', error);
      toast.error('Failed to cancel request');
    }
  };

  // 复制联系方式
  const handleCopyContact = (value: string) => {
    navigator.clipboard.writeText(value);
    toast.success(t('copiedToClipboard') || 'Copied to clipboard');
  };

  // 加载联系人详细资料
  const loadContactProfile = async (userId: string) => {
    setLoadingContactProfile(true);
    try {
      const response = await authFetch(`/api/contact-members/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSelectedContactProfile(data.contact);
        }
      }
    } catch (error) {
      console.error('Failed to load contact profile:', error);
    } finally {
      setLoadingContactProfile(false);
    }
  };

  // 选择联系人
  const handleSelectContact = (contactUserId: string) => {
    setSelectedContactId(contactUserId);
    loadContactProfile(contactUserId);
  };

  // 移除联系人
  const handleRemoveMember = async (userId: string) => {
    const confirmed = await confirmDialog({
      title: t('removeContact'),
      message: t('confirmRemoveContact'),
      type: 'danger',
      confirmText: t('remove'),
      cancelText: t('cancel'),
    });
    
    if (!confirmed) return;

    try {
      const response = await authFetch(`/api/contact-members/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadContactMembers();
        toast.success(t('contactRemoved') || 'Contact removed');
      }
    } catch (error) {
      console.error('Failed to remove member:', error);
      toast.error('Failed to remove member');
    }
  };

  // 发起联系人请求
  const handleSendContactRequest = async () => {
    if (!user || !selectedMessage) {
      console.error('[Send Contact Request] Missing required data:', {
        user,
        selectedMessage
      });
      return;
    }

    // 获取接收者ID：优先使用 sender_id（站内信），其次使用 sender_registered_user_id（外网邮件但发件人是站内用户）
    const receiverId = selectedMessage.sender_id || selectedMessage.sender_registered_user_id;
    
    if (!receiverId) {
      console.error('[Send Contact Request] No receiver ID found:', {
        sender_id: selectedMessage.sender_id,
        sender_registered_user_id: selectedMessage.sender_registered_user_id
      });
      toast.error(t('cannotSendRequest') || 'Cannot send request to this user');
      return;
    }

    const userId = user.id;
    if (!userId) {
      console.error('[Send Contact Request] User ID not found:', user);
      toast.error(t('requestRejected') + '. ' + t('loginRequired'));
      return;
    }

    console.log('[Send Contact Request] User:', user);
    console.log('[Send Contact Request] User ID:', userId);
    console.log('[Send Contact Request] Selected message:', selectedMessage);
    console.log('[Send Contact Request] Receiver ID:', receiverId);

    try {
      setContactRequestLoading(true);

      const response = await authFetch('/api/www/contact-requests', {
        method: 'POST',
        body: JSON.stringify({
          requesterId: userId,
          receiverId: receiverId,
          messageId: selectedMessage.id,
          requestedContactIds: [],
          requesterSharedContacts: {},
          message: contactRequestMessage,
        }),
      });

      console.log('[Send Contact Request] Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[Send Contact Request] Success:', data);

        setContactRequestStatus(prev => ({
          ...prev,
          [selectedMessage.id]: 'pending'
        }));
        setShowContactDialog(false);
        setContactRequestMessage('');
        toast.success(t('requestSent') + '. ' + t('contactDescription'));
      } else {
        const data = await response.json();
        console.error('[Send Contact Request] Failed:', data);
        throw new Error(data.error || 'Failed to send contact request');
      }
    } catch (error: any) {
      console.error('[Send Contact Request] Error:', error);
      toast.error(error.message || t('requestRejected') + '. ' + t('requestRejected'));
    } finally {
      setContactRequestLoading(false);
    }
  };

  // 检查联系人请求状态 + 获取发送者IM信息
  const loadContactRequestStatus = async () => {
    if (!user || !selectedMessage) {
      setSenderIMInfo({ hasIM: false, contacts: [], loading: false });
      return;
    }

    // 获取发件人用户ID：
    // 1. 内网邮箱：使用 sender_id
    // 2. 外网邮件发件人是注册用户：使用 sender_registered_user_id
    const senderUserId = selectedMessage.sender_id || selectedMessage.sender_registered_user_id;
    const messageId = selectedMessage.id;

    // 防止重复请求：检查是否已经在加载这条消息的联系人状态
    if (loadingContactRef.current !== messageId) {
      console.log('[Contact] Skipping - ref mismatch:', loadingContactRef.current, 'vs', messageId);
      return;
    }

    // 调试日志：检查发送者是否为站内用户
    console.log('[Contact] Selected message sender info:', {
      messageId: selectedMessage.id,
      sender_id: selectedMessage.sender_id,
      sender_registered_user_id: selectedMessage.sender_registered_user_id,
      sender_name: selectedMessage.sender_name,
      sender_address: selectedMessage.sender_address,
      senderUserId: senderUserId,
      isInternalUser: !!selectedMessage.sender_id,
      isRegisteredUser: !!selectedMessage.sender_registered_user_id
    });

    if (!senderUserId) {
      setSenderIMInfo({ hasIM: false, contacts: [], loading: false });
      loadingContactRef.current = null; // 清除标记
      return;
    }

    // 开始加载发送者IM信息
    setSenderIMInfo(prev => ({ ...prev, loading: true }));

    try {
      // 并行获取联系人请求状态和发送者资料
      console.log('[Contact] Fetching profile for senderUserId:', senderUserId);
      const [requestResponse, profileResponse] = await Promise.all([
        authFetch(`/api/contact-requests?targetUserId=${senderUserId}&messageId=${messageId}`),
        authFetch(`/api/profile/${senderUserId}`)
      ]);
      console.log('[Contact] Profile response status:', profileResponse.status);

      // 处理联系人请求状态
      if (requestResponse.ok) {
        const data = await requestResponse.json();
        if (data.request) {
          setContactRequestStatus(prev => ({
            ...prev,
            [messageId]: data.request.status
          }));
        }
      }

      // 处理发送者IM信息
      if (profileResponse.ok) {
        const profileResponseData = await profileResponse.json();
        console.log('[Contact] Profile FULL data:', JSON.stringify(profileResponseData, null, 2));
        
        // 前端代理返回的数据结构是 { success: true, data: { hasIM, imContacts } }
        const profileData = profileResponseData.data || profileResponseData;
        console.log('[Contact] profileData.hasIM:', profileData.hasIM);
        console.log('[Contact] profileData.imContacts:', JSON.stringify(profileData.imContacts, null, 2));
        
        // 后端已经返回了 hasIM 和 imContacts 字段，直接使用
        const hasIM = profileData.hasIM === true;
        const contacts = Array.isArray(profileData.imContacts) ? profileData.imContacts : [];
        
        console.log('[Contact] Final hasIM:', hasIM, 'contacts:', contacts.length);
        setSenderIMInfo({
          hasIM,
          contacts,
          loading: false
        });
      } else {
        console.log('[Contact] Profile response not ok:', profileResponse.status);
        setSenderIMInfo({ hasIM: false, contacts: [], loading: false });
      }
    } catch (error) {
      console.error('Check contact request error:', error);
      setSenderIMInfo({ hasIM: false, contacts: [], loading: false });
    } finally {
      // 清除加载标记，允许下次加载
      loadingContactRef.current = null;
    }
  };

  // 切换Tab时加载数据（仅处理 instantMessaging 特殊情况，消息加载由 loadMessages useEffect 处理）
  useEffect(() => {
    if (activeTab === 'instantMessaging') {
      loadContactMembers();
      loadContactRequests();
    }
    // 注意：不需要在这里调用 refreshMessages()，因为 loadMessages useEffect 已经处理了消息加载
  }, [activeTab]);

  // 一键已读
  const markAllAsRead = async () => {
    try {
      const response = await authFetch('/api/www/messages/mark-all-read', {
        method: 'POST',
        body: JSON.stringify({ folder: activeTab }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      const result = await response.json();
      console.log(`Marked ${result.affected} messages as read`);

      // 刷新消息列表
      await refreshMessages();

      // 通知 Header 组件刷新未读数量
      window.dispatchEvent(new CustomEvent('header-refresh-messages'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error('Failed to mark all messages as read');
    }
  };

  // 归档消息
  const archiveMessage = async (messageId: string) => {
    try {
      await authFetch(`/api/www/messages/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ archived: true }),
      });

      // 归档成功后重新加载消息列表
      const data = await getMessages({ folder: activeTab });
      setMessages(data.messages);
      setTabCounts(prev => ({
        ...prev,
        [activeTab]: data.unreadCount || 0
      }));
      // 更新 archive 文件夹的数量
      const archiveData = await getMessages({ folder: 'archive' });
      setTabCounts(prev => ({
        ...prev,
        archive: archiveData.unreadCount || 0
      }));

      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
        setShowMobileDetail(false);
      }
    } catch (error) {
      console.error('Failed to archive message:', error);
    }
  };

  // 批量归档选中的消息
  const archiveSelectedMessages = async () => {
    const selectedIds = messages.filter(m => m.selected).map(m => m.id);
    if (selectedIds.length === 0) {
      toast.warning(t('pleaseSelectArchive') || 'Please select at least one message to archive');
      return;
    }
    
    for (const id of selectedIds) {
      await archiveMessage(id);
    }
    setSelectAll(false);
  };

  // 删除消息
  const deleteMessage = async (messageId: string) => {
    try {
      await apiDeleteMessage(messageId);
      // 删除成功后重新加载消息列表
      const data = await getMessages({ folder: activeTab });
      setMessages(data.messages);
      setTabCounts(prev => ({
        ...prev,
        [activeTab]: data.unreadCount || 0
      }));
      // 更新 trash 文件夹的数量
      const trashData = await getMessages({ folder: 'trash' });
      setTabCounts(prev => ({
        ...prev,
        trash: trashData.unreadCount || 0
      }));
      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
        setShowMobileDetail(false);
      }
      toast.success(t('messageDeleted') || 'Message deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete message:', error);
      toast.error(error.message || 'Failed to delete message');
    }
  };

  // 恢复消息
  const restoreMessage = async (messageId: string) => {
    try {
      // 根据消息类型决定恢复到哪个文件夹
      const targetFolder = selectedMessage?.sender_id === selectedMessage?.user_id ? 'sent' : 'inbox';
      
      // 调用恢复 API
      const response = await authFetch(`/api/www/messages/${messageId}/restore`, {
        method: 'POST',
        body: JSON.stringify({ folder: targetFolder }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to restore message');
      }

      // 恢复成功后重新加载消息列表
      const trashData = await getMessages({ folder: 'trash' });
      setMessages(trashData.messages);
      setTabCounts(prev => ({
        ...prev,
        trash: trashData.unreadCount || 0
      }));

      // 更新目标文件夹的数量
      const targetData = await getMessages({ folder: targetFolder as MessageTab });
      setTabCounts(prev => ({
        ...prev,
        [targetFolder as MessageTab]: targetData.unreadCount || 0
      }));

      if (selectedMessage?.id === messageId) {
        setSelectedMessage(null);
        setShowMobileDetail(false);
      }
      toast.success(t('messageRestored') || 'Message restored successfully!');
    } catch (error: any) {
      console.error('Failed to restore message:', error);
      toast.error(error.message || 'Failed to restore message');
    }
  };

  // 移动端：选择消息
  const handleSelectMessage = (message: Message) => {
    console.log(`[Message Select] Selected message ${message.id}, language: ${message.language || 'en'}`);
    setSelectedMessage(message);
    markAsRead(message.id);
    setShowMobileDetail(true);
    // 清空之前的翻译状态，避免显示其他消息的翻译
    setTranslatedTitle('');
    setTranslatedContent('');
    setTranslationProgress(0);
    setIsTranslating(false);
    setShowOriginal(false);
    // 自动翻译（使用纯后端缓存）
    translateMessage(message.id);
  };

  // PC端：选择消息
  const handlePcSelectMessage = (message: Message) => {
    console.log(`[Message Select] PC selected message ${message.id}, language: ${message.language || 'en'}`);
    setSelectedMessage(message);
    markAsRead(message.id);
    // 清空之前的翻译状态，避免显示其他消息的翻译
    setTranslatedTitle('');
    setTranslatedContent('');
    setTranslationProgress(0);
    setIsTranslating(false);
    setShowOriginal(false);
    // 自动翻译（使用纯后端缓存）
    translateMessage(message.id);
  };

  // 返回列表
  const handleBackToList = () => {
    setShowMobileDetail(false);
  };

  // 处理附件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      // 获取上传配置
      const configResponse = await getUploadConfig();
      if (!configResponse.success) {
        toast.error('Failed to get upload configuration');
        return;
      }

      const { maxSize, allowedTypes } = configResponse.config;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 验证文件类型
        if (!allowedTypes.includes(file.type)) {
          toast.warning(`File type ${file.type} is not allowed`);
          continue;
        }

        // 验证文件大小
        if (file.size > maxSize) {
          const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
          toast.warning(`File size exceeds limit of ${maxSizeMB}MB`);
          continue;
        }

        try {
          setUploading(true);
          setUploadProgress(Math.round(((i + 1) / files.length) * 100));

          const result = await uploadMessageAttachment(file);
          if (result.success) {
            setAttachments(prev => [...prev, result.file]);
          }
        } catch (error) {
          console.error('Upload failed:', error);
          toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 删除附件
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 发送消息（根据收件人地址自动判断站内/站外）
  const handleSendMessage = async () => {
    if (!composeTo || !composeSubject || !composeContent) {
      toast.warning(t('pleaseFillAllFields'));
      return;
    }

    // 判断是否为站内地址（格式：用户名@chemicaloop，无 .com 后缀）
    const isInternalAddress = (address: string): boolean => {
      return address.includes('@chemicaloop') && !address.includes('@chemicaloop.');
    };

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const validateEmailList = (list: string): { valid: boolean; emails: string[] } => {
      if (!list.trim()) return { valid: true, emails: [] };
      const emails = list.split(/[;,]/).map(e => e.trim()).filter(e => e);
      const allValid = emails.every(e => emailRegex.test(e));
      return { valid: allValid, emails };
    };

    const isInternal = isInternalAddress(composeTo);

    // 验证收件人地址
    if (isInternal) {
      // 站内消息：验证格式
      if (!validateMessageAddress(composeTo)) {
        toast.error(t('invalidInternalAddress'));
        return;
      }
      // 站内消息不支持CC/BCC（外网邮件功能）
      if (composeCc.trim() || composeBcc.trim()) {
        toast.error(t('internalNoCcBcc'));
        return;
      }
    } else {
      // 外网邮件：验证邮箱格式
      if (!emailRegex.test(composeTo)) {
        toast.error(t('invalidEmailAddress'));
        return;
      }
      // 验证CC和BCC
      const ccResult = validateEmailList(composeCc);
      const bccResult = validateEmailList(composeBcc);
      
      if (!ccResult.valid) {
        toast.error(t('invalidCcAddress'));
        return;
      }
      if (!bccResult.valid) {
        toast.error(t('invalidBccAddress'));
        return;
      }
    }

    try {
      if (isInternal) {
        // 发送站内消息
        if (currentDraftId) {
          await saveDraft({
            id: currentDraftId,
            recipient_address: composeTo,
            title: composeSubject,
            content: composeContent,
          });
          await apiSendMessage(currentDraftId);
        } else {
          const newMessage = await createMessage({
            type: 'inquiry',
            title: composeSubject,
            content: composeContent,
            recipient_address: composeTo,
            attachments: attachments,
          });
          await apiSendMessage(newMessage.id);
        }

        // 重新加载消息列表
        const data = await getMessages({ folder: activeTab });
        setMessages(data.messages);
        setTabCounts(prev => ({
          ...prev,
          [activeTab]: data.unreadCount || 0
        }));

        setShowCompose(false);
        setComposeTo('');
        setComposeCc('');
        setComposeBcc('');
        setComposeSubject('');
        setComposeContent('');
        setAttachments([]);
        setReplyToMessage(null);
        setCurrentDraftId(null);
        setLastAutoSave(0);
        toast.success(t('inquirySentSuccess'));
      } else {
        // 发送外网邮件
        // 检查是否有可用的邮箱账户
        if (emailAccounts.length === 0) {
          toast.error(t('noEmailAccount'));
          return;
        }
        
        if (!selectedEmailAccountId) {
          toast.error(t('pleaseSelectEmailAccount'));
          return;
        }

        // 解析CC和BCC列表
        const ccEmails = composeCc.split(/[;,]/).map(e => e.trim()).filter(e => e);
        const bccEmails = composeBcc.split(/[;,]/).map(e => e.trim()).filter(e => e);

        try {
          const token = getToken();
          const response = await fetch('/api/www/email/send', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              emailAccountId: selectedEmailAccountId,
              to: composeTo,
              cc: ccEmails.length > 0 ? ccEmails : undefined,
              bcc: bccEmails.length > 0 ? bccEmails : undefined,
              subject: composeSubject,
              content: composeContent,
              attachments: attachments,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send email');
          }

          // 重新加载消息列表
          const data = await getMessages({ folder: activeTab });
          setMessages(data.messages);
          setTabCounts(prev => ({
            ...prev,
            [activeTab]: data.unreadCount || 0
          }));

          setShowCompose(false);
          setComposeTo('');
          setComposeCc('');
          setComposeBcc('');
          setComposeSubject('');
          setComposeContent('');
          setAttachments([]);
          setReplyToMessage(null);
          setCurrentDraftId(null);
          setLastAutoSave(0);
          toast.success(t('emailSentSuccess'));
        } catch (error: any) {
          console.error('Failed to send email:', error);
          toast.error(error.message || t('emailSentFailed'));
        }
      }
    } catch (error: any) {
      console.error('Failed to send message:', error);
      toast.error(error.message || t('sendFailed'));
    }
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    if (!composeContent) {
      toast.warning(t('pleaseFillAllFields'));
      return;
    }

    try {
      const draftData = {
        recipient_address: composeTo,
        title: composeSubject || '(No Subject)',
        content: composeContent,
      };

      if (currentDraftId) {
        // 更新现有草稿
        await saveDraft({
          id: currentDraftId,
          ...draftData,
        });
      } else {
        // 创建新草稿
        const newDraft = await saveDraft(draftData);
        setCurrentDraftId(newDraft.id);
      }
      
      toast.success(t('draftSavedSuccess') || 'Draft saved successfully!');
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      toast.error(error.message || 'Failed to save draft');
    }
  };

  const [isNavigating, setIsNavigating] = useState(false);

  // 回复消息
  const handleReply = () => {
    if (!selectedMessage || isNavigating) return;
    
    // 确保 locale 是有效的
    const validLocales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'];
    const safeLocale = validLocales.includes(locale) ? locale : 'en';
    
    // 添加防抖，避免重复跳转
    const replyUrl = `/${safeLocale}/messages/reply/${selectedMessage.id}`;
    if (typeof window !== 'undefined' && window.location.pathname === replyUrl) {
      console.log('[Handle Reply] Already on reply page, skipping');
      return;
    }
    console.log('[Handle Reply] Navigating to:', replyUrl, 'with selectedMessage:', selectedMessage.id);
    setIsNavigating(true);
    router.push(replyUrl);
  };

  // 获取标签页图标
  const getTabIcon = (tab: MessageTab) => {
    switch (tab) {
      case 'inbox':
        return Inbox;
      case 'sent':
        return Send;
      case 'drafts':
        return FileText;
      case 'trash':
        return Trash2;
      case 'archive':
        return Archive;
      case 'instantMessaging':
        return Users;
      case 'settings':
        return Settings;
      default:
        return Inbox;
    }
  };

  // 获取标签页标签
  const getTabLabel = (tab: MessageTab) => {
    const labels: Record<MessageTab, string> = {
      inbox: t('inbox'),
      sent: t('sent'),
      drafts: t('drafts'),
      trash: t('trash'),
      archive: t('archive'),
      instantMessaging: t('instantMessaging'),
      settings: t('settings'),
    };
    return labels[tab];
  };

  // 登录检查
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-100">
        <Header />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} locale={locale} />

        {/* Page Banner */}
        <section className="relative h-64 bg-gradient-to-r from-blue-900 to-blue-700 overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80')] bg-cover bg-center opacity-20" />
          <div className="relative h-full flex items-end justify-center px-4 pb-8">
            <div className="text-center text-white max-w-4xl">
              <h1 className="text-4xl md:text-5xl font-bold mb-3">
                {t('title')}
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                {t('description')}
              </p>
            </div>
          </div>
        </section>

        {/* {t('loginRequired')} */}
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {t('loginRequired')}
            </h2>
            <p className="text-gray-600 mb-8">
              {t('loginDescription')}
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <User className="h-5 w-5" />
              <span>{t('signIn')}</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              {t('backToHome')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // 如果用户未登录，显示登录提示
  if (!isLoggedIn && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Header />
        <div className="max-w-md mx-auto mt-20 px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('loginRequired')}</h2>
            <p className="text-gray-600 mb-6">{t('loginDescription')}</p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t('signIn')}
            </button>
          </div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} locale={locale} />
      </div>
    );
  }

  // 如果正在加载认证状态，显示加载提示
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">{tCommon('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header 在最顶部 */}
      <Header />

      {/* 刷新进度覆盖层 */}
      {isRefreshing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-80 max-w-[90vw]">
            <div className="flex items-center gap-3 mb-4">
              <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
              <span className="text-lg font-medium text-gray-900">{refreshStatus || t('refreshSyncing')}</span>
            </div>
            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${refreshProgress}%` }}
              />
            </div>
            <div className="mt-2 text-right text-sm text-gray-500">
              {refreshProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Page Banner 全屏宽 */}
      <section className="relative h-64 bg-gradient-to-r from-blue-900 to-blue-700 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative h-full flex items-end justify-center px-4 pb-8">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {t('title')}
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              {t('description')}
            </p>
          </div>
        </div>
      </section>

      {/* 主要内容区域：Sidebar + 右侧内容 */}
      <div className="flex flex-1 overflow-hidden relative h-[calc(100vh-256px)]">
        {/* 左侧边栏 - 固定 */}
        <div className={`w-64 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col overflow-hidden h-full ${showMobileDetail ? 'hidden lg:flex' : 'flex'}`}>
          {/* 新建按钮 */}
          <div className="p-3">
            <button
              onClick={async () => {
                setReplyToMessage(null);
                setComposeTo('');
                setComposeSubject('');
                setComposeContent('');
                setLastAutoSave(0);
                setCurrentDraftId(null);
                setAttachments([]);
                
                // 加载最近联系人和邮箱账户
                await Promise.all([
                  loadRecentContacts(),
                  loadEmailAccounts()
                ]);
                
                // 检查是否有草稿需要恢复
                try {
                  const draftsData = await getMessages({ folder: 'drafts', limit: 1 });
                  const drafts = draftsData.messages.filter(m => m.status === 'pending');
                  
                  if (drafts.length > 0) {
                    const latestDraft = drafts[0];
                    const confirmed = await confirmDialog({
                      title: t('restoreDraftTitle'),
                      message: `${t('restoreDraft')} ${latestDraft.time}?`,
                      type: 'info',
                      confirmText: t('restore'),
                      cancelText: t('cancel'),
                    });
                    
                    if (confirmed) {
                      setComposeTo(latestDraft.recipient_address || '');
                      setComposeSubject(latestDraft.title !== '(No Subject)' ? latestDraft.title : '');
                      setComposeContent(latestDraft.content !== '(No content)' ? latestDraft.content : '');
                      setCurrentDraftId(latestDraft.id);
                    }
                  }
                } catch (error) {
                  console.error('Failed to load drafts:', error);
                }
                
                setShowCompose(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Edit3 className="h-5 w-5" />
              <span>{t('newMessage')}</span>
            </button>
          </div>

          {/* 搜索框 */}
          <div className="px-3 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  // 如果当前不在邮件列表页面，切回到收件箱
                  if (activeTab === 'instantMessaging' || activeTab === 'settings') {
                    setActiveTab('inbox');
                    setSelectedMessage(null);
                    setShowMobileDetail(false);
                    setContactSubTab('received');
                  }
                }}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* 文件夹列表 */}
          <nav className="flex-1 overflow-y-auto">
            {/* 收件箱 - 可展开子菜单 */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => {
                  setInboxExpanded(!inboxExpanded);
                  setActiveTab('inbox');
                  setSelectedMessage(null);
                  setShowMobileDetail(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  activeTab === 'inbox'
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Inbox className={`h-5 w-5 ${activeTab === 'inbox' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{t('inbox')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {(tabCounts['inbox'] || 0) > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activeTab === 'inbox'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {tabCounts['inbox'] || 0}
                    </span>
                  )}
                  {inboxExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {/* 收件箱子菜单 */}
              {inboxExpanded && (
                <div className="bg-gray-50">
                  {/* 全部邮件 */}
                  <button
                    onClick={() => {
                      setActiveTab('inbox');
                      setInboxSubTab('all');
                      setSelectedMessage(null);
                      setShowMobileDetail(false);
                    }}
                    className={`w-full flex items-center justify-between pl-12 pr-4 py-2 text-left transition-colors ${
                      activeTab === 'inbox' && inboxSubTab === 'all'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{t('allMessages') || 'All Messages'}</span>
                    <span className="text-xs text-gray-500">{messages.filter(m => m.folder === 'inbox' && !m.deleted).length}</span>
                  </button>
                  
                  {/* 未读邮件 */}
                  <button
                    onClick={() => {
                      setActiveTab('inbox');
                      setInboxSubTab('unread');
                      setSelectedMessage(null);
                      setShowMobileDetail(false);
                    }}
                    className={`w-full flex items-center justify-between pl-12 pr-4 py-2 text-left transition-colors ${
                      activeTab === 'inbox' && inboxSubTab === 'unread'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{t('unreadMessages') || 'Unread'}</span>
                    {(tabCounts['inbox'] || 0) > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        {messages.filter(m => m.folder === 'inbox' && m.unread && !m.deleted).length}
                      </span>
                    )}
                  </button>
                  
                  {/* 已读邮件 */}
                  <button
                    onClick={() => {
                      setActiveTab('inbox');
                      setInboxSubTab('read');
                      setSelectedMessage(null);
                      setShowMobileDetail(false);
                    }}
                    className={`w-full flex items-center justify-between pl-12 pr-4 py-2 text-left transition-colors ${
                      activeTab === 'inbox' && inboxSubTab === 'read'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{t('readMessages') || 'Read'}</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* 其他文件夹 */}
            {(['sent', 'drafts', 'trash', 'archive'] as MessageTab[]).map((tab) => {
              const Icon = getTabIcon(tab);
              const count = tabCounts[tab] || 0;
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelectedMessage(null);
                    setShowMobileDetail(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{getTabLabel(tab)}</span>
                  </div>
                  {count > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
            
            {/* 即时通讯 - 可展开子菜单 */}
            <div className="border-b border-gray-100">
              <button
                onClick={() => {
                  setContactExpanded(!contactExpanded);
                  setActiveTab('instantMessaging');
                  setSelectedMessage(null);
                  setShowMobileDetail(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                  activeTab === 'instantMessaging'
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className={`h-5 w-5 ${activeTab === 'instantMessaging' ? 'text-blue-600' : 'text-gray-500'}`} />
                  <span className="text-sm font-medium">{t('instantMessaging')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {contactRequests.length > 0 && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      activeTab === 'instantMessaging'
                        ? 'bg-orange-500 text-white'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {contactRequests.length}
                    </span>
                  )}
                  {contactExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              </button>
              
              {/* 子菜单 */}
              {contactExpanded && (
                <div className="bg-gray-50">
                  {/* 收到申请 */}
                  <button
                    onClick={() => {
                      setActiveTab('instantMessaging');
                      setContactSubTab('received');
                      setSelectedMessage(null);
                      setShowMobileDetail(false);
                    }}
                    className={`w-full flex items-center justify-between pl-12 pr-4 py-2 text-left transition-colors ${
                      activeTab === 'instantMessaging' && contactSubTab === 'received'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{t('receivedRequests')}</span>
                    {contactRequests.length > 0 && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        {contactRequests.length}
                      </span>
                    )}
                  </button>
                  
                  {/* 已发申请 */}
                  <button
                    onClick={() => {
                      setActiveTab('instantMessaging');
                      setContactSubTab('sent');
                      setSelectedMessage(null);
                      setShowMobileDetail(false);
                    }}
                    className={`w-full flex items-center justify-between pl-12 pr-4 py-2 text-left transition-colors ${
                      activeTab === 'instantMessaging' && contactSubTab === 'sent'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{t('sentRequests')}</span>
                  </button>
                  
                  {/* 我的联系人 */}
                  <button
                    onClick={() => {
                      setActiveTab('instantMessaging');
                      setContactSubTab('contacts');
                      setSelectedMessage(null);
                      setShowMobileDetail(false);
                    }}
                    className={`w-full flex items-center justify-between pl-12 pr-4 py-2 text-left transition-colors ${
                      activeTab === 'instantMessaging' && contactSubTab === 'contacts'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="text-sm">{t('myContacts')}</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* 设置 */}
            <button
              onClick={() => {
                setActiveTab('settings');
                setSelectedMessage(null);
                setShowMobileDetail(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`h-5 w-5 ${activeTab === 'settings' ? 'text-blue-600' : 'text-gray-500'}`} />
                <span className="text-sm font-medium">{getTabLabel('settings')}</span>
              </div>
            </button>
          </nav>
        </div>

        {/* 右侧区域 */}
        {activeTab === 'settings' ? (
          /* Settings Tab - 邮箱绑定设置 - 独立滚动 */
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <EmailSettingsContent locale={locale} t={t} />
          </div>
        ) : (
          /* 消息列表和详情 */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 三栏布局区域 */}
            <div className="flex flex-1 overflow-hidden">
              <div className={`flex-1 bg-white border-r border-gray-200 flex flex-col min-w-0 ${showMobileDetail ? 'hidden lg:flex' : 'flex'}`}>
                {/* 工具栏 - 仅在普通邮件标签页显示 */}
                {activeTab !== 'instantMessaging' && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSelectAll}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title={t('selectAll')}
                      >
                        {selectAll ? <CheckSquare className="h-4 w-4 text-gray-600" /> : <Square className="h-4 w-4 text-gray-600" />}
                      </button>
                      {/* 刷新按钮 - 仅在 Inbox、Sent 中显示 */}
                      {(activeTab === 'inbox' || activeTab === 'sent') && (
                        <button
                          onClick={handleRefresh}
                          disabled={isRefreshing}
                          className={`p-2 rounded transition-colors ${isRefreshing ? 'bg-blue-50' : 'hover:bg-gray-200'}`}
                          title={isRefreshing ? refreshStatus : t('refresh')}
                        >
                          <RefreshCw className={`h-4 w-4 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={archiveSelectedMessages}
                        className="p-2 hover:bg-gray-200 rounded transition-colors"
                        title={t('archiveSelected')}
                      >
                        <Archive className="h-4 w-4 text-gray-600" />
                      </button>
                      <button
                        onClick={() => {
                          const selectedIds = messages.filter(m => m.selected).map(m => m.id);
                          if (selectedIds.length === 0) {
                            toast.warning(t('pleaseSelectDelete'));
                            return;
                          }
                          selectedIds.forEach(id => deleteMessage(id));
                          setSelectAll(false);
                        }}
                        className="p-2 hover:bg-red-50 rounded transition-colors text-gray-600 hover:text-red-600"
                        title={t('deleteSelected')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {/* 一键已读按钮 - 在收件箱标签页显示 */}
                      {activeTab === 'inbox' && (
                        <button
                          onClick={markAllAsRead}
                          className="p-2 hover:bg-green-50 rounded transition-colors text-gray-600 hover:text-green-600"
                          title={t('markAllAsRead')}
                        >
                          <CheckCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {filteredMessages.length} messages
                      </span>
                    </div>
                  </div>
                )}

                {/* 即时通讯 Tab 工具栏 - 显示联系人数量 */}
                {activeTab === 'instantMessaging' && (
                  <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center gap-2">
                      {contactSubTab === 'contacts' && (
                        <span className="text-sm text-gray-600">
                          {contactMembers.length} {t('contacts')}
                        </span>
                      )}
                      {contactSubTab === 'received' && (
                        <span className="text-sm text-gray-600">
                          {contactRequests.length} {t('pendingRequests')}
                        </span>
                      )}
                      {contactSubTab === 'sent' && (
                        <span className="text-sm text-gray-600">
                          {contactSentRequests.length} {t('sentRequests')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

          {/* 即时通讯 Tab - 即时通讯子菜单内容 */}
          {activeTab === 'instantMessaging' ? (
            <div className="flex-1 overflow-y-auto">
              {/* 根据子菜单显示不同内容 */}
              {contactSubTab === 'received' ? (
                /* 收到申请 */
                contactRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Inbox className="h-16 w-16 mb-4" />
                    <p className="text-sm">{t('noPendingRequests')}</p>
                    <p className="text-xs text-gray-500 mt-2 max-w-xs text-center">
                      Contact exchange requests from others will appear here
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {contactRequests.map((request) => {
                      const requesterName = request.user?.name || request.requesterName || 'Unknown';
                      const requesterEmail = request.user?.email || request.requesterEmail || '';
                      return (
                      <div
                        key={request.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {requesterName?.[0] || 'U'}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{requesterName}</h3>
                              <p className="text-sm text-gray-500">{requesterEmail}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                try {
                                  const token = getToken();
                                  const response = await fetch(`/api/contact-requests?id=${request.id}&action=accept`, {
                                    method: 'PUT',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                  });
                                  const result = await response.json();
                                  if (response.ok) {
                                    // 重新加载数据
                                    setContactRequests(prev => prev.filter(r => r.id !== request.id));
                                    // 刷新联系人列表
                                    const membersRes = await authFetch(`/api/contact-members`);
                                    if (membersRes.ok) {
                                      const data = await membersRes.json();
                                      setContactMembers(data.data || data.members || []);
                                    }
                                  } else {
                                    console.error('Accept failed:', result.error);
                                    toast.error(result.error || 'Failed to accept request');
                                  }
                                } catch (error) {
                                  console.error('Failed to accept request:', error);
                                  toast.error('Failed to accept request');
                                }
                              }}
                              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                            >
                              {t('accept')}
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  const token = getToken();
                                  const response = await fetch(`/api/contact-requests?id=${request.id}&action=reject`, {
                                    method: 'PUT',
                                    headers: { 'Authorization': `Bearer ${token}` },
                                  });
                                  const result = await response.json();
                                  if (response.ok) {
                                    setContactRequests(prev => prev.filter(r => r.id !== request.id));
                                  } else {
                                    console.error('Reject failed:', result.error);
                                    toast.error(result.error || 'Failed to reject request');
                                  }
                                } catch (error) {
                                  console.error('Failed to reject request:', error);
                                  toast.error('Failed to reject request');
                                }
                              }}
                              className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              {t('reject')}
                            </button>
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-2">{request.message}</p>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )
              ) : contactSubTab === 'sent' ? (
                /* 已发申请 */
                contactSentRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Send className="h-16 w-16 mb-4" />
                    <p className="text-sm">{t('noPendingRequests')}</p>
                    <p className="text-xs text-gray-500 mt-2 max-w-xs text-center">
                      Your sent contact exchange requests will appear here
                    </p>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {contactSentRequests.map((request) => {
                      const receiverName = request.user?.name || request.receiverName || 'Unknown';
                      const receiverEmail = request.user?.email || request.receiverEmail || '';
                      return (
                      <div
                        key={request.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {receiverName?.[0] || 'U'}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{receiverName}</h3>
                              <p className="text-sm text-gray-500">{receiverEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                              {t('requestPending')}
                            </span>
                            <button
                              onClick={() => handleCancelRequest(request)}
                              className="px-3 py-1 bg-red-100 text-red-600 text-xs rounded-lg hover:bg-red-200 transition-colors"
                            >
                              {t('cancel')}
                            </button>
                          </div>
                        </div>
                        {request.message && (
                          <p className="text-sm text-gray-600 mt-2">{request.message}</p>
                        )}
                      </div>
                    );
                    })}
                  </div>
                )
              ) : (
                /* 我的联系人 - 两栏布局 */
                contactMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    <Users className="h-16 w-16 mb-4" />
                    <p className="text-sm">{t('noContactMembers')}</p>
                    <p className="text-xs text-gray-500 mt-2 max-w-xs text-center">
                      Members who have accepted your contact requests will appear here
                    </p>
                  </div>
                ) : (
                  <div className="flex h-full">
                    {/* 左侧联系人列表 */}
                    <div className="w-1/3 border-r border-gray-200 flex flex-col">
                      {/* 搜索框 */}
                      <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder={t('searchContacts')}
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                          />
                          {contactSearchQuery && (
                            <button
                              onClick={() => setContactSearchQuery('')}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 联系人列表 */}
                      <div className="flex-1 overflow-y-auto">
                        {filteredContactMembers.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                            <Search className="h-10 w-10 mb-3" />
                            <p className="text-sm">{t('noContactsFound')}</p>
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {filteredContactMembers.map((member) => {
                              const isSelected = selectedContactId === member.contactUserId;
                              return (
                                <div
                                  key={member.id}
                                  onClick={() => handleSelectContact(member.contactUserId)}
                                  className={`p-4 cursor-pointer transition-colors ${
                                    isSelected
                                      ? 'bg-purple-50 border-l-4 border-l-purple-600'
                                      : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                      isSelected
                                        ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                                        : 'bg-gradient-to-br from-green-500 to-teal-600'
                                    }`}>
                                      {member.userName?.[0] || 'U'}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h3 className={`font-medium truncate ${
                                        isSelected ? 'text-purple-900' : 'text-gray-900'
                                      }`}>
                                        {member.userName}
                                      </h3>
                                      <p className="text-sm text-gray-500 truncate">{member.userEmail}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 右侧联系人详情卡片 */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                      {selectedContactId ? (
                        loadingContactProfile ? (
                          <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                          </div>
                        ) : selectedContactProfile ? (
                          <div className="p-6">
                            {/* 基本信息卡片 */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-semibold">
                                    {selectedContactProfile.name?.[0] || 'U'}
                                  </div>
                                  <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                      {selectedContactProfile.name}
                                    </h2>
                                    <p className="text-gray-500">{selectedContactProfile.email}</p>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveMember(selectedContactId)}
                                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title={t('removeFromContacts')}
                                >
                                  <X className="h-5 w-5" />
                                </button>
                              </div>
                            </div>

                            {/* 个人资料 */}
                            {selectedContactProfile.profile && (
                              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  Personal Profile
                                </h3>
                                <div className="space-y-3">
                                  {selectedContactProfile.profile.location && (
                                    <div className="flex items-start gap-3">
                                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Location</p>
                                        <p className="text-sm text-gray-900">{selectedContactProfile.profile.location}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedContactProfile.profile.description && (
                                    <div className="flex items-start gap-3">
                                      <FileText className="h-4 w-4 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Description</p>
                                        <p className="text-sm text-gray-900">{selectedContactProfile.profile.description}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedContactProfile.profile.website && (
                                    <div className="flex items-start gap-3">
                                      <Globe className="h-4 w-4 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Website</p>
                                        <a href={selectedContactProfile.profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline">{selectedContactProfile.profile.website}</a>
                                      </div>
                                    </div>
                                  )}
                                  {selectedContactProfile.profile.phone && (
                                    <div className="flex items-start gap-3">
                                      <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">Phone</p>
                                        <p className="text-sm text-gray-900">{selectedContactProfile.profile.phone}</p>
                                      </div>
                                    </div>
                                  )}
                                  {selectedContactProfile.profile.external_email && (
                                    <div className="flex items-start gap-3">
                                      <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                                      <div>
                                        <p className="text-xs text-gray-500">External Email</p>
                                        <p className="text-sm text-gray-900">{selectedContactProfile.profile.external_email}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* 社交联系方式 */}
                            {selectedContactProfile.socialContacts && Object.keys(selectedContactProfile.socialContacts).length > 0 && (
                              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                  <MessageCircle className="h-4 w-4" />
                                  Contact Methods
                                </h3>
                                <div className="space-y-3">
                                  {Object.entries(selectedContactProfile.socialContacts).map(([type, value]) => {
                                    if (type === 'platform' || !value) return null;
                                    const contactType = SOCIAL_CONTACT_TYPES.find(t => t.id === type);
                                    if (!contactType) return null;

                                    return (
                                      <div
                                        key={type}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                      >
                                        <div className="flex items-center gap-3">
                                          <div className="w-8 h-8 flex items-center justify-center" style={{ color: contactType.color }}>
                                            {contactType.iconSvg || <span className="text-xl">{contactType.icon}</span>}
                                          </div>
                                          <div>
                                            <p className="text-xs text-gray-500">{contactType.name}</p>
                                            <p className="text-sm text-gray-900">
                                              {formatSocialContact(type, value as string)}
                                            </p>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => handleCopyContact(value as string)}
                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                            title={t('copy')}
                                          >
                                            <Copy className="h-4 w-4" />
                                          </button>
                                          {canOpenInBrowser(type) && (
                                            <button
                                              onClick={() => openSocialChat(type, value as string)}
                                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-full hover:bg-purple-700 transition-colors"
                                              title={t('openChat')}
                                            >
                                              <MessageCircle className="h-3.5 w-3.5" />
                                              <span>{t('chat')}</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* 空状态 */}
                            {(!selectedContactProfile.profile || Object.keys(selectedContactProfile.profile).length === 0) &&
                              (!selectedContactProfile.socialContacts || Object.keys(selectedContactProfile.socialContacts).length === 0) && (
                              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                                <MessageCircle className="h-10 w-10 mx-auto mb-3 text-gray-300" />
                                <p className="text-sm">No additional contact information available</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <AlertCircle className="h-12 w-12 mb-3" />
                            <p className="text-sm">Failed to load contact details</p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                          <User className="h-12 w-12 mb-3" />
                          <p className="text-sm">Select a contact to view details</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            /* 普通消息列表 */
            <div className="flex-1 overflow-y-auto">
              {filteredMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageSquare className="h-16 w-16 mb-4" />
                  <p className="text-sm">{t('noMessagesFound')}</p>
                </div>
              ) : (
                <div>
                  {filteredMessages.map((message) => (
                  <div
                    key={message.id}
                    onClick={() => handlePcSelectMessage(message)}
                    className={`px-4 py-3 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedMessage?.id === message.id
                        ? 'bg-blue-50 border-l-4 border-l-blue-600'
                        : 'border-l-4 border-l-transparent'
                    } ${message.unread ? 'font-semibold' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={message.selected}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelect(message.id);
                        }}
                        className="mt-1 flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-sm text-gray-900 truncate flex-1 ${message.unread ? 'font-semibold' : 'font-normal'}`} lang={message.language || 'en'}>
                            {(message.sender_name === '系统通知' || message.sender_name === 'SYSTEM_NOTIFICATION') ? t('systemNotification') : (message.sender_name || message.sender || message.recipient || t('systemNotification'))}
                          </span>
                          <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                            {message.time}
                          </span>
                        </div>
                        {message.sender_address && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500 truncate">
                              {message.sender_address}
                            </span>
                            {/* 站内信/站外信标签 */}
                            {message.sender_address?.includes('@chemicaloop') ? (
                              <>
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700 flex-shrink-0">
                                  {t('internalMail')}
                                </span>
                                {/* 站内信显示即时通讯状态 */}
                                {imContactIds.has(message.sender_id || '') ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 flex-shrink-0">
                                    {t('imContact')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 flex-shrink-0">
                                    {t('notImContact')}
                                  </span>
                                )}
                              </>
                            ) : message.sender_registered_user_id ? (
                              <>
                                {/* 外网邮件但发件人是站内用户，显示即时通讯状态 */}
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 flex-shrink-0">
                                  {t('externalMail')}
                                </span>
                                {imContactIds.has(message.sender_registered_user_id) ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700 flex-shrink-0">
                                    {t('imContact')}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 flex-shrink-0">
                                    {t('notImContact')}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-orange-100 text-orange-700 flex-shrink-0">
                                {t('externalMail')}
                              </span>
                            )}
                          </div>
                        )}
                        <h3 className={`text-sm text-gray-900 truncate mb-0.5 ${message.unread ? 'font-semibold' : 'font-normal'}`} lang={message.language || 'en'}>
                          {message.title}
                        </h3>
                        <p className={`text-xs truncate ${message.unread ? 'text-gray-500 font-normal' : 'text-gray-400 font-normal'}`} lang={message.language || 'en'}>
                          {message.preview}
                        </p>
                        {/* 附件图标提示 */}
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <FileText className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {message.attachments.length} attachment{message.attachments.length > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
              </div>

              {/* 右侧消息详情 - 仅在非即时通讯 Tab 时显示 */}
              {activeTab !== 'instantMessaging' && (
                <div className={`flex-1 bg-white flex flex-col min-w-0 relative ${showMobileDetail ? 'block lg:hidden' : 'hidden lg:flex'}`}>
          {selectedMessage ? (
            <>
              {/* 翻译蒙层（翻译中显示） */}
              {isTranslating && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
                  {/* 环形进度条 */}
                  <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                    <svg className="w-24 h-24" viewBox="0 0 96 96">
                      {/* 背景圆 - 完整的灰色圆环 */}
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#e5e7eb"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                      />
                      {/* 进度圆 - 蓝色进度 */}
                      <circle
                        cx="48"
                        cy="48"
                        r="42"
                        stroke="#2563eb"
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray="263.89"
                        strokeDashoffset={263.89 - (263.89 * Math.min(translationProgress, 100)) / 100}
                        className="transition-all duration-300 ease-out"
                        transform="rotate(-90 48 48)"
                      />
                    </svg>
                    {/* 百分比显示在中心 */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-semibold text-blue-600">
                        {Math.min(translationProgress, 100)}%
                      </span>
                    </div>
                  </div>

                  {/* 翻译中文字 */}
                  <div className="text-center">
                    <p className="text-gray-700 text-lg font-medium mb-2">
                      {t('translating')}...
                    </p>
                    <p className="text-gray-500 text-sm">
                      {t('translatingMessage')}
                    </p>
                  </div>
                </div>
              )}

              {/* 详情工具栏 */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-gray-50">
                {showMobileDetail && (
                  <button
                    onClick={handleBackToList}
                    className="p-2 hover:bg-gray-200 rounded transition-colors lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                  </button>
                )}
                <div className="flex items-center gap-1 flex-1">
                  {activeTab === 'trash' ? (
                    // 已删除文件夹显示恢复按钮
                    <button
                      onClick={() => restoreMessage(selectedMessage.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      <ArrowUpFromLine className="h-4 w-4" />
                      <span>{t('restore')}</span>
                    </button>
                  ) : (
                    // 其他文件夹显示回复按钮
                    <>
                      <button
                        onClick={handleReply}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        <Reply className="h-4 w-4" />
                        <span>{t('reply')}</span>
                      </button>
                    </>
                  )}
                  <button
                    onClick={toggleTranslation}
                    disabled={isTranslating}
                    className={`flex items-center gap-1 px-3 py-1.5 text-white text-sm rounded transition-colors ${showOriginal ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-600 hover:bg-gray-700'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={showOriginal ? t('showOriginal') : t('translateToCurrentLanguage')}
                  >
                    <Languages className="h-4 w-4" />
                    <span>{showOriginal ? t('original') : t('translate')}</span>
                  </button>
                  {activeTab !== 'trash' && (
                    <button
                      onClick={() => deleteMessage(selectedMessage.id)}
                      className="p-2 rounded transition-colors text-gray-600 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  
                  {/* IM快捷按钮 - 靠右对齐 */}
                  {/* 统一处理：内网邮箱或外网邮件发件人是注册用户，且有IM联系方式 */}
                  {(selectedMessage.sender_id || selectedMessage.sender_registered_user_id) && senderIMInfo.hasIM && (
                    <div className="ml-auto flex items-center">
                      <IMContactButtons
                        contacts={senderIMInfo.contacts}
                        isContact={imContactIds.has((selectedMessage.sender_id || selectedMessage.sender_registered_user_id) as string)}
                        onRequestContact={() => {
                          // 设置默认打招呼信息
                          setContactRequestMessage(t('defaultGreetingMessage') || `Hi, I'd like to connect with you on Chemicaloop.`);
                          setShowContactDialog(true);
                        }}
                        size="sm"
                      />
                    </div>
                  )}
                  {/* 统一处理：内网邮箱或外网邮件发件人是注册用户，但没有IM联系方式，显示申请按钮 */}
                  {(selectedMessage.sender_id || selectedMessage.sender_registered_user_id) && !senderIMInfo.hasIM && !senderIMInfo.loading && (
                    <button
                      onClick={() => {
                        // 设置默认打招呼信息
                        setContactRequestMessage(t('defaultGreetingMessage') || `Hi, I'd like to connect with you on Chemicaloop.`);
                        setShowContactDialog(true);
                      }}
                      className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-full hover:bg-purple-700 transition-all duration-200 hover:shadow-lg hover:shadow-purple-200"
                    >
                      <Users className="h-4 w-4" />
                      <span>{t('addToContacts')}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 详情内容 */}
              <div className="flex-1 overflow-y-auto">
                {/* 消息头部 - Outlook 风格 */}
                <div className="p-6 border-b border-gray-200">
                  <h2 
                    className="text-xl font-semibold text-gray-900 mb-4" 
                    lang={!showOriginal && locale !== (selectedMessage.language || 'en') && (translatedTitle || (selectedMessage.translations && selectedMessage.translations[locale])) ? locale : (selectedMessage.language || 'en')}
                  >
                    {getDisplayTitle(selectedMessage)}
                  </h2>
                  
                  {/* 发件人信息 */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500">{t('from')}:</span>
                        <span className="text-sm font-medium text-gray-900" lang={selectedMessage.language || 'en'}>
                          {(selectedMessage.sender_name === '系统通知' || selectedMessage.sender_name === 'SYSTEM_NOTIFICATION') ? t('systemNotification') : (selectedMessage.sender_name || selectedMessage.sender || selectedMessage.recipient || t('systemNotification'))}
                        </span>
                        {selectedMessage.sender_address && (
                          <>
                            <span className="text-sm text-gray-400">&lt;</span>
                            <span className="text-sm text-gray-600">{selectedMessage.sender_address}</span>
                            <span className="text-sm text-gray-400">&gt;</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 收件人信息 */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-500">{t('to')}:</span>
                      <span className="text-sm text-gray-900">
                        {selectedMessage.recipient_name || selectedMessage.recipient || t('me')}
                      </span>
                      {(selectedMessage.recipient_address || selectedMessage.recipientAddress) && (
                        <>
                          <span className="text-sm text-gray-400">&lt;</span>
                          <span className="text-sm text-gray-600">{selectedMessage.recipient_address || selectedMessage.recipientAddress}</span>
                          <span className="text-sm text-gray-400">&gt;</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 时间信息 */}
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span>{t('date')}:</span>
                    <span>{formatDateTime(selectedMessage.createdAt || selectedMessage.created_at)}</span>
                  </div>
                </div>

                {/* 产品信息 */}
                {selectedMessage.productName && (
                  <div className="px-6 py-4 bg-blue-50 border-b border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">Product:</span>
                      <span className="text-sm text-gray-700">{selectedMessage.productName}</span>
                    </div>
                    <div className="flex gap-4 text-xs text-gray-500">
                      {selectedMessage.cas && (
                        <span>CAS: {selectedMessage.cas}</span>
                      )}
                      {selectedMessage.quantity && (
                        <span>Quantity: {selectedMessage.quantity}</span>
                      )}
                    </div>
                  </div>
                )}

                {/* 消息内容 */}
                <div className="p-6 relative">
                  <div className="whitespace-pre-wrap leading-relaxed text-sm text-gray-700 text-left break-words"
                       lang={!showOriginal && locale !== (selectedMessage.language || 'en') && (translatedContent || (selectedMessage.translations && selectedMessage.translations[locale])) ? locale : (selectedMessage.language || 'en')}
                       style={{
                         wordBreak: 'break-word',
                         overflowWrap: 'break-word'
                       }}>
                    {getDisplayContent(selectedMessage)}
                  </div>

                  {/* 附件显示 */}
                  {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200">
                      <div className="text-sm font-medium text-gray-700 mb-3">
                        Attachments ({selectedMessage.attachments.length})
                      </div>
                      <div className="space-y-2">
                        {selectedMessage.attachments.map((attachment, index) => (
                          <a
                            key={index}
                            href={attachment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-700 truncate">
                                  {attachment.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {(attachment.size / 1024).toFixed(1)} KB
                                </div>
                              </div>
                            </div>
                            <svg
                              className="h-5 w-5 text-gray-400 flex-shrink-0"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 回复信息 */}
                {selectedMessage.replyContent && (
                  <div className="px-6 py-4 border-t border-gray-200">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Reply from {selectedMessage.replyFrom}
                      </div>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {selectedMessage.replyContent}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                <p className="text-sm">{t('selectMessage')}</p>
              </div>
            </div>
          )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 新建消息弹窗 */}
        {showCompose && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <ComposeMessage
                mode="compose"
                locale={locale}
                userId={user?.id}
                defaultRecipient=""
                onSend={async (data) => {
                  // 发送消息
                  try {
                    const isInternal = data.isInternal;
                    
                    if (isInternal) {
                      // 站内消息
                      const newMessage = await createMessage({
                        type: 'inquiry',
                        title: data.subject,
                        content: data.content,
                        recipient_address: data.recipient,
                        attachments: data.attachments,
                      });
                      await apiSendMessage(newMessage.id);
                      toast.success(t('inquirySentSuccess'));
                    } else {
                      // 外网邮件
                      const token = getToken();
                      const response = await fetch('/api/www/email/send', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`,
                        },
                        body: JSON.stringify({
                          emailAccountId: data.emailAccountId,
                          to: data.recipient,
                          cc: data.cc,
                          bcc: data.bcc,
                          subject: data.subject,
                          content: data.content,
                          attachments: data.attachments,
                        }),
                      });

                      if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to send email');
                      }
                      toast.success(t('emailSentSuccess'));
                    }

                    setShowCompose(false);
                    // 刷新消息列表 - 重新加载当前标签页的消息
                    try {
                      const data = await getMessages({
                        folder: activeTab,
                        search: searchQuery
                      });
                      setMessages(data.messages);
                      setTabCounts(prev => ({
                        ...prev,
                        [activeTab]: data.unreadCount || 0
                      }));
                    } catch (e) {
                      console.error('Failed to refresh messages:', e);
                    }
                  } catch (error: any) {
                    console.error('Failed to send message:', error);
                    toast.error(error.message || t('sendFailed'));
                  }
                }}
                onSaveDraft={async (data) => {
                  try {
                    await saveDraft({
                      recipient_address: data.recipient,
                      title: data.subject,
                      content: data.content,
                    });
                    toast.success(t('draftSavedSuccess'));
                  } catch (error: any) {
                    console.error('Failed to save draft:', error);
                    toast.error(error.message || 'Failed to save draft');
                  }
                }}
                onCancel={() => setShowCompose(false)}
                t={t}
                inModal={true}
              />
            </div>
          </div>
        )}

        {/* 社交联系人交换请求确认对话框 */}
        {showContactDialog && selectedMessage && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-1/2 min-w-80 max-w-md">
              {/* 对话框头部 */}
              <div className="px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-purple-600" />
                    <h2 className="text-base font-semibold text-gray-900">{t('requestDialogTitle')}</h2>
                  </div>
                  <button
                    onClick={() => {
                      setShowContactDialog(false);
                      setContactRequestMessage('');
                    }}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* 对话框内容 */}
              <div className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 p-3 bg-purple-50 border border-purple-100 rounded-lg">
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">
                          {selectedMessage.sender_registered_user_name?.[0] || selectedMessage.sender_name?.[0] || selectedMessage.sender?.[0] || 'U'}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 text-sm">
                        {selectedMessage.sender_registered_user_name || selectedMessage.sender_name || selectedMessage.sender || 'Unknown'}
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5 truncate">
                        {selectedMessage.sender_internal_email || selectedMessage.sender_address || selectedMessage.sender || 'No email available'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="text-xs font-medium text-gray-700">{t('whatHappensNext')}:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{t('requestWillBeSent')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{t('ifAcceptedCanExchange')}</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-purple-600 mt-0.5">•</span>
                        <span>{t('contactsWillAppear')}</span>
                      </li>
                    </ul>
                  </div>

                  {/* 附言输入 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      {t('message')} ({t('optional')})
                    </label>
                    <textarea
                      value={contactRequestMessage}
                      onChange={(e) => setContactRequestMessage(e.target.value)}
                      placeholder={t('messagePlaceholder') || 'Add a message...'}
                      rows={2}
                      className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* 对话框底部 */}
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowContactDialog(false);
                    setContactRequestMessage('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSendContactRequest}
                  disabled={contactRequestLoading}
                  className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {contactRequestLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                      <span>{t('sending')}</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      <span>{t('sendRequest')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

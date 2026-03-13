'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getToken } from '@/services/authService';
import {
  Send,
  FileText,
  X,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Sparkles,
  Languages,
  Mail,
} from 'lucide-react';
import IMContactButtons from '@/components/user/IMContactButtons';

interface EmailAccount {
  id: string;
  email: string;
  senderName: string;
  isDefault: boolean;
  isActive: boolean;
}

interface OriginalMessage {
  id: string;
  title: string;
  content: string;
  // 发送者信息（支持多种字段名）
  sender?: string;
  sender_name?: string;
  senderName?: string;
  sender_address?: string;
  senderAddress?: string;
  sender_id?: string;
  // 接收者信息（支持多种字段名）
  recipient?: string;
  recipient_name?: string;
  recipientName?: string;
  recipient_address?: string;
  recipientAddress?: string;
  // 时间
  timestamp?: string;
  createdAt?: string;
  created_at?: string;
  language?: string;
  translations?: Record<string, { title: string; content: string }>;
  // 产品相关（用于AI上下文）
  product_name?: string;
  productName?: string;
  inquiry_id?: string;
  inquiryId?: string;
}

interface ComposeMessageProps {
  mode: 'compose' | 'reply';
  locale: string;
  userId?: string;
  
  // 回复模式专用
  originalMessage?: OriginalMessage | null;
  
  // 新建模式专用
  defaultRecipient?: string;
  
  // 回调
  onSend: (data: SendData) => Promise<void>;
  onSaveDraft?: (data: DraftData) => Promise<void>;
  onCancel?: () => void;
  
  // 翻译
  t: (key: string) => string;
  
  // 显示模式
  inModal?: boolean; // 如果为true，则不渲染最外层的卡片容器（由父组件提供）
}

interface SendData {
  recipient: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  content: string;
  attachments: any[];
  emailAccountId?: string;
  isInternal: boolean;
}

interface DraftData {
  recipient: string;
  subject: string;
  content: string;
}

export default function ComposeMessage({
  mode,
  locale,
  userId,
  originalMessage,
  defaultRecipient = '',
  onSend,
  onSaveDraft,
  onCancel,
  t,
  inModal = false,
}: ComposeMessageProps) {
  // 表单状态
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 邮箱账户状态
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [selectedEmailAccountId, setSelectedEmailAccountId] = useState<string>('');
  const [loadingEmailAccounts, setLoadingEmailAccounts] = useState(true);

  // 原始消息折叠
  const [showQuote, setShowQuote] = useState(true);

  // AI Assistant 状态
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [styleSelectionMode, setStyleSelectionMode] = useState(true);
  const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
  
  // 风格标签选择（可多选组合）
  const [selectedTags, setSelectedTags] = useState<string[]>(['formal', 'detailed', 'logic']);

  // 翻译状态
  const [showTranslation, setShowTranslation] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);

  // 语言列表
  const languageList = [
    { code: 'zh', nativeName: '中文', flag: '🇨🇳' },
    { code: 'en', nativeName: 'English', flag: '🇺🇸' },
    { code: 'ja', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'de', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'fr', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'es', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'pt', nativeName: 'Português', flag: '🇵🇹' },
    { code: 'ru', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', nativeName: 'العربية', flag: '🇸🇦' },
  ];

  // 加载邮箱账户
  useEffect(() => {
    const loadEmailAccounts = async () => {
      try {
        const token = getToken();
        if (!token) {
          setLoadingEmailAccounts(false);
          return;
        }

        const response = await fetch('/api/email-settings', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setEmailAccounts(data.data || []);
          // 设置默认邮箱
          const defaultAccount = data.data?.find((s: EmailAccount) => s.isDefault && s.isActive);
          if (defaultAccount) {
            setSelectedEmailAccountId(defaultAccount.id);
          }
        }
      } catch (error) {
        console.error('Failed to load email accounts:', error);
      } finally {
        setLoadingEmailAccounts(false);
      }
    };

    loadEmailAccounts();
  }, []);

  // 回复模式初始化
  useEffect(() => {
    if (mode === 'reply' && originalMessage) {
      // 兼容多种字段名格式
      const senderAddr = originalMessage.sender_address || originalMessage.senderAddress || originalMessage.sender || '';
      setRecipient(senderAddr);
      setSubject(originalMessage.title ? `Re: ${originalMessage.title}` : '');
    }
  }, [mode, originalMessage]);

  // 发送者IM信息状态
  const [senderIMInfo, setSenderIMInfo] = useState<{
    hasIM: boolean;
    contacts: Array<{ type: string; value: string }>;
    isContact: boolean;
  }>({ hasIM: false, contacts: [], isContact: false });

  // 回复模式下获取发送者的IM信息
  useEffect(() => {
    const loadSenderIMInfo = async () => {
      if (mode !== 'reply' || !originalMessage?.sender_id) {
        setSenderIMInfo({ hasIM: false, contacts: [], isContact: false });
        return;
      }

      try {
        const token = getToken();
        if (!token) return;

        // 并行获取发送者资料和联系人状态
        const [profileResponse, contactResponse] = await Promise.all([
          fetch(`/api/profile/${originalMessage.sender_id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch(`/api/contact-requests?targetUserId=${originalMessage.sender_id}`, {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        const contacts: Array<{ type: string; value: string }> = [];
        let isContact = false;

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.wechat) contacts.push({ type: 'wechat', value: profileData.wechat });
          if (profileData.whatsapp) contacts.push({ type: 'whatsapp', value: profileData.whatsapp });
          if (profileData.telegram) contacts.push({ type: 'telegram', value: profileData.telegram });
          if (profileData.line) contacts.push({ type: 'line', value: profileData.line });
          if (profileData.messenger) contacts.push({ type: 'messenger', value: profileData.messenger });
        }

        if (contactResponse.ok) {
          const contactData = await contactResponse.json();
          isContact = contactData.request?.status === 'accepted';
        }

        setSenderIMInfo({
          hasIM: contacts.length > 0,
          contacts,
          isContact,
        });
      } catch (error) {
        console.error('Failed to load sender IM info:', error);
      }
    };

    loadSenderIMInfo();
  }, [mode, originalMessage?.sender_id]);

  // 判断是否为站内地址
  const isInternalAddress = (address: string): boolean => {
    return address.includes('@chemicalloop') && !address.includes('@chemicalloop.');
  };

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const validateEmailList = (list: string): { valid: boolean; emails: string[] } => {
    if (!list.trim()) return { valid: true, emails: [] };
    const emails = list.split(/[;,]/).map(e => e.trim()).filter(e => e);
    const allValid = emails.every(e => emailRegex.test(e));
    return { valid: allValid, emails };
  };

  // 处理文件上传
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const uploadConfig = await getUploadConfig();
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(uploadConfig.uploadUrl, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const result = await response.json();
        setAttachments(prev => [...prev, {
          name: file.name,
          size: file.size,
          url: result.url,
        }]);

        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload files');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 删除附件
  const handleRemoveAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  // 发送消息
  const handleSend = async () => {
    if (!recipient || !subject || !content) {
      alert(t('pleaseFillAllFields'));
      return;
    }

    const isInternal = isInternalAddress(recipient);

    // 验证收件人
    if (isInternal) {
      // 站内消息：验证格式
      if (!validateMessageAddress(recipient)) {
        alert(t('invalidInternalAddress'));
        return;
      }
      // 站内消息不支持CC/BCC
      if (cc.trim() || bcc.trim()) {
        alert(t('internalNoCcBcc'));
        return;
      }
    } else {
      // 外网邮件：验证邮箱格式
      if (!emailRegex.test(recipient)) {
        alert(t('invalidEmailAddress'));
        return;
      }
      // 验证CC和BCC
      const ccResult = validateEmailList(cc);
      const bccResult = validateEmailList(bcc);
      
      if (!ccResult.valid) {
        alert(t('invalidCcAddress'));
        return;
      }
      if (!bccResult.valid) {
        alert(t('invalidBccAddress'));
        return;
      }

      // 检查邮箱账户
      if (emailAccounts.length === 0) {
        alert(t('noEmailAccount'));
        return;
      }
      if (!selectedEmailAccountId) {
        alert(t('pleaseSelectEmailAccount'));
        return;
      }

      // 检查发件人邮箱是否为内网地址
      const selectedAccount = emailAccounts.find(a => a.id === selectedEmailAccountId);
      if (selectedAccount && isInternalAddress(selectedAccount.email)) {
        // 发件人是内网地址，不允许发送给外网地址
        alert(t('internalSenderNoExternalRecipient'));
        return;
      }
    }

    // 解析CC和BCC列表
    const ccEmails = cc.split(/[;,]/).map(e => e.trim()).filter(e => e);
    const bccEmails = bcc.split(/[;,]/).map(e => e.trim()).filter(e => e);

    await onSend({
      recipient,
      cc: ccEmails.length > 0 ? ccEmails : undefined,
      bcc: bccEmails.length > 0 ? bccEmails : undefined,
      subject,
      content,
      attachments,
      emailAccountId: selectedEmailAccountId,
      isInternal,
    });
  };

  // 保存草稿
  const handleSaveDraft = async () => {
    if (!onSaveDraft) return;
    
    await onSaveDraft({
      recipient,
      subject: subject || '(No Subject)',
      content,
    });
  };

  // AI Assistant
  const handleAIAssistant = () => {
    if (!content.trim()) {
      alert(t('aiAssistantPlaceholder'));
      return;
    }
    setShowAISuggestions(true);
    setStyleSelectionMode(true);
    setCurrentSuggestion('');
  };

  // 切换标签选择
  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  // 生成AI建议
  const handleGenerateSuggestion = async () => {
    if (selectedTags.length === 0) {
      alert(t('pleaseSelectStyle'));
      return;
    }
    
    setStyleSelectionMode(false);
    setIsGenerating(true);
    setCurrentSuggestion('');

    // 组合风格字符串
    const style = selectedTags.join(',');

    try {
      const response = await fetch('/api/ai/polish-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: originalMessage?.id,
          userInput: content,
          originalMessage: originalMessage ? {
            sender: originalMessage.sender,
            content: originalMessage.content,
            title: originalMessage.title,
          } : null,
          userLanguage: locale,
          style: style,
          mode: 'reply',  // 回复模式
          // 传递产品相关上下文（如果有的话）
          context: {
            productName: originalMessage?.product_name || originalMessage?.productName,
            inquiryId: originalMessage?.inquiry_id || originalMessage?.inquiryId,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate AI suggestion');
      }

      const data = await response.json();
      setCurrentSuggestion(data.content || content);
    } catch (error: any) {
      console.error('AI Assistant error:', error);
      alert(error.message || t('aiGenerateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // 重新生成
  const handleRegenerate = async () => {
    if (!currentSuggestion.trim()) return;

    setIsGenerating(true);
    const style = selectedTags.join(',');
    try {
      const response = await fetch('/api/ai/polish-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: originalMessage?.id,
          userInput: currentSuggestion,
          originalMessage: originalMessage ? {
            sender: originalMessage.sender,
            content: originalMessage.content,
            title: originalMessage.title,
          } : null,
          userLanguage: locale,
          style: style,
          mode: 'reply',  // 回复模式
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate suggestion');
      }

      const data = await response.json();
      setCurrentSuggestion(data.content || currentSuggestion);
    } catch (error: any) {
      console.error('Regenerate error:', error);
      alert(error.message || t('aiGenerateFailed'));
    } finally {
      setIsGenerating(false);
    }
  };

  // 翻译
  const handleTranslate = async (lang: string) => {
    if (!content.trim()) {
      alert(t('translatePlaceholder'));
      return;
    }

    setIsTranslating(true);

    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: content,
          targetLanguage: lang,
          sourceLanguage: locale,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to translate text');
      }

      const data = await response.json();
      setContent(data.translatedText || content);
      setShowTranslation(false);
    } catch (error: any) {
      console.error('Translation error:', error);
      alert(error.message || t('translateFailed'));
    } finally {
      setIsTranslating(false);
    }
  };

  // 获取本地化内容
  const getLocalizedContent = (message: OriginalMessage | null | undefined, currentLang: string) => {
    if (!message) return { title: '', content: '' };
    
    if (message.translations && message.translations[currentLang]) {
      const translation = message.translations[currentLang];
      return {
        title: translation.title || message.title,
        content: translation.content || message.content,
      };
    }
    
    if (message.language === currentLang) {
      return { title: message.title, content: message.content };
    }
    
    return { title: message.title, content: message.content };
  };

  // 获取placeholder
  const getPlaceholderText = (lang: string) => {
    const placeholders: Record<string, string> = {
      en: "Type your message here... You can enter your basic message, then click AI to help polish the text.",
      zh: "在此输入您的消息... 您可以在这里输入基本消息，输入后通过点击AI帮您润色文案。",
      es: "Escriba su mensaje aquí... Puede ingresar su mensaje básico aquí, luego haga clic en IA para ayudarle a pulir el texto.",
      fr: "Tapez votre message ici... Vous pouvez entrer votre message de base ici, puis cliquez sur IA pour vous aider à peaufiner le texte.",
      de: "Geben Sie hier Ihre Nachricht ein... Sie können hier Ihre grundlegende Nachricht eingeben und dann auf KI klicken, um den Text zu polieren.",
      ja: "ここにメッセージを入力... ここに基本的なメッセージを入力し、AIをクリックしてテキストを洗練させることができます。",
      ko: "여기에 메시지를 입력... 여기에 기본 메시지를 입력한 다음 AI를 클릭하여 텍스트를 다듬을 수 있습니다.",
      pt: "Digite sua mensagem aqui... Você pode inserir sua mensagem básica aqui e clicar em IA para ajudá-lo a polir o texto.",
      ru: "Введите ваше сообщение здесь... Вы можете ввести свое базовое сообщение здесь, затем нажать ИИ, чтобы помочь вам отполировать текст.",
      ar: "اكتب رسالتك هنا... يمكنك إدخال رسالتك الأساسية هنا، ثم النقر فوق الذكاء الاصطناعي لمساعدتك في صقل النص.",
    };
    return placeholders[lang] || placeholders.en;
  };

  const isInternal = isInternalAddress(recipient);

  // 内容部分
  const contentUI = (
    <>
      {/* 顶部标题栏 */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">
            {mode === 'reply' ? `${t('reply')}: ${getLocalizedContent(originalMessage, locale).title}` : t('newMessage')}
          </h1>
          {/* 回复模式下显示IM按钮 */}
          {mode === 'reply' && senderIMInfo.hasIM && (
            <IMContactButtons
              contacts={senderIMInfo.contacts}
              isContact={senderIMInfo.isContact}
              size="sm"
            />
          )}
        </div>
        {mode === 'reply' && originalMessage && (
          <p className="text-sm text-gray-600 mt-1">
            {t('to')}: {originalMessage.sender_name || originalMessage.senderName || originalMessage.sender || 'N/A'}
            {(originalMessage.sender_address || originalMessage.senderAddress) && (
              <span className="text-gray-400 ml-1">
                &lt;{originalMessage.sender_address || originalMessage.senderAddress}&gt;
              </span>
            )}
          </p>
        )}
      </div>

      {/* 操作按钮 - 上方区域 */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
        {/* 左侧：AI Assistant + Translate + Contact */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAIAssistant}
            disabled={!content.trim() || isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            title={t('aiAssistantTooltip')}
          >
            <Sparkles className="h-4 w-4" />
            <span>{isGenerating ? t('generating') : t('aiAssistant')}</span>
          </button>

          <button
            onClick={() => setShowTranslation(true)}
            disabled={!content.trim() || isTranslating}
            className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={t('translateTooltip')}
          >
            <Languages className="h-4 w-4" />
            <span>{isTranslating ? t('translating') : t('translate')}</span>
          </button>

        </div>

        {/* 右侧：Cancel - 仅在compose模式且有onCancel时显示 */}
        {mode === 'compose' && onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            {t('cancel')}
          </button>
        )}
      </div>

      {/* 表单区域 */}
      <div className="p-6 border-b border-gray-200 space-y-4">
        {/* 发件人选择 - 新建模式和回复模式外网邮件都显示 */}
        {(mode === 'compose' || !isInternal) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('from')}
            </label>
            {loadingEmailAccounts ? (
              <div className="text-sm text-gray-500">{t('loading')}</div>
            ) : emailAccounts.length === 0 ? (
              <div className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                {t('noEmailAccount')}
              </div>
            ) : (
              <select
                value={selectedEmailAccountId}
                onChange={(e) => setSelectedEmailAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t('pleaseSelectEmailAccount')}</option>
                {emailAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.senderName} &lt;{account.email}&gt;
                    {account.isDefault ? ` (${t('default')})` : ''}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">{t('fromAccountHint')}</p>
          </div>
        )}

        {/* 收件人 - 新建模式可编辑 */}
        {mode === 'compose' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('to')}
            </label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder={t('toPlaceholder')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              {recipient && isInternal ? t('internalAddressHint') : t('externalAddressHint')}
            </p>
          </div>
        )}

        {/* CC/BCC - 新建模式和回复模式外网邮件都显示 */}
        {(mode === 'compose' || !isInternal) && (
          <div>
            <button
              type="button"
              onClick={() => setShowCcBcc(!showCcBcc)}
              className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 mb-2"
            >
              {showCcBcc ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showCcBcc ? t('hideCcBcc') : t('showCcBcc')}
            </button>

            {showCcBcc && (
              <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('cc')}
                  </label>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder={t('ccPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('ccHint')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('bcc')}
                  </label>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder={t('bccPlaceholder')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('bccHint')}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 主题 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('subject')}
          </label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder={t('subjectPlaceholder')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 内容 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('content')}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={getPlaceholderText(locale)}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y"
          />
        </div>

        {/* 附件上传 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('attachments')}
          </label>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <FileText className="h-4 w-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {uploading ? `${t('uploading')} ${uploadProgress}%` : t('addAttachment')}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {/* 附件列表 */}
          {attachments.length > 0 && (
            <div className="mt-3 space-y-2">
              {attachments.map((attachment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                    <span className="text-sm text-gray-700 truncate">
                      {attachment.name}
                    </span>
                    <span className="text-xs text-gray-500 flex-shrink-0">
                      {(attachment.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    onClick={() => handleRemoveAttachment(index)}
                    className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                    title={t('remove')}
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 主要操作按钮 */}
        <div className="flex items-center justify-end gap-3 mt-4">
          {onSaveDraft && (
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              <span>{t('saveDraft')}</span>
            </button>
          )}
          <button
            onClick={handleSend}
            disabled={!content || !recipient || uploading}
            className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium shadow-md"
          >
            <Send className="h-4 w-4" />
            <span>{t('send')}</span>
          </button>
        </div>
      </div>

      {/* 原始消息（仅回复模式） */}
      {mode === 'reply' && originalMessage && (
        <div className="border-b border-gray-200">
          <button
            onClick={() => setShowQuote(!showQuote)}
            className="w-full px-6 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors text-left"
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-semibold text-gray-700">
                {t('originalMessage')}
              </span>
            </div>
            <span className="text-gray-400">
              {showQuote ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </span>
          </button>
          {showQuote && (
            <div className="px-6 py-4 bg-gray-50/50 text-sm text-gray-700 border-t border-gray-200">
              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 mb-3 text-xs">
                <span className="text-gray-500 font-medium">{t('from')}:</span>
                <span className="truncate">
                  {originalMessage.sender_name || originalMessage.senderName || originalMessage.sender || 'N/A'}
                  {(originalMessage.sender_address || originalMessage.senderAddress) && (
                    <span className="text-gray-400 ml-1">
                      &lt;{originalMessage.sender_address || originalMessage.senderAddress}&gt;
                    </span>
                  )}
                </span>
                
                <span className="text-gray-500 font-medium">{t('to')}:</span>
                <span className="truncate">
                  {originalMessage.recipient_name || originalMessage.recipientName || originalMessage.recipient || 'N/A'}
                  {(originalMessage.recipient_address || originalMessage.recipientAddress) && (
                    <span className="text-gray-400 ml-1">
                      &lt;{originalMessage.recipient_address || originalMessage.recipientAddress}&gt;
                    </span>
                  )}
                </span>
                
                <span className="text-gray-500 font-medium">{t('date')}:</span>
                <span>{originalMessage.timestamp || originalMessage.created_at || originalMessage.createdAt ? new Date(originalMessage.timestamp || originalMessage.created_at || originalMessage.createdAt!).toLocaleString() : 'N/A'}</span>
                
                <span className="text-gray-500 font-medium">{t('subject')}:</span>
                <span className="font-medium text-gray-800">
                  {getLocalizedContent(originalMessage, locale).title}
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200 bg-white p-4 rounded text-sm leading-relaxed">
                <p className="whitespace-pre-wrap">
                  {getLocalizedContent(originalMessage, locale).content}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* AI建议模态框 */}
      {showAISuggestions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Sparkles className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">{t('aiAssistantTitle')}</h2>
                </div>
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 max-h-[65vh]">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">{t('generating')}</p>
                  <p className="text-sm text-gray-500 mt-2">{t('aiGenerateHint')}</p>
                </div>
              ) : styleSelectionMode ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('chooseStyleTags')}</p>
                    <p className="text-xs text-gray-500">{t('chooseStyleTagsDesc')}</p>
                  </div>
                  
                  {/* 语气标签 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <span>🎤</span> {t('toneTags')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['formal', 'casual', 'polite', 'enthusiastic', 'neutral'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t(`tag_${tag}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 篇幅标签 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <span>📏</span> {t('lengthTags')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['detailed', 'concise', 'brief', 'comprehensive'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-green-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t(`tag_${tag}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 表达方式标签 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <span>🧠</span> {t('approachTags')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['data-driven', 'logical', 'emotional', 'storytelling', 'professional'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t(`tag_${tag}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 补充信息标签 */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                      <span>📚</span> {t('contentTags')}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {['with-pricing', 'with-specs', 'with-timeline', 'with-call-to-action', 'with-benefits'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => toggleTag(tag)}
                          className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                            selectedTags.includes(tag)
                              ? 'bg-orange-600 text-white shadow-sm'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {t(`tag_${tag}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* 已选标签预览 */}
                  <div className="p-3 bg-gray-50 rounded-lg min-h-[60px]">
                    <p className="text-xs text-gray-500 mb-2">{t('selectedTags')}:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTags.length > 0 ? (
                        selectedTags.map(tag => (
                          <span 
                            key={tag} 
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {t(`tag_${tag}`)}
                            <button 
                              onClick={() => toggleTag(tag)}
                              className="hover:text-blue-900"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">{t('noTagsSelected')}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* 生成按钮 */}
                  <button
                    onClick={handleGenerateSuggestion}
                    disabled={selectedTags.length === 0}
                    className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-5 w-5" />
                    {t('generateSuggestion')}
                  </button>
                </div>
              ) : (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTags.map(tag => (
                        <span 
                          key={tag} 
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {t(`tag_${tag}`)}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setStyleSelectionMode(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      ← {t('changeStyle')}
                    </button>
                  </div>
                  
                  <div className="mb-4">
                    <textarea
                      value={currentSuggestion}
                      onChange={(e) => setCurrentSuggestion(e.target.value)}
                      placeholder={t('aiSuggestionPlaceholder')}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y text-sm"
                    />
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800 flex items-start gap-2">
                      <span className="text-lg">💡</span>
                      <span><strong>{t('tip')}:</strong> {t('aiTipContent')}</span>
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!isGenerating && !styleSelectionMode && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
                <button
                  onClick={() => setShowAISuggestions(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRegenerate}
                    disabled={isGenerating || !currentSuggestion.trim()}
                    className="px-4 py-2 border border-blue-600 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>{t('regenerate')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setContent(currentSuggestion);
                      setShowAISuggestions(false);
                    }}
                    disabled={!currentSuggestion.trim()}
                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    ✓ {t('useThis')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 翻译模态框 */}
      {showTranslation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 bg-blue-600 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white">
                  <Languages className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">{t('translateTitle')}</h2>
                </div>
                <button
                  onClick={() => setShowTranslation(false)}
                  className="p-1 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1 max-h-[65vh]">
              {isTranslating ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-gray-600">{t('translating')}</p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 mb-6">{t('selectLanguage')}</p>
                  <div className="grid grid-cols-2 gap-4">
                    {languageList.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => handleTranslate(lang.code)}
                        className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={locale === lang.code}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-800 text-lg">
                            {lang.flag} {lang.nativeName}
                          </span>
                          {locale === lang.code && (
                            <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                              {t('current')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowTranslation(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  );

  // 根据 inModal 属性决定是否包装容器
  if (inModal) {
    return contentUI;
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      {contentUI}
    </div>
  );
}

// 辅助函数 - 需要从外部传入或全局定义
async function getUploadConfig() {
  const token = getToken();
  const response = await fetch('/api/www/messages/upload', {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to get upload config');
  const data = await response.json();
  return data.config;
}

function validateMessageAddress(address: string): boolean {
  // 验证站内消息地址格式
  const internalRegex = /^[a-zA-Z0-9_-]+@chemicalloop$/;
  return internalRegex.test(address);
}

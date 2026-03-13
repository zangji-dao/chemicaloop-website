'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Header from '@/components/layout/Header';
import AuthModal from '@/components/auth/AuthModal';
import ComposeMessage from '@/components/messaging/ComposeMessage';
import { useAuth } from '@/hooks/useAuth';
import { getToken } from '@/services/authService';
import {
  createMessage,
  saveDraft,
  sendMessage as apiSendMessage,
  getMessages,
  getMessage,
} from '@/services/messageService';
import { ArrowLeft } from 'lucide-react';

export default function ReplyMessagePage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('messages');
  const { user, isLoggedIn, isLoading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 从 pathname 中提取语言
  const pathParts = pathname.split('/');
  const validLocales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'];
  const rawLocale = pathParts[1] || 'en';
  const locale = validLocales.includes(rawLocale) ? rawLocale : 'en';
  
  const messageId = params.messageId as string;

  // 原始消息
  const [originalMessage, setOriginalMessage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 加载原始消息
  useEffect(() => {
    const loadOriginalMessage = async () => {
      try {
        console.log('[Reply Page] Starting to load message', { messageId, locale });
        setLoading(true);
        
        const message = await getMessage(messageId);
        
        // 不再自动翻译，让用户在ComposeMessage组件中手动翻译
        // 这样可以避免阻塞页面加载
        
        setOriginalMessage(message);
      } catch (error) {
        console.error('[Reply Page] Failed to load original message:', error);
      } finally {
        setLoading(false);
      }
    };

    if (messageId) {
      loadOriginalMessage();
    }
  }, [messageId, locale]);

  // 发送消息
  const handleSend = async (data: any) => {
    try {
      if (data.isInternal) {
        // 发送站内消息
        const newMessage = await createMessage({
          type: 'reply',
          title: data.subject,
          content: data.content,
          recipient_address: data.recipient,
          attachments: data.attachments,
        });

        await apiSendMessage(newMessage.id);
        alert(t('inquirySentSuccess'));
      } else {
        // 发送外网邮件
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

        alert(t('emailSentSuccess'));
      }

      router.push(`/${locale}/messages`);
    } catch (error: any) {
      console.error('Failed to send message:', error);
      alert(error.message || t('sendFailed'));
    }
  };

  // 保存草稿
  const handleSaveDraft = async (data: any) => {
    try {
      await saveDraft({
        recipient_address: data.recipient,
        title: data.subject,
        content: data.content,
      });
      alert(t('draftSavedSuccess'));
    } catch (error: any) {
      console.error('Failed to save draft:', error);
      alert(error.message || 'Failed to save draft');
    }
  };

  // 返回
  const handleBack = () => {
    router.push(`/${locale}/messages`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => {}} locale={locale} />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{t('loading')}</div>
      </div>
    );
  }

  if (!originalMessage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-6xl mx-auto p-6">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToMessages')}
          </button>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-gray-500">{t('messageNotFound')}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AuthModal isOpen={isAuthModalOpen} onClose={() => {}} locale={locale} />

      {/* Page Banner */}
      <section className="relative h-64 bg-gradient-to-r from-blue-900 to-blue-700 overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative h-full flex items-end justify-center px-4 pb-8">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              {t('reply')}
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              {t('replyDescription')}
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-4 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToMessages')}
        </button>

        <ComposeMessage
          mode="reply"
          locale={locale}
          userId={user?.id}
          originalMessage={originalMessage}
          onSend={handleSend}
          onSaveDraft={handleSaveDraft}
          t={t}
        />
      </div>
    </div>
  );
}

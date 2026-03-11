'use client';

import { useState, useRef, useEffect, RefObject } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LogOut, MessageSquare, Shield, UserCircle, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getUserAvatar } from '@/utils/avatar';

interface UserCardProps {
  locale: string;
  onClose?: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

export default function UserCard({ locale, onClose, buttonRef }: UserCardProps) {
  const router = useRouter();
  const { user, userRole, logout } = useAuth();
  const cardRef = useRef<HTMLDivElement>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const t = useTranslations('userCard');

  // 计算用户卡片位置
  useEffect(() => {
    if (buttonRef?.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }
  }, [buttonRef]);

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        if (buttonRef?.current && !buttonRef.current.contains(event.target as Node)) {
          onClose?.();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, buttonRef]);

  // 获取未读消息数量（模拟）
  useEffect(() => {
    // TODO: 从 API 获取真实的未读消息数量
    setUnreadCount(0);
  }, []);

  // 处理退出登录
  const handleLogout = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await logout();
    onClose?.();
    window.location.reload();
  };

  // 处理导航
  const handleNavigate = async (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('=== handleNavigate called ===', { path, eventType: e.type });
    console.log('=== Current URL ===', window.location.href);
    console.log('=== Will use router.push ===', path);
    
    try {
      console.log('=== Calling router.push ===');
      // 使用 Next.js router 进行导航
      await router.push(path);
      console.log('=== router.push completed ===');
      // 关闭菜单
      setTimeout(() => onClose?.(), 100);
    } catch (error) {
      console.error('=== router.push failed ===', error);
      // Fallback: 使用 window.location.href
      console.log('=== Fallback: using window.location.href ===');
      window.location.href = path;
    }
  };

  if (!user) return null;

  const displayName = user.username || user.internalEmailName || user.name || 'User';
  const avatarUrl = getUserAvatar(user, 80);
  const roleLabel = userRole === 'AGENT' ? 'Agent' : 'User';

  const card = (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        top: position.top,
        right: position.right,
        pointerEvents: 'auto',
      }}
      className="w-72 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-[9999] pointer-events-auto animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {/* 用户信息头部 */}
      <div className="p-4 bg-gradient-to-br from-slate-50 to-slate-100 border-b border-gray-100">
        <div className="flex items-center gap-3">
          {/* 头像 */}
          <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${
            user.avatarUrl 
              ? 'ring-2 ring-blue-100' 
              : (userRole === 'AGENT' ? 'bg-green-500' : 'bg-blue-500')
          }`}>
            <Image
              src={avatarUrl}
              alt={displayName}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
          
          {/* 用户名和邮箱 */}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{displayName}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                userRole === 'AGENT' 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-blue-100 text-blue-700'
              }`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>
        
        {/* 邮箱显示 */}
        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
          <Mail className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>
      </div>

      {/* 功能列表 */}
      <div className="py-1.5 pointer-events-auto">
        {/* 用户中心 */}
        <button
          type="button"
          onClick={(e) => handleNavigate(e, `/${locale}/profile`)}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer pointer-events-auto w-full text-left border-none bg-transparent"
        >
          <UserCircle className="h-4.5 w-4.5 text-gray-400" />
          <span className="text-sm">{t('myAccount')}</span>
        </button>

        {/* 消息中心 */}
        <button
          type="button"
          onClick={(e) => handleNavigate(e, `/${locale}/messages`)}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer pointer-events-auto w-full text-left border-none bg-transparent"
        >
          <MessageSquare className="h-4.5 w-4.5 text-gray-400" />
          <span className="text-sm">{t('messageCenter')}</span>
          {unreadCount > 0 && (
            <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* 代理管理 */}
        {userRole === 'AGENT' && (
          <button
            type="button"
            onClick={(e) => handleNavigate(e, `/${locale}/agent/portal`)}
            onMouseDown={(e) => e.stopPropagation()}
            className="flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer pointer-events-auto w-full text-left border-none bg-transparent"
          >
            <Shield className="h-4.5 w-4.5 text-gray-400" />
            <span className="text-sm">{t('agentPortal')}</span>
          </button>
        )}
      </div>

      {/* 底部登出按钮 */}
      <div className="p-3 bg-gray-50 border-t border-gray-100">
        <button
          type="button"
          onMouseDown={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          <span>{t('signOut')}</span>
        </button>
      </div>
    </div>
  );

  return createPortal(card, document.body);
}

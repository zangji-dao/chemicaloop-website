'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, Search, Globe, Facebook, Twitter, Linkedin, Instagram, Youtube, User, LogOut, MessageSquare, Bell } from 'lucide-react';
import AuthModal from './AuthModal';
import UserCard from './UserCard';
import { getToken } from '@/services/authService';
import { getMessages, getUnreadCount } from '@/services/messageService';
import { useAuth } from '@/hooks/useAuth';
import { getUserAvatar } from '@/utils/avatar';

export default function Header() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tMessageCard = useTranslations('messageCard');
  const pathname = usePathname();
  const router = useRouter();
  
  // 使用 useAuth hook
  const { isLoggedIn, user: authUser, logout, refreshUser } = useAuth();
  const userRole = authUser?.role || null;

  // 从 pathname 中提取语言（例如 /en/home -> en）
  const locale = pathname.split('/')[1] || 'en';

  // 页面加载时刷新用户数据（确保显示最新数据）
  useEffect(() => {
    if (isLoggedIn) {
      refreshUser().catch(err => console.log('[Header] refreshUser failed:', err));
    }
  }, []); // 只在组件挂载时执行一次

  // 使用 useMemo 确保翻译只在 locale 变化时更新
  const navTranslations = {
    home: t('home'),
    products: t('products'),
    news: t('news'),
    agent: t('agent'),
    contact: t('contact'),
  };

  // 状态管理
  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const [isPcLangOpen, setIsPcLangOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // 从 localStorage 读取消息数据
  const [messages, setMessages] = useState<any[]>([]);
  
  // 追踪是否已加载，避免重复请求
  const messagesLoadedRef = useRef(false);

  // 从 API 加载消息数据和未读数量
  const loadMessages = useCallback(async (forceRefresh = false) => {
    console.log('=== Header: loadMessages called ===');
    console.log('isLoggedIn:', isLoggedIn, 'forceRefresh:', forceRefresh);
    
    // 如果已经加载过且不是强制刷新，跳过
    if (messagesLoadedRef.current && !forceRefresh) {
      console.log('Messages already loaded, skipping');
      return;
    }

    try {
      // 检查 token 是否存在
      const token = getToken();
      console.log('Token exists:', !!token);

      if (!token) {
        console.log('No token found, skipping message load');
        return;
      }

      // inbox 的未读数量已经包含了 inbox + inquiries 的总和（后端逻辑）
      // 所以只需要调用一次 inbox 即可
      console.log('Fetching inbox unread count...');
      const inboxUnreadData = await getUnreadCount('inbox');
      console.log('Inbox unread count (includes inquiries):', inboxUnreadData.unreadCount);

      // 设置未读数量
      setUnreadCount(inboxUnreadData.unreadCount || 0);

      // 加载收件箱最近消息
      console.log('Fetching inbox messages...');
      const messagesData = await getMessages({ folder: 'inbox', limit: 5 });
      console.log('Messages loaded:', messagesData.messages.length);
      setMessages(messagesData.messages);
      
      // 标记已加载
      messagesLoadedRef.current = true;
    } catch (error: any) {
      // 认证相关错误静默处理（token 过期、未登录等）
      const errorMsg = error?.message || error?.error || String(error);
      if (errorMsg.includes('Unauthorized') || errorMsg.includes('401') || errorMsg.includes('sign in')) {
        console.log('[Header] Auth required for messages, skipping...');
      } else {
        // 其他错误也静默处理，避免控制台噪音
        console.log('[Header] Failed to load messages:', errorMsg);
      }
      setMessages([]);
      setUnreadCount(0);
    }
  }, [isLoggedIn]);

  // 初始加载消息（仅在登录状态变化时）
  useEffect(() => {
    // 仅在已登录时加载消息
    if (isLoggedIn) {
      console.log('User is logged in, loading messages...');
      // 添加延迟，确保 token 已保存到 localStorage
      const timer = setTimeout(() => {
        loadMessages();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      console.log('User is not logged in, skipping message load');
      messagesLoadedRef.current = false;
    }
  }, [isLoggedIn]); // 只依赖 isLoggedIn，不依赖 loadMessages

  // 定期刷新未读数量（每30秒）
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }

    // 设置定时刷新
    const interval = setInterval(() => {
      loadMessages(true); // 定时刷新强制更新
    }, 30000); // 30秒刷新一次

    return () => clearInterval(interval);
  }, [isLoggedIn]); // 移除 loadMessages 依赖，避免循环

  // 监听自定义事件，允许外部触发刷新（如"一键已读"后）
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[Header] Received header-refresh-messages event, refreshing...');
      loadMessages(true); // 强制刷新
    };

    // 监听 'header-refresh-messages' 事件
    window.addEventListener('header-refresh-messages', handleRefresh);

    return () => {
      window.removeEventListener('header-refresh-messages', handleRefresh);
    };
  }, [loadMessages]);

  // TODO: 临时测试用，显示固定未读数量。真实环境应从 API 加载
  // setUnreadCount(5);

  // Refs
  const mobileLangRef = useRef<HTMLDivElement>(null);
  const pcLangRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const pcSearchInputRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const userButtonRef = useRef<HTMLButtonElement>(null);

  // 常量
  const PC_MIN_WIDTH = 1024;
  const SCROLL_THRESHOLD = 5;

  // 导航菜单项
  const navItems = [
    { key: 'home', href: `/${locale}` },
    { key: 'products', href: `/${locale}/products` },
    { key: 'news', href: `/${locale}/news` },
    { key: 'agent', href: `/${locale}/agent` },
    { key: 'contact', href: `/${locale}/contact` },
  ];

  // 语言列表
  const languages = [
    { code: 'en', name: 'English', flag: '/assets/flags/en.png' },
    { code: 'zh', name: '简体中文', flag: '/assets/flags/zh.png' },
    { code: 'ja', name: '日本語', flag: '/assets/flags/ja.png' },
    { code: 'ko', name: '한국어', flag: '/assets/flags/ko.png' },
    { code: 'de', name: 'Deutsch', flag: '/assets/flags/de.png' },
    { code: 'fr', name: 'Français', flag: '/assets/flags/fr.png' },
    { code: 'es', name: 'Español', flag: '/assets/flags/es.png' },
    { code: 'pt', name: 'Português', flag: '/assets/flags/pt.png' },
    { code: 'ru', name: 'Русский', flag: '/assets/flags/ru.png' },
    { code: 'ar', name: 'العربية', flag: '/assets/flags/ar.png' },
  ];

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // 滚动处理
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setScrollY(scrollPosition);
      // 简化滚动状态：滚动超过 80px 就认为已滚动（与主导航高度一致）
      setIsScrolled(scrollPosition > 80);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 点击外部关闭语言选择器、消息预览和用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileLangRef.current && !mobileLangRef.current.contains(event.target as Node)) {
        setIsLangOpen(false);
      }
      if (pcLangRef.current && !pcLangRef.current.contains(event.target as Node)) {
        setIsPcLangOpen(false);
      }
      if (messageRef.current && !messageRef.current.contains(event.target as Node)) {
        setIsMessageOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 稳定的回调函数，避免 AuthModal 重新渲染循环
  const handleAuthModalClose = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  // 阻止页面滚动
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMobileMenuOpen]);

  // 移动端搜索聚焦
  const handleMobileSearchFocus = () => {
    setIsMobileSearchFocused(true);
    setIsLangOpen(false);
    setIsMobileMenuOpen(false);
  };

  // 移动端搜索失焦
  const handleMobileSearchBlur = () => {
    setTimeout(() => setIsMobileSearchFocused(false), 200);
  };

  // 移动端菜单切换
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    setIsLangOpen(false);
    setIsMobileSearchFocused(false);
  };

  // 关闭移动端菜单
  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = 'auto';
  };

  // PC 端语言选择器切换
  const togglePcLang = () => {
    setIsPcLangOpen(!isPcLangOpen);
  };

  // 生成语言切换后的路径（保留当前页面路径）
  const getLanguagePath = (langCode: string) => {
    const pathParts = pathname.split('/');
    // 替换第一个部分（语言代码）
    pathParts[1] = langCode;
    const newPath = pathParts.join('/');
    return newPath;
  };

  // 语言切换处理
  const handleLanguageChange = (langCode: string) => {
    router.push(getLanguagePath(langCode));
  };

  // 搜索处理
  const handleMobileSearch = () => {
    const value = mobileSearchInputRef.current?.value.trim();
    if (!value) {
      alert('Please enter search content');
      return;
    }
    console.log('Mobile search:', value);
  };

  const handlePcSearch = () => {
    const value = pcSearchInputRef.current?.value.trim();
    if (!value) {
      alert('Please enter search content');
      return;
    }
    console.log('PC search:', value);
  };

  // 判断是否激活
  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      return pathname === `/${locale}`;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="w-full relative z-[9999] font-sans">
      {/* 调试信息（仅在开发环境显示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 bg-black/80 text-white p-2 rounded text-xs z-[10000]">
          Debug: isLoggedIn={isLoggedIn ? 'true' : 'false'}, user={authUser?.name || 'null'}
        </div>
      )}

      {/* PC端独立Logo */}
      <div className={`pc-logo-standalone fixed top-0 ${locale === 'ar' ? 'right-[clamp(80px,8vw,240px)]' : 'left-[clamp(80px,8vw,240px)]'} z-[9999] px-0 py-0 leading-none hidden lg:block`}>
        <div className="logo-responsive relative transition-opacity duration-500 ease-in-out">
          <img
            src={isScrolled ? '/assets/logos/logo-blue-bg.png' : '/assets/logos/logo-white-bg.png'}
            alt="Chemicaloop Logo"
            className="h-full w-full object-contain"
            style={{ transition: 'opacity 0.5s ease-in-out' }}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const parent = target.parentElement;
              if (parent) {
                const fallback = parent.querySelector('.logo-fallback') as HTMLElement;
                if (fallback) {
                  fallback.style.display = 'flex';
                }
              }
            }}
          />
          <div className="logo-fallback w-full h-full bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-center rounded absolute inset-0" style={{display: 'none'}}>
            <span className="text-white font-bold text-h3">LOGO</span>
          </div>
        </div>
      </div>

      {/* 移动端顶部栏 */}
      <div className="mobile-top-bar fixed top-0 left-0 right-0 z-[99999] flex lg:hidden bg-white nav-height border-b border-gray-200 shadow-sm px-2 sm:px-responsive items-center">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-responsive">
          {/* Logo */}
          <div className="flex-shrink-0 relative" style={{ width: 'clamp(80px, 15vw, 120px)', height: 'clamp(40px, 7.5vw, 60px)' }}>
            <img
              src="/assets/logos/logo-white-bg.png"
              alt="Chemicaloop Logo"
              className="w-full h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                const parent = target.parentElement;
                if (parent) {
                  const fallback = parent.querySelector('.logo-fallback') as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }
              }}
            />
            <div className="logo-fallback w-full h-14 bg-gradient-to-r from-blue-700 to-blue-500 flex items-center justify-center rounded absolute inset-0" style={{display: 'none'}}>
              <span className="text-white font-bold text-sm">LOGO</span>
            </div>
          </div>

          {/* 搜索框 */}
          <div className="flex-1 flex items-center min-w-0">
            <div
              className={`w-full h-10 border rounded-lg bg-gray-100 flex items-center justify-end px-2 sm:px-3 relative transition-all duration-300 overflow-hidden ${
                isMobileSearchFocused ? 'border-blue-700 shadow-[0_0_0_2px_rgba(0,74,153,0.2)]' : 'border-gray-400'
              }`}
            >
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder={tCommon('searchPlaceholder')}
                className="absolute left-2 sm:left-3 top-0 h-full w-[calc(100%-36px)] sm:w-[calc(100%-40px)] border-none bg-transparent outline-none text-sm text-gray-900 transition-all"
                onFocus={handleMobileSearchFocus}
                onBlur={handleMobileSearchBlur}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                className="w-7 h-7 border-none bg-transparent flex items-center justify-center cursor-pointer z-10 flex-shrink-0"
                onClick={(e) => { e.stopPropagation(); handleMobileSearch(); }}
              >
                <Search className="h-5 w-5 text-gray-900" />
              </button>
            </div>
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0 z-[99999]">
            {/* 语言选择器 */}
            {!isMobileMenuOpen && !isMobileSearchFocused && (
              <div ref={mobileLangRef} className="relative inline-block">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 sm:gap-2 text-blue-700 text-xs sm:text-sm"
                >
                  <img
                    src={currentLanguage.flag}
                    alt={currentLanguage.name}
                    className="w-5 h-auto sm:w-6 lg:w-7"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span className="hidden sm:inline">{currentLanguage.name}</span>
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[120px] max-w-[180px] w-auto z-[99999] overflow-hidden">
                    {languages.map((lang) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          setIsLangOpen(false);
                          handleLanguageChange(lang.code);
                        }}
                        className="flex items-center gap-2 px-3 py-2 hover:bg-blue-50 transition-colors whitespace-nowrap text-xs sm:text-sm cursor-pointer"
                      >
                        <img
                          src={lang.flag}
                          alt={lang.name}
                          className="w-5 h-auto sm:w-6 lg:w-7"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <span className="truncate max-w-[80px] sm:max-w-[100px]">{lang.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 菜单按钮 */}
            <button
              onClick={toggleMobileMenu}
              className="w-10 h-10 border-none bg-transparent flex items-center justify-center cursor-pointer"
              aria-label={isMobileMenuOpen ? 'close menu' : 'open menu'}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 移动端导航菜单 */}
      {isMobileMenuOpen && !isMobileSearchFocused && (
        <>
          <div className={`fixed top-16 ${locale === 'ar' ? 'left-0' : 'right-0'} w-[260px] h-[calc(100vh-64px)] bg-white z-[9999] shadow-[0_4px_15px_rgba(0,0,0,0.1)] overflow-y-auto lg:hidden`}>
            <ul className="list-none p-5">
              {navItems.map((item) => (
                <li key={item.key} className="border-b border-gray-100">
                  <Link
                    href={item.href}
                    className={`block py-4 px-5 text-base transition-colors ${
                      isActive(item.href) ? 'text-blue-700 bg-blue-50' : 'text-gray-900 hover:text-blue-700 hover:bg-gray-50'
                    }`}
                    onClick={closeMobileMenu}
                  >
                    {navTranslations[item.key as keyof typeof navTranslations]}
                  </Link>
                </li>
              ))}

              {/* 移动端登录按钮 */}
              <li className="pt-4">
                {isLoggedIn ? (
                  <div className="space-y-2 px-5">
                    {/* 用户信息 - 隐藏角色文本面板 */}
                    {/* <div className="flex items-center justify-between py-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {userRole === 'AGENT' ? 'A' : 'U'}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700">
                            {userRole === 'AGENT' ? 'Agent Portal' : 'My Account'}
                          </span>
                          <span className="text-xs text-gray-500">
                            {userRole === 'AGENT' ? 'Agent Account' : 'User Account'}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          closeMobileMenu();
                        }}
                        className="text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <LogOut className="h-5 w-5" />
                      </button>
                    </div> */}

                    {/* 登出按钮 */}
                    <button
                      onClick={() => {
                        logout();
                        closeMobileMenu();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-3 text-red-600 bg-red-50 rounded-lg font-medium hover:bg-red-100 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Logout</span>
                    </button>

                    {/* 角色专属菜单 */}
                    {userRole === 'AGENT' && (
                      <Link
                        href={`/${locale}/agent/portal`}
                        className="block py-3 px-5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        onClick={closeMobileMenu}
                      >
                        Agent Portal
                      </Link>
                    )}

                    {userRole === 'USER' && (
                      <div className="space-y-2">
                        <Link
                          href={`/${locale}/user/orders`}
                          className="block py-3 px-5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                          onClick={closeMobileMenu}
                        >
                          My Orders
                        </Link>
                        <Link
                          href={`/${locale}/user/favorites`}
                          className="block py-3 px-5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                          onClick={closeMobileMenu}
                        >
                          My Favorites
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setIsAuthModalOpen(true);
                      closeMobileMenu();
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    <User className="h-5 w-5" />
                    <span>{t('signIn')}</span>
                  </button>
                )}
              </li>
            </ul>
          </div>
          {/* 遮罩 */}
          <div
            className="fixed top-16 left-0 w-full h-[calc(100vh-64px)] bg-black/50 z-[9998] lg:hidden"
            onClick={closeMobileMenu}
          />
        </>
      )}

      {/* PC端导航栏容器 */}
      <div className="pc-nav-wrapper hidden lg:block w-full fixed top-0 left-0 z-[9998] overflow-visible">
        {/* 顶部信息栏 */}
        <div className="pc-top-header bg-blue-700 flex items-center text-white transition-all duration-300 overflow-visible relative" style={{ height: 'clamp(32px, 4vw, 48px)' }}>
          <div className="w-full max-w-[1920px] mx-auto flex items-center justify-end gap-4 flex-nowrap whitespace-nowrap mr-[clamp(100px,8vw,300px)] ml-[clamp(220px,calc(140px+14vw),780px)]">
            <div className="flex items-center gap-3 flex-shrink-0 flex-nowrap">
              {/* 社交媒体链接 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <a href="#" className="transition-transform hover:scale-110" aria-label="X platform">
                  <Twitter className="h-4 w-4 text-white" />
                </a>
                <span className="text-white/90 text-xs">|</span>
                <a href="#" className="transition-transform hover:scale-110" aria-label="LinkedIn platform">
                  <Linkedin className="h-4 w-4 text-white" />
                </a>
                <span className="text-white/90 text-xs">|</span>
                <a href="#" className="transition-transform hover:scale-110" aria-label="Facebook platform">
                  <Facebook className="h-4 w-4 text-white" />
                </a>
                <span className="text-white/90 text-xs">|</span>
                <a href="#" className="transition-transform hover:scale-110" aria-label="Instagram platform">
                  <Instagram className="h-4 w-4 text-white" />
                </a>
                <span className="text-white/90 text-xs">|</span>
                <a href="#" className="transition-transform hover:scale-110" aria-label="YouTube platform">
                  <Youtube className="h-4 w-4 text-white" />
                </a>
                <span className="text-white/90 text-xs">|</span>
              </div>

              {/* 联系信息 */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <a
                  href="tel:+86.15585606688"
                  className="text-white text-sm whitespace-nowrap hover:text-blue-200 transition-colors"
                >
                  +86.15585606688
                </a>
                <span className="text-white/90 text-xs">|</span>
                <a
                  href="mailto:support@chemicaloop.com"
                  className="text-white text-sm whitespace-nowrap hover:text-blue-200 transition-colors"
                >
                  support@chemicaloop.com
                </a>
              </div>
            </div>

            {/* 搜索和语言 */}
            <div className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap">
              {/* 搜索框 */}
              <div className="w-[clamp(150px,12vw,260px)] h-[clamp(32px,2.5vw,38px)] flex items-center justify-between bg-white/20 border border-white rounded relative overflow-hidden flex-shrink-0">
                <input
                  ref={pcSearchInputRef}
                  type="text"
                  placeholder={tCommon('searchPlaceholder')}
                  className="flex-1 border-none bg-transparent outline-none px-2 py-1 w-full text-white text-sm whitespace-nowrap"
                />
                <button
                  className="w-[clamp(32px,2.5vw,38px)] h-full border-none bg-black/10 flex items-center justify-center cursor-pointer flex-shrink-0 hover:bg-black/20 transition-colors"
                  onClick={handlePcSearch}
                >
                  <Search className="h-4 w-4 text-white" />
                </button>
              </div>

              {/* 语言选择器 */}
              <div ref={pcLangRef} className="relative inline-block ml-2.5 flex-shrink-0">
                <button
                  onClick={togglePcLang}
                  className="flex items-center gap-2 text-white text-xs hover:text-blue-200 transition-colors whitespace-nowrap"
                >
                  <img
                    src={currentLanguage.flag}
                    alt={currentLanguage.name}
                    className="w-7 h-auto 2xl:w-8"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <span>{currentLanguage.name}</span>
                </button>
                {isPcLangOpen && (
                  <div className={`absolute ${locale === 'ar' ? 'left-0' : 'right-0'} top-full mt-2 bg-white rounded-lg shadow-lg py-2 min-w-[130px] max-w-[180px] w-auto z-[9999] overflow-hidden`}>
                    {languages.map((lang) => (
                      <div
                        key={lang.code}
                        onClick={() => {
                          setIsPcLangOpen(false);
                          handleLanguageChange(lang.code);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-gray-900 hover:bg-blue-50 hover:text-blue-700 transition-colors whitespace-nowrap text-xs cursor-pointer"
                      >
                        <img
                          src={lang.flag}
                          alt={lang.name}
                          className="w-6 h-auto sm:w-7 2xl:w-8"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <span className="truncate max-w-[70px] sm:max-w-[90px]">{lang.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 主导航 */}
        <div
          className={`pc-main-nav flex items-center transition-all duration-500 ease-in-out overflow-visible relative ${
            scrollY > 80 ? 'bg-white shadow-md' : 'bg-transparent'
          }`}
          style={{ height: 'clamp(60px, 6vw, 90px)' }}
        >
          <div className="w-full max-w-[1920px] mx-auto flex items-center justify-end mr-[clamp(100px,8vw,300px)] ml-[clamp(220px,calc(140px+14vw),780px)] relative">
            <ul className="list-none flex gap-[clamp(20px,2vw,60px)] items-center flex-nowrap whitespace-nowrap">
              {navItems.map((item) => (
                <li
                  key={item.key}
                  className={`relative px-4 py-3 transition-all duration-300 whitespace-nowrap ${
                    isActive(item.href) ? 'nav-active' : ''
                  }`}
                >
                  <Link
                    href={item.href}
                    className={`text-base font-bold transition-colors duration-500 ease-in-out whitespace-nowrap ${
                      isScrolled
                        ? 'text-gray-600'
                        : 'text-white'
                    }`}
                  >
                    {navTranslations[item.key as keyof typeof navTranslations]}
                  </Link>
                  {/* 上方线条 */}
                  <span
                    className={`absolute left-0 right-0 h-[2px] rounded transition-opacity duration-500 ease-in-out ${
                      isActive(item.href) ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      backgroundColor: isScrolled ? '#777' : '#fff',
                      top: '4px',
                    }}
                  />
                  {/* 下方线条 */}
                  <span
                    className={`absolute left-0 right-0 h-[2px] rounded transition-opacity duration-500 ease-in-out ${
                      isActive(item.href) ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      backgroundColor: isScrolled ? '#777' : '#fff',
                      bottom: '4px',
                    }}
                  />
                </li>
              ))}

              {/* 消息图标 */}
              <li className="ml-2 flex-shrink-0">
                <div ref={messageRef} className="relative">
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        // 未登录时打开登录弹窗
                        setIsAuthModalOpen(true);
                      } else {
                        // 已登录时打开消息预览
                        setIsMessageOpen(!isMessageOpen);
                      }
                    }}
                    className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-300 ${
                      isScrolled
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                    }`}
                    title={isLoggedIn ? t('messages') : t('signInToViewMessages')}
                  >
                    <MessageSquare className="h-5 w-5" />
                    {isLoggedIn && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold animate-bounce-notify shadow-lg">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* 消息预览下拉菜单 */}
                  {isMessageOpen && (
                    <div className="absolute right-0 top-full mt-2 min-w-[384px] w-96 bg-white rounded-lg shadow-xl border border-gray-200 overflow-visible z-[9999]">
                      <div className="px-5 py-4 bg-blue-50 border-b border-gray-200 flex items-center justify-between">
                        <span className="text-base font-bold text-gray-900">{tMessageCard('messages')}</span>
                        {unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold">
                            {unreadCount} {tMessageCard('new')}
                          </span>
                        )}
                      </div>

                      {/* 消息列表 */}
                      <div className="max-h-96 overflow-y-auto overflow-x-hidden">
                        {messages.length === 0 ? (
                          <div className="px-5 py-10 text-center text-gray-500 text-sm">
                            {tMessageCard('noMessages')}
                          </div>
                        ) : (
                          messages.map((message) => (
                            <div
                              key={message.id}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsMessageOpen(false);
                                // 跳转到消息详情页面，并标记为已读
                                window.location.href = `/${locale}/messages?messageId=${message.id}`;
                              }}
                              className={`px-5 py-4 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors overflow-hidden min-w-0 ${
                                message.unread ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-4 min-w-0">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                  message.type === 'reply' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {message.type === 'reply' ? <Bell className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-1">
                                    <span className={`text-sm font-semibold ${message.unread ? 'text-gray-900' : 'text-gray-600'}`}>
                                      {message.title}
                                    </span>
                                    <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{message.time}</span>
                                  </div>
                                  <p className={`text-sm mt-1 ${message.unread ? 'text-gray-700' : 'text-gray-500'}`}>
                                    {message.preview}
                                  </p>
                                </div>
                                {message.unread && (
                                  <div className="flex-shrink-0 w-2.5 h-2.5 bg-blue-600 rounded-full mt-2" />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* 底部按钮 */}
                      <div className="px-5 py-4 bg-gray-50 border-t border-gray-200">
                        <Link
                          href={`/${locale}/messages?folder=inquiries`}
                          onClick={() => setIsMessageOpen(false)}
                          className="flex items-center justify-center gap-2 w-full py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors text-sm"
                        >
                          <MessageSquare className="h-4 w-4" />
                          <span>{tMessageCard('viewAll')}</span>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </li>

              {/* 登录按钮 */}
              <li className="ml-4 flex-shrink-0">
                {isLoggedIn ? (
                  <div ref={userMenuRef} className="relative">
                    <button
                      ref={userButtonRef}
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-full font-medium transition-all duration-300 whitespace-nowrap ${
                        isScrolled
                          ? 'bg-gray-100 hover:bg-gray-200'
                          : 'bg-white/15 hover:bg-white/25 backdrop-blur-sm'
                      }`}
                      title="Click to view menu"
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0 ${
                        authUser?.avatarUrl 
                          ? 'ring-2 ring-white/50' 
                          : (userRole === 'AGENT' ? 'bg-green-500' : 'bg-blue-500')
                      }`}>
                        {authUser ? (
                          <Image
                            src={getUserAvatar(authUser, 32)}
                            alt={authUser.name || 'User'}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            unoptimized // 允许外部 URL
                          />
                        ) : (
                          <span className="text-white font-bold text-sm">
                            {userRole === 'AGENT' ? 'A' : 'U'}
                          </span>
                        )}
                      </div>
                      <span className={`text-sm font-medium ${isScrolled ? 'text-gray-700' : 'text-white'}`}>
                        {authUser?.username || authUser?.internalEmailName || authUser?.name || (userRole === 'AGENT' ? 'Agent' : 'User')}
                      </span>
                    </button>

                    {/* 用户卡片 */}
                    {isUserMenuOpen && (
                      <UserCard
                        locale={locale}
                        onClose={() => setIsUserMenuOpen(false)}
                        buttonRef={userButtonRef}
                      />
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all duration-300 whitespace-nowrap ${
                      isScrolled
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm'
                    }`}
                  >
                    <User className="h-5 w-5" />
                    <span>{t('signIn')}</span>
                  </button>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* 登录/注册模态框 */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={handleAuthModalClose}
          locale={locale}
        />
      </div>
    </div>
  );
}

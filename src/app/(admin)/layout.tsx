'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Shield,
  Users,
  Package,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  LucideIcon,
  Database,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import FrontendSwitchButton from '@/components/FrontendSwitchButton';
import { AdminLocaleProvider, useAdminLocale } from '@/contexts/AdminLocaleContext';
import AdminLanguageSwitcher from '@/components/admin/AdminLanguageSwitcher';
import { ToastProvider } from '@/components/ui/Toast';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar_url?: string;
}

// 菜单配置（支持子菜单）
interface MenuItemConfig {
  icon: LucideIcon;
  path: string;
  labelKey: string;
  children?: { path: string; labelKey: string }[];
}

const menuConfig: MenuItemConfig[] = [
  { icon: LayoutDashboard, path: '/admin', labelKey: 'nav.dashboard' },
  { icon: Users, path: '/admin/users', labelKey: 'nav.users' },
  { 
    icon: Package, 
    path: '/admin/products', 
    labelKey: 'nav.products',
    children: [
      { path: '/admin/products', labelKey: 'nav.productsList' },
    ]
  },
  { 
    icon: Database, 
    path: '/admin/spu', 
    labelKey: 'nav.spu',
    children: [
      { path: '/admin/products/upload', labelKey: 'nav.spuCreate' },
      { path: '/admin/spu-requests', labelKey: 'nav.spuRequests' },
      { path: '/admin/spu', labelKey: 'nav.spuList' },
    ]
  },
  { icon: FileText, path: '/admin/inquiries', labelKey: 'nav.inquiries' },
  { icon: Database, path: '/admin/customs', labelKey: 'nav.customs' },
  { icon: RefreshCw, path: '/admin/data-sync', labelKey: 'nav.dataSync' },
  { icon: Settings, path: '/admin/settings', labelKey: 'nav.settings' },
];

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useAdminLocale();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // 获取翻译后的菜单项
  const menuItems = menuConfig.map(item => ({
    ...item,
    label: t(item.labelKey),
    children: item.children?.map(child => ({
      ...child,
      label: t(child.labelKey),
    })),
  }));

  // 自动展开当前激活的子菜单
  useEffect(() => {
    menuConfig.forEach(item => {
      if (item.children) {
        const isChildActive = item.children.some(child => 
          pathname === child.path || pathname.startsWith(child.path + '/')
        );
        if (isChildActive && !expandedMenus.includes(item.path)) {
          setExpandedMenus(prev => [...prev, item.path]);
        }
      }
    });
  }, [pathname]);

  useEffect(() => {
    // 登录页面不需要验证
    if (pathname === '/admin/login') {
      setLoading(false);
      return;
    }

    // 检查登录状态
    const token = localStorage.getItem('admin_token');
    const userData = localStorage.getItem('admin_user');

    if (!token || !userData) {
      router.push('/admin/login');
      return;
    }

    try {
      setUser(JSON.parse(userData));
    } catch {
      router.push('/admin/login');
      return;
    }

    setLoading(false);
  }, [router, pathname]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    router.push('/admin/login');
  };

  // 登录页面直接渲染 children
  if (pathname === '/admin/login') {
    return (
      <html lang="en">
        <body className="antialiased">
          {children}
        </body>
      </html>
    );
  }

  if (loading) {
    return (
      <html lang="en">
        <body className="antialiased">
          <div className="min-h-screen flex items-center justify-center bg-slate-900">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen bg-slate-900">
      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen transition-transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-slate-800 border-r border-slate-700 w-64`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold">{t('common.siteName')}</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
            // 判断是否有子菜单
            const hasChildren = item.children && item.children.length > 0;
            
            // 数据看板只精确匹配 /admin，其他菜单匹配前缀
            const isActive = item.path === '/admin' 
              ? pathname === '/admin'
              : pathname === item.path || pathname.startsWith(item.path + '/');
            
            // 判断子菜单是否有激活项
            const isChildActive = item.children?.some(child => 
              pathname === child.path || pathname.startsWith(child.path + '/')
            ) || false;
            
            // 是否展开子菜单
            const isExpanded = expandedMenus.includes(item.path);
            
            const handleClick = () => {
              if (hasChildren) {
                // 切换展开状态
                setExpandedMenus(prev => 
                  prev.includes(item.path) 
                    ? prev.filter(p => p !== item.path)
                    : [...prev, item.path]
                );
              } else {
                // 如果点击的是当前页面，触发自定义事件让页面重置状态
                if (pathname === item.path) {
                  window.dispatchEvent(new CustomEvent('admin-menu-click-same-path', { 
                    detail: { path: item.path } 
                  }));
                }
                router.push(item.path);
              }
            };
            
            return (
              <div key={item.path}>
                <button
                  onClick={handleClick}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    (hasChildren ? isChildActive : isActive)
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </div>
                  {hasChildren && (
                    isExpanded 
                      ? <ChevronDown className="h-4 w-4" />
                      : <ChevronRight className="h-4 w-4" />
                  )}
                </button>
                
                {/* 子菜单 */}
                {hasChildren && isExpanded && (
                  <div className="mt-1 ml-4 pl-4 border-l border-slate-600 space-y-1">
                    {item.children!.map((child) => {
                      const childIsActive = pathname === child.path || pathname.startsWith(child.path + '/');
                      return (
                        <button
                          key={child.path}
                          onClick={() => {
                            // 如果点击的是当前页面，触发自定义事件让页面重置状态
                            if (pathname === child.path) {
                              window.dispatchEvent(new CustomEvent('admin-menu-click-same-path', { 
                                detail: { path: child.path } 
                              }));
                            }
                            router.push(child.path);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-sm ${
                            childIsActive
                              ? 'bg-blue-600/20 text-blue-400'
                              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                          }`}
                        >
                          <span>{child.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className={`${sidebarOpen ? 'lg:ml-64' : ''} h-screen flex flex-col overflow-hidden`}>
        {/* Header */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 flex-shrink-0 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-400 hover:text-white lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* 返回前台 */}
            <a
              href="/"
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">{t('nav.backToFrontend')}</span>
            </a>

            {/* Language Switcher */}
            <AdminLanguageSwitcher />

            {/* User Menu */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </div>
              <span className="text-white hidden md:block">{user?.name || 'Admin'}</span>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
                title={t('nav.logout')}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Frontend Switch Button */}
      <FrontendSwitchButton />
    </div>
      </body>
    </html>
  );
}

export default function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminLocaleProvider>
      <ToastProvider>
        <AdminLayoutContent>{children}</AdminLayoutContent>
      </ToastProvider>
    </AdminLocaleProvider>
  );
}

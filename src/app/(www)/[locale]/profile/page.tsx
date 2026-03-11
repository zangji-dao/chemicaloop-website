'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import Header from '@/components/Header';
import AuthModal from '@/components/AuthModal';
import { useToast } from '@/components/ui/Toast';
import { ContactCard } from '@/components/ContactCard';
import { getToken, getUser, saveUser } from '@/services/authService';
import type { AddressData } from '@/components/AddressPicker';
import {
  Shield,
  MessageSquare,
  LogOut,
  User,
  Mail,
  Calendar,
  Edit2,
  Building2,
  Plus,
  Search,
  X,
  Loader2,
  Package,
  Users,
  Trash2,
  Briefcase,
  MapPin,
  Globe,
  Phone,
  Save,
} from 'lucide-react';

// 动态导入 AddressPicker，禁用 SSR（Leaflet 需要 window 对象）
const AddressPicker = dynamic(() => import('@/components/AddressPicker'), {
  ssr: false,
  loading: () => (
    <div className="h-12 bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
      <span className="text-gray-400 text-sm">加载地图组件...</span>
    </div>
  ),
});

type ActiveTab = 'profile' | 'security' | 'messages' | 'agent';

export default function UserCenterPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading, isLoggedIn, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 从 pathname 中提取语言（验证有效性）
  const validLocales = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'];
  const pathParts = pathname.split('/');
  const rawLocale = pathParts[1] || 'en';
  const locale = validLocales.includes(rawLocale) ? rawLocale : 'en';

  // 使用 useEffect 延迟跳转，避免在渲染时调用 router.push
  useEffect(() => {
    if (!isLoading && !isLoggedIn) {
      // 不自动跳转，显示登录提示
    }
  }, [isLoading, isLoggedIn, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleNavigateToMessages = (folder: string = 'inbox') => {
    router.push(`/${locale}/messages?folder=${folder}`);
  };

  const navItems = [
    { id: 'profile' as ActiveTab, icon: User, label: '个人资料' },
    { id: 'security' as ActiveTab, icon: Shield, label: '账户安全' },
    {
      id: 'messages' as ActiveTab,
      icon: MessageSquare,
      label: '消息中心',
      badge: 3,
      onClick: () => handleNavigateToMessages('inbox')
    },
    { id: 'agent' as ActiveTab, icon: Building2, label: '代理大厅' },
  ];

  // 如果正在加载，显示加载状态
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

  // 如果没有登录，显示登录提示
  if (!isLoggedIn || !user) {
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
                User Center
              </h1>
              <p className="text-lg md:text-xl opacity-90">
                Manage your profile, inquiries, and account settings
              </p>
            </div>
          </div>
        </section>

        {/* Login Required */}
        <main className="flex-1 flex items-center justify-center px-4 py-16">
          <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="h-10 w-10 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Login Required
            </h2>
            <p className="text-gray-600 mb-8">
              Please sign in to access your user center and manage your account.
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <User className="h-5 w-5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <Header />

      {/* Page Banner */}
      <section className="relative h-64 bg-gradient-to-r from-blue-900 to-blue-700 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1920&q=80')] bg-cover bg-center opacity-20" />
        <div className="relative h-full flex items-end justify-center px-4 pb-8">
          <div className="text-center text-white max-w-4xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-3">
              User Center
            </h1>
            <p className="text-lg md:text-xl opacity-90">
              Manage your profile, inquiries, and account settings
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar */}
            <aside className="w-64 flex-shrink-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <nav className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    
                    // 检查是否有自定义点击处理
                    const handleClick = item.onClick || (() => setActiveTab(item.id));
                    
                    return (
                      <button
                        key={item.id}
                        onClick={handleClick}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Content Area */}
            <section className="flex-1 min-w-0">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {renderContent(activeTab)}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );

  function renderContent(tab: ActiveTab) {
    switch (tab) {
      case 'profile':
        return <ProfileContent user={user} locale={locale} />;
      case 'security':
        return <SecurityContent user={user} />;
      case 'messages':
        return <MessagesContent />;
      case 'agent':
        return <AgentHallContent user={user} />;
      default:
        return <ProfileContent user={user} locale={locale} />;
    }
  }
}

function ProfileContent({ user, locale }: { user: any; locale: string }) {
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [editingUsername, setEditingUsername] = useState(false); // 是否在编辑用户名
  const [usernameSaved, setUsernameSaved] = useState(false); // 用户名保存成功状态
  const [usernameError, setUsernameError] = useState(''); // 用户名保存错误信息
  
  // 表单状态
  const [formData, setFormData] = useState({
    email: '', // 注册邮箱
    wechat: '',
    whatsapp: '',
    telegram: '',
    messenger: '',
    line: '',
    viber: '',
    instagram: '',
    linkedin: '',
    tiktok: '',
    quickEmail: '',
  });
  
  // 地址选择状态
  const [addressData, setAddressData] = useState<AddressData | null>(null);
  const [addressSaved, setAddressSaved] = useState(false);

  // 即时通讯配置
  const instantMessengers = [
    { id: 'wechat', label: '微信', icon: '💬', placeholder: '请输入微信号' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '📱', placeholder: '请输入 WhatsApp 号码' },
    { id: 'telegram', label: 'Telegram', icon: '✈️', placeholder: '请输入 Telegram 用户名' },
    { id: 'messenger', label: 'Messenger', icon: '💬', placeholder: '请输入 Messenger ID' },
    { id: 'line', label: 'LINE', icon: '🟢', placeholder: '请输入 LINE ID' },
    { id: 'viber', label: 'Viber', icon: '📞', placeholder: '请输入 Viber 号码' },
  ];

  // 加载用户资料
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
          setUsername(data.data.username || '');
          
          // 解析地址信息
          if (data.data.country) {
            setAddressData({
              formatted: data.data.city 
                ? `${data.data.country} / ${data.data.city}` 
                : data.data.country,
              country: data.data.country,
              countryCode: '',
              state: data.data.city ? data.data.city.split('/')[0] : '',
              city: data.data.city ? data.data.city.split('/')[1] || data.data.city.split('/')[0] : '',
              district: '',
              street: '',
              postcode: '',
              lat: 0,
              lng: 0,
            });
          }
          
          setFormData({
            email: data.data.email || '',
            wechat: data.data.wechat || '',
            whatsapp: data.data.whatsapp || '',
            telegram: data.data.telegram || '',
            messenger: data.data.messenger || '',
            line: data.data.line || '',
            viber: data.data.viber || '',
            instagram: data.data.instagram || '',
            linkedin: data.data.linkedin || '',
            tiktok: data.data.tiktok || '',
            quickEmail: data.data.quickEmail || '',
          });
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  // 检查用户名是否可用
  const checkUsername = async (value: string) => {
    if (value.length < 3) {
      setUsernameAvailable(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/profile/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: value, currentUserId: user.id }),
      });

      const data = await response.json();
      setUsernameAvailable(data.available);
    } catch (error) {
      console.error('Failed to check username:', error);
    } finally {
      setCheckingUsername(false);
    }
  };

  // 设置/修改用户名
  const handleSetUsername = async () => {
    if (!username || username.length < 2) return;

    setLoading(true);
    setUsernameError('');
    try {
      const token = getToken();
      const response = await fetch('/api/profile/set-username', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      console.log('[SetUsername] Response:', data);
      
      if (data.success) {
        setProfile({ ...profile, username: data.data.username });
        setEditingUsername(false);
        setUsernameSaved(true);
        
        // 更新 localStorage 中的用户数据（使用 authService 统一方法）
        const currentUser = getUser();
        if (currentUser) {
          const updatedUser = { ...currentUser, username: data.data.username };
          console.log('[SetUsername] Updated user:', updatedUser);
          saveUser(updatedUser);
        }
        
        // 刷新全局用户状态（Header 和 UserCard 会更新）
        await refreshUser();
        console.log('[SetUsername] User refreshed');
        
        // 3秒后隐藏成功提示
        setTimeout(() => setUsernameSaved(false), 3000);
      } else {
        setUsernameError(data.error || '设置失败');
      }
    } catch (error) {
      console.error('Failed to set username:', error);
      setUsernameError('设置失败');
    } finally {
      setLoading(false);
    }
  };

  // 取消编辑用户名
  const cancelEditUsername = () => {
    setUsername(profile?.username || '');
    setUsernameAvailable(null);
    setUsernameError('');
    setEditingUsername(false);
  };

  // 开始编辑用户名时清除状态
  const startEditUsername = () => {
    setEditingUsername(true);
    setUsernameSaved(false);
    setUsernameError('');
  };

  // ═══ 地址选择功能 ═══
  
  // 处理地址变化
  const handleAddressChange = async (newAddress: AddressData) => {
    setAddressData(newAddress);
    
    // 自动保存地址
    if (newAddress.formatted) {
      setLoading(true);
      try {
        const token = getToken();
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'X-User-ID': user.id,
          },
          body: JSON.stringify({
            country: newAddress.country,
            city: [newAddress.state, newAddress.city].filter(Boolean).join('/'),
          }),
        });

        const data = await response.json();
        
        if (data.success) {
          setAddressSaved(true);
          await loadProfile();
          
          // 3秒后隐藏成功提示
          setTimeout(() => setAddressSaved(false), 3000);
        }
      } catch (error) {
        console.error('Failed to save address:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  // 保存单个通讯方式
  const handleSaveSingleContact = async (id: string, value: string): Promise<boolean> => {
    try {
      const token = getToken();
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
        body: JSON.stringify({ [id]: value }),
      });

      const data = await response.json();
      if (data.success) {
        // 更新本地状态
        setFormData(prev => ({ ...prev, [id]: value }));
        await loadProfile();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save contact:', error);
      return false;
    }
  };

  return (
    <div className="space-y-8">
      {/* ═══ 账户信息卡片 ═══ */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">账户信息</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 用户名 */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500">用户名</label>
            {editingUsername ? (
              <div className="flex items-center gap-2">
                <span className="text-gray-500">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    checkUsername(e.target.value);
                  }}
                  placeholder="请输入用户名"
                  className="w-32 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                {checkingUsername && (
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-600 border-t-transparent" />
                )}
                {!checkingUsername && usernameAvailable === true && username !== profile?.username && (
                  <span className="text-green-600 text-xs">✓</span>
                )}
                {!checkingUsername && usernameAvailable === false && (
                  <span className="text-red-600 text-xs">✗</span>
                )}
                {usernameError && (
                  <span className="text-red-600 text-xs">{usernameError}</span>
                )}
                <button
                  onClick={handleSetUsername}
                  disabled={!username || username.length < 2 || usernameAvailable === false || loading || username === profile?.username}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {loading ? '...' : '保存'}
                </button>
                <button
                  onClick={cancelEditUsername}
                  className="px-2 py-1 text-gray-500 text-xs hover:text-gray-700"
                >
                  取消
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-gray-900 font-medium">
                  {profile?.username ? `@${profile.username}` : '未设置'}
                </span>
                <button
                  onClick={startEditUsername}
                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="修改用户名"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                {usernameSaved && (
                  <span className="text-green-600 text-xs">✓ 已保存</span>
                )}
              </div>
            )}
          </div>

          {/* 站内邮箱 */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500">站内邮箱</label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {profile?.internalEmail || `${profile?.internalEmailName || '未设置'}@chemicaloop`}
                <span className="text-gray-400 ml-1">（不可修改）</span>
              </span>
            </div>
          </div>

          {/* 用户类型 */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500">用户类型</label>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              user.role === 'AGENT' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role === 'AGENT' ? '代理用户' : '普通用户'}
            </span>
          </div>

          {/* 注册时间 */}
          <div className="space-y-1">
            <label className="text-sm text-gray-500">注册时间</label>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-gray-900">
                {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : '-'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ 地址信息卡片 ═══ */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">地址信息</h3>
          {addressSaved && (
            <span className="text-green-600 text-sm">✓ 保存成功</span>
          )}
        </div>
        
        <AddressPicker
          value={addressData}
          onChange={handleAddressChange}
          placeholder="搜索并选择您的地址..."
          locale={locale}
        />
        
        <p className="text-xs text-gray-500 mt-2">
          输入国家、城市或街道名称搜索，支持全球地址搜索
        </p>
      </div>

      {/* ═══ 即时通讯联系方式 ═══ */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">即时通讯</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {instantMessengers.map((contact) => (
            <ContactCard
              key={contact.id}
              id={contact.id}
              label={contact.label}
              icon={contact.icon}
              value={formData[contact.id as keyof typeof formData] || ''}
              placeholder={contact.placeholder}
              onSave={handleSaveSingleContact}
              locale={locale}
            />
          ))}
        </div>
      </div>

    </div>
  );
}

function SecurityContent({ user }: { user: any }) {
  const { refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  
  // 修改邮箱状态
  const [editingEmail, setEditingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [emailError, setEmailError] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  
  // 修改密码状态
  const [editingPassword, setEditingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  
  // 加载用户资料
  useEffect(() => {
    loadProfile();
  }, [user]);
  
  const loadProfile = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch('/api/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfile(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };
  
  // 发送邮箱验证码
  const sendEmailCode = async () => {
    if (!newEmail) {
      setEmailError('请输入新邮箱');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setEmailError('邮箱格式不正确');
      return;
    }
    
    setSendingCode(true);
    setEmailError('');
    
    try {
      const response = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, type: 'change_email' }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setEmailError(data.error || '发送验证码失败');
      }
    } catch (error) {
      setEmailError('发送验证码失败');
    } finally {
      setSendingCode(false);
    }
  };
  
  // 保存新邮箱
  const saveNewEmail = async () => {
    if (!newEmail || !emailCode) {
      setEmailError('请输入新邮箱和验证码');
      return;
    }
    
    setLoading(true);
    setEmailError('');
    
    try {
      const token = getToken();
      const response = await fetch('/api/profile/change-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newEmail, code: emailCode }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingEmail(false);
        setEmailSaved(true);
        await loadProfile();
        await refreshUser();
        setTimeout(() => setEmailSaved(false), 3000);
      } else {
        setEmailError(data.error || '修改失败');
      }
    } catch (error) {
      setEmailError('修改失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 修改密码
  const changePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('请填写所有密码字段');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('新密码至少6位');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('两次密码输入不一致');
      return;
    }
    
    setLoading(true);
    setPasswordError('');
    
    try {
      const token = getToken();
      const response = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEditingPassword(false);
        setPasswordSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSaved(false), 3000);
      } else {
        setPasswordError(data.error || '修改失败');
      }
    } catch (error) {
      setPasswordError('修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h2 className="text-xl font-semibold text-gray-900">账户安全</h2>
      
      {/* ═══ 注册邮箱卡片 ═══ */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">注册邮箱</h3>
        
        {!editingEmail ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <span className="text-gray-900">{profile?.email || '未设置'}</span>
                {profile?.email && (
                  <span className={`ml-2 text-sm ${profile?.verified ? 'text-green-600' : 'text-yellow-600'}`}>
                    {profile?.verified ? '✓ 已验证' : '⏳ 未验证'}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {emailSaved && (
                <span className="text-green-600 text-sm">✓ 修改成功</span>
              )}
              <button
                onClick={() => {
                  setEditingEmail(true);
                  setNewEmail(profile?.email || '');
                  setEmailError('');
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="修改邮箱"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">新邮箱</label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="请输入新邮箱"
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={sendEmailCode}
                  disabled={sendingCode || countdown > 0}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {sendingCode ? '发送中...' : countdown > 0 ? `${countdown}s` : '发送验证码'}
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">验证码</label>
              <input
                type="text"
                value={emailCode}
                onChange={(e) => setEmailCode(e.target.value)}
                placeholder="请输入验证码"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {emailError && (
              <p className="text-red-500 text-sm">{emailError}</p>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingEmail(false);
                  setEmailCode('');
                  setEmailError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={saveNewEmail}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ 登录密码卡片 ═══ */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">登录密码</h3>
        
        {!editingPassword ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">••••••••</span>
            </div>
            <div className="flex items-center gap-2">
              {passwordSaved && (
                <span className="text-green-600 text-sm">✓ 修改成功</span>
              )}
              <button
                onClick={() => {
                  setEditingPassword(true);
                  setPasswordError('');
                }}
                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="修改密码"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">当前密码</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="请输入当前密码"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="请输入新密码（至少6位）"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm text-gray-500 mb-1">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="请再次输入新密码"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {passwordError && (
              <p className="text-red-500 text-sm">{passwordError}</p>
            )}
            
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingPassword(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                取消
              </button>
              <button
                onClick={changePassword}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MessagesContent() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">消息中心</h2>
      <div className="text-center py-8">
        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">请访问消息中心查看所有消息</p>
      </div>
    </div>
  );
}

function AgentHallContent({ user }: { user: any }) {
  const [activeTab, setActiveTab] = useState<'info' | 'products' | 'query'>('info');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // 代理商信息状态
  const [agentInfo, setAgentInfo] = useState<any>(null);
  const [agentInfoLoading, setAgentInfoLoading] = useState(false);
  const [agentInfoSaving, setAgentInfoSaving] = useState(false);
  const [agentInfoForm, setAgentInfoForm] = useState({
    companyName: '',
    contactPerson: '',
    country: '',
    city: '',
    address: '',
    phone: '',
    wechat: '',
    whatsapp: '',
    telegram: '',
    messenger: '',
    line: '',
    viber: '',
    website: '',
    description: '',
  });
  
  // 产品表单状态
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    cas: '',
    name: '',
    purity: '',
    packageSpec: '',
    price: '',
    minOrder: '',
    stock: '',
    stockPublic: true,
    origin: '',
    remark: '',
  });
  
  // 报价查询状态
  const [queryCas, setQueryCas] = useState('');
  const [queryResults, setQueryResults] = useState<any>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  
  // 询价弹窗状态
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquirySupplier, setInquirySupplier] = useState<any>(null);
  const [inquiryForm, setInquiryForm] = useState({
    quantity: '',
    message: '',
  });
  const [inquirySending, setInquirySending] = useState(false);

  // 加载代理商信息和产品列表
  useEffect(() => {
    if (user?.role === 'AGENT') {
      loadAgentInfo();
      loadProducts();
    }
  }, [user]);

  // 加载代理商信息
  const loadAgentInfo = async () => {
    setAgentInfoLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`/api/profile/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
      });
      const data = await response.json();
      if (data.success && data.data) {
        setAgentInfo(data.data);
        setAgentInfoForm({
          companyName: data.data.companyName || data.data.name || '',
          contactPerson: data.data.contactPerson || data.data.username || '',
          country: data.data.country || '',
          city: data.data.city || '',
          address: data.data.address || '',
          phone: data.data.phone || '',
          wechat: data.data.wechat || '',
          whatsapp: data.data.whatsapp || '',
          telegram: data.data.telegram || '',
          messenger: data.data.messenger || '',
          line: data.data.line || '',
          viber: data.data.viber || '',
          website: data.data.website || '',
          description: data.data.description || '',
        });
      }
    } catch (error) {
      console.error('Load agent info error:', error);
    } finally {
      setAgentInfoLoading(false);
    }
  };

  // 保存代理商信息
  const saveAgentInfo = async () => {
    setAgentInfoSaving(true);
    try {
      const token = getToken();
      const response = await fetch('/api/agent/info', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
        body: JSON.stringify(agentInfoForm),
      });
      const data = await response.json();
      if (data.success) {
        alert('保存成功');
        loadAgentInfo();
      } else {
        alert(data.error || '保存失败');
      }
    } catch (error) {
      console.error('Save agent info error:', error);
      alert('保存失败');
    } finally {
      setAgentInfoSaving(false);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const response = await fetch('/api/agent/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
      });
      const data = await response.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Load products error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 保存产品
  const saveProduct = async () => {
    if (!productForm.cas || !productForm.name) {
      alert('请填写CAS码和产品名称');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      const url = editingProduct 
        ? `/api/agent/products/${editingProduct.id}`
        : '/api/agent/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
        body: JSON.stringify({
          cas: productForm.cas,
          name: productForm.name,
          purity: productForm.purity || null,
          packageSpec: productForm.packageSpec || null,
          price: productForm.price ? parseFloat(productForm.price) : null,
          minOrder: productForm.minOrder ? parseInt(productForm.minOrder) : null,
          stock: productForm.stock ? parseInt(productForm.stock) : null,
          stockPublic: productForm.stockPublic,
          origin: productForm.origin || null,
          remark: productForm.remark || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowProductForm(false);
        setEditingProduct(null);
        resetProductForm();
        loadProducts();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Save product error:', error);
      alert('保存失败');
    } finally {
      setLoading(false);
    }
  };

  // 删除产品
  const deleteProduct = async (productId: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/agent/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
      });

      const data = await response.json();
      if (data.success) {
        loadProducts();
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Delete product error:', error);
    }
  };

  // 切换上下架状态
  const toggleProductStatus = async (productId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/agent/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
      });

      const data = await response.json();
      if (data.success) {
        loadProducts();
      }
    } catch (error) {
      console.error('Toggle status error:', error);
    }
  };

  // 重新提交审核
  const resubmitProduct = async (productId: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/agent/products/${productId}/resubmit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-User-ID': user.id,
        },
      });

      const data = await response.json();
      if (data.success) {
        loadProducts();
      } else {
        alert(data.error || '重新提交失败');
      }
    } catch (error) {
      console.error('Resubmit product error:', error);
      alert('重新提交失败');
    }
  };

  // 查询供应商报价
  const searchSuppliers = async () => {
    if (!queryCas.trim()) return;

    setQueryLoading(true);
    try {
      const response = await fetch(`/api/products/${queryCas.trim()}/suppliers`);
      const data = await response.json();
      if (data.success) {
        setQueryResults(data.data);
      } else {
        alert(data.error);
      }
    } catch (error) {
      console.error('Query suppliers error:', error);
      alert('查询失败');
    } finally {
      setQueryLoading(false);
    }
  };

  // 重置表单
  const resetProductForm = () => {
    setProductForm({
      cas: '',
      name: '',
      purity: '',
      packageSpec: '',
      price: '',
      minOrder: '',
      stock: '',
      stockPublic: true,
      origin: '',
      remark: '',
    });
  };

  // 编辑产品
  const editProduct = (product: any) => {
    setEditingProduct(product);
    setProductForm({
      cas: product.cas,
      name: product.name,
      purity: product.purity || '',
      packageSpec: product.packageSpec || '',
      price: product.price || '',
      minOrder: product.minOrder || '',
      stock: product.stock || '',
      stockPublic: product.stockPublic,
      origin: product.origin || '',
      remark: product.remark || '',
    });
    setShowProductForm(true);
  };

  // 过滤产品列表
  const filteredProducts = products.filter(p => 
    p.cas.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 如果不是代理用户，显示申请提示
  if (user?.role !== 'AGENT') {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">代理大厅</h2>
        <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
          <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">您还不是代理用户</h3>
          <p className="text-gray-600 mb-6">成为代理用户后，可使用代理大厅的所有功能</p>
          <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            申请成为代理
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">代理大厅</h2>

      {/* Tab 切换 */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'info' 
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          代理商信息
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'products' 
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package className="h-4 w-4" />
          产品管理
        </button>
        <button
          onClick={() => setActiveTab('query')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
            activeTab === 'query' 
              ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Users className="h-4 w-4" />
          报价查询
        </button>
      </div>

      {/* 代理商信息 */}
      {activeTab === 'info' && (
        <div className="space-y-6">
          {agentInfoLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-medium text-gray-900">基本信息</h3>
                <p className="text-sm text-gray-500 mt-1">管理您的代理商资料，这些信息将展示给潜在客户</p>
              </div>
              
              <div className="p-6 space-y-6">
                {/* 公司名称和联系人 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      公司名称 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={agentInfoForm.companyName}
                      onChange={(e) => setAgentInfoForm({ ...agentInfoForm, companyName: e.target.value })}
                      placeholder="请输入公司名称"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      联系人 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={agentInfoForm.contactPerson}
                      onChange={(e) => setAgentInfoForm({ ...agentInfoForm, contactPerson: e.target.value })}
                      placeholder="请输入联系人姓名"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 地区信息 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="h-4 w-4 inline mr-1" />
                      国家/地区
                    </label>
                    <input
                      type="text"
                      value={agentInfoForm.country}
                      onChange={(e) => setAgentInfoForm({ ...agentInfoForm, country: e.target.value })}
                      placeholder="如：中国"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">城市</label>
                    <input
                      type="text"
                      value={agentInfoForm.city}
                      onChange={(e) => setAgentInfoForm({ ...agentInfoForm, city: e.target.value })}
                      placeholder="如：上海"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="h-4 w-4 inline mr-1" />
                      联系电话
                    </label>
                    <input
                      type="text"
                      value={agentInfoForm.phone}
                      onChange={(e) => setAgentInfoForm({ ...agentInfoForm, phone: e.target.value })}
                      placeholder="如：+86 138 0000 0000"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* 详细地址 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">详细地址</label>
                  <input
                    type="text"
                    value={agentInfoForm.address}
                    onChange={(e) => setAgentInfoForm({ ...agentInfoForm, address: e.target.value })}
                    placeholder="请输入详细地址"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* 即时通讯 */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">即时通讯方式</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">微</span>
                          微信
                        </span>
                      </label>
                      <input
                        type="text"
                        value={agentInfoForm.wechat}
                        onChange={(e) => setAgentInfoForm({ ...agentInfoForm, wechat: e.target.value })}
                        placeholder="微信号"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center text-white text-xs">W</span>
                          WhatsApp
                        </span>
                      </label>
                      <input
                        type="text"
                        value={agentInfoForm.whatsapp}
                        onChange={(e) => setAgentInfoForm({ ...agentInfoForm, whatsapp: e.target.value })}
                        placeholder="WhatsApp 号码"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-4 h-4 bg-sky-500 rounded-full flex items-center justify-center text-white text-xs">T</span>
                          Telegram
                        </span>
                      </label>
                      <input
                        type="text"
                        value={agentInfoForm.telegram}
                        onChange={(e) => setAgentInfoForm({ ...agentInfoForm, telegram: e.target.value })}
                        placeholder="Telegram 用户名"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Messenger</label>
                      <input
                        type="text"
                        value={agentInfoForm.messenger}
                        onChange={(e) => setAgentInfoForm({ ...agentInfoForm, messenger: e.target.value })}
                        placeholder="Messenger 账号"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Line</label>
                      <input
                        type="text"
                        value={agentInfoForm.line}
                        onChange={(e) => setAgentInfoForm({ ...agentInfoForm, line: e.target.value })}
                        placeholder="Line 账号"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Viber</label>
                      <input
                        type="text"
                        value={agentInfoForm.viber}
                        onChange={(e) => setAgentInfoForm({ ...agentInfoForm, viber: e.target.value })}
                        placeholder="Viber 账号"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 网站和简介 */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Globe className="h-4 w-4 inline mr-1" />
                      公司网站
                    </label>
                    <input
                      type="text"
                      value={agentInfoForm.website}
                      onChange={(e) => setAgentInfoForm({ ...agentInfoForm, website: e.target.value })}
                      placeholder="https://www.example.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">公司简介</label>
                    <textarea
                      value={agentInfoForm.description}
                      onChange={(e) => setAgentInfoForm({ ...agentInfoForm, description: e.target.value })}
                      placeholder="请简要介绍您的公司、主营业务、优势等..."
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* 保存按钮 */}
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={saveAgentInfo}
                    disabled={agentInfoSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {agentInfoSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    保存信息
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 产品管理 */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* 工具栏 */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索CAS码或产品名称..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                setEditingProduct(null);
                resetProductForm();
                setShowProductForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              上架产品
            </button>
          </div>

          {/* 产品列表 */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">暂无产品，点击"上架产品"添加</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">产品名称</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">CAS码</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">纯度</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">包装</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">价格</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">状态</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">{product.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600 font-mono">{product.cas}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.purity || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{product.packageSpec || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {product.price ? `$${product.price}/kg` : '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                          product.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : product.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : product.status === 'approved'
                            ? 'bg-blue-100 text-blue-700'
                            : product.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.status === 'active' ? '已上架' : 
                           product.status === 'pending' ? '待审核' :
                           product.status === 'approved' ? '审核通过' :
                           product.status === 'rejected' ? '审核拒绝' : '已下架'}
                        </span>
                        {product.status === 'rejected' && product.reviewNote && (
                          <p className="text-xs text-red-500 mt-1">原因: {product.reviewNote}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => editProduct(product)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="编辑"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {/* 只有 active 和 inactive 状态可以切换上下架 */}
                          {(product.status === 'active' || product.status === 'inactive') && (
                            <button
                              onClick={() => toggleProductStatus(product.id)}
                              className={`px-2 py-1 text-xs rounded ${
                                product.status === 'active'
                                  ? 'text-orange-600 hover:bg-orange-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {product.status === 'active' ? '下架' : '上架'}
                            </button>
                          )}
                          {/* 被拒绝的产品可以重新提交 */}
                          {product.status === 'rejected' && (
                            <button
                              onClick={() => resubmitProduct(product.id)}
                              className="px-2 py-1 text-xs rounded text-yellow-600 hover:bg-yellow-50"
                            >
                              重新提交
                            </button>
                          )}
                          {/* pending 状态显示提示 */}
                          {product.status === 'pending' && (
                            <span className="text-xs text-gray-400">等待审核</span>
                          )}
                          {/* approved 状态显示提示 */}
                          {product.status === 'approved' && (
                            <span className="text-xs text-blue-500">等待上架</span>
                          )}
                          <button
                            onClick={() => deleteProduct(product.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            title="删除"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 报价查询 */}
      {activeTab === 'query' && (
        <div className="space-y-6">
          {/* 搜索框 */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={queryCas}
                onChange={(e) => setQueryCas(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchSuppliers()}
                placeholder="输入CAS码查询供应商报价..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchSuppliers}
              disabled={queryLoading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {queryLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              查询
            </button>
          </div>

          {/* 查询结果 */}
          {queryResults && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">CAS码:</span>
                <span className="font-mono font-medium">{queryResults.cas}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">找到 {queryResults.total} 个供应商</span>
              </div>

              {queryResults.suppliers.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-xl">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">暂无供应商报价该产品</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">供应商</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">地区</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">纯度</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">包装</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">价格</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">库存</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">操作</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {queryResults.suppliers.map((supplier: any) => (
                        <tr key={supplier.productId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {supplier.agent.name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {supplier.agent.location || '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{supplier.purity || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{supplier.packageSpec || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            {supplier.price ? `$${supplier.price}/kg` : '询价'}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {supplier.stockPublic ? `${supplier.stock} kg` : '保密'}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => {
                                setInquirySupplier(supplier);
                                setInquiryForm({ quantity: '', message: '' });
                                setShowInquiryModal(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                            >
                              询价
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 询价弹窗 */}
      {showInquiryModal && inquirySupplier && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md m-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">发送询价</h3>
              <button
                onClick={() => {
                  setShowInquiryModal(false);
                  setInquirySupplier(null);
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 供应商信息 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">供应商</span>
                  <span className="font-medium">{inquirySupplier.agent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">产品</span>
                  <span className="font-medium">{inquirySupplier.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">CAS码</span>
                  <span className="font-mono">{inquirySupplier.cas}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">纯度</span>
                  <span>{inquirySupplier.purity || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">参考价格</span>
                  <span className="font-medium text-blue-600">
                    {inquirySupplier.price ? `$${inquirySupplier.price}/kg` : '询价'}
                  </span>
                </div>
              </div>

              {/* 询价表单 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  询价数量 (kg)
                </label>
                <input
                  type="number"
                  value={inquiryForm.quantity}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, quantity: e.target.value })}
                  placeholder="请输入询价数量"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  询价说明
                </label>
                <textarea
                  value={inquiryForm.message}
                  onChange={(e) => setInquiryForm({ ...inquiryForm, message: e.target.value })}
                  placeholder="请描述您的需求，如交货时间、付款方式等..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowInquiryModal(false);
                  setInquirySupplier(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={async () => {
                  if (!inquiryForm.quantity) {
                    alert('请填写询价数量');
                    return;
                  }

                  setInquirySending(true);
                  try {
                    const token = getToken();
                    const response = await fetch('/api/inquiries/send', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                        'X-User-ID': user.id,
                      },
                      body: JSON.stringify({
                        toUserId: inquirySupplier.agent.id,
                        productId: inquirySupplier.productId,
                        productName: inquirySupplier.name,
                        cas: inquirySupplier.cas,
                        purity: inquirySupplier.purity,
                        quantity: parseInt(inquiryForm.quantity),
                        message: inquiryForm.message,
                        referencePrice: inquirySupplier.price,
                      }),
                    });

                    const data = await response.json();
                    if (data.success) {
                      alert('询价已发送，请到消息中心查看回复');
                      setShowInquiryModal(false);
                      setInquirySupplier(null);
                    } else {
                      alert(data.error || '发送失败');
                    }
                  } catch (error) {
                    console.error('Send inquiry error:', error);
                    alert('发送失败，请重试');
                  } finally {
                    setInquirySending(false);
                  }
                }}
                disabled={inquirySending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {inquirySending && <Loader2 className="h-4 w-4 animate-spin" />}
                发送询价
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 产品表单弹窗 */}
      {showProductForm && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingProduct ? '编辑产品' : '上架新产品'}
              </h3>
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CAS码 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.cas}
                    onChange={(e) => setProductForm({ ...productForm, cas: e.target.value })}
                    placeholder="如: 67-64-1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    产品名称 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="如: 丙酮"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">纯度</label>
                  <input
                    type="text"
                    value={productForm.purity}
                    onChange={(e) => setProductForm({ ...productForm, purity: e.target.value })}
                    placeholder="如: 99.5%"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">包装规格</label>
                  <input
                    type="text"
                    value={productForm.packageSpec}
                    onChange={(e) => setProductForm({ ...productForm, packageSpec: e.target.value })}
                    placeholder="如: 25kg/桶"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">参考价格 (USD/kg)</label>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="如: 5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最小起订量</label>
                  <input
                    type="number"
                    value={productForm.minOrder}
                    onChange={(e) => setProductForm({ ...productForm, minOrder: e.target.value })}
                    placeholder="如: 100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">库存数量</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    placeholder="如: 1000"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">产地</label>
                  <input
                    type="text"
                    value={productForm.origin}
                    onChange={(e) => setProductForm({ ...productForm, origin: e.target.value })}
                    placeholder="如: 中国"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={productForm.stockPublic}
                  onChange={(e) => setProductForm({ ...productForm, stockPublic: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <label className="text-sm text-gray-700">公开库存数量</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={productForm.remark}
                  onChange={(e) => setProductForm({ ...productForm, remark: e.target.value })}
                  placeholder="其他说明..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  setShowProductForm(false);
                  setEditingProduct(null);
                  resetProductForm();
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                取消
              </button>
              <button
                onClick={saveProduct}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingProduct ? '保存修改' : '上架产品'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

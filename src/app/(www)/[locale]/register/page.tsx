'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, User, Phone, Globe, ArrowRight, CheckCircle2, ShieldCheck, Globe2, Sparkles, Building2, User as UserIcon, Eye, EyeOff, Check, X, Loader2, Plus, ChevronRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Header from '@/components/layout/Header';
import { sendVerificationCode, checkEmailAvailability } from '@/services/authService';
import { SOCIAL_CONTACT_TYPES, validateSocialContact } from '@/services/socialContactService';
import type { AddressData } from '@/components/common/AddressPicker';

// 动态导入 AddressPicker，禁用 SSR（因为 Leaflet 需要 window 对象）
const AddressPicker = dynamic(() => import('@/components/common/AddressPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading address picker...</span>
    </div>
  ),
});

export default function RegisterPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const { register, isLoggedIn, isLoading } = useAuth();

  // 表单状态
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    emailVerificationCode: '',
    agreeTerms: false,
    agreePrivacy: false,
    socialContacts: [] as Array<{ type: string; value: string; visible: boolean }>,
  });

  // 地址状态
  const [addressData, setAddressData] = useState<AddressData | null>(null);

  // UI状态
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState('');
  const [showSocialSection, setShowSocialSection] = useState(false);
  const [socialContactErrors, setSocialContactErrors] = useState<Record<string, string>>({});
  
  // 邮箱检查状态
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailCheckError, setEmailCheckError] = useState('');
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 邮箱输入变化时，防抖检查
  useEffect(() => {
    const email = formData.email;
    console.log('[Email Check] Input changed:', email);
    
    // 如果已发送验证码，不再检查
    if (codeSent) return;
    
    // 清除之前的定时器
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }
    
    // 重置状态
    setEmailAvailable(null);
    setEmailCheckError('');
    
    // 邮箱为空或格式不正确时，不发送请求
    const isValidEmail = email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    console.log('[Email Check] Is valid email format:', isValidEmail);
    
    if (!isValidEmail) {
      setEmailChecking(false);
      return;
    }
    
    // 设置防抖检查
    console.log('[Email Check] Setting timeout to check email...');
    emailCheckTimeoutRef.current = setTimeout(async () => {
      console.log('[Email Check] Calling API for:', email);
      try {
        setEmailChecking(true);
        const response = await checkEmailAvailability(email);
        console.log('[Email Check] API response:', response);
        
        if (response.success) {
          setEmailAvailable(response.available);
          if (!response.available && response.error) {
            setEmailCheckError(response.error);
          }
        }
      } catch (err: any) {
        console.error('Email check failed:', err);
      } finally {
        setEmailChecking(false);
      }
    }, 500); // 500ms 防抖
    
    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [formData.email, codeSent]);

  const handleSendCode = async () => {
    if (!formData.email) {
      setError('Please enter your email first');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setSendingCode(true);
      setError('');

      const response = await sendVerificationCode(formData.email);

      if (response.success) {
        setCodeSent(true);
      } else {
        throw new Error('Failed to send verification code');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setSendingCode(false);
    }
  };

  // 添加社交联系方式
  const addSocialContact = () => {
    setFormData(prev => ({
      ...prev,
      socialContacts: [...prev.socialContacts, { type: 'wechat', value: '', visible: false }]
    }));
  };

  // 移除社交联系方式
  const removeSocialContact = (index: number) => {
    setFormData(prev => ({
      ...prev,
      socialContacts: prev.socialContacts.filter((_, i) => i !== index)
    }));
    // 清除对应的错误
    const newErrors = { ...socialContactErrors };
    delete newErrors[`contact_${index}`];
    setSocialContactErrors(newErrors);
  };

  // 更新社交联系方式
  const updateSocialContact = (index: number, field: 'type' | 'value' | 'visible', value: string | boolean) => {
    const updatedContacts = [...formData.socialContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setFormData(prev => ({ ...prev, socialContacts: updatedContacts }));

    // 验证联系方式
    if (field === 'value' && typeof value === 'string') {
      const contact = formData.socialContacts[index];
      const validation = validateSocialContact(contact.type, value);
      if (!validation.valid && value.trim() !== '') {
        const errorMsg = validation.error || 'Invalid value';
        setSocialContactErrors(prev => ({
          ...prev,
          [`contact_${index}`]: errorMsg
        }));
      } else {
        setSocialContactErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[`contact_${index}`];
          return newErrors;
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 表单验证
    if (!formData.username || !formData.email || !formData.password ||
        !formData.confirmPassword || !formData.firstName || !formData.lastName ||
        !formData.emailVerificationCode) {
      setError('Please fill in all required fields');
      return;
    }

    // 地址验证
    if (!addressData || !addressData.country) {
      setError('Please select your address');
      return;
    }

    // 用户名验证：支持多语言，长度2-50字符
    if (formData.username.length < 2 || formData.username.length > 50) {
      setError('用户名长度需要2-50个字符');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!formData.agreeTerms || !formData.agreePrivacy) {
      setError('Please agree to the Terms of Service and Privacy Policy');
      return;
    }

    if (!codeSent) {
      setError('Please verify your email first');
      return;
    }

    try {
      // 构建社交联系方式
      const socialContacts: Record<string, string> = {};
      formData.socialContacts.forEach(contact => {
        if (contact.value.trim()) {
          socialContacts[contact.type] = contact.value;
        }
      });

      await register(
        formData.email,
        formData.password,
        `${formData.firstName} ${formData.lastName}`,
        formData.emailVerificationCode,
        undefined, // internalEmailName
        addressData.country,
        addressData.city ? `${addressData.state}/${addressData.city}`.replace(/^\//, '') : addressData.state,
        socialContacts
      );
      router.push('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  // 如果已经登录，重定向到首页
  if (isLoggedIn && !isLoading) {
    router.push('/');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <Header />

      <div className="relative min-h-screen flex items-center justify-center pt-20 pb-12 px-4">
        {/* 动态背景装饰 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl w-full mx-auto">
          <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-white/50">
            <div className="grid lg:grid-cols-[1.2fr_1fr]">
              {/* 左侧 - 品牌展示 */}
              <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 p-12 lg:p-16 flex flex-col justify-between overflow-hidden">
                {/* 装饰图形 */}
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-400/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-blue-500/20 to-transparent rounded-full translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span className="text-white/90 text-sm font-medium">Global Chemical Trading Platform</span>
                  </div>

                  <h1 className="text-4xl lg:text-[3rem] font-bold text-white mb-6 leading-tight tracking-tight">
                    Join the Future of<br />
                    <span className="bg-gradient-to-r from-blue-100 to-cyan-100 bg-clip-text text-transparent">
                      Chemical Trade
                    </span>
                  </h1>
                  <p className="text-blue-100/90 text-lg lg:text-xl mb-10 leading-relaxed max-w-xl">
                    Connect with 1,000+ verified agents across 50+ countries. Access 3,000+ certified factories and trade globally with confidence.
                  </p>
                </div>

                <div className="relative z-10 space-y-5">
                  {[
                    { icon: ShieldCheck, title: 'Verified Platform', desc: 'All suppliers and buyers are verified' },
                    { icon: Globe2, title: 'Global Network', desc: 'Trade across 50+ countries seamlessly' },
                    { icon: Building2, title: 'Direct Factory Access', desc: 'Connect directly with 3,000+ factories' },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20 group-hover:bg-white/20 transition-all">
                        <item.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-base">{item.title}</h3>
                        <p className="text-blue-200/80 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative z-10 mt-10 flex items-center gap-6">
                  <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg shadow-black/10">
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/agent" className="text-white/90 hover:text-white font-medium flex items-center gap-2 transition-colors">
                    <Building2 className="w-4 h-4" />
                    Become an Agent
                  </Link>
                </div>
              </div>

              {/* 右侧 - 注册表单 */}
              <div className="p-8 lg:p-12 bg-white/50">
                {/* 账户类型选择 */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Create Account</h2>
                      <p className="text-gray-600 text-sm">Join as a regular user</p>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200/50">
                    <p className="text-sm text-amber-800">
                      <span className="font-medium">Note:</span> This registration creates a user account for browsing products and sending inquiries. To become a verified agent and list products, you need to apply separately.
                    </p>
                    <Link href="/agent" className="inline-flex items-center gap-1 mt-2 text-amber-700 hover:text-amber-800 text-sm font-medium">
                      Learn about becoming an agent <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-3">
                    <X className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* 姓和名 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        First Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleChange('firstName', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="John"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Last Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleChange('lastName', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  {/* 用户名 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Username <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                      placeholder="请输入用户名（支持中英文）"
                      required
                      minLength={2}
                      maxLength={50}
                    />
                    <p className="text-xs text-gray-500">2-50个字符，支持中英文</p>
                  </div>

                  {/* 邮箱和验证码 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          className={`w-full pl-10 pr-10 py-3 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 ${
                            codeSent ? 'border-green-500 bg-green-50/50' : 
                            emailAvailable === false ? 'border-red-500 bg-red-50/50' :
                            emailAvailable === true ? 'border-green-500 bg-green-50/50' : 
                            emailChecking ? 'border-blue-400' : 'border-gray-200'
                          }`}
                          placeholder="john@example.com"
                          required
                          disabled={codeSent}
                        />
                        {emailChecking && (
                          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-500 animate-spin" />
                        )}
                        {!emailChecking && emailAvailable === false && (
                          <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                        )}
                        {!emailChecking && emailAvailable === true && !codeSent && (
                          <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                        )}
                        {codeSent && (
                          <CheckCircle2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={!formData.email || codeSent || sendingCode || emailAvailable === false}
                        className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap text-sm shadow-lg shadow-blue-500/20 flex items-center gap-2"
                      >
                        {sendingCode ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : codeSent ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          'Send Code'
                        )}
                      </button>
                    </div>
                    {/* 邮箱状态提示 */}
                    {emailChecking && (
                      <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Checking email availability...
                      </p>
                    )}
                    {emailCheckError && (
                      <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                        <X className="w-4 h-4" />
                        {emailCheckError}
                      </p>
                    )}
                    {emailAvailable === true && !codeSent && !emailChecking && (
                      <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Email is available
                      </p>
                    )}
                  </div>

                  {/* 验证码 */}
                  {codeSent && (
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Verification Code <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.emailVerificationCode}
                          onChange={(e) => handleChange('emailVerificationCode', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-center tracking-[0.2em]"
                          placeholder="000000"
                          required
                          maxLength={6}
                          pattern="[0-9]{6}"
                        />
                        <p className="text-xs text-gray-500 mt-1 text-center">6-digit code sent to your email (valid for 10 minutes)</p>
                      </div>
                    </div>
                  )}

                  {/* 密码 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => handleChange('password', e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="••••••••"
                        required
                        minLength={8}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* 确认密码 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* 地址和手机号 */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        <span className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          Address <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <AddressPicker
                        value={addressData}
                        onChange={setAddressData}
                        locale={locale}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Phone <span className="text-gray-400 text-xs">(Optional)</span>
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => handleChange('phone', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                          placeholder="+1 234 567 8900"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 社交联系方式（可选）*/}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Globe2 className="w-4 h-4 text-gray-400" />
                          Social Contacts
                          <span className="text-gray-400 font-normal">(Optional)</span>
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Add your instant messaging accounts to connect with other users
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSocialSection(!showSocialSection)}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        {showSocialSection ? 'Hide' : 'Add'}
                      </button>
                    </div>

                    {showSocialSection && (
                      <div className="space-y-3">
                        {formData.socialContacts.map((contact, index) => (
                          <div key={index} className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
                            <div className="flex items-center justify-between">
                              <select
                                value={contact.type}
                                onChange={(e) => updateSocialContact(index, 'type', e.target.value)}
                                className="px-3 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm font-medium"
                              >
                                {SOCIAL_CONTACT_TYPES.map(type => (
                                  <option key={type.id} value={type.id}>
                                    {type.icon} {type.displayName}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => removeSocialContact(index)}
                                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex gap-3">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={contact.value}
                                  onChange={(e) => updateSocialContact(index, 'value', e.target.value)}
                                  placeholder={SOCIAL_CONTACT_TYPES.find(t => t.id === contact.type)?.placeholder}
                                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400 text-sm"
                                />
                                {socialContactErrors[`contact_${index}`] && (
                                  <p className="text-xs text-red-500 mt-1">{socialContactErrors[`contact_${index}`]}</p>
                                )}
                              </div>
                              <label className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                <input
                                  type="checkbox"
                                  checked={contact.visible}
                                  onChange={(e) => updateSocialContact(index, 'visible', e.target.checked)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">Visible</span>
                              </label>
                            </div>
                          </div>
                        ))}

                        {formData.socialContacts.length < SOCIAL_CONTACT_TYPES.length && (
                          <button
                            type="button"
                            onClick={addSocialContact}
                            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
                          >
                            <Plus className="w-4 h-4" />
                            Add Another Contact
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 条款同意 */}
                  <div className="space-y-3 pt-2">
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.agreeTerms}
                          onChange={(e) => handleChange('agreeTerms', e.target.checked)}
                          className="peer sr-only"
                          required
                        />
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                          {formData.agreeTerms && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">
                        I agree to the{' '}
                        <Link href="/terms" className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</Link>
                      </span>
                    </label>

                    <label className="flex items-start gap-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.agreePrivacy}
                          onChange={(e) => handleChange('agreePrivacy', e.target.checked)}
                          className="peer sr-only"
                          required
                        />
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                          {formData.agreePrivacy && <Check className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">
                        I agree to the{' '}
                        <Link href="/privacy" className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</Link>
                      </span>
                    </label>
                  </div>

                  {/* 提交按钮 */}
                  <button
                    type="submit"
                    disabled={isLoading || !codeSent}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Account
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>

                {/* 底部提示 */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-center text-gray-600 text-sm">
                    Already have an account?{' '}
                    <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Sign In
                    </Link>
                  </p>
                </div>

                {/* 开发提示 */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">Development Note:</span> Email verification requires SMTP configuration. For testing, use the login page with test credentials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, Lock, User, Eye, EyeOff, Loader2, Shield, MapPin, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import dynamic from 'next/dynamic';
import type { AddressData } from '@/components/AddressPicker';

// 动态导入 AddressPicker，禁用 SSR（因为 Leaflet 需要 window 对象）
const AddressPicker = dynamic(() => import('@/components/AddressPicker'), {
  ssr: false,
  loading: () => (
    <div className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-400">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span>Loading...</span>
    </div>
  ),
});

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export default function AuthModal({ isOpen, onClose, locale }: AuthModalProps) {
  const t = useTranslations('auth');
  
  // 即时通讯方式配置
  const SOCIAL_CONTACTS = [
    { id: 'wechat', label: '微信', icon: '💬', placeholder: '请输入微信号' },
    { id: 'whatsapp', label: 'WhatsApp', icon: '📱', placeholder: '请输入 WhatsApp 号码' },
    { id: 'telegram', label: 'Telegram', icon: '✈️', placeholder: '请输入 Telegram 用户名' },
    { id: 'messenger', label: 'Messenger', icon: '💬', placeholder: '请输入 Messenger ID' },
    { id: 'line', label: 'LINE', icon: '🟢', placeholder: '请输入 LINE ID' },
    { id: 'viber', label: 'Viber', icon: '📞', placeholder: '请输入 Viber 号码' },
  ];
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  // 登录表单
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // 注册表单 - 步骤1：基本信息
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState<string>('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  // 注册表单 - 步骤3：密码
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 注册表单 - 步骤4：地址信息
  const [addressData, setAddressData] = useState<AddressData | null>(null);

  // 注册表单 - 步骤5：显示名称 + 即时通讯
  const [socialContacts, setSocialContacts] = useState<Record<string, string>>({});
  const [displayName, setDisplayName] = useState('');
  const [currentSocialField, setCurrentSocialField] = useState<string>('');
  const [currentSocialValue, setCurrentSocialValue] = useState('');

  // 注册表单 - 步骤1：邮箱 + 验证码
  const [emailCode, setEmailCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);

  // 使用 Auth hook
  const { login: authLogin, register, isLoading, isLoggedIn } = useAuth();
  const router = useRouter();

  // 计算已填写的即时通讯方式数量
  const filledSocialContacts = Object.values(socialContacts).filter(v => v && v.trim() !== '').length;

  // 如果已经登录，关闭弹窗
  useEffect(() => {
    if (isLoggedIn) {
      onClose();
    }
  }, [isLoggedIn, onClose]);

  // 检查用户名可用性
  const checkUsername = useCallback(async (value: string) => {
    // 格式检查（优先于长度检查，这样即使长度不足也能提示格式错误）
    if (value.startsWith('_') || value.endsWith('_')) {
      setUsernameAvailable(false);
      setUsernameError(t('usernameUnderscoreStartEnd'));
      return;
    }
    if (value.includes('__')) {
      setUsernameAvailable(false);
      setUsernameError(t('usernameConsecutiveUnderscores'));
      return;
    }

    // 长度检查
    if (value.length < 3) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }
    if (value.length > 20) {
      setUsernameAvailable(false);
      setUsernameError(t('usernameMaxLength'));
      return;
    }

    setCheckingUsername(true);
    try {
      const response = await fetch('/api/auth/check-internal-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ internalEmailName: value }),
      });
      const data = await response.json();
      setUsernameAvailable(data.available);
      setUsernameError(data.error || '');
    } catch (err) {
      console.error('Check internal email name error:', err);
    } finally {
      setCheckingUsername(false);
    }
  }, []);

  // 用户名变化时检查
  useEffect(() => {
    // 用户输入时立即清除之前的状态（让提示消失）
    if (username) {
      setUsernameAvailable(null);
      setUsernameError('');
    }
    
    const timer = setTimeout(() => {
      if (username) {
        checkUsername(username);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [username, checkUsername]);

  // 发送验证码
  const handleSendCode = async () => {
    if (countdown > 0 || sendingCode) return;
    if (!email.trim()) {
      setError(t('pleaseEnterEmail'));
      return;
    }
    
    setSendingCode(true);
    setError('');
    
    try {
      const response = await fetch('/api/public/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setCodeSent(true);
        setCountdown(90);
        // 开发环境：自动填充验证码
        if (data.code) {
          setEmailCode(data.code);
        }
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
        setError(data.error || t('sendCodeFailed'));
      }
    } catch (err) {
      console.error('Send code error:', err);
      setError(t('sendCodeFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  // 步骤验证
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // 步骤1：外网邮箱 + 验证码
        if (!email.trim()) {
          setError(t('pleaseEnterEmail'));
          return false;
        }
        if (!emailCode || emailCode.length !== 6) {
          setError(t('enterSixDigitCode'));
          return false;
        }
        return true;
      case 2:
        // 步骤2：内网邮箱名称
        if (!username || username.length < 3) {
          setError(t('usernameMinLength'));
          return false;
        }
        if (username.length > 20) {
          setError(t('usernameMaxLength'));
          return false;
        }
        if (username.startsWith('_') || username.endsWith('_')) {
          setError(t('usernameUnderscoreStartEnd'));
          return false;
        }
        if (username.includes('__')) {
          setError(t('usernameConsecutiveUnderscores'));
          return false;
        }
        if (usernameAvailable === false) {
          setError(t('usernameTaken'));
          return false;
        }
        return true;
      case 3:
        // 步骤3：密码
        if (!password || password.length < 6) {
          setError(t('passwordMinLength'));
          return false;
        }
        if (password !== confirmPassword) {
          setError(t('passwordMismatch'));
          return false;
        }
        return true;
      case 4:
        // 步骤4：地址信息
        if (!addressData || !addressData.formatted) {
          setError(t('pleaseSelectAddress'));
          return false;
        }
        return true;
      case 5:
        // 步骤5：显示名称 + 社交通讯
        if (!displayName || displayName.trim().length < 1) {
          setError(t('pleaseEnterDisplayName'));
          return false;
        }
        if (filledSocialContacts === 0) {
          setError(t('fillAtLeastOneSocial'));
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // 下一步
  const handleNextStep = () => {
    setError('');
    
    // 验证当前步骤
    if (!validateStep(signupStep)) return;
    
    // 如果从步骤4进入步骤5，设置 displayName 默认值
    if (signupStep === 4) {
      if (!displayName && username) {
        setDisplayName(username);
      }
    }
    
    setSignupStep(signupStep + 1);
  };

  // 提交注册
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 如果不在最后一步，不执行提交，而是执行下一步
    if (signupStep < 5) {
      handleNextStep();
      return;
    }

    if (!validateStep(5)) return;

    try {
      await register(
        email,
        password,
        displayName, // name = 用户名/显示名称
        emailCode,
        username, // internalEmailName
        addressData?.country || '',
        addressData?.city || `${addressData?.state || ''}`,
        socialContacts
      );
      onClose();
    } catch (err: any) {
      setError(err.message || t('registrationFailed'));
    }
  };

  // 提交登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!loginEmail || !loginPassword) {
      setError(t('fillAllFields'));
      return;
    }

    try {
      await authLogin(loginEmail, loginPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || t('loginFailed'));
    }
  };

  // 重置注册表单
  const resetSignupForm = () => {
    setSignupStep(1);
    setEmail('');
    setUsername('');
    setUsernameAvailable(null);
    setUsernameError('');
    setPassword('');
    setConfirmPassword('');
    setAddressData(null);
    setSocialContacts({});
    setEmailCode('');
    setCodeSent(false);
    setCountdown(0);
    setSendingCode(false);
    setError('');
  };

  // 切换登录/注册时重置
  useEffect(() => {
    if (!isLogin) {
      resetSignupForm();
    }
  }, [isLogin]);

  return (
    <div className={`fixed inset-0 z-[99999] flex items-center justify-center ${!isOpen ? 'hidden' : ''}`}>
      {/* 遮罩层 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* 模态框 */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-1/2 min-w-80 max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* 头部 */}
        <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 pt-8 pb-6 sticky top-0 z-10">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors z-30"
          >
            <X className="h-5 w-5" />
          </button>

          <h2 className="text-xl font-bold text-white text-center">
            {isLogin ? t('welcomeBack') : t('createAccount')}
          </h2>
          <p className="text-blue-100 text-center mt-2 text-sm">
            {isLogin ? t('signInSubtitle') : t('signUpSubtitle')}
          </p>
        </div>

        {/* 切换标签 */}
        <div className="flex border-b border-gray-200 sticky top-[76px] bg-white z-10">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('signIn')}
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              !isLogin ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t('signUp')}
          </button>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mx-8 mt-6 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 表单内容 */}
        <form onSubmit={isLogin ? handleLogin : handleRegister} className="px-6 py-5">
          {isLogin ? (
            // ========== 登录表单 ==========
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailAddress')}</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder={t('enterEmail')}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('password')}</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={t('enterPassword')}
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center text-sm text-gray-600">
                    <input type="checkbox" className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    {t('rememberMe')}
                  </label>
                  <a href="#" className="text-sm text-blue-600 hover:text-blue-700">{t('forgotPassword')}</a>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('signingIn')}
                    </>
                  ) : t('signIn')}
                </button>

                {/* 测试按钮 */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('normaluser@example.com'); setLoginPassword('123456'); }}
                    className="w-full bg-blue-50 text-blue-700 py-2 rounded-lg font-medium hover:bg-blue-100 transition-colors text-sm border border-blue-200"
                  >
                    🚀 {t('quickTestNormalUser')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setLoginEmail('agent@example.com'); setLoginPassword('123456'); }}
                    className="w-full bg-green-50 text-green-700 py-2 rounded-lg font-medium hover:bg-green-100 transition-colors text-sm border border-green-200"
                  >
                    🚀 {t('quickTestAgentUser')}
                  </button>
                </div>
              </div>
            </>
          ) : (
            // ========== 注册表单（4步） ==========
            <div className="space-y-4">
              {/* 步骤指示器 */}
              <div className="flex items-center justify-center gap-1 mb-6">
                {[1, 2, 3, 4, 5].map((step) => (
                  <div key={step} className="flex items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        signupStep === step
                          ? 'bg-blue-600 text-white'
                          : signupStep > step
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {signupStep > step ? <CheckCircle className="h-4 w-4" /> : step}
                    </div>
                    {step < 5 && (
                      <div className={`w-6 h-0.5 mx-0.5 ${signupStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
                    )}
                  </div>
                ))}
              </div>

              {/* 步骤 1：邮箱 + 验证码 */}
              {signupStep === 1 && (
                <div className="space-y-4">
                  {/* 邮箱输入 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emailAddress')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('enterEmail')}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* 验证码输入 + 发送按钮 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('verificationCode')} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type="text"
                          required
                          placeholder={t('sixDigitCode')}
                          maxLength={6}
                          value={emailCode}
                          onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg tracking-widest"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendCode}
                        disabled={countdown > 0 || !email.trim() || sendingCode}
                        className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex items-center gap-2 min-w-[100px] justify-center"
                      >
                        {sendingCode ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>...</span>
                          </>
                        ) : countdown > 0 ? (
                          `${countdown}s`
                        ) : (
                          t('sendCode')
                        )}
                      </button>
                    </div>
                    {codeSent && (
                      <p className="text-xs text-green-600 mt-1">✓ {t('codeSentToEmail')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 步骤 2：用户名 */}
              {signupStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('internalEmail')} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-xs text-orange-600 mb-2">{t('internalEmailHint')}</p>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">@</span>
                      <input
                        type="text"
                        required
                        value={username}
                        onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                        placeholder={t('internalEmailPlaceholder')}
                        className="w-full pl-8 pr-32 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        maxLength={20}
                      />
                      <span className="absolute right-10 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">@chemicaloop</span>
                      {checkingUsername && (
                        <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 animate-spin text-blue-600" />
                      )}
                      {!checkingUsername && usernameAvailable === true && (
                        <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-500" />
                      )}
                      {!checkingUsername && usernameAvailable === false && (
                        <X className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {username && usernameAvailable === true && (
                      <p className="text-xs text-green-600 mt-1">✓ {t('internalEmailAvailable')}</p>
                    )}
                    {username && usernameAvailable === false && usernameError && (
                      <p className="text-xs text-red-600 mt-1">✗ {usernameError}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 步骤 3：密码设置 */}
              {signupStep === 3 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('password')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('passwordMinLength')}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('confirmPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder={t('confirmPasswordPlaceholder')}
                        className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    {confirmPassword && password !== confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">{t('passwordsDoNotMatch')}</p>
                    )}
                  </div>
                </div>
              )}

              {/* 步骤 4：地址选择 */}
              {signupStep === 4 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <span className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {t('address')} <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <AddressPicker
                      value={addressData}
                      onChange={(addr) => {
                        setAddressData(addr);
                        // 地址选择成功后，清除错误提示
                        if (addr && addr.formatted) {
                          setError('');
                        }
                      }}
                      locale={locale}
                    />
                    {addressData && addressData.formatted && (
                      <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {addressData.city ? `${addressData.city}, ` : ''}{addressData.country || addressData.formatted.split(',')[0]}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 步骤 5：显示名称 + 社交通讯 */}
              {signupStep === 5 && (
                <div className="space-y-4">
                  {/* 用户名/显示名称 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('displayName')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder={t('displayNamePlaceholder')}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('displayNameHint')}</p>
                  </div>
                  
                  {/* 社交通讯方式 - 逐项添加 */}
                  <div>
                    <p className="text-sm text-gray-700 mb-2">
                      即时通讯 <span className="text-red-500">*</span> <span className="text-xs text-gray-500">{t('atLeastOneRequired')}</span>
                    </p>
                    
                    {/* 已添加的即时通讯方式 */}
                    {filledSocialContacts > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(socialContacts).map(([key, value]) => 
                          value && value.trim() && (
                            <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {SOCIAL_CONTACTS.find(c => c.id === key)?.icon} {SOCIAL_CONTACTS.find(c => c.id === key)?.label}: {value}
                              <button
                                type="button"
                                onClick={() => setSocialContacts({ ...socialContacts, [key]: '' })}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          )
                        )}
                      </div>
                    )}
                    
                    {/* 添加新的即时通讯方式 */}
                    <div className="flex gap-2">
                      <select
                        value={currentSocialField}
                        onChange={(e) => setCurrentSocialField(e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      >
                        <option value="">{t('selectSocialType')}</option>
                        {SOCIAL_CONTACTS.map((contact) => (
                          <option key={contact.id} value={contact.id} disabled={!!socialContacts[contact.id]?.trim()}>
                            {contact.icon} {contact.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={currentSocialValue}
                        onChange={(e) => setCurrentSocialValue(e.target.value)}
                        placeholder={t('enterValue')}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        disabled={!currentSocialField}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (currentSocialField && currentSocialValue.trim()) {
                            setSocialContacts({ ...socialContacts, [currentSocialField]: currentSocialValue.trim() });
                            setCurrentSocialField('');
                            setCurrentSocialValue('');
                          }
                        }}
                        disabled={!currentSocialField || !currentSocialValue.trim()}
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {t('add')}
                      </button>
                    </div>
                  </div>
                  
                  {/* 服务条款 */}
                  <label className="flex items-start text-sm text-gray-600">
                    <input type="checkbox" required className="mr-2 mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span>
                      {t('agreeTerms')} <a href="#" className="text-blue-600 hover:text-blue-700">{t('termsOfService')}</a> {t('and')}{' '}
                      <a href="#" className="text-blue-600 hover:text-blue-700">{t('privacyPolicy')}</a>
                    </span>
                  </label>
                </div>
              )}

              {/* 导航按钮 */}
              <div className="flex gap-3 pt-2">
                {signupStep > 1 && (
                  <button
                    type="button"
                    formNoValidate
                    onClick={() => { setError(''); setSignupStep(signupStep - 1); }}
                    className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    {t('back')}
                  </button>
                )}
                <button
                  type={signupStep === 5 ? 'submit' : 'button'}
                  formNoValidate={signupStep !== 5}
                  onClick={signupStep < 5 ? handleNextStep : undefined}
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {t('creating')}
                    </>
                  ) : signupStep === 5 ? (
                    t('createAccount')
                  ) : (
                    t('next')
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

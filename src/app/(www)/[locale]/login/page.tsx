'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/hooks/useAuth';
import { Mail, Lock, ArrowRight, ShieldCheck, Globe2, Sparkles, Eye, EyeOff, User as UserIcon, Building2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';

export default function LoginPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { login, isLoggedIn, isLoading } = useAuth();
  console.log('LoginPage rendered -', new Date().toISOString());

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== handleSubmit called ===');
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    console.log('Attempting login with:', { email, password: '***' });
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

    try {
      console.log('Calling login function...');
      
      await login(email, password);
      console.log('✅ Login successful! Redirecting to home...');
      
      router.push('/');
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      setError(err.message || 'Login failed');
    }
  };

  // 测试 API 连接
  const testApiConnection = async () => {
    console.log('=== Testing API Connection ===');
    console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/health`);
      const data = await response.json();
      console.log('✅ API Connection Successful:', data);
    } catch (err: any) {
      console.error('❌ API Connection Failed:', err);
    }
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
          <div className="absolute top-20 right-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute bottom-20 left-10 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
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
                    <span className="text-white/90 text-sm font-medium">Welcome Back</span>
                  </div>

                  <h1 className="text-4xl lg:text-[3rem] font-bold text-white mb-6 leading-tight tracking-tight">
                    Sign In to Your<br />
                    <span className="bg-gradient-to-r from-blue-100 to-cyan-100 bg-clip-text text-transparent">
                      Account
                    </span>
                  </h1>
                  <p className="text-blue-100/90 text-lg lg:text-xl mb-10 leading-relaxed max-w-xl">
                    Access your dashboard, manage inquiries, and connect with global chemical suppliers and buyers.
                  </p>
                </div>

                <div className="relative z-10 space-y-5">
                  {[
                    { icon: ShieldCheck, title: 'Secure Login', desc: 'Your account is protected with enterprise-grade security' },
                    { icon: Globe2, title: 'Global Access', desc: 'Access your account from anywhere in the world' },
                    { icon: Building2, title: '24/7 Support', desc: 'Get help anytime you need it' },
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
                  <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg shadow-black/10">
                    Register
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/agent" className="text-white/90 hover:text-white font-medium flex items-center gap-2 transition-colors">
                    <Building2 className="w-4 h-4" />
                    Become an Agent
                  </Link>
                </div>
              </div>

              {/* 右侧 - 登录表单 */}
              <div className="p-8 lg:p-12 bg-white/50">
                {/* 标题区 */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <UserIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl lg:text-3xl font-bold text-gray-900">Sign In</h2>
                      <p className="text-gray-600 text-sm">Welcome back to your account</p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm flex items-start gap-3">
                    <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* 邮箱 */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* 密码 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </label>
                      <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                        placeholder="••••••••"
                        required
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

                  {/* 记住我 */}
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-md peer-checked:bg-blue-600 peer-checked:border-blue-600 transition-all flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white hidden peer-checked:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600">Remember me</span>
                  </label>

                  {/* 提交按钮 */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    onClick={() => console.log('Sign In button clicked!')}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 text-lg"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="w-5 h-5" />
                      </>
                    )}
                  </button>

                  {/* API 测试按钮 */}
                  <button
                    type="button"
                    onClick={testApiConnection}
                    className="w-full bg-yellow-50 text-yellow-700 py-3 rounded-xl font-medium hover:bg-yellow-100 transition-all text-sm border border-yellow-200"
                  >
                    🔧 Test API Connection
                  </button>

                  {/* 快速测试按钮 - 普通用户 */}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('normaluser@chemicaloop');
                      setPassword('123456');
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    className="w-full bg-blue-50 text-blue-700 py-3 rounded-xl font-medium hover:bg-blue-100 transition-all text-sm border border-blue-200"
                  >
                    🚀 Quick Test: Normal User
                  </button>

                  {/* 快速测试按钮 - 代理用户 */}
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('agent@example.com');
                      setPassword('123456');
                      handleSubmit({ preventDefault: () => {} } as React.FormEvent);
                    }}
                    className="w-full bg-green-50 text-green-700 py-3 rounded-xl font-medium hover:bg-green-100 transition-all text-sm border border-green-200"
                  >
                    🚀 Quick Test: Agent User
                  </button>
                </form>

                {/* 底部提示 */}
                <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                  <p className="text-center text-gray-600 text-sm">
                    Don't have an account?{' '}
                    <Link href="/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Register
                    </Link>
                  </p>

                  <div className="flex items-center justify-center gap-4">
                    <span className="text-sm text-gray-500">or</span>
                  </div>

                  <p className="text-center text-gray-600 text-sm">
                    Want to become a verified agent?{' '}
                    <Link href="/agent" className="text-blue-600 hover:text-blue-700 font-semibold">
                      Apply Now
                    </Link>
                  </p>
                </div>

                {/* 测试账号 */}
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <p className="text-xs text-slate-600 font-medium">Test Accounts:</p>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <UserIcon className="w-3 h-3 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-700 font-medium">Normal User (USER)</p>
                        <p className="text-xs text-slate-600">Email: normaluser@chemicaloop</p>
                        <p className="text-xs text-slate-600">Password: 123456</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Building2 className="w-3 h-3 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-slate-700 font-medium">Agent User (AGENT)</p>
                        <p className="text-xs text-slate-600">Email: agent@example.com</p>
                        <p className="text-xs text-slate-600">Password: 123456</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

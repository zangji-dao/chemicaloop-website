'use client';

import { useState } from 'react';
import { X, Lock, Eye, EyeOff, Shield, Loader2, CheckCircle2 } from 'lucide-react';
import { changePassword } from '@/services/authService';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onForgotPassword?: () => void;
}

export default function ChangePasswordModal({ isOpen, onClose, onSuccess, onForgotPassword }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  // 验证密码强度
  const getPasswordStrength = (password: string): { strength: number; color: string; text: string } => {
    if (password.length === 0) return { strength: 0, color: 'bg-gray-200', text: '' };
    if (password.length < 6) return { strength: 1, color: 'bg-red-500', text: 'Weak' };
    if (password.length < 10) return { strength: 2, color: 'bg-yellow-500', text: 'Medium' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return { strength: 3, color: 'bg-blue-500', text: 'Good' };
    }
    return { strength: 4, color: 'bg-green-500', text: 'Strong' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setIsLoading(true);
      const response = await changePassword(currentPassword, newPassword);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
          onClose();
          onSuccess?.();
        }, 2000);
      } else {
        setError(response.error || 'Failed to change password');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理遮罩层点击
  const handleBackdropClick = (e: React.MouseEvent) => {
    // 只有直接点击遮罩层才关闭，点击模态框内部不关闭
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // 处理模态框内部点击，防止事件冒泡到遮罩层
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* 遮罩层 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* 模态框 */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={handleModalClick}
        onMouseDown={handleModalClick}
      >
        {/* 关闭按钮 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            e.preventDefault();
          }}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* 头部 */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Lock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Change Password</h2>
              <p className="text-blue-100 text-sm">Update your account password</p>
            </div>
          </div>
        </div>

        {/* 内容 */}
        <div className="px-8 py-6">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Password Changed!</h3>
              <p className="text-gray-600 text-center">Your password has been updated successfully.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 当前密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowCurrent(!showCurrent);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showCurrent ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {onForgotPassword && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      onForgotPassword();
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              {/* 新密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowNew(!showNew);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* 密码强度指示器 */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            passwordStrength.strength >= level ? passwordStrength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      Password strength: <span className={passwordStrength.color.replace('bg-', 'text-')}>{passwordStrength.text}</span>
                    </p>
                  </div>
                )}

                {/* 密码要求提示 */}
                {newPassword && (
                  <ul className="mt-2 space-y-1">
                    <li className="text-xs flex items-center gap-2">
                      {newPassword.length >= 6 ? (
                        <CheckCircle2 className="h-3 w-3 text-green-500" />
                      ) : (
                        <span className="w-3 h-3 border border-gray-300 rounded-full" />
                      )}
                      <span className={newPassword.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                        At least 6 characters
                      </span>
                    </li>
                  </ul>
                )}
              </div>

              {/* 确认新密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirm(!showConfirm);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                {/* 密码匹配提示 */}
                {confirmPassword && (
                  <p className={`mt-1 text-xs ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                    {newPassword === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Change Password'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

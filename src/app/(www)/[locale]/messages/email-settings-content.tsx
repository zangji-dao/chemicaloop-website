'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getToken } from '@/services/authService';
import {
  Mail,
  Lock,
  Server,
  User,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  Edit2,
  Trash2,
  Star,
  StarOff,
  X,
  ChevronRight,
} from 'lucide-react';

// 预设邮箱配置
const EMAIL_PRESETS: Record<string, {
  name: string;
  nameKey: string;
  host: string;
  port: number;
  secure: 'SSL' | 'TLS' | 'STARTTLS';
}> = {
  gmail: {
    name: 'Gmail',
    nameKey: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: 'SSL',
  },
  qq: {
    name: 'QQ邮箱',
    nameKey: 'qq',
    host: 'smtp.qq.com',
    port: 465,
    secure: 'SSL',
  },
  '163': {
    name: '163邮箱',
    nameKey: '163',
    host: 'smtp.163.com',
    port: 465,
    secure: 'SSL',
  },
  outlook: {
    name: 'Outlook',
    nameKey: 'outlook',
    host: 'smtp.office365.com',
    port: 587,
    secure: 'STARTTLS',
  },
  yahoo: {
    name: 'Yahoo',
    nameKey: 'yahoo',
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: 'SSL',
  },
};

type EmailPresetKey = keyof typeof EMAIL_PRESETS;

interface EmailAccount {
  id: string;
  senderName: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  encryption: string;
  smtpAuth: boolean;
  imapHost?: string;
  imapPort?: number;
  imapEncryption?: string;
  lastSyncAt?: string;
  isDefault: boolean;
  isActive: boolean;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

interface EmailSettingsContentProps {
  locale: string;
  t: (key: string) => string;
}

export default function EmailSettingsContent({ locale, t }: EmailSettingsContentProps) {
  const { user } = useAuth();
  
  // 邮箱列表
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 添加/编辑邮箱的状态
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    senderName: '',
    email: '',
    password: '',
    smtpHost: '',
    smtpPort: '',
    encryption: 'SSL' as 'SSL' | 'TLS' | 'STARTTLS',
    smtpAuth: true,
    imapHost: '',
    imapPort: '993',
    imapEncryption: 'SSL' as 'SSL' | 'TLS',
    displayName: '',
    isDefault: false,
  });
  const [selectedPreset, setSelectedPreset] = useState<EmailPresetKey | 'custom'>('gmail');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // 同步状态
  const [syncingAccountId, setSyncingAccountId] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // 加载邮箱列表
  useEffect(() => {
    loadEmailAccounts();
  }, []);

  const loadEmailAccounts = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/email-settings', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setEmailAccounts(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to load email accounts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: EmailPresetKey | 'custom') => {
    setSelectedPreset(preset);
    if (preset !== 'custom' && EMAIL_PRESETS[preset]) {
      const config = EMAIL_PRESETS[preset];
      setFormData(prev => ({
        ...prev,
        smtpHost: config.host,
        smtpPort: config.port.toString(),
        encryption: config.secure,
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      senderName: '',
      email: '',
      password: '',
      smtpHost: '',
      smtpPort: '',
      encryption: 'SSL',
      smtpAuth: true,
      imapHost: '',
      imapPort: '993',
      imapEncryption: 'SSL',
      displayName: '',
      isDefault: false,
    });
    setSelectedPreset('gmail');
    setShowPassword(false);
    setTestResult(null);
    setSaveSuccess(false);
  };

  const handleAddNew = () => {
    resetForm();
    setShowAddForm(true);
    setEditingAccountId(null);
  };

  const handleEdit = (account: EmailAccount) => {
    setFormData({
      senderName: account.senderName,
      email: account.email,
      password: '',
      smtpHost: account.smtpHost,
      smtpPort: account.smtpPort.toString(),
      encryption: account.encryption as 'SSL' | 'TLS' | 'STARTTLS',
      smtpAuth: account.smtpAuth,
      imapHost: account.imapHost || '',
      imapPort: account.imapPort?.toString() || '993',
      imapEncryption: (account.imapEncryption || 'SSL') as 'SSL' | 'TLS',
      displayName: account.displayName || '',
      isDefault: account.isDefault,
    });
    const preset = Object.entries(EMAIL_PRESETS).find(
      ([, config]) => config.host === account.smtpHost
    );
    setSelectedPreset(preset ? (preset[0] as EmailPresetKey) : 'custom');
    setEditingAccountId(account.id);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingAccountId(null);
    resetForm();
  };

  const handleSave = async () => {
    if (!formData.senderName || !formData.email || !formData.smtpHost || !formData.smtpPort) {
      alert(t('emailSettings.fillRequired'));
      return;
    }

    // 新增时必须有密码
    if (!editingAccountId && !formData.password) {
      alert(t('emailSettings.enterPassword'));
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const token = getToken();
      const url = editingAccountId 
        ? `/api/email-settings/${editingAccountId}`
        : '/api/email-settings';
      const method = editingAccountId ? 'PUT' : 'POST';

      const body: Record<string, any> = {
        senderName: formData.senderName,
        smtpHost: formData.smtpHost,
        smtpPort: parseInt(formData.smtpPort),
        encryption: formData.encryption,
        smtpAuth: formData.smtpAuth,
        imapHost: formData.imapHost || undefined,
        imapPort: formData.imapPort ? parseInt(formData.imapPort) : undefined,
        imapEncryption: formData.imapEncryption || undefined,
        displayName: formData.displayName || undefined,
        isDefault: formData.isDefault,
      };

      // 新增时需要邮箱和密码
      if (!editingAccountId) {
        body.email = formData.email;
        body.password = formData.password;
      } else if (formData.password) {
        // 编辑时只有填写了密码才传递
        body.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setSaveSuccess(true);
        setShowAddForm(false);
        setEditingAccountId(null);
        resetForm();
        await loadEmailAccounts();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || t('emailSettings.saveFailed'));
      }
    } catch (error) {
      console.error('Failed to save email config:', error);
      alert(t('emailSettings.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    if (!formData.email || !formData.smtpHost || !formData.smtpPort) {
      alert(t('emailSettings.fillConfig'));
      return;
    }

    if (!formData.password && !editingAccountId) {
      alert(t('emailSettings.enterPassword'));
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const token = getToken();
      
      // 如果是编辑模式，使用该账户ID进行测试
      const url = editingAccountId 
        ? `/api/email-settings/${editingAccountId}/test`
        : '/api/email-settings/test';
      
      const body = editingAccountId 
        ? {} // 编辑模式使用已保存的密码
        : {
            senderName: formData.senderName,
            email: formData.email,
            password: formData.password,
            smtpHost: formData.smtpHost,
            smtpPort: parseInt(formData.smtpPort),
            encryption: formData.encryption,
          };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      setTestResult({
        success: data.success,
        message: data.success ? t('emailSettings.testSuccess') : (data.error || t('emailSettings.testFailed')),
      });
    } catch (error) {
      console.error('Failed to send test email:', error);
      setTestResult({
        success: false,
        message: t('emailSettings.testFailed'),
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('emailSettings.confirmDelete'))) return;

    try {
      const token = getToken();
      const response = await fetch(`/api/email-settings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        await loadEmailAccounts();
      } else {
        alert(data.error || t('emailSettings.deleteFailed'));
      }
    } catch (error) {
      console.error('Failed to delete email account:', error);
      alert(t('emailSettings.deleteFailed'));
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/email-settings/${id}/set-default`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        await loadEmailAccounts();
      } else {
        alert(data.error || t('emailSettings.setDefaultFailed'));
      }
    } catch (error) {
      console.error('Failed to set default email:', error);
      alert(t('emailSettings.setDefaultFailed'));
    }
  };

  const handleSync = async (id: string, folder: 'inbox' | 'sent' = 'inbox') => {
    setSyncingAccountId(id);
    setSyncResults(prev => ({ ...prev, [id]: { success: false, message: '' } }));

    try {
      const token = getToken();
      const response = await fetch(`/api/email-settings/${id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ folder }),
      });

      const data = await response.json();
      setSyncResults(prev => ({
        ...prev,
        [id]: {
          success: data.success,
          message: data.success ? t('emailSettings.syncSuccess') : (data.error || t('emailSettings.syncFailed')),
        },
      }));

      // 3秒后清除结果
      setTimeout(() => {
        setSyncResults(prev => {
          const newResults = { ...prev };
          delete newResults[id];
          return newResults;
        });
      }, 3000);
    } catch (error) {
      console.error('Failed to sync email:', error);
      setSyncResults(prev => ({
        ...prev,
        [id]: { success: false, message: t('emailSettings.syncFailed') },
      }));
    } finally {
      setSyncingAccountId(null);
    }
  };

  // 获取预设名称（支持多语言）
  const getPresetName = (preset: EmailPresetKey) => {
    return t(`emailSettings.${preset}`);
  };

  // 获取邮箱显示名称
  const getAccountDisplayName = (account: EmailAccount) => {
    return account.displayName || account.senderName || account.email.split('@')[0];
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50 min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{t('emailSettings.title')}</h2>
            <p className="text-sm text-gray-500 mt-1">{t('emailSettings.subtitle')}</p>
          </div>
          <button
            onClick={handleAddNew}
            disabled={showAddForm}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            {t('emailSettings.addEmail')}
          </button>
        </div>

        {/* 添加/编辑邮箱表单 */}
        {showAddForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                {editingAccountId ? t('emailSettings.editEmail') : t('emailSettings.addEmail')}
              </h3>
              <button
                onClick={handleCancelForm}
                className="p-1 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 快捷选择 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('emailSettings.quickSelect')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(EMAIL_PRESETS).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetSelect(key as EmailPresetKey)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedPreset === key
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {getPresetName(key as EmailPresetKey)}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePresetSelect('custom')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedPreset === 'custom'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white border border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    {t('emailSettings.other')}
                  </button>
                </div>
              </div>

              {/* 发件人信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-1.5 text-gray-400" />
                    {t('emailSettings.senderName')} *
                  </label>
                  <input
                    type="text"
                    value={formData.senderName}
                    onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                    placeholder={t('emailSettings.senderNamePlaceholder')}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-1.5 text-gray-400" />
                    {t('emailSettings.email')} {editingAccountId && <span className="text-gray-400 text-xs">({t('emailSettings.cannotChange')})</span>}
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="your.email@gmail.com"
                    disabled={!!editingAccountId}
                    className={`w-full px-4 py-2.5 border rounded-lg ${
                      editingAccountId 
                        ? 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'
                        : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                    }`}
                  />
                </div>
              </div>

              {/* 邮箱密码 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Lock className="inline h-4 w-4 mr-1.5 text-gray-400" />
                  {t('emailSettings.password')} {editingAccountId && <span className="text-gray-400 text-xs">({t('emailSettings.leaveEmptyToKeep')})</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingAccountId ? t('emailSettings.passwordPlaceholderEdit') : t('emailSettings.passwordPlaceholder')}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedPreset === 'gmail' 
                    ? t('emailSettings.gmailHint')
                    : selectedPreset === 'qq' || selectedPreset === '163'
                    ? t('emailSettings.qq163Hint')
                    : t('emailSettings.passwordHint')}
                </p>
              </div>

              {/* SMTP 配置 */}
              <div className="border-t border-gray-100 pt-5">
                <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Server className="h-4 w-4 text-gray-400" />
                  {t('emailSettings.smtpConfig')}
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emailSettings.smtpHost')}
                    </label>
                    <input
                      type="text"
                      value={formData.smtpHost}
                      onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                      placeholder="smtp.gmail.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('emailSettings.smtpPort')}
                    </label>
                    <input
                      type="number"
                      value={formData.smtpPort}
                      onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                      placeholder="465"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('emailSettings.encryption')}
                  </label>
                  <div className="flex gap-4">
                    {['SSL', 'TLS', 'STARTTLS'].map((enc) => (
                      <label key={enc} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="encryption"
                          checked={formData.encryption === enc}
                          onChange={() => setFormData({ ...formData, encryption: enc as any })}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">{enc}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 显示名称 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('emailSettings.displayName')} ({t('emailSettings.optional')})
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder={t('emailSettings.displayNamePlaceholder')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">{t('emailSettings.displayNameHint')}</p>
              </div>

              {/* 设为默认 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="text-blue-600 rounded"
                />
                <span className="text-sm text-gray-700">{t('emailSettings.setAsDefault')}</span>
              </label>

              {/* 测试结果 */}
              {testResult && (
                <div className={`p-4 rounded-lg flex items-start gap-3 ${
                  testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={testResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testResult.message}
                  </span>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  {isSaving ? t('emailSettings.saving') : t('emailSettings.save')}
                </button>

                <button
                  onClick={handleTestEmail}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-600 border-t-transparent" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {isTesting ? t('emailSettings.testing') : t('emailSettings.testSend')}
                </button>

                <button
                  onClick={handleCancelForm}
                  className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  {t('cancel')}
                </button>

                {saveSuccess && (
                  <span className="text-green-600 text-sm flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {t('emailSettings.saved')}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 邮箱列表 */}
        {emailAccounts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">{t('emailSettings.noEmails')}</h3>
            <p className="text-gray-500 mb-6">{t('emailSettings.noEmailsHint')}</p>
            <button
              onClick={handleAddNew}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              {t('emailSettings.addEmail')}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {emailAccounts.map((account) => (
              <div
                key={account.id}
                className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                  account.isDefault ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-200'
                }`}
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${account.isDefault ? 'bg-blue-100' : 'bg-gray-100'}`}>
                        <Mail className={`h-6 w-6 ${account.isDefault ? 'text-blue-600' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">{getAccountDisplayName(account)}</h4>
                          {account.isDefault && (
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                              {t('emailSettings.default')}
                            </span>
                          )}
                          {!account.isActive && (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                              {t('emailSettings.inactive')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{account.email}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          SMTP: {account.smtpHost}:{account.smtpPort}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* 同步按钮 */}
                      <button
                        onClick={() => handleSync(account.id)}
                        disabled={syncingAccountId === account.id}
                        className={`p-2 rounded-lg transition-colors ${
                          syncingAccountId === account.id
                            ? 'bg-green-50 text-green-600'
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        title={t('emailSettings.syncNow')}
                      >
                        {syncingAccountId === account.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </button>

                      {/* 设为默认 */}
                      {!account.isDefault && (
                        <button
                          onClick={() => handleSetDefault(account.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                          title={t('emailSettings.setAsDefault')}
                        >
                          <StarOff className="h-4 w-4" />
                        </button>
                      )}

                      {/* 编辑 */}
                      <button
                        onClick={() => handleEdit(account)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
                        title={t('emailSettings.edit')}
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      {/* 删除 */}
                      <button
                        onClick={() => handleDelete(account.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-600 hover:text-red-600 transition-colors"
                        title={t('emailSettings.delete')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* 同步结果 */}
                  {syncResults[account.id] && (
                    <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${
                      syncResults[account.id].success ? 'bg-green-50' : 'bg-red-50'
                    }`}>
                      {syncResults[account.id].success ? (
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={`text-sm ${syncResults[account.id].success ? 'text-green-800' : 'text-red-800'}`}>
                        {syncResults[account.id].message}
                      </span>
                    </div>
                  )}

                  {/* 最后同步时间 */}
                  {account.lastSyncAt && (
                    <p className="text-xs text-gray-400 mt-3">
                      {t('emailSettings.lastSync')}: {new Date(account.lastSyncAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 底部提示 */}
        <div className="mt-6 p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 space-y-1">
              <p className="font-medium">{t('emailSettings.noticeTitle')}</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-700 text-xs">
                <li>
                  <strong>Gmail</strong>: {t('emailSettings.gmailNotice')}
                  <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    {t('emailSettings.generateAppPassword')} →
                  </a>
                </li>
                <li>
                  <strong>QQ/163</strong>: {t('emailSettings.qq163Notice')}
                </li>
                <li>
                  <strong>{t('emailSettings.enterpriseEmail')}</strong>: {t('emailSettings.enterpriseNotice')}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

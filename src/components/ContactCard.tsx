'use client';

import { useState } from 'react';
import { Check, X, Edit2, Loader2 } from 'lucide-react';

interface ContactCardProps {
  id: string;
  label: string;
  icon: string;
  value: string;
  placeholder: string;
  onSave: (id: string, value: string) => Promise<boolean>;
  locale: string;
}

export function ContactCard({
  id,
  label,
  icon,
  value: initialValue,
  placeholder,
  onSave,
  locale,
}: ContactCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleEdit = () => {
    setIsEditing(true);
    setInputValue(initialValue);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setInputValue(initialValue);
    setError('');
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    
    try {
      const success = await onSave(id, inputValue);
      if (success) {
        setIsEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        setError('保存失败');
      }
    } catch (err) {
      setError('保存失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const hasValue = initialValue?.trim();

  return (
    <div 
      className={`relative bg-white rounded-xl p-4 border transition-all duration-200 ${
        hasValue 
          ? 'border-green-200 shadow-sm hover:shadow-md' 
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* 标题 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <span className="font-medium text-gray-900">{label}</span>
        </div>
        
        {/* 状态指示 */}
        {saved && (
          <span className="flex items-center gap-1 text-green-600 text-sm">
            <Check className="h-4 w-4" />
            已保存
          </span>
        )}
      </div>

      {/* 内容区域 */}
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            autoFocus
          />
          
          {error && (
            <p className="text-red-500 text-xs">{error}</p>
          )}
          
          <div className="flex justify-end gap-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              取消
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  保存
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <span className={`text-sm ${hasValue ? 'text-gray-900' : 'text-gray-400'}`}>
            {hasValue || '未设置'}
          </span>
          
          <button
            onClick={handleEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="编辑"
          >
            <Edit2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

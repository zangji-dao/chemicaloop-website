'use client';

import { useState, useEffect } from 'react';
import { Shield, X, ExternalLink } from 'lucide-react';

export default function AdminSwitchButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // 检查当前是否在管理后台
    setIsAdmin(window.location.pathname.startsWith('/admin'));
  }, []);

  // 管理后台不显示按钮
  if (isAdmin) return null;

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 弹出面板 - 使用 fixed 定位 */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-[9999] bg-white rounded-xl shadow-2xl border border-gray-200 p-3 w-56 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">快捷入口</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <a
            href="/admin/login"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-slate-800 to-slate-700 text-white hover:from-slate-700 hover:to-slate-600 transition-all group"
          >
            <Shield className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">管理后台</p>
              <p className="text-xs text-slate-300">Admin Portal</p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      )}

      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[9999] w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        title="快捷入口"
      >
        <Shield className={`h-6 w-6 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'group-hover:scale-110'}`} />
      </button>
    </>
  );
}

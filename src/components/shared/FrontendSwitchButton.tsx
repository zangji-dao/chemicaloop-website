'use client';

import { useState } from 'react';
import { Home, X, ExternalLink, Globe } from 'lucide-react';

export default function FrontendSwitchButton() {
  const [isOpen, setIsOpen] = useState(false);

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
        <div className="fixed bottom-36 right-6 z-[9999] bg-slate-800 rounded-xl shadow-2xl border border-slate-700 p-3 w-56 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">快捷入口</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* 前端首页 */}
          <a
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 transition-all group"
          >
            <Globe className="h-5 w-5" />
            <div>
              <p className="text-sm font-medium">前端首页</p>
              <p className="text-xs text-blue-200">Frontend Home</p>
            </div>
            <ExternalLink className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        </div>
      )}

      {/* 悬浮按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-6 z-[9999] w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 flex items-center justify-center group"
        title="快捷入口"
      >
        <Home className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'group-hover:scale-110'}`} />
      </button>
    </>
  );
}

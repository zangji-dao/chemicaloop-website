'use client';

import { Loader2, CheckCircle2 } from 'lucide-react';
import { TranslationProgress } from '@/types/spu';

interface TranslatingOverlayProps {
  translating: boolean;
  translationProgress: TranslationProgress;
  translatingFields: Set<string>;
  t: (key: string) => string;
}

const FIELD_LABELS: Record<string, string> = {
  name: '名称',
  description: '描述',
  physicalDescription: '物理描述',
};

export function TranslatingOverlay({
  translating,
  translationProgress,
  translatingFields,
  t,
}: TranslatingOverlayProps) {
  if (!translating) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center overflow-hidden">
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-blue-500/30 flex flex-col items-center gap-4 max-w-md mx-4 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <div className="text-center w-full">
          <p className="text-lg font-medium text-white mb-4">
            {t('spu.translating')}
          </p>
          
          {/* 翻译动态列表 */}
          {translationProgress.status === 'translating' && (
            <div className="space-y-3 mb-4">
              {Array.from(translatingFields).map((field, index) => {
                const isCompleted = index < translationProgress.current;
                const isCurrent = index === translationProgress.current;
                
                return (
                  <div
                    key={field}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                      isCompleted
                        ? 'bg-green-500/10 border border-green-500/30'
                        : isCurrent
                        ? 'bg-blue-500/10 border border-blue-500/30'
                        : 'bg-slate-700/30 border border-slate-600/30'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-slate-500 flex-shrink-0" />
                    )}
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${
                        isCompleted
                          ? 'text-green-400'
                          : isCurrent
                          ? 'text-blue-400'
                          : 'text-slate-400'
                      }`}>
                        {FIELD_LABELS[field] || field}
                      </p>
                      {isCurrent && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {t('spu.translatingField')}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* 进度条 */}
          <div className="mb-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{t('spu.progress')}</span>
              <span>{translationProgress.current} / {translationProgress.total}</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
              />
            </div>
          </div>
          
          <p className="text-xs text-slate-500">{t('spu.translatingTo')}</p>
        </div>
      </div>
    </div>
  );
}

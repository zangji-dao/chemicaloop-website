'use client';

import { Loader2 } from 'lucide-react';
import { TranslationProgress } from '@/types/spu';

interface TranslatingOverlayProps {
  translating: boolean;
  translationProgress: TranslationProgress;
  translatingFields: Set<string>;
  t: (key: string) => string;
}

export function TranslatingOverlay({
  translating,
  translationProgress,
  translatingFields,
  t,
}: TranslatingOverlayProps) {
  if (!translating) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-blue-500/30 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <div className="text-center w-full">
          <p className="text-lg font-medium text-white mb-3">
            {t('spu.translating')}
          </p>
          {translationProgress.status === 'translating' && (
            <>
              {translatingFields.size > 0 && (
                <div className="mb-3 p-2 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">{t('spu.currentField')}</p>
                  <p className="text-sm text-blue-400 font-medium">
                    {Array.from(translatingFields).join(', ')}
                  </p>
                </div>
              )}
              <p className="text-sm text-slate-400 mb-2">
                {translationProgress.current} / {translationProgress.total} {t('spu.fields')}
              </p>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500">{t('spu.translatingTo')}</p>
            </>
          )}
          {translationProgress.status === 'completed' && (
            <p className="text-sm text-green-400">{t('spu.translationCompleted')}</p>
          )}
        </div>
      </div>
    </div>
  );
}

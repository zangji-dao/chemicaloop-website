'use client';

import { Loader2, CheckCircle } from 'lucide-react';
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
  boilingPoint: '沸点',
  meltingPoint: '熔点',
  flashPoint: '闪点',
  hazardClasses: '危险类别',
  healthHazards: '健康危害',
  ghsClassification: 'GHS 分类',
  firstAid: '急救措施',
  storageConditions: '储存条件',
  incompatibleMaterials: '不相容物质',
  solubility: '溶解度',
  vaporPressure: '蒸气压',
  refractiveIndex: '折射率',
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
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-blue-500/30 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
        <div className="text-center w-full">
          <p className="text-lg font-medium text-white mb-3">
            {t('spu.translating')}
          </p>
          {translationProgress.status === 'translating' && (
            <>
              {/* 当前正在翻译的字段 */}
              {translatingFields.size > 0 && (
                <div className="mb-3 p-2 bg-slate-700/50 rounded-lg">
                  <p className="text-xs text-slate-400 mb-1">
                    {t('spu.currentField')}
                  </p>
                  <p className="text-sm text-blue-400 font-medium">
                    {Array.from(translatingFields).map(f => FIELD_LABELS[f] || f).join(', ')}
                  </p>
                </div>
              )}
              
              {/* 进度 */}
              <p className="text-sm text-slate-400 mb-2">
                {translationProgress.current} / {translationProgress.total} {t('spu.fields')}
              </p>
              
              {/* 进度条 */}
              <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                />
              </div>
              
              {/* 目标语言 */}
              <p className="text-xs text-slate-500">
                {t('spu.translatingTo')}
              </p>
            </>
          )}
          {translationProgress.status === 'completed' && (
            <p className="text-sm text-green-400">
              {t('spu.translationCompleted')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

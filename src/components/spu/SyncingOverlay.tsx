'use client';

import { Loader2, Wifi, Database, FileText, Check } from 'lucide-react';
import { SyncProgress } from '@/types/spu';

interface SyncingOverlayProps {
  syncingPubChem: boolean;
  syncProgress: SyncProgress;
  t: (key: string) => string;
}

// 步骤顺序
const STEPS = ['connecting', 'fetching', 'updating'] as const;

export function SyncingOverlay({ syncingPubChem, syncProgress, t }: SyncingOverlayProps) {
  if (!syncingPubChem) return null;

  const currentStepIndex = STEPS.indexOf(syncProgress.step as typeof STEPS[number]);

  // 步骤配置
  const stepConfig = [
    { key: 'connecting', icon: Wifi, label: t('spu.connecting') },
    { key: 'fetching', icon: Database, label: t('spu.fetchingData') },
    { key: 'updating', icon: FileText, label: t('spu.updatingForm') },
  ];

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-purple-500/30 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        <div className="text-center w-full">
          <p className="text-lg font-medium text-white mb-4">
            {t('spu.syncingPubchem')}
          </p>
          {syncProgress.message && (
            <p className="text-sm text-purple-300 mb-3">{syncProgress.message}</p>
          )}
          <div className="space-y-2">
            {stepConfig.map((step, index) => {
              const isCompleted = index < currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = step.icon;

              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-2 text-sm ${
                    isCurrent ? 'text-purple-400' : isCompleted ? 'text-green-400' : 'text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-500" />
                  )}
                  <span className="flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Loader2, Wifi, Database, FileText } from 'lucide-react';
import { SyncProgress } from '@/types/spu';

interface SyncingOverlayProps {
  syncingPubChem: boolean;
  syncProgress: SyncProgress;
  t: (key: string) => string;
}

export function SyncingOverlay({ syncingPubChem, syncProgress, t }: SyncingOverlayProps) {
  if (!syncingPubChem) return null;

  return (
    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-purple-500/30 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
        <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
        <div className="text-center w-full">
          <p className="text-lg font-medium text-white mb-4">
            {t('spu.syncingPubchem')}
          </p>
          <div className="space-y-2">
            <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'connecting' ? 'text-purple-400' : 'text-slate-500'}`}>
              {syncProgress.step === 'connecting' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-500" />
              )}
              <span className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                {t('spu.connecting')}
              </span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'fetching' ? 'text-purple-400' : 'text-slate-500'}`}>
              {syncProgress.step === 'fetching' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-500" />
              )}
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                {t('spu.fetchingData')}
              </span>
            </div>
            <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'updating' ? 'text-purple-400' : 'text-slate-500'}`}>
              {syncProgress.step === 'updating' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-500" />
              )}
              <span className="flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {t('spu.updatingForm')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { CheckCircle, X } from 'lucide-react';
import { DialogConfig } from '@/types/spu';

interface StatusDialogProps {
  dialogConfig: DialogConfig | null;
  onClose: () => void;
  locale: string;
}

export function StatusDialog({ dialogConfig, onClose, locale }: StatusDialogProps) {
  if (!dialogConfig) return null;

  const handleClose = () => {
    const callback = dialogConfig.onConfirm;
    onClose();
    callback?.();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100]">
      <div className="bg-slate-800 rounded-xl p-6 shadow-xl w-[420px] max-w-[calc(100vw-2rem)] border border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          {dialogConfig.type === 'success' && <CheckCircle className="w-6 h-6 text-green-400" />}
          {dialogConfig.type === 'error' && <X className="w-6 h-6 text-red-400" />}
          <h3 className="text-lg font-semibold text-white">{dialogConfig.title}</h3>
        </div>
        <p className="text-sm text-slate-300 mb-6">{dialogConfig.message}</p>
        <button
          onClick={handleClose}
          className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {locale === 'zh' ? '确定' : 'OK'}
        </button>
      </div>
    </div>
  );
}

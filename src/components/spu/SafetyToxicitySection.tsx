'use client';

import { FormData } from '@/types/spu';

interface SafetyToxicitySectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  t: (key: string) => string;
}

// 自动调整 textarea 高度
const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const target = e.target;
  target.style.height = 'auto';
  target.style.height = target.scrollHeight + 'px';
};

export function SafetyToxicitySection({ formData, setFormData, t }: SafetyToxicitySectionProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">{t('spu.safetyToxicity')}</h3>
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.hazardClasses')}</label>
          <input
            type="text"
            value={formData.hazardClasses}
            onChange={(e) => setFormData(prev => ({ ...prev, hazardClasses: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.healthHazards')}</label>
          <textarea
            value={formData.healthHazards}
            onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, healthHazards: e.target.value })); }}
            className="form-input-dark overflow-hidden"
            style={{ height: 'auto' }}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.firstAid')}</label>
            <textarea
              value={formData.firstAid}
              onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, firstAid: e.target.value })); }}
              className="form-input-dark overflow-hidden"
              style={{ height: 'auto' }}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.storageConditions')}</label>
            <textarea
              value={formData.storageConditions}
              onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, storageConditions: e.target.value })); }}
              className="form-input-dark overflow-hidden"
              style={{ height: 'auto' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

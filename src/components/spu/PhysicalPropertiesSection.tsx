'use client';

import { FormData } from '@/types/spu';

interface PhysicalPropertiesSectionProps {
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

export function PhysicalPropertiesSection({ formData, setFormData, t }: PhysicalPropertiesSectionProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">{t('spu.physicalProperties')}</h3>
      <div className="mb-3">
        <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.physicalDescription')}</label>
        <textarea
          value={formData.physicalDescription}
          onChange={(e) => { autoResizeTextarea(e); setFormData(prev => ({ ...prev, physicalDescription: e.target.value })); }}
          className="form-input-dark overflow-hidden"
          style={{ height: 'auto' }}
        />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.colorForm')}</label>
          <input
            type="text"
            value={formData.colorForm}
            onChange={(e) => setFormData(prev => ({ ...prev, colorForm: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.odor')}</label>
          <input
            type="text"
            value={formData.odor}
            onChange={(e) => setFormData(prev => ({ ...prev, odor: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.density')}</label>
          <input
            type="text"
            value={formData.density}
            onChange={(e) => setFormData(prev => ({ ...prev, density: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.boilingPoint')}</label>
          <input
            type="text"
            value={formData.boilingPoint}
            onChange={(e) => setFormData(prev => ({ ...prev, boilingPoint: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.meltingPoint')}</label>
          <input
            type="text"
            value={formData.meltingPoint}
            onChange={(e) => setFormData(prev => ({ ...prev, meltingPoint: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.flashPoint')}</label>
          <input
            type="text"
            value={formData.flashPoint}
            onChange={(e) => setFormData(prev => ({ ...prev, flashPoint: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.solubility')}</label>
          <input
            type="text"
            value={formData.solubility}
            onChange={(e) => setFormData(prev => ({ ...prev, solubility: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.vaporPressure')}</label>
          <input
            type="text"
            value={formData.vaporPressure}
            onChange={(e) => setFormData(prev => ({ ...prev, vaporPressure: e.target.value }))}
            className="form-input-dark"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.refractiveIndex')}</label>
          <input
            type="text"
            value={formData.refractiveIndex}
            onChange={(e) => setFormData(prev => ({ ...prev, refractiveIndex: e.target.value }))}
            className="form-input-dark"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { FormData, hsCodeCountries } from '@/types/spu';

interface BasicInfoSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isEditMode: boolean;
  t: (key: string) => string;
}

export function BasicInfoSection({ formData, setFormData, isEditMode, t }: BasicInfoSectionProps) {
  const [showHsExtensions, setShowHsExtensions] = useState(false);

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">{t('spu.basicInformation')}</h3>
      <div className="grid grid-cols-3 gap-4">
        {/* CAS号 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {t('spu.casNumber')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.cas}
            onChange={(e) => setFormData(prev => ({ ...prev, cas: e.target.value }))}
            disabled={isEditMode}
            placeholder="50-00-0"
            className="form-input-dark disabled:opacity-50"
          />
        </div>
        {/* HS编码 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.hsCode')}</label>
          <input
            type="text"
            value={formData.hsCode}
            onChange={(e) => setFormData(prev => ({ ...prev, hsCode: e.target.value.replace(/[^0-9.]/g, '').slice(0, 20) }))}
            placeholder="290241"
            className="form-input-dark-mono"
          />
        </div>
        {/* 状态 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('common.status')}</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
            className="form-input-dark"
          >
            <option value="ACTIVE">{t('spu.active')}</option>
            <option value="INACTIVE">{t('spu.inactive')}</option>
          </select>
        </div>
        {/* 中文名称 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            {t('spu.nameZh')} <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder={t('spu.placeholderChineseName')}
            className="form-input-dark"
          />
        </div>
        {/* 英文名称 */}
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.nameEn')}</label>
          <input
            type="text"
            value={formData.nameEn}
            onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
            placeholder="English Name"
            className="form-input-dark"
          />
        </div>
      </div>
      {/* HS编码国家扩展 */}
      <div className="mt-3">
        <button
          type="button"
          onClick={() => setShowHsExtensions(!showHsExtensions)}
          className="text-xs text-blue-400 hover:text-blue-300"
        >
          {showHsExtensions ? t('spu.hideCountryExtensions') : t('spu.addCountryExtensions')}
        </button>
        {showHsExtensions && (
          <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-slate-700/30 rounded-lg">
            {hsCodeCountries.map((country) => (
              <div key={country.code} className="flex items-center gap-2">
                <span className="w-12 text-xs text-slate-400">{country.code}</span>
                <input
                  type="text"
                  value={formData.hsCodeExtensions[country.code] || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    hsCodeExtensions: { ...prev.hsCodeExtensions, [country.code]: e.target.value }
                  }))}
                  placeholder={`${country.digits}位编码`}
                  className="form-input-dark-sm font-mono"
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

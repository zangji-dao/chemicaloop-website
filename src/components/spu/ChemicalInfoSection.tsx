'use client';

import { FormData } from '@/types/spu';

interface ChemicalInfoSectionProps {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  t: (key: string) => string;
}

export function ChemicalInfoSection({ formData, setFormData, t }: ChemicalInfoSectionProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-white mb-4">{t('spu.chemicalInformation')}</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.formula')}</label>
          <input
            type="text"
            value={formData.formula}
            onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
            placeholder="C2H5OH"
            className="form-input-dark-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.molecularWeight')}</label>
          <input
            type="text"
            value={formData.molecularWeight}
            onChange={(e) => setFormData(prev => ({ ...prev, molecularWeight: e.target.value }))}
            placeholder="46.07"
            className="form-input-dark-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">SMILES</label>
          <input
            type="text"
            value={formData.smiles}
            onChange={(e) => setFormData(prev => ({ ...prev, smiles: e.target.value }))}
            placeholder="CCO"
            className="form-input-dark-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">InChI Key</label>
          <input
            type="text"
            value={formData.inchiKey}
            onChange={(e) => setFormData(prev => ({ ...prev, inchiKey: e.target.value }))}
            placeholder="LFQSCWFLJHTTHZ-UHFFFAOYSA-N"
            className="form-input-dark-mono"
          />
        </div>
      </div>
    </div>
  );
}

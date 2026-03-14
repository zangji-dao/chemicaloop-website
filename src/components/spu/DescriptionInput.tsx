'use client';

import { FormData } from '@/types/spu';

interface DescriptionInputProps {
  description: string;
  onChange: (description: string) => void;
  t: (key: string) => string;
}

// 自动调整 textarea 高度
const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  const target = e.target;
  target.style.height = 'auto';
  target.style.height = target.scrollHeight + 'px';
};

export function DescriptionInput({ description, onChange, t }: DescriptionInputProps) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.description')}</label>
      <textarea
        value={description}
        onChange={(e) => { autoResizeTextarea(e); onChange(e.target.value); }}
        placeholder={t('spu.placeholderDescription')}
        className="form-input-dark overflow-hidden"
        style={{ height: 'auto' }}
      />
    </div>
  );
}

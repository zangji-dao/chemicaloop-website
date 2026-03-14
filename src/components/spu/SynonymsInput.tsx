'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface SynonymsInputProps {
  synonyms: string[];
  onChange: (synonyms: string[]) => void;
  t: (key: string) => string;
}

export function SynonymsInput({ synonyms, onChange, t }: SynonymsInputProps) {
  const [synonymInput, setSynonymInput] = useState('');

  const addSynonym = () => {
    if (synonymInput.trim()) {
      onChange([...synonyms, synonymInput.trim()]);
      setSynonymInput('');
    }
  };

  const removeSynonym = (index: number) => {
    onChange(synonyms.filter((_, i) => i !== index));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSynonym();
    }
  };

  return (
    <div className="mb-8">
      <label className="block text-xs font-medium text-slate-300 mb-1">{t('spu.synonyms')}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {synonyms.map((syn, idx) => (
          <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 rounded text-xs">
            {syn}
            <button
              type="button"
              onClick={() => removeSynonym(idx)}
              className="text-slate-400 hover:text-red-400"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={synonymInput}
          onChange={(e) => setSynonymInput(e.target.value)}
          onKeyPress={handleKeyPress}
          className="form-input-dark flex-1"
        />
        <button
          type="button"
          onClick={addSynonym}
          className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}

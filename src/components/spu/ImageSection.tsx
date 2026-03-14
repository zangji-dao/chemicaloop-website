'use client';

import { Database, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { PubChemInfo } from '@/types/spu';

interface ImageSectionProps {
  structureImageUrl: string | null;
  productImageUrl: string | null;
  pubchemInfo: PubChemInfo;
  isEditMode: boolean;
  isNewMode: boolean;
  generatingImage: boolean;
  onGenerateImage: () => void;
  t: (key: string) => string;
  locale: string;
}

export function ImageSection({
  structureImageUrl,
  productImageUrl,
  pubchemInfo,
  isEditMode,
  isNewMode,
  generatingImage,
  onGenerateImage,
  t,
  locale,
}: ImageSectionProps) {
  return (
    <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-slate-400">{t('spu.pubchemData')}</span>
        {pubchemInfo.cid && (
          <span className="text-xs text-slate-500">
            CID: <span className="text-blue-400">{pubchemInfo.cid}</span>
            {pubchemInfo.syncedAt && (
              <span className="ml-2">| {t('spu.syncedOn')}: {new Date(pubchemInfo.syncedAt).toLocaleDateString()}</span>
            )}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-6">
        {/* 2D 结构图 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm text-slate-400">{t('spu.structure2D')}</span>
            {pubchemInfo.cid && (
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemInfo.cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
          <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
            {structureImageUrl ? (
              <img src={structureImageUrl} alt="2D Structure" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-slate-500">
                <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{t('spu.syncPubchemToDisplay')}</p>
              </div>
            )}
          </div>
        </div>
        {/* 产品图 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">{t('spu.productImage')}</span>
            {isEditMode && pubchemInfo.cid && (
              <button
                type="button"
                onClick={onGenerateImage}
                disabled={generatingImage}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
              >
                {generatingImage ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{t('spu.generating')}</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" />
                    <span>{productImageUrl ? t('spu.redraw') : t('spu.generate')}</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="aspect-square bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/50 flex items-center justify-center overflow-hidden">
            {productImageUrl ? (
              <img src={productImageUrl} alt="Product" className="max-w-full max-h-full object-contain" />
            ) : (
              <div className="text-center text-slate-500">
                <Database className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">
                  {isEditMode && pubchemInfo.cid
                    ? t('spu.clickToGenerate')
                    : (isNewMode ? (locale === 'zh' ? '保存后可生成' : 'Save to generate') : t('spu.syncPubchemFirst'))}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

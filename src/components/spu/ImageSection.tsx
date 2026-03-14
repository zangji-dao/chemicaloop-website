'use client';

import { Database, ExternalLink, RefreshCw, Loader2, X, Check } from 'lucide-react';
import { PubChemInfo } from '@/types/spu';

interface ImageSectionProps {
  structureImageUrl: string | null;
  productImageUrl: string | null;
  pubchemInfo: PubChemInfo;
  isEditMode: boolean;
  isNewMode: boolean;
  generatingImage: boolean;
  onGenerateImage: (force: boolean) => void;
  t: (key: string) => string;
  locale: string;
  // 图片对比弹窗
  newProductImageUrl: string | null;
  showImageCompareModal: boolean;
  onUseNewImage: () => void;
  onKeepOldImage: () => void;
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
  newProductImageUrl,
  showImageCompareModal,
  onUseNewImage,
  onKeepOldImage,
}: ImageSectionProps) {
  return (
    <>
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
                  onClick={() => onGenerateImage(!!productImageUrl)}
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
            <div className="aspect-square bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg border border-slate-600/50 flex items-center justify-center overflow-hidden group relative">
              {productImageUrl ? (
                <>
                  <img src={productImageUrl} alt="Product" className="max-w-full max-h-full object-contain" />
                  {/* 悬停时显示重绘按钮 */}
                  {isEditMode && pubchemInfo.cid && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => onGenerateImage(true)}
                        disabled={generatingImage}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/90 text-white rounded text-xs font-medium hover:bg-blue-500 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        {t('spu.redraw')}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => onGenerateImage(false)}
                  disabled={generatingImage || !pubchemInfo.cid}
                  className="flex flex-col items-center gap-2 text-slate-500 hover:text-blue-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generatingImage ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="text-xs">{t('spu.generating')}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-12 h-12 rounded-full bg-slate-600/50 flex items-center justify-center">
                        <RefreshCw className="w-6 h-6" />
                      </div>
                      <span className="text-xs">
                        {pubchemInfo.cid ? t('spu.clickToGenerate') : t('spu.syncPubchemFirst')}
                      </span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 图片对比弹窗 */}
      {showImageCompareModal && newProductImageUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* 头部：标题 + 操作按钮 */}
            <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-5 py-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">
                  {locale === 'zh' ? '选择要使用的图片' : 'Choose Image'}
                </h2>
                <button
                  onClick={onKeepOldImage}
                  className="p-1 hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* 操作按钮 */}
              <div className="flex items-center justify-center gap-4 mt-3">
                <button
                  onClick={onKeepOldImage}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>{locale === 'zh' ? '保留原图' : 'Keep Current'}</span>
                </button>
                <button
                  onClick={onUseNewImage}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>{locale === 'zh' ? '使用新图片' : 'Use New Image'}</span>
                  <span className="text-green-200 text-xs">({locale === 'zh' ? 'AI重绘' : 'AI Redrawn'})</span>
                </button>
              </div>
            </div>
            
            {/* 图片对比 */}
            <div className="flex-1 overflow-auto p-5">
              <div className="grid grid-cols-2 gap-6">
                {/* 原图 */}
                <div className="flex flex-col">
                  <div className="text-center text-sm text-slate-400 mb-2">
                    {locale === 'zh' ? '当前图片' : 'Current Image'}
                  </div>
                  <div className="aspect-square bg-slate-900/50 rounded-lg border border-slate-600/50 flex items-center justify-center overflow-hidden">
                    {productImageUrl && (
                      <img src={productImageUrl} alt="Current" className="max-w-full max-h-full object-contain" />
                    )}
                  </div>
                </div>
                
                {/* 新图 */}
                <div className="flex flex-col">
                  <div className="text-center text-sm text-green-400 mb-2">
                    {locale === 'zh' ? '新图片 (AI重绘)' : 'New Image (AI Redrawn)'}
                  </div>
                  <div className="aspect-square bg-slate-900/50 rounded-lg border border-green-500/50 flex items-center justify-center overflow-hidden">
                    {newProductImageUrl && (
                      <img src={newProductImageUrl} alt="New" className="max-w-full max-h-full object-contain" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

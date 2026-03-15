'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  ImageIcon,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { useSPUCreateImage } from '@/hooks/useSPUCreateImage';
import { StatusDialog } from '@/components/spu/StatusDialog';

function SPUCreateImageContent() {
  const { locale } = useAdminLocale();
  const router = useRouter();

  const {
    syncingPubChem,
    syncProgress,
    generatingImage,
    cas,
    pubchemData,
    structureImageUrl,
    productImageUrl,
    productImageKey,
    handleSyncPubChem,
    handleGenerateProductImage,
    handleNext,
    handleBack,
    dialogConfig,
    setDialogConfig,
  } = useSPUCreateImage(locale);

  // 禁止滚动 - 当遮罩层显示时
  useEffect(() => {
    if (syncingPubChem) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [syncingPubChem]);

  // 同步进度组件
  const SyncProgressOverlay = () => {
    if (!syncingPubChem) return null;

    const getStepIcon = () => {
      switch (syncProgress.step) {
        case 'connecting':
        case 'fetching':
        case 'updating':
          return <Loader2 className="w-12 h-12 animate-spin text-blue-400" />;
        case 'done':
          return <RefreshCw className="w-12 h-12 text-green-400" />;
        case 'error':
          return <AlertCircle className="w-12 h-12 text-red-400" />;
        default:
          return <Loader2 className="w-12 h-12 animate-spin text-blue-400" />;
      }
    };

    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full mx-4 text-center shadow-2xl">
          {getStepIcon()}
          <p className="mt-4 text-lg text-white">{syncProgress.message}</p>
          {syncProgress.step !== 'error' && (
            <div className="mt-4 flex justify-center gap-1">
              {['connecting', 'fetching', 'updating'].map((step, index) => (
                <div
                  key={step}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    ['connecting', 'fetching', 'updating'].indexOf(syncProgress.step) >= index
                      ? 'bg-blue-400'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 同步遮罩层 */}
      <SyncProgressOverlay />

      {/* 顶部导航 */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-5 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{locale === 'zh' ? '返回' : 'Back'}</span>
            </button>

            <h1 className="text-lg font-medium">
              {locale === 'zh' ? '生成产品图' : 'Generate Product Image'}
            </h1>

            <div className="w-20" />
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto px-5 py-8">
        {/* CAS 信息 */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">{locale === 'zh' ? 'CAS 号' : 'CAS Number'}</div>
              <div className="text-xl font-medium mt-1">{cas}</div>
            </div>
            {pubchemData?.cid && (
              <div className="text-right">
                <div className="text-sm text-slate-400">PubChem CID</div>
                <div className="text-lg mt-1">{pubchemData.cid}</div>
              </div>
            )}
          </div>
          {pubchemData?.nameEn && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-sm text-slate-400">{locale === 'zh' ? '英文名称' : 'English Name'}</div>
              <div className="mt-1">{pubchemData.nameEn}</div>
            </div>
          )}
        </div>

        {/* 图片展示区域 */}
        <div className="grid grid-cols-2 gap-6">
          {/* 2D 结构图 */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="text-sm text-slate-400 mb-3">
              {locale === 'zh' ? '2D 结构图' : '2D Structure'}
            </div>
            <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
              {structureImageUrl ? (
                <img
                  src={structureImageUrl}
                  alt="2D Structure"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-sm">
                  {syncingPubChem 
                    ? (locale === 'zh' ? '加载中...' : 'Loading...') 
                    : (locale === 'zh' ? '暂无结构图' : 'No structure')}
                </div>
              )}
            </div>
          </div>

          {/* 产品图 */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="text-sm text-slate-400 mb-3">
              {locale === 'zh' ? '产品图' : 'Product Image'}
            </div>
            <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
              {productImageUrl ? (
                <img
                  src={productImageUrl}
                  alt="Product Image"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                  {locale === 'zh' ? '点击下方生成' : 'Click below to generate'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="mt-8 flex flex-col gap-4">
          {/* 生成产品图按钮 */}
          <button
            onClick={handleGenerateProductImage}
            disabled={syncingPubChem || generatingImage || !pubchemData?.cid}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-medium text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {generatingImage ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {locale === 'zh' ? '生成中...' : 'Generating...'}
              </>
            ) : productImageUrl ? (
              locale === 'zh' ? '重新生成产品图' : 'Regenerate Product Image'
            ) : (
              locale === 'zh' ? '生成产品图' : 'Generate Product Image'
            )}
          </button>

          {/* 下一步按钮 */}
          {productImageKey && (
            <button
              onClick={handleNext}
              className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-xl font-medium text-lg transition-all flex items-center justify-center gap-3"
            >
              {locale === 'zh' ? '下一步' : 'Next'}
              <ArrowRight className="w-5 h-5" />
            </button>
          )}

          {/* 重新同步按钮 */}
          <button
            onClick={handleSyncPubChem}
            disabled={syncingPubChem || generatingImage}
            className="text-sm text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncingPubChem ? 'animate-spin' : ''}`} />
            {locale === 'zh' ? '重新同步 PubChem' : 'Re-sync PubChem'}
          </button>
        </div>
      </div>

      {/* 弹窗 */}
      <StatusDialog
        dialogConfig={dialogConfig}
        onClose={() => setDialogConfig(null)}
        locale={locale}
      />
    </div>
  );
}

export default function SPUCreateImagePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <SPUCreateImageContent />
    </Suspense>
  );
}

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
  CheckCircle2,
  Circle,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { useSPUCreateImage } from '@/hooks/useSPUCreateImage';
import { StatusDialog } from '@/components/spu/StatusDialog';

function SPUCreateImageContent() {
  const { locale, t } = useAdminLocale();
  const router = useRouter();

  const {
    syncingPubChem,
    syncProgress,
    generatingImage,
    step,
    cas,
    pubchemData,
    structureImageUrl,
    productImageUrl,
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

  // 同步进度遮罩
  const SyncProgressOverlay = () => {
    if (!syncingPubChem) return null;

    const getStepIcon = () => {
      switch (syncProgress.step) {
        case 'connecting':
        case 'fetching':
        case 'updating':
          return <Loader2 className="w-12 h-12 animate-spin text-blue-400" />;
        case 'done':
          return <CheckCircle2 className="w-12 h-12 text-green-400" />;
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
              {['connecting', 'fetching', 'updating'].map((s, index) => (
                <div
                  key={s}
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

  // 步骤指示器
  const StepIndicator = () => {
    const steps = [
      { key: 'sync', label: t('spu.getStructure') },
      { key: 'generate', label: t('spu.generateImage') },
      { key: 'next', label: t('spu.fillInfo') },
    ];

    const getStepStatus = (stepKey: string) => {
      const stepOrder = ['sync', 'generate', 'next'];
      const currentOrder = stepOrder.indexOf(step);
      const thisOrder = stepOrder.indexOf(stepKey);
      
      if (thisOrder < currentOrder) return 'completed';
      if (thisOrder === currentOrder) return 'current';
      return 'pending';
    };

    return (
      <div className="flex items-center justify-center gap-1">
        {steps.map((s, index) => {
          const status = getStepStatus(s.key);
          return (
            <div key={s.key} className="flex items-center">
              <div className="flex items-center gap-1.5">
                {status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : status === 'current' ? (
                  <Circle className="w-4 h-4 text-blue-400 fill-blue-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
                <span className={`text-xs font-medium ${
                  status === 'completed' ? 'text-green-400' :
                  status === 'current' ? 'text-white' : 'text-slate-500'
                }`}>
                  {s.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-6 h-px mx-1.5 ${
                  status === 'completed' ? 'bg-green-400' : 'bg-slate-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // 渲染顶部操作按钮
  const renderActionButtons = () => {
    if (step === 'sync') {
      return (
        <button
          onClick={handleSyncPubChem}
          disabled={syncingPubChem}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {syncingPubChem ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('spu.fetching')}</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              <span>{t('spu.getStructure')}</span>
            </>
          )}
        </button>
      );
    }

    if (step === 'generate') {
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncPubChem}
            disabled={syncingPubChem}
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${syncingPubChem ? 'animate-spin' : ''}`} />
            <span>{t('spu.reGet')}</span>
          </button>
          <button
            onClick={handleGenerateProductImage}
            disabled={generatingImage}
            className="flex items-center gap-2 px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            {generatingImage ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{t('spu.generating')}</span>
              </>
            ) : (
              <>
                <ImageIcon className="h-4 w-4" />
                <span>{t('spu.generateImage')}</span>
              </>
            )}
          </button>
        </div>
      );
    }

    // step === 'next'
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleGenerateProductImage}
          disabled={generatingImage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg text-sm transition-colors"
        >
          <ImageIcon className="h-3.5 w-3.5" />
          <span>{t('spu.regenerate')}</span>
        </button>
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
        >
          <span>{t('spu.next')}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
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
          {/* 第一行：返回 + 标题 + 操作按钮 */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{t('spu.back')}</span>
            </button>

            <h1 className="text-lg font-medium">
              {t('spu.createProduct')}
            </h1>

            {renderActionButtons()}
          </div>

          {/* 第二行：步骤指示器 */}
          <div className="mt-3 pt-3 border-t border-slate-700/30">
            <StepIndicator />
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-2xl mx-auto px-5 py-6">
        {/* CAS 信息卡片 */}
        <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">{t('spu.casNumber')}</div>
              <div className="text-xl font-medium mt-1">{cas}</div>
            </div>
            {pubchemData?.cid && (
              <div className="text-right">
                <div className="text-sm text-slate-400">PubChem CID</div>
                <div className="text-lg mt-1 text-blue-400">{pubchemData.cid}</div>
              </div>
            )}
          </div>
          {pubchemData?.nameEn && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <div className="text-sm text-slate-400">{t('spu.englishName')}</div>
              <div className="mt-1">{pubchemData.nameEn}</div>
            </div>
          )}
        </div>

        {/* 图片展示区域 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 2D 结构图 */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-400">
                {t('spu.structure2D')}
              </div>
              {structureImageUrl && (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
              {structureImageUrl ? (
                <img
                  src={structureImageUrl}
                  alt="2D Structure"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-sm text-center px-4">
                  {syncingPubChem 
                    ? t('spu.loading') 
                    : t('spu.clickButtonAbove')}
                </div>
              )}
            </div>
          </div>

          {/* 产品图 */}
          <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-400">
                {t('spu.productImage')}
              </div>
              {productImageUrl && (
                <CheckCircle2 className="w-4 h-4 text-green-400" />
              )}
            </div>
            <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
              {productImageUrl ? (
                <img
                  src={productImageUrl}
                  alt="Product Image"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-slate-500 text-sm flex flex-col items-center gap-2 text-center px-4">
                  <ImageIcon className="w-8 h-8 opacity-50" />
                  {step === 'sync' 
                    ? t('spu.getStructureFirst')
                    : t('spu.clickButtonGenerate')}
                </div>
              )}
            </div>
          </div>
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

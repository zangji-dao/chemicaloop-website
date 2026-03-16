'use client';

import { Suspense } from 'react';
import {
  ArrowLeft,
  Loader2,
  ImageIcon,
  ArrowRight,
  CheckCircle2,
  Circle,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { useSPUCreateImage } from '@/hooks/useSPUCreateImage';
import { StatusDialog } from '@/components/spu/StatusDialog';

function SPUCreateImageContent() {
  const { locale, t } = useAdminLocale();

  const {
    loadingData,
    loadingProgress,
    generatingImage,
    step,
    cas,
    previewData,
    structureImageUrl,
    productImageUrl,
    errorMessage,
    handleRetryLoad,
    handleGenerateProductImage,
    handleNext,
    handleBack,
    dialogConfig,
    setDialogConfig,
  } = useSPUCreateImage(locale);

  // 步骤指示器
  const StepIndicator = () => {
    const steps = [
      { key: 'sync', label: t('spu.getStructure') },
      { key: 'generate', label: t('spu.generateImage') },
      { key: 'next', label: t('spu.fillInfo') },
    ];

    const getStepStatus = (stepKey: string) => {
      const stepOrder = ['loading', 'generate', 'next', 'error'];
      const currentOrder = stepOrder.indexOf(step);
      const thisOrder = stepOrder.indexOf(stepKey === 'sync' ? 'loading' : stepKey);
      
      if (step === 'error' && stepKey === 'sync') return 'error';
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
                ) : status === 'error' ? (
                  <AlertCircle className="w-4 h-4 text-red-400" />
                ) : (
                  <Circle className="w-4 h-4 text-slate-600" />
                )}
                <span className={`text-xs font-medium ${
                  status === 'completed' ? 'text-green-400' :
                  status === 'current' ? 'text-white' : 
                  status === 'error' ? 'text-red-400' : 'text-slate-500'
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
    if (step === 'loading') {
      return (
        <div className="flex items-center gap-2 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">{loadingProgress.message}</span>
        </div>
      );
    }

    if (step === 'error') {
      return (
        <button
          onClick={handleRetryLoad}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          <span>{t('spu.reGet')}</span>
        </button>
      );
    }

    if (step === 'next') {
      return (
        <button
          onClick={handleNext}
          className="flex items-center gap-2 px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-sm font-medium transition-colors"
        >
          <span>{t('common.next')}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-6">
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
              <span className="text-sm">{t('common.previous')}</span>
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
      <div className="max-w-2xl mx-auto px-5 py-4">
        {/* 加载状态 */}
        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
            <p className="mt-4 text-slate-400">{loadingProgress.message}</p>
          </div>
        )}

        {/* 错误状态 */}
        {step === 'error' && (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="mt-4 text-red-400 text-center max-w-md">{errorMessage}</p>
            <button
              onClick={handleBack}
              className="mt-6 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.previous')}
            </button>
          </div>
        )}

        {/* 正常状态：显示图片 */}
        {(step === 'generate' || step === 'next') && (
          <>
            {/* CAS 信息卡片 */}
            <div className="mb-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs text-slate-400">{t('spu.casNumber')}</div>
                    <div className="text-lg font-medium">{cas}</div>
                  </div>
                  {previewData?.pubchemCid && (
                    <div className="text-slate-600">|</div>
                  )}
                  {previewData?.pubchemCid && (
                    <div>
                      <div className="text-xs text-slate-400">PubChem CID</div>
                      <div className="text-blue-400">{previewData.pubchemCid}</div>
                    </div>
                  )}
                  {previewData?.nameEn && (
                    <>
                      <div className="text-slate-600">|</div>
                      <div>
                        <div className="text-xs text-slate-400">{t('spu.englishName')}</div>
                        <div className="text-sm">{previewData.nameEn}</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* 图片展示区域 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 2D 结构图 - 已获取 */}
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-400">
                    {t('spu.structure2D')}
                  </div>
                  {structureImageUrl && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  )}
                </div>
                <div className="aspect-[4/3] bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  {structureImageUrl ? (
                    <img
                      src={structureImageUrl}
                      alt="2D Structure"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-slate-500 text-xs text-center px-3">
                      {t('common.loading')}
                    </div>
                  )}
                </div>
              </div>

              {/* 产品图 - 可生成 */}
              <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs text-slate-400">
                    {t('spu.productImage')}
                  </div>
                  {productImageUrl && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  )}
                </div>
                <div className="aspect-[4/3] bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                  {productImageUrl ? (
                    <img
                      src={productImageUrl}
                      alt="Product Image"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <button
                      onClick={handleGenerateProductImage}
                      disabled={generatingImage}
                      className="flex flex-col items-center gap-2 text-center px-3 py-4 hover:bg-white/5 rounded-lg transition-colors w-full h-full justify-center"
                    >
                      {generatingImage ? (
                        <>
                          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                          <span className="text-xs text-slate-400">{t('spu.generating')}</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-6 h-6 text-purple-400" />
                          <span className="text-xs text-purple-400">{t('spu.generateImage')}</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
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

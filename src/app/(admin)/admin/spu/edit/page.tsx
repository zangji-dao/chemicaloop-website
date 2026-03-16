'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  RefreshCw,
  Save,
  Loader2,
  ArrowLeft,
  Languages,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';

// 组件
import { BasicInfoSection } from '@/components/spu/BasicInfoSection';
import { ChemicalInfoSection } from '@/components/spu/ChemicalInfoSection';
import { PhysicalPropertiesSection } from '@/components/spu/PhysicalPropertiesSection';
import { SafetyToxicitySection } from '@/components/spu/SafetyToxicitySection';
import { SynonymsInput } from '@/components/spu/SynonymsInput';
import { DescriptionInput } from '@/components/spu/DescriptionInput';
import { ImageSection } from '@/components/spu/ImageSection';
import { SyncingOverlay } from '@/components/spu/SyncingOverlay';
import { TranslatingOverlay } from '@/components/spu/TranslatingOverlay';
import { StatusDialog } from '@/components/spu/StatusDialog';

// Hook
import { useSPUEdit } from '@/hooks/useSPUEdit';

function SPUEditContent() {
  const { t, locale } = useAdminLocale();
  const searchParams = useSearchParams();
  const router = useRouter();

  // URL 参数
  const spuId = searchParams.get('id');
  const casNumber = searchParams.get('cas');

  // 使用 Hook 管理所有状态和逻辑
  const {
    loading,
    saving,
    spu,
    formData,
    setFormData,
    structureImageUrl,
    productImageUrl,
    setProductImageUrl,
    generatingImage,
    newProductImageUrl,
    showImageCompareModal,
    handleUseNewImage,
    handleKeepOldImage,
    pubchemInfo,
    syncingPubChem,
    syncProgress,
    translating,
    translatingFields,
    translationProgress,
    needTranslate,
    dialogConfig,
    setDialogConfig,
    isEditMode,
    isNewMode,
    handleSyncPubChem,
    handleTranslate,
    handleSave,
    handleGenerateProductImage,
    handleBack,
  } = useSPUEdit({ spuId, casNumber, locale, t });

  // 禁止滚动 - 当遮罩层或弹窗显示时
  useEffect(() => {
    const shouldLockScroll = syncingPubChem || translating || dialogConfig || showImageCompareModal;

    if (shouldLockScroll) {
      // 记录当前滚动位置
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      document.body.style.overflow = 'hidden';
    } else {
      // 恢复滚动
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    }

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
    };
  }, [syncingPubChem, translating, dialogConfig, showImageCompareModal]);

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* 同步遮罩层 */}
      <SyncingOverlay
        syncingPubChem={syncingPubChem}
        syncProgress={syncProgress}
        t={t}
      />

      {/* 翻译遮罩层 */}
      <TranslatingOverlay
        translating={translating}
        translationProgress={translationProgress}
        translatingFields={translatingFields}
        t={t}
      />

      {/* 顶部导航 */}
      <div className="bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50 px-6 py-4 sticky top-0 z-20">
        <div className="flex items-center justify-between relative">
          {/* 左侧：返回 + 同步按钮 */}
          <div className="flex items-center gap-4 flex-shrink-0">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{locale === 'zh' ? '返回' : 'Back'}</span>
            </button>

            <div className="w-px h-5 bg-slate-600" />

            <button
              type="button"
              onClick={handleSyncPubChem}
              disabled={syncingPubChem || saving || translating}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors disabled:opacity-50"
            >
              {syncingPubChem ? (
                <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-purple-400" />
              )}
              <span>{t('spu.syncPubchem')}</span>
            </button>

            {pubchemInfo.syncedAt && (
              <span className="text-xs text-slate-500 hidden sm:inline">
                {t('spu.lastSync')}: {new Date(pubchemInfo.syncedAt).toLocaleString()}
              </span>
            )}
          </div>

          {/* 中间：标题 */}
          <h2 className="text-lg font-semibold text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
            {isNewMode ? t('spu.newSpu') : t('spu.editSpu')}
          </h2>

          {/* 右侧：翻译按钮或保存按钮 */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {needTranslate ? (
              <button
                type="button"
                onClick={handleTranslate}
                disabled={translating || saving || syncingPubChem}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 rounded text-sm transition-colors disabled:opacity-50"
              >
                {translating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Languages className="w-4 h-4" />
                )}
                <span>{t('spu.translate')}</span>
              </button>
            ) : (
              <button
                onClick={handleSave}
                disabled={saving || translating || syncingPubChem}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{t('spu.save')}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-5 pb-20 pt-4">
        {/* 图片展示区域 */}
        <ImageSection
          structureImageUrl={structureImageUrl}
          productImageUrl={productImageUrl}
          pubchemInfo={pubchemInfo}
          isEditMode={isEditMode}
          isNewMode={isNewMode}
          generatingImage={generatingImage}
          onGenerateImage={handleGenerateProductImage}
          t={t}
          locale={locale}
          newProductImageUrl={newProductImageUrl}
          showImageCompareModal={showImageCompareModal}
          onUseNewImage={handleUseNewImage}
          onKeepOldImage={handleKeepOldImage}
        />

        {/* 基本信息 */}
        <BasicInfoSection
          formData={formData}
          setFormData={setFormData}
          isEditMode={isEditMode}
          t={t}
        />

        {/* 化学信息 */}
        <ChemicalInfoSection
          formData={formData}
          setFormData={setFormData}
          t={t}
        />

        {/* 物理性质 */}
        <PhysicalPropertiesSection
          formData={formData}
          setFormData={setFormData}
          t={t}
        />

        {/* 安全与毒性 */}
        <SafetyToxicitySection
          formData={formData}
          setFormData={setFormData}
          t={t}
        />

        {/* 同义词 */}
        <SynonymsInput
          synonyms={formData.synonyms}
          onChange={(synonyms) => setFormData(prev => ({ ...prev, synonyms }))}
          t={t}
        />

        {/* 描述 */}
        <DescriptionInput
          description={formData.description}
          onChange={(description) => setFormData(prev => ({ ...prev, description }))}
          t={t}
        />
      </div>

      {/* Dialog 弹窗 */}
      <StatusDialog
        dialogConfig={dialogConfig}
        onClose={() => setDialogConfig(null)}
        locale={locale}
      />
    </div>
  );
}

export default function SPUEditPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <SPUEditContent />
    </Suspense>
  );
}

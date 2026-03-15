'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Loader2,
  Languages,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { useSPUCreateInfo } from '@/hooks/useSPUCreateInfo';

// 组件
import { BasicInfoSection } from '@/components/spu/BasicInfoSection';
import { ChemicalInfoSection } from '@/components/spu/ChemicalInfoSection';
import { PhysicalPropertiesSection } from '@/components/spu/PhysicalPropertiesSection';
import { SafetyToxicitySection } from '@/components/spu/SafetyToxicitySection';
import { SynonymsInput } from '@/components/spu/SynonymsInput';
import { DescriptionInput } from '@/components/spu/DescriptionInput';
import { TranslatingOverlay } from '@/components/spu/TranslatingOverlay';
import { StatusDialog } from '@/components/spu/StatusDialog';

function SPUCreateInfoContent() {
  const { locale, t } = useAdminLocale();
  const router = useRouter();

  const {
    loading,
    saving,
    translating,
    translatingFields,
    translationProgress,
    needTranslate,
    formData,
    setFormData,
    productImageUrl,
    handleTranslate,
    handleSave,
    handleBack,
    dialogConfig,
    setDialogConfig,
  } = useSPUCreateInfo({ locale, t });

  // 禁止滚动 - 当遮罩层显示时
  useEffect(() => {
    if (translating) {
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
  }, [translating]);

  // 加载中
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* 翻译遮罩层 */}
      <TranslatingOverlay
        translating={translating}
        translationProgress={translationProgress}
        translatingFields={translatingFields}
        t={t}
      />

      {/* 顶部导航 */}
      <div className="bg-slate-800/50 border-b border-slate-700/50 px-5 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between">
            {/* 左侧：返回按钮 */}
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{t('spu.back')}</span>
            </button>

            <h1 className="text-lg font-medium">
              {t('spu.productInfo')}
            </h1>

            {/* 右侧：翻译 + 保存按钮 */}
            <div className="flex items-center gap-3">
              {needTranslate && !translating && (
                <button
                  onClick={handleTranslate}
                  disabled={saving}
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-sm transition-colors"
                >
                  <Languages className="h-4 w-4" />
                  <span>{t('spu.translate')}</span>
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving || translating}
                className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t('spu.saving')}</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{t('spu.save')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="max-w-4xl mx-auto px-5 pb-20 pt-4">
        {/* 产品图预览 */}
        {productImageUrl && (
          <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-white/5 rounded-lg flex items-center justify-center overflow-hidden">
                <img
                  src={productImageUrl}
                  alt="Product"
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="flex-1">
                <div className="text-sm text-slate-400">{t('spu.productImage')}</div>
                <div className="text-green-400 text-sm mt-1">✓ {t('spu.generated')}</div>
              </div>
            </div>
          </div>
        )}

        {/* 基本信息 */}
        <BasicInfoSection
          formData={formData}
          setFormData={setFormData}
          isEditMode={false}
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

      {/* 弹窗 */}
      <StatusDialog
        dialogConfig={dialogConfig}
        onClose={() => setDialogConfig(null)}
        locale={locale}
      />
    </div>
  );
}

export default function SPUCreateInfoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <SPUCreateInfoContent />
    </Suspense>
  );
}

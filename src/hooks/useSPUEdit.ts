'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  SPUItem,
  FormData,
  PubChemInfo,
  SyncProgress,
  TranslationProgress,
  DialogConfig,
} from '@/types/spu';
import { getAdminToken } from '@/services/adminAuthService';
import { translateFields as translateFieldsUtil, SUPPORTED_LANGUAGES } from '@/lib/translate-utils';
import {
  emptyFormData,
  getTranslatableFields,
  buildSpuSavePayload,
  validateFormData,
  initFormDataFromSPUData,
} from '@/lib/spu-form-utils';

interface UseSPUEditOptions {
  spuId: string | null;
  casNumber: string | null;
  locale: string;
  t: (key: string) => string;
}

interface UseSPUEditReturn {
  // 状态
  loading: boolean;
  saving: boolean;
  spu: SPUItem | null;
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  
  // 图片
  structureImageUrl: string | null;
  productImageUrl: string | null;
  setProductImageUrl: React.Dispatch<React.SetStateAction<string | null>>;
  productImageKey: string | null;
  generatingImage: boolean;
  
  // 图片对比弹窗
  newProductImageUrl: string | null;
  showImageCompareModal: boolean;
  handleUseNewImage: () => void;
  handleKeepOldImage: () => void;
  
  // PubChem
  pubchemInfo: PubChemInfo;
  
  // 同步
  syncingPubChem: boolean;
  syncProgress: SyncProgress;
  
  // 翻译
  translating: boolean;
  translatingFields: Set<string>;
  translationProgress: TranslationProgress;
  needTranslate: boolean;
  
  // 弹窗
  dialogConfig: DialogConfig | null;
  setDialogConfig: React.Dispatch<React.SetStateAction<DialogConfig | null>>;
  
  // 模式
  isEditMode: boolean;
  isNewMode: boolean;
  
  // 方法
  handleSyncPubChem: () => Promise<void>;
  handleTranslate: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleGenerateProductImage: (force?: boolean) => Promise<void>;
  handleBack: () => void;
  initFormDataFromSPU: (spu: SPUItem) => void;
}

export function useSPUEdit({ spuId, casNumber, locale, t }: UseSPUEditOptions): UseSPUEditReturn {
  const router = useRouter();

  // 模式判断
  const isEditMode = !!spuId;
  const isNewMode = !spuId && !!casNumber;

  // 基础状态
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [spu, setSpu] = useState<SPUItem | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyFormData);

  // 图片状态
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageKey, setProductImageKey] = useState<string | null>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // 图片对比弹窗状态
  const [newProductImageUrl, setNewProductImageUrl] = useState<string | null>(null);
  const [newProductImageKey, setNewProductImageKey] = useState<string | null>(null);
  const [showImageCompareModal, setShowImageCompareModal] = useState(false);

  // PubChem 信息
  const [pubchemInfo, setPubchemInfo] = useState<PubChemInfo>({});
  
  // 同步时获取的结构数据（用于保存时写入数据库）
  const [structureData, setStructureData] = useState<{
    sdf?: string;
    imageKey?: string;
    svg?: string;
  }>({});

  // 同步状态
  const [syncingPubChem, setSyncingPubChem] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ step: 'connecting', message: '' });

  // 翻译状态
  const [translating, setTranslating] = useState(false);
  const [translatingFields, setTranslatingFields] = useState<Set<string>>(new Set());
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress>({
    current: 0,
    total: 0,
    status: 'idle',
  });
  const [needTranslate, setNeedTranslate] = useState(false);
  const [pendingTranslations, setPendingTranslations] = useState<Record<string, any>>({});

  // 弹窗状态
  const [dialogConfig, setDialogConfig] = useState<DialogConfig | null>(null);

  // AbortController
  const syncAbortControllerRef = useRef<AbortController | null>(null);
  const translateAbortControllerRef = useRef<AbortController | null>(null);

  // 初始化表单数据（使用公共函数）
  const initFormDataFromSPU = useCallback((spu: SPUItem) => {
    setFormData(initFormDataFromSPUData(spu, locale));
  }, [locale]);

  // 加载 SPU 数据
  useEffect(() => {
    if (isEditMode && spuId) {
      fetchSPUData(spuId);
    } else if (isNewMode && casNumber) {
      setFormData(prev => ({ ...prev, cas: casNumber }));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spuId, casNumber]);

  // 获取 SPU 数据
  const fetchSPUData = async (id: string) => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/spu/list/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data) {
        const spuData = data.data;
        setSpu(spuData);
        initFormDataFromSPU(spuData);
        setPubchemInfo({
          cid: spuData.pubchemCid,
          syncedAt: spuData.pubchemSyncedAt,
        });
        if (spuData.structureImageUrl) {
          setStructureImageUrl(spuData.structureImageUrl);
        }
        if (spuData.productImageUrl) {
          setProductImageUrl(spuData.productImageUrl);
        }
        if (spuData.productImageKey) {
          setProductImageKey(spuData.productImageKey);
        }
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '加载失败' : 'Load Failed',
          message: locale === 'zh' ? '加载数据失败' : 'Failed to load data',
        });
        router.push('/admin/spu');
      }
    } catch (error) {
      console.error('Error fetching SPU:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '加载失败' : 'Load Failed',
        message: locale === 'zh' ? '加载数据失败' : 'Failed to load data',
      });
      router.push('/admin/spu');
    } finally {
      setLoading(false);
    }
  };

  // 同步 PubChem 数据
  const handleSyncPubChem = async () => {
    if (!formData.cas) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '提示' : 'Notice',
        message: locale === 'zh' ? '请先输入CAS号' : 'Please enter CAS number first',
      });
      return;
    }

    const abortController = new AbortController();
    syncAbortControllerRef.current = abortController;

    setSyncingPubChem(true);
    setSyncProgress({ step: 'connecting', message: '' });

    try {
      const token = getAdminToken();

      // 步骤1：检测连接
      setSyncProgress({ step: 'connecting', message: locale === 'zh' ? '正在连接 PubChem...' : 'Connecting to PubChem...' });

      const connectionResponse = await fetch('/api/admin/spu/create/check-pubchem-connection', {
        signal: abortController.signal,
      });
      const connectionData = await connectionResponse.json();

      if (!connectionData.connected) {
        setSyncingPubChem(false);
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '连接失败' : 'Connection Failed',
          message: locale === 'zh'
            ? `PubChem 连接失败: ${connectionData.message}`
            : `PubChem connection failed: ${connectionData.message}`,
        });
        return;
      }

      // 步骤2：获取数据
      setSyncProgress({ step: 'fetching', message: locale === 'zh' ? `正在获取 ${formData.cas} 数据...` : `Fetching data for ${formData.cas}...` });

      const response = await fetch('/api/admin/spu/create/sync-pubchem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ preview: true, cas: formData.cas }),
        signal: abortController.signal,
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;

        // 步骤3：更新表单
        setSyncProgress({ step: 'updating', message: locale === 'zh' ? '正在更新表单...' : 'Updating form...' });

        // 更新表单数据
        setFormData(prev => ({
          ...prev,
          name: data.nameZh || prev.name,
          nameEn: data.nameEn || prev.nameEn,
          formula: data.formula || prev.formula,
          description: data.description || prev.description,
          molecularWeight: data.molecularWeight || prev.molecularWeight,
          exactMass: data.exactMass || prev.exactMass,
          smiles: data.smiles || prev.smiles,
          smilesCanonical: data.smilesCanonical || prev.smilesCanonical,
          smilesIsomeric: data.smilesIsomeric || prev.smilesIsomeric,
          inchi: data.inchi || prev.inchi,
          inchiKey: data.inchiKey || prev.inchiKey,
          xlogp: data.xlogp || prev.xlogp,
          tpsa: data.tpsa || prev.tpsa,
          complexity: data.complexity || prev.complexity,
          hBondDonorCount: data.hBondDonorCount || prev.hBondDonorCount,
          hBondAcceptorCount: data.hBondAcceptorCount || prev.hBondAcceptorCount,
          rotatableBondCount: data.rotatableBondCount || prev.rotatableBondCount,
          heavyAtomCount: data.heavyAtomCount || prev.heavyAtomCount,
          formalCharge: data.formalCharge || prev.formalCharge,
          physicalDescription: data.physicalDescription || prev.physicalDescription,
          colorForm: data.colorForm || prev.colorForm,
          odor: data.odor || prev.odor,
          boilingPoint: data.boilingPoint || prev.boilingPoint,
          meltingPoint: data.meltingPoint || prev.meltingPoint,
          flashPoint: data.flashPoint || prev.flashPoint,
          density: data.density || prev.density,
          solubility: data.solubility || prev.solubility,
          vaporPressure: data.vaporPressure || prev.vaporPressure,
          refractiveIndex: data.refractiveIndex || prev.refractiveIndex,
          hazardClasses: data.hazardClasses || prev.hazardClasses,
          healthHazards: data.healthHazards || prev.healthHazards,
          ghsClassification: data.ghsClassification || prev.ghsClassification,
          toxicitySummary: data.toxicitySummary || prev.toxicitySummary,
          carcinogenicity: data.carcinogenicity || prev.carcinogenicity,
          firstAid: data.firstAid || prev.firstAid,
          storageConditions: data.storageConditions || prev.storageConditions,
          incompatibleMaterials: data.incompatibleMaterials || prev.incompatibleMaterials,
          synonyms: data.synonyms || prev.synonyms,
          applications: data.applications || prev.applications,
        }));

        // 更新 PubChem 信息
        setPubchemInfo({ cid: data.pubchemCid, syncedAt: new Date().toISOString() });
        
        // 保存结构数据（用于保存时写入数据库）
        setStructureData({
          sdf: data.structureSdf,
          imageKey: data.structureImageKey,
          svg: data.structure2dSvg,
        });

        // 更新图片
        if (data.structureUrl) {
          setStructureImageUrl(data.structureUrl);
        }

        // 检查可翻译字段
        const translatableFields = [
          { key: 'name', value: data.nameEn },
          { key: 'description', value: data.description },
          { key: 'physicalDescription', value: data.physicalDescription },
          { key: 'boilingPoint', value: data.boilingPoint },
          { key: 'meltingPoint', value: data.meltingPoint },
          { key: 'flashPoint', value: data.flashPoint },
          { key: 'hazardClasses', value: data.hazardClasses },
          { key: 'healthHazards', value: data.healthHazards },
          { key: 'ghsClassification', value: data.ghsClassification },
          { key: 'firstAid', value: data.firstAid },
          { key: 'storageConditions', value: data.storageConditions },
          { key: 'incompatibleMaterials', value: data.incompatibleMaterials },
          { key: 'solubility', value: data.solubility },
          { key: 'vaporPressure', value: data.vaporPressure },
          { key: 'refractiveIndex', value: data.refractiveIndex },
        ];

        const fieldsToTranslate = translatableFields
          .filter(({ value }) => value)
          .map(({ key }) => key);

        setPendingTranslations({});

        if (fieldsToTranslate.length > 0) {
          setNeedTranslate(true);
          setDialogConfig({
            type: 'success',
            title: t('spu.syncSuccess'),
            message: locale === 'zh'
              ? `PubChem 数据已同步，${fieldsToTranslate.length} 个字段待翻译。点击"翻译"按钮开始翻译。`
              : `PubChem data synced, ${fieldsToTranslate.length} fields need translation. Click "Translate" button to start.`,
          });
        } else {
          setNeedTranslate(false);
          setDialogConfig({
            type: 'success',
            title: t('spu.syncSuccess'),
            message: locale === 'zh'
              ? 'PubChem 数据已同步，点击"保存"按钮保存数据。'
              : 'PubChem data synced. Click "Save" button to save.',
          });
        }
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '同步失败' : 'Sync Error',
          message: result.error || (locale === 'zh' ? '未找到 PubChem 数据' : 'PubChem data not found'),
        });
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Sync aborted by user');
        return;
      }
      console.error('Error syncing PubChem:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '同步失败' : 'Sync Error',
        message: locale === 'zh' ? '同步失败' : 'Sync failed',
      });
    } finally {
      setSyncingPubChem(false);
      setSyncProgress({ step: 'connecting', message: '' });
      syncAbortControllerRef.current = null;
    }
  };

  // 处理翻译（使用公共函数）
  const handleTranslate = async () => {
    const translatableFields = getTranslatableFields(formData);

    if (translatableFields.length === 0) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '无可翻译内容' : 'No Content to Translate',
        message: locale === 'zh'
          ? '当前表单中没有需要翻译的字段，请先同步 PubChem 数据或手动填写内容。'
          : 'No fields with content to translate. Please sync PubChem data or fill in content first.',
      });
      return;
    }

    const currentLang = SUPPORTED_LANGUAGES.includes(locale) ? locale : 'en';
    const token = getAdminToken();

    setTranslating(true);
    setTranslationProgress({ current: 0, total: translatableFields.length, status: 'translating' });
    setTranslatingFields(new Set());

    const abortController = new AbortController();
    translateAbortControllerRef.current = abortController;

    try {
      const result = await translateFieldsUtil({
        fields: translatableFields,
        token,
        signal: abortController.signal,
        onProgress: (current, total) => {
          setTranslationProgress(prev => ({ ...prev, current }));
        },
        onFieldStart: (key) => {
          setTranslatingFields(prev => new Set([...prev, key]));
        },
        onFieldEnd: (key) => {
          setTranslatingFields(prev => {
            const next = new Set(prev);
            next.delete(key);
            return next;
          });
        },
      });

      // 应用翻译结果到表单
      const newPendingTranslations = { ...pendingTranslations, ...result.translations };
      setPendingTranslations(newPendingTranslations);

      // 用当前语言更新表单
      setFormData(prev => {
        const updated = { ...prev };
        translatableFields.forEach(({ key }) => {
          const translatedValue = result.translations[key]?.[currentLang];
          if (translatedValue) {
            (updated as any)[key] = translatedValue;
          }
        });
        return updated;
      });

      setNeedTranslate(false);
      setTranslationProgress(prev => ({ ...prev, status: 'completed' }));
      setDialogConfig({
        type: 'success',
        title: locale === 'zh' ? '翻译完成' : 'Translation Completed',
        message: locale === 'zh'
          ? `已翻译 ${translatableFields.length} 个字段。点击"保存"按钮保存数据。`
          : `Translated ${translatableFields.length} fields. Click "Save" button to save.`,
      });
    } catch (error: any) {
      console.error('Translation error:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '翻译失败' : 'Translation Failed',
        message: error.message,
      });
    } finally {
      setTranslating(false);
      setTranslatingFields(new Set());
      translateAbortControllerRef.current = null;
    }
  };

  // 生成产品图
  const handleGenerateProductImage = async (force: boolean = false) => {
    if (!spuId) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '无法生成' : 'Cannot Generate',
        message: locale === 'zh' ? '请先保存产品后再生成产品图' : 'Please save the product first before generating image',
      });
      return;
    }

    if (!pubchemInfo.cid) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '无法生成' : 'Cannot Generate',
        message: locale === 'zh' ? '请先同步 PubChem 数据' : 'Please sync PubChem data first',
      });
      return;
    }

    setGeneratingImage(true);
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/spu/create/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          spuId: spuId,
          cas: formData.cas,
          name: formData.name || formData.nameEn,
          force,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 如果是重绘（force=true）且已有图片，显示对比弹窗
        if (force && productImageUrl && data.imageUrl !== productImageUrl) {
          setNewProductImageUrl(data.imageUrl);
          setNewProductImageKey(data.imageKey);
          setShowImageCompareModal(true);
        } else {
          // 否则直接更新图片
          setProductImageUrl(data.imageUrl);
          setProductImageKey(data.imageKey);
          setDialogConfig({
            type: 'success',
            title: locale === 'zh' ? '生成成功' : 'Success',
            message: data.isNew
              ? (locale === 'zh' ? '产品图已生成' : 'Product image generated')
              : (locale === 'zh' ? '使用已有图片' : 'Using existing image'),
          });
        }
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '生成失败' : 'Error',
          message: data.error || 'Failed to generate image',
        });
      }
    } catch (error) {
      console.error('Generate product image error:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '生成失败' : 'Error',
        message: locale === 'zh' ? '生成产品图失败' : 'Failed to generate image',
      });
    } finally {
      setGeneratingImage(false);
    }
  };

  // 选择使用新图片
  const handleUseNewImage = () => {
    if (newProductImageUrl && newProductImageKey) {
      setProductImageUrl(newProductImageUrl);
      setProductImageKey(newProductImageKey);
      setNewProductImageUrl(null);
      setNewProductImageKey(null);
      setShowImageCompareModal(false);
      setDialogConfig({
        type: 'success',
        title: locale === 'zh' ? '已更换' : 'Changed',
        message: locale === 'zh' ? '已使用新图片' : 'New image applied',
      });
    }
  };

  // 保留原图
  const handleKeepOldImage = () => {
    setNewProductImageUrl(null);
    setNewProductImageKey(null);
    setShowImageCompareModal(false);
  };

  // 保存
  const handleSave = async () => {
    // 使用公共验证函数
    const validation = validateFormData(formData);
    if (!validation.valid) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '提示' : 'Notice',
        message: validation.error || 'Validation failed',
      });
      return;
    }

    const token = getAdminToken();

    setSaving(true);
    try {
      // 使用公共构建函数
      const spuData = buildSpuSavePayload(formData, {
        spuId,
        pubchemCid: pubchemInfo.cid,
        structureSdf: structureData.sdf || null,
        structureImageKey: structureData.imageKey || null,
        structure2dSvg: structureData.svg || null,
        productImageKey: productImageKey,
        pendingTranslations,
      });

      const response = await fetch('/api/admin/spu/create/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(spuData),
      });

      // 检查 HTTP 状态码
      if (response.status === 401) {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '登录已过期' : 'Session Expired',
          message: locale === 'zh' ? '登录已过期，请重新登录' : 'Your session has expired. Please log in again.',
          onConfirm: () => router.push('/admin/login'),
        });
        return;
      }

      if (!response.ok) {
        // 尝试解析错误信息
        let errorMessage = `HTTP ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // 无法解析响应，使用状态文本
          errorMessage = response.statusText || errorMessage;
        }
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '保存失败' : 'Save Failed',
          message: `${locale === 'zh' ? '保存失败' : 'Save failed'}: ${errorMessage}`,
        });
        return;
      }

      const result = await response.json();

      if (result.success) {
        setDialogConfig({
          type: 'success',
          title: locale === 'zh' ? '保存成功' : 'Success',
          message: locale === 'zh' ? '保存成功！' : 'Saved successfully!',
          onConfirm: () => router.push('/admin/spu'),
        });
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '保存失败' : 'Save Failed',
          message: `${locale === 'zh' ? '保存失败' : 'Save failed'}: ${result.error}`,
        });
      }
    } catch (error) {
      console.error('Error saving SPU:', error);
      // 检测是否是网络错误或服务不可用
      const isNetworkError = error instanceof TypeError && error.message === 'Failed to fetch';
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '保存失败' : 'Save Failed',
        message: isNetworkError
          ? (locale === 'zh' ? '网络连接失败，请检查网络后重试' : 'Network error. Please check your connection and try again.')
          : (locale === 'zh' ? '保存失败，请重试' : 'Save failed. Please try again.'),
      });
    } finally {
      setSaving(false);
    }
  };

  // 返回列表
  const handleBack = () => {
    router.push('/admin/spu');
  };

  return {
    loading,
    saving,
    spu,
    formData,
    setFormData,
    structureImageUrl,
    productImageUrl,
    setProductImageUrl,
    productImageKey,
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
    initFormDataFromSPU,
  };
}

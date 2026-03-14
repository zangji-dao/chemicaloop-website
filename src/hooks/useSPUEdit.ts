'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  SPUItem,
  FormData,
  emptyFormData,
  PubChemInfo,
  SyncProgress,
  TranslationProgress,
  DialogConfig,
} from '@/types/spu';
import { getAdminToken } from '@/services/adminAuthService';

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
  generatingImage: boolean;
  
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
  handleGenerateProductImage: () => Promise<void>;
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
  const [generatingImage, setGeneratingImage] = useState(false);

  // PubChem 信息
  const [pubchemInfo, setPubchemInfo] = useState<PubChemInfo>({});

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

  // 初始化表单数据
  const initFormDataFromSPU = useCallback((spu: SPUItem) => {
    const allLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    const currentLang = allLanguages.includes(locale) ? locale : 'en';

    setFormData({
      cas: spu.cas,
      name: spu.translations?.name?.[currentLang] || spu.name || '',
      nameEn: spu.name_en || '',
      formula: spu.formula || '',
      molecularWeight: spu.molecular_weight || '',
      exactMass: spu.exact_mass || '',
      description: spu.translations?.description?.[currentLang] || spu.description || '',
      synonyms: spu.synonyms || [],
      applications: spu.translations?.applications?.[currentLang] || spu.applications || [],
      hsCode: spu.hs_code || '',
      hsCodeExtensions: spu.hs_code_extensions || {},
      status: spu.status || 'ACTIVE',
      smiles: spu.smiles || '',
      smilesCanonical: spu.smiles_canonical || '',
      smilesIsomeric: spu.smiles_isomeric || '',
      inchi: spu.inchi || '',
      inchiKey: spu.inchi_key || '',
      xlogp: spu.xlogp || '',
      tpsa: spu.tpsa || '',
      complexity: spu.complexity?.toString() || '',
      hBondDonorCount: spu.h_bond_donor_count?.toString() || '',
      hBondAcceptorCount: spu.h_bond_acceptor_count?.toString() || '',
      rotatableBondCount: spu.rotatable_bond_count?.toString() || '',
      heavyAtomCount: spu.heavy_atom_count?.toString() || '',
      formalCharge: spu.formal_charge?.toString() || '',
      physicalDescription: spu.translations?.physicalDescription?.[currentLang] || spu.physical_description || '',
      colorForm: spu.color_form || '',
      odor: spu.odor || '',
      boilingPoint: spu.translations?.boilingPoint?.[currentLang] || spu.boiling_point || '',
      meltingPoint: spu.translations?.meltingPoint?.[currentLang] || spu.melting_point || '',
      flashPoint: spu.translations?.flashPoint?.[currentLang] || spu.flash_point || '',
      density: spu.density || '',
      solubility: spu.translations?.solubility?.[currentLang] || spu.solubility || '',
      vaporPressure: spu.translations?.vaporPressure?.[currentLang] || spu.vapor_pressure || '',
      refractiveIndex: spu.translations?.refractiveIndex?.[currentLang] || spu.refractive_index || '',
      hazardClasses: spu.translations?.hazardClasses?.[currentLang] || spu.hazard_classes || '',
      healthHazards: spu.translations?.healthHazards?.[currentLang] || spu.health_hazards || '',
      ghsClassification: spu.translations?.ghsClassification?.[currentLang] || spu.ghs_classification || '',
      toxicitySummary: spu.toxicity_summary || '',
      carcinogenicity: spu.carcinogenicity || '',
      firstAid: spu.translations?.firstAid?.[currentLang] || spu.first_aid || '',
      storageConditions: spu.translations?.storageConditions?.[currentLang] || spu.storage_conditions || '',
      incompatibleMaterials: spu.translations?.incompatibleMaterials?.[currentLang] || spu.incompatible_materials || '',
    });
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
      const response = await fetch(`/api/admin/spu/${id}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const data = await response.json();

      if (data.success && data.data) {
        const spuData = data.data;
        setSpu(spuData);
        initFormDataFromSPU(spuData);
        setPubchemInfo({
          cid: spuData.pubchem_cid,
          syncedAt: spuData.pubchem_synced_at,
        });
        if (spuData.structure_url) {
          setStructureImageUrl(spuData.structure_url);
        }
        if (spuData.image_url) {
          setProductImageUrl(spuData.image_url);
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

      const connectionResponse = await fetch('/api/admin/spu/check-pubchem-connection', {
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

      const response = await fetch('/api/admin/spu/sync-pubchem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ cas: formData.cas }),
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
          nameEn: data.nameEn || prev.nameEn,
          formula: data.formula || prev.formula,
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
        }));

        // 更新 PubChem 信息
        setPubchemInfo({ cid: data.cid, syncedAt: new Date().toISOString() });

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

  // 翻译字段
  const translateFields = async (fieldsToTranslate: string[], translations: Record<string, any>) => {
    const allLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    const currentLang = allLanguages.includes(locale) ? locale : 'en';
    const token = getAdminToken();

    setTranslating(true);
    setTranslationProgress({ current: 0, total: fieldsToTranslate.length, status: 'translating' });

    const abortController = new AbortController();
    translateAbortControllerRef.current = abortController;

    const translationPromises = fieldsToTranslate.map(async (fieldName) => {
      const value = formData[fieldName as keyof typeof formData] as string;
      if (!value) return { fieldName, success: false };

      setTranslatingFields(prev => new Set([...prev, fieldName]));

      try {
        const res = await fetch('/api/common/ai/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            text: value,
            targetLanguages: allLanguages
          }),
          signal: abortController.signal,
        });
        const data = await res.json();

        if (data.translations) {
          translations[fieldName] = data.translations;
          const currentLangTranslation = data.translations[currentLang];
          if (currentLangTranslation) {
            setFormData(prev => ({
              ...prev,
              [fieldName]: currentLangTranslation
            }));
          }
          setTranslationProgress(prev => ({ ...prev, current: prev.current + 1 }));
          return { fieldName, success: true };
        }
        return { fieldName, success: false };
      } catch (error) {
        console.log(`Translation error for ${fieldName}:`, error);
        return { fieldName, success: false };
      } finally {
        setTranslatingFields(prev => {
          const next = new Set(prev);
          next.delete(fieldName);
          return next;
        });
      }
    });

    await Promise.all(translationPromises);
    setTranslating(false);
    setTranslationProgress(prev => ({ ...prev, status: 'completed' }));
    translateAbortControllerRef.current = null;
    return translations;
  };

  // 处理翻译
  const handleTranslate = async () => {
    const translatableFields = [
      { key: 'name', value: formData.nameEn },
      { key: 'description', value: formData.description },
      { key: 'physicalDescription', value: formData.physicalDescription },
      { key: 'boilingPoint', value: formData.boilingPoint },
      { key: 'meltingPoint', value: formData.meltingPoint },
      { key: 'flashPoint', value: formData.flashPoint },
      { key: 'hazardClasses', value: formData.hazardClasses },
      { key: 'healthHazards', value: formData.healthHazards },
      { key: 'ghsClassification', value: formData.ghsClassification },
      { key: 'firstAid', value: formData.firstAid },
      { key: 'storageConditions', value: formData.storageConditions },
      { key: 'incompatibleMaterials', value: formData.incompatibleMaterials },
      { key: 'solubility', value: formData.solubility },
      { key: 'vaporPressure', value: formData.vaporPressure },
      { key: 'refractiveIndex', value: formData.refractiveIndex },
    ];

    const fieldsToTranslate = translatableFields
      .filter(({ value }) => value)
      .map(({ key }) => key);

    if (fieldsToTranslate.length === 0) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '无可翻译内容' : 'No Content to Translate',
        message: locale === 'zh'
          ? '当前表单中没有需要翻译的字段，请先同步 PubChem 数据或手动填写内容。'
          : 'No fields with content to translate. Please sync PubChem data or fill in content first.',
      });
      return;
    }

    const translations: Record<string, any> = { ...pendingTranslations };
    await translateFields(fieldsToTranslate, translations);

    setNeedTranslate(false);
    setDialogConfig({
      type: 'success',
      title: locale === 'zh' ? '翻译完成' : 'Translation Completed',
      message: locale === 'zh'
        ? `已翻译 ${fieldsToTranslate.length} 个字段。点击"保存"按钮保存数据。`
        : `Translated ${fieldsToTranslate.length} fields. Click "Save" button to save.`,
    });
  };

  // 生成产品图
  const handleGenerateProductImage = async () => {
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
      const response = await fetch('/api/admin/products/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          spuId: spuId,
          cas: formData.cas,
          name: formData.name || formData.nameEn,
          force: false,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProductImageUrl(data.imageUrl);
        setDialogConfig({
          type: 'success',
          title: locale === 'zh' ? '生成成功' : 'Success',
          message: data.isNew
            ? (locale === 'zh' ? '产品图已生成' : 'Product image generated')
            : (locale === 'zh' ? '使用已有图片' : 'Using existing image'),
        });
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

  // 保存
  const handleSave = async () => {
    if (!formData.cas) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '提示' : 'Notice',
        message: locale === 'zh' ? 'CAS号不能为空' : 'CAS number is required',
      });
      return;
    }
    if (!formData.name && !formData.nameEn) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '提示' : 'Notice',
        message: locale === 'zh' ? '产品名称不能为空' : 'Product name is required',
      });
      return;
    }

    const token = getAdminToken();
    const translations: Record<string, any> = { ...pendingTranslations };

    setSaving(true);
    try {
      const spuData = {
        id: spuId || undefined,
        cas: formData.cas,
        name: formData.name || formData.nameEn,
        nameEn: formData.nameEn || null,
        formula: formData.formula || null,
        description: formData.description || null,
        molecularWeight: formData.molecularWeight || null,
        smiles: formData.smiles || null,
        inchi: formData.inchi || null,
        inchiKey: formData.inchiKey || null,
        xlogp: formData.xlogp || null,
        tpsa: formData.tpsa || null,
        boilingPoint: formData.boilingPoint || null,
        meltingPoint: formData.meltingPoint || null,
        flashPoint: formData.flashPoint || null,
        density: formData.density || null,
        solubility: formData.solubility || null,
        vaporPressure: formData.vaporPressure || null,
        refractiveIndex: formData.refractiveIndex || null,
        hazardClasses: formData.hazardClasses || null,
        healthHazards: formData.healthHazards || null,
        ghsClassification: formData.ghsClassification || null,
        toxicitySummary: formData.toxicitySummary || null,
        carcinogenicity: formData.carcinogenicity || null,
        firstAid: formData.firstAid || null,
        storageConditions: formData.storageConditions || null,
        incompatibleMaterials: formData.incompatibleMaterials || null,
        hsCode: formData.hsCode || null,
        hsCodeExtensions: formData.hsCodeExtensions || null,
        status: formData.status,
        synonyms: formData.synonyms || [],
        translations: Object.keys(translations).length > 0 ? translations : undefined,
        pubchemCid: pubchemInfo.cid,
      };

      const response = await fetch('/api/admin/spu/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(spuData),
      });

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
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '保存失败' : 'Save Failed',
        message: locale === 'zh' ? '保存失败' : 'Save failed',
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
    generatingImage,
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

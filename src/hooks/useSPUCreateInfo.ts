/**
 * 新建产品 - 填写表单页面 Hook
 * 
 * 流程：
 * 1. 从数据库获取预存储的DRAFT产品数据（通过CAS号查询）
 * 2. 显示表单信息
 * 3. 用户点击翻译
 * 4. 用户点击保存（更新产品状态为ACTIVE）
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';
import { FormData, TranslationProgress } from '@/types/spu';

const emptyFormData: FormData = {
  cas: '',
  name: '',
  nameEn: '',
  formula: '',
  molecularWeight: '',
  exactMass: '',
  smiles: '',
  smilesCanonical: '',
  smilesIsomeric: '',
  inchi: '',
  inchiKey: '',
  xlogp: '',
  tpsa: '',
  complexity: '',
  hBondDonorCount: '',
  hBondAcceptorCount: '',
  rotatableBondCount: '',
  heavyAtomCount: '',
  formalCharge: '',
  physicalDescription: '',
  colorForm: '',
  odor: '',
  boilingPoint: '',
  meltingPoint: '',
  flashPoint: '',
  density: '',
  solubility: '',
  vaporPressure: '',
  refractiveIndex: '',
  hazardClasses: '',
  healthHazards: '',
  ghsClassification: '',
  toxicitySummary: '',
  carcinogenicity: '',
  firstAid: '',
  storageConditions: '',
  incompatibleMaterials: '',
  description: '',
  synonyms: [],
  applications: [],
  hsCode: '',
  hsCodeExtensions: {},
  status: 'ACTIVE',
};

interface UseSPUCreateInfoReturn {
  // 状态
  loading: boolean;
  saving: boolean;
  translating: boolean;
  translatingFields: Set<string>;
  translationProgress: TranslationProgress;
  needTranslate: boolean;
  
  // 数据
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  productImageUrl: string;
  pendingTranslations: Record<string, any>;
  productId: string | null;
  
  // 方法
  handleTranslate: () => Promise<void>;
  handleSave: () => Promise<void>;
  handleBack: () => void;
  
  // 弹窗
  dialogConfig: any;
  setDialogConfig: (config: any) => void;
}

/**
 * 将数据库字段转换为驼峰命名
 */
function toCamelCase(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

export function useSPUCreateInfo(locale: string): UseSPUCreateInfoReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cas = searchParams.get('cas') || '';

  // 状态
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [translatingFields, setTranslatingFields] = useState<Set<string>>(new Set());
  const [translationProgress, setTranslationProgress] = useState<TranslationProgress>({
    status: 'idle',
    current: 0,
    total: 0,
  });
  const [needTranslate, setNeedTranslate] = useState(false);
  
  // 数据
  const [formData, setFormData] = useState<FormData>(emptyFormData);
  const [productImageKey, setProductImageKey] = useState<string>('');
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const [pendingTranslations, setPendingTranslations] = useState<Record<string, any>>({});
  const [structureData, setStructureData] = useState<{
    sdf?: string;
    imageKey?: string;
    svg?: string;
  }>({});
  const [productId, setProductId] = useState<string | null>(null);
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 从数据库加载数据
  useEffect(() => {
    const loadData = async () => {
      if (!cas) {
        setLoading(false);
        return;
      }

      const token = getAdminToken();
      
      try {
        // 从数据库查询产品数据
        const response = await fetch(`/api/admin/spu/search?cas=${encodeURIComponent(cas)}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
        });

        const result = await response.json();

        if (!result.success || !result.data) {
          setDialogConfig({
            type: 'error',
            title: locale === 'zh' ? '加载失败' : 'Load Failed',
            message: locale === 'zh' 
              ? '未找到产品数据，请返回重新搜索' 
              : 'Product data not found, please go back and search again',
            onConfirm: () => router.push('/admin/spu/create'),
          });
          setLoading(false);
          return;
        }

        const product = toCamelCase(result.data);
        setProductId(product.id);

        // 设置产品图片URL
        if (product.productImageKey) {
          setProductImageKey(product.productImageKey);
          setProductImageUrl(`/api/storage/file?key=${product.productImageKey}`);
        } else if (product.structureImageKey) {
          // 如果没有产品图，使用结构图
          setProductImageUrl(`/api/storage/file?key=${product.structureImageKey}`);
        }

        // 填充表单数据
        setFormData({
          cas: product.cas || cas,
          name: product.name || '',
          nameEn: product.nameEn || '',
          formula: product.formula || '',
          molecularWeight: product.molecularWeight || '',
          exactMass: product.exactMass || '',
          smiles: product.smiles || '',
          smilesCanonical: product.smilesCanonical || '',
          smilesIsomeric: product.smilesIsomeric || '',
          inchi: product.inchi || '',
          inchiKey: product.inchiKey || '',
          xlogp: product.xlogp || '',
          tpsa: product.tpsa || '',
          complexity: product.complexity?.toString() || '',
          hBondDonorCount: product.hBondDonorCount?.toString() || '',
          hBondAcceptorCount: product.hBondAcceptorCount?.toString() || '',
          rotatableBondCount: product.rotatableBondCount?.toString() || '',
          heavyAtomCount: product.heavyAtomCount?.toString() || '',
          formalCharge: product.formalCharge?.toString() || '',
          physicalDescription: product.physicalDescription || '',
          colorForm: product.colorForm || '',
          odor: product.odor || '',
          boilingPoint: product.boilingPoint || '',
          meltingPoint: product.meltingPoint || '',
          flashPoint: product.flashPoint || '',
          density: product.density || '',
          solubility: product.solubility || '',
          vaporPressure: product.vaporPressure || '',
          refractiveIndex: product.refractiveIndex || '',
          hazardClasses: product.hazardClasses || '',
          healthHazards: product.healthHazards || '',
          ghsClassification: product.ghsClassification || '',
          toxicitySummary: product.toxicitySummary || '',
          carcinogenicity: product.carcinogenicity || '',
          firstAid: product.firstAid || '',
          storageConditions: product.storageConditions || '',
          incompatibleMaterials: product.incompatibleMaterials || '',
          description: product.description || '',
          synonyms: product.synonyms || [],
          applications: product.applications || [],
          hsCode: product.hsCode || '',
          hsCodeExtensions: product.hsCodeExtensions || {},
          status: 'ACTIVE',
        });

        // 保存结构数据
        setStructureData({
          sdf: product.structureSdf,
          imageKey: product.structureImageKey,
          svg: product.structure2dSvg,
        });

        // 检查需要翻译的字段
        const translatableFields = [
          { key: 'name', value: product.nameEn },
          { key: 'description', value: product.description },
          { key: 'physicalDescription', value: product.physicalDescription },
          { key: 'boilingPoint', value: product.boilingPoint },
          { key: 'meltingPoint', value: product.meltingPoint },
          { key: 'flashPoint', value: product.flashPoint },
          { key: 'hazardClasses', value: product.hazardClasses },
          { key: 'healthHazards', value: product.healthHazards },
          { key: 'ghsClassification', value: product.ghsClassification },
          { key: 'firstAid', value: product.firstAid },
          { key: 'storageConditions', value: product.storageConditions },
          { key: 'incompatibleMaterials', value: product.incompatibleMaterials },
          { key: 'solubility', value: product.solubility },
          { key: 'vaporPressure', value: product.vaporPressure },
          { key: 'refractiveIndex', value: product.refractiveIndex },
        ];

        const fieldsToTranslate = translatableFields
          .filter(({ value }) => value && value !== '-')
          .map(({ key }) => key);

        if (fieldsToTranslate.length > 0) {
          setNeedTranslate(true);
        }
      } catch (error) {
        console.error('Failed to load product data:', error);
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '加载失败' : 'Load Failed',
          message: locale === 'zh' 
            ? '加载产品数据失败，请重试' 
            : 'Failed to load product data, please try again',
        });
      }
      
      setLoading(false);
    };

    loadData();
  }, [cas, locale, router]);

  // 翻译
  const handleTranslate = useCallback(async () => {
    const token = getAdminToken();
    setTranslating(true);
    setTranslationProgress({ status: 'translating', current: 0, total: 0 });

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

    const fieldsToTranslate = translatableFields.filter(({ value }) => value && value !== '-');
    setTranslatingFields(new Set(fieldsToTranslate.map(({ key }) => key)));
    setTranslationProgress({ status: 'translating', current: 0, total: fieldsToTranslate.length });

    const translations: Record<string, any> = { ...pendingTranslations };

    for (let i = 0; i < fieldsToTranslate.length; i++) {
      const { key, value } = fieldsToTranslate[i];
      setTranslationProgress({ status: 'translating', current: i + 1, total: fieldsToTranslate.length });

      try {
        const response = await fetch('/api/admin/translate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ text: value, targetLang: 'zh' }),
        });

        const data = await response.json();
        if (data.success && data.translatedText) {
          translations[key] = data.translatedText;
        }
      } catch (error) {
        console.error(`Failed to translate ${key}:`, error);
      }
    }

    setPendingTranslations(translations);
    setTranslating(false);
    setTranslationProgress({ status: 'completed', current: fieldsToTranslate.length, total: fieldsToTranslate.length });
    setNeedTranslate(false);
    setDialogConfig({
      type: 'success',
      title: locale === 'zh' ? '翻译完成' : 'Translation Completed',
      message: locale === 'zh'
        ? `已翻译 ${fieldsToTranslate.length} 个字段。点击"保存"按钮保存数据。`
        : `Translated ${fieldsToTranslate.length} fields. Click "Save" button to save.`,
    });
  }, [formData, pendingTranslations, locale]);

  // 保存
  const handleSave = useCallback(async () => {
    if (!formData.cas) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '提示' : 'Notice',
        message: locale === 'zh' ? 'CAS 号不能为空' : 'CAS number is required',
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
    setSaving(true);

    try {
      const translations = Object.keys(pendingTranslations).length > 0 ? pendingTranslations : undefined;

      const spuData = {
        id: productId || undefined, // 如果有产品ID，更新现有产品
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
        status: 'ACTIVE', // 保存时设置状态为ACTIVE
        synonyms: formData.synonyms || [],
        applications: formData.applications || [],
        translations,
        // 结构数据
        structureSdf: structureData.sdf || null,
        structureImageKey: structureData.imageKey || null,
        structure2dSvg: structureData.svg || null,
        // 产品图
        productImageKey: productImageKey || null,
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
          message: locale === 'zh' ? '产品已创建成功！' : 'Product created successfully!',
          onConfirm: () => router.push('/admin/spu'),
        });
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '保存失败' : 'Save Failed',
          message: result.error || (locale === 'zh' ? '未知错误' : 'Unknown error'),
        });
      }
    } catch (error: any) {
      console.error('Save error:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '保存失败' : 'Save Failed',
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  }, [formData, structureData, productImageKey, pendingTranslations, productId, locale, router]);

  // 返回
  const handleBack = useCallback(() => {
    router.push(`/admin/spu/create/image?cas=${encodeURIComponent(cas)}`);
  }, [router, cas]);

  return {
    loading,
    saving,
    translating,
    translatingFields,
    translationProgress,
    needTranslate,
    formData,
    setFormData,
    productImageUrl,
    pendingTranslations,
    productId,
    handleTranslate,
    handleSave,
    handleBack,
    dialogConfig,
    setDialogConfig,
  };
}

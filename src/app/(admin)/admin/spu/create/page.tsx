'use client';

import { getAdminToken } from '@/services/adminAuthService';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Search, 
  AlertCircle, 
  Loader2, 
  Database,
  ExternalLink,
  Link2,
  X,
} from 'lucide-react';

// 步骤定义 - 简化为两步
// 注意：标题需要在组件内部使用 t() 函数获取，这里只定义 key
const stepKeys = [
  { key: 'identification', titleKey: 'spu.selectProduct', icon: Search },
  { key: 'confirmation', titleKey: 'spu.confirmData', icon: Check },
];

// SPU 数据类型
interface SPUItem {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  description?: string;
  hs_code?: string;
  pubchem_cid?: number;
  molecular_weight?: string;
  synonyms?: string[];
  applications?: string[];
  physicalDescription?: string;
  colorForm?: string;
  odor?: string;
  hazardClasses?: string;
}

function ProductUploadContent() {
  const { locale, t } = useAdminLocale();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // SPU 搜索状态
  const [spuSearchQuery, setSpuSearchQuery] = useState('');
  const [searchingSPU, setSearchingSPU] = useState(false);
  const [spuSearchResults, setSpuSearchResults] = useState<SPUItem[]>([]);
  const [selectedSPU, setSelectedSPU] = useState<SPUItem | null>(null);
  const [showNoSpuHint, setShowNoSpuHint] = useState(false);
  
  // PubChem 搜索状态（备选）
  const [searchingPubChem, setSearchingPubChem] = useState(false);
  const [pubchemData, setPubchemData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'local_success' | 'remote_success' | 'failed'>('idle');

  // 自动处理状态（产品图、HS编码、翻译）
  const [autoProcessing, setAutoProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState<'image' | 'hscode' | 'translate' | 'done' | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [matchedHsCode, setMatchedHsCode] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, any>>({});
  const [translatingFields, setTranslatingFields] = useState<Set<string>>(new Set()); // 正在翻译的字段集合

  // 从URL获取CAS参数并自动搜索
  useEffect(() => {
    const casParam = searchParams.get('cas');
    if (casParam) {
      // 设置CAS到表单
      setFormData(prev => ({
        ...prev,
        cas: casParam,
      }));
      // 自动搜索SPU
      setSpuSearchQuery(casParam);
      // 延迟触发搜索
      setTimeout(() => {
        handleSPUSearchWithQuery(casParam);
      }, 100);
    }
  }, [searchParams]);

  // 带参数的SPU搜索函数
  const handleSPUSearchWithQuery = async (query: string) => {
    if (!query || query.length < 2) {
      return;
    }

    setSearchingSPU(true);
    setShowNoSpuHint(false);
    setSpuSearchResults([]);

    try {
      const response = await fetch(`/api/spu/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setSpuSearchResults(data.data);
      } else {
        setShowNoSpuHint(true);
      }
    } catch (error) {
      console.error('SPU search error:', error);
      setShowNoSpuHint(true);
    } finally {
      setSearchingSPU(false);
    }
  };

  // 表单数据
  const [formData, setFormData] = useState({
    // SPU 关联
    spuId: '',
    
    // 基本信息（从 SPU 自动填充或手动输入）
    cas: '',
    name: '',
    nameEn: '',
    formula: '',

    // 自动生成的数据
    generatedImageUrl: '',
    hsCode: '',
    translations: {} as Record<string, Record<string, string>>,

    // 上架选项
    isListed: true, // 是否上架

    // Step 3: 上架设置（商业信息）
    price: '',
    stock: '',
    moq: '',
    deliveryTime: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // 保存SPU状态
  const [savingSPU, setSavingSPU] = useState(false);
  const [spuSaved, setSpuSaved] = useState(false);
  
  // 弹窗状态
  const [showDialog, setShowDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState({ title: '', message: '', type: 'success' as 'success' | 'error' });

  // 统一搜索函数：先搜 SPU，没有结果则搜 PubChem
  const handleUnifiedSearch = async () => {
    const query = spuSearchQuery || formData.cas;
    if (!query || query.length < 2) {
      setErrors({ cas: t('spu.casRequired') });
      return;
    }

    // 重置状态
    setErrors({});
    setSpuSearchResults([]);
    setPubchemData(null);
    setShowNoSpuHint(false);
    setConnectionStatus('idle');

    // 1. 先搜索本地 SPU
    setSearchingSPU(true);
    try {
      const response = await fetch(`/api/spu/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setSpuSearchResults(data.data);
        setSearchingSPU(false);
        return; // 有结果就结束
      }
    } catch (error) {
      console.error('SPU search error:', error);
    }
    setSearchingSPU(false);

    // 2. SPU 没有结果，从 PubChem 获取
    setSearchingPubChem(true);
    setConnectionStatus('connecting');

    try {
      const response = await fetch(`/api/products/lookup?cas=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success && data.data) {
        setConnectionStatus(data.source === 'local' ? 'local_success' : 'remote_success');
        
        let nameZh = data.data.nameZh || '';
        const nameEn = data.data.nameEn || '';

        if (!nameZh && nameEn) {
          try {
            const translateResponse = await fetch('/api/ai/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: nameEn, targetLanguage: 'zh' }),
            });
            const translateData = await translateResponse.json();
            if (translateData.translatedText) {
              nameZh = translateData.translatedText;
            }
          } catch (translateError) {
            console.error('Translation error:', translateError);
          }
        }

        setPubchemData({
          cas: query,
          source: data.source,
          cid: data.data.cid,
          nameZh,
          nameEn,
          formula: data.data.formula || '',
          molecularWeight: data.data.molecularWeight || '',
          smiles: data.data.smiles || '',
          isomericSmiles: data.data.isomericSmiles || '',
          inchi: data.data.inchi || '',
          inchiKey: data.data.inchiKey || '',
          xlogp: data.data.xlogp || '',
          structure2dUrl: data.data.structure2dUrl || '',
          structure2dSvgUrl: data.data.structure2dSvgUrl || '',
          synonyms: data.data.synonyms || [],
          boilingPoint: data.data.boilingPoint || '',
          meltingPoint: data.data.meltingPoint || '',
          flashPoint: data.data.flashPoint || '',
          density: data.data.density || '',
          solubility: data.data.solubility || '',
          vaporPressure: data.data.vaporPressure || '',
          physicalDescription: data.data.physicalDescription || '',
          colorForm: data.data.colorForm || '',
          odor: data.data.odor || '',
          description: data.data.description || '',
          applications: data.data.applications || [],
          hazardClasses: data.data.hazardClasses || '',
        });
        // 重置自动处理状态
        setProcessingStep(null);
    setProcessingError(null);
        setGeneratedImageUrl(null);
        setMatchedHsCode(null);
        setTranslations({});
      } else {
        setConnectionStatus('failed');
        setPubchemData(null);
        setErrors({ cas: t('spu.noDataFound') });
      }
    } catch (error) {
      console.error('PubChem search error:', error);
      setConnectionStatus('failed');
      setPubchemData(null);
      setErrors({ cas: t('spu.searchFailed') });
    } finally {
      setSearchingPubChem(false);
    }
  };

  // 搜索 SPU（保留用于其他地方调用）
  const handleSPUSearch = async () => {
    if (!spuSearchQuery || spuSearchQuery.length < 2) {
      return;
    }

    setSearchingSPU(true);
    setShowNoSpuHint(false);
    setSpuSearchResults([]);

    try {
      const response = await fetch(`/api/spu/search?q=${encodeURIComponent(spuSearchQuery)}`);
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        setSpuSearchResults(data.data);
      } else {
        setShowNoSpuHint(true);
      }
    } catch (error) {
      console.error('SPU search error:', error);
      setShowNoSpuHint(true);
    } finally {
      setSearchingSPU(false);
    }
  };

  // 选择 SPU
  const handleSelectSPU = (spu: SPUItem) => {
    setSelectedSPU(spu);
    setFormData({
      ...formData,
      spuId: spu.id,
      cas: spu.cas,
      name: spu.name,
      nameEn: spu.name_en || '',
      formula: spu.formula || '',
    });
    setSpuSearchResults([]);
    setSpuSearchQuery('');
    // 重置自动处理状态
    setProcessingStep(null);
    setProcessingError(null);
    setGeneratedImageUrl(null);
    setMatchedHsCode(null);
    setTranslations({});
  };

  // 取消选择 SPU
  const handleClearSPU = () => {
    setSelectedSPU(null);
    setFormData({
      ...formData,
      spuId: '',
      cas: '',
      name: '',
      nameEn: '',
      formula: '',
    });
    // 重置自动处理状态
    setProcessingStep(null);
    setProcessingError(null);
    setGeneratedImageUrl(null);
    setMatchedHsCode(null);
    setTranslations({});
  };

  // 使用 PubChem 搜索（保留用于单独调用）
  const handlePubChemSearch = async () => {
    if (!formData.cas) {
      setErrors({ cas: 'Please enter a CAS number' });
      return;
    }

    setSearchingPubChem(true);
    setErrors({});
    setPubchemData(null);

    // 显示连接状态
    setConnectionStatus('connecting');

    try {
      const response = await fetch(`/api/products/lookup?cas=${encodeURIComponent(formData.cas)}`);
      const data = await response.json();

      if (data.success && data.data) {
        // 数据库连接成功
        setConnectionStatus(data.source === 'local' ? 'local_success' : 'remote_success');
        
        let nameZh = data.data.nameZh || '';
        const nameEn = data.data.nameEn || '';

        if (!nameZh && nameEn) {
          try {
            const translateResponse = await fetch('/api/ai/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: nameEn, targetLanguage: 'zh' }),
            });
            const translateData = await translateResponse.json();
            if (translateData.translatedText) {
              nameZh = translateData.translatedText;
            }
          } catch (translateError) {
            console.error('Translation error:', translateError);
          }
        }

        setPubchemData({
          cas: formData.cas,
          source: data.source,
          cid: data.data.cid,
          nameZh,
          nameEn,
          formula: data.data.formula || '',
          molecularWeight: data.data.molecularWeight || '',
          // 结构信息
          smiles: data.data.smiles || '',
          isomericSmiles: data.data.isomericSmiles || '',
          inchi: data.data.inchi || '',
          inchiKey: data.data.inchiKey || '',
          xlogp: data.data.xlogp || '',
          // 结构图
          structure2dUrl: data.data.structure2dUrl || '',
          structure2dSvgUrl: data.data.structure2dSvgUrl || '',
          // 同义词
          synonyms: data.data.synonyms || [],
          // 物理化学性质
          boilingPoint: data.data.boilingPoint || '',
          meltingPoint: data.data.meltingPoint || '',
          flashPoint: data.data.flashPoint || '',
          density: data.data.density || '',
          solubility: data.data.solubility || '',
          vaporPressure: data.data.vaporPressure || '',
          physicalDescription: data.data.physicalDescription || '',
          colorForm: data.data.colorForm || '',
          odor: data.data.odor || '',
          // 描述与应用
          description: data.data.description || '',
          applications: data.data.applications || [],
          // 危险性分类
          hazardClasses: data.data.hazardClasses || '',
        });
        // 重置自动处理状态
        setProcessingStep(null);
    setProcessingError(null);
        setGeneratedImageUrl(null);
        setMatchedHsCode(null);
        setTranslations({});
      } else {
        setConnectionStatus('failed');
        setPubchemData(null);
        setErrors({ cas: t('spu.noDataFound') });
      }
    } catch (error) {
      console.error('PubChem search error:', error);
      setConnectionStatus('failed');
      setPubchemData(null);
      setErrors({ cas: t('spu.searchFailed') });
    } finally {
      setSearchingPubChem(false);
    }
  };

  // 纯度等级识别
  // 验证当前步骤
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      // Step 1: 选择产品
      if (!formData.spuId && !formData.cas) {
        newErrors.cas = 'Please select a SPU or enter a CAS number';
      }
    } else if (step === 1) {
      // Step 2: 确认数据 - 无需验证，用户可以编辑自动生成的数据
    } else if (step === 2) {
      // Step 3: 商业信息
      if (!formData.price) newErrors.price = 'Price is required';
      if (!formData.stock) newErrors.stock = 'Stock is required';
      if (!formData.moq) newErrors.moq = 'MOQ is required';
      if (!formData.deliveryTime) newErrors.deliveryTime = 'Delivery time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 自动处理函数：生成产品图、匹配HS编码、翻译多语言
  const handleAutoProcess = async () => {
    if (!pubchemData && !selectedSPU) return;

    setAutoProcessing(true);
    setProcessingStep(null);
    setProcessingError(null);
    setProcessingError(null);
    setGeneratedImageUrl(null);
    setMatchedHsCode(null);
    setTranslations({});
    
    const cas = pubchemData?.cas || selectedSPU?.cas;
    const name = pubchemData?.nameZh || selectedSPU?.name;
    const nameEn = pubchemData?.nameEn || selectedSPU?.name_en;
    const formula = pubchemData?.formula || selectedSPU?.formula;
    const description = pubchemData?.description || selectedSPU?.description;
    const applications = pubchemData?.applications || selectedSPU?.applications || [];

    // 支持的语言列表
    const targetLanguages = ['en', 'zh', 'ja', 'ko', 'de', 'fr', 'es', 'pt', 'ru', 'ar'];
    
    // 获取 token
    const token = getAdminToken();

    try {
      // Step 1: 生成产品图（必须成功）
      setProcessingStep('image');
      try {
        const imageResponse = await fetch('/api/admin/products/generate-image', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ cas, name: nameEn || name }),
        });
        const imageData = await imageResponse.json();
        if (!imageData.success) {
          throw new Error(imageData.error || '产品图生成失败');
        }
        setGeneratedImageUrl(imageData.imageUrl);
        // 立即填充到表单
        setFormData(prev => ({ ...prev, generatedImageUrl: imageData.imageUrl }));
      } catch (e: any) {
        // 产品图生成失败，停止流程
        console.error('Failed to generate image:', e);
        const errorMsg = t('spu.imageGenFailed', { error: e.message });
        setProcessingError(errorMsg);
        setErrors({ cas: errorMsg });
        setProcessingStep('done');
        setAutoProcessing(false);
        return;
      }

      // Step 2: 匹配 HS 编码（必须成功）
      setProcessingStep('hscode');
      try {
        const hsResponse = await fetch('/api/admin/products/match-hs-code', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ cas, name, nameEn, formula, description, applications }),
        });
        const hsData = await hsResponse.json();
        if (!hsData.success) {
          throw new Error(hsData.error || 'HS编码匹配失败');
        }
        setMatchedHsCode(hsData.hsCode);
        // 立即填充到表单
        setFormData(prev => ({ ...prev, hsCode: hsData.hsCode }));
      } catch (e: any) {
        // HS编码匹配失败，停止流程
        console.error('Failed to match HS code:', e);
        const errorMsg = t('spu.hsCodeMatchFailed', { error: e.message });
        setProcessingError(errorMsg);
        setErrors({ cas: errorMsg });
        setProcessingStep('done');
        setAutoProcessing(false);
        return;
      }

      // Step 3: 翻译到 10 种语言（并行翻译，大幅提升速度）
      setProcessingStep('translate');
      const newTranslations: Record<string, any> = {};

      // 辅助函数：并行翻译单个字段到所有语言
      const translateFieldParallel = async (fieldName: string, text: string, skipZh: boolean = false) => {
        if (!text) return;
        
        // 构建需要翻译的语言列表
        const languagesToTranslate = targetLanguages.filter(lang => {
          if (lang === 'en') return false; // 英文直接使用原文
          if (lang === 'zh' && skipZh && name) return false; // 名称已有中文则跳过
          return true;
        });

        // 设置英文原文
        newTranslations[fieldName] = { ...newTranslations[fieldName], en: text };
        if (fieldName === 'name' && name) {
          newTranslations[fieldName] = { ...newTranslations[fieldName], zh: name };
        }

        // 添加到正在翻译的字段集合
        setTranslatingFields(prev => new Set([...prev, fieldName]));

        // 并行翻译所有语言
        const translationPromises = languagesToTranslate.map(async (lang) => {
          try {
            const translateResponse = await fetch('/api/ai/translate', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
              },
              body: JSON.stringify({ text, targetLanguage: lang }),
            });
            const translateData = await translateResponse.json();
            if (translateData.translatedText) {
              return { lang, translatedText: translateData.translatedText };
            }
          } catch (e) {
            console.error(`Failed to translate ${fieldName} to ${lang}:`, e);
          }
          return null;
        });

        const results = await Promise.all(translationPromises);
        results.forEach((result) => {
          if (result) {
            newTranslations[fieldName] = { ...newTranslations[fieldName], [result.lang]: result.translatedText };
          }
        });

        // 从正在翻译的字段集合中移除
        setTranslatingFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldName);
          return newSet;
        });
      };

      // 并行翻译所有字段（同时发送所有请求）
      const allTranslationTasks: Promise<void>[] = [];

      // 翻译名称
      const nameToTranslate = nameEn || name;
      if (nameToTranslate) {
        allTranslationTasks.push(translateFieldParallel('name', nameToTranslate, true));
      }

      // 翻译描述
      if (description) {
        allTranslationTasks.push(translateFieldParallel('description', description));
      }

      // 翻译应用领域（数组）- 并行处理每个应用
      if (applications && applications.length > 0) {
        newTranslations.applications = { en: [...applications] };
        // 注意：zh 需要翻译，不要跳过
        
        // 添加到正在翻译的字段集合
        setTranslatingFields(prev => new Set([...prev, 'applications']));
        
        const appTasks = applications.flatMap((app: string, index: number) => {
          return targetLanguages
            .filter(lang => lang !== 'en') // 只跳过英文，中文需要翻译
            .map(async (lang) => {
              try {
                const translateResponse = await fetch('/api/ai/translate', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                  },
                  body: JSON.stringify({ text: app, targetLanguage: lang }),
                });
                const translateData = await translateResponse.json();
                if (translateData.translatedText) {
                  newTranslations.applications[lang] = newTranslations.applications[lang] || [];
                  newTranslations.applications[lang][index] = translateData.translatedText;
                }
              } catch (e) {
                console.error(`Failed to translate application to ${lang}:`, e);
                newTranslations.applications[lang] = newTranslations.applications[lang] || [];
                newTranslations.applications[lang][index] = app;
              }
            });
        });
        
        // 包装应用翻译任务，完成后移除状态
        const appTranslationTask = Promise.all(appTasks).then(() => {
          setTranslatingFields(prev => {
            const newSet = new Set(prev);
            newSet.delete('applications');
            return newSet;
          });
        });
        allTranslationTasks.push(appTranslationTask);
      }

      // 翻译物理描述
      const physicalDescription = pubchemData?.physicalDescription || selectedSPU?.physicalDescription;
      if (physicalDescription) {
        allTranslationTasks.push(translateFieldParallel('physicalDescription', physicalDescription));
      }

      // 翻译颜色/形态
      const colorForm = pubchemData?.colorForm || selectedSPU?.colorForm;
      if (colorForm) {
        allTranslationTasks.push(translateFieldParallel('colorForm', colorForm));
      }

      // 翻译气味
      const odor = pubchemData?.odor || selectedSPU?.odor;
      if (odor) {
        allTranslationTasks.push(translateFieldParallel('odor', odor));
      }

      // 翻译危险性分类
      const hazardClasses = pubchemData?.hazardClasses || selectedSPU?.hazardClasses;
      if (hazardClasses) {
        allTranslationTasks.push(translateFieldParallel('hazardClasses', hazardClasses));
      }

      // 翻译物理化学性质
      const boilingPoint = pubchemData?.boilingPoint;
      if (boilingPoint) {
        allTranslationTasks.push(translateFieldParallel('boilingPoint', boilingPoint));
      }

      const meltingPoint = pubchemData?.meltingPoint;
      if (meltingPoint) {
        allTranslationTasks.push(translateFieldParallel('meltingPoint', meltingPoint));
      }

      const flashPoint = pubchemData?.flashPoint;
      if (flashPoint) {
        allTranslationTasks.push(translateFieldParallel('flashPoint', flashPoint));
      }

      const density = pubchemData?.density;
      if (density) {
        allTranslationTasks.push(translateFieldParallel('density', density));
      }

      const solubility = pubchemData?.solubility;
      if (solubility) {
        allTranslationTasks.push(translateFieldParallel('solubility', solubility));
      }

      const vaporPressure = pubchemData?.vaporPressure;
      if (vaporPressure) {
        allTranslationTasks.push(translateFieldParallel('vaporPressure', vaporPressure));
      }

      // 等待所有翻译完成
      await Promise.all(allTranslationTasks);

      setTranslations(newTranslations);
      setProcessingStep('done');
      
      // 将翻译数据填充到表单中
      setFormData(prev => ({
        ...prev,
        translations: newTranslations,
      }));

    } catch (error) {
      console.error('Auto process error:', error);
    } finally {
      setAutoProcessing(false);
    }
  };

  // 显示弹窗
  const showNotification = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setDialogContent({ title, message, type });
    setShowDialog(true);
  };

  // 保存 SPU 数据到数据库
  const saveSPU = async (): Promise<string | null> => {
    // 验证必填数据
    if (!formData.cas) {
      showNotification(
        t('spu.saveFailed'),
        t('spu.casRequired'),
        'error'
      );
      return null;
    }
    
    const spuName = formData.name || formData.nameEn || pubchemData?.nameZh || pubchemData?.nameEn || selectedSPU?.name || selectedSPU?.name_en;
    if (!spuName) {
      showNotification(
        t('spu.saveFailed'),
        t('spu.productNameRequired'),
        'error'
      );
      return null;
    }

    setSavingSPU(true);
    try {
      const token = getAdminToken();
      
      const spuData = {
        cas: formData.cas,
        name: spuName,
        nameEn: formData.nameEn || pubchemData?.nameEn || selectedSPU?.name_en || null,
        formula: formData.formula || pubchemData?.formula || selectedSPU?.formula || null,
        description: pubchemData?.description || selectedSPU?.description || null,
        pubchemCid: pubchemData?.cid || selectedSPU?.pubchem_cid || null,
        molecularWeight: pubchemData?.molecularWeight || selectedSPU?.molecular_weight || null,
        smiles: pubchemData?.smiles || null,
        inchi: pubchemData?.inchi || null,
        inchiKey: pubchemData?.inchiKey || null,
        xlogp: pubchemData?.xlogp || null,
        boilingPoint: pubchemData?.boilingPoint || null,
        meltingPoint: pubchemData?.meltingPoint || null,
        flashPoint: pubchemData?.flashPoint || null,
        hazardClasses: pubchemData?.hazardClasses || selectedSPU?.hazardClasses || null,
        synonyms: pubchemData?.synonyms || selectedSPU?.synonyms || null,
        applications: pubchemData?.applications || selectedSPU?.applications || null,
        imageUrl: formData.generatedImageUrl || null,
        structureUrl: pubchemData?.structure2dUrl || null, // PubChem 2D 结构图 URL
        hsCode: formData.hsCode || null,
        translations: Object.keys(formData.translations).length > 0 ? formData.translations : null,
        // 物理描述相关
        physicalDescription: pubchemData?.physicalDescription || selectedSPU?.physicalDescription || null,
        colorForm: pubchemData?.colorForm || selectedSPU?.colorForm || null,
        odor: pubchemData?.odor || selectedSPU?.odor || null,
        density: pubchemData?.density || null,
        solubility: pubchemData?.solubility || null,
        vaporPressure: pubchemData?.vaporPressure || null,
        // 状态：根据用户选择的上架选项决定
        status: formData.isListed ? 'ACTIVE' : 'INACTIVE',
      };

      console.log('[SPU] Saving with data:', { cas: spuData.cas, name: spuData.name });

      const response = await fetch('/api/spu/save', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(spuData),
      });

      const result = await response.json();
      
      if (result.success) {
        setSpuSaved(true);
        setFormData(prev => ({ ...prev, spuId: result.data.id }));
        console.log('[SPU] Saved successfully:', result.data.id);
        return result.data.id;
      } else {
        console.error('Failed to save SPU:', result.error);
        showNotification(
          t('spu.saveFailed'),
          `${t('spu.error')}: ${result.error}`,
          'error'
        );
        return null;
      }
    } catch (error) {
      console.error('Error saving SPU:', error);
      showNotification(
        t('spu.saveFailed'),
        t('spu.networkError'),
        'error'
      );
      return null;
    } finally {
      setSavingSPU(false);
    }
  };

  // 下一步
  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // 如果在第一步且有数据，且自动处理未完成，先触发自动处理
      if (currentStep === 0 && (pubchemData || selectedSPU) && processingStep !== 'done') {
        // 填充表单数据
        const dataSource = pubchemData || selectedSPU;
        setFormData(prev => ({
          ...prev,
          name: dataSource.nameZh || dataSource.name || prev.name,
          nameEn: dataSource.nameEn || dataSource.name_en || prev.nameEn,
          formula: dataSource.formula || prev.formula,
          cas: dataSource.cas || prev.cas,
        }));

        // 触发自动处理
        await handleAutoProcess();
        // 注意：handleAutoProcess 成功后会设置 processingStep = 'done'
        // 用户需要再次点击"下一步"才能进入下一页
      } else if (currentStep === 1) {
        // Step 2: 确认数据 -> 保存SPU并上架
        setFormData(prev => ({ ...prev, isListed: true })); // 设置为上架
        const savedSpuId = await saveSPU();
        if (savedSpuId) {
          showNotification(
            t('spu.saveSuccess'),
            t('spu.productSavedToLibrary'),
            'success'
          );
          // 延迟跳转，让用户看到成功提示
          setTimeout(() => {
            window.location.href = '/admin/spu';
          }, 1500);
        }
      } else {
        // 已经处理完成或不需要处理，直接进入下一步
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // 暂不上架
  const handleSaveOnly = async () => {
    if (validateStep(currentStep)) {
      // 设置为不上架
      setFormData(prev => ({ ...prev, isListed: false }));
      
      const savedSpuId = await saveSPU();
      if (savedSpuId) {
        showNotification(
          t('spu.saveSuccess'),
          t('spu.productSavedNotListed'),
          'success'
        );
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          window.location.href = '/admin/spu';
        }, 1500);
      }
    }
  };

  // 上一步
  const handlePrevious = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {t('spu.upload')}
        </h1>
        <p className="text-slate-400">
          {t('spu.uploadSubtitle')}
        </p>
      </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {stepKeys.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              return (
                <div key={step.key} className="flex items-center flex-1">
                  <div className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                        isCompleted
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : isCurrent
                          ? 'bg-slate-700 border-blue-500 text-blue-400'
                          : 'bg-slate-800 border-slate-600 text-slate-500'
                      }`}
                    >
                      {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <div
                        className={`text-sm font-medium ${
                          isCurrent ? 'text-blue-400' : isCompleted ? 'text-white' : 'text-slate-500'
                        }`}
                      >
                        {t(step.titleKey)}
                      </div>
                    </div>
                  </div>
                  {index < stepKeys.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        index < currentStep ? 'bg-blue-600' : 'bg-slate-700'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

        {/* 表单内容 */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 mt-8">
          {/* Step 1: 选择产品 */}
          {currentStep === 0 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Database className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">{t(stepKeys[0].titleKey)}</h2>
              </div>

              {/* 已选择的 SPU */}
              {selectedSPU ? (
                <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-5 w-5 text-green-400" />
                      <span className="font-semibold text-green-400">
                        {t('spu.linkedSpu')}
                      </span>
                    </div>
                    <button
                      onClick={handleClearSPU}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {t('spu.unlink')}
                    </button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">{t('spu.nameZh')}</div>
                      <div className="font-semibold text-white">{selectedSPU.name}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">{t('spu.nameEn')}</div>
                      <div className="font-semibold text-white">{selectedSPU.name_en || '-'}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">CAS Number</div>
                      <div className="font-mono font-semibold text-blue-400">{selectedSPU.cas}</div>
                    </div>
                    <div className="bg-slate-700/50 rounded-lg p-4">
                      <div className="text-sm text-slate-400 mb-1">{t('spu.formula')}</div>
                      <div className="font-mono font-semibold text-white">{selectedSPU.formula || '-'}</div>
                    </div>
                    {selectedSPU.hs_code && (
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">HS Code</div>
                        <div className="font-mono font-semibold text-white">{selectedSPU.hs_code}</div>
                      </div>
                    )}
                    {selectedSPU.pubchem_cid && (
                      <div className="bg-slate-700/50 rounded-lg p-4">
                        <div className="text-sm text-slate-400 mb-1">PubChem CID</div>
                        <a 
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${selectedSPU.pubchem_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          {selectedSPU.pubchem_cid}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* SPU 搜索 */}
                  {/* 统一搜索框 */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-3">
                      {t('spu.searchProduct')}
                    </label>
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={spuSearchQuery || formData.cas}
                        onChange={(e) => {
                          setSpuSearchQuery(e.target.value);
                          setFormData({ ...formData, cas: e.target.value });
                          // 重置状态
                          setSpuSearchResults([]);
                          setShowNoSpuHint(false);
                          setPubchemData(null);
                          setConnectionStatus('idle');
                          setErrors({});
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && handleUnifiedSearch()}
                        placeholder={t('spu.enterCas')}
                        className="flex-1 px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white placeholder-slate-400"
                      />
                      <button
                        onClick={handleUnifiedSearch}
                        disabled={searchingSPU || searchingPubChem}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 font-medium"
                      >
                        {(searchingSPU || searchingPubChem) ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                        {t('common.search')}
                      </button>
                    </div>
                    <p className="text-sm text-slate-500 mt-2">
                      {t('spu.systemSearchHint')}
                    </p>
                  </div>

                  {/* 搜索状态指示 */}
                  {(searchingSPU || searchingPubChem) && (
                    <div className="flex items-center gap-2 text-blue-400 mb-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">
                        {searchingSPU 
                          ? t('spu.searchingLibrary')
                          : t('spu.fetchingFromPubchem')}
                      </span>
                    </div>
                  )}

                  {/* SPU 搜索结果 */}
                  {spuSearchResults.length > 0 && !pubchemData && (
                    <div className="border border-slate-600 rounded-lg divide-y divide-slate-700 mb-4">
                      <div className="px-4 py-3 bg-slate-700">
                        <div className="text-sm text-slate-300 font-medium">
                          {t('spu.foundProducts', { count: spuSearchResults.length })}
                        </div>
                        <div className="text-xs text-green-400 mt-1 flex items-center gap-1">
                          <Check className="h-3 w-3" />
                          {t('spu.spuAlreadyExists')}
                        </div>
                      </div>
                      {spuSearchResults.map((spu) => (
                        <button
                          key={spu.id}
                          onClick={() => handleSelectSPU(spu)}
                          className="w-full p-4 flex items-center justify-between hover:bg-slate-700 transition-colors text-left"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-blue-400 font-medium">{spu.cas}</span>
                              <span className="text-slate-600">|</span>
                              <span className="font-medium text-white">{spu.name}</span>
                              {spu.name_en && <span className="text-slate-400 text-sm">({spu.name_en})</span>}
                            </div>
                            {spu.formula && (
                              <div className="text-sm text-slate-500 mt-1">
                                {t('spu.formula')}: {spu.formula}
                              </div>
                            )}
                          </div>
                          <Check className="h-5 w-5 text-slate-500" />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* PubChem 数据 */}
                  {pubchemData && !selectedSPU && (
                    <div className="bg-green-600/10 border border-green-500/30 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Check className="h-5 w-5 text-green-400" />
                        <span className="font-semibold text-green-400">
                          {t('spu.fetchedFromPubchem')}
                        </span>
                        <span className="ml-auto text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                          PubChem
                        </span>
                      </div>
                      
                      {/* 主要信息区 */}
                      <div className="grid md:grid-cols-3 gap-4 mb-4">
                        {/* 2D 结构图 */}
                        {pubchemData.structure2dUrl && (
                          <div className="bg-slate-700/50 rounded-lg p-4 flex flex-col items-center justify-center row-span-2">
                            <div className="text-sm text-slate-400 mb-2">{t('spu.twoDStructure')}</div>
                            <img 
                              src={pubchemData.structure2dUrl} 
                              alt={`${pubchemData.nameEn || pubchemData.nameZh || 'Compound'} 2D Structure`}
                              className="max-w-full h-auto rounded border border-slate-600"
                              style={{ maxHeight: '180px' }}
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                            {pubchemData.cid && (
                              <a 
                                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemData.cid}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                PubChem CID: {pubchemData.cid}
                              </a>
                            )}
                          </div>
                        )}
                        
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-1">{t('spu.nameZh')}</div>
                          <div className="font-semibold text-white">{pubchemData.nameZh || '-'}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-1">{t('spu.nameEn')}</div>
                          <div className="font-semibold text-white">{pubchemData.nameEn || '-'}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-1">CAS Number</div>
                          <div className="font-mono font-semibold text-blue-400">{pubchemData.cas}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-1">{t('spu.molecularFormula')}</div>
                          <div className="font-mono font-semibold text-white">{pubchemData.formula || '-'}</div>
                        </div>
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm text-slate-400 mb-1">{t('spu.molecularWeight')}</div>
                          <div className="font-mono font-semibold text-white">{pubchemData.molecularWeight || '-'}</div>
                        </div>
                      </div>
                      
                      {/* 结构信息区 */}
                      <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                        <div className="text-sm font-medium text-slate-300 mb-3">{t('spu.structureInfo')}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-800 rounded px-3 py-2">
                            <span className="text-slate-500">SMILES:</span>{' '}
                            <span className="font-mono text-slate-300 break-all">{pubchemData.smiles || '-'}</span>
                          </div>
                          <div className="bg-slate-800 rounded px-3 py-2">
                            <span className="text-slate-500">InChIKey:</span>{' '}
                            <span className="font-mono text-slate-300">{pubchemData.inchiKey || '-'}</span>
                          </div>
                          {pubchemData.inchi && (
                            <div className="bg-slate-800 rounded px-3 py-2 md:col-span-2">
                              <span className="text-slate-500">InChI:</span>{' '}
                              <span className="font-mono text-slate-300 break-all text-xs">{pubchemData.inchi}</span>
                            </div>
                          )}
                          {pubchemData.xlogp && (
                            <div className="bg-slate-800 rounded px-3 py-2">
                              <span className="text-slate-500">XLogP:</span>{' '}
                              <span className="font-mono text-slate-300">{pubchemData.xlogp}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* 同义词区 */}
                      {pubchemData.synonyms && pubchemData.synonyms.length > 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
                          <div className="text-sm font-medium text-slate-300 mb-3">{t('spu.synonymsAliases')}</div>
                          <div className="flex flex-wrap gap-2">
                            {pubchemData.synonyms.slice(0, 15).map((synonym: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-slate-700 text-slate-300 rounded text-xs">
                                {synonym}
                              </span>
                            ))}
                            {pubchemData.synonyms.length > 15 && (
                              <span className="px-2 py-1 bg-slate-700 text-slate-500 rounded text-xs">
                                +{pubchemData.synonyms.length - 15} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 物理化学性质 */}
                      {(pubchemData.boilingPoint || pubchemData.meltingPoint || pubchemData.flashPoint || pubchemData.density || pubchemData.solubility || pubchemData.vaporPressure) && (
                        <div className="bg-slate-700/50 rounded-lg p-4">
                          <div className="text-sm font-medium text-slate-300 mb-3">{t('spu.physicochemicalProperties')}</div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                            {pubchemData.boilingPoint && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.boilingPoint')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.boilingPoint}</span>
                              </div>
                            )}
                            {pubchemData.meltingPoint && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.meltingPoint')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.meltingPoint}</span>
                              </div>
                            )}
                            {pubchemData.flashPoint && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.flashPoint')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.flashPoint}</span>
                              </div>
                            )}
                            {pubchemData.density && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.density')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.density}</span>
                              </div>
                            )}
                            {pubchemData.solubility && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.solubility')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.solubility}</span>
                              </div>
                            )}
                            {pubchemData.vaporPressure && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.vaporPressure')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.vaporPressure}</span>
                              </div>
                            )}
                            {pubchemData.physicalDescription && (
                              <div className="bg-slate-800 rounded px-3 py-2 md:col-span-2">
                                <span className="text-slate-500">{t('spu.physicalDescription')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.physicalDescription}</span>
                              </div>
                            )}
                            {pubchemData.colorForm && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.colorForm')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.colorForm}</span>
                              </div>
                            )}
                            {pubchemData.odor && (
                              <div className="bg-slate-800 rounded px-3 py-2">
                                <span className="text-slate-500">{t('spu.odor')}:</span>{' '}
                                <span className="font-medium text-slate-300">{pubchemData.odor}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* 产品描述 */}
                      {pubchemData.description && (
                        <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                          <div className="text-sm font-medium text-slate-300 mb-2">{t('spu.description')}</div>
                          <p className="text-sm text-slate-400">{pubchemData.description}</p>
                        </div>
                      )}
                      
                      {/* 行业应用 */}
                      {pubchemData.applications && pubchemData.applications.length > 0 && (
                        <div className="bg-slate-700/50 rounded-lg p-4 mt-4">
                          <div className="text-sm font-medium text-slate-300 mb-2">{t('spu.applications')}</div>
                          <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                            {pubchemData.applications.slice(0, 5).map((app: string, index: number) => (
                              <li key={index}>{app}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* 自动处理状态 */}
                      {(pubchemData || selectedSPU) && (
                        <div className={`mt-6 rounded-lg p-4 ${
                          processingError 
                            ? 'bg-red-600/10 border border-red-500/30' 
                            : processingStep === 'done' 
                              ? 'bg-green-600/10 border border-green-500/30'
                              : autoProcessing
                                ? 'bg-blue-600/10 border border-blue-500/30'
                                : 'bg-slate-700/50 border border-slate-600'
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {processingError ? (
                                <X className="h-5 w-5 text-red-400" />
                              ) : processingStep === 'done' ? (
                                <Check className="h-5 w-5 text-green-400" />
                              ) : autoProcessing ? (
                                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                              ) : (
                                <Database className="h-5 w-5 text-slate-400" />
                              )}
                              <span className={`font-medium ${
                                processingError 
                                  ? 'text-red-400' 
                                  : processingStep === 'done' 
                                    ? 'text-green-400'
                                    : autoProcessing
                                      ? 'text-blue-400'
                                      : 'text-slate-300'
                              }`}>
                                {processingError 
                                  ? t('spu.processingFailed')
                                  : processingStep === 'done' 
                                    ? t('spu.processingComplete')
                                    : autoProcessing 
                                      ? t('spu.processingData')
                                      : t('spu.aiDataProcessing')}
                              </span>
                            </div>
                            {(processingError || !autoProcessing && processingStep !== 'done') && (
                              <button
                                onClick={handleAutoProcess}
                                disabled={autoProcessing}
                                className={`px-3 py-1 text-sm rounded transition-colors ${
                                  processingError 
                                    ? 'bg-red-600 text-white hover:bg-red-700' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                } disabled:opacity-50`}
                              >
                                {processingError 
                                  ? t('spu.retry')
                                  : t('spu.startGeneration')}
                              </button>
                            )}
                          </div>
                          
                          {processingError && (
                            <p className="text-sm text-red-400 mb-3">{processingError}</p>
                          )}
                          
                          <div className="space-y-2 text-sm">
                            {/* 产品图生成 */}
                            <div className="flex items-center gap-2">
                              {processingStep === 'image' && autoProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                              ) : generatedImageUrl ? (
                                <Check className="h-4 w-4 text-green-400" />
                              ) : processingStep && ['hscode', 'translate', 'done'].includes(processingStep) ? (
                                <X className="h-4 w-4 text-red-400" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
                              )}
                              <span className={generatedImageUrl ? 'text-green-400' : processingStep && ['hscode', 'translate', 'done'].includes(processingStep) && !generatedImageUrl ? 'text-red-400' : 'text-slate-400'}>
                                {t('spu.generateProductImage')}
                              </span>
                              {generatedImageUrl && (
                                <a href={generatedImageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 text-xs ml-auto hover:text-blue-300">
                                  {t('common.view')}
                                </a>
                              )}
                            </div>
                            
                            {/* HS编码匹配 */}
                            <div className="flex items-center gap-2">
                              {processingStep === 'hscode' && autoProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                              ) : matchedHsCode ? (
                                <Check className="h-4 w-4 text-green-400" />
                              ) : processingStep && ['translate', 'done'].includes(processingStep) ? (
                                <X className="h-4 w-4 text-red-400" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
                              )}
                              <span className={matchedHsCode ? 'text-green-400' : processingStep && ['translate', 'done'].includes(processingStep) && !matchedHsCode ? 'text-red-400' : 'text-slate-400'}>
                                {t('spu.matchHsCode')}
                              </span>
                              {matchedHsCode && (
                                <span className="text-blue-400 font-mono text-xs ml-auto">{matchedHsCode}</span>
                              )}
                            </div>
                            
                            {/* 多语言翻译 */}
                            <div className="flex items-center gap-2">
                              {processingStep === 'translate' && autoProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                              ) : Object.keys(translations).length > 0 ? (
                                <Check className="h-4 w-4 text-green-400" />
                              ) : processingStep === 'done' && Object.keys(translations).length === 0 ? (
                                <X className="h-4 w-4 text-slate-500" />
                              ) : (
                                <div className="h-4 w-4 rounded-full border-2 border-slate-600" />
                              )}
                              <span className={Object.keys(translations).length > 0 ? 'text-green-400' : 'text-slate-400'}>
                                {t('spu.translateTenLang')}
                              </span>
                              {translatingFields.size > 0 && (
                                <span className="text-blue-400 text-xs ml-auto animate-pulse">
                                  {t('spu.currentlyTranslating')} {Array.from(translatingFields).map(f => 
                                    t(`spu.field${f.charAt(0).toUpperCase() + f.slice(1)}`)
                                  ).join(', ')}
                                </span>
                              )}
                              {Object.keys(translations).length > 0 && translatingFields.size === 0 && (
                                <span className="text-green-400 text-xs ml-auto">
                                  {t('spu.processingDone')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* 提示信息 */}
                      <div className="mt-6 pt-4 border-t border-slate-600">
                        <p className="text-sm text-slate-400 text-center">
                          {processingStep === 'done' 
                            ? t('spu.dataGeneratedClickNext')
                            : autoProcessing
                              ? t('spu.processingDataPleaseWait')
                              : t('spu.confirmThenStart')}
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {errors.cas && <p className="text-red-400 text-sm mt-1">{errors.cas}</p>}
            </div>
          )}

          {/* Step 2: 确认数据 */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Check className="h-6 w-6 text-blue-400" />
                <h2 className="text-xl font-bold text-white">{t(stepKeys[1].titleKey)}</h2>
              </div>

              {/* 基本信息区块 */}
              <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-6">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-400" />
                  {t('spu.basicInformation')}
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  {/* CAS号 */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.casNumber')}</label>
                    <input
                      type="text"
                      value={formData.cas}
                      readOnly
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-blue-400"
                    />
                  </div>
                  {/* 名称（根据当前语言统一显示） */}
                  <div className="md:col-span-2">
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.name')}</label>
                    <input
                      type="text"
                      value={(() => {
                        // 优先显示翻译后的名称
                        if (formData.translations?.name?.[locale]) {
                          return formData.translations.name[locale];
                        }
                        // 否则根据当前语言显示原文
                        return formData.name || formData.nameEn || '';
                      })()}
                      onChange={(e) => {
                        // 更新名称字段（优先更新中文名称）
                        setFormData({ ...formData, name: e.target.value });
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder={t('spu.name')}
                    />
                  </div>
                  {/* 分子式 */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.molecularFormula')}</label>
                    <input
                      type="text"
                      value={formData.formula}
                      onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 text-white"
                      placeholder="C2H4O2"
                    />
                  </div>
                  {/* 分子量 */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('spu.molecularWeight')}</label>
                    <input
                      type="text"
                      value={(pubchemData?.molecularWeight || selectedSPU?.molecular_weight) || ''}
                      onChange={(e) => {
                        // 分子量不可编辑，仅展示
                      }}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-slate-300"
                      readOnly
                    />
                  </div>
                  {/* PubChem CID */}
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">PubChem CID</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={(pubchemData?.cid || selectedSPU?.pubchem_cid) || ''}
                        readOnly
                        className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg font-mono text-slate-300"
                      />
                      {(pubchemData?.cid || selectedSPU?.pubchem_cid) && (
                        <a
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemData?.cid || selectedSPU?.pubchem_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 结构信息区块 */}
              {(pubchemData?.smiles || pubchemData?.inchiKey || pubchemData?.inchi || pubchemData?.xlogp) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('spu.structureInfo')}</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* SMILES */}
                    {pubchemData?.smiles && (
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">SMILES</label>
                        <input
                          type="text"
                          value={pubchemData.smiles}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                        />
                      </div>
                    )}
                    {/* InChIKey */}
                    {pubchemData?.inchiKey && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">InChIKey</label>
                        <input
                          type="text"
                          value={pubchemData.inchiKey}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                        />
                      </div>
                    )}
                    {/* XLogP */}
                    {pubchemData?.xlogp && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">XLogP</label>
                        <input
                          type="text"
                          value={pubchemData.xlogp}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono"
                        />
                      </div>
                    )}
                    {/* InChI */}
                    {pubchemData?.inchi && (
                      <div className="md:col-span-2">
                        <label className="block text-xs text-gray-500 mb-1">InChI</label>
                        <input
                          type="text"
                          value={pubchemData.inchi}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-xs"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 物理化学性质区块 */}
              {(pubchemData?.boilingPoint || pubchemData?.meltingPoint || pubchemData?.flashPoint || 
                pubchemData?.density || pubchemData?.solubility || pubchemData?.vaporPressure) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('spu.physicochemicalProperties')}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {pubchemData?.boilingPoint && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('spu.boilingPoint')}</label>
                        <input
                          type="text"
                          value={formData.translations?.boilingPoint?.[locale] || pubchemData.boilingPoint}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    )}
                    {pubchemData?.meltingPoint && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('spu.meltingPoint')}</label>
                        <input
                          type="text"
                          value={formData.translations?.meltingPoint?.[locale] || pubchemData.meltingPoint}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    )}
                    {pubchemData?.flashPoint && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('spu.flashPoint')}</label>
                        <input
                          type="text"
                          value={formData.translations?.flashPoint?.[locale] || pubchemData.flashPoint}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    )}
                    {pubchemData?.density && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('spu.density')}</label>
                        <input
                          type="text"
                          value={formData.translations?.density?.[locale] || pubchemData.density}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    )}
                    {pubchemData?.solubility && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('spu.solubility')}</label>
                        <input
                          type="text"
                          value={formData.translations?.solubility?.[locale] || pubchemData.solubility}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    )}
                    {pubchemData?.vaporPressure && (
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">{t('spu.vaporPressure')}</label>
                        <input
                          type="text"
                          value={formData.translations?.vaporPressure?.[locale] || pubchemData.vaporPressure}
                          readOnly
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 物理描述区块 */}
              {(pubchemData?.physicalDescription || pubchemData?.colorForm || pubchemData?.odor || 
                selectedSPU?.physicalDescription || selectedSPU?.colorForm || selectedSPU?.odor) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('spu.physicalDescription')}</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* 物理描述 */}
                    <div className="md:col-span-3">
                      <label className="block text-xs text-gray-500 mb-1">{t('spu.physicalDescription')}</label>
                      <textarea
                        value={formData.translations?.physicalDescription?.[locale] || pubchemData?.physicalDescription || selectedSPU?.physicalDescription || ''}
                        readOnly
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                    </div>
                    {/* 颜色/形态 */}
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">{t('spu.colorForm')}</label>
                      <input
                        type="text"
                        value={formData.translations?.colorForm?.[locale] || pubchemData?.colorForm || selectedSPU?.colorForm || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    {/* 气味 */}
                    <div className="md:col-span-2">
                      <label className="block text-xs text-gray-500 mb-1">{t('spu.odor')}</label>
                      <input
                        type="text"
                        value={formData.translations?.odor?.[locale] || pubchemData?.odor || selectedSPU?.odor || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 危险性分类 */}
              {(pubchemData?.hazardClasses || selectedSPU?.hazardClasses) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('spu.hazardClassification')}</h3>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">{formData.translations?.hazardClasses?.[locale] || pubchemData?.hazardClasses || selectedSPU?.hazardClasses}</p>
                  </div>
                </div>
              )}

              {/* 产品描述 */}
              {(pubchemData?.description || selectedSPU?.description) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('spu.description')}</h3>
                  <textarea
                    value={(() => {
                      // 优先显示翻译后的描述
                      if (formData.translations?.description?.[locale]) {
                        return formData.translations.description[locale];
                      }
                      // 否则显示原文
                      return pubchemData?.description || selectedSPU?.description || '';
                    })()}
                    readOnly
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                  />
                </div>
              )}

              {/* 行业应用 */}
              {((pubchemData?.applications && pubchemData.applications.length > 0) || (selectedSPU?.applications && selectedSPU.applications.length > 0)) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('spu.applications')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const apps = pubchemData?.applications || selectedSPU?.applications || [];
                      // 如果有翻译数据且是数组，优先显示对应语言的翻译
                      const translatedApps = formData.translations?.applications?.[locale];
                      if (Array.isArray(translatedApps)) {
                        return translatedApps.map((app: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                            {app}
                          </span>
                        ));
                      }
                      // 否则显示原文
                      return apps.map((app: string, index: number) => (
                        <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm border border-blue-200">
                          {app}
                        </span>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* 同义词/别名 */}
              {(pubchemData?.synonyms?.length > 0) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('spu.synonymsAliases')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {pubchemData.synonyms.slice(0, 20).map((synonym: string, index: number) => (
                      <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                        {synonym}
                      </span>
                    ))}
                    {pubchemData.synonyms.length > 20 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">
                        +{pubchemData.synonyms.length - 20} {t('spu.more')}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* AI 自动生成的数据 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Database className="h-5 w-5 text-blue-600" />
                  <span className="font-semibold text-blue-900">
                    {t('spu.aiGeneratedEditable')}
                  </span>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* 产品图 */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 mb-2">{t('spu.productImage')}</div>
                    {formData.generatedImageUrl ? (
                      <div className="relative">
                        <img 
                          src={formData.generatedImageUrl} 
                          alt="Generated product"
                          className="w-full h-40 object-contain rounded border border-gray-200 bg-white"
                          loading="lazy"
                        />
                        <button
                          onClick={() => setFormData({ ...formData, generatedImageUrl: '' })}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-full h-40 rounded border border-dashed border-gray-300 bg-gray-50 flex items-center justify-center text-gray-400">
                        {t('spu.noProductImage')}
                      </div>
                    )}
                    <div className="mt-2">
                      <label className="block text-xs text-gray-500 mb-1">
                        {t('spu.imageUrlReplaceable')}
                      </label>
                      <input
                        type="text"
                        value={formData.generatedImageUrl}
                        onChange={(e) => setFormData({ ...formData, generatedImageUrl: e.target.value })}
                        placeholder={t('spu.enterImageUrl')}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                      />
                    </div>
                  </div>

                  {/* HS编码 */}
                  <div className="bg-white rounded-lg p-4 shadow-sm">
                    <div className="text-sm text-gray-600 mb-2">{t('spu.hsCode')}</div>
                    <input
                      type="text"
                      value={formData.hsCode}
                      onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={t('spu.hsCode')}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {t('spu.hsCodeForCustoms')}
                    </p>
                  </div>

                  {/* 多语言翻译 */}
                  <div className="bg-white rounded-lg p-4 shadow-sm md:col-span-2">
                    <div className="text-sm text-gray-600 mb-3">{t('spu.multiLangTranslations')}</div>
                    {Object.keys(formData.translations.name || {}).length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                        {Object.entries(formData.translations.name || {}).map(([lang, name]) => (
                          <div key={lang} className={`bg-gray-50 rounded p-2 ${lang === locale ? 'ring-2 ring-blue-400' : ''}`}>
                            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              <span className="font-medium uppercase">{lang}</span>
                              {lang === locale && <span className="text-blue-600">✓</span>}
                            </div>
                            <input
                              type="text"
                              value={name as string}
                              onChange={(e) => {
                                setFormData(prev => ({
                                  ...prev,
                                  translations: {
                                    ...prev.translations,
                                    name: {
                                      ...(prev.translations.name || {}),
                                      [lang]: e.target.value,
                                    },
                                  },
                                }));
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400 text-sm py-4 text-center">
                        {t('spu.noTranslationData')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* 导航按钮 */}
          <div className="flex justify-between mt-8 pt-6 border-t border-slate-700">
            {/* 第一步时不显示上一步按钮 */}
            {currentStep > 0 ? (
              <button
                onClick={handlePrevious}
                className="px-6 py-3 bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                {t('spu.previous')}
              </button>
            ) : (
              <div></div>
            )}

            {currentStep === 0 ? (
              // 第一步：下一步按钮
              <button
                onClick={handleNext}
                disabled={autoProcessing || savingSPU || !(pubchemData || selectedSPU)}
                className={`px-6 py-3 text-white rounded-lg transition-colors flex items-center gap-2 ${
                  (pubchemData || selectedSPU) && processingStep !== 'done' 
                    ? 'bg-green-600' 
                    : 'bg-blue-600'
                } disabled:opacity-50`}
              >
                {autoProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t('spu.processingDone')}
                  </>
                ) : (pubchemData || selectedSPU) && processingStep !== 'done' ? (
                  <>
                    <Check className="h-4 w-4" />
                    {t('spu.createProductWithData')}
                  </>
                ) : (
                  <>
                    {t('spu.next')}
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </button>
            ) : (
              // 第二步：两个按钮
              <div className="flex gap-3">
                <button
                  onClick={handleSaveOnly}
                  disabled={savingSPU}
                  className="px-6 py-3 bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {savingSPU ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  {t('spu.saveAsDraft')}
                </button>
                <button
                  onClick={handleNext}
                  disabled={savingSPU}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {savingSPU ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4" />
                  )}
                  {t('spu.saveToLibrary')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 自定义弹窗 */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowDialog(false)} />
          <div className="relative bg-white rounded-lg shadow-lg p-6 max-w-md mx-4 z-10">
            <div className="flex items-center gap-3 mb-4">
              {dialogContent.type === 'success' ? (
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              )}
              <h3 className="text-lg font-semibold text-gray-900">{dialogContent.title}</h3>
            </div>
            <p className="text-gray-600 mb-6">{dialogContent.message}</p>
            <button
              onClick={() => setShowDialog(false)}
              className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                dialogContent.type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {t('common.confirm')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductUploadPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <ProductUploadContent />
    </Suspense>
  );
}

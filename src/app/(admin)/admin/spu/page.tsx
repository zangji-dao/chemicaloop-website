'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Database,
  RefreshCw,
  X,
  Save,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowLeft,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';

interface SPUItem {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  description?: string;
  image_url?: string;
  hs_code?: string;
  hs_code_extensions?: Record<string, string>;
  status: string;
  // PubChem 信息
  pubchem_cid?: number;
  molecular_weight?: string;
  exact_mass?: string;
  smiles?: string;
  smiles_canonical?: string;
  smiles_isomeric?: string;
  inchi?: string;
  inchi_key?: string;
  // 计算属性
  xlogp?: string;
  tpsa?: string;
  complexity?: number;
  h_bond_donor_count?: number;
  h_bond_acceptor_count?: number;
  rotatable_bond_count?: number;
  heavy_atom_count?: number;
  formal_charge?: number;
  // PubChem 2D 结构图
  structure_url?: string;
  structure_image_key?: string;
  structure_2d_svg?: string;
  // 产品图（AI 生成）
  product_image_key?: string;
  product_image_generated_at?: string;
  // 物理化学性质
  physical_description?: string;
  color_form?: string;
  odor?: string;
  boiling_point?: string;
  melting_point?: string;
  flash_point?: string;
  density?: string;
  solubility?: string;
  vapor_pressure?: string;
  refractive_index?: string;
  // 安全与毒性
  hazard_classes?: string;
  health_hazards?: string;
  ghs_classification?: string;
  toxicity_summary?: string;
  carcinogenicity?: string;
  first_aid?: string;
  storage_conditions?: string;
  incompatible_materials?: string;
  // 其他
  synonyms?: string[];
  applications?: string[];
  // 多语言翻译
  translations?: {
    name?: Record<string, string>;
    description?: Record<string, string>;
    applications?: Record<string, string[]>;
    synonyms?: Record<string, string[]>;
    physicalDescription?: Record<string, string>;
    colorForm?: Record<string, string>;
    odor?: Record<string, string>;
    density?: Record<string, string>;
    boilingPoint?: Record<string, string>;
    meltingPoint?: Record<string, string>;
    flashPoint?: Record<string, string>;
    hazardClasses?: Record<string, string>;
    healthHazards?: Record<string, string>;
    ghsClassification?: Record<string, string>;
    firstAid?: Record<string, string>;
    storageConditions?: Record<string, string>;
    incompatibleMaterials?: Record<string, string>;
    solubility?: Record<string, string>;
    vaporPressure?: Record<string, string>;
    refractiveIndex?: Record<string, string>;
  };
  sku_count?: number;
  created_at: string;
  updated_at?: string;
  pubchem_synced_at?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// 辅助函数：安全获取翻译后的名称
function getDisplayName(
  spu: { name?: string; name_en?: string; translations?: { name?: Record<string, string> } },
  locale: string
): string {
  // 优先使用翻译
  if (spu.translations?.name) {
    const translatedName = spu.translations.name[locale];
    if (translatedName) return translatedName;
  }
  
  // 回退策略：
  // 1. 如果是中文 locale，优先使用 name（通常是中文），如果 name 包含非中文字符则使用 name_en
  // 2. 如果是英文 locale，优先使用 name_en
  // 3. 其他情况使用 name
  
  if (locale === 'zh') {
    // 检查 name 是否是有效的中文
    const name = spu.name || '';
    const hasChinese = /[\u4e00-\u9fff]/.test(name);
    if (hasChinese) return name;
    // 如果 name 不是中文，尝试使用英文
    return spu.name_en || name;
  }
  
  if (locale === 'en') {
    return spu.name_en || spu.name || '';
  }
  
  // 其他语言：尝试翻译 -> 英文名 -> 原始名称
  return spu.name || spu.name_en || '';
}

// 辅助函数：获取英文名称（用于第二行显示）
function getEnglishName(
  spu: { name?: string; name_en?: string; translations?: { name?: Record<string, string> } }
): string {
  // 优先使用翻译
  if (spu.translations?.name?.en) {
    return spu.translations.name.en;
  }
  return spu.name_en || spu.name || '';
}

export default function AdminSPUPage() {
  const { t, locale } = useAdminLocale();
  
  const statusConfig: Record<string, { label: string; color: string; bgColor: string }> = {
    ACTIVE: { label: t('spu.active'), color: 'text-green-400', bgColor: 'bg-green-500/20' },
    INACTIVE: { label: t('spu.inactive'), color: 'text-slate-400', bgColor: 'bg-slate-500/20' },
  };

  const [spuList, setSpuList] = useState<SPUItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // 创建/编辑弹窗
  // 视图模式：'list' 显示列表，'edit' 显示编辑面板
  const [viewMode, setViewMode] = useState<'list' | 'edit'>('list');
  const [editingSpu, setEditingSpu] = useState<SPUItem | null>(null);
  const [saving, setSaving] = useState(false);
  
  // 翻译状态
  const [translating, setTranslating] = useState(false); // 翻译中状态
  const [translatingFields, setTranslatingFields] = useState<Set<string>>(new Set()); // 正在翻译的字段集合
  const [translationProgress, setTranslationProgress] = useState<{
    current: number;
    total: number;
    currentLang: string;
    currentField: string;
    status: 'idle' | 'translating' | 'completed';
  }>({ current: 0, total: 0, currentLang: '', currentField: '', status: 'idle' });
  
  // 同步进度状态
  const [syncProgress, setSyncProgress] = useState<{
    step: 'connecting' | 'fetching' | 'parsing' | 'updating';
    message: string;
  }>({ step: 'connecting', message: '' });
  
  // 同步后状态
  const [justSynced, setJustSynced] = useState(false); // 刚完成 PubChem 同步，需要翻译
  const [syncedFields, setSyncedFields] = useState<Set<string>>(new Set()); // 同步后需要翻译的字段
  const [preSyncFormData, setPreSyncFormData] = useState<typeof formData | null>(null); // 同步前的表单数据
  const [preSyncSpu, setPreSyncSpu] = useState<SPUItem | null>(null); // 同步前的产品数据
  
  // 临时翻译存储（用于预览，用户确认后才保存）
  const [pendingTranslations, setPendingTranslations] = useState<{
    name?: Record<string, string>;
    description?: Record<string, string>;
    applications?: Record<string, string[]>;
    synonyms?: Record<string, string[]>;
    physicalDescription?: Record<string, string>;
    colorForm?: Record<string, string>;
    odor?: Record<string, string>;
    density?: Record<string, string>;
    boilingPoint?: Record<string, string>;
    meltingPoint?: Record<string, string>;
    flashPoint?: Record<string, string>;
    hazardClasses?: Record<string, string>;
    healthHazards?: Record<string, string>;
    ghsClassification?: Record<string, string>;
    firstAid?: Record<string, string>;
    storageConditions?: Record<string, string>;
    incompatibleMaterials?: Record<string, string>;
    solubility?: Record<string, string>;
    vaporPressure?: Record<string, string>;
    refractiveIndex?: Record<string, string>;
  } | null>(null);
  
  // 图片相关状态
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null); // 2D 结构图 URL
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null); // 产品图 URL
  const [generatingImage, setGeneratingImage] = useState(false); // 生成产品图中
  const [newProductImageUrl, setNewProductImageUrl] = useState<string | null>(null); // 新生成的产品图 URL（用于对比）
  const [showImageCompareModal, setShowImageCompareModal] = useState(false); // 图片对比弹窗
  
  // 自动调整 textarea 高度的辅助函数
  const autoResizeTextarea = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    target.style.height = 'auto';
    target.style.height = target.scrollHeight + 'px';
  };
  
  // 初始化所有 textarea 的高度
  const initTextareaHeights = () => {
    setTimeout(() => {
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach((textarea) => {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      });
    }, 100); // 增加延迟确保 DOM 更新完成
  };
  
  // 编辑面板打开时初始化 textarea 高度
  useEffect(() => {
    if (viewMode === 'edit') {
      initTextareaHeights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // 监听侧边栏菜单点击，返回列表视图
  useEffect(() => {
    const handleMenuClick = () => {
      if (viewMode === 'edit') {
        handleCloseEditModal();
      }
    };
    
    window.addEventListener('admin-menu-click-same-path', handleMenuClick);
    return () => window.removeEventListener('admin-menu-click-same-path', handleMenuClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);
  
  // 自定义弹窗
  const [showDialog, setShowDialog] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    type: 'confirm' | 'success' | 'error';
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ type: 'success', title: '', message: '' });
  
  // 显示弹窗的函数
  const showNotification = (title: string, message: string, type: 'success' | 'error' = 'success') => {
    setDialogConfig({ type, title, message });
    setShowDialog(true);
  };
  
  const showConfirm = (title: string, message: string, onConfirm: () => void, type: 'confirm' | 'success' | 'error' = 'confirm') => {
    setDialogConfig({ type, title, message, onConfirm });
    setShowDialog(true);
  };
  
  // 表单数据
  const [formData, setFormData] = useState({
    cas: '',
    name: '',
    nameEn: '',
    formula: '',
    molecularWeight: '',
    exactMass: '',
    description: '',
    synonyms: [] as string[],
    applications: [] as string[],
    hsCode: '',
    hsCodeExtensions: {} as Record<string, string>,
    status: 'ACTIVE',
    // PubChem 化学信息
    smiles: '',
    smilesCanonical: '',
    smilesIsomeric: '',
    inchi: '',
    inchiKey: '',
    // 计算属性
    xlogp: '',
    tpsa: '',
    complexity: '',
    hBondDonorCount: '',
    hBondAcceptorCount: '',
    rotatableBondCount: '',
    heavyAtomCount: '',
    formalCharge: '',
    // 物理化学性质
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
    // 安全与毒性
    hazardClasses: '',
    healthHazards: '',
    ghsClassification: '',
    toxicitySummary: '',
    carcinogenicity: '',
    firstAid: '',
    storageConditions: '',
    incompatibleMaterials: '',
  });
  
  // 原始表单数据（用于检测当前语言下的变化）
  const [originalFormData, setOriginalFormData] = useState<typeof formData | null>(null);
  // 原始 translations 对象（用于保存时合并）- 可能包含不同类型的翻译值
  const [originalTranslations, setOriginalTranslations] = useState<Record<string, Record<string, string | string[]>> | null>(null);
  
  // 检测表单是否有修改
  const hasFormChanges = useMemo(() => {
    if (!originalFormData) return true; // 新建时默认显示保存按钮
    return Object.keys(formData).some(key => {
      const current = formData[key as keyof typeof formData];
      const original = originalFormData[key as keyof typeof originalFormData];
      // 处理数组类型
      if (Array.isArray(current) && Array.isArray(original)) {
        return JSON.stringify(current) !== JSON.stringify(original);
      }
      return current !== original;
    });
  }, [formData, originalFormData]);
  
  // PubChem 信息（只读）
  const [pubchemInfo, setPubchemInfo] = useState<{
    cid?: number;
    syncedAt?: string;
  }>({});
  
  // HS码扩展国家
  const hsCodeCountries = [
    { code: 'CN', name: locale === 'zh' ? '中国' : 'China', digits: 10 },
    { code: 'US', name: locale === 'zh' ? '美国' : 'USA', digits: 10 },
    { code: 'EU', name: locale === 'zh' ? '欧盟' : 'EU', digits: 8 },
    { code: 'JP', name: locale === 'zh' ? '日本' : 'Japan', digits: 9 },
    { code: 'KR', name: locale === 'zh' ? '韩国' : 'Korea', digits: 10 },
  ];
  
  const [showHsExtensions, setShowHsExtensions] = useState(false);
  const [synonymInput, setSynonymInput] = useState('');
  
  // 单个产品同步 PubChem 状态
  const [syncingSingle, setSyncingSingle] = useState(false);
  
  // 防抖搜索定时器
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  // 用于触发搜索的状态
  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    fetchSPUList();
  }, [pagination.page, statusFilter, searchTrigger]);
  
  // 实时搜索 - 防抖处理
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      // 重置到第一页并触发搜索
      setPagination(prev => ({ ...prev, page: 1 }));
      setSearchTrigger(prev => prev + 1);
    }, 300);
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);
  
  // 当编辑面板打开时，调整所有 textarea 高度
  useEffect(() => {
    if (viewMode === 'edit') {
      // 延迟执行，确保 DOM 已渲染
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach((textarea) => {
          textarea.style.height = 'auto';
          textarea.style.height = textarea.scrollHeight + 'px';
        });
      }, 0);
    }
  }, [viewMode, formData]); // 依赖 formData 变化

  const fetchSPUList = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const response = await fetch(`/api/admin/spu?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setSpuList(data.data);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Fetch SPU list error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // 清除防抖定时器，立即触发搜索
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchTrigger(prev => prev + 1);
  };

  const openEditModal = async (spu: SPUItem) => {
    setEditingSpu(spu);
    
    // 根据当前语言从 translations 字段读取对应内容
    const allLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    const currentLang = allLanguages.includes(locale) ? locale : 'en';
    
    // 优先使用翻译后的内容，如果没有则使用原始数据
    const translatedName = spu.translations?.name?.[currentLang] || spu.name;
    const translatedDescription = spu.translations?.description?.[currentLang] || spu.description || '';
    const translatedApplications = spu.translations?.applications?.[currentLang] || spu.applications || [];
    
    // 物理性质翻译
    const translatedPhysicalDescription = spu.translations?.physicalDescription?.[currentLang] || spu.physical_description || '';
    const translatedBoilingPoint = spu.translations?.boilingPoint?.[currentLang] || spu.boiling_point || '';
    const translatedMeltingPoint = spu.translations?.meltingPoint?.[currentLang] || spu.melting_point || '';
    const translatedFlashPoint = spu.translations?.flashPoint?.[currentLang] || spu.flash_point || '';
    const translatedSolubility = spu.translations?.solubility?.[currentLang] || spu.solubility || '';
    const translatedVaporPressure = spu.translations?.vaporPressure?.[currentLang] || spu.vapor_pressure || '';
    const translatedRefractiveIndex = spu.translations?.refractiveIndex?.[currentLang] || spu.refractive_index || '';
    // 安全信息翻译
    const translatedHazardClasses = spu.translations?.hazardClasses?.[currentLang] || spu.hazard_classes || '';
    const translatedHealthHazards = spu.translations?.healthHazards?.[currentLang] || spu.health_hazards || '';
    const translatedGhsClassification = spu.translations?.ghsClassification?.[currentLang] || spu.ghs_classification || '';
    const translatedFirstAid = spu.translations?.firstAid?.[currentLang] || spu.first_aid || '';
    const translatedStorageConditions = spu.translations?.storageConditions?.[currentLang] || spu.storage_conditions || '';
    const translatedIncompatibleMaterials = spu.translations?.incompatibleMaterials?.[currentLang] || spu.incompatible_materials || '';
    
    setFormData({
      cas: spu.cas,
      name: translatedName,
      nameEn: spu.name_en || '',
      formula: spu.formula || '',
      molecularWeight: spu.molecular_weight || '',
      exactMass: spu.exact_mass || '',
      description: translatedDescription,
      synonyms: spu.synonyms || [],
      applications: translatedApplications,
      hsCode: spu.hs_code || '',
      hsCodeExtensions: spu.hs_code_extensions || {},
      status: spu.status,
      // PubChem 化学信息
      smiles: spu.smiles || '',
      smilesCanonical: spu.smiles_canonical || '',
      smilesIsomeric: spu.smiles_isomeric || '',
      inchi: spu.inchi || '',
      inchiKey: spu.inchi_key || '',
      // 计算属性
      xlogp: spu.xlogp || '',
      tpsa: spu.tpsa || '',
      complexity: spu.complexity?.toString() || '',
      hBondDonorCount: spu.h_bond_donor_count?.toString() || '',
      hBondAcceptorCount: spu.h_bond_acceptor_count?.toString() || '',
      rotatableBondCount: spu.rotatable_bond_count?.toString() || '',
      heavyAtomCount: spu.heavy_atom_count?.toString() || '',
      formalCharge: spu.formal_charge?.toString() || '',
      // 物理化学性质
      physicalDescription: translatedPhysicalDescription,
      colorForm: spu.color_form || '',
      odor: spu.odor || '',
      boilingPoint: translatedBoilingPoint,
      meltingPoint: translatedMeltingPoint,
      flashPoint: translatedFlashPoint,
      density: spu.density || '',
      solubility: translatedSolubility,
      vaporPressure: translatedVaporPressure,
      refractiveIndex: translatedRefractiveIndex,
      // 安全与毒性
      hazardClasses: translatedHazardClasses,
      healthHazards: translatedHealthHazards,
      ghsClassification: translatedGhsClassification,
      toxicitySummary: spu.toxicity_summary || '',
      carcinogenicity: spu.carcinogenicity || '',
      firstAid: translatedFirstAid,
      storageConditions: translatedStorageConditions,
      incompatibleMaterials: translatedIncompatibleMaterials,
    });
    // 保存原始数据用于比较变化
    setOriginalFormData({
      cas: spu.cas,
      name: translatedName,
      nameEn: spu.name_en || '',
      formula: spu.formula || '',
      molecularWeight: spu.molecular_weight || '',
      exactMass: spu.exact_mass || '',
      description: translatedDescription,
      synonyms: spu.synonyms || [],
      applications: translatedApplications,
      hsCode: spu.hs_code || '',
      hsCodeExtensions: spu.hs_code_extensions || {},
      status: spu.status,
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
      physicalDescription: translatedPhysicalDescription,
      colorForm: spu.color_form || '',
      odor: spu.odor || '',
      boilingPoint: translatedBoilingPoint,
      meltingPoint: translatedMeltingPoint,
      flashPoint: translatedFlashPoint,
      density: spu.density || '',
      solubility: translatedSolubility,
      vaporPressure: translatedVaporPressure,
      refractiveIndex: translatedRefractiveIndex,
      hazardClasses: translatedHazardClasses,
      healthHazards: translatedHealthHazards,
      ghsClassification: translatedGhsClassification,
      toxicitySummary: spu.toxicity_summary || '',
      carcinogenicity: spu.carcinogenicity || '',
      firstAid: translatedFirstAid,
      storageConditions: translatedStorageConditions,
      incompatibleMaterials: translatedIncompatibleMaterials,
    });
    setPubchemInfo({
      cid: spu.pubchem_cid,
      syncedAt: spu.pubchem_synced_at,
    });
    // 保存原始 translations 对象（所有语言的翻译数据）
    setOriginalTranslations(spu.translations || {});
    
    // 设置图片 URL - 优先使用存储的结构图
    if (spu.structure_image_key) {
      // 有存储的结构图，获取签名 URL
      const token = localStorage.getItem('admin_token');
      fetch(`/api/admin/spu/image-url?key=${encodeURIComponent(spu.structure_image_key)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            setStructureImageUrl(data.url);
          } else {
            // 获取失败，使用原始 URL
            setStructureImageUrl(spu.structure_url || null);
          }
        })
        .catch(err => {
          console.error('Failed to get structure image URL:', err);
          setStructureImageUrl(spu.structure_url || null);
        });
    } else {
      // 没有存储的结构图，使用原始 URL
      setStructureImageUrl(spu.structure_url || null);
    }
    
    // 如果有产品图，获取签名 URL
    if (spu.product_image_key) {
      const token = localStorage.getItem('admin_token');
      fetch(`/api/admin/spu/image-url?key=${encodeURIComponent(spu.product_image_key)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.url) {
            setProductImageUrl(data.url);
          }
        })
        .catch(err => console.error('Failed to get product image URL:', err));
    } else {
      setProductImageUrl(null);
    }
    
    setShowHsExtensions(Object.keys(spu.hs_code_extensions || {}).length > 0);
    setSynonymInput('');
    // 重置所有状态
    setJustSynced(false);
    setSyncedFields(new Set());
    setPreSyncFormData(null);
    setPreSyncSpu(null);
    setSyncingSingle(false);
    setTranslating(false);
    setTranslatingFields(new Set());
    setPendingTranslations(null);
    setTranslationProgress({ current: 0, total: 0, currentLang: '', currentField: '', status: 'idle' });
    setViewMode('edit');
    // 注意：不再自动翻译，用户需要手动点击"翻译并保存"按钮触发翻译
  };

  // 生成产品图
  const handleGenerateProductImage = async (force: boolean = false) => {
    if (!editingSpu?.id) {
      showNotification(locale === 'zh' ? '错误' : 'Error', 'SPU ID is required', 'error');
      return;
    }
    
    setGeneratingImage(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await fetch('/api/admin/products/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          spuId: editingSpu.id,
          cas: editingSpu.cas,
          name: editingSpu.name,
          force,
        }),
      });

      const data = await response.json();
      if (data.success) {
        // 如果是重绘（force=true）且已有图片，显示对比弹窗
        if (force && productImageUrl && data.imageUrl !== productImageUrl) {
          setNewProductImageUrl(data.imageUrl);
          setShowImageCompareModal(true);
        } else {
          // 否则直接更新图片
          setProductImageUrl(data.imageUrl);
          showNotification(
            locale === 'zh' ? '生成成功' : 'Success',
            data.isNew 
              ? (locale === 'zh' ? '产品图已生成' : 'Product image generated')
              : (locale === 'zh' ? '使用已有图片' : 'Using existing image'),
            'success'
          );
        }
      } else {
        showNotification(locale === 'zh' ? '生成失败' : 'Error', data.error || 'Failed to generate image', 'error');
      }
    } catch (error) {
      console.error('Generate product image error:', error);
      showNotification(locale === 'zh' ? '生成失败' : 'Error', 'Failed to generate image', 'error');
    } finally {
      setGeneratingImage(false);
    }
  };
  
  // 选择使用新图片
  const handleUseNewImage = () => {
    if (newProductImageUrl) {
      setProductImageUrl(newProductImageUrl);
      setNewProductImageUrl(null);
      setShowImageCompareModal(false);
      showNotification(
        locale === 'zh' ? '已更换' : 'Changed',
        locale === 'zh' ? '已使用新图片' : 'New image applied',
        'success'
      );
    }
  };
  
  // 保留原图
  const handleKeepOldImage = () => {
    setNewProductImageUrl(null);
    setShowImageCompareModal(false);
  };

  // 关闭编辑弹窗
  const handleCloseEditModal = () => {
    // 如果刚同步了数据但没保存，恢复原始数据
    if (justSynced && preSyncFormData && preSyncSpu) {
      setFormData(preSyncFormData);
      setEditingSpu(preSyncSpu);
      setPubchemInfo({
        cid: preSyncSpu.pubchem_cid,
        syncedAt: preSyncSpu.pubchem_synced_at,
      });
    }
    // 终止所有进行中的任务
    setSyncingSingle(false);
    setTranslating(false);
    setTranslatingFields(new Set());
    // 重置所有状态
    setJustSynced(false);
    setSyncedFields(new Set());
    setPreSyncFormData(null);
    setPreSyncSpu(null);
    setPendingTranslations(null);
    setTranslationProgress({ current: 0, total: 0, currentLang: '', currentField: '', status: 'idle' });
    setViewMode('list');
    setEditingSpu(null); // 返回列表时清空编辑中的SPU
  };

  // 同步单个产品的 PubChem 数据
  const handleSyncSinglePubChem = async () => {
    if (!editingSpu?.cas) {
      showNotification(locale === 'zh' ? '错误' : 'Error', 'CAS number is required', 'error');
      return;
    }
    
    // 保存同步前的数据，用于取消时恢复
    setPreSyncFormData({ ...formData });
    setPreSyncSpu(editingSpu);
    
    setSyncingSingle(true);
    setSyncProgress({ 
      step: 'connecting', 
      message: locale === 'zh' ? '正在连接 PubChem...' : 'Connecting to PubChem...' 
    });
    
    try {
      const token = localStorage.getItem('admin_token');
      
      // 步骤1：真实检测 PubChem 连接
      const connectionResponse = await fetch('/api/admin/spu/check-pubchem-connection');
      const connectionData = await connectionResponse.json();
      
      if (!connectionData.connected) {
        // 连接失败，显示错误
        setSyncingSingle(false);
        setSyncProgress({ step: 'connecting', message: '' });
        alert(locale === 'zh' 
          ? `PubChem 连接失败: ${connectionData.message}` 
          : `PubChem connection failed: ${connectionData.message}`);
        return;
      }
      
      // 连接成功，进入获取数据步骤
      setSyncProgress({ 
        step: 'fetching', 
        message: locale === 'zh' ? `正在获取 ${editingSpu.cas} 数据...` : `Fetching data for ${editingSpu.cas}...` 
      });
      
      const response = await fetch('/api/admin/spu/sync-pubchem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          casList: [editingSpu.cas],
          forceUpdate: true 
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSyncProgress({ 
          step: 'parsing', 
          message: locale === 'zh' ? '正在解析数据...' : 'Parsing data...' 
        });
        
        // 重新获取产品信息
        const spuResponse = await fetch(`/api/admin/spu?id=${editingSpu.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const spuData = await spuResponse.json();
        
        if (spuData.success && spuData.data) {
          const spu = spuData.data;
          
          setSyncProgress({ 
            step: 'updating', 
            message: locale === 'zh' ? '正在更新表单...' : 'Updating form...' 
          });
          // 更新表单数据（直接使用 PubChem 英文数据，让用户看到更新内容）
          
          setFormData(prev => ({
            ...prev,
            name: spu.name || prev.name, // 使用英文名称
            nameEn: spu.name_en || prev.nameEn,
            formula: spu.formula || prev.formula,
            molecularWeight: spu.molecular_weight || prev.molecularWeight,
            exactMass: spu.exact_mass || prev.exactMass,
            description: spu.description || prev.description, // 使用英文描述
            applications: spu.applications || prev.applications,
            synonyms: spu.synonyms || prev.synonyms,
            // PubChem 化学信息
            smiles: spu.smiles || prev.smiles,
            smilesCanonical: spu.smiles_canonical || prev.smilesCanonical,
            smilesIsomeric: spu.smiles_isomeric || prev.smilesIsomeric,
            inchi: spu.inchi || prev.inchi,
            inchiKey: spu.inchi_key || prev.inchiKey,
            // 计算属性
            xlogp: spu.xlogp || prev.xlogp,
            tpsa: spu.tpsa || prev.tpsa,
            complexity: spu.complexity?.toString() || prev.complexity,
            hBondDonorCount: spu.h_bond_donor_count?.toString() || prev.hBondDonorCount,
            hBondAcceptorCount: spu.h_bond_acceptor_count?.toString() || prev.hBondAcceptorCount,
            rotatableBondCount: spu.rotatable_bond_count?.toString() || prev.rotatableBondCount,
            heavyAtomCount: spu.heavy_atom_count?.toString() || prev.heavyAtomCount,
            formalCharge: spu.formal_charge?.toString() || prev.formalCharge,
            // 物理化学性质 - 直接使用 PubChem 英文数据
            physicalDescription: spu.physical_description || prev.physicalDescription,
            colorForm: spu.color_form || prev.colorForm,
            odor: spu.odor || prev.odor,
            boilingPoint: spu.boiling_point || prev.boilingPoint,
            meltingPoint: spu.melting_point || prev.meltingPoint,
            flashPoint: spu.flash_point || prev.flashPoint,
            density: spu.density || prev.density,
            solubility: spu.solubility || prev.solubility,
            vaporPressure: spu.vapor_pressure || prev.vaporPressure,
            refractiveIndex: spu.refractive_index || prev.refractiveIndex,
            // 安全与毒性 - 直接使用 PubChem 英文数据
            hazardClasses: spu.hazard_classes || prev.hazardClasses,
            healthHazards: spu.health_hazards || prev.healthHazards,
            ghsClassification: spu.ghs_classification || prev.ghsClassification,
            toxicitySummary: spu.toxicity_summary || prev.toxicitySummary,
            carcinogenicity: spu.carcinogenicity || prev.carcinogenicity,
            firstAid: spu.first_aid || prev.firstAid,
            storageConditions: spu.storage_conditions || prev.storageConditions,
            incompatibleMaterials: spu.incompatible_materials || prev.incompatibleMaterials,
          }));
          // 更新 PubChem 信息
          setPubchemInfo({
            cid: spu.pubchem_cid,
            syncedAt: spu.pubchem_synced_at,
          });
          // 更新 2D 结构图 URL - 优先使用存储的结构图
          if (spu.structure_image_key) {
            fetch(`/api/admin/spu/image-url?key=${encodeURIComponent(spu.structure_image_key)}`, {
              headers: { Authorization: `Bearer ${token}` },
            })
              .then(res => res.json())
              .then(data => {
                if (data.success && data.url) {
                  setStructureImageUrl(data.url);
                } else {
                  setStructureImageUrl(spu.structure_url || null);
                }
              })
              .catch(() => setStructureImageUrl(spu.structure_url || null));
          } else {
            setStructureImageUrl(spu.structure_url || null);
          }
          
          // 更新原始数据
          setEditingSpu(spu);
          
          // 检测需要翻译的字段（同步后所有有值的字段都需要翻译）
          const translatableFields = [
            { key: 'description', value: spu.description },
            { key: 'physicalDescription', value: spu.physical_description },
            { key: 'colorForm', value: spu.color_form },
            { key: 'odor', value: spu.odor },
            { key: 'density', value: spu.density },
            { key: 'boilingPoint', value: spu.boiling_point },
            { key: 'meltingPoint', value: spu.melting_point },
            { key: 'flashPoint', value: spu.flash_point },
            { key: 'hazardClasses', value: spu.hazard_classes },
            { key: 'healthHazards', value: spu.health_hazards },
            { key: 'ghsClassification', value: spu.ghs_classification },
            { key: 'firstAid', value: spu.first_aid },
            { key: 'storageConditions', value: spu.storage_conditions },
            { key: 'incompatibleMaterials', value: spu.incompatible_materials },
            { key: 'solubility', value: spu.solubility },
            { key: 'vaporPressure', value: spu.vapor_pressure },
            { key: 'refractiveIndex', value: spu.refractive_index },
          ];
          
          const fieldsToTranslate = translatableFields
            .filter(({ value }) => value) // 只要有值就需要翻译
            .map(({ key }) => key);
          
          // 标记为刚同步完成，记录需要翻译的字段
          if (fieldsToTranslate.length > 0) {
            setJustSynced(true);
            setSyncedFields(new Set(fieldsToTranslate));
            setPendingTranslations(spu.translations || {});
            // 使用确认弹窗，用户点击确认后才关闭遮罩层
            showConfirm(
              t('spu.syncSuccess'),
              locale === 'zh' 
                ? `PubChem 数据已同步，${fieldsToTranslate.length} 个字段需要翻译，点击"翻译并保存"按钮开始翻译` 
                : `PubChem data synced, ${fieldsToTranslate.length} fields need translation. Click "Translate & Save" to start`,
              () => {
                // 用户确认后关闭遮罩层
                setSyncingSingle(false);
              },
              'success'
            );
          } else {
            showConfirm(
              t('spu.syncSuccess'),
              t('spu.syncSuccessNoTranslation'),
              () => {
                setSyncingSingle(false);
              },
              'success'
            );
          }
        } else {
          showConfirm(
            t('spu.syncError'), 
            data.error || 'Sync failed',
            () => {
              setSyncingSingle(false);
            },
            'error'
          );
        }
      } else {
        showConfirm(
          locale === 'zh' ? '同步失败' : 'Sync Error', 
          data.error || 'Sync failed',
          () => {
            setSyncingSingle(false);
          },
          'error'
        );
      }
    } catch (error) {
      console.error('Sync PubChem error:', error);
      showConfirm(
        locale === 'zh' ? '同步失败' : 'Sync Error', 
        'Sync failed',
        () => {
          setSyncingSingle(false);
        },
        'error'
      );
    }
    // 移除 finally，改为在用户确认后关闭遮罩层
  };

  /**
   * 检测字段是否需要翻译
   * 条件：字段有值 且 (新建产品 或 字段被修改 或 翻译缺失 或 翻译值等于原文)
   */
  const checkFieldNeedsTranslation = (
    fieldName: string, 
    value: string | undefined,
    isEditing: boolean,
    changedFields: Record<string, boolean>,
    existingTranslations: Record<string, any>,
    allLanguages: string[]
  ): boolean => {
    if (!value) return false;
    if (!isEditing) return true; // 新建产品
    if (changedFields[fieldName]) return true; // 字段被修改
    
    const fieldTranslations = existingTranslations[fieldName];
    if (!fieldTranslations) return true; // 没有翻译记录
    
    // 检查是否所有语言都有翻译
    const hasAllTranslations = allLanguages.every(lang => fieldTranslations[lang]);
    if (!hasAllTranslations) return true;
    
    // 检查是否有语言的翻译值等于表单值（说明该语言没有正确翻译）
    const hasUntranslated = allLanguages.some(lang => fieldTranslations[lang] === value);
    if (hasUntranslated) return true;
    
    return false;
  };

  // 字段名友好显示映射
  const fieldDisplayNames: Record<string, string> = {
    name: locale === 'zh' ? '产品名称' : 'Product Name',
    description: locale === 'zh' ? '产品描述' : 'Description',
    boilingPoint: locale === 'zh' ? '沸点' : 'Boiling Point',
    meltingPoint: locale === 'zh' ? '熔点' : 'Melting Point',
    flashPoint: locale === 'zh' ? '闪点' : 'Flash Point',
    hazardClasses: locale === 'zh' ? '危险分类' : 'Hazard Classes',
    healthHazards: locale === 'zh' ? '健康危害' : 'Health Hazards',
    ghsClassification: locale === 'zh' ? 'GHS分类' : 'GHS Classification',
    firstAid: locale === 'zh' ? '急救措施' : 'First Aid',
    storageConditions: locale === 'zh' ? '储存条件' : 'Storage Conditions',
    incompatibleMaterials: locale === 'zh' ? '不相容物质' : 'Incompatible Materials',
    solubility: locale === 'zh' ? '溶解性' : 'Solubility',
    vaporPressure: locale === 'zh' ? '蒸气压' : 'Vapor Pressure',
    refractiveIndex: locale === 'zh' ? '折射率' : 'Refractive Index',
    physicalDescription: locale === 'zh' ? '物理描述' : 'Physical Description',
    colorForm: locale === 'zh' ? '颜色形态' : 'Color/Form',
    odor: locale === 'zh' ? '气味' : 'Odor',
    density: locale === 'zh' ? '密度' : 'Density',
  };

  /**
   * 启动后台翻译（串行执行以正确显示进度）
   * 使用批量翻译API，一次请求翻译到多个语言
   */
  const startBackgroundTranslation = async (
    fieldsToTranslate: { fieldName: string; value: string }[],
    currentLang: string,
    targetLanguages: string[],
    existingTranslations: Record<string, any>,
    token: string | null
  ) => {
    if (fieldsToTranslate.length === 0) return existingTranslations;
    
    const allLanguages = [currentLang, ...targetLanguages];
    const translations = { ...existingTranslations };
    
    setTranslating(true);
    setTranslationProgress({
      current: 0,
      total: fieldsToTranslate.length,
      currentLang: currentLang,
      currentField: '',
      status: 'translating'
    });
    
    // 串行翻译每个字段，以正确显示进度
    for (let i = 0; i < fieldsToTranslate.length; i++) {
      const { fieldName, value } = fieldsToTranslate[i];
      
      setTranslatingFields(prev => new Set([...prev, fieldName]));
      
      // 更新当前正在翻译的字段（使用友好名称）
      setTranslationProgress(prev => ({ 
        ...prev, 
        current: i,
        currentField: fieldDisplayNames[fieldName] || fieldName 
      }));
      
      try {
        // 使用批量翻译API，一次请求翻译到所有语言
        const res = await fetch('/api/ai/translate', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ 
            text: value, 
            targetLanguages: allLanguages 
          }),
        });
        const data = await res.json();
        
        if (data.translations) {
          // 更新翻译结果
          translations[fieldName] = data.translations;
          
          // 更新当前语言的表单显示
          const currentLangTranslation = data.translations[currentLang];
          if (currentLangTranslation) {
            if (fieldName === 'name') {
              setFormData(prev => ({ ...prev, name: currentLangTranslation }));
            } else if (fieldName === 'description') {
              setFormData(prev => ({ ...prev, description: currentLangTranslation }));
            } else if (fieldName === 'boilingPoint') {
              setFormData(prev => ({ ...prev, boilingPoint: currentLangTranslation }));
            } else if (fieldName === 'meltingPoint') {
              setFormData(prev => ({ ...prev, meltingPoint: currentLangTranslation }));
            } else if (fieldName === 'flashPoint') {
              setFormData(prev => ({ ...prev, flashPoint: currentLangTranslation }));
            } else if (fieldName === 'hazardClasses') {
              setFormData(prev => ({ ...prev, hazardClasses: currentLangTranslation }));
            } else if (fieldName === 'healthHazards') {
              setFormData(prev => ({ ...prev, healthHazards: currentLangTranslation }));
            } else if (fieldName === 'ghsClassification') {
              setFormData(prev => ({ ...prev, ghsClassification: currentLangTranslation }));
            } else if (fieldName === 'firstAid') {
              setFormData(prev => ({ ...prev, firstAid: currentLangTranslation }));
            } else if (fieldName === 'storageConditions') {
              setFormData(prev => ({ ...prev, storageConditions: currentLangTranslation }));
            } else if (fieldName === 'incompatibleMaterials') {
              setFormData(prev => ({ ...prev, incompatibleMaterials: currentLangTranslation }));
            } else if (fieldName === 'solubility') {
              setFormData(prev => ({ ...prev, solubility: currentLangTranslation }));
            } else if (fieldName === 'vaporPressure') {
              setFormData(prev => ({ ...prev, vaporPressure: currentLangTranslation }));
            } else if (fieldName === 'refractiveIndex') {
              setFormData(prev => ({ ...prev, refractiveIndex: currentLangTranslation }));
            } else if (fieldName === 'physicalDescription') {
              setFormData(prev => ({ ...prev, physicalDescription: currentLangTranslation }));
            } else if (fieldName === 'colorForm') {
              setFormData(prev => ({ ...prev, colorForm: currentLangTranslation }));
            } else if (fieldName === 'odor') {
              setFormData(prev => ({ ...prev, odor: currentLangTranslation }));
            } else if (fieldName === 'density') {
              setFormData(prev => ({ ...prev, density: currentLangTranslation }));
            }
          }
        }
        
        // 更新完成进度
        setTranslationProgress(prev => ({ 
          ...prev, 
          current: i + 1
        }));
        
      } catch (e) {
        console.error(`Translation error for ${fieldName}:`, e);
      } finally {
        setTranslatingFields(prev => {
          const newSet = new Set(prev);
          newSet.delete(fieldName);
          return newSet;
        });
      }
    }
    
    // 更新临时翻译存储
    setPendingTranslations({ ...translations });
    // 不关闭遮罩，等待弹窗确认
    setTranslationProgress(prev => ({ ...prev, status: 'completed' }));
    
    return translations;
  };

  const handleSave = async () => {
    if (!formData.cas || !formData.name) {
      showNotification(locale === 'zh' ? '错误' : 'Error', !formData.cas ? t('spu.casRequired') : t('spu.nameRequired'), 'error');
      return;
    }

    // 当前系统语言
    const allLanguages = ['en', 'zh', 'ja', 'ko', 'es', 'fr', 'de', 'ru', 'pt', 'ar'];
    const currentLang = allLanguages.includes(locale) ? locale : 'en';
    const targetLanguages = allLanguages.filter(l => l !== currentLang);
    const token = localStorage.getItem('admin_token');

    // 可翻译字段列表
    const translatableFields = [
      'name', 'description', 'physicalDescription', 'boilingPoint', 'meltingPoint', 'flashPoint',
      'hazardClasses', 'healthHazards', 'ghsClassification', 'firstAid',
      'storageConditions', 'incompatibleMaterials', 'solubility', 'vaporPressure', 'refractiveIndex'
    ];

    // 检测哪些字段被修改了（与打开弹窗时的数据比较）
    const isEditing = !!editingSpu;
    const changedFields: string[] = [];
    
    if (isEditing && originalFormData) {
      // 编辑模式：检测修改的字段
      for (const field of translatableFields) {
        const currentValue = formData[field as keyof typeof formData];
        const originalValue = originalFormData[field as keyof typeof originalFormData];
        // 对于数组类型（如 applications），需要特殊处理
        if (field === 'applications') {
          if (JSON.stringify(currentValue) !== JSON.stringify(originalValue)) {
            changedFields.push(field);
          }
        } else if (currentValue !== originalValue) {
          changedFields.push(field);
        }
      }
    } else if (!isEditing) {
      // 新建模式：所有有值的字段都需要翻译
      for (const field of translatableFields) {
        const value = formData[field as keyof typeof formData];
        if (value && typeof value === 'string' && value.trim() && value !== '-') {
          changedFields.push(field);
        }
      }
    }

    // 阶段1: 如果刚同步完成，翻译同步的字段
    if (justSynced && syncedFields.size > 0) {
      const fieldsToTranslate: { fieldName: string; value: string }[] = [];
      for (const fieldName of syncedFields) {
        const value = formData[fieldName as keyof typeof formData] as string | undefined;
        if (value) {
          fieldsToTranslate.push({ fieldName, value });
        }
      }

      if (fieldsToTranslate.length > 0) {
        setTranslating(true);
        setTranslationProgress({
          current: 0,
          total: fieldsToTranslate.length,
          currentLang: currentLang,
          currentField: '',
          status: 'translating'
        });

        await new Promise(resolve => setTimeout(resolve, 100));

        const existingTranslations = originalTranslations || {};
        const updatedTranslations = await startBackgroundTranslation(
          fieldsToTranslate,
          currentLang,
          targetLanguages,
          existingTranslations,
          token
        );

        // 先保存 syncedFields 的副本，因为后面会清空
        const syncedFieldsCopy = new Set(syncedFields);
        
        setJustSynced(false);
        setSyncedFields(new Set());
        
        // 从翻译结果中获取当前语言的值，更新 originalFormData
        // 因为 startBackgroundTranslation 内部 setFormData 是异步的，此时 formData 可能还没更新
        const updatedFormData = { ...formData };
        for (const fieldName of syncedFieldsCopy) {
          const translation = updatedTranslations[fieldName]?.[currentLang];
          if (translation) {
            (updatedFormData as any)[fieldName] = translation;
          }
        }
        setOriginalFormData(updatedFormData);
        setOriginalTranslations(JSON.parse(JSON.stringify(updatedTranslations)));

        showConfirm(
          t('spu.translationCompleted'),
          locale === 'zh'
            ? `${fieldsToTranslate.length} ${t('spu.fields')}${t('spu.translationCompleteReview')}`
            : `${fieldsToTranslate.length} ${t('spu.fields')} translated. ${t('spu.translationCompleteReview')}`,
          () => { setTranslating(false); },
          'success'
        );
        return;
      }
    }

    // 阶段2: 保存到数据库
    setSaving(true);

    try {
      // 从原始 translations 开始，保留其他语言的翻译
      const translations: Record<string, Record<string, string>> = originalTranslations ? JSON.parse(JSON.stringify(originalTranslations)) : {};

      // 如果有字段被修改，需要翻译到所有其他语言
      if (changedFields.length > 0) {
        setTranslating(true);
        setTranslationProgress({
          current: 0,
          total: changedFields.length,
          currentLang: currentLang,
          currentField: '',
          status: 'translating'
        });

        await new Promise(resolve => setTimeout(resolve, 0));

        const fieldsToTranslate: { fieldName: string; value: string }[] = [];
        for (const fieldName of changedFields) {
          const value = formData[fieldName as keyof typeof formData] as string | undefined;
          if (value) {
            fieldsToTranslate.push({ fieldName, value });
            // 更新当前语言的值
            if (!translations[fieldName]) translations[fieldName] = {};
            translations[fieldName][currentLang] = value;
          }
        }

        if (fieldsToTranslate.length > 0) {
          const updatedTranslations = await startBackgroundTranslation(
            fieldsToTranslate,
            currentLang,
            targetLanguages,
            translations,
            token
          );
          // 使用返回的翻译结果更新 translations 对象
          Object.assign(translations, updatedTranslations);
        }

        setTranslating(false);
        
        // 从翻译结果中获取当前语言的值，更新 originalFormData
        // 因为 startBackgroundTranslation 内部 setFormData 是异步的，此时 formData 可能还没更新
        const updatedFormData = { ...formData };
        for (const fieldName of changedFields) {
          const translation = translations[fieldName]?.[currentLang];
          if (translation) {
            (updatedFormData as any)[fieldName] = translation;
          }
        }
        setOriginalFormData(updatedFormData);
        setOriginalTranslations(JSON.parse(JSON.stringify(translations)));
      }

      // 准备保存的数据
      const url = isEditing ? `/api/admin/spu?id=${editingSpu.id}` : '/api/admin/spu';
      const method = isEditing ? 'PUT' : 'POST';

      const body = {
        ...(isEditing && { id: editingSpu.id }),
        cas: formData.cas,
        name: formData.name,
        nameEn: formData.nameEn,
        formula: formData.formula,
        molecularWeight: formData.molecularWeight,
        exactMass: formData.exactMass,
        description: formData.description,
        synonyms: formData.synonyms,
        applications: formData.applications,
        hsCode: formData.hsCode,
        hsCodeExtensions: formData.hsCodeExtensions,
        status: formData.status,
        smiles: formData.smiles,
        smilesCanonical: formData.smilesCanonical,
        smilesIsomeric: formData.smilesIsomeric,
        inchi: formData.inchi,
        inchiKey: formData.inchiKey,
        xlogp: formData.xlogp,
        tpsa: formData.tpsa,
        complexity: formData.complexity ? parseInt(formData.complexity) : null,
        hBondDonorCount: formData.hBondDonorCount ? parseInt(formData.hBondDonorCount) : null,
        hBondAcceptorCount: formData.hBondAcceptorCount ? parseInt(formData.hBondAcceptorCount) : null,
        rotatableBondCount: formData.rotatableBondCount ? parseInt(formData.rotatableBondCount) : null,
        heavyAtomCount: formData.heavyAtomCount ? parseInt(formData.heavyAtomCount) : null,
        formalCharge: formData.formalCharge ? parseInt(formData.formalCharge) : null,
        physicalDescription: formData.physicalDescription,
        colorForm: formData.colorForm,
        odor: formData.odor,
        boilingPoint: formData.boilingPoint,
        meltingPoint: formData.meltingPoint,
        flashPoint: formData.flashPoint,
        density: formData.density,
        hazardClasses: formData.hazardClasses,
        healthHazards: formData.healthHazards,
        ghsClassification: formData.ghsClassification,
        toxicitySummary: formData.toxicitySummary,
        carcinogenicity: formData.carcinogenicity,
        firstAid: formData.firstAid,
        storageConditions: formData.storageConditions,
        incompatibleMaterials: formData.incompatibleMaterials,
        solubility: formData.solubility,
        vaporPressure: formData.vaporPressure,
        refractiveIndex: formData.refractiveIndex,
        translations,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (data.success) {
        setViewMode('list');
        setEditingSpu(null);
        setPendingTranslations(null);
        setTranslationProgress({ current: 0, total: 0, currentLang: '', currentField: '', status: 'idle' });
        setJustSynced(false);
        setSyncedFields(new Set());
        setPreSyncFormData(null);
        setPreSyncSpu(null);
        fetchSPUList();
        showNotification(locale === 'zh' ? '保存成功' : 'Success', editingSpu ? t('spu.updateSuccess') : t('spu.createSuccess'), 'success');
      } else {
        showNotification(locale === 'zh' ? '保存失败' : 'Error', data.error || 'Failed to save', 'error');
      }
    } catch (error) {
      console.error('Save SPU error:', error);
      showNotification(locale === 'zh' ? '保存失败' : 'Error', 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (spu: SPUItem) => {
    const confirmMsg = spu.sku_count && spu.sku_count > 0
      ? t('spu.deleteWithSku').replace('{count}', spu.sku_count.toString())
      : t('spu.deleteConfirm');
    
    showConfirm(
      locale === 'zh' ? '删除确认' : 'Delete SPU',
      confirmMsg,
      async () => {
        try {
          const token = localStorage.getItem('admin_token');
          const response = await fetch(`/api/admin/spu?id=${spu.id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          });

          const data = await response.json();
          if (data.success) {
            fetchSPUList();
            showNotification(locale === 'zh' ? '删除成功' : 'Success', locale === 'zh' ? 'SPU已删除' : 'SPU deleted', 'success');
          } else {
            showNotification(locale === 'zh' ? '删除失败' : 'Error', data.error || 'Failed to delete', 'error');
          }
        } catch (error) {
          console.error('Delete SPU error:', error);
          showNotification(locale === 'zh' ? '删除失败' : 'Error', 'Failed to delete', 'error');
        }
      }
    );
  };

  const handleToggleStatus = async (spu: SPUItem) => {
    const newStatus = spu.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmTitle = newStatus === 'INACTIVE' 
      ? (locale === 'zh' ? '下架确认' : 'Deactivate SPU')
      : (locale === 'zh' ? '上架确认' : 'Activate SPU');
    const confirmMsg = newStatus === 'INACTIVE' 
      ? (locale === 'zh' ? '确定要下架该SPU吗？' : 'Deactivate this SPU?')
      : (locale === 'zh' ? '确定要上架该SPU吗？' : 'Activate this SPU?');
    
    showConfirm(confirmTitle, confirmMsg, async () => {
      try {
        const token = localStorage.getItem('admin_token');
        const response = await fetch('/api/admin/spu', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: spu.id,
            status: newStatus,
          }),
        });

        const data = await response.json();
        if (data.success) {
          fetchSPUList();
          showNotification(
            locale === 'zh' ? '操作成功' : 'Success',
            newStatus === 'INACTIVE' 
              ? (locale === 'zh' ? 'SPU已下架' : 'SPU deactivated')
              : (locale === 'zh' ? 'SPU已上架' : 'SPU activated'),
            'success'
          );
        } else {
          showNotification(locale === 'zh' ? '操作失败' : 'Error', data.error || 'Failed to update status', 'error');
        }
      } catch (error) {
        console.error('Toggle status error:', error);
        showNotification(locale === 'zh' ? '操作失败' : 'Error', 'Failed to update status', 'error');
      }
    });
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white h-full ${viewMode === 'list' ? 'p-0' : ''}`}>
      {/* 列表视图 */}
      {viewMode === 'list' && (
        <div className="max-w-7xl mx-auto p-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Database className="w-6 h-6" />
              {t('spu.title')}
            </h1>
            <p className="text-slate-400 mt-1">{t('spu.subtitle')}</p>
          </div>
          <button
            onClick={() => {
              // 初始化新建表单
              setEditingSpu(null);
              setFormData({
                cas: '',
                name: '',
                nameEn: '',
                formula: '',
                description: '',
                status: 'ACTIVE',
                synonyms: [],
                applications: [],
                hsCode: '',
                hsCodeExtensions: {},
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
              });
              setPubchemInfo({ cid: undefined, syncedAt: undefined });
              setStructureImageUrl(null);
              setProductImageUrl(null);
              setOriginalFormData(null);
              setOriginalTranslations({});
              setPendingTranslations(null);
              setTranslationProgress({ current: 0, total: 0, currentLang: '', currentField: '', status: 'idle' });
              setJustSynced(false);
              setSyncedFields(new Set());
              setPreSyncFormData(null);
              setPreSyncSpu(null);
              setViewMode('edit');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('spu.newSpu')}
          </button>
        </div>

        {/* 标签页切换 */}
        <div className="mb-6">
          <div className="flex gap-1 bg-slate-800/50 rounded-lg p-1 border border-slate-700 w-fit">
            <button
              onClick={() => { setStatusFilter(''); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                statusFilter === '' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              {t('common.all')}
            </button>
            <button
              onClick={() => { setStatusFilter('ACTIVE'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'ACTIVE' 
                  ? 'bg-green-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {t('spu.active')}
            </button>
            <button
              onClick={() => { setStatusFilter('INACTIVE'); setPagination(prev => ({ ...prev, page: 1 })); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                statusFilter === 'INACTIVE' 
                  ? 'bg-slate-600 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <XCircle className="w-4 h-4" />
              {t('spu.inactive')}
            </button>
          </div>
        </div>

        {/* 操作栏 */}
        <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4 items-center">
              {/* 搜索 */}
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('spu.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="bg-slate-700 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>

          </div>
        </div>

        {/* SPU 列表 */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : spuList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Database className="w-12 h-12 mb-4" />
              <p>{t('spu.noData')}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">{t('spu.casNumber')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">{t('spu.name')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">{t('spu.hsCode')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">{t('spu.pubchem')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">{t('spu.skuCount')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">{t('spu.status')}</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {spuList.map((spu) => (
                  <tr key={spu.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm">{spu.cas}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        {/* 显示当前语言的名称（使用辅助函数确保正确回退） */}
                        <div className="font-medium">
                          {getDisplayName(spu, locale)}
                        </div>
                        {/* 如果当前语言不是英文，显示英文名称 */}
                        {locale !== 'en' && (
                          <div className="text-sm text-slate-400">
                            {getEnglishName(spu)}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {spu.hs_code ? (
                        <span className="font-mono text-sm">{spu.hs_code}</span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {spu.pubchem_cid ? (
                        <a
                          href={`https://pubchem.ncbi.nlm.nih.gov/compound/${spu.pubchem_cid}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          {spu.pubchem_cid}
                        </a>
                      ) : (
                        <span className="text-slate-500">{t('spu.pubchemNotSynced')}</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm ${spu.sku_count && spu.sku_count > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                        {spu.sku_count || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${statusConfig[spu.status]?.bgColor} ${statusConfig[spu.status]?.color}`}>
                        {statusConfig[spu.status]?.label || spu.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* 上架/下架按钮 */}
                        <button
                          onClick={() => handleToggleStatus(spu)}
                          className={`p-1.5 rounded transition-colors ${
                            spu.status === 'ACTIVE' 
                              ? 'hover:bg-orange-600/20' 
                              : 'hover:bg-green-600/20'
                          }`}
                          title={spu.status === 'ACTIVE' ? t('spu.deactivate') : t('spu.activate')}
                        >
                          {spu.status === 'ACTIVE' ? (
                            <ArrowDownCircle className="w-4 h-4 text-orange-400 hover:text-orange-300" />
                          ) : (
                            <ArrowUpCircle className="w-4 h-4 text-green-400 hover:text-green-300" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditModal(spu)}
                          className="p-1.5 hover:bg-slate-600 rounded transition-colors"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4 text-slate-400 hover:text-white" />
                        </button>
                        <button
                          onClick={() => handleDelete(spu)}
                          className="p-1.5 hover:bg-red-600/20 rounded transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm text-slate-400">
              {t('spu.page', { current: pagination.page, total: pagination.totalPages })}
            </span>
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.totalPages}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
      )}

      {/* 编辑面板 - 主内容区域内 */}
      {viewMode === 'edit' && (
        <div className="fixed top-16 left-0 right-0 bottom-0 bg-slate-900 z-30 flex flex-col overflow-hidden lg:left-64">
          {/* 同步中遮罩层 - 覆盖整个面板 */}
          {syncingSingle && (
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-30 rounded-xl flex flex-col items-center justify-center">
              <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-purple-500/30 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400" />
                  </div>
                  <div className="text-center w-full">
                    <p className="text-lg font-medium text-white mb-3">
                      {t('spu.syncingPubchem')}
                    </p>
                    
                    {/* 进度步骤 */}
                    <div className="space-y-2 text-left">
                      {/* 连接步骤 */}
                      <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'connecting' ? 'text-purple-400' : 'text-green-400'}`}>
                        {syncProgress.step !== 'connecting' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        <span>{t('spu.connectingApi')}</span>
                      </div>
                      
                      {/* 获取数据步骤 */}
                      <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'fetching' ? 'text-purple-400' : ['parsing', 'updating'].includes(syncProgress.step) ? 'text-green-400' : 'text-slate-500'}`}>
                        {['parsing', 'updating'].includes(syncProgress.step) ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : syncProgress.step === 'fetching' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-500" />
                        )}
                        <span>{t('spu.fetchingData')}</span>
                      </div>
                      
                      {/* 解析数据步骤 */}
                      <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'parsing' ? 'text-purple-400' : syncProgress.step === 'updating' ? 'text-green-400' : 'text-slate-500'}`}>
                        {syncProgress.step === 'updating' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : syncProgress.step === 'parsing' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-500" />
                        )}
                        <span>{t('spu.parsingData')}</span>
                      </div>
                      
                      {/* 更新表单步骤 */}
                      <div className={`flex items-center gap-2 text-sm ${syncProgress.step === 'updating' ? 'text-purple-400' : 'text-slate-500'}`}>
                        {syncProgress.step === 'updating' ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-slate-500" />
                        )}
                        <span>{t('spu.updatingForm')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* 翻译中遮罩层 - 覆盖整个弹窗 */}
            {translating && (
              <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-30 rounded-xl flex flex-col items-center justify-center">
                <div className="bg-slate-800 rounded-xl p-6 shadow-xl border border-blue-500/30 flex flex-col items-center gap-4 max-w-sm mx-4 w-full">
                  <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
                  <div className="text-center w-full">
                    <p className="text-lg font-medium text-white mb-3">
                      {t('spu.translating')}
                    </p>
                    {translationProgress.status === 'translating' && (
                      <>
                        {/* 当前正在翻译的字段 */}
                        {translationProgress.currentField && (
                          <div className="mb-3 p-2 bg-slate-700/50 rounded-lg">
                            <p className="text-xs text-slate-400 mb-1">
                              {t('spu.currentField')}
                            </p>
                            <p className="text-sm text-blue-400 font-medium">
                              {translationProgress.currentField}
                            </p>
                          </div>
                        )}
                        
                        {/* 进度 */}
                        <p className="text-sm text-slate-400 mb-2">
                          {translationProgress.current} / {translationProgress.total} {t('spu.fields')}
                        </p>
                        
                        {/* 进度条 */}
                        <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(translationProgress.current / translationProgress.total) * 100}%` }}
                          />
                        </div>
                        
                        {/* 目标语言 */}
                        <p className="text-xs text-slate-500">
                          {t('spu.translatingTo')}
                        </p>
                      </>
                    )}
                    {translationProgress.status === 'completed' && (
                      <p className="text-sm text-green-400">
                        {t('spu.translationCompleted')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* 头部固定 - 两行布局 */}
            <div className="flex-shrink-0 bg-slate-800 border-b border-slate-700 px-5 py-3">
              {/* 第一行：导航 + 同步操作 */}
              <div className="flex items-center">
                {/* 左侧：返回按钮 + 同步按钮 */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCloseEditModal}
                    className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm">{t('common.backToList')}</span>
                  </button>
                  
                  <div className="w-px h-5 bg-slate-600" />
                  
                  <button
                    type="button"
                    onClick={handleSyncSinglePubChem}
                    disabled={syncingSingle || saving || translating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {syncingSingle ? (
                      <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-purple-400" />
                    )}
                    <span>{t('spu.syncPubchem')}</span>
                  </button>
                  
                  {pubchemInfo.syncedAt && (
                    <span className="text-xs text-slate-500">
                      {t('spu.lastSync')}: {new Date(pubchemInfo.syncedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              
              {/* 第二行：标题 + 翻译状态 + 保存按钮 */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700/50">
                {/* 左侧：标题 + CAS号 */}
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">
                    {editingSpu ? t('spu.editSpu') : t('spu.newSpu')}
                  </h2>
                  {editingSpu && (
                    <span className="text-sm text-slate-500 font-mono">
                      CAS: {editingSpu.cas}
                    </span>
                  )}
                </div>
                
                {/* 中间：翻译状态 */}
                <div className="flex-1 flex justify-center">
                  {translating && (
                    <span className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      {translationProgress.status === 'translating' ? (
                        `${t('spu.translating')}: ${translationProgress.current}/${translationProgress.total} (${translationProgress.currentLang})`
                      ) : (
                        `${t('spu.translating')}...`
                      )}
                    </span>
                  )}
                  {translationProgress.status === 'completed' && pendingTranslations && (
                    <span className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 px-3 py-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      {t('spu.newTranslationsReady')}
                    </span>
                  )}
                </div>
                
                {/* 右侧：保存按钮 */}
                <button
                  onClick={handleSave}
                  disabled={saving || translating || syncingSingle}
                  className={`flex items-center gap-2 px-4 py-2 rounded text-sm transition-colors disabled:opacity-50 ${
                    justSynced 
                      ? 'bg-amber-600 hover:bg-amber-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : translating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {justSynced ? t('spu.translateAndSave') : t('spu.saveAndExit')}
                  </span>
                </button>
              </div>
            </div>

            {/* 内容区域 - 翻译/同步时禁用滚动，添加最大宽度限制居中 */}
            <div className={`flex-1 relative scrollbar-thin ${translating || syncingSingle ? 'overflow-hidden' : 'overflow-y-auto'}`}>
              <div className="max-w-4xl mx-auto p-5">
              
              {/* 图片展示区域 */}
              {editingSpu && (
                <div className="mb-6 p-4 bg-slate-700/30 border border-slate-600 rounded-lg">
                  <div className="grid grid-cols-2 gap-6">
                    {/* PubChem 2D 结构图 */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-slate-400">
                          {t('spu.structure2D')}
                        </span>
                        {structureImageUrl && (
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
                          <img 
                            src={structureImageUrl} 
                            alt="2D Structure" 
                            className="max-w-full max-h-full object-contain"
                          />
                        ) : (
                          <div className="text-center text-slate-500">
                            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>{t('spu.syncPubchemToDisplay')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 产品图 (AI 生成) */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm text-slate-400">
                          {t('spu.productImageAI')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleGenerateProductImage(false)}
                          disabled={generatingImage || !pubchemInfo.cid}
                          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title={!pubchemInfo.cid ? t('spu.syncPubchemFirst') : ''}
                        >
                          {generatingImage ? (
                            <Loader2 className="w-4 h-4 animate-spin inline" />
                          ) : (
                            t('spu.generate')
                          )}
                        </button>
                        {productImageUrl && (
                          <button
                            type="button"
                            onClick={() => handleGenerateProductImage(true)}
                            disabled={generatingImage}
                            className="text-sm text-slate-500 hover:text-slate-300"
                          >
                            {t('spu.redo')}
                          </button>
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
                          <div className="text-center text-slate-500">
                            <Database className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>{t('spu.clickToGenerate')}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* PubChem 同步信息 */}
                  <div className="mt-4 flex items-center">
                    <div className="text-sm text-slate-400">
                      {pubchemInfo.cid ? (
                        <div className="flex items-center gap-3">
                          <span>CID:</span>
                          <a 
                            href={`https://pubchem.ncbi.nlm.nih.gov/compound/${pubchemInfo.cid}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {pubchemInfo.cid}
                          </a>
                          {pubchemInfo.syncedAt && (
                            <span className="text-slate-500">
                              {t('spu.syncedOn')}: {new Date(pubchemInfo.syncedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-500">{t('spu.notSynced')}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 基本信息 */}
              <div className="mb-5">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  {t('spu.basicInformation')}
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {/* CAS号 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.casNumber')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.cas}
                      onChange={(e) => setFormData(prev => ({ ...prev, cas: e.target.value }))}
                      disabled={!!editingSpu}
                      placeholder="50-00-0"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                  {/* HS编码 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.hsCode')}
                    </label>
                    <input
                      type="text"
                      value={formData.hsCode}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9.]/g, '').slice(0, 20);
                        setFormData(prev => ({ ...prev, hsCode: value }));
                      }}
                      placeholder="290241"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* 状态 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.status')}
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">{t('spu.active')}</option>
                      <option value="INACTIVE">{t('spu.inactive')}</option>
                    </select>
                  </div>
                  {/* 中文名称 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.nameZh')} <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder={t('spu.placeholderChineseName')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* 英文名称 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.nameEn')}
                    </label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData(prev => ({ ...prev, nameEn: e.target.value }))}
                      placeholder="English Name"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* HS编码国家扩展 - 在基本信息下方 */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowHsExtensions(!showHsExtensions)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    {showHsExtensions 
                      ? t('spu.hideCountryExtensions') 
                      : t('spu.addCountryExtensions')}
                  </button>
                  {showHsExtensions && (
                    <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-slate-700/30 rounded-lg">
                      {hsCodeCountries.map((country) => (
                        <div key={country.code} className="flex items-center gap-2">
                          <span className="w-12 text-xs text-slate-400">{country.code}</span>
                          <input
                            type="text"
                            value={formData.hsCodeExtensions[country.code] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFormData(prev => ({
                                ...prev,
                                hsCodeExtensions: { ...prev.hsCodeExtensions, [country.code]: value }
                              }));
                            }}
                            placeholder={locale === 'zh' ? `${country.digits}位编码` : `${country.digits}-digit`}
                            className="flex-1 bg-slate-600 border border-slate-500 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 化学信息 */}
              <div className="mb-5">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  {t('spu.chemicalInformation')}
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  {/* 化学式 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.formula')}
                    </label>
                    <input
                      type="text"
                      value={formData.formula}
                      onChange={(e) => setFormData(prev => ({ ...prev, formula: e.target.value }))}
                      placeholder={t('spu.placeholderFormula')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* 分子量 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.molecularWeight')}
                    </label>
                    <input
                      type="text"
                      value={formData.molecularWeight}
                      onChange={(e) => setFormData(prev => ({ ...prev, molecularWeight: e.target.value }))}
                      placeholder={t('spu.placeholderMolecularWeight')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* SMILES */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      SMILES
                    </label>
                    <input
                      type="text"
                      value={formData.smiles}
                      onChange={(e) => setFormData(prev => ({ ...prev, smiles: e.target.value }))}
                      placeholder={t('spu.placeholderMolecularStructure')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* InChI Key */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      InChI Key
                    </label>
                    <input
                      type="text"
                      value={formData.inchiKey}
                      onChange={(e) => setFormData(prev => ({ ...prev, inchiKey: e.target.value }))}
                      placeholder="InChIKey"
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* 物理性质 */}
              <div className="mb-5">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  {t('spu.physicalProperties')}
                </h3>
                {/* 物理描述 - 横跨整行 */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {t('spu.physicalDescription')}
                  </label>
                  <textarea
                    value={formData.physicalDescription}
                    onChange={(e) => {
                      autoResizeTextarea(e);
                      setFormData(prev => ({ ...prev, physicalDescription: e.target.value }));
                    }}
                    placeholder={t('spu.placeholderPhysicalDescription')}
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                    style={{ height: 'auto' }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {/* 颜色/形态 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.colorForm')}
                    </label>
                    <input
                      type="text"
                      value={formData.colorForm}
                      onChange={(e) => setFormData(prev => ({ ...prev, colorForm: e.target.value }))}
                      placeholder={t('spu.placeholderColorForm')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* 气味 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.odor')}
                    </label>
                    <input
                      type="text"
                      value={formData.odor}
                      onChange={(e) => setFormData(prev => ({ ...prev, odor: e.target.value }))}
                      placeholder={t('spu.placeholderOdor')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* 密度 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.density')}
                    </label>
                    <input
                      type="text"
                      value={formData.density === '-' ? t('spu.na') : formData.density || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, density: e.target.value }))}
                      placeholder={t('spu.placeholderDensity')}
                      className={`w-full bg-slate-700 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formData.density === '-' ? 'border-amber-500/50 text-slate-400 italic' : 'border-slate-600'
                      }`}
                    />
                  </div>
                  {/* 沸点 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.boilingPoint')}
                    </label>
                    <input
                      type="text"
                      value={formData.boilingPoint === '-' ? t('spu.na') : formData.boilingPoint || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, boilingPoint: e.target.value }))}
                      placeholder={t('spu.placeholderBoilingPoint')}
                      className={`w-full bg-slate-700 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formData.boilingPoint === '-' ? 'border-amber-500/50 text-slate-400 italic' : 'border-slate-600'
                      }`}
                    />
                  </div>
                  {/* 熔点 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.meltingPoint')}
                    </label>
                    <input
                      type="text"
                      value={formData.meltingPoint === '-' ? t('spu.na') : formData.meltingPoint || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, meltingPoint: e.target.value }))}
                      placeholder={t('spu.placeholderMeltingPoint')}
                      className={`w-full bg-slate-700 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formData.meltingPoint === '-' ? 'border-amber-500/50 text-slate-400 italic' : 'border-slate-600'
                      }`}
                    />
                  </div>
                  {/* 闪点 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.flashPoint')}
                    </label>
                    <input
                      type="text"
                      value={formData.flashPoint === '-' ? t('spu.na') : formData.flashPoint || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, flashPoint: e.target.value }))}
                      placeholder={t('spu.placeholderFlashPoint')}
                      className={`w-full bg-slate-700 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formData.flashPoint === '-' ? 'border-amber-500/50 text-slate-400 italic' : 'border-slate-600'
                      }`}
                    />
                  </div>
                  {/* 溶解度 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.solubility')}
                    </label>
                    <input
                      type="text"
                      value={formData.solubility === '-' ? t('spu.na') : formData.solubility || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, solubility: e.target.value }))}
                      placeholder={t('spu.placeholderSolubility')}
                      className={`w-full bg-slate-700 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formData.solubility === '-' ? 'border-amber-500/50 text-slate-400 italic' : 'border-slate-600'
                      }`}
                    />
                  </div>
                  {/* 蒸气压 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.vaporPressure')}
                    </label>
                    <input
                      type="text"
                      value={formData.vaporPressure === '-' ? t('spu.na') : formData.vaporPressure || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, vaporPressure: e.target.value }))}
                      placeholder={t('spu.placeholderVaporPressure')}
                      className={`w-full bg-slate-700 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formData.vaporPressure === '-' ? 'border-amber-500/50 text-slate-400 italic' : 'border-slate-600'
                      }`}
                    />
                  </div>
                  {/* 折射率 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.refractiveIndex')}
                    </label>
                    <input
                      type="text"
                      value={formData.refractiveIndex === '-' ? t('spu.na') : formData.refractiveIndex || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, refractiveIndex: e.target.value }))}
                      placeholder={t('spu.placeholderRefractiveIndex')}
                      className={`w-full bg-slate-700 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                        formData.refractiveIndex === '-' ? 'border-amber-500/50 text-slate-400 italic' : 'border-slate-600'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* 计算属性 */}
              <div className="mb-5">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  {t('spu.computedProperties')}
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      XLogP
                    </label>
                    <input
                      type="text"
                      value={formData.xlogp}
                      onChange={(e) => setFormData(prev => ({ ...prev, xlogp: e.target.value }))}
                      placeholder={formData.xlogp === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.xlogp ? 'text-slate-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      TPSA
                    </label>
                    <input
                      type="text"
                      value={formData.tpsa}
                      onChange={(e) => setFormData(prev => ({ ...prev, tpsa: e.target.value }))}
                      placeholder={formData.tpsa === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.tpsa ? 'text-slate-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.complexity')}
                    </label>
                    <input
                      type="text"
                      value={formData.complexity}
                      onChange={(e) => setFormData(prev => ({ ...prev, complexity: e.target.value }))}
                      placeholder={formData.complexity === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.complexity ? 'text-slate-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.heavyAtoms')}
                    </label>
                    <input
                      type="text"
                      value={formData.heavyAtomCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, heavyAtomCount: e.target.value }))}
                      placeholder={formData.heavyAtomCount === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.heavyAtomCount ? 'text-slate-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.hBondDonors')}
                    </label>
                    <input
                      type="text"
                      value={formData.hBondDonorCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, hBondDonorCount: e.target.value }))}
                      placeholder={formData.hBondDonorCount === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.hBondDonorCount ? 'text-slate-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.hBondAcceptors')}
                    </label>
                    <input
                      type="text"
                      value={formData.hBondAcceptorCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, hBondAcceptorCount: e.target.value }))}
                      placeholder={formData.hBondAcceptorCount === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.hBondAcceptorCount ? 'text-slate-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.rotatableBonds')}
                    </label>
                    <input
                      type="text"
                      value={formData.rotatableBondCount}
                      onChange={(e) => setFormData(prev => ({ ...prev, rotatableBondCount: e.target.value }))}
                      placeholder={formData.rotatableBondCount === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.rotatableBondCount ? 'text-slate-500' : ''}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.formalCharge')}
                    </label>
                    <input
                      type="text"
                      value={formData.formalCharge}
                      onChange={(e) => setFormData(prev => ({ ...prev, formalCharge: e.target.value }))}
                      placeholder={formData.formalCharge === '' ? t('spu.na') : ''}
                      className={`w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 ${!formData.formalCharge ? 'text-slate-500' : ''}`}
                    />
                  </div>
                </div>
              </div>

              {/* 安全与毒性信息 */}
              <div className="mb-5">
                <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-3">
                  {t('spu.safetyToxicity')}
                </h3>
                <div className="space-y-3">
                  {/* 危险等级 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.hazardClasses')}
                    </label>
                    <input
                      type="text"
                      value={formData.hazardClasses}
                      onChange={(e) => setFormData(prev => ({ ...prev, hazardClasses: e.target.value }))}
                      placeholder={t('spu.placeholderHazardClasses')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  {/* 健康危害 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.healthHazards')}
                    </label>
                    <textarea
                      value={formData.healthHazards}
                      onChange={(e) => {
                        autoResizeTextarea(e);
                        setFormData(prev => ({ ...prev, healthHazards: e.target.value }));
                      }}
                      placeholder={t('spu.placeholderHealthHazards')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                      style={{ height: 'auto' }}
                    />
                  </div>
                  {/* GHS 分类 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.ghsClassification')}
                    </label>
                    <textarea
                      value={formData.ghsClassification}
                      onChange={(e) => {
                        autoResizeTextarea(e);
                        setFormData(prev => ({ ...prev, ghsClassification: e.target.value }));
                      }}
                      placeholder={t('spu.placeholderGhsClassification')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                      style={{ height: 'auto' }}
                    />
                  </div>
                  {/* 急救措施 */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      {t('spu.firstAid')}
                    </label>
                    <textarea
                      value={formData.firstAid}
                      onChange={(e) => {
                        autoResizeTextarea(e);
                        setFormData(prev => ({ ...prev, firstAid: e.target.value }));
                      }}
                      placeholder={t('spu.placeholderFirstAid')}
                      className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                      style={{ height: 'auto' }}
                    />
                  </div>
                  {/* 存储条件和不相容物质 - 并排 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {t('spu.storageConditions')}
                      </label>
                      <textarea
                        value={formData.storageConditions}
                        onChange={(e) => {
                          autoResizeTextarea(e);
                          setFormData(prev => ({ ...prev, storageConditions: e.target.value }));
                        }}
                        placeholder={t('spu.placeholderStorageConditions')}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                        style={{ height: 'auto' }}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1">
                        {t('spu.incompatibleMaterials')}
                      </label>
                      <textarea
                        value={formData.incompatibleMaterials}
                        onChange={(e) => {
                          autoResizeTextarea(e);
                          setFormData(prev => ({ ...prev, incompatibleMaterials: e.target.value }));
                        }}
                        placeholder={t('spu.placeholderIncompatibleMaterials')}
                        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                        style={{ height: 'auto' }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 同义词 */}
              <div className="mb-5">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('spu.synonyms')}
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {formData.synonyms.map((syn, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-700 rounded text-xs">
                      {syn}
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          synonyms: prev.synonyms.filter((_, i) => i !== idx)
                        }))}
                        className="text-slate-400 hover:text-red-400"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={synonymInput}
                    onChange={(e) => setSynonymInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && synonymInput.trim()) {
                        setFormData(prev => ({ ...prev, synonyms: [...prev.synonyms, synonymInput.trim()] }));
                        setSynonymInput('');
                      }
                    }}
                    placeholder={t('spu.placeholderSynonyms')}
                    className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (synonymInput.trim()) {
                        setFormData(prev => ({ ...prev, synonyms: [...prev.synonyms, synonymInput.trim()] }));
                        setSynonymInput('');
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-600 hover:bg-slate-500 rounded text-sm"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* 描述 */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  {t('spu.description')}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => {
                    autoResizeTextarea(e);
                    setFormData(prev => ({ ...prev, description: e.target.value }));
                  }}
                  placeholder={t('spu.placeholderDescription')}
                  className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 overflow-hidden"
                  style={{ height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自定义弹窗 */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg shadow-xl w-72 overflow-hidden">
            <div className="p-4">
              <div className="flex items-center gap-3 mb-2">
                {dialogConfig.type === 'confirm' && (
                  <div className="w-7 h-7 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                  </div>
                )}
                {dialogConfig.type === 'success' && (
                  <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                )}
                {dialogConfig.type === 'error' && (
                  <div className="w-7 h-7 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    <XCircle className="w-4 h-4 text-red-500" />
                  </div>
                )}
                <h3 className="text-sm font-semibold">{dialogConfig.title}</h3>
              </div>
              <p className="text-slate-300 text-xs pl-10">{dialogConfig.message}</p>
            </div>
            <div className="bg-slate-700/50 px-3 py-2 flex justify-end gap-2">
              {dialogConfig.type === 'confirm' && (
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-3 py-1 bg-slate-600 hover:bg-slate-500 rounded text-xs transition-colors"
                >
                  {t('common.cancel')}
                </button>
              )}
              <button
                onClick={() => {
                  setShowDialog(false);
                  if (dialogConfig.onConfirm) {
                    dialogConfig.onConfirm();
                  }
                }}
                className={`px-3 py-1 rounded text-xs transition-colors ${
                  dialogConfig.type === 'error'
                    ? 'bg-red-600 hover:bg-red-700'
                    : dialogConfig.type === 'confirm'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {dialogConfig.type === 'confirm' 
                  ? (locale === 'zh' ? '确认' : 'Confirm')
                  : (locale === 'zh' ? '确定' : 'OK')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 图片对比弹窗 */}
      {showImageCompareModal && newProductImageUrl && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="sticky top-0 bg-slate-800 border-b border-slate-700 px-5 py-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">
                {locale === 'zh' ? '图片对比 - 选择要使用的图片' : 'Image Comparison - Choose Image'}
              </h2>
              <button
                onClick={handleKeepOldImage}
                className="p-1 hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-5">
              <div className="grid grid-cols-2 gap-6">
                {/* 原图 */}
                <div className="flex flex-col">
                  <div className="text-sm text-slate-400 mb-2 text-center font-medium">
                    {locale === 'zh' ? '当前图片' : 'Current Image'}
                  </div>
                  <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-blue-500 transition-colors cursor-pointer"
                    onClick={handleKeepOldImage}
                  >
                    <img 
                      src={productImageUrl!} 
                      alt="Current" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={handleKeepOldImage}
                    className="mt-3 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors"
                  >
                    {locale === 'zh' ? '保留原图' : 'Keep Current'}
                  </button>
                </div>
                
                {/* 新图 */}
                <div className="flex flex-col">
                  <div className="text-sm text-slate-400 mb-2 text-center font-medium">
                    {locale === 'zh' ? '新图片' : 'New Image'}
                    <span className="ml-2 text-green-400 text-xs">
                      {locale === 'zh' ? '(AI 重新生成)' : '(AI Regenerated)'}
                    </span>
                  </div>
                  <div className="aspect-square bg-white/5 rounded-lg flex items-center justify-center overflow-hidden border-2 border-transparent hover:border-green-500 transition-colors cursor-pointer"
                    onClick={handleUseNewImage}
                  >
                    <img 
                      src={newProductImageUrl} 
                      alt="New" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <button
                    onClick={handleUseNewImage}
                    className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors"
                  >
                    {locale === 'zh' ? '使用新图片' : 'Use New Image'}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-center text-xs text-slate-500">
                {locale === 'zh' ? '点击图片或按钮进行选择' : 'Click image or button to select'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

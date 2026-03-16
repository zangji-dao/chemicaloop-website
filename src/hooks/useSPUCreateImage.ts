/**
 * 新建产品 - 生成产品图页面 Hook
 * 
 * 流程：
 * 1. 页面加载时从 sessionStorage 读取预览数据（由搜索页面同步并缓存）
 * 2. 有数据 → 显示结构图，用户可点击生成产品图
 * 3. 无数据 → 显示错误提示，引导返回搜索页
 * 4. 生成产品图后点击"下一步" → 跳转到填写表单页面
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';

// sessionStorage key for preview data
const PREVIEW_DATA_KEY = 'spu_create_preview_data';

interface SyncProgress {
  step: 'connecting' | 'loading' | 'done' | 'error';
  message: string;
}

// 预览数据接口（与 sync-pubchem preview 返回格式一致）
interface PreviewData {
  cas?: string;
  pubchemCid?: number | null;
  nameZh?: string | null;
  nameEn?: string | null;
  formula?: string | null;
  description?: string | null;
  molecularWeight?: string | null;
  structureUrl?: string | null;
  structureImageKey?: string | null;
  structureSdf?: string | null;
  structure2dSvg?: string | null;
  smiles?: string | null;
  inchi?: string | null;
  inchiKey?: string | null;
  synonyms?: string[];
  applications?: string[];
  [key: string]: any;
}

interface UseSPUCreateImageReturn {
  // 状态
  loadingData: boolean;
  loadingProgress: SyncProgress;
  generatingImage: boolean;
  step: 'loading' | 'generate' | 'next' | 'error';
  
  // 数据
  cas: string;
  previewData: PreviewData | null;
  structureImageUrl: string | null;
  productImageUrl: string | null;
  productImageKey: string | null;
  errorMessage: string | null;
  
  // 方法
  handleRetryLoad: () => void;
  handleGenerateProductImage: () => Promise<void>;
  handleNext: () => void;
  handleBack: () => void;
  
  // 弹窗
  dialogConfig: any;
  setDialogConfig: (config: any) => void;
}

export function useSPUCreateImage(locale: string): UseSPUCreateImageReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cas = searchParams.get('cas') || '';

  // 状态
  const [loadingData, setLoadingData] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState<SyncProgress>({ step: 'connecting', message: '' });
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // 数据
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageKey, setProductImageKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 从 sessionStorage 加载预览数据
  const loadPreviewData = useCallback(async () => {
    if (!cas) {
      setErrorMessage(locale === 'zh' ? '缺少 CAS 号参数' : 'Missing CAS parameter');
      setLoadingData(false);
      return;
    }

    setLoadingProgress({ step: 'connecting', message: locale === 'zh' ? '正在加载预览数据...' : 'Loading preview data...' });

    try {
      // 从 sessionStorage 读取预览数据
      const cachedData = sessionStorage.getItem(PREVIEW_DATA_KEY);
      
      if (!cachedData) {
        setErrorMessage(locale === 'zh'
          ? '预览数据不存在，请返回搜索页面重新操作。'
          : 'Preview data not found. Please go back to search page.');
        setLoadingProgress({ step: 'error', message: 'No preview data' });
        setLoadingData(false);
        return;
      }

      const data: PreviewData = JSON.parse(cachedData);
      
      // 验证 CAS 号匹配
      if (data.cas !== cas) {
        setErrorMessage(locale === 'zh'
          ? '预览数据与当前 CAS 号不匹配，请返回搜索页面重新操作。'
          : 'Preview data does not match current CAS. Please go back to search page.');
        setLoadingProgress({ step: 'error', message: 'CAS mismatch' });
        setLoadingData(false);
        return;
      }

      // 保存预览数据
      setPreviewData(data);
      
      // 设置结构图 URL
      if (data.structureImageKey) {
        // 从对象存储获取图片 URL（使用 redirect=false 获取 JSON 响应）
        const token = getAdminToken();
        const imageUrlResponse = await fetch(`/api/common/image-url?key=${encodeURIComponent(data.structureImageKey)}&redirect=false`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        const imageUrlData = await imageUrlResponse.json();
        if (imageUrlData.success && imageUrlData.url) {
          setStructureImageUrl(imageUrlData.url);
        }
      } else if (data.structureUrl) {
        // 直接使用 PubChem URL
        setStructureImageUrl(data.structureUrl);
      } else {
        setErrorMessage(locale === 'zh'
          ? '该产品没有结构图数据，无法生成产品图。'
          : 'No structure image available for this product.');
        setLoadingProgress({ step: 'error', message: 'No structure image' });
        setLoadingData(false);
        return;
      }
      
      setLoadingProgress({ step: 'done', message: locale === 'zh' ? '加载完成' : 'Data loaded' });
    } catch (error: any) {
      console.error('Load preview data error:', error);
      setLoadingProgress({ step: 'error', message: error.message });
      setErrorMessage(error.message);
    } finally {
      setLoadingData(false);
    }
  }, [cas, locale]);

  // 页面加载时自动加载数据
  useEffect(() => {
    if (cas && loadingData && !previewData && !errorMessage) {
      loadPreviewData();
    }
  }, [cas]); // eslint-disable-line react-hooks/exhaustive-deps

  // 计算当前步骤
  const getStep = (): 'loading' | 'generate' | 'next' | 'error' => {
    if (loadingData) return 'loading';
    if (errorMessage) return 'error';
    if (productImageKey) return 'next';
    return 'generate';
  };
  const step = getStep();

  // 重试加载
  const handleRetryLoad = useCallback(() => {
    setLoadingData(true);
    setErrorMessage(null);
    loadPreviewData();
  }, [loadPreviewData]);

  // 生成产品图
  const handleGenerateProductImage = useCallback(async () => {
    if (!cas || !previewData?.pubchemCid) {
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '无法生成' : 'Cannot Generate',
        message: locale === 'zh' ? '缺少必要的产品数据' : 'Missing required product data',
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
          cas,
          name: previewData.nameEn || previewData.nameZh || cas,
          sdf: previewData.structureSdf,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setProductImageUrl(data.imageUrl);
        setProductImageKey(data.imageKey);
        setDialogConfig({
          type: 'success',
          title: locale === 'zh' ? '生成成功' : 'Success',
          message: locale === 'zh' ? '产品图已生成，点击"下一步"继续' : 'Product image generated. Click "Next" to continue.',
        });
      } else {
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '生成失败' : 'Generation Failed',
          message: data.error || (locale === 'zh' ? '未知错误' : 'Unknown error'),
        });
      }
    } catch (error: any) {
      console.error('Generate image error:', error);
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '生成失败' : 'Generation Failed',
        message: error.message,
      });
    } finally {
      setGeneratingImage(false);
    }
  }, [cas, previewData, locale]);

  // 下一步
  const handleNext = useCallback(() => {
    // 更新 sessionStorage 中的预览数据，添加产品图信息
    const updatedData = {
      ...previewData,
      cas,
      productImageKey,
      productImageUrl,
    };
    sessionStorage.setItem(PREVIEW_DATA_KEY, JSON.stringify(updatedData));
    
    // 跳转到填写表单页面
    router.push(`/admin/spu/create/info?cas=${encodeURIComponent(cas)}`);
  }, [cas, previewData, productImageKey, productImageUrl, router]);

  // 返回上一步
  const handleBack = useCallback(() => {
    router.push('/admin/spu/create');
  }, [router]);

  return {
    // 状态
    loadingData,
    loadingProgress,
    generatingImage,
    step,
    
    // 数据
    cas,
    previewData,
    structureImageUrl,
    productImageUrl,
    productImageKey,
    errorMessage,
    
    // 方法
    handleRetryLoad,
    handleGenerateProductImage,
    handleNext,
    handleBack,
    
    // 弹窗
    dialogConfig,
    setDialogConfig,
  };
}

/**
 * 新建产品 - 生成产品图页面 Hook
 * 
 * 流程：
 * 1. 页面加载时从数据库读取预存储的数据（已由搜索页面同步）
 * 2. 有数据 → 显示结构图，用户可点击生成产品图
 * 3. 无数据 → 显示错误提示
 * 4. 生成产品图后点击"下一步" → 跳转到填写表单页面
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';

interface SyncProgress {
  step: 'connecting' | 'loading' | 'done' | 'error';
  message: string;
}

interface ProductData {
  id: string;
  cas: string;
  name: string;
  name_en?: string;
  formula?: string;
  molecular_weight?: string;
  pubchem_cid?: number;
  structure_image_key?: string;
  structure_url?: string;
  structure_sdf?: string;
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
  productData: ProductData | null;
  structureImageUrl: string | null;
  productImageUrl: string | null;
  productImageKey: string | null;
  errorMessage: string | null;
  
  // 方法
  handleRetryLoad: () => Promise<void>;
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
  const [loadingData, setLoadingData] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<SyncProgress>({ step: 'connecting', message: '' });
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // 数据
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageKey, setProductImageKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 从数据库加载产品数据
  const loadProductData = useCallback(async () => {
    if (!cas) return;

    setLoadingData(true);
    setErrorMessage(null);
    setLoadingProgress({ step: 'connecting', message: locale === 'zh' ? '正在加载产品数据...' : 'Loading product data...' });

    try {
      const token = getAdminToken();

      setLoadingProgress({ step: 'loading', message: locale === 'zh' ? `正在查询 ${cas}...` : `Querying ${cas}...` });

      // 使用 cas 参数获取完整产品数据（包含 structure_image_key, pubchem_cid 等）
      const response = await fetch(`/api/admin/spu/search?cas=${encodeURIComponent(cas)}`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        
        // 检查是否有结构图
        if (!data.structure_image_key && !data.structure_url) {
          setErrorMessage(locale === 'zh'
            ? '该产品尚未同步PubChem数据，请返回上一步重新同步。'
            : 'Product has not been synced with PubChem. Please go back and sync again.');
          setLoadingProgress({ step: 'error', message: 'No structure image' });
          setLoadingData(false);
          return;
        }
        
        // 保存数据
        setProductData(data);
        
        // 设置结构图 URL
        if (data.structure_image_key) {
          const imageUrlResponse = await fetch(`/api/admin/spu/image-url?key=${encodeURIComponent(data.structure_image_key)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          const imageUrlData = await imageUrlResponse.json();
          if (imageUrlData.success && imageUrlData.url) {
            setStructureImageUrl(imageUrlData.url);
          }
        } else if (data.structure_url) {
          setStructureImageUrl(data.structure_url);
        }
        
        setLoadingProgress({ step: 'done', message: locale === 'zh' ? '加载完成' : 'Data loaded' });
      } else {
        // 产品不存在
        setErrorMessage(locale === 'zh' 
          ? '产品数据不存在，请返回上一步重新操作。'
          : 'Product data not found. Please go back and try again.');
        setLoadingProgress({ step: 'error', message: 'Product not found' });
      }
    } catch (error: any) {
      console.error('Load product data error:', error);
      setLoadingProgress({ step: 'error', message: error.message });
      setErrorMessage(error.message);
    } finally {
      setLoadingData(false);
    }
  }, [cas, locale]);

  // 页面加载时自动加载数据
  useEffect(() => {
    if (cas && !loadingData && !productData && !errorMessage) {
      loadProductData();
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
  const handleRetryLoad = useCallback(async () => {
    await loadProductData();
  }, [loadProductData]);

  // 生成产品图
  const handleGenerateProductImage = useCallback(async () => {
    if (!cas || !productData?.pubchem_cid) {
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
      const response = await fetch('/api/admin/products/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cas,
          name: productData.name_en || productData.name || cas,
          sdf: productData.structure_sdf,
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
  }, [cas, productData, locale]);

  // 下一步
  const handleNext = useCallback(() => {
    // 存储数据到 sessionStorage
    const transferData = {
      cas,
      productData,
      productImageKey,
      productImageUrl,
    };
    sessionStorage.setItem('spu_create_data', JSON.stringify(transferData));
    
    // 跳转到填写表单页面
    router.push(`/admin/spu/create/info?cas=${encodeURIComponent(cas)}`);
  }, [cas, productData, productImageKey, productImageUrl, router]);

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
    productData,
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

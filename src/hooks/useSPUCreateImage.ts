/**
 * 新建产品 - 生成产品图页面 Hook
 * 
 * 流程：
 * 1. 页面加载时从 sessionStorage 读取上一页已获取的 PubChem 数据
 * 2. 自动加载结构图
 * 3. 用户点击「生成产品图」→ 调用 API 生成产品图
 * 4. 生成完成后点击「下一步」→ 跳转到填写表单页面
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';

interface PubChemData {
  cid: number;
  structureUrl?: string;
  structureImageKey?: string;
  structureSdf?: string;
  nameEn?: string;
  formula?: string;
  molecularWeight?: string;
  [key: string]: any;
}

interface UseSPUCreateImageReturn {
  // 状态
  loading: boolean;
  generatingImage: boolean;
  step: 'loading' | 'generate' | 'next';
  
  // 数据
  cas: string;
  pubchemData: PubChemData | null;
  structureImageUrl: string | null;
  productImageUrl: string | null;
  productImageKey: string | null;
  
  // 方法
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
  const [loading, setLoading] = useState(true);
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // 数据
  const [pubchemData, setPubchemData] = useState<PubChemData | null>(null);
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageKey, setProductImageKey] = useState<string | null>(null);
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 页面加载时从 sessionStorage 读取数据
  useEffect(() => {
    const loadData = async () => {
      if (!cas) {
        setLoading(false);
        return;
      }

      try {
        const storedData = sessionStorage.getItem('spu_create_data');
        if (storedData) {
          const parsed = JSON.parse(storedData);
          
          if (parsed.pubchemData) {
            setPubchemData(parsed.pubchemData);
            
            // 获取结构图签名URL
            if (parsed.pubchemData.structureImageKey) {
              const token = getAdminToken();
              const imageUrlResponse = await fetch(
                `/api/admin/spu/image-url?key=${encodeURIComponent(parsed.pubchemData.structureImageKey)}`,
                { headers: token ? { 'Authorization': `Bearer ${token}` } : {} }
              );
              const imageUrlData = await imageUrlResponse.json();
              if (imageUrlData.success && imageUrlData.url) {
                setStructureImageUrl(imageUrlData.url);
              }
            } else if (parsed.pubchemData.structureUrl) {
              setStructureImageUrl(parsed.pubchemData.structureUrl);
            }
          }
          
          // 如果已有产品图
          if (parsed.productImageKey) {
            setProductImageKey(parsed.productImageKey);
          }
          if (parsed.productImageUrl) {
            setProductImageUrl(parsed.productImageUrl);
          }
        }
      } catch (error) {
        console.error('Error loading stored data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [cas]);

  // 计算当前步骤
  const getStep = (): 'loading' | 'generate' | 'next' => {
    if (loading) return 'loading';
    if (productImageKey) return 'next';
    return 'generate';
  };
  const step = getStep();

  // 生成产品图
  const handleGenerateProductImage = useCallback(async () => {
    if (!cas || !pubchemData?.cid) {
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
          name: pubchemData.nameEn || cas,
          sdf: pubchemData.structureSdf,
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
  }, [cas, pubchemData, locale]);

  // 下一步
  const handleNext = useCallback(() => {
    // 更新 sessionStorage 数据
    const transferData = {
      cas,
      pubchemData,
      productImageKey,
      productImageUrl,
    };
    sessionStorage.setItem('spu_create_data', JSON.stringify(transferData));
    
    // 跳转到填写表单页面
    router.push(`/admin/spu/create/info?cas=${encodeURIComponent(cas)}`);
  }, [cas, pubchemData, productImageKey, productImageUrl, router]);

  // 返回上一步
  const handleBack = useCallback(() => {
    sessionStorage.removeItem('spu_create_data');
    router.push('/admin/spu/create');
  }, [router]);

  return {
    // 状态
    loading,
    generatingImage,
    step,
    
    // 数据
    cas,
    pubchemData,
    structureImageUrl,
    productImageUrl,
    productImageKey,
    
    // 方法
    handleGenerateProductImage,
    handleNext,
    handleBack,
    
    // 弹窗
    dialogConfig,
    setDialogConfig,
  };
}

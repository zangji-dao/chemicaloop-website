/**
 * 新建产品 - 生成产品图页面 Hook
 * 
 * 流程：
 * 1. 页面加载时自动调用同步API获取PubChem数据（结构图等）
 * 2. 获取成功 → 显示结构图，用户可点击生成产品图
 * 3. 获取失败 → 显示错误提示（PubChem中不存在）
 * 4. 生成产品图后点击"下一步" → 跳转到填写表单页面
 */

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';

interface SyncProgress {
  step: 'connecting' | 'fetching' | 'done' | 'error';
  message: string;
}

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
  syncingPubChem: boolean;
  syncProgress: SyncProgress;
  generatingImage: boolean;
  step: 'loading' | 'generate' | 'next' | 'error';
  
  // 数据
  cas: string;
  pubchemData: PubChemData | null;
  structureImageUrl: string | null;
  productImageUrl: string | null;
  productImageKey: string | null;
  errorMessage: string | null;
  
  // 方法
  handleRetrySync: () => Promise<void>;
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
  const [syncingPubChem, setSyncingPubChem] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ step: 'connecting', message: '' });
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // 数据
  const [pubchemData, setPubchemData] = useState<PubChemData | null>(null);
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageKey, setProductImageKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 同步 PubChem 数据
  const syncPubChem = useCallback(async () => {
    if (!cas) return;

    setSyncingPubChem(true);
    setErrorMessage(null);
    setSyncProgress({ step: 'connecting', message: locale === 'zh' ? '正在连接 PubChem...' : 'Connecting to PubChem...' });

    try {
      const token = getAdminToken();

      // 获取数据
      setSyncProgress({ step: 'fetching', message: locale === 'zh' ? `正在获取 ${cas} 数据...` : `Fetching data for ${cas}...` });

      const response = await fetch('/api/admin/spu/sync-pubchem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ preview: true, cas }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        const data = result.data;
        
        // 保存数据
        setPubchemData(data);
        
        // 设置结构图 URL
        if (data.structureImageKey) {
          const imageUrlResponse = await fetch(`/api/admin/spu/image-url?key=${encodeURIComponent(data.structureImageKey)}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          const imageUrlData = await imageUrlResponse.json();
          if (imageUrlData.success && imageUrlData.url) {
            setStructureImageUrl(imageUrlData.url);
          }
        } else if (data.structureUrl) {
          setStructureImageUrl(data.structureUrl);
        }
        
        setSyncProgress({ step: 'done', message: locale === 'zh' ? '同步完成' : 'Sync completed' });
      } else {
        // PubChem中不存在或获取失败
        setSyncProgress({ step: 'error', message: result.error || 'Unknown error' });
        
        if (result.error === 'PUBCHEM_NOT_FOUND') {
          setErrorMessage(locale === 'zh' 
            ? '该CAS号在PubChem中不存在，无法获取结构图。请返回确认CAS号是否正确。'
            : 'This CAS number does not exist in PubChem. Please go back and verify the CAS number.');
        } else {
          setErrorMessage(locale === 'zh'
            ? `PubChem数据获取失败: ${result.message || result.error || '未知错误'}`
            : `Failed to fetch PubChem data: ${result.message || result.error || 'Unknown error'}`);
        }
      }
    } catch (error: any) {
      console.error('Sync PubChem error:', error);
      setSyncProgress({ step: 'error', message: error.message });
      setErrorMessage(error.message);
    } finally {
      setSyncingPubChem(false);
    }
  }, [cas, locale]);

  // 页面加载时自动同步
  useEffect(() => {
    if (cas && !syncingPubChem && !pubchemData && !errorMessage) {
      syncPubChem();
    }
  }, [cas]); // eslint-disable-line react-hooks/exhaustive-deps

  // 计算当前步骤
  const getStep = (): 'loading' | 'generate' | 'next' | 'error' => {
    if (syncingPubChem) return 'loading';
    if (errorMessage) return 'error';
    if (productImageKey) return 'next';
    return 'generate';
  };
  const step = getStep();

  // 重试同步
  const handleRetrySync = useCallback(async () => {
    await syncPubChem();
  }, [syncPubChem]);

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
    // 存储数据到 sessionStorage
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
    router.push('/admin/spu/create');
  }, [router]);

  return {
    // 状态
    syncingPubChem,
    syncProgress,
    generatingImage,
    step,
    
    // 数据
    cas,
    pubchemData,
    structureImageUrl,
    productImageUrl,
    productImageKey,
    errorMessage,
    
    // 方法
    handleRetrySync,
    handleGenerateProductImage,
    handleNext,
    handleBack,
    
    // 弹窗
    dialogConfig,
    setDialogConfig,
  };
}

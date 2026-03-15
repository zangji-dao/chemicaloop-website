/**
 * 新建产品 - 生成产品图页面 Hook
 * 
 * 流程：
 * 1. 同步 PubChem 获取 2D 结构图
 * 2. 用户点击生成产品图
 * 3. 生成完成后跳转到填写表单页面
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAdminToken } from '@/services/adminAuthService';

interface SyncProgress {
  step: 'connecting' | 'fetching' | 'updating' | 'done' | 'error';
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
  // 其他数据暂存，传给下一个页面
  [key: string]: any;
}

interface UseSPUCreateImageReturn {
  // 状态
  loading: boolean;
  syncingPubChem: boolean;
  syncProgress: SyncProgress;
  generatingImage: boolean;
  
  // 数据
  cas: string;
  pubchemData: PubChemData | null;
  structureImageUrl: string | null;
  productImageUrl: string | null;
  productImageKey: string | null;
  
  // 方法
  handleSyncPubChem: () => Promise<void>;
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
  const [loading, setLoading] = useState(false);
  const [syncingPubChem, setSyncingPubChem] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({ step: 'connecting', message: '' });
  const [generatingImage, setGeneratingImage] = useState(false);
  
  // 数据
  const [pubchemData, setPubchemData] = useState<PubChemData | null>(null);
  const [structureImageUrl, setStructureImageUrl] = useState<string | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [productImageKey, setProductImageKey] = useState<string | null>(null);
  
  // 弹窗
  const [dialogConfig, setDialogConfig] = useState<any>(null);

  // 自动同步 PubChem
  useEffect(() => {
    if (cas) {
      handleSyncPubChem();
    }
  }, [cas]);

  // 同步 PubChem
  const handleSyncPubChem = useCallback(async () => {
    if (!cas) return;

    setSyncingPubChem(true);
    setSyncProgress({ step: 'connecting', message: locale === 'zh' ? '正在连接 PubChem...' : 'Connecting to PubChem...' });

    try {
      const token = getAdminToken();

      // 检测连接
      const connectionResponse = await fetch('/api/admin/spu/check-pubchem-connection');
      const connectionData = await connectionResponse.json();

      if (!connectionData.connected) {
        setSyncProgress({ step: 'error', message: connectionData.message });
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '连接失败' : 'Connection Failed',
          message: locale === 'zh' ? `PubChem 连接失败: ${connectionData.message}` : `PubChem connection failed: ${connectionData.message}`,
        });
        setSyncingPubChem(false);
        return;
      }

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
        
        setSyncProgress({ step: 'updating', message: locale === 'zh' ? '正在处理数据...' : 'Processing data...' });
        
        // 保存数据
        setPubchemData(data);
        
        // 设置结构图 URL
        if (data.structureImageKey) {
          // 获取签名 URL
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
        setSyncProgress({ step: 'error', message: result.error || 'Unknown error' });
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '同步失败' : 'Sync Failed',
          message: locale === 'zh' 
            ? `PubChem 数据获取失败: ${result.error || '未知错误'}`
            : `Failed to fetch PubChem data: ${result.error || 'Unknown error'}`,
        });
      }
    } catch (error: any) {
      console.error('Sync PubChem error:', error);
      setSyncProgress({ step: 'error', message: error.message });
      setDialogConfig({
        type: 'error',
        title: locale === 'zh' ? '同步失败' : 'Sync Failed',
        message: error.message,
      });
    } finally {
      setSyncingPubChem(false);
    }
  }, [cas, locale]);

  // 生成产品图
  const handleGenerateProductImage = useCallback(async () => {
    if (!cas || !pubchemData?.cid) {
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
          cas,
          name: pubchemData.nameEn || cas,
          // 传入本地 SDF 数据
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
    // 将数据存储到 sessionStorage，供下一个页面使用
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

  // 返回
  const handleBack = useCallback(() => {
    router.push('/admin/spu/create');
  }, [router]);

  return {
    loading,
    syncingPubChem,
    syncProgress,
    generatingImage,
    cas,
    pubchemData,
    structureImageUrl,
    productImageUrl,
    productImageKey,
    handleSyncPubChem,
    handleGenerateProductImage,
    handleNext,
    handleBack,
    dialogConfig,
    setDialogConfig,
  };
}

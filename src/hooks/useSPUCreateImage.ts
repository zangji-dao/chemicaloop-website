/**
 * 新建产品 - 生成产品图页面 Hook
 * 
 * 流程：
 * 1. 用户点击「获取2D结构图」→ 同步 PubChem → 显示 2D 结构图
 * 2. 用户点击「生成产品图」→ 调用 API 生成产品图
 * 3. 生成完成后点击「下一步」→ 跳转到填写表单页面
 */

import { useState, useCallback } from 'react';
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
  [key: string]: any;
}

interface UseSPUCreateImageReturn {
  // 状态
  syncingPubChem: boolean;
  syncProgress: SyncProgress;
  generatingImage: boolean;
  step: 'sync' | 'generate' | 'next';
  
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

  // 计算当前步骤
  const getStep = (): 'sync' | 'generate' | 'next' => {
    if (productImageKey) return 'next';
    if (pubchemData?.cid && structureImageUrl) return 'generate';
    return 'sync';
  };
  const step = getStep();

  // 同步 PubChem - 获取2D结构图
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
        
        setDialogConfig({
          type: 'success',
          title: locale === 'zh' ? '获取成功' : 'Success',
          message: locale === 'zh' ? '2D结构图已获取，点击"生成产品图"继续' : '2D structure obtained. Click "Generate Product Image" to continue.',
        });
      } else {
        setSyncProgress({ step: 'error', message: result.error || 'Unknown error' });
        
        // 根据错误类型显示不同的提示
        let errorMessage = '';
        if (result.error === 'PUBCHEM_NOT_FOUND') {
          errorMessage = locale === 'zh' 
            ? '该CAS号在PubChem中不存在，无法获取结构图。请确认CAS号是否正确，或手动输入产品信息。'
            : 'This CAS number does not exist in PubChem. Please verify the CAS number or enter product information manually.';
        } else {
          errorMessage = locale === 'zh'
            ? `PubChem数据获取失败: ${result.message || result.error || '未知错误'}`
            : `Failed to fetch PubChem data: ${result.message || result.error || 'Unknown error'}`;
        }
        
        setDialogConfig({
          type: 'error',
          title: locale === 'zh' ? '同步失败' : 'Sync Failed',
          message: errorMessage,
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
        message: locale === 'zh' ? '请先获取2D结构图' : 'Please get 2D structure first',
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
    syncingPubChem,
    syncProgress,
    generatingImage,
    step,
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

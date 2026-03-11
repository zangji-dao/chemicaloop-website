'use client';

import { useState, useEffect, useRef } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import {
  Database, Upload, RefreshCw, Loader2, Building, Globe,
  ChevronLeft, ChevronRight, Search, X, CheckCircle, AlertCircle,
  Trash2, FileSpreadsheet
} from 'lucide-react';

// 数据源类型
type DataSource = 'china' | 'un';

// 中国海关数据类型
interface CustomsDataItem {
  id: number;
  year_month: string;
  year: number;
  month: number;
  hs_code: string;
  product_name: string | null;
  partner_code: string;
  partner_name: string;
  trade_mode_code: string;
  trade_mode_name: string;
  region_code: string;
  region_name: string;
  flow_code: string | null;
  flow_name: string | null;
  value: string;
  created_at: string;
}

// UN Trade 数据类型
interface TradeDataItem {
  id: string;
  cas: string;
  hs_code: string;
  product_name: string | null;
  product_name_en: string | null;
  reporter_code: string;
  reporter_name: string | null;
  partner_code: string;
  partner_name: string | null;
  year: number;
  flow_code: string;
  flow_name: string | null;
  value: string;
  quantity: string | null;
  unit_price: string | null;
  data_source: string;
  synced_at: string;
}

// 统计信息
interface Stats {
  totalRecords: number;
  yearMin: number;
  yearMax: number;
  hsCodes: string[];
  partnerCount: number;
}

export default function CustomsDataPage() {
  const [activeSource, setActiveSource] = useState<DataSource>('china');
  const [isLoading, setIsLoading] = useState(true);
  
  // 数据状态
  const [stats, setStats] = useState<Stats | null>(null);
  const [data, setData] = useState<(CustomsDataItem | TradeDataItem)[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  
  // 搜索触发器
  const [searchTrigger, setSearchTrigger] = useState(0);
  
  // 上传相关
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [clearExisting, setClearExisting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载数据
  useEffect(() => {
    loadData();
  }, [activeSource, page, searchTrigger]);
  
  // 防抖搜索 - 300ms 延迟
  const debouncedSearch = useDebouncedCallback(() => {
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  }, 300);
  
  // 当搜索内容变化时触发防抖搜索
  useEffect(() => {
    debouncedSearch();
  }, [search]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 获取统计
      const statsRes = await fetch(`/api/customs-data?source=${activeSource}&type=stats`);
      const statsData = await statsRes.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }
      
      // 获取数据列表
      const listRes = await fetch(`/api/customs-data?source=${activeSource}&type=list&page=${page}&pageSize=${pageSize}&search=${search}`);
      const listData = await listRes.json();
      if (listData.success) {
        setData(listData.data);
        setTotalPages(listData.totalPages);
      }
    } catch (err) {
      console.error('Load data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setSearchTrigger(prev => prev + 1);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadFiles(files);
      setUploadResult(null);
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    
    setIsUploading(true);
    setUploadResult(null);
    
    try {
      const formData = new FormData();
      uploadFiles.forEach(file => formData.append('files', file));
      formData.append('source', activeSource);
      formData.append('clearExisting', clearExisting.toString());
      
      const response = await fetch('/api/customs-data/upload', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setUploadResult(data);
      
      if (data.success) {
        setShowUploadModal(false);
        setUploadFiles([]);
        loadData();
      }
    } catch (err) {
      console.error('Upload error:', err);
      setUploadResult({ success: false, error: '上传失败' });
    } finally {
      setIsUploading(false);
    }
  };

  // 格式化金额
  const formatValue = (value: string | number) => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '-';
    if (num >= 100000000) return `${(num / 100000000).toFixed(2)}亿`;
    if (num >= 10000) return `${(num / 10000).toFixed(2)}万`;
    return num.toLocaleString();
  };

  // 渲染中国海关表格
  const renderChinaTable = () => (
    <table className="w-full text-sm">
      <thead className="bg-gray-700">
        <tr>
          <th className="px-3 py-2 text-left text-gray-300">年月</th>
          <th className="px-3 py-2 text-left text-gray-300">HS编码</th>
          <th className="px-3 py-2 text-left text-gray-300">产品名称</th>
          <th className="px-3 py-2 text-left text-gray-300">贸易伙伴</th>
          <th className="px-3 py-2 text-left text-gray-300">省份</th>
          <th className="px-3 py-2 text-left text-gray-300">贸易方式</th>
          <th className="px-3 py-2 text-left text-gray-300">流向</th>
          <th className="px-3 py-2 text-right text-gray-300">金额(美元)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {(data as CustomsDataItem[]).map((item) => (
          <tr key={item.id} className="hover:bg-gray-700/50">
            <td className="px-3 py-2 text-white whitespace-nowrap">{item.year_month}</td>
            <td className="px-3 py-2 text-gray-300 font-mono">{item.hs_code}</td>
            <td className="px-3 py-2 text-gray-300 max-w-[200px] truncate" title={item.product_name || ''}>{item.product_name || '-'}</td>
            <td className="px-3 py-2 text-gray-300">{item.partner_name}</td>
            <td className="px-3 py-2 text-gray-300">{item.region_name}</td>
            <td className="px-3 py-2 text-gray-300">{item.trade_mode_name}</td>
            <td className="px-3 py-2 text-gray-300">
              {item.flow_code ? (
                <span className={`px-2 py-0.5 rounded text-xs ${item.flow_code === 'E' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>
                  {item.flow_name || (item.flow_code === 'E' ? '出口' : '进口')}
                </span>
              ) : (
                <span className="text-gray-500">-</span>
              )}
            </td>
            <td className="px-3 py-2 text-right text-white font-medium whitespace-nowrap">{formatValue(item.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  // 渲染UN Trade表格
  const renderUNTable = () => (
    <table className="w-full text-sm">
      <thead className="bg-gray-700">
        <tr>
          <th className="px-3 py-2 text-left text-gray-300">年份</th>
          <th className="px-3 py-2 text-left text-gray-300">CAS</th>
          <th className="px-3 py-2 text-left text-gray-300">HS编码</th>
          <th className="px-3 py-2 text-left text-gray-300">产品名称</th>
          <th className="px-3 py-2 text-left text-gray-300">报告国</th>
          <th className="px-3 py-2 text-left text-gray-300">伙伴国</th>
          <th className="px-3 py-2 text-left text-gray-300">流向</th>
          <th className="px-3 py-2 text-right text-gray-300">金额(美元)</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-700">
        {(data as TradeDataItem[]).map((item) => (
          <tr key={item.id} className="hover:bg-gray-700/50">
            <td className="px-3 py-2 text-white">{item.year}</td>
            <td className="px-3 py-2 text-gray-300 font-mono">{item.cas}</td>
            <td className="px-3 py-2 text-gray-300 font-mono">{item.hs_code}</td>
            <td className="px-3 py-2 text-gray-300 max-w-[200px] truncate" title={item.product_name_en || item.product_name || ''}>{item.product_name_en || item.product_name || '-'}</td>
            <td className="px-3 py-2 text-gray-300">{item.reporter_name || item.reporter_code}</td>
            <td className="px-3 py-2 text-gray-300">{item.partner_name || item.partner_code}</td>
            <td className="px-3 py-2 text-gray-300">
              <span className={`px-2 py-0.5 rounded text-xs ${item.flow_code === 'X' ? 'bg-green-900/50 text-green-400' : 'bg-blue-900/50 text-blue-400'}`}>
                {item.flow_code === 'X' ? '出口' : '进口'}
              </span>
            </td>
            <td className="px-3 py-2 text-right text-white font-medium whitespace-nowrap">{formatValue(item.value)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">海关数据管理</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-700 text-white rounded-lg text-sm hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="h-4 w-4" />
            导入数据
          </button>
        </div>
      </div>

      {/* 数据源切换 & 统计 */}
      <div className="bg-gray-800 rounded-xl p-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          {/* 数据源切换 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveSource('china'); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSource === 'china'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Building className="h-5 w-5" />
              中国海关 ({stats?.totalRecords?.toLocaleString() || 0})
            </button>
            <button
              onClick={() => { setActiveSource('un'); setPage(1); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSource === 'un'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Globe className="h-5 w-5" />
              UN Comtrade
            </button>
          </div>
          
          {/* 统计信息 */}
          {stats && (
            <div className="flex items-center gap-6 text-sm text-gray-300">
              <span>年份: {stats.yearMin} - {stats.yearMax}</span>
              <span>HS编码: {stats.hsCodes?.slice(0, 3).join(', ')}{stats.hsCodes?.length > 3 ? '...' : ''}</span>
              <span>贸易伙伴: {stats.partnerCount}</span>
            </div>
          )}
        </div>
      </div>

      {/* 搜索 */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={activeSource === 'china' ? '搜索贸易伙伴、省份...' : '搜索CAS、报告国...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          <Search className="h-5 w-5" />
        </button>
      </div>

      {/* 数据表格 */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Database className="h-12 w-12 mb-3" />
            <p>暂无数据</p>
            <p className="text-sm mt-1">点击"导入数据"上传CSV文件</p>
          </div>
        ) : (
          <>
            {activeSource === 'china' ? renderChinaTable() : renderUNTable()}
            
            {/* 分页 */}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-700/50">
              <span className="text-sm text-gray-400">
                第 {page} / {totalPages} 页
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 上传模态框 */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">导入海关数据</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {/* 数据源提示 */}
            <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
              <p className="text-sm text-gray-300">
                当前数据源: <span className="font-medium text-white">
                  {activeSource === 'china' ? '中国海关' : 'UN Comtrade'}
                </span>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {activeSource === 'china' 
                  ? '支持 CSV 文件，列名：数据年月、商品编码、贸易伙伴名称、注册地名称、美元等'
                  : 'UN Comtrade 数据请通过 API 同步'}
              </p>
            </div>
            
            {activeSource === 'china' && (
              <>
                {/* 文件选择 */}
                <div
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-300 mb-1">点击选择 CSV 文件</p>
                  <p className="text-sm text-gray-500">支持 GBK/UTF-8 编码</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                {/* 已选文件 */}
                {uploadFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {uploadFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-200">{file.name}</span>
                        <button
                          onClick={() => setUploadFiles(files => files.filter((_, i) => i !== index))}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* 清空选项 */}
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    className="rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">导入前清空现有数据</span>
                </label>
              </>
            )}
            
            {activeSource === 'un' && (
              <div className="text-center py-8 text-gray-400">
                <Globe className="h-12 w-12 mx-auto mb-3" />
                <p>UN Comtrade 数据需通过 API 同步</p>
                <p className="text-sm mt-1">请联系管理员配置同步任务</p>
              </div>
            )}
            
            {/* 上传结果 */}
            {uploadResult && (
              <div className={`mt-4 p-3 rounded-lg ${uploadResult.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                <div className="flex items-center gap-2">
                  {uploadResult.success ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">
                    {uploadResult.success 
                      ? `成功导入 ${uploadResult.totalImported} 条记录`
                      : uploadResult.error
                    }
                  </span>
                </div>
              </div>
            )}
            
            {/* 操作按钮 */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                取消
              </button>
              {activeSource === 'china' && (
                <button
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0 || isUploading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      导入中...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      开始导入
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

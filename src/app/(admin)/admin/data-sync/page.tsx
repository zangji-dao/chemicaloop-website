'use client';

import { useState, useEffect } from 'react';
import {
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Globe,
  FileText,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Loader2,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';

// 同步任务状态
type TaskStatus = 'idle' | 'running' | 'completed' | 'failed';

// 同步任务类型
interface SyncTask {
  id: string;
  name: string;
  description: string;
  source: string;
  status: TaskStatus;
  progress: number;
  total?: number;
  lastRun?: string;
  error?: string;
  logs?: string[];
  // 海关数据查询参数
  requiresParams?: boolean;
}

// 海关数据查询参数
interface CustomsParams {
  hsCode: string;
  tradeType: 'import' | 'export';
  year: number;
}

// 预定义的同步任务
const defaultTasks: SyncTask[] = [
  {
    id: 'customs-import',
    name: '海关进口数据',
    description: '从海关官网爬取指定HS编码的进口贸易数据',
    source: 'stats.customs.gov.cn',
    status: 'idle',
    progress: 0,
    requiresParams: true,
  },
  {
    id: 'customs-export',
    name: '海关出口数据',
    description: '从海关官网爬取指定HS编码的出口贸易数据',
    source: 'stats.customs.gov.cn',
    status: 'idle',
    progress: 0,
    requiresParams: true,
  },
  {
    id: 'hs-code-china',
    name: '中国海关 HS 编码',
    description: '从海关官网爬取化工品 HS 编码数据（第28-29章）',
    source: 'customs.gov.cn',
    status: 'idle',
    progress: 0,
  },
  {
    id: 'pubchem-cas',
    name: 'PubChem CAS 数据',
    description: '按需从 PubChem 同步化学品 CAS 信息',
    source: 'pubchem.ncbi.nlm.nih.gov',
    status: 'idle',
    progress: 0,
  },
];

// 当前年份
const currentYear = new Date().getFullYear();
// 可选年份列表（最近10年）
const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

export default function DataSyncPage() {
  const [tasks, setTasks] = useState<SyncTask[]>(defaultTasks);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [crawlLogs, setCrawlLogs] = useState<string[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  
  // 海关数据查询参数
  const [customsParams, setCustomsParams] = useState<CustomsParams>({
    hsCode: '2901',  // 默认：烃类
    tradeType: 'import',
    year: currentYear,
  });

  // 轮询获取爬虫状态
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCrawling) {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/admin/data-sync/status');
          const data = await res.json();
          
          if (data.logs) {
            setCrawlLogs(data.logs);
          }
          
          if (data.status === 'completed' || data.status === 'failed') {
            setIsCrawling(false);
            setTasks(prev => prev.map(t => 
              t.id === data.taskId 
                ? { ...t, status: data.status === 'completed' ? 'completed' : 'failed', progress: 100, error: data.error }
                : t
            ));
          }
        } catch (err) {
          console.error('Failed to fetch status:', err);
        }
      }, 2000);
    }
    
    return () => clearInterval(interval);
  }, [isCrawling]);

  // 启动爬虫
  const startCrawl = async (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, status: 'running', progress: 0, logs: [] } : t
    ));
    setCrawlLogs([]);
    setIsCrawling(true);

    try {
      // 构建请求参数
      const body: any = { taskId };
      
      // 如果是海关数据任务，添加查询参数
      if (taskId.startsWith('customs-')) {
        body.hsCode = customsParams.hsCode;
        body.tradeType = taskId === 'customs-import' ? 'import' : 'export';
        body.year = customsParams.year;
      }
      
      const res = await fetch('/api/admin/data-sync/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || '启动失败');
      }
      
    } catch (err: any) {
      setIsCrawling(false);
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, status: 'failed', error: err.message } : t
      ));
    }
  };

  // 停止爬虫
  const stopCrawl = async () => {
    try {
      await fetch('/api/admin/data-sync/stop', { method: 'POST' });
      setIsCrawling(false);
      setTasks(prev => prev.map(t => 
        t.status === 'running' ? { ...t, status: 'idle' } : t
      ));
    } catch (err) {
      console.error('Failed to stop:', err);
    }
  };

  // 获取状态图标
  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">数据同步</h1>
          <p className="text-gray-400 mt-1">从海关官网等数据源同步进出口贸易数据</p>
        </div>
      </div>

      {/* 海关数据查询参数 */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="h-5 w-5 text-blue-400" />
          海关数据查询参数
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* HS编码 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">HS 编码</label>
            <input
              type="text"
              value={customsParams.hsCode}
              onChange={(e) => setCustomsParams(prev => ({ ...prev, hsCode: e.target.value }))}
              placeholder="如: 2901"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">输入4位或更多位HS编码</p>
          </div>
          
          {/* 贸易类型 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">贸易类型</label>
            <div className="flex gap-2">
              <button
                onClick={() => setCustomsParams(prev => ({ ...prev, tradeType: 'import' }))}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                  customsParams.tradeType === 'import'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ArrowDownToLine className="h-4 w-4" />
                进口
              </button>
              <button
                onClick={() => setCustomsParams(prev => ({ ...prev, tradeType: 'export' }))}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-1 ${
                  customsParams.tradeType === 'export'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                出口
              </button>
            </div>
          </div>
          
          {/* 年份 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">年份</label>
            <select
              value={customsParams.year}
              onChange={(e) => setCustomsParams(prev => ({ ...prev, year: Number(e.target.value) }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}年</option>
              ))}
            </select>
          </div>
          
          {/* 快捷选择 */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">常用HS编码</label>
            <div className="flex flex-wrap gap-1">
              {['2901', '2902', '2910', '2918', '2920'].map(code => (
                <button
                  key={code}
                  onClick={() => setCustomsParams(prev => ({ ...prev, hsCode: code }))}
                  className={`px-2 py-1 text-xs rounded ${
                    customsParams.hsCode === code
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {code}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 数据源卡片 */}
      <div className="grid gap-4">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-gray-800 rounded-xl overflow-hidden"
          >
            {/* 任务头部 */}
            <div
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-700/50"
              onClick={() => setSelectedTask(selectedTask === task.id ? null : task.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  task.id.includes('import') ? 'bg-green-900/50' : 
                  task.id.includes('export') ? 'bg-blue-900/50' : 
                  'bg-gray-700'
                }`}>
                  {task.id.includes('import') ? (
                    <ArrowDownToLine className="h-5 w-5 text-green-400" />
                  ) : task.id.includes('export') ? (
                    <ArrowUpFromLine className="h-5 w-5 text-blue-400" />
                  ) : (
                    <Database className="h-5 w-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{task.name}</span>
                    {getStatusIcon(task.status)}
                  </div>
                  <span className="text-sm text-gray-400">{task.source}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {task.status === 'running' && (
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-300">{task.progress}%</span>
                  </div>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    task.status === 'running' ? stopCrawl() : startCrawl(task.id);
                  }}
                  disabled={isCrawling && task.status !== 'running'}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    task.status === 'running'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {task.status === 'running' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      停止
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      启动
                    </>
                  )}
                </button>
                
                {selectedTask === task.id ? (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* 展开详情 */}
            {selectedTask === task.id && (
              <div className="border-t border-gray-700 p-4">
                <p className="text-gray-300 mb-4">{task.description}</p>
                
                {/* 显示查询参数（海关数据任务） */}
                {task.id.startsWith('customs-') && (
                  <div className="bg-gray-700/50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-400 mb-2">查询参数:</p>
                    <div className="flex gap-4 text-sm">
                      <span className="text-white">HS编码: <span className="text-blue-400">{customsParams.hsCode}</span></span>
                      <span className="text-white">类型: <span className={task.id.includes('import') ? 'text-green-400' : 'text-blue-400'}>{task.id.includes('import') ? '进口' : '出口'}</span></span>
                      <span className="text-white">年份: <span className="text-blue-400">{customsParams.year}</span></span>
                    </div>
                  </div>
                )}
                
                {/* 错误信息 */}
                {task.error && (
                  <div className="flex items-start gap-2 p-3 bg-red-900/30 border border-red-800 rounded-lg mb-4">
                    <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-medium">错误</p>
                      <p className="text-red-300 text-sm whitespace-pre-wrap">{task.error}</p>
                    </div>
                  </div>
                )}
                
                {/* 日志 */}
                {crawlLogs.length > 0 && task.status === 'running' && (
                  <div className="bg-gray-900 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-400">运行日志</span>
                    </div>
                    <div className="font-mono text-xs text-gray-300 space-y-1 max-h-48 overflow-y-auto">
                      {crawlLogs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* 最后运行时间 */}
                {task.lastRun && (
                  <p className="text-sm text-gray-500 mt-2">
                    最后运行: {new Date(task.lastRun).toLocaleString('zh-CN')}
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 使用说明 */}
      <div className="bg-gray-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">使用说明</h2>
        <div className="space-y-3 text-gray-300">
          <div className="flex gap-3">
            <span className="text-blue-400 font-medium">1.</span>
            <p>在上方输入 <strong>HS编码</strong>（如 2901 代表烃类化合物）、选择 <strong>进口/出口</strong> 和 <strong>年份</strong></p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-medium">2.</span>
            <p>点击"启动"开始从海关官网同步数据，系统将自动访问海关统计数据查询系统</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-medium">3.</span>
            <p>数据将按月份导出，存储到 <code className="bg-gray-700 px-1 rounded">customs_import</code> 或 <code className="bg-gray-700 px-1 rounded">customs_export</code> 表</p>
          </div>
          <div className="flex gap-3">
            <span className="text-blue-400 font-medium">4.</span>
            <p>首次运行可能需要较长时间，请耐心等待。如遇问题，请检查网络连接或联系管理员</p>
          </div>
        </div>
      </div>

      {/* 注意事项 */}
      <div className="bg-yellow-900/20 border border-yellow-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-yellow-400 mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          注意事项
        </h2>
        <ul className="space-y-2 text-yellow-200/80 text-sm">
          <li>• 海关官网有反爬虫保护，如遇访问失败请稍后重试</li>
          <li>• 建议在业务低峰期进行数据同步，避免对服务器造成压力</li>
          <li>• 数据仅供内部业务参考，请勿用于商业用途</li>
          <li>• 如需大批量数据，建议联系海关统计部门获取官方数据</li>
        </ul>
      </div>
    </div>
  );
}

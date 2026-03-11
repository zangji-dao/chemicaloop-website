'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  AlertCircle,
  Loader2,
  User,
  Mail,
  Calendar,
  MessageSquare,
  Plus,
  Package,
} from 'lucide-react';
import { useAdminLocale } from '@/contexts/AdminLocaleContext';
import { useToast } from '@/components/ui/Toast';
import { getAdminToken, getAdminUser } from '@/services/adminAuthService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SPURequest {
  id: number;
  cas: string;
  user_id: string;
  user_email: string;
  user_name: string;
  reason: string | null;
  reason_detail: string | null;
  status: 'pending' | 'approved' | 'created' | 'rejected';
  reject_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  spu_id?: string | null;
  user_email_full?: string;
  user_name_full?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminSPURequestsPage() {
  const { t, locale } = useAdminLocale();
  const { showToast } = useToast();
  
  const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
    pending: { label: locale === 'zh' ? '待审核' : 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20', icon: Clock },
    approved: { label: locale === 'zh' ? '待创建' : 'To Create', color: 'text-blue-400', bgColor: 'bg-blue-500/20', icon: AlertCircle },
    created: { label: locale === 'zh' ? '已创建' : 'Created', color: 'text-green-400', bgColor: 'bg-green-500/20', icon: Check },
    rejected: { label: locale === 'zh' ? '已拒绝' : 'Rejected', color: 'text-red-400', bgColor: 'bg-red-500/20', icon: X },
  };
  
  const reasonLabels: Record<string, string> = {
    purchase: locale === 'zh' ? '需要采购' : 'Need to Purchase',
    supply: locale === 'zh' ? '可以供货' : 'Can Supply',
    data_report: locale === 'zh' ? '查看数据报告' : 'View Data Report',
    other: locale === 'zh' ? '其他' : 'Other',
  };

  const [requests, setRequests] = useState<SPURequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, created: 0, rejected: 0 });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  
  // 确认通过弹窗
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [approvingRequest, setApprovingRequest] = useState<SPURequest | null>(null);
  
  // 拒绝弹窗
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<SPURequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [pagination.page, statusFilter]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        status: statusFilter,
      });

      const response = await fetch(`/api/spu-requests?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
        setStats(data.stats);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Fetch requests error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openApproveDialog = (request: SPURequest) => {
    if (request.status !== 'pending') {
      showToast(locale === 'zh' ? '该申请已处理' : 'This request has been processed', 'warning');
      fetchRequests();
      return;
    }
    setApprovingRequest(request);
    setShowApproveDialog(true);
  };

  const handleApprove = async () => {
    if (!approvingRequest) return;
    
    setProcessing(true);
    try {
      const token = getAdminToken();
      const adminUser = getAdminUser();
      
      if (!adminUser) {
        showToast('User not authenticated', 'error');
        setProcessing(false);
        return;
      }
      
      const response = await fetch('/api/spu-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: approvingRequest.id,
          action: 'approve',
          reviewerId: adminUser.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        showToast(locale === 'zh' ? '审核通过！' : 'Approved successfully!', 'success');
        setShowApproveDialog(false);
        fetchRequests();
      } else {
        showToast(data.error || 'Failed to approve', 'error');
        fetchRequests();
      }
    } catch (error) {
      console.error('Approve error:', error);
      showToast('Failed to approve', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (request: SPURequest) => {
    if (request.status !== 'pending' && request.status !== 'approved') {
      showToast(locale === 'zh' ? '该申请已处理' : 'This request has been processed', 'warning');
      fetchRequests();
      return;
    }
    setRejectingRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      showToast(locale === 'zh' ? '请输入拒绝原因' : 'Please enter reject reason', 'warning');
      return;
    }

    setProcessing(true);
    try {
      const token = getAdminToken();
      const adminUser = getAdminUser();
      
      if (!adminUser) {
        showToast('User not authenticated', 'error');
        setProcessing(false);
        return;
      }
      
      const response = await fetch('/api/spu-requests', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: rejectingRequest?.id,
          action: 'reject',
          rejectReason: rejectReason,
          reviewerId: adminUser.id,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setShowRejectModal(false);
        showToast(locale === 'zh' ? '已拒绝申请！' : 'Rejected successfully!', 'success');
        fetchRequests();
      } else {
        showToast(data.error || 'Failed to reject', 'error');
        fetchRequests();
      }
    } catch (error) {
      console.error('Reject error:', error);
      showToast('Failed to reject', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="w-6 h-6" />
            {locale === 'zh' ? 'SPU申请审核' : 'SPU Requests Review'}
          </h1>
          <p className="text-slate-400 mt-1">
            {locale === 'zh' 
              ? '审核用户提交的SPU添加申请' 
              : 'Review user submitted SPU addition requests'}
          </p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => { setStatusFilter('pending'); setPagination(prev => ({ ...prev, page: 1 })); }}
            className={`bg-slate-800/50 rounded-lg p-4 border transition-colors ${
              statusFilter === 'pending' ? 'border-yellow-500' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-400" />
              <div>
                <div className="text-sm text-slate-400">{locale === 'zh' ? '待审核' : 'Pending'}</div>
                <div className="text-2xl font-bold">{stats.pending}</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => { setStatusFilter('approved'); setPagination(prev => ({ ...prev, page: 1 })); }}
            className={`bg-slate-800/50 rounded-lg p-4 border transition-colors ${
              statusFilter === 'approved' ? 'border-blue-500' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-blue-400" />
              <div>
                <div className="text-sm text-slate-400">{locale === 'zh' ? '待创建' : 'To Create'}</div>
                <div className="text-2xl font-bold">{stats.approved}</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => { setStatusFilter('created'); setPagination(prev => ({ ...prev, page: 1 })); }}
            className={`bg-slate-800/50 rounded-lg p-4 border transition-colors ${
              statusFilter === 'created' ? 'border-green-500' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-green-400" />
              <div>
                <div className="text-sm text-slate-400">{locale === 'zh' ? '已创建' : 'Created'}</div>
                <div className="text-2xl font-bold">{stats.created}</div>
              </div>
            </div>
          </button>
          <button
            onClick={() => { setStatusFilter('rejected'); setPagination(prev => ({ ...prev, page: 1 })); }}
            className={`bg-slate-800/50 rounded-lg p-4 border transition-colors ${
              statusFilter === 'rejected' ? 'border-red-500' : 'border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center gap-3">
              <X className="h-8 w-8 text-red-400" />
              <div>
                <div className="text-sm text-slate-400">{locale === 'zh' ? '已拒绝' : 'Rejected'}</div>
                <div className="text-2xl font-bold">{stats.rejected}</div>
              </div>
            </div>
          </button>
        </div>

        {/* 申请列表 */}
        <div className="bg-slate-800/50 rounded-lg border border-slate-700 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <AlertCircle className="w-12 h-12 mb-4" />
              <p>{locale === 'zh' ? '暂无申请' : 'No requests'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {requests.map((request) => {
                const config = statusConfig[request.status];
                const StatusIcon = config.icon;
                
                return (
                  <div key={request.id} className="p-4 hover:bg-slate-700/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* CAS号和状态 */}
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-mono text-lg font-semibold">{request.cas}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${config.bgColor} ${config.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {config.label}
                          </span>
                        </div>
                        
                        {/* 用户信息 */}
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{request.user_name_full || request.user_name || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            <span>{request.user_email_full || request.user_email || '-'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(request.created_at)}</span>
                          </div>
                        </div>
                        
                        {/* 申请原因 */}
                        {request.reason && (
                          <div className="mt-2 text-sm">
                            <span className="text-slate-400">{locale === 'zh' ? '申请原因：' : 'Reason: '}</span>
                            <span className="text-slate-200">{reasonLabels[request.reason] || request.reason}</span>
                            {request.reason === 'other' && request.reason_detail && (
                              <span className="text-slate-400"> - {request.reason_detail}</span>
                            )}
                          </div>
                        )}
                        
                        {/* 拒绝原因 */}
                        {request.status === 'rejected' && request.reject_reason && (
                          <div className="mt-2 p-2 bg-red-500/10 rounded text-sm text-red-300">
                            <span className="font-medium">{locale === 'zh' ? '拒绝原因：' : 'Reject Reason: '}</span>
                            {request.reject_reason}
                          </div>
                        )}
                      </div>
                      
                      {/* 操作按钮 */}
                      {request.status === 'pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => openApproveDialog(request)}
                            disabled={processing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            {locale === 'zh' ? '通过' : 'Approve'}
                          </button>
                          <button
                            onClick={() => openRejectModal(request)}
                            disabled={processing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            {locale === 'zh' ? '拒绝' : 'Reject'}
                          </button>
                        </div>
                      )}
                      
                      {/* 已通过的申请显示新建产品按钮 */}
                      {request.status === 'approved' && (
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/products/upload?cas=${request.cas}`}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            {locale === 'zh' ? '新建产品' : 'Create Product'}
                          </Link>
                          <button
                            onClick={() => openRejectModal(request)}
                            disabled={processing}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-sm transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            {locale === 'zh' ? '拒绝' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
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
              {locale === 'zh' ? `第 ${pagination.page} / ${pagination.totalPages} 页` : `Page ${pagination.page} / ${pagination.totalPages}`}
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

      {/* 拒绝原因弹窗 */}
      {showRejectModal && rejectingRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-1/2 min-w-[300px] max-w-[500px]">
            <div className="border-b border-slate-700 px-5 py-3">
              <h2 className="text-base font-semibold text-white">
                {locale === 'zh' ? '拒绝申请' : 'Reject Request'}
              </h2>
              <p className="text-sm text-slate-400 mt-0.5 font-mono">
                CAS: {rejectingRequest.cas}
              </p>
            </div>
            
            <div className="p-5">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                {locale === 'zh' ? '拒绝原因' : 'Reject Reason'} <span className="text-red-400">*</span>
              </label>
              
              {/* 预设拒绝原因 */}
              <div className="flex flex-wrap gap-2 mb-3">
                {[
                  locale === 'zh' ? 'PubChem无此CAS号' : 'CAS not found in PubChem',
                  locale === 'zh' ? 'CAS号格式错误' : 'Invalid CAS format',
                  locale === 'zh' ? '信息不完整' : 'Incomplete information',
                  locale === 'zh' ? '重复申请' : 'Duplicate request',
                ].map((reason) => (
                  <button
                    key={reason}
                    onClick={() => setRejectReason(reason)}
                    className={`px-2 py-1 text-xs rounded transition-colors ${
                      rejectReason === reason
                        ? 'bg-red-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={locale === 'zh' 
                  ? '请输入拒绝原因或选择上方预设原因...' 
                  : 'Enter reject reason or select from presets above...'}
                rows={3}
                className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            
            <div className="border-t border-slate-700 px-5 py-3 flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm transition-colors h-8"
              >
                {locale === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectReason.trim()}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors disabled:opacity-50 h-8"
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
                {locale === 'zh' ? '确认拒绝' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 确认通过弹窗 */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent className="bg-slate-800 border-slate-700 text-white w-[320px] max-w-[90vw]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white text-base">
              {locale === 'zh' ? '确认通过' : 'Confirm Approval'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 text-sm">
              {locale === 'zh' 
                ? `确认通过 CAS: ${approvingRequest?.cas} 的申请？`
                : `Approve request for CAS: ${approvingRequest?.cas}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 h-9 px-4">
              {locale === 'zh' ? '取消' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleApprove();
              }}
              disabled={processing}
              className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 h-9 px-4"
            >
              {processing ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {locale === 'zh' ? '处理中' : 'Processing'}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <Check className="w-4 h-4" />
                  {locale === 'zh' ? '确认' : 'Approve'}
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

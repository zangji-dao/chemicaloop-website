'use client';

import { useEffect, useState, useRef } from 'react';
import { useDebouncedCallback } from '@/hooks/useDebounce';
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  User,
  Shield,
  Crown,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Mail,
  MapPin,
  Building,
  X,
  Loader2,
} from 'lucide-react';
import { getAdminToken } from '@/services/adminAuthService';

interface UserItem {
  id: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  created_at: string;
  avatar_url?: string;
  phone?: string;
  country?: string;
  city?: string;
  wechat?: string;
  whatsapp?: string;
  telegram?: string;
  linkedin?: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const roleConfig: Record<string, { label: string; color: string; icon: typeof User }> = {
  user: { label: '普通用户', color: 'bg-slate-500', icon: User },
  agent: { label: '代理商', color: 'bg-blue-500', icon: Shield },
  admin: { label: '管理员', color: 'bg-purple-500', icon: Crown },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // 搜索触发器（用于触发搜索）
  const [searchTrigger, setSearchTrigger] = useState(0);

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, searchTrigger]);
  
  // 防抖搜索 - 300ms 延迟
  const debouncedSearch = useDebouncedCallback(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    setSearchTrigger(prev => prev + 1);
  }, 300);
  
  // 当搜索内容变化时触发防抖搜索
  useEffect(() => {
    debouncedSearch();
  }, [search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = getAdminToken();
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination({ ...pagination, page: 1 });
    fetchUsers();
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    setUpdating(true);
    try {
      const token = getAdminToken();
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await response.json();

      if (data.success) {
        // Update local state
        setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
        if (selectedUser?.id === userId) {
          setSelectedUser({ ...selectedUser, role: newRole });
        }
      }
    } catch (error) {
      console.error('Failed to update role:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const RoleIcon = ({ role }: { role: string }) => {
    const config = roleConfig[role] || roleConfig.user;
    const Icon = config.icon;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">用户管理</h1>
          <p className="text-slate-400 mt-1">管理系统中的所有用户账号</p>
        </div>

        {/* Search and Filter */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索用户..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            搜索
          </button>

          <div className="relative">
            <button
              onClick={() => setShowRoleFilter(!showRoleFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                roleFilter
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
              }`}
            >
              <Filter className="h-4 w-4" />
              <span className="hidden md:inline">
                {roleFilter ? roleConfig[roleFilter]?.label : '角色筛选'}
              </span>
            </button>

            {showRoleFilter && (
              <div className="absolute right-0 top-full mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10">
                <button
                  onClick={() => {
                    setRoleFilter('');
                    setShowRoleFilter(false);
                  }}
                  className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 rounded-t-lg"
                >
                  全部用户
                </button>
                {Object.entries(roleConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setRoleFilter(key);
                      setShowRoleFilter(false);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center gap-2"
                  >
                    <config.icon className="h-4 w-4" />
                    {config.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  用户信息
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  角色
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  验证状态
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  地区
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  注册时间
                </th>
                <th className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                      <span className="text-slate-400">加载中...</span>
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    暂无用户数据
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const config = roleConfig[user.role] || roleConfig.user;
                  return (
                    <tr key={user.id} className="hover:bg-slate-700/30">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url}
                                alt={user.name}
                                className="w-10 h-10 rounded-full"
                                loading="lazy"
                              />
                            ) : (
                              <span className="text-white font-medium">
                                {user.name?.charAt(0).toUpperCase() || 'U'}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{user.name || '未设置'}</p>
                            <p className="text-slate-400 text-sm">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} text-white`}
                        >
                          <RoleIcon role={user.role} />
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {user.verified ? (
                          <span className="inline-flex items-center gap-1 text-green-400">
                            <CheckCircle className="h-4 w-4" />
                            已验证
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <XCircle className="h-4 w-4" />
                            未验证
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300">
                          {[user.country, user.city].filter(Boolean).join(', ') || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-300">{formatDate(user.created_at)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            title="查看详情"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              显示 {(pagination.page - 1) * pagination.limit + 1} -{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} 条，共{' '}
              {pagination.total} 条
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                disabled={pagination.page === 1}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPagination({ ...pagination, page: pageNum })}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      pagination.page === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                disabled={pagination.page === pagination.totalPages}
                className="p-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h2 className="text-xl font-semibold text-white">用户详情</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-slate-600 rounded-full flex items-center justify-center">
                  {selectedUser.avatar_url ? (
                    <img
                      src={selectedUser.avatar_url}
                      alt={selectedUser.name}
                      className="w-16 h-16 rounded-full"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-2xl text-white font-medium">
                      {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white">{selectedUser.name || '未设置'}</h3>
                  <p className="text-slate-400">{selectedUser.email}</p>
                </div>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">角色</p>
                  <p className="text-white flex items-center gap-2">
                    <RoleIcon role={selectedUser.role} />
                    {roleConfig[selectedUser.role]?.label || '未知'}
                  </p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">验证状态</p>
                  <p className="text-white flex items-center gap-2">
                    {selectedUser.verified ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-400" />
                        已验证
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 text-slate-400" />
                        未验证
                      </>
                    )}
                  </p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">
                    <MapPin className="h-3 w-3 inline mr-1" />
                    地区
                  </p>
                  <p className="text-white">
                    {[selectedUser.country, selectedUser.city].filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">
                    <Mail className="h-3 w-3 inline mr-1" />
                    电话
                  </p>
                  <p className="text-white">{selectedUser.phone || '-'}</p>
                </div>
                <div className="bg-slate-700/30 rounded-lg p-4">
                  <p className="text-slate-400 text-sm mb-1">注册时间</p>
                  <p className="text-white">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>

              {/* Instant Messaging Info */}
              <div className="border-t border-slate-700 pt-6">
                <h4 className="text-sm font-medium text-slate-300 mb-3">即时通讯</h4>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { key: 'wechat', label: '微信', icon: '💬' },
                    { key: 'whatsapp', label: 'WhatsApp', icon: '📱' },
                    { key: 'telegram', label: 'Telegram', icon: '✈️' },
                    { key: 'linkedin', label: 'LinkedIn', icon: '💼' },
                  ].map(({ key, label, icon }) => (
                    <div
                      key={key}
                      className="bg-slate-700/30 rounded-lg p-3 flex items-center gap-2"
                    >
                      <span className="text-lg">{icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-400 text-xs">{label}</p>
                        <p className="text-white text-sm truncate">
                          {(selectedUser as any)[key] || '-'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Role Change */}
              <div className="border-t border-slate-700 pt-6">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  修改用户角色
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(roleConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleRoleChange(selectedUser.id, key)}
                      disabled={updating || selectedUser.role === key}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedUser.role === key
                          ? `${config.color} text-white`
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      } disabled:opacity-50`}
                    >
                      {updating && selectedUser.role !== key ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <config.icon className="h-4 w-4" />
                      )}
                      {config.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminToken, getAdminUser } from '@/services/adminAuthService';
import {
  Users,
  Package,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Activity,
  Shield,
  UserPlus,
  PackagePlus,
  MessageSquare,
} from 'lucide-react';

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalProducts: number;
  pendingInquiries: number;
}

interface Activity {
  type: string;
  user_email: string;
  user_name: string;
  time: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const activityConfig: Record<string, { label: string; icon: typeof Users; color: string }> = {
  user_registered: { label: '新用户注册', icon: UserPlus, color: 'text-blue-400' },
  product_added: { label: 'SPU上架', icon: PackagePlus, color: 'text-purple-400' },
  inquiry_sent: { label: '发送询价', icon: MessageSquare, color: 'text-orange-400' },
};

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    activeUsers: 0,
    totalProducts: 0,
    pendingInquiries: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const userData = getAdminUser();
    if (userData) {
      setUser(userData);
    }
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = getAdminToken();
      const response = await fetch('/api/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        setRecentActivity(data.recentActivity || []);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes} 分钟前`;
    if (hours < 24) return `${hours} 小时前`;
    return `${days} 天前`;
  };

  const statCards = [
    {
      title: '总用户数',
      value: stats.totalUsers,
      icon: Users,
      color: 'blue',
    },
    {
      title: '活跃用户',
      value: stats.activeUsers,
      icon: Activity,
      color: 'green',
    },
    {
      title: '产品数量',
      value: stats.totalProducts,
      icon: Package,
      color: 'purple',
    },
    {
      title: '待处理询价',
      value: stats.pendingInquiries,
      icon: FileText,
      color: 'orange',
    },
  ];

  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    purple: 'bg-purple-500/10 text-purple-400',
    orange: 'bg-orange-500/10 text-orange-400',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              欢迎回来，{user?.name || 'Admin'}
            </h1>
            <p className="text-blue-100 mt-1">
              这是您的管理后台仪表盘，您可以在这里查看和管理所有数据。
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.title}
            className="bg-slate-800 border border-slate-700 rounded-xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${colorClasses[stat.color]}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-white">
                {loading ? '...' : stat.value.toLocaleString()}
              </p>
              <p className="text-slate-400 text-sm mt-1">{stat.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => router.push('/admin/users')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Users className="h-8 w-8 text-blue-400" />
            <span className="text-slate-300">用户管理</span>
          </button>
          <button
            onClick={() => router.push('/admin/products')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <Package className="h-8 w-8 text-purple-400" />
            <span className="text-slate-300">产品审核</span>
          </button>
          <button
            onClick={() => router.push('/admin/inquiries')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <FileText className="h-8 w-8 text-orange-400" />
            <span className="text-slate-300">询价管理</span>
          </button>
          <button
            onClick={() => router.push('/admin/settings')}
            className="flex flex-col items-center gap-2 p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <DollarSign className="h-8 w-8 text-green-400" />
            <span className="text-slate-300">系统设置</span>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">最近活动</h2>
        {recentActivity.length > 0 ? (
          <div className="space-y-3">
            {recentActivity.map((activity, index) => {
              const config = activityConfig[activity.type] || { label: activity.type, icon: Activity, color: 'text-slate-400' };
              const Icon = config.icon;
              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div>
                      <p className="text-white text-sm">{config.label}</p>
                      <p className="text-slate-400 text-xs">{activity.user_name || activity.user_email}</p>
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs">{formatTime(activity.time)}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            {loading ? '加载中...' : '暂无活动记录'}
          </div>
        )}
      </div>
    </div>
  );
}

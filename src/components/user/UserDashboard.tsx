'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';
import { Mail, LogOut, LayoutDashboard, Package, MessageSquare, Link as LinkIcon, User, Clock, CheckCircle } from 'lucide-react';
import { getToken } from '@/services/authService';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    totalInquiries: 0,
    pendingInquiries: 0,
    repliedInquiries: 0,
  });

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* 侧边栏 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col items-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                  {user.role}
                </span>
              </div>

              <nav className="space-y-1">
                <Link
                  href="/user/dashboard"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 text-blue-700 font-medium"
                >
                  <LayoutDashboard className="h-5 w-5" />
                  Overview
                </Link>
                <Link
                  href="/user/inquiries"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
                >
                  <MessageSquare className="h-5 w-5" />
                  My Inquiries
                </Link>
                {user.role === 'AGENT' && (
                  <>
                    <Link
                      href="/agent/products"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      <Package className="h-5 w-5" />
                      My Products
                    </Link>
                    <Link
                      href="/agent/link"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100"
                    >
                      <LinkIcon className="h-5 w-5" />
                      Referral Link
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>

          {/* 主内容区 */}
          <div className="lg:col-span-3">
            {/* 统计卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Total Inquiries</h3>
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.totalInquiries}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Pending</h3>
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingInquiries}</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-gray-600">Replied</h3>
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">{stats.repliedInquiries}</p>
              </div>
            </div>

            {/* 最近询盘 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Inquiries</h2>
              <Link
                href="/user/inquiries"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View All →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

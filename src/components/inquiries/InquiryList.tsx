'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Package, Mail, Phone, Clock, CheckCircle, XCircle, Clock3 } from 'lucide-react';
import { getToken } from '@/services/authService';

interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  productNameEn: string;
  productImageUrl?: string;
  quantity: number;
  targetPrice?: number;
  message: string;
  status: 'PENDING' | 'REPLIED' | 'CLOSED';
  createdAt: string;
  repliedAt?: string;
  agentResponse?: string;
}

export default function InquiryList() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'REPLIED' | 'CLOSED'>('ALL');

  useEffect(() => {
    if (!user) return;
    fetchInquiries();
  }, [user, filter]);

  const fetchInquiries = async () => {
    try {
      const response = await fetch(`/api/inquiries?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      const data = await response.json();
      setInquiries(data);
    } catch (error) {
      console.error('Error fetching inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: Inquiry['status']) => {
    switch (status) {
      case 'PENDING':
        return <Clock3 className="h-5 w-5 text-yellow-600" />;
      case 'REPLIED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'CLOSED':
        return <XCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusText = (status: Inquiry['status']) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'REPLIED':
        return 'Replied';
      case 'CLOSED':
        return 'Closed';
    }
  };

  const getStatusColor = (status: Inquiry['status']) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REPLIED':
        return 'bg-green-100 text-green-800';
      case 'CLOSED':
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 过滤器 */}
      <div className="flex gap-2 bg-white p-1 rounded-lg shadow-sm">
        {(['ALL', 'PENDING', 'REPLIED', 'CLOSED'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* 询盘列表 */}
      {inquiries.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Inquiries Found</h3>
          <p className="text-gray-600">
            {filter === 'ALL' ? 'You haven\'t submitted any inquiries yet.' : `No ${filter.toLowerCase()} inquiries.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {inquiries.map((inquiry) => (
            <div
              key={inquiry.id}
              className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex gap-4">
                {/* 产品图片 */}
                {inquiry.productImageUrl ? (
                  <img
                    src={inquiry.productImageUrl}
                    alt={inquiry.productName}
                    className="w-20 h-20 object-contain rounded-lg bg-gray-100 flex-shrink-0"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}

                {/* 询盘信息 */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {inquiry.productNameEn}
                      </h3>
                      {inquiry.productName !== inquiry.productNameEn && (
                        <p className="text-sm text-gray-600">{inquiry.productName}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}>
                      {getStatusIcon(inquiry.status)}
                      {getStatusText(inquiry.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-500">Quantity: </span>
                      <span className="font-medium">{inquiry.quantity}kg</span>
                    </div>
                    {inquiry.targetPrice && (
                      <div className="text-sm">
                        <span className="text-gray-500">Target Price: </span>
                        <span className="font-medium">${inquiry.targetPrice}/kg</span>
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                    {inquiry.message}
                  </p>

                  {/* 代理回复 */}
                  {inquiry.agentResponse && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-1">
                        <Mail className="h-4 w-4" />
                        <span>Agent Response</span>
                      </div>
                      <p className="text-sm text-blue-800">{inquiry.agentResponse}</p>
                    </div>
                  )}

                  {/* 时间信息 */}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Submitted: {new Date(inquiry.createdAt).toLocaleDateString()}</span>
                    </div>
                    {inquiry.repliedAt && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Replied: {new Date(inquiry.repliedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

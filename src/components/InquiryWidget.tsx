'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, FileText, Clock, Check, ExternalLink, Package, User, Phone, MessageSquare } from 'lucide-react';

interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  specifications: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'replied' | 'completed';
  createdAt: Date;
  repliedAt?: Date;
  repliedBy?: string;
  replyContent?: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierEmail?: string;
}

export default function InquiryWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'sent' | 'replies'>('sent');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [loading, setLoading] = useState(false);

  const getUserId = () => {
    if (typeof window === 'undefined') return null;
    // 使用 authService 统一获取用户信息
    const userStr = localStorage.getItem('auth_user');
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user?.id || null;
    } catch {
      return null;
    }
  };

  // 加载询价列表
  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    const userId = getUserId();
    if (!userId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/inquiries?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Loaded inquiries:', data.data);
        setInquiries((data.data || []).map((item: any) => {
          const inquiry = {
            ...item,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            repliedAt: item.repliedAt ? new Date(item.repliedAt) : undefined,
          };
          console.log('Processed inquiry:', inquiry);
          return inquiry;
        }));
      }
    } catch (error) {
      console.error('Error loading inquiries:', error);
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据（用于演示）
  const getMockInquiries = (): Inquiry[] => {
    return [
      {
        id: 'inq-001',
        productId: 'prod-001',
        productName: 'Ethylene Glycol',
        specifications: 'Industrial Grade, 99.8% purity',
        quantity: 1000,
        unit: 'MT',
        status: 'replied',
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        repliedAt: new Date(Date.now() - 43200000), // 12 hours ago
        repliedBy: 'ChemCorp India',
        replyContent: 'We can supply the required quantity. Price: $850/MT. Delivery within 2 weeks.',
        supplierName: 'ChemCorp India',
        supplierPhone: '+919876543210',
        supplierEmail: 'sales@chemcorp.in',
      },
      {
        id: 'inq-002',
        productId: 'prod-002',
        productName: 'Methanol',
        specifications: 'ACS Grade, 99.9% purity',
        quantity: 500,
        unit: 'MT',
        status: 'pending',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
      },
      {
        id: 'inq-003',
        productId: 'prod-003',
        productName: 'Sulfuric Acid',
        specifications: 'Technical Grade, 98% purity',
        quantity: 200,
        unit: 'MT',
        status: 'completed',
        createdAt: new Date(Date.now() - 604800000), // 7 days ago
        repliedAt: new Date(Date.now() - 518400000), // 6 days ago
        repliedBy: 'Acid Solutions Ltd',
        replyContent: 'Order confirmed. Production started.',
        supplierName: 'Acid Solutions Ltd',
        supplierPhone: '+919876543211',
        supplierEmail: 'info@acidsolutions.com',
      },
    ];
  };

  const formatDate = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString();
  };

  const formatDateTime = (date: Date) => {
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pending', bg: 'bg-yellow-100', text: 'text-yellow-800' },
      replied: { label: 'Replied', bg: 'bg-green-100', text: 'text-green-800' },
      completed: { label: 'Completed', bg: 'bg-blue-100', text: 'text-blue-800' },
    };
    const s = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${s.bg} ${s.text}`}>{s.label}</span>;
  };

  const openWhatsApp = (inquiry: Inquiry) => {
    if (!inquiry.supplierPhone) {
      alert('No WhatsApp number available');
      return;
    }

    try {
      // 构建消息
      const message = encodeURIComponent(
        `Hi, this is regarding my inquiry for ${inquiry.productName} (Quantity: ${inquiry.quantity} ${inquiry.unit}, Specifications: ${inquiry.specifications}). I'd like to discuss further.`
      );

      // 格式化电话号码（去掉 + 号和空格）
      const phone = inquiry.supplierPhone.replace(/[\s+]/g, '');

      // 打开 WhatsApp
      const whatsappUrl = `https://wa.me/${phone}?text=${message}`;
      window.open(whatsappUrl, '_blank');
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      alert('Failed to open WhatsApp');
    }
  };

  const handleSendNewInquiry = () => {
    // 跳转到产品列表页面
    window.location.href = '/products';
  };

  const sentInquiries = inquiries.filter(i => true); // 所有都是发出的询价
  const repliedInquiries = inquiries.filter(i => i.status === 'replied' || i.status === 'completed');
  const pendingInquiries = inquiries.filter(i => i.status === 'pending');

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-80 z-[99998] w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110 border-2 border-white flex items-center justify-center group"
      >
        <FileText className="h-6 w-6" />
        {pendingInquiries.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-yellow-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white animate-pulse">
            {pendingInquiries.length > 9 ? '9+' : pendingInquiries.length}
          </span>
        )}
        {repliedInquiries.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center border-2 border-white animate-pulse" style={{ top: '28px', right: '-6px' }}>
            {repliedInquiries.length > 9 ? '9+' : repliedInquiries.length}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-80 z-[99998] w-[700px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col border border-gray-2 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6" />
            <h2 className="font-bold text-lg">My Inquiries</h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/20 rounded-full"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={() => setActiveTab('sent')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'sent'
                ? 'text-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Sent ({sentInquiries.length})
            {activeTab === 'sent' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab('replies')}
            className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
              activeTab === 'replies'
                ? 'text-white'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            Replies ({repliedInquiries.length})
            {activeTab === 'replies' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedInquiry ? (
          // 询价详情视图
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 mb-3"
              >
                ← Back to list
              </button>

              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedInquiry.productName || 'Unknown Product'}</h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    {getStatusBadge(selectedInquiry.status || 'pending')}
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(selectedInquiry.createdAt || new Date())}
                    </span>
                  </div>
                </div>
              </div>

              {/* 询价详情 */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Package className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Specifications</div>
                    <div className="font-medium text-gray-900">{selectedInquiry.specifications || 'N/A'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="text-sm text-gray-600 mb-1">Quantity</div>
                    <div className="font-medium text-gray-900">
                      {selectedInquiry.quantity || 0} {selectedInquiry.unit || ''}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 回复信息 */}
            {selectedInquiry.status === 'replied' || selectedInquiry.status === 'completed' ? (
              <div className="flex-1 overflow-y-auto p-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Reply Received</span>
                    </div>
                    {selectedInquiry.repliedAt && (
                      <span className="text-sm text-green-600">{formatDateTime(selectedInquiry.repliedAt)}</span>
                    )}
                  </div>

                  {selectedInquiry.supplierName && (
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <User className="h-4 w-4 text-green-600" />
                      <span className="font-medium text-green-900">{selectedInquiry.supplierName}</span>
                    </div>
                  )}

                  {selectedInquiry.replyContent && (
                    <div className="text-sm text-green-800 mb-4 p-3 bg-white rounded-lg border border-green-100">
                      {selectedInquiry.replyContent}
                    </div>
                  )}

                  {/* WhatsApp 按钮 */}
                  {selectedInquiry.supplierPhone && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openWhatsApp(selectedInquiry)}
                        className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        <span className="font-medium">Contact via WhatsApp</span>
                      </button>
                      {selectedInquiry.supplierEmail && (
                        <a
                          href={`mailto:${selectedInquiry.supplierEmail}?subject=Inquiry: ${selectedInquiry.productName}`}
                          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <span className="font-medium">Send Email</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                  <Clock className="h-16 w-16 mx-auto mb-3 text-yellow-500" />
                  <h3 className="font-semibold text-gray-900 mb-2">Waiting for Reply</h3>
                  <p className="text-sm text-gray-500">We'll notify you when the supplier responds.</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // 询价列表视图
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                Loading...
              </div>
            ) : (activeTab === 'sent' ? sentInquiries : repliedInquiries).length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-8 text-gray-500">
                <FileText className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                <p className="mb-4">No {activeTab === 'sent' ? 'inquiries' : 'replies'} yet</p>
                {activeTab === 'sent' && (
                  <button
                    onClick={handleSendNewInquiry}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Browse Products to Send Inquiry
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {(activeTab === 'sent' ? sentInquiries : repliedInquiries).map(inquiry => (
                  <div
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{inquiry.productName}</h3>
                        <p className="text-sm text-gray-500 truncate">{inquiry.specifications}</p>
                      </div>
                      {getStatusBadge(inquiry.status)}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {inquiry.quantity} {inquiry.unit}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        {!selectedInquiry && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleSendNewInquiry}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Send className="h-5 w-5" />
              <span className="font-medium">Send New Inquiry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

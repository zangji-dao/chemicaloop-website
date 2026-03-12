'use client';

import { useState, useEffect } from 'react';
import { FileText, MessageSquare, Send, Clock, Check, User } from 'lucide-react';

interface Inquiry {
  id: string;
  productId: string;
  productName: string;
  specifications: string;
  quantity: number;
  unit: string;
  status: 'pending' | 'replied' | 'completed';
  createdAt: string;
  repliedAt?: string;
  repliedBy?: string;
  replyContent?: string;
  supplierName?: string;
  supplierPhone?: string;
  supplierEmail?: string;
}

export default function InquiryAdminPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyForm, setReplyForm] = useState({
    repliedBy: 'Platform',
    supplierName: '',
    supplierPhone: '',
    supplierEmail: '',
    replyContent: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadInquiries();
  }, []);

  const loadInquiries = async () => {
    try {
      const response = await fetch('/api/private/shared/inquiries?userId=all');
      if (response.ok) {
        const data = await response.json();
        setInquiries(data.data || []);
      }
    } catch (error) {
      console.error('Error loading inquiries:', error);
    }
  };

  const handleReply = async () => {
    if (!selectedInquiry || !replyForm.replyContent) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/private/shared/inquiries/${selectedInquiry.id}/reply`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(replyForm),
      });

      if (response.ok) {
        alert('Reply sent successfully');
        setSelectedInquiry(null);
        setReplyForm({
          repliedBy: 'Platform',
          supplierName: '',
          supplierPhone: '',
          supplierEmail: '',
          replyContent: '',
        });
        loadInquiries();
      } else {
        alert('Failed to send reply');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingInquiries = inquiries.filter(i => i.status === 'pending');
  const repliedInquiries = inquiries.filter(i => i.status === 'replied' || i.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Inquiry Management</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{inquiries.length}</div>
                <div className="text-sm text-gray-500">Total Inquiries</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{pendingInquiries.length}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{repliedInquiries.length}</div>
                <div className="text-sm text-gray-500">Replied</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Inquiry List */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Pending Inquiries</h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {pendingInquiries.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No pending inquiries
                </div>
              ) : (
                pendingInquiries.map(inquiry => (
                  <div
                    key={inquiry.id}
                    onClick={() => setSelectedInquiry(inquiry)}
                    className={`p-4 cursor-pointer transition-colors ${
                      selectedInquiry?.id === inquiry.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <h3 className="font-semibold text-gray-900">{inquiry.productName}</h3>
                    <p className="text-sm text-gray-600 mt-1">{inquiry.specifications}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-gray-600">
                        Qty: {inquiry.quantity} {inquiry.unit}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(inquiry.createdAt)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reply Form */}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold text-gray-900">Reply to Inquiry</h2>
            </div>
            <div className="p-4">
              {selectedInquiry ? (
                <div className="space-y-4">
                  {/* Inquiry Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedInquiry.productName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{selectedInquiry.specifications}</p>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Quantity:</span> {selectedInquiry.quantity} {selectedInquiry.unit}
                    </div>
                    <div className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Received: {formatDate(selectedInquiry.createdAt)}
                    </div>
                  </div>

                  {/* Reply Form */}
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reply From
                      </label>
                      <select
                        value={replyForm.repliedBy}
                        onChange={(e) => setReplyForm({...replyForm, repliedBy: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Platform">Platform</option>
                        <option value="Supplier">Supplier</option>
                      </select>
                    </div>

                    {replyForm.repliedBy === 'Supplier' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Name *
                          </label>
                          <input
                            type="text"
                            value={replyForm.supplierName}
                            onChange={(e) => setReplyForm({...replyForm, supplierName: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter supplier name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Phone (WhatsApp)
                          </label>
                          <input
                            type="text"
                            value={replyForm.supplierPhone}
                            onChange={(e) => setReplyForm({...replyForm, supplierPhone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="+919876543210"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Supplier Email
                          </label>
                          <input
                            type="email"
                            value={replyForm.supplierEmail}
                            onChange={(e) => setReplyForm({...replyForm, supplierEmail: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="sales@supplier.com"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reply Content *
                      </label>
                      <textarea
                        value={replyForm.replyContent}
                        onChange={(e) => setReplyForm({...replyForm, replyContent: e.target.value})}
                        rows={6}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter your reply..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleReply}
                        disabled={loading || !replyForm.replyContent}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Sending...' : 'Send Reply'}
                      </button>
                      <button
                        onClick={() => setSelectedInquiry(null)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="h-16 w-16 mx-auto mb-3 text-gray-300" />
                  <p>Select an inquiry to reply</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

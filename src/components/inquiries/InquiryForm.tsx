'use client';

import { useState } from 'react';
import { Send, X, Package, Mail, Phone, MessageSquare } from 'lucide-react';

interface InquiryFormProps {
  productId: string;
  productName: string;
  onClose?: () => void;
}

export default function InquiryForm({ productId, productName, onClose }: InquiryFormProps) {
  const [formData, setFormData] = useState({
    quantity: '',
    targetPrice: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          productId,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit inquiry');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose?.();
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      alert('Failed to submit inquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Send className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Inquiry Submitted!</h3>
        <p className="text-gray-600">
          We'll get back to you within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Send Inquiry</h2>
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="h-4 w-4" />
            <p className="text-sm">{productName}</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Quantity (kg) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min="1"
            required
            value={formData.quantity}
            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
            placeholder="Enter quantity"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Price ($/kg)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.targetPrice}
            onChange={(e) => setFormData({ ...formData, targetPrice: e.target.value })}
            placeholder="Optional"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Message <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Additional requirements or questions..."
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        <div className="bg-blue-50 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-medium text-blue-900">Contact Information:</p>
          <div className="flex items-center gap-2 text-blue-800">
            <Mail className="h-4 w-4" />
            <span>Your registered email</span>
          </div>
          <div className="flex items-center gap-2 text-blue-800">
            <Phone className="h-4 w-4" />
            <span>Your registered phone</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              <span>Submit Inquiry</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

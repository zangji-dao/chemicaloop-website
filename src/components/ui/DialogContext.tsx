'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, AlertOctagon } from 'lucide-react';

// ==================== Toast ====================
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

// ==================== Confirm Dialog ====================
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

interface ConfirmDialog extends ConfirmOptions {
  id: string;
  resolve: (value: boolean) => void;
}

// ==================== Context ====================
interface DialogContextType {
  // Toast
  toast: {
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
  
  // Confirm
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}

// 便捷 hooks
export function useToast() {
  const { toast } = useDialog();
  return toast;
}

export function useConfirm() {
  const { confirm } = useDialog();
  return confirm;
}

interface DialogProviderProps {
  children: ReactNode;
}

export function DialogProvider({ children }: DialogProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);

  // Toast 方法
  const addToast = useCallback((message: string, type: ToastType) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toastMethods = {
    success: (message: string) => addToast(message, 'success'),
    error: (message: string) => addToast(message, 'error'),
    warning: (message: string) => addToast(message, 'warning'),
    info: (message: string) => addToast(message, 'info'),
  };

  // Confirm 方法
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setConfirmDialog({
        id: crypto.randomUUID(),
        ...options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback((value: boolean) => {
    if (confirmDialog) {
      confirmDialog.resolve(value);
      setConfirmDialog(null);
    }
  }, [confirmDialog]);

  return (
    <DialogContext.Provider value={{ toast: toastMethods, confirm }}>
      {children}
      
      {/* Toast Container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-[10000] flex flex-col gap-2 max-w-sm">
          {toasts.map(t => (
            <ToastItem key={t.id} toast={t} onClose={() => removeToast(t.id)} />
          ))}
        </div>
      )}
      
      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialogUI
          dialog={confirmDialog}
          onConfirm={() => handleConfirm(true)}
          onCancel={() => handleConfirm(false)}
        />
      )}
    </DialogContext.Provider>
  );
}

// ==================== Toast Item ====================
interface ToastItemProps {
  toast: Toast;
  onClose: () => void;
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    warning: 'bg-yellow-50 border-yellow-200',
    info: 'bg-blue-50 border-blue-200',
  };

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right duration-200 ${bgColors[toast.type]}`}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-gray-700 whitespace-pre-wrap">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

// ==================== Confirm Dialog UI ====================
interface ConfirmDialogUIProps {
  dialog: ConfirmDialog;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDialogUI({ dialog, onConfirm, onCancel }: ConfirmDialogUIProps) {
  const icons = {
    danger: <AlertOctagon className="h-6 w-6 text-red-500" />,
    warning: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
    info: <Info className="h-6 w-6 text-blue-500" />,
  };

  const confirmBtnColors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700',
    info: 'bg-blue-600 hover:bg-blue-700',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-auto min-w-[320px] max-w-[400px] animate-in zoom-in-95 duration-200">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              {icons[dialog.type || 'info']}
            </div>
            <div className="flex-1 min-w-0">
              {dialog.title && (
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  {dialog.title}
                </h3>
              )}
              <p className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                {dialog.message}
              </p>
            </div>
          </div>
        </div>
        <div className="px-5 py-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2.5 rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {dialog.cancelText || '取消'}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg transition-colors font-medium ${confirmBtnColors[dialog.type || 'info']}`}
          >
            {dialog.confirmText || '确认'}
          </button>
        </div>
      </div>
    </div>
  );
}

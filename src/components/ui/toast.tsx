'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertTriangle, Wifi, WifiOff } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: Toast['type'], message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, message, duration };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 400,
        }}
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle style={{ width: 20, height: 20, color: '#2F7A54' }} />,
    error: <XCircle style={{ width: 20, height: 20, color: '#DC2626' }} />,
    warning: <AlertTriangle style={{ width: 20, height: 20, color: '#BD6809' }} />,
    info: <WifiOff style={{ width: 20, height: 20, color: '#2F4731' }} />,
  };

  const colors = {
    success: { bg: '#F0FDF4', border: '#2F7A54' },
    error: { bg: '#FEF2F2', border: '#DC2626' },
    warning: { bg: '#FFFBEB', border: '#BD6809' },
    info: { bg: '#F5F5F0', border: '#2F4731' },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      style={{
        background: colors[toast.type].bg,
        border: `2px solid ${colors[toast.type].border}`,
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        cursor: 'pointer',
      }}
      onClick={onClose}
    >
      {icons[toast.type]}
      <div style={{ flex: 1, color: '#2F4731', fontSize: '0.9rem', fontWeight: 500 }}>
        {toast.message}
      </div>
    </motion.div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

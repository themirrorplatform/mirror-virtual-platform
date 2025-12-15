import { motion, AnimatePresence } from 'motion/react';
import { Check, AlertCircle, Info, X } from 'lucide-react';
import { createContext, useContext, useState, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'neutral';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
  title?: string;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = 'neutral', duration = 4000, title?: string) => {
    const id = Math.random().toString(36).substring(7);
    const toast = { id, message, type, duration, title };
    
    setToasts(prev => [...prev, toast]);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const styles = {
    success: {
      icon: Check,
      iconColor: 'text-[var(--color-success)]',
      border: 'border-[var(--color-success)]',
      bg: 'bg-[rgba(52, 199, 89, 0.1)]'
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-[var(--color-error)]',
      border: 'border-[var(--color-error)]',
      bg: 'bg-[rgba(255, 59, 48, 0.1)]'
    },
    info: {
      icon: Info,
      iconColor: 'text-[var(--color-accent-blue)]',
      border: 'border-[var(--color-accent-blue)]',
      bg: 'bg-[rgba(58, 139, 255, 0.1)]'
    },
    neutral: {
      icon: Info,
      iconColor: 'text-[var(--color-text-secondary)]',
      border: 'border-[var(--color-border-subtle)]',
      bg: 'bg-[var(--color-surface-emphasis)]'
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed bottom-10 right-10 z-[100] flex flex-col gap-4 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ type: 'spring', damping: 32, stiffness: 400 }}
              className={`flex items-center gap-5 px-7 py-5 rounded-2xl backdrop-blur-xl shadow-ambient-lg border ${styles[toast.type].border} ${styles[toast.type].bg} pointer-events-auto`}
            >
              {/* Icon */}
              <div className={`flex-shrink-0 ${styles[toast.type].iconColor}`}>
                {styles[toast.type].icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {toast.title && (
                  <div className="text-base font-medium text-[var(--color-text-primary)] mb-1.5">
                    {toast.title}
                  </div>
                )}
                <div className="text-base text-[var(--color-text-secondary)] leading-[1.6]">
                  {toast.message}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 p-2 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors"
                aria-label="Dismiss"
              >
                <X size={18} className="text-[var(--color-text-muted)]" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
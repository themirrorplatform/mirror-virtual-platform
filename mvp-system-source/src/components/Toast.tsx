import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string;
  variant?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export function Toast({ message, variant = 'info', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const variants = {
    success: {
      bg: 'bg-[var(--color-accent-green)]/20',
      border: 'border-[var(--color-accent-green)]',
      text: 'text-[var(--color-accent-green)]',
      icon: <CheckCircle size={18} />,
    },
    error: {
      bg: 'bg-[var(--color-accent-red)]/20',
      border: 'border-[var(--color-accent-red)]',
      text: 'text-[var(--color-accent-red)]',
      icon: <AlertCircle size={18} />,
    },
    info: {
      bg: 'bg-[var(--color-accent-blue)]/20',
      border: 'border-[var(--color-accent-blue)]',
      text: 'text-[var(--color-accent-blue)]',
      icon: <Info size={18} />,
    },
  };

  const style = variants[variant];

  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-3 px-4 py-3 rounded-lg
        border ${style.border} ${style.bg}
        shadow-[var(--shadow-elevation-2)]
        transition-all duration-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
      `}
    >
      <div className={style.text}>
        {style.icon}
      </div>
      <span className="text-sm text-[var(--color-text-primary)]">{message}</span>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className={`${style.text} hover:opacity-70 transition-opacity`}
      >
        <X size={16} />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: Array<{
    id: string;
    message: string;
    variant?: 'success' | 'error' | 'info';
  }>;
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            bottom: `${24 + index * 80}px`,
          }}
          className="fixed right-6"
        >
          <Toast
            message={toast.message}
            variant={toast.variant}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </>
  );
}

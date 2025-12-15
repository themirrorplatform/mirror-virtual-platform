import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ isOpen, onClose, children, title, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-8">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full ${sizeStyles[size]} bg-[var(--color-surface-card)] rounded-3xl border border-[var(--color-border-subtle)] shadow-ambient-lg max-h-[85vh] overflow-hidden flex flex-col`}>
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-10 py-8 border-b border-[var(--color-border-subtle)]">
            <h3>{title}</h3>
            <button
              onClick={onClose}
              className="p-3 rounded-xl text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-emphasis)] transition-colors ml-6 flex-shrink-0"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className="overflow-y-auto px-10 py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="mb-2">{title}</h3>
          <p className="text-[var(--color-text-secondary)]">{message}</p>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg text-[var(--color-text-primary)] hover:bg-[var(--color-surface-emphasis)] transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2.5 rounded-lg transition-colors ${
              variant === 'destructive'
                ? 'bg-[var(--color-accent-red)] text-white hover:bg-[#d66060]'
                : 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-gold-deep)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
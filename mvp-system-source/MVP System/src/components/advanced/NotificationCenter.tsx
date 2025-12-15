/**
 * Notification Center - Constitutional notifications
 * 
 * Features:
 * - Non-intrusive notifications
 * - No urgency indicators
 * - Silent by default
 * - User-controlled timing
 * - No red badges or counts
 * - Announcement-based, not demand-based
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Check, Info, AlertCircle, CheckCircle } from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'announcement';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDismiss?: (id: string) => void;
  onClearAll?: () => void;
}

export function NotificationCenter({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDismiss,
  onClearAll,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead?.(notification.id);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon - No badge, subtle indicator only */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} className="text-[var(--color-text-secondary)]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[var(--color-accent-blue)]" />
        )}
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute right-0 top-full mt-2 w-96 max-h-[600px] overflow-hidden z-50"
          >
            <Card>
              {/* Header */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--color-border-subtle)]">
                <h3 className="font-medium">Notifications</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onMarkAllAsRead}
                    >
                      Mark all read
                    </Button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filter */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === 'all'
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                    filter === 'unread'
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto max-h-96 space-y-2">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClick={() => handleNotificationClick(notification)}
                      onDismiss={() => onDismiss?.(notification.id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Bell size={48} className="mx-auto mb-3 text-[var(--color-text-muted)]" />
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Nothing appears here
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredNotifications.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClearAll}
                    className="w-full"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Notification Item Component

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onDismiss: () => void;
}

function NotificationItem({ notification, onClick, onDismiss }: NotificationItemProps) {
  const Icon = getNotificationIcon(notification.type);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`p-3 rounded-lg cursor-pointer transition-colors ${
        notification.read
          ? 'bg-transparent hover:bg-[var(--color-surface-hover)]'
          : 'bg-[var(--color-accent-blue)]/5 hover:bg-[var(--color-accent-blue)]/10'
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${getIconBgColor(notification.type)}`}>
          <Icon size={16} className={getIconColor(notification.type)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium">{notification.title}</h4>
            {notification.dismissible && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDismiss();
                }}
                className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <p className="text-xs text-[var(--color-text-secondary)] mb-2">
            {notification.message}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">
              {formatTimestamp(notification.timestamp)}
            </span>

            {notification.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  notification.action!.onClick();
                }}
                className="text-xs text-[var(--color-accent-blue)] hover:underline"
              >
                {notification.action.label}
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function getNotificationIcon(type: Notification['type']) {
  switch (type) {
    case 'success':
      return CheckCircle;
    case 'warning':
      return AlertCircle;
    case 'announcement':
      return Bell;
    default:
      return Info;
  }
}

function getIconBgColor(type: Notification['type']) {
  switch (type) {
    case 'success':
      return 'bg-[var(--color-accent-green)]/10';
    case 'warning':
      return 'bg-[var(--color-accent-yellow)]/10';
    case 'announcement':
      return 'bg-[var(--color-accent-purple)]/10';
    default:
      return 'bg-[var(--color-accent-blue)]/10';
  }
}

function getIconColor(type: Notification['type']) {
  switch (type) {
    case 'success':
      return 'text-[var(--color-accent-green)]';
    case 'warning':
      return 'text-[var(--color-accent-yellow)]';
    case 'announcement':
      return 'text-[var(--color-accent-purple)]';
    default:
      return 'text-[var(--color-accent-blue)]';
  }
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

/**
 * useNotifications Hook - Manage notifications
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((
    notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
  ) => {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false,
      dismissible: notification.dismissible ?? true,
    };

    setNotifications(prev => [newNotification, ...prev]);

    return newNotification.id;
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);

  return {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    dismiss,
    clearAll,
    clearRead,
  };
}

/**
 * Toast Notification - Temporary notification
 */
interface ToastProps {
  type?: 'info' | 'success' | 'warning' | 'announcement';
  message: string;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ type = 'info', message, duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onClose?.(), 200);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const Icon = getNotificationIcon(type);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Card className="flex items-center gap-3 min-w-[300px]">
        <div className={`p-2 rounded-lg ${getIconBgColor(type)}`}>
          <Icon size={16} className={getIconColor(type)} />
        </div>
        <p className="flex-1 text-sm">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 200);
          }}
          className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
        >
          <X size={14} />
        </button>
      </Card>
    </motion.div>
  );
}

/**
 * useToast Hook - Show toast notifications
 */
export function useToast() {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);

  const showToast = useCallback((toast: ToastProps) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { ...toast, id }]);

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, toast.duration || 3000);
  }, []);

  const ToastContainer = () => (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
          />
        ))}
      </AnimatePresence>
    </div>
  );

  return {
    showToast,
    ToastContainer,
  };
}

/**
 * Announcement Banner - Important system announcements
 */
interface AnnouncementBannerProps {
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onDismiss?: () => void;
}

export function AnnouncementBanner({ 
  title, 
  message, 
  action, 
  onDismiss 
}: AnnouncementBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[var(--color-accent-blue)]/10 border-l-4 border-[var(--color-accent-blue)] p-4"
    >
      <div className="flex items-start gap-3">
        <Bell size={20} className="text-[var(--color-accent-blue)] mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium mb-1">{title}</h4>
          <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
          {action && (
            <Button
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="mt-2"
            >
              {action.label}
            </Button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded hover:bg-[var(--color-surface-hover)] transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export type { Notification, NotificationCenterProps, ToastProps };

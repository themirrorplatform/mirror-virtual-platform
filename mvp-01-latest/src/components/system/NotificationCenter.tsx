/**
 * Notification Center - Constitutional notification system
 * 
 * Features:
 * - Non-urgent notification display
 * - Grouping by type
 * - Mark as read/unread
 * - Notification preferences
 * - No badges, no urgency
 * - Quiet by default
 * - "When you're ready" framing
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell,
  BellOff,
  Check,
  X,
  Settings,
  Eye,
  MessageCircle,
  Lightbulb,
  TrendingUp,
  Info
} from 'lucide-react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Badge } from '../finder/Badge';

interface Notification {
  id: string;
  type: 'response' | 'mirrorback' | 'pattern' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
  onDismiss: (notificationId: string) => void;
  onNavigate?: (url: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TYPE_CONFIG = {
  response: {
    label: 'Response',
    description: 'Someone responded to your post',
    icon: MessageCircle,
    color: '#3B82F6',
  },
  mirrorback: {
    label: 'Mirrorback',
    description: 'New reflection available',
    icon: Lightbulb,
    color: '#8B5CF6',
  },
  pattern: {
    label: 'Pattern',
    description: 'New pattern detected',
    icon: TrendingUp,
    color: '#F59E0B',
  },
  system: {
    label: 'System',
    description: 'System update or information',
    icon: Info,
    color: '#64748B',
  },
};

export function NotificationCenter({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss,
  onNavigate,
  isOpen,
  onClose,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [showSettings, setShowSettings] = useState(false);

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' || !n.isRead
  );

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    if (!acc[notification.type]) acc[notification.type] = [];
    acc[notification.type].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 md:relative md:inset-auto"
    >
      {/* Mobile overlay */}
      <div 
        className="md:hidden fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full md:w-96 bg-[var(--color-surface-card)] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Bell size={20} className="text-[var(--color-accent-blue)]" />
              <div>
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {unreadCount} unread
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  filter === 'all'
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-full text-sm transition-all ${
                  filter === 'unread'
                    ? 'bg-[var(--color-accent-blue)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]'
                }`}
              >
                Unread {unreadCount > 0 && `(${unreadCount})`}
              </button>
            </div>

            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-[var(--color-surface-hover)] rounded-lg transition-colors"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b border-[var(--color-border-subtle)] overflow-hidden"
            >
              <NotificationSettings onClose={() => setShowSettings(false)} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        {unreadCount > 0 && (
          <div className="p-3 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]">
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
              className="w-full flex items-center justify-center gap-2"
            >
              <Check size={14} />
              Mark all as read
            </Button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {filteredNotifications.length > 0 ? (
            <div className="p-2 space-y-4">
              {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                <div key={type}>
                  <h5 className="px-2 text-xs font-medium text-[var(--color-text-muted)] mb-2">
                    {TYPE_CONFIG[type as keyof typeof TYPE_CONFIG].label}
                  </h5>
                  <div className="space-y-2">
                    {typeNotifications.map(notification => (
                      <NotificationCard
                        key={notification.id}
                        notification={notification}
                        onMarkRead={onMarkRead}
                        onDismiss={onDismiss}
                        onNavigate={onNavigate}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center">
                <Bell size={48} className="mx-auto mb-4 text-[var(--color-text-muted)]" />
                <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                  {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  When something appears, it will show here
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Constitutional Notice */}
        <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)]">
          <div className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
            <Info size={12} className="mt-0.5 flex-shrink-0" />
            <p>
              Notifications appear when you're ready. Nothing here demands immediate attention.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Notification Card

interface NotificationCardProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onDismiss: (id: string) => void;
  onNavigate?: (url: string) => void;
}

function NotificationCard({ 
  notification, 
  onMarkRead, 
  onDismiss,
  onNavigate 
}: NotificationCardProps) {
  const config = TYPE_CONFIG[notification.type];
  const Icon = config.icon;

  const handleClick = () => {
    if (!notification.isRead) {
      onMarkRead(notification.id);
    }
    if (notification.actionUrl && onNavigate) {
      onNavigate(notification.actionUrl);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    >
      <Card
        className={`cursor-pointer transition-all hover:shadow-md ${
          !notification.isRead ? 'border-l-4' : ''
        }`}
        style={{
          borderLeftColor: !notification.isRead ? config.color : undefined,
        }}
        onClick={handleClick}
      >
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-lg flex-shrink-0"
            style={{
              backgroundColor: `${config.color}20`,
              color: config.color,
            }}
          >
            <Icon size={16} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h5 className="text-sm font-medium">{notification.title}</h5>
              {!notification.isRead && (
                <div className="w-2 h-2 rounded-full bg-[var(--color-accent-blue)] flex-shrink-0 ml-2" />
              )}
            </div>

            <p className="text-xs text-[var(--color-text-secondary)] mb-2">
              {notification.message}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                {formatTime(notification.timestamp)}
              </span>

              <div className="flex items-center gap-2">
                {!notification.isRead && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkRead(notification.id);
                    }}
                    className="text-xs text-[var(--color-accent-blue)] hover:underline"
                  >
                    Mark read
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(notification.id);
                  }}
                  className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-hover)] rounded"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

// Notification Settings

function NotificationSettings({ onClose }: { onClose: () => void }) {
  const [preferences, setPreferences] = useState({
    responses: true,
    mirrorbacks: true,
    patterns: true,
    system: false,
  });

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Notification Preferences</h4>
        <button
          onClick={onClose}
          className="text-xs text-[var(--color-accent-blue)] hover:underline"
        >
          Done
        </button>
      </div>

      <div className="space-y-3">
        {Object.entries(TYPE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          return (
            <label
              key={key}
              className="flex items-start gap-3 p-2 rounded-lg hover:bg-[var(--color-surface-hover)] cursor-pointer"
            >
              <input
                type="checkbox"
                checked={preferences[key as keyof typeof preferences]}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    [key]: e.target.checked,
                  })
                }
                className="mt-0.5 w-4 h-4 rounded border-[var(--color-border-subtle)]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={14} style={{ color: config.color }} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {config.description}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <Card className="border-2 border-[var(--color-accent-blue)]">
        <div className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
          <Info size={12} className="text-[var(--color-accent-blue)] mt-0.5 flex-shrink-0" />
          <p>
            <strong>All notifications are non-urgent.</strong> Nothing here will create pressure 
            or demand immediate action. You can check when you're ready.
          </p>
        </div>
      </Card>
    </div>
  );
}

// Utility Functions

function formatTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const seconds = Math.floor(diff / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Notification Trigger Button
 */
interface NotificationTriggerProps {
  unreadCount: number;
  onClick: () => void;
}

export function NotificationTrigger({ unreadCount, onClick }: NotificationTriggerProps) {
  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
    >
      <Bell size={20} className="text-[var(--color-text-secondary)]" />
      {unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-accent-blue)] flex items-center justify-center"
        >
          <span className="text-xs text-white font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        </motion.div>
      )}
    </button>
  );
}

export type { Notification, NotificationCenterProps };

import { motion } from 'motion/react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2, Wifi, WifiOff, Cloud, CloudOff, Lock, Unlock } from 'lucide-react';

// Advanced status indicators with constitutional design
// Shows system state, connection status, processing, etc.

type StatusType = 
  | 'success' 
  | 'error' 
  | 'warning' 
  | 'info' 
  | 'processing'
  | 'connected'
  | 'disconnected'
  | 'synced'
  | 'syncing'
  | 'local'
  | 'sovereign'
  | 'commons';

interface StatusIndicatorProps {
  type: StatusType;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function StatusIndicator({
  type,
  label,
  description,
  size = 'md',
  pulse = false,
  showIcon = true,
  className = '',
}: StatusIndicatorProps) {
  const config = getStatusConfig(type);
  
  const sizes = {
    sm: {
      dot: 'w-2 h-2',
      icon: 14,
      text: 'text-xs',
      padding: 'px-2 py-1',
    },
    md: {
      dot: 'w-3 h-3',
      icon: 16,
      text: 'text-sm',
      padding: 'px-3 py-1.5',
    },
    lg: {
      dot: 'w-4 h-4',
      icon: 18,
      text: 'text-base',
      padding: 'px-4 py-2',
    },
  };

  const sizeConfig = sizes[size];

  return (
    <div className={`inline-flex items-center gap-2 ${sizeConfig.padding} rounded-full bg-[var(--color-surface-emphasis)]/60 backdrop-blur-sm border border-[var(--color-border-subtle)] ${className}`}>
      {/* Icon or dot */}
      {showIcon && config.icon ? (
        <config.icon 
          size={sizeConfig.icon} 
          className={`${config.color} ${type === 'processing' ? 'animate-spin' : ''}`} 
        />
      ) : (
        <div className="relative">
          <div 
            className={`${sizeConfig.dot} rounded-full ${config.bgColor}`}
            style={{ backgroundColor: config.dotColor }}
          />
          {pulse && (
            <motion.div
              className={`absolute inset-0 ${sizeConfig.dot} rounded-full`}
              style={{ backgroundColor: config.dotColor }}
              animate={{
                scale: [1, 1.8, 1],
                opacity: [0.6, 0, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          )}
        </div>
      )}

      {/* Label */}
      {label && (
        <span className={`${sizeConfig.text} ${config.textColor} font-medium`}>
          {label}
        </span>
      )}

      {/* Description (tooltip-like) */}
      {description && (
        <span className={`${sizeConfig.text} text-[var(--color-text-muted)]`}>
          {description}
        </span>
      )}
    </div>
  );
}

// Minimal dot-only indicator
export function StatusDot({
  type,
  pulse = false,
  size = 'md',
  className = '',
}: Omit<StatusIndicatorProps, 'label' | 'description' | 'showIcon'>) {
  const config = getStatusConfig(type);
  
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        className={`${sizes[size]} rounded-full`}
        style={{ backgroundColor: config.dotColor }}
      />
      {pulse && (
        <motion.div
          className={`absolute inset-0 ${sizes[size]} rounded-full`}
          style={{ backgroundColor: config.dotColor }}
          animate={{
            scale: [1, 2, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      )}
    </div>
  );
}

// Status badge (pill-shaped)
export function StatusBadge({
  type,
  label,
  size = 'sm',
  className = '',
}: Pick<StatusIndicatorProps, 'type' | 'label' | 'size' | 'className'>) {
  const config = getStatusConfig(type);
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <span 
      className={`inline-flex items-center gap-1.5 ${sizes[size]} rounded-full font-medium ${className}`}
      style={{
        backgroundColor: `${config.dotColor}20`,
        color: config.dotColor,
        border: `1px solid ${config.dotColor}40`,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: config.dotColor }} />
      {label}
    </span>
  );
}

// Connection status (specific for network/sync)
export function ConnectionStatus({
  isConnected,
  isSyncing = false,
  label,
  size = 'md',
  className = '',
}: {
  isConnected: boolean;
  isSyncing?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  if (isSyncing) {
    return (
      <StatusIndicator
        type="syncing"
        label={label || 'Syncing...'}
        size={size}
        pulse
        className={className}
      />
    );
  }

  return (
    <StatusIndicator
      type={isConnected ? 'connected' : 'disconnected'}
      label={label || (isConnected ? 'Connected' : 'Offline')}
      size={size}
      pulse={!isConnected}
      className={className}
    />
  );
}

// Layer status (sovereign/commons/builder)
export function LayerStatus({
  layer,
  size = 'md',
  showLabel = true,
  className = '',
}: {
  layer: 'sovereign' | 'commons' | 'builder';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}) {
  const labels = {
    sovereign: 'Sovereign',
    commons: 'Commons',
    builder: 'Builder',
  };

  return (
    <StatusIndicator
      type={layer}
      label={showLabel ? labels[layer] : undefined}
      size={size}
      className={className}
    />
  );
}

// Processing indicator with progress text
export function ProcessingStatus({
  message = 'Processing...',
  size = 'md',
  className = '',
}: {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <StatusIndicator
      type="processing"
      label={message}
      size={size}
      showIcon
      className={className}
    />
  );
}

// Helper function to get status configuration
function getStatusConfig(type: StatusType) {
  const configs = {
    success: {
      icon: CheckCircle2,
      color: 'text-green-400',
      textColor: 'text-green-400',
      bgColor: 'bg-green-400',
      dotColor: '#4ade80',
    },
    error: {
      icon: AlertCircle,
      color: 'text-red-400',
      textColor: 'text-red-400',
      bgColor: 'bg-red-400',
      dotColor: '#f87171',
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-400',
      textColor: 'text-yellow-400',
      bgColor: 'bg-yellow-400',
      dotColor: '#fbbf24',
    },
    info: {
      icon: Info,
      color: 'text-blue-400',
      textColor: 'text-blue-400',
      bgColor: 'bg-blue-400',
      dotColor: '#60a5fa',
    },
    processing: {
      icon: Loader2,
      color: 'text-[var(--color-accent-gold)]',
      textColor: 'text-[var(--color-text-secondary)]',
      bgColor: 'bg-[var(--color-accent-gold)]',
      dotColor: '#CBA35D',
    },
    connected: {
      icon: Wifi,
      color: 'text-green-400',
      textColor: 'text-green-400',
      bgColor: 'bg-green-400',
      dotColor: '#4ade80',
    },
    disconnected: {
      icon: WifiOff,
      color: 'text-[var(--color-text-muted)]',
      textColor: 'text-[var(--color-text-muted)]',
      bgColor: 'bg-[var(--color-text-muted)]',
      dotColor: '#6b7280',
    },
    synced: {
      icon: Cloud,
      color: 'text-green-400',
      textColor: 'text-green-400',
      bgColor: 'bg-green-400',
      dotColor: '#4ade80',
    },
    syncing: {
      icon: Cloud,
      color: 'text-[var(--color-accent-gold)]',
      textColor: 'text-[var(--color-text-secondary)]',
      bgColor: 'bg-[var(--color-accent-gold)]',
      dotColor: '#CBA35D',
    },
    local: {
      icon: CloudOff,
      color: 'text-[var(--color-text-muted)]',
      textColor: 'text-[var(--color-text-muted)]',
      bgColor: 'bg-[var(--color-text-muted)]',
      dotColor: '#6b7280',
    },
    sovereign: {
      icon: Lock,
      color: 'text-[var(--color-accent-gold)]',
      textColor: 'text-[var(--color-accent-gold)]',
      bgColor: 'bg-[var(--color-accent-gold)]',
      dotColor: '#CBA35D',
    },
    commons: {
      icon: Unlock,
      color: 'text-[var(--color-accent-purple)]',
      textColor: 'text-[var(--color-accent-purple)]',
      bgColor: 'bg-[var(--color-accent-purple)]',
      dotColor: '#8B7BAF',
    },
  };

  return configs[type] || configs.info;
}

// Export all components
export {
  StatusDot,
  StatusBadge,
  ConnectionStatus,
  LayerStatus,
  ProcessingStatus,
};

/**
 * Enhanced Button - Complete button system with all states and variants
 * Includes motion, loading states, icons, and full accessibility
 */

import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface EnhancedButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive' | 'glow';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  glowColor?: string;
}

export function EnhancedButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  glowColor,
  className = '',
  ...props
}: EnhancedButtonProps) {
  const isDisabled = disabled || loading;

  // Size configurations
  const sizeConfig = {
    sm: {
      padding: 'px-4 py-2',
      text: 'text-sm',
      rounded: 'rounded-lg',
      iconSize: 16,
    },
    md: {
      padding: 'px-6 py-3',
      text: 'text-base',
      rounded: 'rounded-xl',
      iconSize: 18,
    },
    lg: {
      padding: 'px-8 py-4',
      text: 'text-lg',
      rounded: 'rounded-2xl',
      iconSize: 20,
    },
  };

  // Variant styles
  const variantStyles = {
    primary: {
      base: 'bg-[var(--color-accent-gold)] text-[var(--color-text-inverse)]',
      glow: '0 0 20px rgba(203, 163, 93, 0.3)',
      hoverGlow: '0 0 30px rgba(203, 163, 93, 0.5)',
    },
    secondary: {
      base: 'bg-[var(--color-surface-card)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]',
      glow: 'none',
      hoverGlow: '0 0 20px rgba(255, 255, 255, 0.1)',
    },
    ghost: {
      base: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
      glow: 'none',
      hoverGlow: 'none',
    },
    destructive: {
      base: 'bg-[var(--color-accent-red)] text-white',
      glow: '0 0 20px rgba(239, 68, 68, 0.3)',
      hoverGlow: '0 0 30px rgba(239, 68, 68, 0.5)',
    },
    glow: {
      base: `bg-transparent text-white border-2`,
      glow: `0 0 30px ${glowColor || 'rgba(203, 163, 93, 0.6)'}`,
      hoverGlow: `0 0 50px ${glowColor || 'rgba(203, 163, 93, 0.8)'}`,
    },
  };

  const config = sizeConfig[size];
  const style = variantStyles[variant];

  return (
    <motion.button
      {...props}
      disabled={isDisabled}
      className={`
        relative inline-flex items-center justify-center gap-2
        ${config.padding} ${config.text} ${config.rounded}
        ${style.base}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        transition-all duration-200
        ${className}
      `}
      style={{
        boxShadow: style.glow,
        ...(variant === 'glow' && glowColor ? { borderColor: glowColor } : {}),
      }}
      whileHover={
        !isDisabled
          ? {
              scale: 1.02,
              boxShadow: style.hoverGlow,
            }
          : {}
      }
      whileTap={
        !isDisabled
          ? {
              scale: 0.98,
            }
          : {}
      }
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.2,
        ease: [0.23, 1, 0.32, 1],
      }}
    >
      {/* Loading spinner */}
      {loading && (
        <motion.div
          initial={{ opacity: 0, rotate: 0 }}
          animate={{ opacity: 1, rotate: 360 }}
          transition={{
            rotate: {
              duration: 1,
              repeat: Infinity,
              ease: 'linear',
            },
          }}
        >
          <Loader2 size={config.iconSize} />
        </motion.div>
      )}

      {/* Left icon */}
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex items-center">{icon}</span>
      )}

      {/* Content */}
      <span>{children}</span>

      {/* Right icon */}
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex items-center">{icon}</span>
      )}

      {/* Ripple effect on click */}
      {!isDisabled && (
        <motion.span
          className="absolute inset-0 rounded-inherit pointer-events-none"
          initial={{ opacity: 0, scale: 0 }}
          whileTap={{ opacity: [0, 0.3, 0], scale: [0, 1] }}
          transition={{ duration: 0.4 }}
          style={{
            background:
              variant === 'primary' || variant === 'destructive'
                ? 'rgba(255, 255, 255, 0.3)'
                : 'rgba(203, 163, 93, 0.3)',
          }}
        />
      )}
    </motion.button>
  );
}

// Button Group - for related actions
interface ButtonGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export function ButtonGroup({
  children,
  orientation = 'horizontal',
  className = '',
}: ButtonGroupProps) {
  return (
    <div
      className={`
        flex ${orientation === 'horizontal' ? 'flex-row' : 'flex-col'}
        gap-3
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// Icon Button - square button for icons only
interface IconButtonProps extends Omit<EnhancedButtonProps, 'children' | 'icon'> {
  icon: ReactNode;
  label: string; // for aria-label
}

export function IconButton({
  icon,
  label,
  size = 'md',
  ...props
}: IconButtonProps) {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  return (
    <motion.button
      {...props}
      aria-label={label}
      className={`
        ${sizeMap[size]}
        rounded-xl
        flex items-center justify-center
        transition-all duration-200
        ${props.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${props.className || ''}
      `}
      whileHover={
        !props.disabled
          ? {
              scale: 1.1,
            }
          : {}
      }
      whileTap={
        !props.disabled
          ? {
              scale: 0.95,
            }
          : {}
      }
    >
      {icon}
    </motion.button>
  );
}

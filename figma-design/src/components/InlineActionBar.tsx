import { Save, Archive, Link, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface InlineActionBarProps {
  isVisible: boolean;
  onReflect: () => void;
  onSave: () => void;
  onArchive: () => void;
  onLinkToThread: () => void;
  isReflecting?: boolean;
}

export function InlineActionBar({
  isVisible,
  onReflect,
  onSave,
  onArchive,
  onLinkToThread,
  isReflecting = false,
}: InlineActionBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-center gap-1 px-3 py-2 bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg"
        >
          <ActionButton
            icon={<Sparkles size={16} />}
            label="Reflect"
            onClick={onReflect}
            disabled={isReflecting}
          />
          <div className="w-px h-4 bg-[var(--color-border-subtle)]" />
          <ActionButton
            icon={<Save size={16} />}
            label="Save"
            onClick={onSave}
          />
          <ActionButton
            icon={<Link size={16} />}
            label="Link to Thread"
            onClick={onLinkToThread}
          />
          <ActionButton
            icon={<Archive size={16} />}
            label="Archive"
            onClick={onArchive}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface ActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

function ActionButton({ icon, label, onClick, disabled }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group relative px-3 py-1.5 rounded hover:bg-[var(--color-base-raised)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={label}
    >
      <div className="flex items-center gap-1.5 text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)] transition-colors">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
    </button>
  );
}

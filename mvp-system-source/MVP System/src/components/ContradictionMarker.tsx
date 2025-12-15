import { motion } from 'motion/react';
import { GitBranch } from 'lucide-react';

interface ContradictionMarkerProps {
  nodeAId: string;
  nodeBId: string;
  nodeAText: string;
  nodeBText: string;
  description?: string;
}

export function ContradictionMarker({
  nodeAId,
  nodeBId,
  nodeAText,
  nodeBText,
  description,
}: ContradictionMarkerProps) {
  const previewA = nodeAText.slice(0, 60) + (nodeAText.length > 60 ? '...' : '');
  const previewB = nodeBText.slice(0, 60) + (nodeBText.length > 60 ? '...' : '');

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative my-6 p-5 rounded-lg border-2 border-[var(--color-accent-purple)]/30"
      style={{
        background: 'linear-gradient(135deg, var(--color-base-raised) 0%, transparent 100%)',
      }}
    >
      {/* Glow effect */}
      <motion.div
        animate={{
          boxShadow: [
            '0 0 20px var(--color-accent-purple)',
            '0 0 40px var(--color-accent-purple)',
            '0 0 20px var(--color-accent-purple)',
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute inset-0 rounded-lg pointer-events-none"
        style={{ opacity: 0.3 }}
      />

      <div className="relative">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={16} className="text-[var(--color-accent-purple)]" />
          <span className="text-sm text-[var(--color-accent-purple)]">
            Contradiction honored
          </span>
        </div>

        {description && (
          <p className="text-xs text-[var(--color-text-muted)] mb-4 leading-relaxed">
            {description}
          </p>
        )}

        <div className="space-y-3">
          <div className="pl-4 border-l-2 border-[var(--color-accent-purple)]/30">
            <span className="text-xs text-[var(--color-text-muted)] block mb-1">
              Node {nodeAId}
            </span>
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              "{previewA}"
            </p>
          </div>

          <div className="flex items-center justify-center">
            <div className="w-full h-px bg-[var(--color-accent-purple)]/20" />
            <span className="px-3 text-xs text-[var(--color-accent-purple)]">⟷</span>
            <div className="w-full h-px bg-[var(--color-accent-purple)]/20" />
          </div>

          <div className="pl-4 border-l-2 border-[var(--color-accent-purple)]/30">
            <span className="text-xs text-[var(--color-text-muted)] block mb-1">
              Node {nodeBId}
            </span>
            <p className="text-xs text-[var(--color-text-secondary)] italic">
              "{previewB}"
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

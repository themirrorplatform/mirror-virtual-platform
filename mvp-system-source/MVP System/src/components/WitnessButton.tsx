import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';

interface WitnessButtonProps {
  isWitnessed: boolean;
  onToggle: () => void;
  showCount?: boolean;
  count?: number;
}

export function WitnessButton({ 
  isWitnessed, 
  onToggle,
  showCount = false,
  count = 0,
}: WitnessButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="flex items-center gap-3 px-5 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors group"
    >
      <motion.div
        animate={{
          scale: isWitnessed ? [1, 1.2, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        {isWitnessed ? (
          <Eye 
            size={18} 
            className="text-[var(--color-accent-gold)]" 
            fill="var(--color-accent-gold)"
          />
        ) : (
          <EyeOff 
            size={18} 
            className="text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)]" 
          />
        )}
      </motion.div>
      
      <span className={`text-base transition-colors ${
        isWitnessed 
          ? 'text-[var(--color-accent-gold)]' 
          : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-accent-gold)]'
      }`}>
        {isWitnessed ? 'Witnessed' : 'Witness'}
      </span>

      {/* Only show count to self, never publicly */}
      {showCount && count > 0 && (
        <span className="text-sm text-[var(--color-text-muted)] ml-1">
          ({count})
        </span>
      )}
    </button>
  );
}

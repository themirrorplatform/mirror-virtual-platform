import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, X } from 'lucide-react';
import { GhostButton } from './GhostButton';

interface InputComposerProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  tone?: 'soft' | 'direct' | 'playful' | 'austere' | 'silent' | 'provocative';
  className?: string;
}

export function InputComposer({
  onSubmit,
  placeholder = 'What are you reflecting on?',
  tone = 'soft',
  className = '',
}: InputComposerProps) {
  const [text, setText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSubmit(text);
      setText('');
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className={`mirror-glass rounded-3xl p-4 border border-[#30303A]/30 backdrop-blur-xl ${className}`}
      style={{
        background: 'rgba(11, 11, 13, 0.6)',
        boxShadow: isFocused
          ? '0 0 40px rgba(203, 163, 93, 0.2)'
          : '0 0 20px rgba(0, 0, 0, 0.5)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-start gap-3">
        {/* Text input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-[#E5E5E5] placeholder-[#C4C4CF]/40 resize-none outline-none min-h-[60px] max-h-[200px]"
          rows={3}
        />

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          <AnimatePresence>
            {text.trim() ? (
              <motion.button
                type="submit"
                className="p-2.5 rounded-xl bg-[#CBA35D] text-black hover:bg-[#9C7C3C] transition-colors duration-300"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send size={18} />
              </motion.button>
            ) : (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <GhostButton icon={Mic} size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Character count and tone indicator */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#30303A]/30">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#C4C4CF]/60">Tone:</span>
          <span className="text-xs px-2 py-1 rounded-lg bg-[#CBA35D]/10 text-[#CBA35D] capitalize">
            {tone}
          </span>
        </div>
        <span className="text-xs text-[#C4C4CF]/60">{text.length} chars</span>
      </div>
    </motion.form>
  );
}

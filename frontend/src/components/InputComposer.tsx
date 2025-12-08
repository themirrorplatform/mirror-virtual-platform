import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Cloud, HardDrive } from "lucide-react";

interface InputComposerProps {
  onSubmit: (content: string, offline?: boolean) => void;
  tone?: string;
  placeholder?: string;
  isOffline?: boolean;
}

export function InputComposer({
  onSubmit,
  tone = "soft",
  placeholder = "What's on your mind? Share a reflection...",
  isOffline: initialOffline = false,
}: InputComposerProps) {
  const [content, setContent] = useState("");
  const [offline, setOffline] = useState(initialOffline);
  const [focused, setFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit(content, offline);
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit with Cmd/Ctrl + Enter
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  const charCount = content.length;
  const maxChars = 5000;
  const showCount = charCount > maxChars * 0.8;

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="relative"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Mirror glass container */}
      <div
        className={`bg-gradient-to-br from-[#1A1A1A]/80 to-[#0E0E0E]/80 backdrop-blur-xl border-2 rounded-[2rem] transition-all duration-300 ${
          focused
            ? "border-[#CBA35D] shadow-[0_0_20px_rgba(203,163,93,0.2)]"
            : "border-[#30303A]"
        }`}
      >
        {/* Offline/Cloud toggle */}
        <div className="flex items-center justify-between p-4 border-b border-[#30303A]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOffline(!offline)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
                offline
                  ? "bg-[#CBA35D]/20 border border-[#CBA35D]/40 text-[#CBA35D]"
                  : "bg-[#30303A]/20 border border-[#30303A] text-[#BDBDBD] hover:text-[#FAFAFA]"
              }`}
            >
              {offline ? (
                <>
                  <HardDrive className="w-4 h-4" />
                  <span>Offline</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4" />
                  <span>Cloud</span>
                </>
              )}
            </button>
          </div>

          <AnimatePresence>
            {showCount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`text-sm ${
                  charCount > maxChars ? "text-red-400" : "text-[#BDBDBD]"
                }`}
              >
                {charCount} / {maxChars}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full min-h-[200px] max-h-[400px] px-6 py-4 bg-transparent text-[#FAFAFA] placeholder:text-[#505050] focus:outline-none resize-y"
        />

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[#30303A]">
          <div className="text-xs text-[#BDBDBD]">
            <kbd className="px-2 py-1 bg-[#0E0E0E] border border-[#30303A] rounded text-[#CBA35D]">
              ⌘
            </kbd>{" "}
            +{" "}
            <kbd className="px-2 py-1 bg-[#0E0E0E] border border-[#30303A] rounded text-[#CBA35D]">
              Enter
            </kbd>{" "}
            to submit
          </div>

          <motion.button
            type="submit"
            disabled={!content.trim() || charCount > maxChars}
            className="px-6 py-2 bg-gradient-to-r from-[#CBA35D] to-[#d4af37] text-[#0E0E0E] rounded-full font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: content.trim() ? 1.05 : 1 }}
            whileTap={{ scale: content.trim() ? 0.95 : 1 }}
          >
            Reflect
          </motion.button>
        </div>
      </div>

      {/* Breathing border effect */}
      {focused && (
        <motion.div
          className="absolute inset-0 rounded-[2rem] pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(203, 163, 93, 0)",
              "0 0 0 4px rgba(203, 163, 93, 0.1)",
              "0 0 0 0 rgba(203, 163, 93, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.form>
  );
}

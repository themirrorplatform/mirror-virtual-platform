import { motion, AnimatePresence } from "framer-motion";
import { X, Plus } from "lucide-react";
import { GhostButton } from "./GhostButton";

interface Thread {
  id: string;
  title: string;
  lastActive: string;
  reflectionCount: number;
}

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentTone: string;
  threads: Thread[];
  activeThreadId?: string;
  onThreadSelect: (threadId: string) => void;
  onNewThread: () => void;
  onToneChange: (tone: string) => void;
}

const tones = [
  { id: "soft", label: "Soft", color: "#60A5FA" },
  { id: "direct", label: "Direct", color: "#F59E0B" },
  { id: "playful", label: "Playful", color: "#EC4899" },
  { id: "austere", label: "Austere", color: "#8B5CF6" },
  { id: "silent", label: "Silent", color: "#6B7280" },
  { id: "provocative", label: "Provocative", color: "#EF4444" },
];

export function MobileSidebar({
  isOpen,
  onClose,
  currentTone,
  threads,
  activeThreadId,
  onThreadSelect,
  onNewThread,
  onToneChange,
}: MobileSidebarProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          />

          {/* Sidebar */}
          <motion.div
            initial={{ x: -320 }}
            animate={{ x: 0 }}
            exit={{ x: -320 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed left-0 top-0 bottom-0 w-80 bg-[#0E0E0E] border-r border-[#30303A] z-50 md:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#30303A]">
              <h2 className="text-[#FAFAFA] font-semibold text-lg">MirrorX</h2>
              <button
                onClick={onClose}
                aria-label="Close sidebar"
                className="text-[#BDBDBD] hover:text-[#FAFAFA] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tone Selector */}
            <div className="p-4 border-b border-[#30303A]">
              <h3 className="text-[#BDBDBD] text-sm mb-3">Tone</h3>
              <div className="grid grid-cols-3 gap-2">
                {tones.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => onToneChange(tone.id)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      currentTone === tone.id
                        ? "bg-[#CBA35D]/20 border-2 border-[#CBA35D] text-[#CBA35D]"
                        : "bg-[#1A1A1A] border-2 border-[#30303A] text-[#BDBDBD] hover:border-[#505050]"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Threads */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[#BDBDBD] text-sm">Threads</h3>
                <button
                  onClick={onNewThread}
                  aria-label="New thread"
                  className="text-[#CBA35D] hover:text-[#d4af37] transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread.id}
                    onClick={() => {
                      onThreadSelect(thread.id);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      activeThreadId === thread.id
                        ? "bg-[#CBA35D]/10 border border-[#CBA35D]/40"
                        : "bg-[#1A1A1A] border border-[#30303A] hover:border-[#505050]"
                    }`}
                  >
                    <div className="text-[#FAFAFA] text-sm font-medium mb-1 truncate">
                      {thread.title}
                    </div>
                    <div className="flex items-center justify-between text-xs text-[#BDBDBD]">
                      <span>{thread.lastActive}</span>
                      <span>{thread.reflectionCount} reflections</span>
                    </div>
                  </button>
                ))}

                {threads.length === 0 && (
                  <div className="text-center py-8 text-[#505050] text-sm">
                    No threads yet. Start a new conversation.
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#30303A] bg-[#0E0E0E]">
              <button
                onClick={onNewThread}
                className="w-full py-3 bg-gradient-to-r from-[#CBA35D] to-[#d4af37] text-[#0E0E0E] rounded-full font-medium hover:shadow-[0_0_20px_rgba(203,163,93,0.3)] transition-shadow"
              >
                New Thread
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

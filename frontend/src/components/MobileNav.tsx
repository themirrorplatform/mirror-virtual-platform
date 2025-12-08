import { motion } from "framer-motion";
import { MessageSquare, Eye, Network, User } from "lucide-react";

type View = "reflect" | "thread" | "graph" | "profile";

interface MobileNavProps {
  currentView: View;
  onViewChange: (view: View) => void;
  currentTone?: string;
}

export function MobileNav({
  currentView,
  onViewChange,
  currentTone = "soft",
}: MobileNavProps) {
  const navItems: Array<{ id: View; icon: typeof MessageSquare; label: string }> = [
    { id: "reflect", icon: MessageSquare, label: "Reflect" },
    { id: "thread", icon: Eye, label: "Thread" },
    { id: "graph", icon: Network, label: "Graph" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  return (
    <>
      {/* Top Bar (minimal) */}
      <div className="fixed top-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-[#0E0E0E]/95 backdrop-blur-xl border-b border-[#30303A]">
          <div className="flex items-center justify-center h-14">
            <span className="text-[#CBA35D] font-semibold text-lg">MirrorX</span>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
        <div className="bg-[#0E0E0E]/95 backdrop-blur-xl border-t border-[#30303A]">
          <div className="flex items-center justify-around h-20 px-4 relative">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  className="relative flex flex-col items-center justify-center flex-1 h-full"
                >
                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeMobileNav"
                      className="absolute inset-x-2 top-0 h-1 bg-gradient-to-r from-transparent via-[#CBA35D] to-transparent rounded-full"
                      transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    />
                  )}

                  <Icon
                    className={`w-6 h-6 mb-1 transition-colors ${
                      isActive ? "text-[#CBA35D]" : "text-[#505050]"
                    }`}
                  />
                  <span
                    className={`text-xs transition-colors ${
                      isActive ? "text-[#FAFAFA]" : "text-[#505050]"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}

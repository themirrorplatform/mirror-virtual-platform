import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Layers, Globe, Archive, User, Network, Shield, GitFork, AlertCircle, Menu, X } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isRealm?: boolean;
}

interface NavigationRevealProps {
  activeView: string;
  onNavigate: (view: string) => void;
  commonsEnabled: boolean;
  onCrisis: () => void;
}

export function NavigationReveal({ activeView, onNavigate, commonsEnabled, onCrisis }: NavigationRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isHoveringEdge, setIsHoveringEdge] = useState(false);

  // Primary Realms
  const realmItems: NavItem[] = [
    { id: 'mirror', label: 'Mirror', icon: <Home size={18} />, isRealm: true },
    { id: 'threads', label: 'Threads', icon: <Layers size={18} />, isRealm: true },
    ...(commonsEnabled ? [{ id: 'world', label: 'World', icon: <Globe size={18} />, isRealm: true }] : []),
    { id: 'archive', label: 'Archive', icon: <Archive size={18} />, isRealm: true },
    { id: 'self', label: 'Self', icon: <User size={18} />, isRealm: true },
  ];

  // Backstage (only shown if relevant)
  const backstageItems: NavItem[] = [
    { id: 'commons', label: 'Commons', icon: <Network size={18} /> },
    { id: 'governance', label: 'Governance', icon: <Shield size={18} /> },
    { id: 'forks', label: 'Variants', icon: <GitFork size={18} /> },
  ];

  // Mouse proximity detection for left edge
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Reveal if mouse is within 50px of left edge
      if (e.clientX < 50 && !isRevealed) {
        setIsHoveringEdge(true);
      } else if (e.clientX > 300) {
        setIsHoveringEdge(false);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isRevealed]);

  // Auto-reveal on edge hover
  useEffect(() => {
    if (isHoveringEdge && !isRevealed) {
      const timer = setTimeout(() => {
        setIsRevealed(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [isHoveringEdge, isRevealed]);

  return (
    <>
      {/* Mobile Menu Toggle */}
      <button
        onClick={() => setIsRevealed(!isRevealed)}
        className="fixed top-6 left-6 z-50 md:hidden w-10 h-10 rounded-full bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        aria-label="Toggle navigation"
      >
        {isRevealed ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Desktop Corner Indicator (when nav hidden) */}
      {!isRevealed && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isHoveringEdge ? 0.6 : 0.3 }}
          onClick={() => setIsRevealed(true)}
          className="hidden md:flex fixed top-6 left-6 z-40 w-8 h-8 rounded-full bg-[var(--color-surface-card)]/50 backdrop-blur-sm border border-[var(--color-border-subtle)]/50 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-all"
          aria-label="Show navigation"
        >
          <Menu size={16} />
        </motion.button>
      )}

      {/* Navigation Panel */}
      <AnimatePresence>
        {isRevealed && (
          <>
            {/* Backdrop (mobile only) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRevealed(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              onMouseLeave={() => {
                setIsHoveringEdge(false);
                // Auto-hide on desktop when mouse leaves (optional)
                // Uncomment to enable: setTimeout(() => setIsRevealed(false), 300);
              }}
              className="fixed left-0 top-0 bottom-0 w-64 bg-[var(--color-base-raised)] border-r border-[var(--color-border-subtle)] flex flex-col z-50"
            >
              {/* Logo */}
              <div className="p-6 border-b border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
                    <span className="text-lg text-[var(--color-text-inverse)]">M</span>
                  </div>
                  <div>
                    <h2 className="text-lg">The Mirror</h2>
                    <span className="text-xs text-[var(--color-text-muted)]">MirrorOS v1.1.0</span>
                  </div>
                </div>
              </div>

              {/* Crisis Button */}
              <div className="p-4 border-b border-[var(--color-border-subtle)]">
                <button
                  onClick={() => {
                    onCrisis();
                    setIsRevealed(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[var(--color-surface-emphasis)] text-[var(--color-accent-red)] hover:bg-[var(--color-surface-card)] transition-colors"
                >
                  <AlertCircle size={18} />
                  <span className="text-sm">Overwhelmed?</span>
                </button>
              </div>

              {/* Realms Navigation */}
              <nav className="flex-1 p-4 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  {realmItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        // Auto-hide on mobile after selection
                        if (window.innerWidth < 768) {
                          setIsRevealed(false);
                        }
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg
                        transition-colors text-left
                        ${activeView === item.id
                          ? 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-primary)]'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-card)]'
                        }
                      `}
                    >
                      <span className="flex-shrink-0">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                {/* Backstage (subtle separator) */}
                {backstageItems.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)]">
                    <div className="flex flex-col gap-1">
                      {backstageItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            onNavigate(item.id);
                            if (window.innerWidth < 768) {
                              setIsRevealed(false);
                            }
                          }}
                          className={`
                            flex items-center gap-3 px-4 py-2.5 rounded-lg
                            transition-colors text-left
                            ${activeView === item.id
                              ? 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-primary)]'
                              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card)]'
                            }
                          `}
                        >
                          <span className="flex-shrink-0">{item.icon}</span>
                          <span className="text-sm">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </nav>

              {/* Status Footer */}
              <div className="p-4 border-t border-[var(--color-border-subtle)]">
                <div className="flex flex-col gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">Mode</span>
                    <span className="text-[var(--color-text-accent)]">Sovereign</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-muted)]">Storage</span>
                    <span className="text-[var(--color-text-secondary)]">Local</span>
                  </div>
                  {commonsEnabled && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-muted)]">Commons</span>
                      <span className="text-[var(--color-accent-green)]">Connected</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Close button (desktop) */}
              <button
                onClick={() => setIsRevealed(false)}
                className="hidden md:flex absolute top-6 right-4 w-8 h-8 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label="Hide navigation"
              >
                <X size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

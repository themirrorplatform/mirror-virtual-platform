import { Home, Clock, Zap, User, Globe, Settings, AlertCircle, GitFork, Network, Shield, Archive, Layers } from 'lucide-react';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  isRealm?: boolean;
}

interface NavigationProps {
  activeView: string;
  onNavigate: (view: string) => void;
  commonsEnabled: boolean;
  onCrisis: () => void;
}

export function Navigation({ activeView, onNavigate, commonsEnabled, onCrisis }: NavigationProps) {
  // Primary Realms (top-level navigation)
  const realmItems: NavItem[] = [
    { id: 'mirror', label: 'Mirror', icon: <Home size={20} />, isRealm: true },
    { id: 'threads', label: 'Threads', icon: <Layers size={20} />, isRealm: true },
    ...(commonsEnabled ? [{ id: 'world', label: 'World', icon: <Globe size={20} />, isRealm: true }] : []),
    { id: 'archive', label: 'Archive', icon: <Archive size={20} />, isRealm: true },
    { id: 'self', label: 'Self', icon: <User size={20} />, isRealm: true },
  ];

  // Secondary Navigation (Backstage/Governance)
  const backstageItems: NavItem[] = [
    { id: 'commons', label: 'Commons', icon: <Network size={20} /> },
    { id: 'governance', label: 'Governance', icon: <Shield size={20} /> },
    { id: 'forks', label: 'Variants', icon: <GitFork size={20} /> },
  ];

  return (
    <div className="w-72 h-screen bg-[var(--color-base-raised)] border-r border-[var(--color-border-subtle)] flex flex-col">
      {/* Logo */}
      <div className="p-8 border-b border-[var(--color-border-subtle)]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[var(--color-accent-gold)] flex items-center justify-center">
            <span className="text-xl text-[var(--color-text-inverse)]">M</span>
          </div>
          <div>
            <h2 className="text-xl">The Mirror</h2>
            <span className="text-sm text-[var(--color-text-muted)]">MirrorOS v1.1.0</span>
          </div>
        </div>
      </div>

      {/* Crisis Button */}
      <div className="p-6 border-b border-[var(--color-border-subtle)]">
        <button
          onClick={onCrisis}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[var(--color-surface-emphasis)] text-[var(--color-accent-red)] hover:bg-[var(--color-surface-card)] transition-colors"
        >
          <AlertCircle size={20} />
          <span className="text-base font-medium">Overwhelmed?</span>
        </button>
      </div>

      {/* Realms Navigation */}
      <nav className="flex-1 p-6 overflow-y-auto">
        {/* Primary Realms */}
        <div className="mb-8">
          <div className="px-4 mb-3">
            <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Realms</span>
          </div>
          <div className="flex flex-col gap-2">
            {realmItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center gap-4 px-5 py-3.5 rounded-xl
                  transition-colors text-base
                  ${activeView === item.id
                    ? 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-card)]'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Backstage */}
        <div>
          <div className="px-4 mb-3">
            <span className="text-sm text-[var(--color-text-muted)] uppercase tracking-wider">Backstage</span>
          </div>
          <div className="flex flex-col gap-2">
            {backstageItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`
                  flex items-center gap-4 px-5 py-3.5 rounded-xl
                  transition-colors text-base
                  ${activeView === item.id
                    ? 'bg-[var(--color-surface-emphasis)] text-[var(--color-text-accent)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-card)]'
                  }
                `}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Status Footer */}
      <div className="p-6 border-t border-[var(--color-border-subtle)]">
        <div className="flex flex-col gap-3 text-sm">
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
    </div>
  );
}
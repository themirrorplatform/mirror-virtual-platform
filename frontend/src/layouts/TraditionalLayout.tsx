import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ModeToggle } from '../components/ModeToggle';
import { 
  Home, 
  User, 
  MessageCircle, 
  Settings, 
  Shield, 
  BarChart,
  AlertCircle,
  Globe
} from 'lucide-react';

/**
 * TRADITIONAL LAYOUT - SIMPLE MODE
 * 
 * Familiar navigation with persistent sidebar and routes.
 * For users who prefer traditional web app patterns.
 */

interface TraditionalLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/reflect', label: 'Reflect', icon: MessageCircle },
  { href: '/identity', label: 'Identity', icon: User },
  { href: '/world', label: 'Commons', icon: Globe },
  { href: '/governance', label: 'Governance', icon: Shield },
  { href: '/crisis', label: 'Crisis', icon: AlertCircle },
  { href: '/analytics', label: 'Analytics', icon: BarChart },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function TraditionalLayout({ children }: TraditionalLayoutProps) {
  const router = useRouter();

  return (
    <div className="flex h-screen bg-[var(--color-base-default)]">
      {/* Sidebar */}
      <aside className="
        w-64 border-r border-[var(--color-border-subtle)]
        bg-[var(--color-base-raised)]
        flex flex-col
      ">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <h1 className="text-2xl font-serif text-[var(--color-accent-gold)]">
            The Mirror
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Constitutional Reflection
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = router.pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`
                  flex items-center gap-3 px-3 py-2 rounded-lg
                  transition-colors
                  ${isActive 
                    ? 'bg-[var(--layer-sovereign)] text-[var(--color-accent-gold)]' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-card)] hover:text-[var(--color-text-primary)]'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mode Toggle */}
        <div className="p-4 border-t border-[var(--color-border-subtle)]">
          <ModeToggle />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}

/**
 * Settings Page
 * 
 * User preferences and configuration
 */

import { useState } from 'react';
import { useUIMode } from '@/contexts/UIModeContext';
import { ModeToggle } from '@/components/ModeToggle';
import { PrivacyDashboard } from '@/components/PrivacyDashboard';
import { Settings, Bell, Lock, Eye, Palette, Globe } from 'lucide-react';

export default function SettingsPage() {
  const { isSimpleMode } = useUIMode();
  const [settings, setSettings] = useState({
    notifications: true,
    autoSave: true,
    privacyMode: false,
    sharePatterns: false,
    theme: 'dark',
    language: 'en',
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const settingSections = [
    {
      title: 'Interface',
      icon: Palette,
      items: [
        {
          key: 'uiMode' as const,
          label: 'UI Mode',
          description: 'Switch between Power Mode and Simple Mode',
          component: <ModeToggle />,
        },
      ],
    },
    {
      title: 'Privacy',
      icon: Lock,
      items: [
        {
          key: 'privacyMode' as const,
          label: 'Privacy Mode',
          description: 'Enhanced privacy with local-only processing',
          toggle: true,
        },
        {
          key: 'sharePatterns' as const,
          label: 'Share Patterns with Commons',
          description: 'Contribute anonymized patterns to collective learning',
          toggle: true,
        },
      ],
    },
    {
      title: 'Preferences',
      icon: Settings,
      items: [
        {
          key: 'notifications' as const,
          label: 'Notifications',
          description: 'Constitutional notifications only (no engagement)',
          toggle: true,
        },
        {
          key: 'autoSave' as const,
          label: 'Auto-Save',
          description: '100ms auto-save to prevent data loss',
          toggle: true,
        },
      ],
    },
  ];

  const content = (
    <div className="space-y-8">
      {settingSections.map((section) => {
        const Icon = section.icon;
        return (
          <div key={section.title} className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5 text-[var(--color-accent-gold)]" />
              <h2 className="text-xl font-serif text-[var(--color-text-primary)]">{section.title}</h2>
            </div>

            <div className="space-y-3">
              {section.items.map((item) => (
                <div
                  key={item.key}
                  className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-[var(--color-text-primary)] mb-1">
                        {item.label}
                      </div>
                      <div className="text-sm text-[var(--color-text-muted)]">
                        {item.description}
                      </div>
                    </div>

                    {item.component ? (
                      <div className="ml-4">{item.component}</div>
                    ) : item.toggle ? (
                      <button
                        onClick={() => toggleSetting(item.key)}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${settings[item.key] ? 'bg-[var(--color-accent-gold)]' : 'bg-[var(--color-base-sunken)]'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${settings[item.key] ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Privacy Dashboard - Constitutional Instrument */}
      <div className="space-y-4">
        <PrivacyDashboard />
      </div>

      {/* Account Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5 text-[var(--color-accent-gold)]" />
          <h2 className="text-xl font-serif text-[var(--color-text-primary)]">Account</h2>
        </div>

        <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-subtle)] rounded-lg p-4">
          <div className="space-y-3">
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors text-[var(--color-text-primary)]">
              Export All Data
            </button>
            <button className="w-full text-left px-4 py-3 rounded-lg hover:bg-[var(--color-surface-emphasis)] transition-colors text-[var(--color-text-primary)]">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (isSimpleMode) {
    return (
      <div className="h-full flex flex-col">
        <header className="border-b border-[var(--color-border-subtle)] px-6 py-4">
          <h1 className="text-2xl font-serif text-[var(--color-accent-gold)]">Settings</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage your preferences and privacy
          </p>
        </header>
        <div className="flex-1 overflow-auto custom-scrollbar p-6">
          <div className="max-w-2xl">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-auto custom-scrollbar p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-serif text-[var(--color-accent-gold)] mb-2">Settings</h1>
          <p className="text-[var(--color-text-secondary)]">
            Manage your preferences and privacy
          </p>
        </div>
        {content}
      </div>
    </div>
  );
}

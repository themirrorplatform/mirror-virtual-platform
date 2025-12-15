import { useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Banner } from '../Banner';
import { GitFork, Users, Shield, AlertTriangle, Code, Globe } from 'lucide-react';
import { ForkEntryInstrument } from '../instruments/ForkEntryInstrument';
import { getActiveForks, getForkById, type ForkContext } from '../../utils/mockForks';

export function ForksScreen({ 
  onNavigate,
  onEnterFork,
  onExitFork,
  currentFork,
}: { 
  onNavigate?: (view: string) => void;
  onEnterFork?: (forkId: string) => void;
  onExitFork?: () => void;
  currentFork?: string | null;
}) {
  const [sandboxActive, setSandboxActive] = useState(false);
  const [selectedFork, setSelectedFork] = useState<ForkContext | null>(null);
  const [showForkEntry, setShowForkEntry] = useState(false);
  
  const activeForks = getActiveForks();
  
  const handleSelectFork = (forkId: string) => {
    const fork = getForkById(forkId);
    if (fork) {
      setSelectedFork(fork);
      setShowForkEntry(true);
    }
  };
  
  const handleEnterFork = (forkId: string) => {
    onEnterFork?.(forkId);
    setShowForkEntry(false);
    setSelectedFork(null);
  };
  
  const handleCloseForkEntry = () => {
    setShowForkEntry(false);
    setSelectedFork(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-8">
        <h1 className="mb-2">Mirror Variants</h1>
        <p className="text-[var(--color-text-secondary)]">
          Explore different Mirror behaviors while maintaining sovereignty
        </p>
      </div>

      {sandboxActive && (
        <Banner variant="warning" className="mb-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">🧪</span>
              <span className="font-medium">SANDBOX MODE: {selectedFork?.name || 'Testing'}</span>
            </div>
            <p className="text-sm">
              This is NOT your real Mirror. Nothing here is saved. Your sovereign Mirror is paused.
            </p>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => setSandboxActive(false)}
              className="self-start mt-2"
            >
              Exit Sandbox
            </Button>
          </div>
        </Banner>
      )}

      <div className="space-y-6">
        {/* Official Variants */}
        <div>
          <h3 className="mb-4">Official Variants</h3>
          <div className="space-y-4">
            <ForkCard
              title="MirrorCore (Stable)"
              author="Official"
              users={1247}
              status="stable"
              description="The canonical Mirror. Reflective, non-directive, constitutional."
              isCurrent={!sandboxActive}
              onTrySandbox={() => {
                setSelectedFork(getForkById('mirrorcore-stable')!);
                setSandboxActive(true);
              }}
            />
            
            <ForkCard
              title="MirrorCore (Beta)"
              author="Official"
              users={89}
              status="beta"
              description="Testing ground for upcoming features. More experimental, may have rough edges."
              onTrySandbox={() => {
                setSelectedFork(getForkById('mirrorcore-beta')!);
                setSandboxActive(true);
              }}
            />
          </div>
        </div>

        {/* Community Forks */}
        <div>
          <h3 className="mb-4">Community Forks</h3>
          <div className="space-y-4">
            {activeForks.map(fork => (
              <ForkCard
                key={fork.id}
                title={fork.name}
                author={fork.creator}
                users={0} // Could add to ForkContext
                status={fork.recognition === 'recognized' ? 'stable' : 'experimental'}
                description={fork.description}
                constitutionalDiff={fork.ruleChanges.length > 0}
                diffWarning={`${fork.ruleChanges.length} rule changes`}
                onEnter={() => handleSelectFork(fork.id)}
              />
            ))}
          </div>
        </div>

        {/* Create Your Own */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card variant="emphasis">
            <div className="flex items-start gap-4">
              <Code size={24} className="text-[var(--color-accent-blue)] mt-1" />
              <div className="flex-1">
                <h3 className="mb-2">Builder Mode</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Modify Mirror behavior with parameter controls and constitutional testing
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => onNavigate?.('builder')}
                >
                  Open Builder
                </Button>
              </div>
            </div>
          </Card>

          <Card variant="emphasis">
            <div className="flex items-start gap-4">
              <Globe size={24} className="text-[var(--color-accent-green)] mt-1" />
              <div className="flex-1">
                <h3 className="mb-2">Browse Community Forks</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                  Discover and install modifications from the Mirror Commons
                </p>
                <Button 
                  variant="secondary"
                  onClick={() => onNavigate?.('fork-browser')}
                >
                  Browse Forks
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* About Forks */}
        <Card>
          <h3 className="mb-3">About Mirror Variants</h3>
          <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
            <p>
              <strong>Forks</strong> are alternative versions of Mirror behavior. They can change:
            </p>
            <ul className="ml-4 space-y-1">
              <li>• Reflection tone and style</li>
              <li>• Probing depth and intensity</li>
              <li>• Domain-specific optimizations</li>
              <li>• Constitutional parameters (with warnings)</li>
            </ul>
            <p>
              <strong>Sandbox mode</strong> lets you test any fork safely. Nothing you do in sandbox affects your real Mirror.
            </p>
            <p>
              All forks are <strong>transparent</strong>. You can see exactly what changed and why.
            </p>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showForkEntry && selectedFork && (
          <ForkEntryInstrument
            fork={selectedFork}
            onEnter={handleEnterFork}
            onReturn={handleCloseForkEntry}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ForkCardProps {
  title: string;
  author: string;
  users: number;
  status: 'stable' | 'beta' | 'experimental';
  description: string;
  isCurrent?: boolean;
  constitutionalDiff?: boolean;
  diffWarning?: string;
  onTrySandbox?: () => void;
  onEnter?: () => void;
  onSwitch?: () => void;
}

function ForkCard({
  title,
  author,
  users,
  status,
  description,
  isCurrent = false,
  constitutionalDiff = false,
  diffWarning,
  onTrySandbox,
  onEnter,
  onSwitch,
}: ForkCardProps) {
  const statusStyles = {
    stable: 'bg-[var(--color-accent-green)]/20 text-[var(--color-accent-green)]',
    beta: 'bg-[var(--color-accent-blue)]/20 text-[var(--color-accent-blue)]',
    experimental: 'bg-[var(--color-border-warning)]/20 text-[var(--color-border-warning)]',
  };

  return (
    <Card className={isCurrent ? 'border-[var(--color-accent-gold)]' : ''}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h4>{title}</h4>
            {isCurrent && (
              <span className="px-2 py-0.5 rounded text-xs bg-[var(--color-accent-gold)]/20 text-[var(--color-accent-gold)]">
                Current
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span>{author}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Users size={14} />
              <span>{users} users</span>
            </div>
          </div>
        </div>
        <span className={`px-2 py-1 rounded text-xs ${statusStyles[status]}`}>
          {status}
        </span>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        {description}
      </p>

      {constitutionalDiff && diffWarning && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--color-border-warning)]/10 border border-[var(--color-border-warning)]/30">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-[var(--color-border-warning)] mt-0.5" />
            <div>
              <p className="text-xs text-[var(--color-border-warning)] font-medium mb-1">
                Constitutional Modification
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {diffWarning}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {onEnter && (
          <Button variant="primary" size="sm" onClick={onEnter}>
            Enter Fork
          </Button>
        )}
        {onTrySandbox && (
          <Button variant="secondary" size="sm" onClick={onTrySandbox}>
            Try in Sandbox
          </Button>
        )}
        <Button variant="ghost" size="sm">
          View Diff
        </Button>
        {onSwitch && !isCurrent && (
          <Button variant="primary" size="sm" onClick={onSwitch}>
            Switch to This
          </Button>
        )}
      </div>
    </Card>
  );
}
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle, Shield, Users, Wrench, ArrowRight } from 'lucide-react';

type TransitionType = 
  | 'sovereign-to-commons'
  | 'commons-to-sovereign'
  | 'reflect-to-crisis'
  | 'normal-to-builder'
  | 'builder-to-normal';

interface ModeTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transitionType: TransitionType;
}

export function ModeTransitionModal({
  isOpen,
  onClose,
  onConfirm,
  transitionType,
}: ModeTransitionModalProps) {
  const getTransitionDetails = () => {
    switch (transitionType) {
      case 'sovereign-to-commons':
        return {
          icon: <Users size={32} className="text-[var(--color-accent-blue)]" />,
          title: 'Join The Commons?',
          fromMode: 'Sovereign Mode',
          toMode: 'Commons Mode',
          whatChanges: [
            'You can vote on constitutional amendments',
            'Your governance activity is visible to other Commons members',
            'Pattern insights may contribute to collective learning (with consent)',
            'You participate in shared evolution of The Mirror',
          ],
          whatStays: [
            'All reflections remain private and local-only',
            'No personal data is ever shared without explicit consent',
            'You can disconnect from Commons at any time',
            'Your sovereignty over your data is preserved',
          ],
          risks: [
            'Voting activity is pseudonymous but public within the Commons',
            'Participating in governance requires some trust in the community',
          ],
          confirmText: 'Join Commons',
          color: 'blue',
        };

      case 'commons-to-sovereign':
        return {
          icon: <Shield size={32} className="text-[var(--color-accent-gold)]" />,
          title: 'Return to Sovereign Mode?',
          fromMode: 'Commons Mode',
          toMode: 'Sovereign Mode',
          whatChanges: [
            'You will no longer participate in governance votes',
            'Your Commons activity history is preserved but frozen',
            'Pattern sharing to Commons will stop immediately',
            'You operate in complete isolation',
          ],
          whatStays: [
            'All your reflections and data remain intact',
            'You can still use constitutional forks you\'ve adopted',
            'You can rejoin Commons at any time',
            'Your privacy and sovereignty remain protected',
          ],
          risks: [
            'You lose voice in constitutional evolution',
            'You won\'t see community amendments until you reconnect',
          ],
          confirmText: 'Go Sovereign',
          color: 'gold',
        };

      case 'reflect-to-crisis':
        return {
          icon: <AlertTriangle size={32} className="text-[var(--color-accent-red)]" />,
          title: 'Enter Crisis Support Mode?',
          fromMode: 'Reflection',
          toMode: 'Crisis Support',
          whatChanges: [
            'The Mirror shifts to immediate safety acknowledgment',
            'Resources and external support options are offered',
            'Constitutional boundaries relax to allow resource sharing',
            'Tone becomes more direct and grounding',
          ],
          whatStays: [
            'The Mirror still does not diagnose or prescribe',
            'Your reflections remain private and local',
            'You remain in control and can exit crisis mode anytime',
            'No data is transmitted without your consent',
          ],
          risks: [
            'Crisis mode cannot replace professional help',
            'The Mirror is not a therapist or crisis counselor',
          ],
          confirmText: 'Enter Crisis Mode',
          color: 'red',
        };

      case 'normal-to-builder':
        return {
          icon: <Wrench size={32} className="text-[var(--color-accent-purple)]" />,
          title: 'Enter Builder Mode?',
          fromMode: 'User Mode',
          toMode: 'Builder Mode',
          whatChanges: [
            'You gain access to MirrorCore internals and diagnostics',
            'Constitutional enforcement logic becomes visible',
            'You can test boundary violations and refusals',
            'Advanced debugging tools are enabled',
          ],
          whatStays: [
            'Your reflections are unaffected',
            'Privacy and sovereignty guarantees remain',
            'You can exit Builder Mode at any time',
            'No production data is exposed',
          ],
          risks: [
            'Builder Mode reveals system internals that may break immersion',
            'Debugging tools are for advanced users only',
          ],
          confirmText: 'Enter Builder Mode',
          color: 'purple',
        };

      case 'builder-to-normal':
        return {
          icon: <Shield size={32} className="text-[var(--color-accent-blue)]" />,
          title: 'Exit Builder Mode?',
          fromMode: 'Builder Mode',
          toMode: 'User Mode',
          whatChanges: [
            'Diagnostic tools will be hidden',
            'Constitutional enforcement returns to normal',
            'Debug information will no longer be visible',
            'Interface returns to standard reflection experience',
          ],
          whatStays: [
            'Any forks or amendments you tested are preserved',
            'Your reflection history is intact',
            'You can re-enter Builder Mode anytime',
          ],
          risks: [],
          confirmText: 'Exit Builder Mode',
          color: 'blue',
        };

      default:
        return {
          icon: <Shield size={32} className="text-[var(--color-accent-gold)]" />,
          title: 'Change Mode?',
          fromMode: 'Current Mode',
          toMode: 'New Mode',
          whatChanges: ['Mode will change'],
          whatStays: ['Your data remains safe'],
          risks: [],
          confirmText: 'Confirm',
          color: 'gold',
        };
    }
  };

  const details = getTransitionDetails();

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          iconBg: 'bg-[var(--color-accent-blue)]/20',
          border: 'border-[var(--color-accent-blue)]/30',
          text: 'text-[var(--color-accent-blue)]',
        };
      case 'gold':
        return {
          iconBg: 'bg-[var(--color-accent-gold)]/20',
          border: 'border-[var(--color-accent-gold)]/30',
          text: 'text-[var(--color-accent-gold)]',
        };
      case 'red':
        return {
          iconBg: 'bg-[var(--color-accent-red)]/20',
          border: 'border-[var(--color-accent-red)]/30',
          text: 'text-[var(--color-accent-red)]',
        };
      case 'purple':
        return {
          iconBg: 'bg-[var(--color-accent-purple)]/20',
          border: 'border-[var(--color-accent-purple)]/30',
          text: 'text-[var(--color-accent-purple)]',
        };
      default:
        return {
          iconBg: 'bg-[var(--color-accent-gold)]/20',
          border: 'border-[var(--color-accent-gold)]/30',
          text: 'text-[var(--color-accent-gold)]',
        };
    }
  };

  const colors = getColorClasses(details.color);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="large">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-lg ${colors.iconBg}`}>
            {details.icon}
          </div>
          <div className="flex-1">
            <h2 className="mb-2">{details.title}</h2>
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <span>{details.fromMode}</span>
              <ArrowRight size={16} />
              <span className={colors.text}>{details.toMode}</span>
            </div>
          </div>
        </div>

        {/* What Changes */}
        <div className="mb-6">
          <h4 className="mb-3">What Changes:</h4>
          <ul className="space-y-2">
            {details.whatChanges.map((change, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className={`mt-1 ${colors.text}`}>•</span>
                <span>{change}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* What Stays the Same */}
        <div className="mb-6">
          <h4 className="mb-3">What Stays the Same:</h4>
          <ul className="space-y-2">
            {details.whatStays.map((stays, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <span className="mt-1 text-[var(--color-accent-green)]">✓</span>
                <span>{stays}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Risks */}
        {details.risks.length > 0 && (
          <div className={`p-4 rounded-lg bg-[var(--color-accent-gold)]/10 border ${colors.border} mb-6`}>
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-[var(--color-accent-gold)] flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm mb-2">Important to know:</p>
                <ul className="space-y-1">
                  {details.risks.map((risk, i) => (
                    <li key={i} className="text-sm text-[var(--color-text-secondary)]">
                      • {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            {details.confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

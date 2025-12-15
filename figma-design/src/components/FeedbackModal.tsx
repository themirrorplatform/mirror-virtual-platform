import { useState } from 'react';
import { Modal } from './Modal';
import { Checkbox } from './Input';
import { Button } from './Button';
import { Textarea } from './Input';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
}

export interface FeedbackData {
  issues: string[];
  action: 'note' | 'delete' | 'pause';
  customFeedback?: string;
}

export function FeedbackModal({ isOpen, onClose, onSubmit }: FeedbackModalProps) {
  const [selectedIssues, setSelectedIssues] = useState<string[]>([]);
  const [selectedAction, setSelectedAction] = useState<'note' | 'delete' | 'pause'>('note');
  const [customFeedback, setCustomFeedback] = useState('');

  const issues = [
    'It felt like advice, not reflection',
    'It missed what actually mattered',
    'It made me feel worse',
    'It misunderstood me / twisted my words',
    'The tone was off',
    'It was too probing / invasive',
  ];

  const handleIssueToggle = (issue: string) => {
    setSelectedIssues(prev =>
      prev.includes(issue)
        ? prev.filter(i => i !== issue)
        : [...prev, issue]
    );
  };

  const handleSubmit = () => {
    onSubmit({
      issues: selectedIssues,
      action: selectedAction,
      customFeedback: customFeedback || undefined,
    });
    
    // Reset state
    setSelectedIssues([]);
    setSelectedAction('note');
    setCustomFeedback('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" title="This Didn't Feel Right">
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="mb-3">What felt off?</h4>
          <div className="space-y-2">
            {issues.map(issue => (
              <Checkbox
                key={issue}
                checked={selectedIssues.includes(issue)}
                onChange={() => handleIssueToggle(issue)}
                label={issue}
              />
            ))}
          </div>
        </div>

        <div>
          <h5 className="mb-2 text-sm">Additional feedback (optional)</h5>
          <Textarea
            value={customFeedback}
            onChange={setCustomFeedback}
            placeholder="What would have felt more helpful?"
            rows={3}
          />
        </div>

        <div className="p-4 rounded-lg bg-[var(--color-surface-emphasis)]">
          <h4 className="mb-3">What would you like to do?</h4>
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={selectedAction === 'note'}
                onChange={() => setSelectedAction('note')}
                className="mt-1"
              />
              <div>
                <div className="text-sm text-[var(--color-text-primary)]">Note this for improvement</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Keep the reflection but flag it for learning
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={selectedAction === 'delete'}
                onChange={() => setSelectedAction('delete')}
                className="mt-1"
              />
              <div>
                <div className="text-sm text-[var(--color-text-primary)]">Don{"'"}t save this reflection</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Remove it from history entirely
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                name="action"
                checked={selectedAction === 'pause'}
                onChange={() => setSelectedAction('pause')}
                className="mt-1"
              />
              <div>
                <div className="text-sm text-[var(--color-text-primary)]">Pause Mirror for today</div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  Disable Mirrorback responses until tomorrow
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-[var(--color-accent-blue)]/10 border border-[var(--color-accent-blue)]/30">
          <p className="text-sm text-[var(--color-text-secondary)]">
            <strong>Your feedback matters.</strong> This helps Mirror learn what{"'"}s working and what isn{"'"}t. 
            The local critic will use this signal to improve future reflections.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            Submit Feedback
          </Button>
        </div>
      </div>
    </Modal>
  );
}

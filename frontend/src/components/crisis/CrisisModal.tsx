import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { AlertCircle, Phone } from 'lucide-react';

interface CrisisModalProps { open: boolean; onOpenChange: (open: boolean) => void; }

export function CrisisModal({ open, onOpenChange }: CrisisModalProps) {
  const [selectedOption, setSelectedOption] = useState<string>('minimal');

  const handleContinue = () => {
    console.log('Crisis mode:', selectedOption);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col gap-8">
        {/* Warning */}
        <div className="p-6 rounded-2xl bg-[var(--color-accent-red)]/10 border-2 border-[var(--color-accent-red)]/30">
          <div className="flex items-start gap-4">
            <AlertCircle size={22} className="text-[var(--color-accent-red)] mt-0.5" />
            <div>
              <p className="text-base text-[var(--color-text-primary)] mb-3 leading-[1.7]">
                <strong>The Mirror is not an emergency service.</strong>
              </p>
              <p className="text-base text-[var(--color-text-secondary)] leading-[1.7]">
                If you{"'"}re in immediate danger or crisis, please contact emergency services or a crisis hotline.
              </p>
            </div>
          </div>
        </div>

        {/* Crisis Hotlines */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface-emphasis)] border border-[var(--color-border-subtle)]">
          <div className="flex items-center gap-3 mb-5">
            <Phone size={20} className="text-[var(--color-accent-gold)]" />
            <h4 className="text-base">Crisis Resources</h4>
          </div>
          <div className="space-y-4 text-base">
            <div>
              <div className="text-[var(--color-text-primary)] mb-1">National Suicide Prevention Lifeline</div>
              <div className="text-lg text-[var(--color-accent-gold)]">988</div>
            </div>
            <div>
              <div className="text-[var(--color-text-primary)] mb-1">Crisis Text Line</div>
              <div className="text-lg text-[var(--color-accent-gold)]">Text HOME to 741741</div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div>
          <h4 className="text-lg mb-5">How would you like to proceed?</h4>
          <RadioGroup value={selectedOption} onValueChange={setSelectedOption} className="flex flex-col gap-4">
            <label className="p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] cursor-pointer transition-colors">
              <div className="flex items-center space-x-2"><RadioGroupItem value="write" id="write" /><label htmlFor="write" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Write without getting a Mirrorback</label></div>
              <p className="text-sm text-[var(--color-text-muted)] ml-8 mt-2 leading-[1.7]">
                Storage-only mode. Your reflection will be saved but Mirror won{"'"}t respond.
              </p>
            </label>

            <label className="p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] cursor-pointer transition-colors">
              <div className="flex items-center space-x-2"><RadioGroupItem value="minimal" id="minimal" /><label htmlFor="minimal" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Get a very minimal reflection</label></div>
              <p className="text-sm text-[var(--color-text-muted)] ml-8 mt-2 leading-[1.7]">
                Mirror will offer a brief, gentle response. No analysis, no probing.
              </p>
            </label>

            <label className="p-6 rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] cursor-pointer transition-colors">
              <div className="flex items-center space-x-2"><RadioGroupItem value="pause" id="pause" /><label htmlFor="pause" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Pause Mirror for today</label></div>
              <p className="text-sm text-[var(--color-text-muted)] ml-8 mt-2 leading-[1.7]">
                Disable all Mirrorback responses until tomorrow. Reflections can still be written.
              </p>
            </label>
          </div>
        </div>

        {/* Note */}
        <div className="p-5 rounded-2xl bg-[var(--color-surface-chip)]">
          <p className="text-sm text-[var(--color-text-secondary)] leading-[1.7]">
            <strong>Note:</strong> In crisis mode, Mirror disables learning by default. Nothing you share will be used to adjust behavior or shared with Commons.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleContinue}>
            Continue
          </Button>
        </div>
      </div>
    </Dialog>
  );
}


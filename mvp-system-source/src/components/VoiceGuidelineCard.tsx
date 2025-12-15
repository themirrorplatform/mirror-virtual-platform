import { Card } from './Card';
import { CheckCircle, XCircle } from 'lucide-react';

interface VoiceGuidelineCardProps {
  title: string;
  description: string;
  dos: string[];
  donts: string[];
}

export function VoiceGuidelineCard({
  title,
  description,
  dos,
  donts,
}: VoiceGuidelineCardProps) {
  return (
    <Card>
      <h3 className="mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        {description}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Do's */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-[var(--color-accent-green)]" />
            <h5 className="text-sm uppercase tracking-wide text-[var(--color-accent-green)]">
              Do
            </h5>
          </div>
          <div className="space-y-2">
            {dos.map((item, i) => (
              <div 
                key={i}
                className="p-3 rounded-lg bg-[var(--color-accent-green)]/10 border border-[var(--color-accent-green)]/30 text-sm text-[var(--color-text-secondary)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Don'ts */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <XCircle size={16} className="text-[var(--color-accent-red)]" />
            <h5 className="text-sm uppercase tracking-wide text-[var(--color-accent-red)]">
              Don{'\u2019'}t
            </h5>
          </div>
          <div className="space-y-2">
            {donts.map((item, i) => (
              <div 
                key={i}
                className="p-3 rounded-lg bg-[var(--color-accent-red)]/10 border border-[var(--color-accent-red)]/30 text-sm text-[var(--color-text-secondary)]"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

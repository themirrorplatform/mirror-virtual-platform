import { X } from "lucide-react";

interface LicenseStackInstrumentProps {
  onComplete: (licenses: any) => void;
  onDismiss: () => void;
}

export function LicenseStackInstrument({ onComplete, onDismiss }: LicenseStackInstrumentProps) {
  return (
    <div className="fixed inset-0 z-50">
      <button onClick={onDismiss}>
        <X />
      </button>
      <h2>License Stack</h2>
    </div>
  );
}

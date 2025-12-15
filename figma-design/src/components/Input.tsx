import { ChangeEvent, TextareaHTMLAttributes } from 'react';

interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  helper?: string;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function Input({ value, onChange, placeholder, disabled, error, helper, className = '', autoFocus, onKeyDown }: InputProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={`
          w-full px-5 py-3 rounded-xl
          bg-[var(--color-base-raised)] 
          border ${error ? 'border-[var(--color-border-critical)]' : 'border-[var(--color-border-subtle)]'}
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)]
          focus:outline-none focus:border-[var(--color-accent-gold)] focus:shadow-[0_0_0_3px_rgba(203,163,93,0.1)]
          transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      {(error || helper) && (
        <span className={`text-sm px-1 ${error ? 'text-[var(--color-accent-red)]' : 'text-[var(--color-text-muted)]'}`}>
          {error || helper}
        </span>
      )}
    </div>
  );
}

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  error?: string;
  helper?: string;
  className?: string;
}

export function Textarea({ 
  value, 
  onChange, 
  placeholder, 
  rows = 6,
  disabled, 
  error, 
  helper, 
  className = '',
  ...props 
}: TextareaProps) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`
          w-full px-5 py-4 rounded-xl
          bg-[var(--color-base-raised)] 
          border ${error ? 'border-[var(--color-border-critical)]' : 'border-[var(--color-border-subtle)]'}
          text-[var(--color-text-primary)]
          placeholder:text-[var(--color-text-muted)]
          focus:outline-none focus:border-[var(--color-accent-gold)] focus:shadow-[0_0_0_3px_rgba(203,163,93,0.1)]
          transition-all
          resize-none
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        {...props}
      />
      {(error || helper) && (
        <span className={`text-sm px-1 ${error ? 'text-[var(--color-accent-red)]' : 'text-[var(--color-text-muted)]'}`}>
          {error || helper}
        </span>
      )}
    </div>
  );
}

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, label, disabled }: CheckboxProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="
          w-5 h-5 rounded
          border-2 border-[var(--color-border-subtle)]
          bg-[var(--color-base-raised)]
          checked:bg-[var(--color-accent-gold)]
          checked:border-[var(--color-accent-gold)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] focus:ring-opacity-30
          transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      />
      <span className="text-[var(--color-text-primary)] group-hover:text-[var(--color-text-accent)] transition-colors">
        {label}
      </span>
    </label>
  );
}

interface RadioProps {
  checked: boolean;
  onChange: () => void;
  label: string;
  name: string;
  disabled?: boolean;
}

export function Radio({ checked, onChange, label, name, disabled }: RadioProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <input
        type="radio"
        checked={checked}
        onChange={onChange}
        name={name}
        disabled={disabled}
        className="
          w-5 h-5 rounded-full
          border-2 border-[var(--color-border-subtle)]
          bg-[var(--color-base-raised)]
          checked:bg-[var(--color-accent-gold)]
          checked:border-[var(--color-accent-gold)]
          focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)] focus:ring-opacity-30
          transition-colors cursor-pointer
          disabled:opacity-50 disabled:cursor-not-allowed
        "
      />
      <span className="text-[var(--color-text-primary)] group-hover:text-[var(--color-text-accent)] transition-colors">
        {label}
      </span>
    </label>
  );
}
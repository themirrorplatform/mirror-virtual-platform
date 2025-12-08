import { useState } from 'react';

interface ReflectionComposerProps {
  onSubmit: (data: {
    body: string;
    lens_key?: string;
    visibility: 'public' | 'private' | 'unlisted';
  }) => void;
  submitting?: boolean;
}

const LENSES = [
  { key: 'wealth', label: 'Wealth' },
  { key: 'mind', label: 'Mind' },
  { key: 'belief', label: 'Belief' },
  { key: 'ai', label: 'AI' },
  { key: 'life', label: 'Life' },
  { key: 'heart', label: 'Heart' },
];

export default function ReflectionComposer({ onSubmit, submitting = false }: ReflectionComposerProps) {
  const [body, setBody] = useState('');
  const [lensKey, setLensKey] = useState<string>('');
  const [visibility, setVisibility] = useState<'public' | 'private' | 'unlisted'>('public');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (body.trim()) {
      onSubmit({
        body: body.trim(),
        lens_key: lensKey || undefined,
        visibility,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Text Area */}
      <div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What are you reflecting on?"
          className="w-full h-40 px-4 py-3 bg-gray-900 border border-gold/20 rounded-lg
                   text-white placeholder-gray-500 focus:outline-none focus:border-gold/50
                   resize-none"
          disabled={submitting}
        />
        <p className="text-sm text-gray-500 mt-2">
          {body.length} characters
        </p>
      </div>

      {/* Lens Selection */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-400">
          Lens (optional)
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setLensKey('')}
            className={`px-3 py-1 rounded-full text-sm transition ${
              lensKey === ''
                ? 'bg-gold text-black'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            None
          </button>
          {LENSES.map((lens) => (
            <button
              key={lens.key}
              type="button"
              onClick={() => setLensKey(lens.key)}
              className={`px-3 py-1 rounded-full text-sm transition ${
                lensKey === lens.key
                  ? 'bg-gold text-black'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {lens.label}
            </button>
          ))}
        </div>
      </div>

      {/* Visibility */}
      <div>
        <label className="block text-sm font-medium mb-2 text-gray-400">
          Visibility
        </label>
        <div className="flex gap-4">
          {(['public', 'private', 'unlisted'] as const).map((v) => (
            <label key={v} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name="visibility"
                value={v}
                checked={visibility === v}
                onChange={(e) => setVisibility(e.target.value as typeof visibility)}
                className="text-gold focus:ring-gold"
              />
              <span className="text-sm capitalize">{v}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!body.trim() || submitting}
        className="w-full bg-gold text-black font-semibold py-3 rounded-lg
                 hover:bg-gold/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? 'Reflecting...' : 'Reflect'}
      </button>
    </form>
  );
}

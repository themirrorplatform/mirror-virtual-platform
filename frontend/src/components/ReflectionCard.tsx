import { useState } from 'react';
import { FeedItem, mirrorbacks, signals } from '@/lib/api';
import { EvolutionBadge, getEvolutionType } from './EvolutionBadge';

interface ReflectionCardProps {
  item: FeedItem;
}

export function ReflectionCard({ item }: ReflectionCardProps) {
  const { reflection, author, mirrorback_count, signal_counts, user_signal } = item;
  const [showMirrorback, setShowMirrorback] = useState(false);
  const [mirrorbackText, setMirrorbackText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ripplePosition, setRipplePosition] = useState<{ x: number; y: number } | null>(null);

  const handleGetMirrorback = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Create ripple effect
    const rect = e.currentTarget.getBoundingClientRect();
    setRipplePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setTimeout(() => setRipplePosition(null), 1000);

    try {
      setLoading(true);
      const response = await mirrorbacks.create(reflection.id);
      setMirrorbackText(response.data.body);
      setShowMirrorback(true);
    } catch (err) {
      console.error('Failed to get mirrorback:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignal = async (signalType: 'resonated' | 'challenged' | 'skipped' | 'saved') => {
    try {
      await signals.create({
        reflection_id: reflection.id,
        signal: signalType,
      });
    } catch (err) {
      console.error('Failed to create signal:', err);
    }
  };

  // Determine evolution type (mock for now - would come from backend)
  const evolutionType = getEvolutionType();

  return (
    <article 
      className="
        mirror-glass mirror-noise 
        border border-mirror-line rounded-2xl p-6 
        shadow-mirror-soft
        hover:border-mirror-gold/40 
        transition-mirror
        relative overflow-hidden
        animate-breathe
      "
      role="article"
      aria-label={`Reflection by ${author.display_name || author.username}`}
    >
      {/* Author */}
      <div className="flex items-center mb-4 relative z-10">
        <div className="w-10 h-10 rounded-full bg-mirror-gold/20 flex items-center justify-center text-mirror-gold font-bold ring-2 ring-mirror-gold/30">
          {author.username[0].toUpperCase()}
        </div>
        <div className="ml-3">
          <p className="font-garamond font-semibold text-mirror-fog">{author.display_name || author.username}</p>
          <p className="text-sm text-mirror-mist/60">@{author.username}</p>
        </div>
        {reflection.lens_key && (
          <span className="ml-auto px-3 py-1 bg-mirror-gold/10 text-mirror-gold-soft text-xs rounded-full border border-mirror-gold/20 font-inter">
            {reflection.lens_key}
          </span>
        )}
      </div>

      {/* Evolution Badge */}
      {evolutionType && (
        <div className="mb-3">
          <EvolutionBadge type={evolutionType} size="sm" />
        </div>
      )}

      {/* Reflection Body */}
      <div className="mb-4 relative z-10">
        <p className="text-mirror-fog font-inter text-base leading-relaxed whitespace-pre-wrap">
          {reflection.body}
        </p>
      </div>

      {/* Mirrorback Section */}
      {mirrorback_count > 0 && !showMirrorback && (
        <button
          onClick={() => setShowMirrorback(true)}
          className="text-sm text-mirror-gold-soft hover:text-mirror-gold mb-4 transition-mirror-fast font-inter underline decoration-mirror-gold/30 hover:decoration-mirror-gold/60"
          aria-label="View AI mirrorback response"
        >
          View Mirrorback
        </button>
      )}

      {showMirrorback && mirrorbackText && (
        <div className="mirror-glass border border-mirror-gold/30 rounded-xl p-4 mb-4 shadow-mirror-inner relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-mirror-gold/5 to-transparent" />
          <p className="text-xs text-mirror-gold-soft mb-2 font-semibold font-inter flex items-center gap-2 relative z-10">
            <span className="inline-block w-5 h-5 text-center">🪞</span>
            Mirrorback
          </p>
          <p className="text-mirror-fog/90 italic font-garamond text-base leading-relaxed relative z-10">
            {mirrorbackText}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-4 text-sm relative z-10">
        {mirrorback_count === 0 && (
          <button
            onClick={handleGetMirrorback}
            disabled={loading}
            className="
              px-4 py-2 
              bg-gradient-to-r from-mirror-gold to-mirror-gold-soft 
              text-mirror-obsidian font-semibold font-inter text-xs
              rounded-lg 
              shadow-mirror-glow
              hover:shadow-mirror-glow-intense 
              transition-mirror-fast
              disabled:opacity-50 disabled:cursor-not-allowed
              relative overflow-hidden
            "
            aria-label="Get AI mirrorback"
          >
            {ripplePosition && (
              <span
                className="absolute rounded-full bg-white/30 animate-ripple"
                style={{
                  left: ripplePosition.x,
                  top: ripplePosition.y,
                  width: '10px',
                  height: '10px',
                }}
              />
            )}
            <span className="relative z-10">
              {loading ? 'Reflecting...' : '🪞 Get Mirrorback'}
            </span>
          </button>
        )}

        <button
          onClick={() => handleSignal('resonated')}
          className="text-mirror-mist hover:text-mirror-growth transition-mirror-fast font-inter flex items-center gap-1.5 px-2 py-1"
          aria-label="Signal: Resonated"
        >
          <span>✓</span>
          <span className="text-xs">Resonated {signal_counts.resonated || ''}</span>
        </button>

        <button
          onClick={() => handleSignal('challenged')}
          className="text-mirror-mist hover:text-mirror-loop transition-mirror-fast font-inter flex items-center gap-1.5 px-2 py-1"
          aria-label="Signal: Challenged"
        >
          <span>⚡</span>
          <span className="text-xs">Challenged {signal_counts.challenged || ''}</span>
        </button>

        <button
          onClick={() => handleSignal('saved')}
          className="text-mirror-mist hover:text-mirror-breakthrough transition-mirror-fast font-inter flex items-center gap-1.5 px-2 py-1"
          aria-label="Signal: Saved"
        >
          <span>⭐</span>
          <span className="text-xs">Save</span>
        </button>
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-xs text-mirror-mist/50 font-inter relative z-10">
        {new Date(reflection.created_at).toLocaleString()}
      </div>
    </article>
  );
}

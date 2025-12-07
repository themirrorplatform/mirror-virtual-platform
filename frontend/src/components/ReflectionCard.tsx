import { useState } from 'react';
import { FeedItem, mirrorbacks, signals } from '@/lib/api';

interface ReflectionCardProps {
  item: FeedItem;
}

export default function ReflectionCard({ item }: ReflectionCardProps) {
  const { reflection, author, mirrorback_count, signal_counts, user_signal } = item;
  const [showMirrorback, setShowMirrorback] = useState(false);
  const [mirrorbackText, setMirrorbackText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGetMirrorback = async () => {
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

  return (
    <article className="bg-gray-900 border border-gold/20 rounded-lg p-6 hover:border-gold/40 transition">
      {/* Author */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center text-gold font-bold">
          {author.username[0].toUpperCase()}
        </div>
        <div className="ml-3">
          <p className="font-semibold">{author.display_name || author.username}</p>
          <p className="text-sm text-gray-500">@{author.username}</p>
        </div>
        {reflection.lens_key && (
          <span className="ml-auto px-3 py-1 bg-gold/10 text-gold text-xs rounded-full">
            {reflection.lens_key}
          </span>
        )}
      </div>

      {/* Reflection Body */}
      <div className="mb-4">
        <p className="text-gray-100 whitespace-pre-wrap">{reflection.body}</p>
      </div>

      {/* Mirrorback Section */}
      {mirrorback_count > 0 && !showMirrorback && (
        <button
          onClick={() => setShowMirrorback(true)}
          className="text-sm text-gold hover:underline mb-4"
        >
          View Mirrorback
        </button>
      )}

      {showMirrorback && mirrorbackText && (
        <div className="bg-black/50 border border-gold/30 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-400 mb-2 font-semibold">🪞 Mirrorback</p>
          <p className="text-gray-200 italic">{mirrorbackText}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center space-x-4 text-sm">
        {mirrorback_count === 0 && (
          <button
            onClick={handleGetMirrorback}
            disabled={loading}
            className="text-gold hover:text-gold/80 transition disabled:opacity-50"
          >
            {loading ? 'Generating...' : '🪞 Get Mirrorback'}
          </button>
        )}

        <button
          onClick={() => handleSignal('resonated')}
          className="text-gray-400 hover:text-green-400 transition"
        >
          ✓ Resonated {signal_counts.resonated || ''}
        </button>

        <button
          onClick={() => handleSignal('challenged')}
          className="text-gray-400 hover:text-orange-400 transition"
        >
          ⚡ Challenged {signal_counts.challenged || ''}
        </button>

        <button
          onClick={() => handleSignal('saved')}
          className="text-gray-400 hover:text-blue-400 transition"
        >
          ⭐ Save
        </button>
      </div>

      {/* Timestamp */}
      <div className="mt-4 text-xs text-gray-600">
        {new Date(reflection.created_at).toLocaleString()}
      </div>
    </article>
  );
}

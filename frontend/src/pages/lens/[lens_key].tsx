import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import FeedList from '@/components/FeedList';
import { lenses, FeedItem } from '@/lib/api';

const LENS_INFO = {
  wealth: {
    title: 'Wealth',
    description: 'Reflections on money, value, abundance, and financial wellbeing',
    color: '#ffd700',
  },
  mind: {
    title: 'Mind',
    description: 'Explorations of consciousness, thought patterns, and mental clarity',
    color: '#4ed4a7',
  },
  belief: {
    title: 'Belief',
    description: 'Reflections on faith, values, and foundational truths',
    color: '#3a8bff',
  },
  ai: {
    title: 'AI',
    description: 'Perspectives on artificial intelligence, technology, and the future',
    color: '#f5a623',
  },
  life: {
    title: 'Life',
    description: 'Reflections on existence, purpose, and lived experience',
    color: '#ff6b6b',
  },
  heart: {
    title: 'Heart',
    description: 'Explorations of emotion, relationships, and human connection',
    color: '#ff69b4',
  },
};

export default function LensPage() {
  const router = useRouter();
  const { lens_key } = router.query;
  
  const [items, setItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const lensInfo = lens_key && typeof lens_key === 'string' 
    ? LENS_INFO[lens_key as keyof typeof LENS_INFO] 
    : null;

  useEffect(() => {
    if (lens_key && typeof lens_key === 'string') {
      loadReflections();
    }
  }, [lens_key]);

  const loadReflections = async (loadMore = false) => {
    if (!lens_key || typeof lens_key !== 'string') return;
    
    try {
      setLoading(true);
      const response = await lenses.getByLens(
        lens_key,
        20,
        loadMore ? cursor : null
      );
      
      if (loadMore) {
        setItems([...items, ...response.data.items]);
      } else {
        setItems(response.data.items);
      }
      
      setCursor(response.data.next_cursor || null);
      setHasMore(response.data.has_more);
    } catch (err) {
      console.error('Failed to load reflections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadReflections(true);
    }
  };

  if (!lensInfo) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-12 text-center">
          <h1 className="text-3xl font-bold mb-4">Lens Not Found</h1>
          <p className="text-gray-400">
            The lens &quot;{lens_key}&quot; does not exist.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto py-8">
        {/* Lens Header */}
        <div className="mb-8 pb-6 border-b border-gold/20">
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
              style={{ backgroundColor: `${lensInfo.color}20` }}
            >
              <span style={{ color: lensInfo.color }}>◆</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold" style={{ color: lensInfo.color }}>
                {lensInfo.title}
              </h1>
              <p className="text-gray-400 mt-1">{lensInfo.description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{items.length} reflections</span>
          </div>
        </div>

        {/* Reflections Feed */}
        {loading && items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>Loading reflections...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No reflections yet in this lens.</p>
            <p className="text-sm">Be the first to share a reflection about {lensInfo.title}.</p>
          </div>
        ) : (
          <>
            <FeedList items={items} />
            
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loading}
                  className="px-6 py-2 bg-gold/20 hover:bg-gold/30 text-gold rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

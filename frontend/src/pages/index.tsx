import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import FeedList from '@/components/FeedList';
import { feed, FeedItem } from '@/lib/api';

export default function Home() {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<number | undefined>();

  useEffect(() => {
    loadFeed();
  }, []);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const response = await feed.getPublic(20, cursor);
      setFeedItems(response.data.items);
      setCursor(response.data.next_cursor);
    } catch (err: any) {
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gold">The Mirror</h1>
          <p className="text-gray-400">
            A social platform built on reflection, not engagement.
          </p>
        </header>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            Loading reflections...
          </div>
        ) : (
          <FeedList items={feedItems} />
        )}
      </div>
    </Layout>
  );
}

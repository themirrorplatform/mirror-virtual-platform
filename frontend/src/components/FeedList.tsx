import { FeedItem } from '@/lib/api';
import ReflectionCard from './ReflectionCard';

interface FeedListProps {
  items: FeedItem[];
}

export default function FeedList({ items }: FeedListProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg mb-2">No reflections yet.</p>
        <p className="text-sm">Be the first to share a reflection.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <ReflectionCard key={item.reflection.id} item={item} />
      ))}
    </div>
  );
}

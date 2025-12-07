import { useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import ReflectionComposer from '@/components/ReflectionComposer';
import { reflections } from '@/lib/api';

export default function Reflect() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (data: {
    body: string;
    lens_key?: string;
    visibility: 'public' | 'private' | 'unlisted';
  }) => {
    try {
      setSubmitting(true);
      setError(null);
      const response = await reflections.create(data);

      // Redirect to home feed
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create reflection');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gold">Reflect</h1>
          <p className="text-gray-400">
            What's on your mind? No judgment. Just reflection.
          </p>
        </header>

        {error && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <ReflectionComposer onSubmit={handleSubmit} submitting={submitting} />
      </div>
    </Layout>
  );
}

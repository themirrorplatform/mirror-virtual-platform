import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { WitnessButton } from './WitnessButton';
import { ResponseComposer } from './ResponseComposer';
import { motion } from 'motion/react';

interface Response {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    isAnonymous?: boolean;
  };
  timestamp: string;
}

interface PostDetailProps {
  post: {
    id: string;
    content: string;
    author: {
      id: string;
      name: string;
      isAnonymous?: boolean;
    };
    timestamp: string;
  };
  responses: Response[];
  isWitnessed: boolean;
  onWitness: () => void;
  onBack: () => void;
  onSubmitResponse: (response: string, isAnonymous: boolean) => void;
}

export function PostDetail({
  post,
  responses,
  isWitnessed,
  onWitness,
  onBack,
  onSubmitResponse,
}: PostDetailProps) {
  const [showResponseComposer, setShowResponseComposer] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-12">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-3 text-base text-[var(--color-text-muted)] hover:text-[var(--color-accent-gold)] transition-colors mb-10 p-2 -ml-2 rounded-lg"
      >
        <ArrowLeft size={18} />
        Back to World
      </button>

      {/* Post content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        className="mb-12"
      >
        <p className="text-xl text-[var(--color-text-primary)] leading-[2] whitespace-pre-wrap mb-8">
          {post.content}
        </p>

        {/* Author and timestamp - subdued */}
        <div className="flex items-center justify-between text-base text-[var(--color-text-muted)] mb-8">
          <span>
            {post.author.isAnonymous ? 'Anonymous' : post.author.name}
          </span>
          <span>{post.timestamp}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <WitnessButton
            isWitnessed={isWitnessed}
            onToggle={onWitness}
          />

          <button
            onClick={() => setShowResponseComposer(true)}
            className="px-5 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-accent-gold)] transition-colors text-base text-[var(--color-text-secondary)] hover:text-[var(--color-accent-gold)]"
          >
            Respond
          </button>
        </div>
      </motion.div>

      {/* Separator */}
      {responses.length > 0 && (
        <div className="h-px bg-[var(--color-border-subtle)] mb-12" />
      )}

      {/* Responses */}
      <div className="space-y-8">
        {responses.length > 0 ? (
          <>
            <h3 className="text-base text-[var(--color-text-muted)]">
              {responses.length} response{responses.length !== 1 ? 's' : ''}
            </h3>
            {responses.map((response, index) => (
              <motion.div
                key={response.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.05,
                  ease: [0.23, 1, 0.32, 1] 
                }}
                className="pl-8 border-l-2 border-[var(--color-border-subtle)] py-2"
              >
                <p className="text-base text-[var(--color-text-secondary)] leading-[1.8] whitespace-pre-wrap mb-4">
                  {response.content}
                </p>
                <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
                  <span>
                    {response.author.isAnonymous ? 'Anonymous' : response.author.name}
                  </span>
                  <span>{response.timestamp}</span>
                </div>
              </motion.div>
            ))}
          </>
        ) : (
          <p className="text-center text-base text-[var(--color-text-muted)] py-12">
            ...
          </p>
        )}
      </div>

      {/* Response Composer Modal */}
      <ResponseComposer
        isOpen={showResponseComposer}
        onClose={() => setShowResponseComposer(false)}
        onSubmit={onSubmitResponse}
        originalContent={post.content}
      />
    </div>
  );
}
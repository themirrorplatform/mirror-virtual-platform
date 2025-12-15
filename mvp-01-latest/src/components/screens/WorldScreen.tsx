import { useState } from 'react';
import { WorldFeed } from '../WorldFeed';
import { PostDetail } from '../PostDetail';
import { Button } from '../Button';

interface Post {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    isAnonymous?: boolean;
  };
  timestamp: string;
  isWitnessed?: boolean;
  responseCount?: number;
}

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

export function WorldScreen() {
  const [commonsEnabled, setCommonsEnabled] = useState(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      content: 'I keep noticing tension between wanting to be seen and wanting to disappear. Neither feels quite true. Maybe the truth is in the oscillation itself.',
      author: { id: 'u1', name: 'Sarah M.', isAnonymous: true },
      timestamp: '3 hours ago',
      isWitnessed: false,
      responseCount: 2,
    },
    {
      id: '2',
      content: 'Money anxiety doesn\'t feel like "I need more." It feels like "I don\'t trust what I have." Where did that distrust come from?',
      author: { id: 'u2', name: 'Anonymous', isAnonymous: true },
      timestamp: '6 hours ago',
      isWitnessed: true,
      responseCount: 1,
    },
    {
      id: '3',
      content: 'Today I realized I\'ve been treating my body like infrastructure—something that just needs to work. What if it has something to say?',
      author: { id: 'u3', name: 'Jordan K.', isAnonymous: false },
      timestamp: '1 day ago',
      isWitnessed: false,
      responseCount: 5,
    },
    {
      id: '4',
      content: 'Grief doesn\'t ask permission. It arrives when it wants. I\'m learning to leave the door open instead of pretending no one\'s knocking.',
      author: { id: 'u4', name: 'Anonymous', isAnonymous: true },
      timestamp: '1 day ago',
      isWitnessed: true,
      responseCount: 8,
    },
    {
      id: '5',
      content: 'What if rest isn\'t the opposite of productivity? What if it\'s a different kind of aliveness?',
      author: { id: 'u5', name: 'Alex T.', isAnonymous: false },
      timestamp: '2 days ago',
      isWitnessed: false,
      responseCount: 3,
    },
  ]);

  // Mock responses
  const getMockResponses = (postId: string): Response[] => {
    if (postId === '1') {
      return [
        {
          id: 'r1',
          content: 'This resonates. I notice the same pull in different directions. Sometimes I wonder if the oscillation is where I actually live.',
          author: { id: 'u6', name: 'Taylor P.', isAnonymous: false },
          timestamp: '2 hours ago',
        },
        {
          id: 'r2',
          content: 'Reading this, I felt something shift. The oscillation as the truth, not a problem to solve.',
          author: { id: 'u7', name: 'Anonymous', isAnonymous: true },
          timestamp: '1 hour ago',
        },
      ];
    } else if (postId === '2') {
      return [
        {
          id: 'r3',
          content: 'The distrust question stopped me. I think mine came from watching my parents\' relationship to money during childhood.',
          author: { id: 'u8', name: 'Morgan L.', isAnonymous: false },
          timestamp: '4 hours ago',
        },
      ];
    } else if (postId === '3') {
      return [
        {
          id: 'r4',
          content: 'My body has been trying to tell me things for years. I\'m only now learning to listen.',
          author: { id: 'u9', name: 'Anonymous', isAnonymous: true },
          timestamp: '18 hours ago',
        },
        {
          id: 'r5',
          content: 'Infrastructure. That word landed. I do this too.',
          author: { id: 'u10', name: 'Casey R.', isAnonymous: false },
          timestamp: '12 hours ago',
        },
      ];
    }
    return [];
  };

  const handleWitness = (postId: string) => {
    setPosts(posts.map(p => 
      p.id === postId ? { ...p, isWitnessed: !p.isWitnessed } : p
    ));
  };

  const handleRespond = (postId: string) => {
    setSelectedPostId(postId);
  };

  const handleSubmitResponse = (response: string, isAnonymous: boolean) => {
    console.log('New response:', { response, isAnonymous });
    // TODO: Add response to post
    // For now, just increment the counter
    setPosts(posts.map(p => 
      p.id === selectedPostId 
        ? { ...p, responseCount: (p.responseCount || 0) + 1 } 
        : p
    ));
  };

  const handleEnableCommons = () => {
    // In production, this would show a consent modal
    setCommonsEnabled(true);
  };

  // Commons not enabled state
  if (!commonsEnabled) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <h2 className="mb-6 text-2xl">World requires Commons</h2>
          <p className="text-[var(--color-text-secondary)] mb-12 max-w-lg leading-[1.7] text-base">
            World shows reflections shared by others who have joined Commons. 
            Joining means your shared reflections become visible to others.
          </p>
          <div className="space-y-5 mb-12 text-base text-[var(--color-text-muted)] max-w-lg">
            <p>• You control what gets shared</p>
            <p>• You can share anonymously</p>
            <p>• You can leave Commons anytime</p>
            <p>• No algorithmic ranking by default</p>
          </div>
          <Button variant="primary" onClick={handleEnableCommons}>
            Join Commons
          </Button>
        </div>
      </div>
    );
  }

  const selectedPost = posts.find(p => p.id === selectedPostId);

  if (selectedPost) {
    return (
      <PostDetail
        post={selectedPost}
        responses={getMockResponses(selectedPost.id)}
        isWitnessed={selectedPost.isWitnessed || false}
        onWitness={() => handleWitness(selectedPost.id)}
        onBack={() => setSelectedPostId(null)}
        onSubmitResponse={handleSubmitResponse}
      />
    );
  }

  return (
    <WorldFeed
      posts={posts}
      onPostClick={setSelectedPostId}
      onWitness={handleWitness}
      onRespond={handleRespond}
      currentPage={currentPage}
      totalPages={3}
      onPageChange={setCurrentPage}
    />
  );
}
import { ReflectionData } from '@components/ReflectionCard';
import { MirrorBack } from '@components/MirrorBackDisplay';

export const mockReflection: ReflectionData = {
  id: 'reflection-123',
  user_id: 'user-456',
  username: 'test_user',
  avatar_url: 'https://example.com/avatar.jpg',
  content: 'This is a test reflection about identity and growth.',
  tone: 'processing',
  visibility: 'public',
  created_at: '2025-12-14T10:00:00Z',
  likes_count: 5,
  replies_count: 3,
  signals_count: 2,
  has_mirrorback: true,
  metadata: {
    lens_tags: ['identity', 'relationships'],
    posture: 'grounded'
  }
};

export const mockMirrorback: MirrorBack = {
  id: 'mirrorback-789',
  reflection_id: 'reflection-123',
  content: 'Your reflection suggests you are navigating a tension between authenticity and social expectations. This is a common pattern when exploring identity.',
  tone: 'clear',
  source: 'ai',
  model_name: 'claude-3-5-sonnet',
  created_at: '2025-12-14T10:01:00Z',
  metadata: {
    processing_time_ms: 1250,
    constitutional_flags: [],
    patterns_surfaced: ['identity_tension', 'authenticity_exploration'],
    confidence: 0.87
  }
};

export const mockReflections: ReflectionData[] = [
  mockReflection,
  {
    ...mockReflection,
    id: 'reflection-124',
    content: 'Another reflection with raw tone',
    tone: 'raw',
    visibility: 'circle',
    likes_count: 2,
    replies_count: 0,
    has_mirrorback: false
  },
  {
    ...mockReflection,
    id: 'reflection-125',
    content: 'Clear reflection about resolved tension',
    tone: 'clear',
    visibility: 'private',
    likes_count: 0,
    replies_count: 1,
    has_mirrorback: true
  }
];

export const mockThread = {
  id: 'thread-1',
  parent_reflection: mockReflection,
  replies: [
    {
      ...mockReflection,
      id: 'reply-1',
      reply_to_id: 'reflection-123',
      content: 'Great insight!',
      replies_count: 1
    },
    {
      ...mockReflection,
      id: 'reply-2',
      reply_to_id: 'reply-1',
      content: 'I agree completely',
      replies_count: 0
    }
  ],
  participants: [
    {
      user_id: 'user-456',
      username: 'test_user',
      avatar_url: 'https://example.com/avatar.jpg',
      reply_count: 1
    },
    {
      user_id: 'user-789',
      username: 'other_user',
      avatar_url: 'https://example.com/avatar2.jpg',
      reply_count: 2
    }
  ],
  total_depth: 2,
  created_at: '2025-12-14T10:00:00Z',
  updated_at: '2025-12-14T10:05:00Z'
};

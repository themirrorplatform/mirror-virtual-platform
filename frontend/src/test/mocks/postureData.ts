import { PostureState } from '@components/PostureSelector';

export const mockPostureState: PostureState = {
  declared: 'grounded',
  suggested: 'open',
  confidence: 0.78,
  reasoning: 'Your recent reflections show increased openness to new perspectives',
  last_updated: '2025-12-14T10:00:00Z',
  divergence_detected: true
};

export const mockPostureHistory = [
  {
    id: 'history-1',
    posture: 'unknown',
    timestamp: '2025-12-10T08:00:00Z',
    source: 'declared',
    duration_minutes: 240
  },
  {
    id: 'history-2',
    posture: 'overwhelmed',
    timestamp: '2025-12-10T12:00:00Z',
    source: 'declared',
    duration_minutes: 180
  },
  {
    id: 'history-3',
    posture: 'guarded',
    timestamp: '2025-12-10T15:00:00Z',
    source: 'suggested',
    duration_minutes: 120
  },
  {
    id: 'history-4',
    posture: 'grounded',
    timestamp: '2025-12-10T17:00:00Z',
    source: 'declared',
    duration_minutes: 960
  },
  {
    id: 'history-5',
    posture: 'open',
    timestamp: '2025-12-14T09:00:00Z',
    source: 'suggested',
    duration_minutes: 60
  }
];

export const allPostures = [
  'unknown',
  'overwhelmed',
  'guarded',
  'grounded',
  'open',
  'exploratory'
] as const;

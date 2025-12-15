# Mirror Virtual Platform - Component API Documentation

## Core Reflection System

### ReflectionCard

**Purpose**: Display individual reflections with metadata, actions, and visual indicators.

**Import**:
```typescript
import ReflectionCard from '@components/ReflectionCard';
```

**Props**:
```typescript
interface ReflectionCardProps {
  reflection: ReflectionData;
  variant?: 'default' | 'compact' | 'thread' | 'detailed';
  onReply?: (reflectionId: string) => void;
  onLike?: (reflectionId: string) => void;
  onSignal?: (reflectionId: string) => void;
  onSave?: (reflectionId: string) => void;
  showActions?: boolean;
}
```

**Usage Example**:
```tsx
<ReflectionCard
  reflection={{
    id: '123',
    user_id: 'user-456',
    username: 'reflective_mind',
    content: 'Exploring the tension between authenticity and belonging...',
    tone: 'processing',
    visibility: 'public',
    created_at: '2025-12-14T10:00:00Z',
    likes_count: 5,
    replies_count: 3,
    signals_count: 2,
    has_mirrorback: true
  }}
  variant="default"
  onLike={(id) => console.log('Liked:', id)}
  onReply={(id) => console.log('Reply to:', id)}
/>
```

**Variants**:
- `default`: Full card with all metadata and actions
- `compact`: Condensed view for lists (line-clamp content)
- `thread`: Optimized for nested conversations
- `detailed`: Includes lens tags and extended metadata

**Key Features**:
- Tone indicator badges (raw/processing/clear)
- Visibility icons (public/circle/private)
- Interaction counts (likes, replies, signals)
- Mirrorback indicator
- Constitutional transparency notes

---

### MirrorBackDisplay

**Purpose**: Display AI or human responses to reflections with feedback collection.

**Import**:
```typescript
import MirrorBackDisplay from '@components/MirrorBackDisplay';
```

**Props**:
```typescript
interface MirrorBackDisplayProps {
  mirrorback: MirrorBack;
  onFeedback?: (feedback: { mirrorbackId: string; type: FeedbackType; comment?: string }) => void;
  variant?: 'default' | 'compact' | 'detailed';
  showActions?: boolean;
}

interface MirrorBack {
  id: string;
  reflection_id: string;
  content: string;
  tone: 'raw' | 'processing' | 'clear';
  source: 'ai' | 'human';
  model_name?: string;
  created_at: string;
  metadata?: {
    processing_time_ms?: number;
    constitutional_flags?: string[];
    patterns_surfaced?: string[];
    confidence?: number;
  };
}
```

**Usage Example**:
```tsx
<MirrorBackDisplay
  mirrorback={{
    id: 'mb-789',
    reflection_id: 'ref-123',
    content: 'Your reflection surfaces a tension between...',
    tone: 'clear',
    source: 'ai',
    model_name: 'claude-3-5-sonnet',
    created_at: '2025-12-14T10:01:00Z',
    metadata: {
      processing_time_ms: 1250,
      patterns_surfaced: ['identity_tension'],
      confidence: 0.87
    }
  }}
  variant="detailed"
  onFeedback={({mirrorbackId, type, comment}) => {
    // Store feedback for system evolution
    api.submitFeedback(mirrorbackId, type, comment);
  }}
/>
```

**Feedback Types**:
- `helpful`: User found response valuable
- `unhelpful`: User wants different approach
- `null`: Feedback removed/toggled off

**Key Features**:
- Source transparency (AI vs human)
- Model attribution for AI responses
- Copy to clipboard functionality
- Feedback collection with optional comments
- Metadata display (processing time, confidence, patterns)
- Constitutional commitment messaging

---

### ReflectionThread

**Purpose**: Display nested conversation threads with collapsible replies.

**Import**:
```typescript
import ReflectionThread from '@components/ReflectionThread';
```

**Props**:
```typescript
interface ReflectionThreadProps {
  thread: ReflectionThreadData;
  maxDepth?: number; // default: 5
  defaultCollapsed?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  onReply?: (reflectionId: string) => void;
  onLike?: (reflectionId: string) => void;
  onSignal?: (reflectionId: string) => void;
  onSave?: (reflectionId: string) => void;
}

interface ReflectionThreadData {
  id: string;
  parent_reflection: ReflectionData;
  replies: ReflectionData[];
  participants: ThreadParticipant[];
  total_depth: number;
  created_at: string;
  updated_at: string;
}
```

**Usage Example**:
```tsx
<ReflectionThread
  thread={{
    id: 'thread-1',
    parent_reflection: {...},
    replies: [...],
    participants: [
      { user_id: 'u1', username: 'alice', reply_count: 3 },
      { user_id: 'u2', username: 'bob', reply_count: 2 }
    ],
    total_depth: 3,
    created_at: '2025-12-14T10:00:00Z',
    updated_at: '2025-12-14T11:30:00Z'
  }}
  maxDepth={5}
  variant="detailed"
  onReply={(id) => openReplyComposer(id)}
/>
```

**Threading Algorithm**:
- Builds tree structure from flat reply array
- Auto-collapses threads deeper than 3 levels
- Preserves context with visual connectors
- Shows participant summary in detailed variant

**Key Features**:
- Recursive reply nesting
- Collapse/expand controls
- Participant avatars and counts
- Thread depth indicators
- Integrated mirrorback display
- Inherited visibility from parent

---

## Mirror Finder System

### PostureSelector

**Purpose**: Declare current emotional/cognitive posture with AI suggestions.

**Import**:
```typescript
import { PostureSelector } from '@components/PostureSelector';
```

**Props**:
```typescript
interface PostureSelectorProps {
  currentState: PostureState;
  onDeclare?: (posture: PostureType) => void;
  variant?: 'default' | 'compact';
  disabled?: boolean;
}

interface PostureState {
  declared: PostureType;
  suggested: PostureType;
  confidence: number;
  reasoning: string;
  last_updated: string;
  divergence_detected: boolean;
}

type PostureType = 'unknown' | 'overwhelmed' | 'guarded' | 'grounded' | 'open' | 'exploratory';
```

**Usage Example**:
```tsx
<PostureSelector
  currentState={{
    declared: 'grounded',
    suggested: 'open',
    confidence: 0.78,
    reasoning: 'Recent reflections show openness to new perspectives',
    last_updated: '2025-12-14T10:00:00Z',
    divergence_detected: true
  }}
  onDeclare={(newPosture) => {
    // Update user posture
    api.updatePosture(newPosture);
  }}
  variant="default"
/>
```

**Posture States**:
1. **Unknown**: Initial state, no pattern detected
2. **Overwhelmed**: High cognitive load, need simplicity
3. **Guarded**: Cautious, need safety
4. **Grounded**: Balanced, ready for standard interaction
5. **Open**: Receptive to new perspectives
6. **Exploratory**: Actively seeking challenge and growth

**Key Features**:
- Visual posture buttons with icons
- Divergence alert when suggested differs
- "Accept Suggestion" quick action
- Confidence score display
- Reasoning transparency
- Constitutional commitment note

---

### PostureDashboard

**Purpose**: Comprehensive posture history and analytics.

**Import**:
```typescript
import { PostureDashboard } from '@components/PostureDashboard';
```

**Props**:
```typescript
interface PostureDashboardProps {
  currentState: PostureState;
  history: PostureHistoryEntry[];
  onDeclare?: (posture: PostureType) => void;
  variant?: 'default' | 'minimal';
}

interface PostureHistoryEntry {
  id: string;
  posture: PostureType;
  timestamp: string;
  source: 'declared' | 'suggested';
  duration_minutes: number;
}
```

**Usage Example**:
```tsx
<PostureDashboard
  currentState={currentPostureState}
  history={[
    { id: '1', posture: 'grounded', timestamp: '2025-12-13T08:00:00Z', source: 'declared', duration_minutes: 960 },
    { id: '2', posture: 'open', timestamp: '2025-12-14T08:00:00Z', source: 'suggested', duration_minutes: 120 }
  ]}
  onDeclare={(posture) => updatePosture(posture)}
  variant="default"
/>
```

**Key Features**:
- Large current posture display
- Timeline visualization of posture history
- Suggested posture with reasoning
- "Why this suggestion?" explainer
- Posture frequency analytics
- Average duration per posture

---

## Data Visualization

### ForceDirectedGraph

**Purpose**: Interactive identity graph visualization using React Flow.

**Import**:
```typescript
import ForceDirectedGraph from '@components/ForceDirectedGraph';
```

**Props**:
```typescript
interface ForceDirectedGraphProps {
  nodes: GraphNodeData[];
  edges: GraphEdgeData[];
  onNodeClick?: (nodeId: string) => void;
  onEdgeClick?: (edgeId: string) => void;
  filterLensTags?: string[];
  variant?: 'default' | 'compact';
}

interface GraphNodeData {
  id: string;
  type: 'thought' | 'belief' | 'emotion' | 'action' | 'experience' | 'consequence';
  label: string;
  content: string;
  activation_count: number;
  last_activated: string;
  lens_tags: string[];
}

interface GraphEdgeData {
  id: string;
  source: string;
  target: string;
  type: 'reinforces' | 'contradicts' | 'undermines' | 'leads_to' | 'co_occurs_with';
  frequency: number; // 0-1
  intensity: number; // 0-1
  confidence: number; // 0-1
}
```

**Usage Example**:
```tsx
<ForceDirectedGraph
  nodes={[
    {
      id: 'node-1',
      type: 'belief',
      label: 'Authenticity is valuable',
      content: 'Being true to myself is more important than fitting in',
      activation_count: 15,
      last_activated: '2025-12-14T09:00:00Z',
      lens_tags: ['identity', 'relationships']
    }
  ]}
  edges={[
    {
      id: 'edge-1',
      source: 'node-1',
      target: 'node-2',
      type: 'contradicts',
      frequency: 0.8,
      intensity: 0.9,
      confidence: 0.85
    }
  ]}
  onNodeClick={(nodeId) => showNodeDetails(nodeId)}
  filterLensTags={['identity']}
  variant="default"
/>
```

**Interaction Types**:
- **Drag**: Reposition nodes
- **Zoom**: Mouse wheel or pinch
- **Pan**: Click and drag background
- **Select**: Click node/edge for details

**Visual Encoding**:
- Node color by type (6 colors)
- Edge color by relationship type (5 colors)
- Edge thickness by intensity
- Edge animation for high frequency
- Node size by activation count

---

### RadarChart

**Purpose**: Tension Proxy Vector (TPV) visualization for lens weights.

**Import**:
```typescript
import RadarChart from '@components/RadarChart';
```

**Props**:
```typescript
interface RadarChartProps {
  tpvData: TPVData | TPVData[];
  variant?: 'default' | 'compact' | 'comparison';
  showAmbiguity?: boolean;
}

interface TPVData {
  id: string;
  lensWeights: LensWeight[];
  ambiguityScore: number; // 0-1
  computedAt: string;
  posture?: string;
  label?: string;
}

interface LensWeight {
  lens: string;
  weight: number; // 0-1
  label?: string;
  description?: string;
}
```

**Usage Example**:
```tsx
<RadarChart
  tpvData={{
    id: 'tpv-123',
    lensWeights: [
      { lens: 'identity', weight: 0.85, label: 'Identity' },
      { lens: 'relationships', weight: 0.62, label: 'Relationships' },
      { lens: 'work', weight: 0.45, label: 'Work' },
      { lens: 'health', weight: 0.30, label: 'Health' }
    ],
    ambiguityScore: 0.35,
    computedAt: '2025-12-14T10:00:00Z',
    posture: 'grounded'
  }}
  variant="default"
  showAmbiguity={true}
/>
```

**Comparison Mode**:
```tsx
<RadarChart
  tpvData={[
    { id: 'current', lensWeights: [...], ambiguityScore: 0.35, label: 'Current' },
    { id: 'suggested', lensWeights: [...], ambiguityScore: 0.28, label: 'Suggested' }
  ]}
  variant="comparison"
/>
```

**Ambiguity Levels**:
- **Clear (< 0.3)**: Tensions well-defined, high confidence
- **Moderate (0.3-0.6)**: Some uncertainty, multiple interpretations possible
- **High (> 0.6)**: Significant uncertainty, requires clarification

---

### Timeline

**Purpose**: Chronological event display with grouping and filtering.

**Import**:
```typescript
import Timeline from '@components/Timeline';
```

**Props**:
```typescript
interface TimelineProps {
  events: TimelineEvent[];
  onEventClick?: (eventId: string) => void;
  variant?: 'default' | 'compact' | 'detailed';
  filterEventTypes?: TimelineEventType[];
  searchQuery?: string;
}

interface TimelineEvent {
  id: string;
  type: 'amendment' | 'posture_change' | 'milestone' | 'reflection' | 'tension_resolved' | 'fork_created' | 'vote_completed';
  title: string;
  description: string;
  timestamp: string;
  status?: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
  details?: string;
}
```

**Usage Example**:
```tsx
<Timeline
  events={[
    {
      id: 'event-1',
      type: 'amendment',
      title: 'Constitutional Amendment #12 Implemented',
      description: 'Voting threshold changed from simple majority to 67% supermajority',
      timestamp: '2025-12-10T14:00:00Z',
      status: 'success',
      metadata: { amendmentId: '12', votesFor: 145, votesAgainst: 23 }
    }
  ]}
  variant="default"
  filterEventTypes={['amendment', 'posture_change']}
  onEventClick={(id) => showEventDetail(id)}
/>
```

**Key Features**:
- Date grouping with sticky headers
- Search by title/description
- Filter by event type
- Expandable details
- Status color coding
- Metadata display

---

## Integration Patterns

### React Query Integration

```typescript
import { useQuery } from '@tanstack/react-query';
import ReflectionCard from '@components/ReflectionCard';

function FeedList() {
  const { data: reflections } = useQuery({
    queryKey: ['reflections', 'feed'],
    queryFn: () => api.getReflections({ visibility: 'public', limit: 20 })
  });

  return (
    <div className="space-y-4">
      {reflections?.map(reflection => (
        <ReflectionCard
          key={reflection.id}
          reflection={reflection}
          onLike={(id) => likeMutation.mutate(id)}
        />
      ))}
    </div>
  );
}
```

### Supabase Realtime Integration

```typescript
import { useEffect } from 'react';
import { supabase } from '@lib/supabase';

function useRealtimeReflections() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('reflections-changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reflections'
      }, (payload) => {
        queryClient.invalidateQueries({ queryKey: ['reflections'] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
```

### Offline Queue Pattern

```typescript
import { useMutation } from '@tanstack/react-query';
import { offlineQueue } from '@lib/offline';

function useCreateReflection() {
  return useMutation({
    mutationFn: async (reflection) => {
      if (!navigator.onLine) {
        // Queue for later sync
        return offlineQueue.add('createReflection', reflection);
      }
      return api.createReflection(reflection);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
    }
  });
}
```

---

## Testing Components

### Unit Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@test/utils/render';
import ReflectionCard from '../ReflectionCard';

describe('ReflectionCard', () => {
  it('calls onLike when like button clicked', () => {
    const onLike = vi.fn();
    const reflection = { id: '123', content: 'Test', /* ... */ };
    
    render(<ReflectionCard reflection={reflection} onLike={onLike} />);
    
    fireEvent.click(screen.getByRole('button', { name: /like/i }));
    
    expect(onLike).toHaveBeenCalledWith('123');
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can create and view reflection', async ({ page }) => {
  await page.goto('/feed');
  await page.click('text=New Reflection');
  await page.fill('[placeholder*="Share"]', 'Test reflection');
  await page.click('button:has-text("Reflect")');
  
  await expect(page.locator('text=Test reflection')).toBeVisible();
});
```

---

**Next**: See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for backend setup and API integration.

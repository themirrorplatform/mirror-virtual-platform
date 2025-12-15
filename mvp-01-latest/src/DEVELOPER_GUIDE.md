# The Mirror - Developer Guide
**Building Constitutionally Aligned Extensions**

---

## Overview

This guide explains how to extend The Mirror while maintaining constitutional alignment.

**Core Principle:** Every feature must pass the constitutional test.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Constitutional Constraints](#constitutional-constraints)
3. [Adding New Instruments](#adding-new-instruments)
4. [Database Schema](#database-schema)
5. [State Management](#state-management)
6. [Testing](#testing)
7. [Performance](#performance)
8. [Accessibility](#accessibility)
9. [Code Style](#code-style)

---

## Architecture Overview

### MirrorX Core (Infrastructure Layer)
- **MirrorOS:** Constitutional engine, state management
- **MirrorCore:** Database, sync, encryption
- **Services:** Reusable business logic

### The Mirror (Client Application)
- **Components:** UI building blocks
- **Screens:** Full-screen instrument views
- **Hooks:** Reusable React logic
- **Utils:** Pure functions, no side effects

### Data Flow
```
User Action 
  → Component 
  → Hook 
  → State Manager 
  → Database Service 
  → IndexedDB
```

---

## Constitutional Constraints

Every feature MUST comply with these constraints:

### 1. Language Constraints
**Never use:**
- "get started"
- "recommended"
- "you should"
- "next step"
- "improve"
- "complete"

**Always use:**
- "enter"
- "this exists"
- "what appears"
- Descriptive, not directive

### 2. Interaction Constraints
**Never include:**
- Progress bars
- Streaks
- Achievements
- Completion indicators
- Urgency timers

### 3. Structural Constraints
- No required order of operations
- No forced onboarding
- All areas independently enterable

---

## Adding New Instruments

### Step 1: Define the Instrument

Create a new file in `/components/instruments/`:

```tsx
// /components/instruments/MyInstrument.tsx
import { motion } from 'motion/react';
import { Card } from '../Card';

interface MyInstrumentProps {
  onClose: () => void;
  // Add other props
}

export function MyInstrument({ onClose }: MyInstrumentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
    >
      <Card className="max-w-2xl w-full max-h-[80vh] overflow-auto">
        {/* Instrument content */}
        <button onClick={onClose}>Close</button>
      </Card>
    </motion.div>
  );
}
```

### Step 2: Add to Command Palette

Update `/components/CommandPalette.tsx`:

```tsx
const instruments = [
  // ... existing instruments
  {
    id: 'my-instrument' as InstrumentId,
    name: 'My Instrument',
    description: 'Description of what it does',
    category: 'sovereignty' as const,
    layer: 'sovereign' as const,
    keywords: ['keyword1', 'keyword2'],
  },
];
```

### Step 3: Render in App.tsx

Update `/App.tsx`:

```tsx
import { MyInstrument } from './components/instruments/MyInstrument';

// Add state
const [showMyInstrument, setShowMyInstrument] = useState(false);

// Add to constitutional instruments section
<AnimatePresence>
  {showMyInstrument && (
    <MyInstrument onClose={() => setShowMyInstrument(false)} />
  )}
</AnimatePresence>
```

### Constitutional Checklist

Before shipping, verify:
- [ ] Does it use directive language? → ❌ REJECT
- [ ] Does it create pressure? → ❌ REJECT
- [ ] Does it imply "correctness"? → ❌ REJECT
- [ ] Does it require specific order? → ❌ REJECT
- [ ] Is it described, not prescriptive? → ✅ ACCEPT

---

## Database Schema

### Core Tables (IndexedDB Object Stores)

#### 1. Reflections
```typescript
interface Reflection {
  id: string; // UUID
  content: string;
  createdAt: Date;
  updatedAt: Date;
  layer: 'sovereign' | 'commons' | 'builder';
  modality: 'text' | 'voice' | 'video';
  threadId?: string;
  metadata: Record<string, any>;
}
```

#### 2. Threads
```typescript
interface Thread {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  reflectionIds: string[];
}
```

#### 3. Identity Axes
```typescript
interface IdentityAxis {
  id: string;
  name: string;
  createdAt: Date;
}
```

#### 4. Settings
```typescript
interface Settings {
  theme: 'dark' | 'light' | 'high-contrast';
  particlesEnabled: boolean;
  reducedMotion: boolean;
}
```

### Adding New Tables

1. Update `/types/index.ts`:
```typescript
export interface MyNewTable {
  id: string;
  // ... fields
}
```

2. Update `/services/database.ts`:
```typescript
async init() {
  const db = await openDB<MirrorDB>('mirror-db', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create new object store
      if (!db.objectStoreNames.contains('myNewTable')) {
        db.createObjectStore('myNewTable', { keyPath: 'id' });
      }
    },
  });
}
```

3. Add CRUD methods:
```typescript
async addMyItem(item: MyNewTable): Promise<void> {
  const db = await this.getDB();
  await db.add('myNewTable', item);
}

async getMyItem(id: string): Promise<MyNewTable | undefined> {
  const db = await this.getDB();
  return db.get('myNewTable', id);
}
```

---

## State Management

### Using State Manager

```typescript
import { stateManager } from '../services/stateManager';

// Get current state
const state = stateManager.getState();

// Update state
stateManager.setState({ 
  currentLayer: 'commons' 
});

// Subscribe to changes
const unsubscribe = stateManager.subscribe((newState) => {
  console.log('State changed:', newState);
});

// Clean up
unsubscribe();
```

### React Hook Integration

```typescript
import { useMirrorState } from '../hooks/useMirrorState';

function MyComponent() {
  const { state, switchLayer } = useMirrorState();
  
  return (
    <button onClick={() => switchLayer('commons')}>
      Current layer: {state.currentLayer}
    </button>
  );
}
```

### State Guidelines

1. **Keep state minimal** - Only store what can't be derived
2. **Update atomically** - Use `setState` for all changes
3. **Subscribe carefully** - Unsubscribe in cleanup
4. **Persist strategically** - Not every state change needs DB persistence

---

## Testing

### Unit Tests

Create tests in `/tests/unit/`:

```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../utils/myUtil';

describe('myFunction', () => {
  it('should do the thing', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Integration Tests

Create tests in `/tests/integration/`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { databaseService } from '../services/database';

describe('Database Integration', () => {
  beforeEach(async () => {
    await databaseService.init();
  });

  it('should save and retrieve reflection', async () => {
    const reflection = {
      id: crypto.randomUUID(),
      content: 'Test',
      // ...
    };

    await databaseService.addReflection(reflection);
    const retrieved = await databaseService.getReflection(reflection.id);
    
    expect(retrieved?.content).toBe('Test');
  });
});
```

### Constitutional Tests

Every feature should have constitutional verification:

```typescript
describe('Constitutional Compliance', () => {
  it('should not use directive language', () => {
    const forbiddenWords = [
      'get started',
      'recommended',
      'you should',
    ];
    
    // Check component text doesn't contain forbidden words
  });

  it('should not require specific order', () => {
    // Verify actions can be taken in any order
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

---

## Performance

### Optimization Guidelines

1. **Debounce user input** (auto-save, search)
2. **Throttle scroll handlers**
3. **Memoize expensive computations**
4. **Lazy load large components**
5. **Use virtual scrolling for long lists**

### Using Performance Utilities

```typescript
import { debounce, useDebounce, perfMonitor } from '../utils/performance';

// Debounce function
const saveReflection = debounce(async (content: string) => {
  await db.save(content);
}, 500);

// React hook
const debouncedSearch = useDebounce(searchTerm, 300);

// Performance monitoring
perfMonitor.start('save-reflection');
await db.save(reflection);
perfMonitor.end('save-reflection');
```

### Virtual Scrolling

For lists with 100+ items:

```typescript
import { useVirtualScroll } from '../utils/performance';

function ReflectionList({ reflections }) {
  const {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  } = useVirtualScroll(reflections, 100, 600);

  return (
    <div
      style={{ height: 600, overflow: 'auto' }}
      onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(item => (
            <ReflectionCard key={item.id} reflection={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Accessibility

### WCAG 2.1 AA Compliance

Every component must meet WCAG 2.1 Level AA:

1. **Keyboard Accessible**
   - All functionality via keyboard
   - Visible focus indicators
   - Logical tab order

2. **Screen Reader Support**
   - ARIA labels on interactive elements
   - Semantic HTML
   - Live regions for dynamic content

3. **Color Contrast**
   - Text: 4.5:1 minimum
   - UI components: 3:1 minimum
   - Use `/utils/contrastChecker.ts`

4. **Responsive Design**
   - Works at 200% zoom
   - Mobile-friendly
   - No horizontal scroll

### Accessibility Utilities

```typescript
import { announceToScreenReader } from '../utils/accessibility';
import { checkContrast } from '../utils/contrastChecker';

// Announce to screen reader
announceToScreenReader('Reflection saved', 'polite');

// Check color contrast
const result = checkContrast('#E6E8EB', '#14161A');
console.log(`Contrast ratio: ${result.ratio}:1`);
console.log(`Passes AA: ${result.passesAA}`);
```

### Component Checklist

- [ ] Keyboard navigable
- [ ] ARIA labels on icons
- [ ] Semantic HTML (nav, main, article)
- [ ] Color contrast verified
- [ ] Screen reader tested
- [ ] Respects `prefers-reduced-motion`

---

## Code Style

### TypeScript Guidelines

1. **Explicit types** for function parameters and returns
2. **Interfaces** for object shapes
3. **Enums** for fixed sets of values
4. **Avoid `any`** - Use `unknown` if type is truly unknown

```typescript
// Good
interface ReflectionData {
  content: string;
  createdAt: Date;
}

function saveReflection(data: ReflectionData): Promise<void> {
  // ...
}

// Bad
function saveReflection(data: any) {
  // ...
}
```

### React Guidelines

1. **Functional components** only
2. **Named exports** for components
3. **Props interfaces** for every component
4. **Hooks at top level** (never in conditions)

```typescript
// Good
interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

export function Button({ onClick, children }: ButtonProps) {
  return <button onClick={onClick}>{children}</button>;
}

// Bad
export default function Button(props: any) {
  if (props.special) {
    useEffect(() => {}); // ❌ Hook in condition
  }
  return <button>{props.children}</button>;
}
```

### File Organization

```
/components
  /instruments      - Constitutional instruments
  /screens          - Full-screen views
  /Card.tsx         - Reusable UI components
  /Button.tsx
  
/hooks
  /useMirrorState.ts - React state management
  /useUndo.ts
  
/services
  /database.ts      - Data persistence
  /stateManager.ts  - Global state
  
/utils
  /accessibility.ts - A11y helpers
  /sanitization.ts  - Security
  
/types
  /index.ts         - TypeScript types
```

---

## Security

### XSS Prevention

Always sanitize user content:

```typescript
import { sanitizeHTML, sanitizeURL } from '../utils/sanitization';

// Sanitize HTML
const clean = sanitizeHTML(userInput);

// Sanitize URLs
const safeUrl = sanitizeURL(userLink);
```

### Input Validation

```typescript
import { validateReflection } from '../utils/validation';

function saveReflection(content: string) {
  // Validate before saving
  if (!validateReflection(content)) {
    throw new Error('Invalid reflection');
  }
  
  // Save...
}
```

### Never:
- Trust user input
- Use `dangerouslySetInnerHTML` without sanitization
- Store sensitive data in localStorage
- Log sensitive information

---

## Constitutional Test Pattern

Every feature should pass this test:

```typescript
describe('Constitutional Alignment', () => {
  it('should not create pressure', () => {
    // No timers, urgency, or forcing mechanics
  });

  it('should use descriptive language', () => {
    // No "you should", "recommended", etc.
  });

  it('should allow reversal', () => {
    // All actions reversible or explainable
  });

  it('should preserve sovereignty', () => {
    // User maintains control over data
  });

  it('should default to silence', () => {
    // No unsolicited notifications or hints
  });
});
```

---

## Deployment Checklist

Before deploying:

- [ ] Run all tests (`npm test`)
- [ ] Check accessibility (`npm run a11y`)
- [ ] Remove console.logs (`npm run cleanup`)
- [ ] Build production (`npm run build`)
- [ ] Test in multiple browsers
- [ ] Verify mobile responsiveness
- [ ] Check performance (Lighthouse)
- [ ] Review constitutional compliance

---

## Getting Help

### Resources
- **Constitution:** See `/Guidelines.md`
- **User Guide:** See `/USER_GUIDE.md`
- **QA Reports:** See `/QA_*.md` files

### Contributing
1. Fork the repository
2. Create a feature branch
3. Write tests
4. Ensure constitutional compliance
5. Submit pull request

---

## Philosophy

**Remember:**

The Mirror is not a productivity tool.  
It is not trying to keep users engaged.  
It has no growth targets.

**The goal is reflection, not retention.**

When in doubt, choose silence.  
When uncertain, describe rather than direct.  
When tempted to optimize, pause and ask: "For whom?"

**The user's sovereignty is absolute.**

---

**Version 1.0**  
**Last updated: December 15, 2024**

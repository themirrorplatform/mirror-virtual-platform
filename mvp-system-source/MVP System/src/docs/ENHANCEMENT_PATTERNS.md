# The Mirror — Instrument Enhancement Patterns

**Purpose:** Reusable patterns for enhancing all instruments while maintaining constitutional vision

---

## Core Enhancement Principles

### 1. Progressive Disclosure
**Pattern:** Show essential info first, reveal details on demand

**Implementation:**
```tsx
const [expanded, setExpanded] = useState(false);

// Compact view always visible
<CompactView onClick={() => setExpanded(true)} />

// Details revealed on interaction
<AnimatePresence>
  {expanded && <DetailedView />}
</AnimatePresence>
```

**Examples:**
- LayerHUD: Compact badge → Full panel on hover
- FailureIndicator: Error message → "Why?" button → Full explanation
- SpeechContract: Domain list → Examples → Constitutional basis

---

### 2. State-Aware Animations
**Pattern:** Match animation intensity to state severity/importance

**Implementation:**
```tsx
const config = {
  subtle: { opacity: 0.3, scale: 0.9, duration: 0.2 },
  normal: { opacity: 1, scale: 1, duration: 0.3 },
  critical: { opacity: 1, scale: 1.05, duration: 0.5 }
};

<motion.div
  initial={config[state].initial}
  animate={config[state].animate}
  transition={{ duration: config[state].duration }}
/>
```

**Examples:**
- L1 failures: Subtle, bottom-right, auto-dismiss
- L5 failures: Center, persistent, requires action
- Recognition pulse: Only when not "recognized"

---

### 3. Keyboard-First Design
**Pattern:** All actions accessible via keyboard, shortcuts for frequent actions

**Implementation:**
```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') openSearch();
    if (e.key === ' ' && canToggle) toggle();
  };
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [dependencies]);
```

**Standard Shortcuts:**
- `Esc` - Close/dismiss
- `⌘/Ctrl + K` - Search within instrument
- `Space` - Toggle/pause (where appropriate)
- `Tab` - Navigate between elements
- `Arrow keys` - Navigate lists
- `Enter` - Activate focused element

---

### 4. Contextual Help
**Pattern:** Explain what's happening, not what to do

**Implementation:**
```tsx
// BAD: "Click here to continue"
// GOOD: "This action will change..."

<InfoPanel>
  <div className="text-xs text-muted">What this means</div>
  <p className="text-sm">Neutral explanation of state/action</p>
  {constitutionalBasis && (
    <button onClick={viewArticle}>View constitutional basis</button>
  )}
</InfoPanel>
```

**Examples:**
- VoiceInstrument: "Audio stays on this device only" not "Record safely"
- FailureIndicator: "Cannot proceed because..." not "Try again"
- SpeechContract: "Mirror can/cannot..." not "You should..."

---

### 5. Loading & Processing States
**Pattern:** Show what's happening, estimate when possible, allow cancellation

**Implementation:**
```tsx
const [state, setState] = useState<'idle' | 'processing' | 'complete' | 'error'>();
const [progress, setProgress] = useState(0);

{state === 'processing' && (
  <ProcessingState
    message="Processing audio..."
    progress={progress}
    onCancel={handleCancel}
    estimatedTime="~15 seconds"
  />
)}
```

**Examples:**
- VoiceInstrument: Waveform during recording, progress bar during transcription
- RecognitionInstrument: "Checking recognition..." with TTL countdown
- DownloadExport: Size estimation, format conversion progress

---

### 6. Error Recovery
**Pattern:** Explain what failed, why, what to try instead

**Implementation:**
```tsx
<ErrorState>
  <ErrorIcon severity={level} />
  <div>
    <h3>What happened</h3>
    <p>{plainLanguageExplanation}</p>
  </div>
  
  {constitutionalBoundary && (
    <ConstitutionalReference article={article} />
  )}
  
  {alternatives.length > 0 && (
    <AlternativeActions>
      <p>What you can do instead:</p>
      {alternatives.map(alt => (
        <Action key={alt.id} onClick={alt.action}>
          {alt.description}
        </Action>
      ))}
    </AlternativeActions>
  )}
  
  {canRetry && <RetryButton onClick={retry} />}
</ErrorState>
```

**Never:**
- Blame the user
- Use jargon or error codes as primary message
- Dead end with no next action
- Hide the real reason behind vague language

---

### 7. Confirmation Before Consequence
**Pattern:** Show what will change, allow inspection, equal-weight choices

**Implementation:**
```tsx
<ConsentDeltaInstrument
  before={currentState}
  after={newState}
  impacts={[
    { category: 'Data Scope', level: 'medium', change: 'Local → Device Sync' },
    { category: 'Recognition', level: 'low', change: 'No change' }
  ]}
  constitutionalChanges={['Article 3.2', 'Article 5.1']}
  
  // Equal weight buttons
  actions={[
    { label: 'Cancel', onClick: cancel, style: 'neutral' },
    { label: 'Proceed', onClick: proceed, style: 'neutral' }
  ]}
/>
```

**For:**
- Layer switches
- Fork entry
- Export scope changes
- Permission grants
- Data sharing

---

### 8. Search & Filter Everywhere
**Pattern:** As lists grow, add search. As categories diverge, add filters

**Implementation:**
```tsx
const [searchQuery, setSearchQuery] = useState('');
const [filterType, setFilterType] = useState<FilterType>('all');

const filtered = items.filter(item => {
  if (filterType !== 'all' && item.type !== filterType) return false;
  if (searchQuery && !item.searchableText.includes(searchQuery)) return false;
  return true;
});

<SearchBar
  value={searchQuery}
  onChange={setSearchQuery}
  placeholder="Search..."
  icon={<SearchIcon />}
/>

<FilterTabs
  options={filterOptions}
  selected={filterType}
  onChange={setFilterType}
/>
```

**Apply to:**
- Archive (search reflections)
- SpeechContract (search domains)
- ConstitutionStack (search articles)
- IdentityGraph (search nodes)
- DownloadExport (filter by type)

---

### 9. Comparison Views
**Pattern:** When understanding changes matters, show before/after side-by-side

**Implementation:**
```tsx
<ComparisonView>
  <BeforeColumn>
    <Label>Current</Label>
    <StateView state={before} />
  </BeforeColumn>
  
  <DiffIndicator changes={diff} />
  
  <AfterColumn>
    <Label>After Change</Label>
    <StateView state={after} highlightChanges />
  </AfterColumn>
</ComparisonView>
```

**Use for:**
- ConsentDelta (permission changes)
- ConstitutionStack (version diff)
- ForkEntry (fork vs core)
- SpeechContract (layer comparison)
- ConflictResolution (local vs remote)

---

### 10. Undo/History Where Appropriate
**Pattern:** Allow reversal of non-destructive actions

**Implementation:**
```tsx
const [history, setHistory] = useState<State[]>([initialState]);
const [historyIndex, setHistoryIndex] = useState(0);

const undo = () => {
  if (historyIndex > 0) {
    setHistoryIndex(i => i - 1);
    restoreState(history[historyIndex - 1]);
  }
};

const redo = () => {
  if (historyIndex < history.length - 1) {
    setHistoryIndex(i => i + 1);
    restoreState(history[historyIndex + 1]);
  }
};

<HistoryControls>
  <button onClick={undo} disabled={!canUndo}>⌘Z</button>
  <button onClick={redo} disabled={!canRedo}>⌘⇧Z</button>
</HistoryControls>
```

**Apply to:**
- ConflictResolution (undo merge)
- WorldviewLens (undo lens application)
- IdentityGraph (undo node changes)
- LongformInstrument (undo section edits)

---

## Mobile-Specific Patterns

### Bottom Sheets
```tsx
const [isOpen, setIsOpen] = useState(false);

// Desktop: Modal
// Mobile: Bottom sheet

<ResponsiveModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  className="md:max-w-2xl"
>
  {isMobile ? (
    <BottomSheet>
      <DragHandle />
      <Content />
    </BottomSheet>
  ) : (
    <CenteredModal>
      <Content />
    </CenteredModal>
  )}
</ResponsiveModal>
```

### Swipe Gestures
```tsx
const bind = useSwipe({
  onSwipeLeft: nextItem,
  onSwipeRight: previousItem,
  onSwipeDown: close,
  threshold: 50
});

<div {...bind()}>
  <Content />
</div>
```

### Touch Optimization
- Min 44px hit targets
- Larger text for readability
- Bottom-aligned primary actions
- Sticky headers when scrolling
- Pull-to-refresh where natural

---

## Accessibility Patterns

### Focus Management
```tsx
useEffect(() => {
  if (isOpen) {
    // Trap focus within modal
    const previousFocus = document.activeElement;
    firstFocusableElement.focus();
    
    return () => {
      previousFocus?.focus();
    };
  }
}, [isOpen]);
```

### ARIA Labels
```tsx
<button
  aria-label="Close voice recording"
  aria-describedby="voice-recording-description"
  aria-expanded={isRecording}
  aria-pressed={isPaused}
>
  <Icon />
</button>

<div id="voice-recording-description" className="sr-only">
  Recording audio. Press space to pause, escape to cancel.
</div>
```

### Screen Reader Announcements
```tsx
const [announcement, setAnnouncement] = useState('');

<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>

// When state changes:
setAnnouncement('Recording started');
```

### Reduced Motion
```tsx
const prefersReducedMotion = useReducedMotion();

<motion.div
  animate={prefersReducedMotion ? {} : { scale: 1.1, rotate: 360 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
/>
```

---

## Performance Patterns

### Lazy Loading
```tsx
const HeavyInstrument = lazy(() => import('./HeavyInstrument'));

<Suspense fallback={<LoadingSkeleton />}>
  {shouldLoad && <HeavyInstrument />}
</Suspense>
```

### Virtual Scrolling
```tsx
// For long lists (>100 items)
import { useVirtualizer } from '@tanstack/react-virtual';

const virtualizer = useVirtualizer({
  count: items.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 60,
  overscan: 5
});

<div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
  <div style={{ height: virtualizer.getTotalSize() }}>
    {virtualizer.getVirtualItems().map(virtualRow => (
      <div
        key={virtualRow.index}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: virtualRow.size,
          transform: `translateY(${virtualRow.start}px)`
        }}
      >
        <Item item={items[virtualRow.index]} />
      </div>
    ))}
  </div>
</div>
```

### Debounced Search
```tsx
const [searchTerm, setSearchTerm] = useState('');
const [debouncedSearch, setDebouncedSearch] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchTerm);
  }, 300);
  return () => clearTimeout(timer);
}, [searchTerm]);

// Use debouncedSearch for filtering
const filtered = items.filter(item => 
  item.text.includes(debouncedSearch)
);
```

### Memoization
```tsx
const expensiveComputation = useMemo(() => {
  return computeHeavyData(items, filters);
}, [items, filters]);

const MemoizedComponent = memo(({ data }) => {
  return <ComplexUI data={data} />;
}, (prev, next) => prev.data.id === next.data.id);
```

---

## Constitutional Compliance Patterns

### Equal-Weight Choices
```tsx
// All buttons same visual weight
<ActionGroup>
  <Button variant="neutral" onClick={optionA}>
    Option A
  </Button>
  <Button variant="neutral" onClick={optionB}>
    Option B
  </Button>
</ActionGroup>

// NOT:
// <Button variant="primary">Recommended</Button>
// <Button variant="secondary">Other Option</Button>
```

### Neutral Language
```tsx
// GOOD
"This action will change your data scope from local to device-sync"
"Audio transcription is processing"
"No entries appear in this date range"

// BAD  
"Complete your profile to get started!"
"Try adding some reflections!"
"You should enable Commons to unlock features"
```

### No Progress Gamification
```tsx
// GOOD
"47 reflections exist in your archive"
"Last reflection: 2 days ago"

// BAD
"Keep your streak alive! 3 days in a row!"
"You're 80% complete!"
"Level up by reflecting daily!"
```

### Silence as Default
```tsx
// Empty states
<EmptyState>
  <Icon />
  <p>Nothing appears here yet.</p>
  {/* NOT: "Get started by..." */}
</EmptyState>

// Confirmations
<SuccessState>
  <CheckIcon />
  <p>Reflection saved.</p>
  {/* NOT: "Great job! Keep it up!" */}
</SuccessState>
```

---

## Apply These Patterns To:

### High Priority
- [ ] VideoInstrument (countdown, pause/resume, redaction UI)
- [ ] ConsentDeltaInstrument (before/after comparison, impact levels)
- [ ] RefusalInstrument (alternatives, layer switching)
- [ ] RecognitionInstrument (TTL countdown, history, receipt)

### Medium Priority
- [ ] ProvenanceInstrument (checksum copy, attestation chain)
- [ ] ArchiveInstrument (timeline zoom, graph clustering)
- [ ] IdentityGraphInstrument (force-directed layout, learning toggles)
- [ ] WorldviewLensInstrument (stack preview, conflict detection)

### Lower Priority
- [ ] LongformInstrument (auto-sectioning, claim markers)
- [ ] BuilderCompilerInstrument (test runner, blast radius viz)
- [ ] All others (apply patterns iteratively)

---

## Testing Checklist

Before considering an instrument "enhanced":

### Functional
- [ ] All features work without errors
- [ ] Loading states for all async operations
- [ ] Error states with recovery
- [ ] Edge cases handled (empty, single item, many items)
- [ ] Network offline behavior
- [ ] Performance tested with realistic data volumes

### Constitutional
- [ ] No coercive language anywhere
- [ ] All choices equal visual weight
- [ ] No progress/completion metrics
- [ ] Layer-specific speech enforcement
- [ ] Proper constitutional article references

### Accessibility
- [ ] Full keyboard navigation
- [ ] Proper ARIA labels
- [ ] Focus visible states
- [ ] Screen reader tested
- [ ] Color contrast WCAG AAA
- [ ] Reduced motion support

### Mobile
- [ ] Touch targets min 44px
- [ ] Responsive layout tested
- [ ] Swipe gestures natural
- [ ] Bottom sheet on mobile
- [ ] Readable text sizes

### Performance
- [ ] <100ms interaction response
- [ ] <1s initial render
- [ ] No layout shift
- [ ] Smooth 60fps animations
- [ ] Memory leaks tested

---

**These patterns ensure every instrument feels like part of a coherent, respectful, constitutional system.**


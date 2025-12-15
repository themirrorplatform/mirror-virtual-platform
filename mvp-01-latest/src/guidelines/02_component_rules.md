# Component Rules

## Existing Components (Keep and Reuse)
Located in `/components/` and `/components/ui/`

**Core UI:**
- Button, Card, Modal, Toast
- Input, Textarea, Select, Checkbox
- All shadcn/ui components in `/components/ui/`

**Mirror-Specific:**
- AmbientBackground (context-aware glows)
- Navigation (sidebar + mobile)
- CrisisModal, RefusalModal, ModeTransitionModal
- ModelTrustPanel, EngineStatusBar
- MultimodalControls (voice/video/document)
- All existing screens in `/components/screens/`

## New Components Required

### Global Shell
- [x] App shell layout (exists)
- [ ] Realm navigation (needs refactor to realm-based IA)
- [ ] Route skeletons for 5 realms
- [x] Loading states (use existing)
- [x] Toast (exists, use sonner)
- [ ] Undo/redo system (global)

### Mirror Realm
- [ ] **ReflectionEditor** (refactor existing ReflectScreen)
  - Centered column, not full-width
  - "..." as empty placeholder (not instructions)
  - Markdown support (optional for user)
  
- [ ] **MirrorbackPanel**
  - Clearly distinguished from user text
  - Indented, different weight, labeled
  - Can be hidden, archived, compared
  
- [ ] **InlineActionBar**
  - Appears on pause/selection
  - Controls: Save, Archive, Link to Thread, Generate Mirrorback
  - Soft icons, labels on hover
  - Fades in/out, not jarring

### Threads Realm (NEW)
- [ ] **ThreadList**
  - Vertical timeline
  - User-named threads (no defaults)
  - Soft date markers
  - No "completion" indicators
  
- [ ] **ThreadDetail**
  - Node list (reflections as nodes)
  - Collapse/expand time
  - Rename thread (inline edit)
  
- [ ] **NodeCard**
  - Individual reflection in thread
  - Timestamp, content preview
  - Expandable
  
- [ ] **TensionMarker**
  - Visualizes recurring patterns
  - Lines between related nodes
  - NOT error indicators
  
- [ ] **ContradictionMarker**
  - Soft glow between contradicting nodes
  - Honored, not resolved

### World Realm (NEW)
- [ ] **WorldFeed**
  - Temporal ordering by default
  - No infinite scroll default
  - Optional views: resonance, silence-weighted, random
  
- [ ] **PostCard**
  - Content-central, author subdued
  - Engagement hidden by default
  
- [ ] **PostDetail**
  - Full reflection view
  - Context of original poster
  
- [ ] **WitnessButton** (not "Like")
  - Simple acknowledgment
  - No counter shown publicly
  
- [ ] **ResponseComposer**
  - Before responding: "What part of this are you responding to?"
  - Quote target (optional)
  - Slows reaction

### Archive Realm (Enhance Existing)
- [ ] **ArchiveTimeline**
  - Chronological by default
  - Time slider (not just filters)
  - Visual density options
  
- [ ] **ArchiveSearch**
  - Semantic search UI (if AI connected)
  - Keyword fallback
  - No fake results
  
- [ ] **ThenNowCompare**
  - Side-by-side reflection comparison
  - Shows evolution, not "improvement"
  - Dates visible, context preserved

### Self Realm (Consolidate Existing)
- [ ] **IdentityAxesEditor** (refactor IdentityGraphScreen)
  - User-defined fields
  - Renameable categories
  - No fixed traits
  - Example: "Wealth: Uncertain / Curious / Resistant"
  
- [ ] **DataSovereigntyPanel** (consolidate from DataPortability + Export)
  - Clear, human language
  - What exists, where it lives
  - How to export, how to delete
  - No legalese
  - Consent controls visible

## Component Behavior Rules

### Visual Hierarchy
1. **Primary focus:** gold accent, clear label
2. **Secondary:** muted border, available but not emphasized
3. **Ghost:** nearly invisible until hover/focus

### States
- **Default:** calm, visible
- **Hover:** subtle glow or border shift
- **Focus:** clear outline (for keyboard nav)
- **Active:** brief color shift
- **Disabled:** reduced opacity, cursor: not-allowed
- **Error:** red accent, but calm (no shake/bounce)

### Mirrorback Distinction
Any AI-generated text must be visually distinct:
- Indented OR left-border marker
- Different font weight or style
- Label: "Mirrorback" or timestamp
- Never styled as "user authority"

### Social Interactions
Replace standard social patterns:
- ❌ Like → ✅ Witness
- ❌ Share → ✅ Reflect
- ❌ Follow → ✅ Observe (if implemented)
- ❌ Comment → ✅ Respond

No public counters by default.
User can see their own engagement stats in Self realm.

### Loading & Empty States
**Loading:**
- Skeleton screens (existing)
- Soft pulse, not spinner
- No "please wait" text

**Empty:**
- "..." or "Nothing appears here yet"
- Never: "Get started" or "Add your first"
- Silence is the default

### Error States
**Pattern:**
1. What failed (clear, honest)
2. Why it might have failed (if known)
3. What the user can do (optional, not directive)

**Example:**
"The Mirror failed to generate a reflection. This may be due to a network issue. You can try again or save your text locally."

NOT: "Oops! Please try again!" (no cuteness, no commands)

## Refactor Priorities
1. Navigation → realm-based IA
2. ReflectScreen → Mirror realm (centered, minimal)
3. Build Threads system (new)
4. Build World system (new)
5. Enhance Archive (timeline, compare)
6. Consolidate Self (axes + sovereignty)

# The Mirror — Implementation Roadmap
## Ultimate Vision Alignment

This document tracks the implementation of the complete Mirror UI/UX system as specified in the Constitutional design.

---

## Current State Assessment

### ✅ What Exists (Strong Foundation)
- Comprehensive component library (40+ components)
- Complete Tailwind design system with Mirror tokens
- Ambient background system with context-aware variants
- Crisis, refusal, and boundary systems
- Multi-device sync infrastructure
- Multimodal input (voice, video, document)
- Commons governance + fork/sandbox capabilities
- Constitution viewer and amendment system
- Accessibility variants (4 implementations)
- Developer diagnostics
- Data portability (export/import)

### ⚠️ What Needs Refactoring
1. **Navigation:** Feature-based, needs realm-based IA (Mirror/Threads/World/Archive/Self)
2. **ReflectScreen:** Full-width, needs centered minimal aesthetic
3. **IdentityGraphScreen:** Fixed categories, needs user-defined axes
4. **HistoryScreen:** Placeholder, needs timeline + comparison views

### ❌ What's Missing (Critical)
1. **Threads System:** No thread list, detail, node visualization, or tension markers
2. **World/Social:** No feed, witnessing, or response interface
3. **Archive Enhancements:** No timeline slider, semantic search, or then/now comparison
4. **Constitutional Language Audit:** Some screens may use directive language

---

## Implementation Phases

### PHASE 1: Foundation & Navigation ✅ READY TO BUILD
**Goal:** Establish realm-based information architecture

**Tasks:**
1. Create realm route structure in App.tsx
2. Refactor Navigation component to realm-based
3. Add realm navigation UI (5 primary realms)
4. Update mobile navigation for realm switching
5. Add realm-specific ambient variants

**Components:**
- Update: `/components/Navigation.tsx`
- Update: `/App.tsx` routing
- Create: Realm stub screens

**Success Criteria:**
- User can navigate to Mirror, Threads, World, Archive, Self
- Navigation shows active realm
- Mobile navigation works with realms
- Ambient background changes per realm

---

### PHASE 2: Mirror Refinement ✅ READY TO BUILD
**Goal:** Align Mirror realm with constitutional aesthetic

**Tasks:**
1. Refactor ReflectScreen layout (centered column, max-w-2xl)
2. Change empty state to "..." (remove instructions)
3. Implement MirrorbackPanel with clear visual distinction
4. Create InlineActionBar (appears on pause/selection)
5. Add "Link to Thread" functionality (connects to Phase 3)

**Components:**
- Refactor: `/components/screens/ReflectScreen.tsx`
- Create: `/components/MirrorbackPanel.tsx`
- Create: `/components/InlineActionBar.tsx`

**Success Criteria:**
- Mirror feels calm, centered, non-prescriptive
- Mirrorback is clearly distinguished from user text
- Actions appear only when needed
- User can link reflections to threads

---

### PHASE 3: Threads System (NEW) 🔴 PRIORITY
**Goal:** Build complete thread system for tracking evolution

**Tasks:**
1. Create ThreadList component (vertical timeline)
2. Create ThreadDetail component (node view)
3. Create NodeCard component (individual reflections)
4. Create TensionMarker component (recurring patterns)
5. Create ContradictionMarker component (opposing nodes)
6. Implement thread naming and editing
7. Connect Mirror's "Link to Thread" action
8. Add thread data model and state management

**Components:**
- Create: `/components/screens/ThreadsScreen.tsx`
- Create: `/components/screens/ThreadDetailScreen.tsx`
- Create: `/components/ThreadList.tsx`
- Create: `/components/NodeCard.tsx`
- Create: `/components/TensionMarker.tsx`
- Create: `/components/ContradictionMarker.tsx`

**Success Criteria:**
- User can create named threads
- User can link reflections to threads
- Thread detail shows evolution over time
- Tensions and contradictions are visualized
- No "completion" or "progress" indicators

---

### PHASE 4: World System (NEW) 🔴 PRIORITY
**Goal:** Build social reflection space with constitutional constraints

**Tasks:**
1. Create WorldFeed component (temporal ordering)
2. Create PostCard component (content-central)
3. Create PostDetail component (full view)
4. Create WitnessButton component (not "like")
5. Create ResponseComposer (with reflection prompt)
6. Implement view toggles (temporal/resonance/silence-weighted/random)
7. Add pagination (no infinite scroll)
8. Connect to Commons opt-in

**Components:**
- Create: `/components/screens/WorldScreen.tsx`
- Create: `/components/WorldFeed.tsx`
- Create: `/components/PostCard.tsx`
- Create: `/components/PostDetail.tsx`
- Create: `/components/WitnessButton.tsx`
- Create: `/components/ResponseComposer.tsx`

**Success Criteria:**
- World is opt-in via Commons
- Temporal ordering by default
- No public engagement counters
- Response prompt slows reaction
- User can disconnect from World

---

### PHASE 5: Archive Enhancement 🟡 MEDIUM PRIORITY
**Goal:** Transform placeholder into full memory system

**Tasks:**
1. Refactor HistoryScreen into ArchiveTimeline
2. Create ArchiveSearch component (semantic + keyword)
3. Create ThenNowCompare component (side-by-side)
4. Add time slider for quick navigation
5. Add density controls for timeline view
6. Connect to existing export/import screens

**Components:**
- Refactor: `/components/screens/HistoryScreen.tsx` → `ArchiveScreen.tsx`
- Create: `/components/ArchiveTimeline.tsx`
- Create: `/components/ArchiveSearch.tsx`
- Create: `/components/ThenNowCompare.tsx`

**Success Criteria:**
- Chronological browsing works
- Time slider provides quick navigation
- Then/now comparison shows evolution
- Search is semantic where possible
- No "improvement" language

---

### PHASE 6: Self Consolidation 🟡 MEDIUM PRIORITY
**Goal:** Unify identity and sovereignty into coherent realm

**Tasks:**
1. Refactor IdentityGraphScreen to use user-defined axes
2. Remove fixed categories, allow full customization
3. Consolidate DataSovereigntyPanel from multiple screens
4. Integrate accessibility, boundaries, sync settings
5. Add consent control UI
6. Ensure human-readable language (no legalese)

**Components:**
- Refactor: `/components/screens/IdentityGraphScreen.tsx` → `SelfScreen.tsx`
- Create: `/components/IdentityAxesEditor.tsx`
- Create: `/components/DataSovereigntyPanel.tsx`
- Update: Integrate existing settings screens

**Success Criteria:**
- User can define custom identity axes
- Data sovereignty is clear and accessible
- All consent controls are explicit
- Settings are grouped logically
- No prescriptive identity categories

---

### PHASE 7: Constitutional Language Audit 🟢 LOW PRIORITY (ONGOING)
**Goal:** Ensure all UI text follows constitutional constraints

**Tasks:**
1. Audit all screen components for directive language
2. Replace "you should" with "you might"
3. Remove "get started" and "next step" language
4. Ensure empty states are silent
5. Check error messages for blame language
6. Update button labels to be neutral

**Files to Audit:**
- All `/components/screens/*.tsx`
- All modals and dialogs
- Navigation labels
- Button text
- Form placeholders

**Success Criteria:**
- No directive language ("should", "must", "next")
- No engagement bait ("unlock", "achieve")
- Errors are honest, not cute
- Empty states are silent or minimal
- System waits, never pulls

---

### PHASE 8: Polish & Testing 🟢 FINAL PHASE
**Goal:** Ensure coherence and constitutional alignment

**Tasks:**
1. Visual consistency pass (spacing, colors, typography)
2. Accessibility audit (keyboard nav, ARIA, contrast)
3. Mobile responsiveness check
4. Motion refinement (ensure slow, intentional)
5. Performance optimization
6. Cross-realm navigation smoothness
7. Documentation of realm system

**Success Criteria:**
- All realms feel visually coherent
- Transitions are smooth and intentional
- Mobile experience matches desktop (no feature loss)
- Accessibility standards met
- No jarring motion or sudden changes
- System feels reverent, not prescriptive

---

## Implementation Order

### Week 1: Foundation
- Phase 1: Navigation & Realm Structure (2 days)
- Phase 2: Mirror Refinement (3 days)

### Week 2: Core Realms
- Phase 3: Threads System (4 days)
- Phase 4: World System (3 days)

### Week 3: Enhancement & Consolidation
- Phase 5: Archive Enhancement (3 days)
- Phase 6: Self Consolidation (2 days)
- Phase 7: Language Audit (ongoing, 2 days focused)

### Week 4: Polish
- Phase 8: Final polish and testing (5 days)

---

## Success Metrics (Qualitative)

1. **Calm:** Does the system feel silent and patient?
2. **Sovereign:** Does the user feel in control?
3. **Reflective:** Does the system mirror rather than prescribe?
4. **Reversible:** Can the user undo and explore?
5. **Honest:** Is the system transparent about its limitations?
6. **Evolvable:** Can the system change through governance?

---

## Next Steps

**Immediate action:**
1. Begin Phase 1 (Navigation refactor)
2. Create realm stub screens
3. Update routing in App.tsx
4. Test navigation between realms

**Developer instructions:**
- Read all guideline files in `/guidelines/`
- Follow constitutional constraints
- Implement incrementally (one phase at a time)
- Test after each component
- Maintain existing functionality (don't break what works)

---

## Notes

- Existing governance, crisis, and multimodal systems remain untouched
- All existing screens stay accessible via settings or nested navigation
- Focus is on reorganizing and filling gaps, not rebuilding from scratch
- Constitutional language is non-negotiable — audit all text
- User sovereignty is paramount — always allow exit, export, delete

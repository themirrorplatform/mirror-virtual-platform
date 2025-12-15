# Missing Components Checklist

## Status Legend
- [x] Exists (may need refinement)
- [ ] Missing (needs implementation)
- [~] Partial (exists but needs refactor)

---

## Global Infrastructure

- [x] App shell layout
- [~] Navigation (exists, needs realm refactor)
- [ ] Realm route stubs (Mirror, Threads, World, Archive, Self)
- [x] Loading states
- [x] Toast notifications
- [x] Modal system
- [ ] Global undo/redo (for reversibility)
- [x] Ambient background (context-aware)

---

## Mirror Realm (Private Reflection)

**Current state:** ReflectScreen exists but needs visual/UX refinement

- [~] ReflectionEditor
  - [ ] Centered column layout (not full-width)
  - [ ] "..." empty state (not instructional)
  - [ ] Markdown support indicator
  - [ ] Auto-save behavior

- [ ] MirrorbackPanel
  - [ ] Visually distinguished from user text
  - [ ] Indented with label
  - [ ] Hide/archive/compare controls

- [ ] InlineActionBar
  - [ ] Appears on text pause/selection
  - [ ] Save, Archive, Link-to-Thread, Generate
  - [ ] Soft icons, hover labels
  - [ ] Smooth fade in/out

---

## Threads Realm (Evolution Over Time)

**Current state:** Does not exist

- [ ] ThreadList
  - [ ] Vertical timeline layout
  - [ ] User-named threads
  - [ ] Date markers (soft, not prominent)
  - [ ] No completion indicators
  - [ ] Filter/sort (optional)

- [ ] ThreadDetail
  - [ ] Node list view
  - [ ] Tension/contradiction visualization
  - [ ] Collapse/expand time ranges
  - [ ] Rename thread (inline edit)
  - [ ] Add reflection to thread

- [ ] NodeCard
  - [ ] Reflection preview
  - [ ] Timestamp
  - [ ] Expand to full content
  - [ ] Link to tensions

- [ ] TensionMarker
  - [ ] Visual indicator (line, glow)
  - [ ] Shows recurring patterns
  - [ ] NOT styled as error

- [ ] ContradictionMarker
  - [ ] Connects opposing nodes
  - [ ] Soft glow
  - [ ] Honored, not resolved

---

## World Realm (Social/Witnessing)

**Current state:** Does not exist (CommonsScreen exists for governance, not social feed)

- [ ] WorldFeed
  - [ ] Temporal ordering (default)
  - [ ] Pagination (not infinite scroll)
  - [ ] View toggles: temporal / resonance / silence-weighted / random
  - [ ] Post preview cards

- [ ] PostCard
  - [ ] Content-central layout
  - [ ] Author subdued (no profile pics by default)
  - [ ] Engagement hidden by default
  - [ ] "Witness / Reflect / Respond" actions

- [ ] PostDetail
  - [ ] Full reflection view
  - [ ] Context of author (if shared)
  - [ ] Response thread

- [ ] WitnessButton
  - [ ] Simple acknowledgment
  - [ ] No public counter
  - [ ] Personal count in Self realm only

- [ ] ResponseComposer
  - [ ] Prompt: "What part of this are you responding to?"
  - [ ] Quote target (optional)
  - [ ] Slows reaction

- [ ] WorldSettings (opt-in)
  - [ ] Visibility controls
  - [ ] Who can witness/respond
  - [ ] Disconnect from World

---

## Archive Realm (Memory)

**Current state:** HistoryScreen exists as placeholder

- [ ] ArchiveTimeline
  - [ ] Chronological browser
  - [ ] Time slider (visual)
  - [ ] Density controls
  - [ ] Jump to date

- [ ] ArchiveSearch
  - [ ] Semantic search UI (if AI connected)
  - [ ] Keyword fallback
  - [ ] No fake results message

- [ ] ThenNowCompare
  - [ ] Side-by-side view
  - [ ] Reflection A vs Reflection B
  - [ ] Date/context labels
  - [ ] Shows evolution, not "progress"

- [x] Export functionality (exists in ExportScreen)
- [x] Import functionality (exists in ImportScreen)

---

## Self Realm (Identity & Sovereignty)

**Current state:** IdentityGraphScreen + DataPortabilityScreen exist, need consolidation

- [~] IdentityAxesEditor
  - [ ] Refactor IdentityGraphScreen to use user-defined fields
  - [ ] Editable labels
  - [ ] No fixed categories
  - [ ] Examples shown, not enforced

- [~] DataSovereigntyPanel
  - [ ] Consolidate Export + DataPortability screens
  - [ ] Human-readable language (no legalese)
  - [ ] What exists
  - [ ] Where it lives
  - [ ] How to export
  - [ ] How to delete
  - [ ] Consent controls

- [x] Accessibility settings (exists)
- [x] Boundaries settings (exists)

---

## Supporting Systems (Existing, Keep)

- [x] Crisis mode (CrisisModal)
- [x] Refusal system (RefusalModal)
- [x] Model integrity (ModelIntegrityScreen)
- [x] Multi-device sync (DevicesScreen, SyncBanner)
- [x] Multimodal input (voice, video, document)
- [x] Commons governance (CommonsScreen, GovernanceScreen)
- [x] Fork/sandbox (ForksScreen, ForkBrowserScreen)
- [x] Constitution viewer (ConstitutionScreen)
- [x] Copy system (CopySystemScreen, ToneGuideScreen)
- [x] Developer diagnostics (DiagnosticsDashboardScreen)
- [x] Accessibility variants (4 variants implemented)

---

## Implementation Priority

### Phase 1: Navigation & Shell
1. Refactor Navigation to realm-based
2. Create route stubs for 5 realms
3. Update App.tsx routing

### Phase 2: Mirror Refinement
1. Refactor ReflectScreen layout (centered, minimal)
2. Implement MirrorbackPanel styling
3. Create InlineActionBar

### Phase 3: Threads (New)
1. ThreadList component
2. ThreadDetail component
3. NodeCard, TensionMarker, ContradictionMarker
4. Thread creation/naming flow

### Phase 4: World (New)
1. WorldFeed component
2. PostCard, PostDetail
3. WitnessButton, ResponseComposer
4. View toggles (temporal/resonance/etc)

### Phase 5: Archive Enhancement
1. ArchiveTimeline (refactor HistoryScreen)
2. ThenNowCompare view
3. ArchiveSearch UI

### Phase 6: Self Consolidation
1. Refactor IdentityAxesEditor (user-defined)
2. Consolidate DataSovereigntyPanel
3. Integrate with existing settings

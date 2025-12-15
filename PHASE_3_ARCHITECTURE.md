# Phase 3: Realm Integration - Architecture Plan

## Current State Analysis

### ✅ What We Have Built

#### Phase 1: Core Architecture (100% Complete)
- **useMirrorState** - Constitutional state management (290 lines)
- **MirrorStateContext** - Global state provider (47 lines)
- **InstrumentDock** - Minimized instruments bar (120 lines) 
- **LayerIndicator** - Top-right badge (120 lines)
- **CommandPalette** - Enhanced with layer switching (⌘K working)
- **ReceiptSystem** - Transparency display (220 lines, ACTIVE)
- **_app.tsx** - Fully integrated providers

#### Phase 2: Constitutional Instruments (100% Complete)
- **29 instruments** created (~9,000 lines)
- All compile with zero TypeScript errors
- Ready for integration into Realms
- ReceiptSystem already displaying state changes

#### Existing UI Components (Need Integration)
- **MainPlatform** - Has Hero, Sidebar, DiscussionFeed, Navigation
- **ReflectionComposer** - Basic reflection creation
- **FeedList** - Displays feed items with ReflectionCard
- **ThreadsView** - Thread interface (needs enhancement)
- **IdentityView** - Identity display (needs enhancement)
- **SelfView** - Profile and stats (needs enhancement)
- **MirrorField** - Constitutional input field (NEW from MVP)
- **MirrorXAssistant** - AI assistant interface

#### API Integration
- Existing API calls in `lib/api.ts`:
  - reflections.create()
  - mirrorbacks.create()
  - feed.getPublic()
- Backend endpoints (FastAPI) - NOT RUNNING but defined

### 🎯 Phase 3 Goals

Create **5 Complete Realms** that integrate:
1. All 29 constitutional instruments
2. Existing UI components (enhanced)
3. Constitutional state management
4. Layer-aware functionality
5. Instrument OS architecture

---

## The 5 Realms

### 1. Mirror Realm (Primary Reflection Space)
**Purpose**: Where users create reflections  
**Route**: `/reflect` (existing page to enhance)

**Integrate:**
- MirrorField (constitutional input)
- MultimodalControls (voice/video/text)
- ReflectionComposer (enhanced)
- EntryInstrument (layer selection on first visit)
- TimeBasedReflectionsInstrument (schedule prompts)
- VersionHistoryInstrument (edit history)
- CrisisScreenInstrument (if crisis mode)
- SafetyPlanInstrument (crisis support)
- PauseAndGroundInstrument (grounding)

**Layer Behavior:**
- **Sovereign**: All data local, no sharing
- **Commons**: Can publish to feed
- **Builder**: Experimental features enabled

### 2. Threads Realm (Connection Space)
**Purpose**: Explore threads and connections  
**Route**: `/threads` (new dedicated page)

**Integrate:**
- ThreadsView (enhanced)
- ThreadDiscoveryInstrument (find connections)
- ReflectionLinksInstrument (manual linking)
- PatternDetectionInstrument (show patterns)
- FeedList (thread reflections)
- WorldviewLensInstrument (perspective filters)

**Features:**
- Discover connections between reflections
- Create custom threads
- Apply worldview filters
- See pattern detection results

### 3. World Realm (Commons Space)
**Purpose**: Participate in shared space  
**Route**: `/world` or `/commons` (new page)

**Integrate:**
- FeedList (public reflections)
- DiscussionFeed (enhanced from MainPlatform)
- GovernanceInstrument (proposals & voting)
- LicenseStackInstrument (data routing transparency)
- SpeechContractInstrument (AI behavior disclosure)
- RefusalInstrument (boundary enforcement)

**Features:**
- View public feed
- Participate in governance
- See transparent data routing
- Constitutional boundaries visible

### 4. Archive Realm (Memory Space)
**Purpose**: Access historical reflections  
**Route**: `/archive` (new page)

**Integrate:**
- ArchiveTimeline (from MVP if exists)
- ArchiveSearch (from MVP if exists)
- VersionHistoryInstrument (reflection edits)
- ExportInstrument (data portability)
- DataPortabilityInstrument (import/export)
- MigrationInstrument (data migration)
- ProvenanceInstrument (data lineage)

**Features:**
- Timeline view of all reflections
- Search and filter
- Export full archive
- See data provenance

### 5. Self Realm (Sovereignty Space)
**Purpose**: Identity and sovereignty controls  
**Route**: `/self` or `/identity` (enhance existing)

**Integrate:**
- SelfView (enhanced profile)
- IdentityView (enhanced identity graph)
- PrivacyDashboardInstrument (privacy controls)
- EncryptionInstrument (key management)
- DeviceRegistryInstrument (device management)
- RecognitionInstrument (recognition status)
- ConflictResolutionInstrument (sync conflicts)
- OfflineQueueInstrument (pending sync)
- DatabaseHealthInstrument (DB monitoring)
- ConstitutionViewerInstrument (principles)

**Features:**
- Identity management
- Privacy and encryption settings
- Device trust management
- Database health monitoring
- Constitution viewer

---

## Integration Strategy

### Step 1: Enhance Existing Pages
1. **reflect.tsx** → Mirror Realm
   - Add EntryInstrument check
   - Integrate crisis support instruments
   - Add time-based reflection scheduling

2. **index.tsx** → Home/World Realm hybrid
   - Keep feed display
   - Add governance access
   - Show license/speech contract

3. **SelfView** → Self Realm
   - Add all sovereignty instruments
   - Privacy dashboard
   - Encryption controls

### Step 2: Create New Realm Pages
1. **threads.tsx** - Dedicated Threads Realm
2. **archive.tsx** - Dedicated Archive Realm
3. **world.tsx** - Dedicated Commons/World Realm (or enhance index.tsx)

### Step 3: Wire Instrument Activation
Update `InstrumentDock.tsx` to:
- Categorize all 29 instruments
- Summon instruments on click
- Track active instruments
- Handle instrument close/minimize

### Step 4: Layer-Aware Routing
- Entry check on first visit (EntryInstrument)
- Layer-specific features enabled/disabled
- Receipts for all constitutional actions
- Crisis mode detection and response

---

## Implementation Order

### Phase 3A: Mirror Realm (Highest Priority)
1. Enhance `/reflect` page
2. Integrate MirrorField
3. Add EntryInstrument check
4. Wire crisis support instruments
5. Add time-based scheduling
6. Test reflection creation flow

### Phase 3B: Self Realm
1. Enhance SelfView component
2. Integrate sovereignty instruments
3. Add privacy dashboard
4. Wire encryption controls
5. Device registry
6. Database health

### Phase 3C: World Realm
1. Enhance index.tsx or create world.tsx
2. Integrate governance instrument
3. Show license stack
4. Display speech contracts
5. Public feed with boundaries

### Phase 3D: Threads Realm
1. Create threads.tsx page
2. Enhance ThreadsView
3. Integrate discovery instruments
4. Pattern detection
5. Reflection linking

### Phase 3E: Archive Realm
1. Create archive.tsx page
2. Build timeline view
3. Integrate export instruments
4. Version history
5. Provenance display

---

## Technical Requirements

### State Management Integration
```typescript
// Each realm checks constitutional state
const { state, switchLayer, addReceipt } = useMirrorStateContext();

// Layer-aware rendering
if (state.layer === 'sovereign') {
  // Local-only features
}

// First-time entry check
if (!state.hasSeenEntry) {
  // Show EntryInstrument
}

// Crisis mode handling
if (state.crisisMode) {
  // Show CrisisScreenInstrument
}
```

### Instrument Activation Pattern
```typescript
// Summon instrument from InstrumentDock
const [activeInstrument, setActiveInstrument] = useState<string | null>(null);

// Render active instrument
{activeInstrument === 'export' && (
  <ExportInstrument onClose={() => setActiveInstrument(null)} />
)}
```

### Receipt Generation
```typescript
// Generate receipt for constitutional action
addReceipt({
  type: 'layer_switch',
  title: 'Switched to Commons Layer',
  details: { from: 'sovereign', to: 'commons' }
});
```

---

## Navigation Structure

### Realm Navigation (Top-Level)
- Mirror (reflect)
- Threads (connections)
- World (commons)
- Archive (memory)
- Self (sovereignty)

### Instrument Access (Command Palette + Dock)
- ⌘K to open CommandPalette
- Search instruments
- Click InstrumentDock icons
- Instruments float above realm

### Layer Switching
- LayerIndicator (top-right)
- Click to switch layers
- Receipt shows layer change
- Features adapt to layer

---

## Success Criteria

### Phase 3 Complete When:
- ✅ All 5 realms created/enhanced
- ✅ All 29 instruments accessible
- ✅ Layer-aware functionality working
- ✅ Constitutional state integrated
- ✅ Receipts generating for all actions
- ✅ First-time entry flow working
- ✅ Crisis mode detection active
- ✅ Navigation between realms working
- ✅ Zero TypeScript errors
- ✅ All existing features preserved

---

## Next Immediate Steps

1. **Start with Mirror Realm** (most critical)
2. Enhance `/reflect` page
3. Integrate EntryInstrument
4. Add crisis support
5. Test reflection creation
6. Then move to Self Realm

Let's begin Phase 3A: Mirror Realm enhancement.

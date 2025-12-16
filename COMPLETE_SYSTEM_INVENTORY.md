# The Mirror Virtual Platform: Complete System Inventory

**Generated: 2025-12-16**
**Total Components Cataloged: 1,500+**

---

## Table of Contents

1. [Python Backend (500+ functions/methods)](#1-python-backend)
2. [React Frontend (250+ components)](#2-react-frontend)
3. [API Endpoints (95+ routes)](#3-api-endpoints)
4. [Database Schema (35+ tables)](#4-database-schema)
5. [Edge Functions (7 serverless functions)](#5-edge-functions)
6. [Custom Hooks (30+ hooks)](#6-custom-hooks)
7. [Services & Utilities (30+ modules)](#7-services--utilities)

---

## 1. Python Backend

### 1.1 MirrorCore (Intelligence Layer)

#### `mirrorcore/constitutional.py` - Constitutional Enforcement
| Class/Function | Purpose |
|----------------|---------|
| `ViolationSeverity(Enum)` | LOW, MEDIUM, HIGH, CRITICAL severity levels |
| `ConstitutionalViolation` | Represents a constitutional violation with context |
| `ConstitutionalValidator` | Validates mirrorbacks against constitutional principles |
| `validate_mirrorback()` | Validates mirrorback text against principles |
| `check_privacy_compliance()` | Checks configuration for privacy compliance |

#### `mirrorcore/engine/reflect.py` - Core Reflection Engine
| Method | Purpose |
|--------|---------|
| `ReflectionEngine.__init__()` | Initialize engine with LLM and constitution |
| `ReflectionEngine.reflect()` | Generate mirrorback for reflection |
| `ReflectionEngine._analyze_patterns()` | Detect recurring patterns |
| `ReflectionEngine._detect_tensions()` | Identify contradictions |
| `ReflectionEngine._build_prompt()` | Build constitutional prompt |
| `ReflectionEngine._get_fallback_mirrorback()` | Fallback when LLM unavailable |
| `ReflectionEngine._process_evolution()` | Track identity evolution |
| `ReflectionEngine.get_stats()` | Get engine statistics |

#### `mirrorcore/layers/l1_safety.py` - L1 Safety Layer
| Component | Purpose |
|-----------|---------|
| `L1Severity(Enum)` | TIER_1_BLOCK, TIER_2_FLAG |
| `L1CheckResult` | Result dataclass for safety checks |
| `L1SafetyLayer.check_input()` | Check user input for harm |
| `L1SafetyLayer.check_output()` | Check AI output for harm |
| `L1SafetyLayer._format_tier_1_block_message()` | Format hard block message |
| `L1SafetyLayer._format_tier_2_flag_message()` | Format soft flag message |

#### `mirrorcore/layers/l2_reflection.py` - L2 Reflection Transformer
| Component | Purpose |
|-----------|---------|
| `DetectedPattern` | Pattern detected in reflection |
| `DetectedTension` | Tension/contradiction detected |
| `DetectedTheme` | Theme detected |
| `TransformedReflection` | Complete L2 transformation result |
| `L2ReflectionTransformer.transform()` | Transform raw input to structured form |
| `L2ReflectionTransformer._detect_patterns()` | Pattern detection logic |
| `L2ReflectionTransformer._detect_tensions()` | Tension detection logic |
| `L2ReflectionTransformer._detect_themes()` | Theme extraction logic |

#### `mirrorcore/layers/l3_expression.py` - L3 Expression Renderer
| Component | Purpose |
|-----------|---------|
| `ToneStyle(Enum)` | Warm, neutral, direct, gentle, challenging |
| `FormalityLevel(Enum)` | Casual, balanced, formal |
| `ResponseLength(Enum)` | Brief, moderate, detailed |
| `ExpressionPreferences` | User expression preferences |
| `ContextualFactors` | Contextual factors for rendering |
| `RenderedExpression` | Final rendered output |
| `L3ExpressionRenderer.render()` | Adapt tone/style while preserving invariants |

#### `mirrorcore/models/base.py` - LLM Interface
| Component | Purpose |
|-----------|---------|
| `ConstitutionalFlag(Enum)` | DIRECTIVE, PRESCRIPTIVE, JUDGMENTAL, ABSOLUTIST, MEDICAL_ADVICE, PATTERN_IMPOSING, AUTHORITY_CLAIMING |
| `LLMResponse` | Structured LLM response |
| `MirrorLLM(ABC)` | Abstract LLM interface |
| `MirrorLLM.generate_mirrorback()` | Generate reflective response |
| `MirrorLLM.detect_patterns()` | Detect patterns in reflections |
| `MirrorLLM.detect_tensions()` | Detect tensions |
| `MirrorLLM.validate_constitutional()` | Validate against constitution |
| `MirrorLLM.summarize_thread()` | Summarize reflection thread |
| `MirrorLLM.get_embeddings()` | Get text embeddings |
| `MirrorPrompts` | Constitutional prompt templates |

#### `mirrorcore/orchestration/llm_pool.py` - Multi-LLM Pool
| Component | Purpose |
|-----------|---------|
| `ProviderStatus(Enum)` | HEALTHY, DEGRADED, UNAVAILABLE |
| `ProviderConfig` | Configuration for LLM provider |
| `ProviderStats` | Statistics for monitoring |
| `LLMPool.add_provider()` | Add LLM provider to pool |
| `LLMPool.generate()` | Generate with fallback support |
| `LLMPool._call_claude()` | Call Claude API |
| `LLMPool._call_openai()` | Call OpenAI API |
| `LLMPool._call_local()` | Call local LLM |
| `LLMPool.get_stats()` | Get pool statistics |

#### `mirrorcore/storage/local_db.py` - Local Database
| Method | Purpose |
|--------|---------|
| `LocalDB.create_identity()` | Create new identity |
| `LocalDB.get_identity()` | Get identity by ID |
| `LocalDB.create_reflection()` | Store reflection |
| `LocalDB.get_reflection()` | Get reflection |
| `LocalDB.list_reflections()` | List reflections with filters |
| `LocalDB.create_tension()` | Create tension record |
| `LocalDB.get_tensions()` | Get active tensions |
| `LocalDB.update_tension_position()` | Update tension position |
| `LocalDB.export_all_data()` | Export complete data |
| `LocalDB.get_stats()` | Get database statistics |

---

### 1.2 Mirror OS (Data Sovereignty Layer)

#### `mirror_os/runtime.py` - Local Runtime
| Method | Purpose |
|--------|---------|
| `MirrorOSRuntime.get_os_info()` | Get runtime information |
| `MirrorOSRuntime.export_semantic_bundle()` | Export with semantic meaning |
| `MirrorOSRuntime.import_semantic_bundle()` | Import bundle |
| `MirrorOSRuntime.create_fork()` | Create constitution fork |

#### `mirror_os/sync_protocol.py` - Dual-Consent Sync
| Method | Purpose |
|--------|---------|
| `SyncProtocol.request_sync_consent()` | Request sync permission |
| `SyncProtocol.grant_consent()` | Grant sync consent |
| `SyncProtocol.revoke_consent()` | Revoke sync consent |
| `SyncProtocol.check_consent()` | Check consent status |
| `SyncProtocol.sync_with_remote()` | Execute sync |
| `SyncProtocol.get_sync_history()` | Get sync history |

#### `mirror_os/storage/sqlite_storage.py` - SQLite Storage (1300+ lines)
| Method | Purpose |
|--------|---------|
| `SQLiteStorage.create_mirror()` | Create Mirror instance |
| `SQLiteStorage.get_mirror()` | Get Mirror by ID |
| `SQLiteStorage.delete_mirror()` | Delete with CASCADE |
| `SQLiteStorage.create_node()` | Create identity graph node |
| `SQLiteStorage.create_edge()` | Create graph edge |
| `SQLiteStorage.create_language_shape()` | Create language shape |
| `SQLiteStorage.record_shape_occurrence()` | Record shape occurrence |
| `SQLiteStorage.create_tension()` | Create tension |
| `SQLiteStorage.record_tension_measurement()` | Record measurement |
| `SQLiteStorage.create_reflection()` | Create reflection |
| `SQLiteStorage.create_mirrorback()` | Create mirrorback |
| `SQLiteStorage.update_mirrorback_rating()` | Update rating |
| `SQLiteStorage.create_engine_run()` | Log engine run |
| `SQLiteStorage.log_constitutional_check()` | Log constitutional check |
| `SQLiteStorage.export_mirror()` | Export complete Mirror |
| `SQLiteStorage.import_mirror()` | Import Mirror bundle |
| `SQLiteStorage.verify_mirror_locality()` | Verify I2 compliance |

#### `mirror_os/core/orchestrator.py` - Central Orchestrator
| Method | Purpose |
|--------|---------|
| `MirrorOrchestrator.generate()` | Orchestrate full generation |
| `MirrorOrchestrator._run_l0_check()` | Run constitutional check |
| `MirrorOrchestrator._run_l1_safety()` | Run safety triage |
| `MirrorOrchestrator._run_l2_transform()` | Run reflection transform |
| `MirrorOrchestrator._run_l3_render()` | Run expression render |
| `MirrorOrchestrator._update_graph()` | Update identity graph |
| `MirrorOrchestrator._track_evolution()` | Track evolution |

#### `mirror_os/finder/identity_graph.py` - Identity Graph
| Method | Purpose |
|--------|---------|
| `IdentityGraph.add_node()` | Add node to graph |
| `IdentityGraph.add_edge()` | Add edge with weight |
| `IdentityGraph.get_active_tensions()` | Get high-energy tensions |
| `IdentityGraph.get_recurring_loops()` | Get recurring patterns |
| `IdentityGraph.get_contradictions()` | Get contradictions |
| `IdentityGraph.get_snapshot()` | Generate graph snapshot |
| `IdentityGraph._detect_tensions()` | Auto-detect tensions |
| `IdentityGraph._detect_loops()` | Auto-detect loops |

#### `mirror_os/governance/*.py` - Governance System
| Component | Purpose |
|-----------|---------|
| `ViolationDetector` | Detect constitutional violations |
| `GuardianCouncil` | Guardian oversight system |
| `ConsensusEngine` | AI-human consensus mechanism |
| `AmendmentProposalSystem` | Amendment proposals |
| `ConstitutionalInterpreter` | Interpret constitution |

#### `mirror_os/services/evolution_engine.py` - Evolution Tracking
| Component | Purpose |
|-----------|---------|
| `ProposalType(Enum)` | prompt_change, lens_addition, tension_rename, behavior_flag, constitution_amendment |
| `ProposalStatus(Enum)` | draft, active, approved, rejected, implemented |
| `VoteChoice(Enum)` | for, against, abstain |
| `EvolutionEngine.create_proposal()` | Create evolution proposal |
| `EvolutionEngine.activate_proposal()` | Activate for voting |
| `EvolutionEngine.cast_vote()` | Cast weighted vote |
| `EvolutionEngine.tally_votes()` | Tally proposal votes |
| `EvolutionEngine.implement_proposal()` | Implement approved proposal |
| `EvolutionEngine.create_version()` | Create evolution version |
| `EvolutionEngine.rollout_version()` | Gradual rollout |

---

### 1.3 MirrorX (Extended Engine)

#### `mirrorx/orchestrator.py` - MirrorX Orchestrator
| Method | Purpose |
|--------|---------|
| `MirrorXOrchestrator.generate_reflection()` | Generate with full enforcement |
| `MirrorXOrchestrator.submit_evolution_proposal()` | Submit proposal |
| `MirrorXOrchestrator.vote_on_proposal()` | Vote on proposal |
| `MirrorXOrchestrator.process_multimodal_input()` | Process voice/video/longform |
| `MirrorXOrchestrator.disconnect_from_commons()` | Disconnect with proof |
| `MirrorXOrchestrator.propose_constitutional_amendment()` | Propose amendment |
| `MirrorXOrchestrator.get_system_status()` | Get complete status |

#### `mirrorx/governance/constitutional_monitor.py` - Constitutional Monitor
| Method | Purpose |
|--------|---------|
| `ConstitutionalMonitor.score_proposal()` | Score against constitution |
| `ConstitutionalMonitor._check_sovereignty()` | Check data sovereignty |
| `ConstitutionalMonitor._check_reflection_purity()` | Check non-directive |
| `ConstitutionalMonitor._check_safety()` | Check safety boundaries |
| `ConstitutionalMonitor._check_optimization()` | Check anti-manipulation |
| `ConstitutionalMonitor._check_plurality()` | Check exit rights |

#### `mirrorx/evolution/*.py` - Evolution Components
| Component | Purpose |
|-----------|---------|
| `BehaviorChangeLog` | Log all behavior changes |
| `ConflictResolver` | Resolve evolution conflicts |
| `MirrorXCritic` | Self-critique mirrorbacks |

#### `mirrorx/security/*.py` - Security Components
| Component | Purpose |
|-----------|---------|
| `EncryptionSystem` | Local encryption |
| `DisconnectProofSystem` | Cryptographic disconnect proof |

#### `mirrorx/multimodal/manager.py` - Multimodal Processing
| Method | Purpose |
|--------|---------|
| `MultimodalManager.process_voice_input()` | Process voice |
| `MultimodalManager.process_video_input()` | Process video |
| `MultimodalManager.process_longform_text()` | Process long-form |
| `MultimodalManager.get_privacy_controls()` | Get privacy settings |

---

### 1.4 Constitution (Enforcement Layer)

#### `constitution/genesis.py` - Genesis Verification
| Component | Purpose |
|-----------|---------|
| `GENESIS_HASH` | Immutable constitution hash |
| `GenesisVerifier.verify()` | Verify constitutional integrity |
| `GenesisVerifier.verify_or_enter_bootstrap()` | Bootstrap mode handling |

#### `constitution/l0_axiom_checker.py` - L0 Axiom Checker
| Method | Purpose |
|--------|---------|
| `L0AxiomChecker.check()` | Check all 14 invariants |
| `L0AxiomChecker._check_i1_sovereignty()` | Data sovereignty |
| `L0AxiomChecker._check_i2_locality()` | Identity locality |
| `L0AxiomChecker._check_i3_reflection_only()` | No directives |
| `L0AxiomChecker._check_i8_no_harm()` | No harmful generation |
| `L0AxiomChecker._check_i13_feedback()` | Feedback sovereignty |
| `L0AxiomChecker._check_i14_no_cross_identity()` | No cross-identity inference |

#### `constitution/l1_harm_triage.py` - L1 Harm Triage
| Component | Purpose |
|-----------|---------|
| `HarmLevel(Enum)` | NONE, LOW, MEDIUM, HIGH, CRITICAL |
| `HarmCategory(Enum)` | SELF_HARM, VIOLENCE, HATE, MEDICAL, ILLEGAL, MANIPULATION |
| `L1HarmTriageClassifier.classify()` | Classify harm level |
| `L1HarmTriageClassifier.get_resources()` | Get crisis resources |

#### `constitution/drift_monitor.py` - Drift Monitoring
| Component | Purpose |
|-----------|---------|
| `DriftMonitor.check_drift()` | Check constitutional drift |
| `DriftMonitor.get_metrics()` | Get drift metrics |

---

## 2. React Frontend

### 2.1 Pages (30+ routes)

| Page | Route | Purpose |
|------|-------|---------|
| `index.tsx` | `/` | World Realm - Commons feed |
| `reflect.tsx` | `/reflect` | Reflect Realm - Multimodal input |
| `mirror.tsx` | `/mirror` | Mirror Realm - AI interaction |
| `identity.tsx` | `/identity` | Identity Realm - Self view |
| `threads.tsx` | `/threads` | Threads - Conversation view |
| `crisis.tsx` | `/crisis` | Crisis - Safety interface |
| `settings.tsx` | `/settings` | Settings - Preferences |
| `analytics.tsx` | `/analytics` | Analytics - Privacy metrics |
| `governance.tsx` | `/governance` | Governance - Proposals/voting |
| `gallery.tsx` | `/gallery` | Gallery - Reflection collections |
| `forks.tsx` | `/forks` | Forks - Constitution variants |
| `data-portability.tsx` | `/data-portability` | Export/import |
| `constitution.tsx` | `/constitution` | Constitution viewer |
| `profile/[username].tsx` | `/profile/:username` | User profile |
| `lens/[lens_key].tsx` | `/lens/:key` | Lens view |
| `thread/[threadId].tsx` | `/thread/:id` | Thread detail |

### 2.2 Core Components

| Component | Props | Purpose |
|-----------|-------|---------|
| `MirrorField` | `onSubmit, layer?, crisisMode?` | Main reflection input |
| `CommandPalette` | `isOpen, onClose` | Cmd+K command palette |
| `DraggableInstrument` | `title, icon, onClose, children` | Floating window |
| `MultimodalControls` | `onRecordingComplete` | Voice/video controls |
| `RecordingCard` | `recording, onDelete` | Recording playback |
| `ReceiptSystem` | `receipts, onDismiss` | Constitutional receipts |
| `LayerIndicator` | - | Current layer display |
| `Navigation` | - | Main navigation |
| `Layout` | `children` | Page layout wrapper |

### 2.3 Instruments (27+ constitutional tools)

| Instrument | Purpose |
|------------|---------|
| `EntryInstrument` | First-time onboarding |
| `ReflectionLinksInstrument` | Link reflections together |
| `ThreadDiscoveryInstrument` | Discover thread patterns |
| `SpeechContractInstrument` | AI behavior disclosure |
| `LicenseStackInstrument` | Data routing licenses |
| `RefusalInstrument` | Boundary definitions |
| `GovernanceInstrument` | Amendment proposals |
| `ForkEntryInstrument` | Fork exploration |
| `WorldviewLensInstrument` | Perspective lenses |
| `ConflictResolutionInstrument` | Conflict resolution |
| `ExportInstrument` | Data export |
| `ProvenanceInstrument` | Data provenance tracking |
| `EncryptionInstrument` | Encryption management |
| `SafetyPlanInstrument` | Safety planning |
| `CrisisScreenInstrument` | Crisis response |
| `RecognitionInstrument` | Identity recognition |
| `PatternDetectionInstrument` | Pattern analysis |
| `VersionHistoryInstrument` | Version history |
| `MigrationInstrument` | Data migration |
| `OfflineQueueInstrument` | Offline sync queue |
| `PauseAndGroundInstrument` | Grounding techniques |
| `PrivacyDashboardInstrument` | Privacy settings |
| `ConstitutionViewerInstrument` | Constitution viewer |
| `DatabaseHealthInstrument` | Database diagnostics |
| `DeviceRegistryInstrument` | Device management |
| `DataPortabilityInstrument` | Data portability |
| `TimeBasedReflectionsInstrument` | Scheduled prompts |

### 2.4 MVP Screens (30+ full-screen views)

| Screen | Purpose |
|--------|---------|
| `ReflectScreen` | Main reflection interface |
| `MirrorScreen` | Mirror realm view |
| `SelfScreen` | Self realm view |
| `IdentityGraphScreen` | Identity graph visualization |
| `ThreadsScreen` | Threads interface |
| `WorldScreen` | Commons/world view |
| `ArchiveScreen` | Archive view |
| `CrisisScreen` | Crisis response |
| `CommonsScreen` | Commons interface |
| `GovernanceScreen` | Governance interface |
| `ExportScreen` | Data export |
| `ImportScreen` | Data import |
| `DataPortabilityScreen` | Portability |
| `BoundariesScreen` | Boundaries interface |
| `ForksScreen` | Forks management |
| `DevicesScreen` | Device management |
| `OnboardingScreen` | Onboarding flow |
| `AccessibilitySettingsScreen` | Accessibility |
| `DiagnosticsDashboardScreen` | Diagnostics |
| `MultimodalReflectScreen` | Multimodal reflection |
| `BuilderModeScreen` | Builder mode |

### 2.5 UI Components (50+ shadcn/ui)

Standard shadcn/ui library:
- `Accordion`, `AlertDialog`, `Alert`, `AspectRatio`, `Avatar`
- `Badge`, `Breadcrumb`, `Button`, `Calendar`, `Card`, `Carousel`
- `Chart`, `Checkbox`, `Collapsible`, `Command`, `ContextMenu`
- `Dialog`, `Drawer`, `DropdownMenu`, `Form`, `HoverCard`
- `Input`, `InputOTP`, `Label`, `Menubar`, `NavigationMenu`
- `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`
- `ScrollArea`, `Select`, `Separator`, `Sheet`, `Sidebar`
- `Skeleton`, `Slider`, `Sonner`, `Switch`, `Table`, `Tabs`
- `Textarea`, `Toggle`, `ToggleGroup`, `Tooltip`

### 2.6 Domain Components

#### Crisis Components
- `CrisisDetection`, `CrisisModal`, `CrisisScreen`
- `PauseAndGround`, `SafetyPlan`, `SupportResources`

#### Finder Components
- `DoorCard`, `DoorDetail`, `DoorsPanel`
- `PostureSelector`, `PostureDashboard`
- `LensSelector`, `LensLibrary`, `LensUsageTracker`
- `TPVVisualizer`, `AsymmetryReport`, `MistakeReporter`

#### Identity Components
- `IdentityGraphView`, `IdentitySnapshot`
- `BiasInsightCard`, `GraphEdgeEditor`, `RegressionMarker`

#### Governance Components
- `ConstitutionViewer`, `GuardianDashboard`
- `ProposalCard`, `ProposalComposer`, `VotingInterface`
- `AmendmentHistory`

#### Threading Components
- `TensionMap`, `PatternLibrary`
- `ThreadTimeline`, `EmotionTracker`

#### Commons Components
- `AttestationBadge`, `CommonsPublisher`, `CommonsSearch`
- `NetworkMap`, `ResponseComposer`, `WitnessButton`

---

## 3. API Endpoints

### 3.1 Reflections API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/reflections/` | Create reflection |
| `GET` | `/api/v1/reflections/{id}` | Get reflection |
| `GET` | `/api/v1/reflections/user/{username}` | Get user's reflections |
| `GET` | `/api/v1/reflections/lens/{lens_key}` | Get by lens |
| `PATCH` | `/api/v1/reflections/{id}` | Update reflection |
| `DELETE` | `/api/v1/reflections/{id}` | Delete reflection |

### 3.2 Mirrorbacks API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/mirrorbacks/` | Generate mirrorback |
| `GET` | `/api/v1/mirrorbacks/reflection/{id}` | Get for reflection |
| `GET` | `/api/v1/mirrorbacks/{id}` | Get mirrorback |
| `DELETE` | `/api/v1/mirrorbacks/{id}` | Delete mirrorback |

### 3.3 Feed API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/feed/` | Get personalized feed |
| `GET` | `/api/v1/feed/public` | Get public feed |
| `POST` | `/api/v1/feed/refresh` | Refresh feed state |

### 3.4 Profiles API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/profiles/me` | Get own profile |
| `GET` | `/api/v1/profiles/{username}` | Get profile |
| `POST` | `/api/v1/profiles/` | Create profile |
| `PATCH` | `/api/v1/profiles/me` | Update profile |
| `GET` | `/api/v1/profiles/{username}/followers` | Get followers |
| `GET` | `/api/v1/profiles/{username}/following` | Get following |
| `POST` | `/api/v1/profiles/{username}/follow` | Follow user |
| `DELETE` | `/api/v1/profiles/{username}/follow` | Unfollow user |
| `POST` | `/api/v1/profiles/upload-avatar` | Upload avatar |

### 3.5 Threads API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/threads/` | Create thread |
| `GET` | `/api/v1/threads/` | List threads |
| `GET` | `/api/v1/threads/{id}` | Get thread |
| `GET` | `/api/v1/threads/{id}/reflections` | Get thread reflections |
| `PATCH` | `/api/v1/threads/{id}` | Update thread |
| `DELETE` | `/api/v1/threads/{id}` | Delete thread |

### 3.6 Evolution API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/evolution/proposals` | Create proposal |
| `GET` | `/api/evolution/proposals` | List proposals |
| `GET` | `/api/evolution/proposals/{id}` | Get proposal |
| `POST` | `/api/evolution/proposals/{id}/activate` | Activate proposal |
| `POST` | `/api/evolution/proposals/{id}/vote` | Cast vote |
| `GET` | `/api/evolution/proposals/{id}/votes` | Get votes |
| `POST` | `/api/evolution/versions` | Create version |
| `GET` | `/api/evolution/versions` | List versions |
| `GET` | `/api/evolution/versions/active` | Get active version |
| `POST` | `/api/evolution/versions/{id}/rollout` | Rollout version |
| `POST` | `/api/evolution/proposals/{id}/broadcast` | Broadcast to commons |
| `POST` | `/api/evolution/proposals/{id}/aggregate-votes` | Aggregate votes |
| `GET` | `/api/evolution/sync/status` | Get sync status |
| `POST` | `/api/evolution/sync/enable` | Enable sync |
| `POST` | `/api/evolution/sync/disable` | Disable sync |

### 3.7 Finder API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/v1/finder/posture` | Get posture |
| `POST` | `/api/v1/finder/posture` | Update posture |
| `POST` | `/api/v1/finder/lens-usage` | Record lens usage |
| `GET` | `/api/v1/finder/tpv` | Get Tension Proxy Vector |
| `GET` | `/api/v1/finder/doors` | Get recommended doors |
| `POST` | `/api/v1/finder/doors/{id}/view` | Record door view |
| `GET` | `/api/v1/finder/graph` | Get identity graph |
| `POST` | `/api/v1/finder/mistakes` | Report mistake |
| `GET` | `/api/v1/finder/config` | Get config |
| `PUT` | `/api/v1/finder/config` | Update config |
| `GET` | `/api/v1/finder/asymmetry/{id}` | Get asymmetry report |

### 3.8 Governance API
| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/governance/proposals` | Submit proposal |
| `POST` | `/api/v1/governance/proposals/{id}/vote` | Vote on proposal |
| `GET` | `/api/v1/governance/proposals` | List proposals |
| `GET` | `/api/v1/governance/proposals/{id}` | Get proposal |
| `POST` | `/api/v1/governance/guardians/appoint` | Appoint guardian |
| `POST` | `/api/v1/governance/amendments` | Propose amendment |
| `GET` | `/api/v1/governance/status` | Get system status |
| `POST` | `/api/v1/governance/encryption/init` | Init encryption |
| `POST` | `/api/v1/governance/encryption/unlock` | Unlock encryption |
| `GET` | `/api/v1/governance/encryption/status` | Get encryption status |
| `POST` | `/api/v1/governance/disconnect` | Disconnect from commons |
| `GET` | `/api/v1/governance/disconnect/status` | Get disconnect status |

### 3.9 Additional APIs
| Endpoint Group | Endpoints |
|----------------|-----------|
| **Signals** | Create, get aggregated, get user's, delete, batch |
| **Notifications** | Get, unread count, mark read, mark all read |
| **Search** | Search reflections, profiles, combined |
| **Identity** | Get graph, tensions, loops, evolution |
| **Patterns** | List, get details, analyze, get evolution |
| **Tensions** | List, get details, analyze, get mapping, seed tensions |

---

## 4. Database Schema

### 4.1 Core Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `profiles` | id, username, display_name, bio, avatar_url, banner_url, role, is_admin, created_at, updated_at | User profiles |
| `reflections` | id, author_id, body, lens_key, tone, visibility, metadata, created_at | Core content |
| `mirrorbacks` | id, reflection_id, author_id, body, tone, tensions, metadata, created_at | AI responses |
| `threads` | id, user_id, title, tone, created_at, updated_at | Conversation threads |

### 4.2 Intelligence Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `bias_insights` | id, identity_id, reflection_id, dimension, direction, confidence, notes, created_at | Detected patterns |
| `safety_events` | id, identity_id, reflection_id, category, severity, action_taken, metadata, created_at | Safety decisions |
| `regression_markers` | id, identity_id, reflection_id, kind, description, severity, pattern_id, created_at | Regressions |

### 4.3 Social Tables

| Table | Columns | Purpose |
|-------|---------|---------|
| `reactions` | id, reflection_id, user_id, kind, created_at | Engagement signals |
| `follows` | follower_id, following_id, created_at | Follow relationships |
| `reflection_signals` | reflection_id, user_id, signal, metadata, created_at | Learning data |
| `notifications` | id, recipient_id, actor_id, type, reflection_id, mirrorback_id, is_read, metadata, created_at | Notifications |

### 4.4 MirrorX Engine Tables

| Table | Purpose |
|-------|---------|
| `mx_users` | MirrorX users |
| `mx_reflections` | MirrorX reflections |
| `mx_mirrorbacks` | MirrorX mirrorbacks with lint status |
| `mx_identity_snapshots` | Current identity state |
| `mx_conductor_bundles` | Full orchestrator state |
| `mx_graph_nodes` | Identity graph nodes |
| `mx_graph_edges` | Graph relationships |
| `mx_identity_deltas` | Identity changes |
| `mx_evolution_events` | Evolution tracking |

### 4.5 Finder Tables

| Table | Purpose |
|-------|---------|
| `posture_states` | User posture |
| `lens_usage_events` | Lens usage for TPV |
| `tension_proxy_vectors` | Computed TPV |
| `candidate_cards` | Reflective conditions |
| `doors_shown` | Diversity tracking |
| `identity_graph_nodes` | Local graph nodes |
| `identity_graph_edges` | Local graph edges |
| `tensions` | Active tensions |
| `mistake_reports` | Finder feedback |
| `finder_config` | User preferences |
| `asymmetry_reports` | Risk metrics |

---

## 5. Edge Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `analytics-aggregator` | Scheduled (daily) | Aggregate analytics |
| `cleanup-sessions` | Scheduled (maintenance) | Clean expired data |
| `broadcast-reflection` | Reflection created/updated | Real-time updates |
| `process-reflection` | Reflection created | Trigger AI processing |
| `send-contact-notification` | Contact submitted | Email notification |
| `sync-user-profile` | User registered | Create profile |
| `webhook-handler` | HTTP POST | External integrations |

---

## 6. Custom Hooks

### State Management Hooks
| Hook | Returns | Purpose |
|------|---------|---------|
| `useMirrorStateContext()` | `{state, actions}` | Core constitutional state |
| `useUIMode()` | `{mode, toggle}` | UI mode toggle |
| `useAppState()` | `AppState + mutations` | Reactive app state |
| `useMirrorState()` | `{state, actions}` | State with persistence |
| `useLocalStorage()` | `[value, setValue]` | Persistent storage |
| `useUndo()` | `[present, actions]` | Undo/redo system |

### Data Fetching Hooks
| Hook | Returns | Purpose |
|------|---------|---------|
| `useReflections()` | `Reflection[]` | Get reflections |
| `useThreads()` | `Thread[]` | Get threads |
| `useCurrentThread()` | `{thread, reflections}` | Current thread |
| `usePosture()` | Query result | Get posture |
| `useTensionProxyVector()` | Query result | Get TPV |
| `useDoors()` | Query result | Get doors |
| `useIdentityGraph()` | Query result | Get identity graph |
| `useFinderConfig()` | Query result | Get finder config |
| `useAsymmetryReport()` | Query result | Get asymmetry |

### UI Interaction Hooks
| Hook | Returns | Purpose |
|------|---------|---------|
| `useDebounce()` | `T` | Debounce values |
| `useKeyboardShortcut()` | `void` | Register shortcut |
| `useKeyboardNavigation()` | Navigation utils | Keyboard nav |
| `useFocusTrap()` | `containerRef` | Focus trap |
| `useRovingTabIndex()` | `{activeIndex, getItemProps}` | Toolbar nav |
| `useMicroInteractions()` | Interaction utils | Haptic/sound/ripple |
| `useRipple()` | `{ripples, createRipple}` | Ripple effect |
| `useLongPress()` | `{isPressed, handlers}` | Long press |
| `useDelayedHover()` | `{isHovered, handlers}` | Delayed hover |
| `useFocusVisible()` | `{isFocusVisible}` | Focus ring |

### Accessibility Hooks
| Hook | Returns | Purpose |
|------|---------|---------|
| `useSkipLinks()` | `{skipTo, SkipLink}` | Skip links |
| `useScreenReaderAnnouncement()` | `{announce, Announcer}` | Announcements |

---

## 7. Services & Utilities

### API Services
| Service | Purpose |
|---------|---------|
| `api.ts` | Core API client with interceptors |
| `api/finder.ts` | Finder API client |
| `mirrorApi.ts` | Mirror-specific API |
| `database.ts` | Supabase database operations |
| `supabase.ts` | Supabase client |

### Application Services
| Service | Purpose |
|---------|---------|
| `stateManager.ts` | Centralized state management |
| `encryption.ts` | Data encryption/decryption |
| `patternDetection.ts` | Behavioral pattern analysis |
| `crisisDetection.ts` | Crisis signal detection |
| `autoRecovery.ts` | Automatic crash recovery |
| `mirrorOS.ts` | Operating system abstraction |
| `offlineQueue.ts` | Offline sync queue |
| `deviceRegistry.ts` | Device tracking |
| `databaseHealth.ts` | Database diagnostics |
| `migration.ts` | Data migration |
| `reflectionVersioning.ts` | Reflection history |
| `reflectionLinks.ts` | Linking reflections |
| `threadDiscovery.ts` | Related thread discovery |
| `timeBasedReflections.ts` | Scheduled reflections |
| `syncService.ts` | Offline/online sync |
| `searchHighlighting.ts` | Search highlighting |
| `constitutionalAudit.ts` | Compliance audit |
| `exportTemplates.ts` | Export formats |
| `crisisResources.ts` | Crisis support resources |

### Utility Modules
| Utility | Purpose |
|---------|---------|
| `accessibility.ts` | Accessibility utilities |
| `animations.ts` | Animation helpers |
| `contrastChecker.ts` | WCAG contrast checker |
| `constitutionArticles.ts` | Constitutional articles |
| `keyboardNavigation.ts` | Keyboard utilities |
| `mockData.ts` | Test data generators |
| `performance.ts` | Performance monitoring |
| `sanitization.ts` | HTML sanitization |
| `storage.ts` | LocalStorage utilities |
| `utils.ts` | General utilities (`cn()`) |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| **Python Classes** | 200+ |
| **Python Functions/Methods** | 500+ |
| **Python Enums** | 70+ |
| **React Components** | 250+ |
| **Custom Hooks** | 30+ |
| **API Endpoints** | 95+ |
| **Database Tables** | 35+ |
| **Edge Functions** | 7 |
| **Service Modules** | 30+ |
| **Utility Modules** | 11 |
| **Total Lines of Code** | ~100,000+ |

---

## Architectural Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                       │
│  Pages → Components → Hooks → Contexts → Services → API     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     CORE API (FastAPI)                       │
│  Routers → Auth → Rate Limiting → Database                  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                   INTELLIGENCE LAYER                         │
│  L0 (Constitution) → L1 (Safety) → L2 (Reflection) → L3    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                     DATA LAYER                               │
│  SQLite (Local) ↔ Supabase (Cloud) ↔ Edge Functions        │
└─────────────────────────────────────────────────────────────┘
```

---

*This inventory represents the complete Mirror Virtual Platform as of 2025-12-16.*

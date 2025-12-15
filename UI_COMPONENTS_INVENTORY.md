# Mirror Virtual Platform - Complete UI Component Inventory
## Full UX Functionality Requirements

Based on 34 database tables + API endpoints, here are ALL components needed:

---

## 🎯 TIER 1: CORE EXPERIENCE (MVP - Build First)

### 1. Reflection System
- [x] **ReflectionComposer** ✅ (exists)
  - Text input with tone selector (raw/processing/clear)
  - Visibility toggle (public/circle/private)
  - Character count, auto-save drafts
  
- [x] **ReflectionCard** ✅ (exists)
  - Display reflection with metadata
  - Tone indicator, timestamp
  - Actions: reply, save, signal
  
- [x] **MirrorBackDisplay** ✅ (exists)
  - AI response with source indicator (ai/human)
  - Tone visualization
  - Feedback buttons (helpful/unhelpful)
  - Copy to clipboard
  
- [x] **ReflectionThread** ✅ (exists)
  - Nested display of reflection + replies
  - Collapse/expand threads
  - Thread metadata (participants, depth)

### 2. Profile & Identity
- [x] **ProfileView** ✅ (exists)
  - Avatar, banner, bio
  - Role badge (Witness/Guide)
  - Stats (reflections count, tensions tracked)
  
- [x] **ProfileEditor** ✅ (exists)
  - Edit display_name, bio, avatar
  - Upload/crop avatar
  - Privacy settings

### 3. Feed & Discovery
- [x] **FeedList** ✅ (exists)
  - Infinite scroll reflection list
  - Filter by visibility/tone
  - Sort options (recent, resonant)
  
- [x] **SearchBar** ✅ (exists)
  - Search reflections by content
  - Search users by username
  - Recent searches

---

## 🪞 TIER 2: MIRROR FINDER (Constitutional Routing)

### 4. Posture System
- [x] **PostureSelector** ✅ (exists)
  - 6 posture buttons: unknown → overwhelmed → guarded → grounded → open → exploratory
  - Visual state indicator (icons, colors)
  - Declared vs. Suggested comparison
  - Divergence alert when suggested differs
  - Quick declare action
  
- [x] **PostureDashboard** ✅ (exists)
  - Current posture large display
  - Posture history timeline
  - Suggested posture with reasoning
  - "Why this suggestion?" explainer

### 5. Lens & TPV System
- [ ] **LensSelector** ⚠️ NEW
  - Grid/list of available lenses
  - Visual tags (politics, relationships, identity, etc.)
  - Usage frequency indicator
  - Quick-add to session
  
- [ ] **TPVVisualizer** ⚠️ NEW
  - Tension Proxy Vector display (radar chart or bar chart)
  - Lens weights visualization
  - Ambiguity score indicator
  - Last computed timestamp
  - Manual override button
  
- [ ] **LensUsageTracker** ⚠️ NEW
  - Session-based lens recording
  - Visual feedback when lens used
  - Usage history (for transparency)

### 6. Door System (Recommendations)
- [ ] **DoorCard** ⚠️ NEW
  - Reflective condition preview
  - Card type badge (person, room, artifact, practice)
  - Interaction style (witness, dialogue, debate, structured)
  - Lens tags visual
  - Attestation count
  - "Open Door" CTA
  
- [ ] **DoorsPanel** ⚠️ NEW
  - 3-door default layout (bandwidth_limit)
  - Horizontal scroll for mobile
  - Refresh button with rate limit indicator
  - "Why these doors?" explainer
  - Hide/block door actions
  
- [ ] **DoorDetail** ⚠️ NEW
  - Full door information
  - Asymmetry report display
  - Creator profile link
  - Related doors
  - Entry confirmation dialog

### 7. Identity Graph
- [ ] **IdentityGraphView** ⚠️ NEW
  - Force-directed graph visualization (D3.js or React Flow)
  - Nodes: thoughts, beliefs, emotions, actions, experiences, consequences
  - Edges: reinforces, contradicts, undermines, leads_to, co_occurs_with
  - Color coding by node type
  - Interactive (click to expand, drag to reposition)
  - Filter by lens tags
  
- [ ] **GraphNodeCard** ⚠️ NEW
  - Node label + content
  - Activation count, last activated
  - Connected nodes preview
  - Edit/delete node
  
- [ ] **GraphEdgeEditor** ⚠️ NEW
  - Create/edit relationships between nodes
  - Edge type selector (5 types)
  - Frequency, intensity, confidence sliders
  
- [ ] **TensionCard** ⚠️ NEW
  - Display tension between two nodes
  - Energy indicator (0.0 - 1.0)
  - Duration in days
  - Lens tags
  - "Explore this tension" action

### 8. Finder Configuration
- [ ] **FinderSettings** ⚠️ NEW
  - Mode selector: first_mirror, active, manual, random, off
  - Bandwidth limit slider (1-10 doors)
  - Blocked nodes list with unblock action
  - Timing preferences (quiet hours, frequency)
  
- [ ] **MistakeReporter** ⚠️ NEW
  - Quick report form for doors
  - Mistake type dropdown (5 types)
  - Context text area
  - Submit with confirmation
  - "Thank you for teaching us" feedback

### 9. Asymmetry System
- [ ] **AsymmetryReport** ⚠️ NEW
  - Exit friction indicator (low/medium/high)
  - Data demand ratio bar (0-1)
  - Boolean flags: opacity, identity_coercion, unilateral_control, lock_in_terms
  - Evidence tier badge (declared/attested/observed)
  - Visual risk score
  - "What does this mean?" tooltips

---

## 🏛️ TIER 3: GOVERNANCE & WORLDVIEW

### 10. Constitutional Governance
- [ ] **GovernanceHub** ⚠️ NEW
  - Active proposals list
  - Vote now CTAs
  - Proposal status indicators
  - Recent amendments timeline
  
- [ ] **ProposalCard** ⚠️ NEW
  - Title, description, rationale
  - Voting deadline countdown
  - Vote counts (approve/reject/abstain) with percentage bars
  - Status badge (draft/voting/passed/rejected/implemented/vetoed)
  - "Read full text" expand
  
- [ ] **ProposalComposer** ⚠️ NEW
  - Multi-step form (title, description, full text, rationale)
  - Markdown editor for full text
  - Preview mode
  - Guardian review notification
  - Submit for voting
  
- [ ] **VotingInterface** ⚠️ NEW
  - Proposal full display
  - Three-button choice: Approve, Reject, Abstain
  - Optional comment text area
  - "Fork instead" option (if supermajority fails)
  - Confirmation dialog
  - "You voted" indicator
  
- [ ] **AmendmentHistory** ⚠️ NEW
  - Timeline of all amendments
  - Implemented amendments with dates
  - Filter by status
  - Search amendments

### 11. Recognition Registry
- [ ] **RegistryDashboard** ⚠️ NEW
  - Instance ID display
  - Genesis hash verification
  - Status indicator (pending/verified/challenged/revoked)
  - Verification count
  - Challenge count
  
- [ ] **VerificationCard** ⚠️ NEW
  - Verifier instance ID
  - Verification signature
  - Timestamp
  - Trust chain visualization
  
- [ ] **ChallengeLodger** ⚠️ NEW
  - Challenge claim form
  - Evidence upload/text
  - Submit challenge
  - View challenge status
  
- [ ] **ForkRegistry** ⚠️ NEW
  - List of legitimate forks
  - Fork reason display
  - Parent instance link
  - Amendment differences
  - Fork status (active/inactive/merged)

---

## 🔧 TIER 4: MIRRORX ENGINE & INTELLIGENCE

### 12. Identity Intelligence
- [ ] **IdentitySnapshot** ⚠️ NEW
  - Current tensions list
  - Paradoxes visualization
  - Goals tracker
  - Recurring loops alert
  - Regressions timeline
  - Dominant tension highlight
  - Big question display
  - Emotional baseline graph
  - Oscillation pattern chart
  
- [ ] **BiasInsightCard** ⚠️ NEW
  - Dimension + direction display
  - Confidence meter
  - Associated reflection link
  - Notes section
  - "This is data, not judgment" reminder
  
- [ ] **SafetyEventLog** ⚠️ NEW
  - Transparent audit log
  - Category + severity display
  - Action taken explanation
  - Metadata expansion
  - Timeline view
  - Filter by severity
  
- [ ] **RegressionMarker** ⚠️ NEW
  - Regression type badge (loop, self_attack, judgment_spike, avoidance)
  - Severity indicator (1-5)
  - Pattern ID link
  - Description
  - "Learn from this" action

### 13. Engine Performance
- [ ] **EngineMetrics** ⚠️ NEW
  - Performance dashboard
  - Engine mode indicator (local_llm/remote_llm/manual)
  - Avg response time
  - Constitutional flags history
  - Patterns surfaced count
  
- [ ] **FeedbackWidget** ⚠️ NEW
  - Star rating (1-5)
  - Quick feedback buttons (helpful/unhelpful)
  - Comment field
  - Submit feedback
  - "Your feedback evolves the system"

---

## 🌐 TIER 5: COMMONS & NETWORK

### 14. Commons Integration
- [ ] **CommonsPublisher** ⚠️ NEW
  - Select reflection to publish
  - Add metadata (lens tags, interaction style)
  - Card type selector (person, room, artifact, practice)
  - Preview public card
  - Publish confirmation
  
- [ ] **CommonsSearch** ⚠️ NEW
  - Search public cards
  - Filter by lens tags
  - Filter by card type
  - Sort by attestation count
  - Preview before opening
  
- [ ] **AttestationButton** ⚠️ NEW
  - Attest to card quality
  - Attestation count display
  - "Your attestation helps others find this"

### 15. Network Protocol (P2P)
- [ ] **PeerConnections** ⚠️ NEW
  - Connected instances list
  - Connection status (online/offline)
  - Message history
  - Discovery log
  
- [ ] **MessagingInterface** ⚠️ NEW
  - P2P messaging to other instances
  - Message encryption indicator
  - Message history
  - Connection request

---

## 📊 TIER 6: SYSTEM & ADMIN

### 16. Admin & Moderation
- [ ] **AdminDashboard**
  - Platform stats
  - Recent signups
  - Active users
  - Safety events overview
  
- [ ] **GuardianPanel** ⚠️ NEW
  - Pending proposals review
  - Veto interface
  - Amendment implementation tools
  - Constitutional compliance checks

### 17. Settings & Configuration
- [ ] **UserSettings**
  - Account settings
  - Privacy controls
  - Notification preferences
  - Data export
  
- [ ] **EncryptionManager** ⚠️ NEW
  - Initialize encryption
  - Unlock with passphrase
  - Encryption status
  - Key rotation

---

## 🎨 TIER 7: SHARED COMPONENTS & UTILITIES

### 18. Core UI Elements
- [ ] **Button** ✅
- [ ] **Card** ✅
- [ ] **Input** ✅
- [ ] **Avatar** ✅
- [ ] **Badge**
- [ ] **Dialog** ✅
- [ ] **Dropdown**
- [ ] **Toast/Notification**
- [ ] **Tooltip**
- [ ] **Accordion** ✅
- [ ] **Tabs**
- [ ] **Modal**
- [ ] **Skeleton Loader**
- [ ] **Progress Bar**
- [ ] **Slider**
- [ ] **Toggle/Switch**

### 19. Layout Components
- [ ] **Navigation** ✅
- [ ] **Sidebar** ✅
- [ ] **Layout** ✅
- [ ] **Hero** ✅
- [ ] **Footer**
- [ ] **Breadcrumbs**

### 20. Data Visualization
- [ ] **ForceDirectedGraph** (D3.js or React Flow)
- [ ] **RadarChart** (TPV visualization)
- [ ] **BarChart** (voting results, metrics)
- [ ] **Timeline** (amendments, posture history)
- [ ] **Heatmap** (lens usage over time)

---

## 📦 COMPONENT COUNT SUMMARY

| Category | Existing | New | Total |
|----------|----------|-----|-------|
| Core Experience | 8 | 4 | 12 |
| Mirror Finder | 0 | 24 | 24 |
| Governance & Worldview | 0 | 12 | 12 |
| MirrorX Intelligence | 0 | 8 | 8 |
| Commons & Network | 0 | 7 | 7 |
| Admin & System | 1 | 3 | 4 |
| Shared UI | 15 | 5 | 20 |
| **TOTAL** | **24** | **63** | **87** |

---

## 🚀 BUILD ORDER RECOMMENDATION

### Phase 1: Core Functionality (Week 1-2)
1. MirrorBackDisplay (critical - users need responses)
2. ReflectionThread (conversations)
3. ProfileEditor (user onboarding)
4. FeedbackWidget (evolution data)

### Phase 2: Mirror Finder Foundation (Week 3-4)
1. PostureSelector + PostureDashboard
2. LensSelector + LensUsageTracker
3. TPVVisualizer (data transparency)
4. FinderSettings (user control)

### Phase 3: Door System (Week 5-6)
1. DoorCard + DoorsPanel
2. DoorDetail
3. AsymmetryReport
4. MistakeReporter

### Phase 4: Identity Graph (Week 7-8)
1. IdentityGraphView (core visualization)
2. GraphNodeCard + GraphEdgeEditor
3. TensionCard
4. IdentitySnapshot

### Phase 5: Governance (Week 9-10)
1. GovernanceHub
2. ProposalCard + VotingInterface
3. ProposalComposer
4. AmendmentHistory

### Phase 6: Intelligence & Network (Week 11-12)
1. BiasInsightCard
2. SafetyEventLog
3. CommonsPublisher + CommonsSearch
4. RegistryDashboard

---

## 🎯 CRITICAL DEPENDENCIES

### Must Build First (Blockers)
1. **PostureSelector** - Finder won't work without posture
2. **LensUsageTracker** - TPV computation requires lens data
3. **DoorCard** - Core Finder UX
4. **IdentityGraphView** - Visualizes local identity (never shared)
5. **VotingInterface** - Democratic governance requires this

### Can Build Anytime (Independent)
- MistakeReporter
- AsymmetryReport
- FeedbackWidget
- AdminDashboard
- EncryptionManager

---

## 📐 DESIGN SYSTEM NEEDS

### Color Palette
- Postures: 6 distinct colors (unknown → exploratory)
- Graph Nodes: 6 node types need colors
- Safety Severity: info (blue), warning (yellow), critical (red)
- Asymmetry: low (green), medium (yellow), high (red)

### Icons
- 6 posture icons
- 6 node type icons
- 5 edge type icons
- 5 mistake type icons
- 4 card type icons
- 4 interaction style icons

### Typography
- Display: Headings, hero text
- Body: Reflection content, descriptions
- Mono: Hashes, IDs, technical data

---

## 🔧 TECHNICAL STACK RECOMMENDATIONS

### Data Visualization
- **React Flow** or **D3.js** for identity graph
- **Recharts** or **Victory** for charts (TPV, metrics)
- **Framer Motion** for animations (posture transitions)

### Form Handling
- **React Hook Form** for complex forms (proposals, settings)
- **Zod** for validation schemas

### State Management
- **Zustand** or **Jotai** for Finder state (posture, doors, TPV)
- **React Query** for server state (reflections, proposals)

### Real-time
- **Supabase Realtime** for live updates (votes, new doors)

---

## ✅ NEXT IMMEDIATE STEPS

1. **Create PostureSelector** - Enables Finder mode declaration
2. **Build DoorCard** - Shows recommendations
3. **Implement TPVVisualizer** - Transparency into routing logic
4. **Create IdentityGraphView** - Core identity visualization

These 4 components unlock 80% of Finder functionality.

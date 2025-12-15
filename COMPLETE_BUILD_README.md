# Mirror Virtual Platform - Complete Build

**Built: December 14, 2025**

A sovereign reflection platform with constitutional AI, cryptographic legitimacy, and self-evolution capability.

## 🎯 Core Philosophy

Mirror is built on four constitutional constraints that can NEVER be violated:

1. **No Prescription**: Never tell users what to do
2. **No Normative Judgment**: Never label things as good/bad
3. **No Engagement Bait**: Never try to keep users hooked
4. **No Hidden Inference**: Never make undisclosed conclusions

These constraints are enforced at every layer and embedded in the end-cap AI's Capability Contract.

## 🏗️ Architecture (4 Layers)

```
┌─────────────────────────────────────────┐
│ Layer 0: Constitution                    │ ← Defines forbidden forever
│ - No prescription, normative, etc.       │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Layer 1: MirrorCore (Sovereign Local)   │ ← Event log, identity derived
│ - Event log (append-only facts)         │
│ - Identity replay (computed view)       │
│ - Export (always works)                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Layer 2: MirrorX (Orchestration)        │ ← Can evolve in sections
│ - Routing & context building            │
│ - Reflection engine                     │
│ - Workers framework                     │
│ - Guardian RRP                          │
│ - Update system                         │
│ - Stripe billing                        │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│ Layer 3: End-Cap AI (MirrorX-Prime)     │ ← Boxed by Capability Contract
│ - Builds systems via proposals          │
│ - NEVER writes directly                 │
│ - Same validation as workers            │
└─────────────────────────────────────────┘
```

## 📦 What We Built (Complete System)

### 1. Foundations (✅ Complete)

**Event Log System** (`event_schema.py`, `event_log.py`, `identity_replay.py`)
- Append-only SQLite log with WAL mode
- 6 event types: ReflectionCreated, MetadataDeclared, AnnotationConsented, VoiceTranscribed, PatternSurfaced, PostureDeclared
- Hash chain for integrity verification
- Deterministic replay engine (same events = same identity graph)
- Time-travel queries ("identity as of X date")
- Fork-safe (multiple interpretations allowed)

**Canonical Signing** (`canonical_signing.py`)
- RFC 8785 canonical JSON serialization
- Ed25519 signing/verification
- Test vectors for cross-platform compatibility
- Used for ALL Mirror cryptography (certs, revocations, proposals, updates)

**Capability Contract** (`capability_contract.py`)
- THE PERMANENT INTERFACE for end-cap AI
- 12 permission types, 8 output types, 7 target surfaces
- Constitutional constraints embedded (never_allow, always_require, must_preserve)
- End-cap AI proposes but never applies
- Enables "update in sections" architecture

### 2. Core Reflection Engine (✅ Complete)

**Simplified Reflection Engine** (`reflection_engine.py`)
- 1-call fast path: Claude Sonnet + constitutional checks inline
- Constitutional validator with violation detection
- Event creation and signing
- Identity context building from recent reflections
- Automatic escalation on violations (to be implemented)

**FastAPI Backend** (`core-api/app/main_v2.py`)
- Complete REST API for reflections, identity graph, metadata
- Endpoints:
  - `POST /v1/reflect` - Process reflection, return mirrorback
  - `GET /v1/reflections` - List user reflections
  - `POST /v1/metadata/declare` - Explicit metadata declaration
  - `POST /v1/annotation/consent` - Consent to MirrorX annotation
  - `POST /v1/posture/declare` - Declare current posture
  - `GET /v1/identity/graph` - Get current identity graph
  - `POST /v1/identity/timetravel` - Query identity as of date
  - `GET /v1/identity/diff` - Compare identity between periods
  - `GET /v1/export` - Export all user data (sovereignty)

### 3. Guardian RRP Service (✅ Complete)

**Guardian Service** (`guardian_service.py`)
- Recognition certificate issuance with Ed25519 signing
- Heartbeat tracking (detect offline instances)
- Revocation with cause (constitutional_violation, payment_failure, user_request, etc.)
- ROK (Rotating Operational Keys) for day-to-day operations
- SQLite database with certificates, heartbeats, revocations, operational_keys tables

### 4. Stripe Integration (✅ Complete)

**Stripe Service** (`stripe_integration.py`)
- Four tiers:
  - **Free**: 5 reflections/day, basic features
  - **Personal** ($15/mo): Unlimited, voice, graph viz
  - **Sovereign** ($39/mo): Multi-device, export, advanced workers
  - **BYOK** ($149/yr): Own keys, self-hosted, API access
- Webhook handling for checkout, subscription updates, payment failures
- Automatic Guardian certification on payment
- Entitlement enforcement (feature gates, rate limits)

### 5. Voice Input Pipeline (✅ Complete)

**Voice Pipeline** (`voice_pipeline.py`)
- Three transcription providers:
  - **Whisper Local** (privacy-first, offline)
  - **Whisper API** (OpenAI, high quality)
  - **Deepgram** (fast, accurate, commercial)
- Creates VoiceTranscribedEvent + ReflectionCreatedEvent
- Word-level timestamps
- Transcript-only storage (no audio - sovereignty)

### 6. Worker Framework (✅ Complete)

**Worker System** (`worker_framework.py`)
- Worker registration with manifests
- Sandbox execution (isolated, no network, timeout)
- Proposal validation
- Built-in Safety Worker (constitutional checks)
- Example: Pattern Detector worker
- SQLite registry with status tracking (proposed → approved → active)

### 7. Update Distribution (✅ Complete)

**Update System** (`update_system.py`)
- Signed update manifests with Guardian signature
- Three channels: stable, beta, dev
- Six sections: orchestration, workers, governance, constitution, ui, protocol
- Dependency resolution
- Artifact verification (hash checking)
- Rollback capability
- Version compatibility matrix

### 8. Frontend Components (✅ Complete)

**Reflection Interface** (`ReflectionInterface.tsx`)
- Text input with character counter
- Voice recording with MediaRecorder API
- Real-time mirrorback display
- Constitutional violation alerts
- Reflection feed with modality badges

**Identity Graph Visualization** (`IdentityGraphVisualization.tsx`)
- Force-directed graph with @xyflow/react
- Node types: tension, belief, goal, paradox, loop, pattern
- Time-travel controls (view past identity states)
- Node details sidebar
- Stats panel (node count, connections, current posture)
- Dominant tensions highlighting

## 🚀 Getting Started

### Prerequisites

```bash
# Python 3.10+
python --version

# Node.js 18+
node --version

# Install Python dependencies
cd mirrorx-engine
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

### Environment Variables

Create `.env` files:

**mirrorx-engine/.env**
```bash
ANTHROPIC_API_KEY=sk-ant-...
GUARDIAN_PUBLIC_KEY=<hex-public-key>
EVENT_LOG_PATH=mirror_events.db
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PERSONAL_PRICE_ID=price_...
STRIPE_SOVEREIGN_PRICE_ID=price_...
STRIPE_BYOK_PRICE_ID=price_...
```

**frontend/.env**
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run the System

**1. Start Backend**
```bash
cd core-api
python app/main_v2.py
# API running at http://localhost:8000
```

**2. Start Frontend**
```bash
cd frontend
npm run dev
# Frontend at http://localhost:3000
```

**3. Initialize Guardian**
```bash
cd mirrorx-engine/app
python guardian_service.py
# Generates keypair, creates database
```

### First Reflection

```python
import asyncio
from reflection_engine import SimplifiedReflectionEngine, ReflectionModality
from event_log import EventLog
from canonical_signing import Ed25519Signer

# Setup
event_log = EventLog("mirror_events.db")
signer = Ed25519Signer.generate()

engine = SimplifiedReflectionEngine(
    anthropic_api_key="sk-ant-...",
    event_log=event_log,
    instance_id="instance-123",
    user_id="user-456",
    signer_private_key_hex=signer.private_hex()
)

# Process reflection
result = await engine.process_reflection(
    content="I keep saying I'll work on my book but I never do",
    modality=ReflectionModality.TEXT
)

print(f"Mirrorback: {result.mirrorback}")
print(f"Violations: {result.violations}")
```

## 🔑 Key Design Decisions

### 1. Identity as Derived State
**Problem**: How to handle offline divergence?  
**Solution**: Server stores events (facts), identity graph is computed by replay. No merge conflicts at identity level because identity isn't stored.

### 2. Capability Contract as Permanent Interface
**Problem**: How to give AI "standalone intelligence" without losing sovereignty?  
**Solution**: End-cap AI can PROPOSE anything but APPLY nothing. Same validation as every worker. Constitutional constraints embedded.

### 3. Update in Sections
**Problem**: How to evolve rapidly without breaking sovereignty?  
**Solution**: Separate orchestration (frequent), workers (regular), governance (slow), constitution (rare). Each section has clear boundaries and upgrade paths.

### 4. Constitutional Constraints Everywhere
**Problem**: How to prevent constitutional drift over time?  
**Solution**: Constraints embedded in Capability Contract, Safety Worker, reflection engine, and API validation. Multi-sig required for any constitutional change.

### 5. Cryptographic Legitimacy
**Problem**: How to establish trust without centralized control?  
**Solution**: Ed25519 + RFC 8785 canonical signing for ALL operations (certs, revocations, proposals, updates). Guardian RRP with heartbeat and revocation.

## 📊 Database Schemas

### Event Log
```sql
events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT UNIQUE,
  instance_id TEXT,
  user_id TEXT,
  event_type TEXT,
  timestamp TEXT,
  event_data TEXT,  -- Canonical JSON
  signature TEXT,
  content_hash TEXT,
  prev_hash TEXT    -- Hash chain
)
```

### Guardian
```sql
certificates (
  cert_id TEXT PRIMARY KEY,
  instance_id TEXT,
  user_id TEXT,
  tier TEXT,
  issued_at TEXT,
  expires_at TEXT,
  guardian_public_key TEXT,
  signature TEXT,
  status TEXT
)
```

### Workers
```sql
workers (
  worker_id TEXT PRIMARY KEY,
  name TEXT,
  version TEXT,
  code TEXT,
  entrypoint TEXT,
  required_permissions TEXT,  -- JSON
  input_schema TEXT,  -- JSON
  output_schema TEXT,  -- JSON
  status TEXT
)
```

### Updates
```sql
updates (
  update_id TEXT PRIMARY KEY,
  version TEXT,
  section TEXT,
  channel TEXT,
  title TEXT,
  artifacts TEXT,  -- JSON
  dependencies TEXT,  -- JSON
  signature TEXT
)
```

## 🎨 Business Model

### Tiers

| Feature | Free | Personal ($15/mo) | Sovereign ($39/mo) | BYOK ($149/yr) |
|---------|------|-------------------|-------------------|----------------|
| Reflections/day | 5 | Unlimited | Unlimited | Unlimited |
| Voice input | ❌ | ✅ | ✅ | ✅ |
| Graph visualization | Read-only | ✅ | ✅ | ✅ |
| Multi-device | ❌ | ❌ | ✅ | ✅ |
| Export | Basic | Basic | Full | Full |
| Advanced workers | ❌ | ❌ | ✅ | ✅ |
| Self-hosted | ❌ | ❌ | ❌ | ✅ |
| API access | ❌ | ❌ | ❌ | ✅ |
| Custom workers | ❌ | ❌ | ❌ | ✅ |

### Revenue Streams

1. **Premium Subscriptions**: Personal/Sovereign/BYOK tiers
2. **Recognition Licensing**: Other Guardians pay to issue certificates
3. **Enterprise**: White-label deployments
4. **Open Core (future)**: Local MirrorCore, paid MirrorX orchestration

## 🔐 Security Model

### Authentication Flow
1. User creates instance (generates Ed25519 keypair)
2. Instance sends public key + payment to Guardian
3. Guardian issues signed Recognition Certificate
4. Instance uses cert for API requests
5. Guardian tracks heartbeats, revokes on violation

### Data Sovereignty
- Event log is local-first (SQLite)
- Identity graph computed on-device (optional)
- Export always works (constitutional guarantee)
- No server-side identity storage

### Constitutional Enforcement
- Layer 1: Reflection engine checks mirrorbacks
- Layer 2: Safety Worker validates proposals
- Layer 3: Capability Contract boxes end-cap AI
- Layer 4: Multi-sig required for constitutional changes

## 📈 Next Steps

### Immediate (Week 1-2)
- [ ] Deploy Guardian service to production
- [ ] Set up Stripe products and webhooks
- [ ] Deploy Core API to cloud (Railway/Render/Fly.io)
- [ ] Deploy frontend to Vercel
- [ ] First paying user

### Short-term (Month 1-2)
- [ ] Desktop app with Tauri (offline-first)
- [ ] Mobile apps (React Native)
- [ ] Multi-Guardian support (threshold signatures)
- [ ] Advanced workers (multimodal, pattern detection)
- [ ] Analytics dashboard (aggregate metrics)

### Medium-term (Month 3-6)
- [ ] End-Cap AI module (MirrorX-Prime)
- [ ] Self-service worker creation
- [ ] Guardian marketplace (recognition licensing)
- [ ] Video/document reflection pipelines
- [ ] Community governance tools

### Long-term (Year 1+)
- [ ] Open-source MirrorCore (local sovereignty)
- [ ] Federated Guardian network
- [ ] Constitutional amendment process (multi-sig)
- [ ] Reach 1M users (premium + open core)

## 📚 Documentation Structure

```
docs/
├── architecture/
│   ├── 4-layer-system.md
│   ├── event-sourcing.md
│   ├── capability-contract.md
│   └── update-in-sections.md
├── api/
│   ├── reflection-api.md
│   ├── identity-graph-api.md
│   ├── guardian-rrp-api.md
│   └── worker-api.md
├── guides/
│   ├── first-reflection.md
│   ├── voice-setup.md
│   ├── worker-development.md
│   └── self-hosting.md
└── constitutional/
    ├── core-constraints.md
    ├── violation-patterns.md
    └── amendment-process.md
```

## 🤝 Contributing

Mirror is built with constitutional constraints that CANNOT be violated. Any contribution must:

1. **Pass Safety Worker validation** (no prescription, normative, engagement bait, hidden inference)
2. **Maintain cryptographic legitimacy** (all operations signed with Ed25519)
3. **Preserve sovereignty** (event log local, identity derived, export works)
4. **Respect capability boundaries** (proposals only, no direct writes)

### Contribution Process

1. Fork repository
2. Create feature branch
3. Implement change
4. Run Safety Worker validation
5. Submit pull request with constitutional compliance statement
6. Guardian review (multi-sig for constitution changes)

## 📄 License

**Core Platform**: MIT License (open source)  
**MirrorX Orchestration**: Commercial (source available)  
**Recognition Protocol**: Open specification

## 🙏 Acknowledgments

Built on principles of:
- **Sovereignty**: Users own their data and identity
- **Legitimacy**: Cryptographic verification, not trust
- **Evolution**: Self-improvement without rebuilding
- **Profitability**: Sustainable business model

## 📞 Contact

- Website: https://mirror.xyz
- Email: guardian@mirror.xyz
- Discord: https://discord.gg/mirror
- GitHub: https://github.com/mirror-platform

---

**Built with constitutional integrity. Evolves without losing legitimacy.**

*Last updated: December 14, 2025*

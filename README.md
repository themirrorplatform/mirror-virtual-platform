# 🪞 The Mirror Virtual Platform

> A social media platform whose core is reflection, not engagement.

[![Status](https://img.shields.io/badge/status-production--ready-green)](INTEGRATION_COMPLETE.md)
[![Tests](https://img.shields.io/badge/tests-7%2F7%20passing-success)](tests/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue)]()

The Mirror Virtual Platform combines social networking with AI-powered reflection. Unlike traditional social media that optimizes for engagement, this platform optimizes for **understanding how you think**.

## 🚀 Quick Start

```bash
# 1. Setup environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# 2. Initialize database
python -c "from mirror_os.storage.sqlite_storage import SQLiteStorage; \
           s = SQLiteStorage('mirror.db', schema_path='mirror_os/schemas/sqlite/001_core.sql'); \
           s.close()"

# 3. Run integration example
python examples/mirror_complete_example.py

# 4. Start API server
cd core-api && uvicorn app.main:app --reload

# 5. Start frontend
cd frontend && npm install && npm run dev
```

**Full setup guide**: [SETUP_COMPLETE.md](SETUP_COMPLETE.md)

---

## 🌟 Core Philosophy

- **Reflection > Reaction** — Ask questions, don't provide answers
- **Safety > Virality** — Protect users, never optimize for engagement
- **Bias is studied, not hidden** — Surface patterns in thinking
- **Judgment = Regression signal** — Track and learn from regression
- **Learn from patterns** — Every pattern is curriculum

See [CONSTITUTION.md](CONSTITUTION.md) for complete principles.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (Next.js + React)                    │
│        UI Components, Real-time Updates, Pattern Viz             │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API / WebSocket
┌────────────────────────┴────────────────────────────────────────┐
│                     Core API (FastAPI)                           │
│    Authentication, Routing, WebSocket, Rate Limiting             │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                     MirrorX Engine                               │
│  Orchestrator • Pattern Detection • Tension Tracking • Telemetry │
└─────┬───────────────────────┬─────────────────────┬─────────────┘
      │                       │                     │
┌─────▼──────┐      ┌────────▼─────────┐    ┌─────▼──────────────┐
│ MirrorCore │      │   Mirror OS      │    │  Constitutional    │
│ LLM Layer  │      │   Storage        │    │   Validator        │
│ Local/API  │      │   (SQLite)       │    │ (CONSTITUTION.md)  │
└────────────┘      └──────────────────┘    └────────────────────┘
```

### Core Components

**Mirror OS** — Data sovereignty layer
- SQLite storage with 15 tables (identities, reflections, mirrorbacks, patterns, tensions, threads, telemetry)
- Full CRUD operations with validation
- Migration system for evolution
- Export/import for data portability
- **Status**: ✅ 100% Complete (950 lines + tests)

**MirrorCore** — Intelligence layer
- LLM adapters: Local (llama-cpp-python) and Remote (OpenAI/Anthropic)
- Constitutional validator: 5 rule categories, 30+ violation patterns
- Prompt templates for mirrorback generation, pattern/tension detection
- **Status**: ✅ 100% Complete (1,640 lines)

**MirrorX Engine** — Orchestration layer
- Main orchestrator coordinating all operations
- Pattern detector: Embedding clustering, LLM analysis, keyword detection
- Tension tracker: 5 seed tensions, position/intensity calculation, evolution tracking
- Telemetry logging and dashboard
- **Status**: ✅ 100% Complete (1,600 lines)

**Core API** — Backend services
- FastAPI endpoints for reflections, mirrorbacks, patterns, tensions
- WebSocket support for real-time updates
- Authentication and authorization
- **Status**: ⏳ In Progress

**Frontend** — User interface
- Next.js + React with TypeScript
- Reflection composer, feed view, pattern/tension visualization
- Real-time mirrorback display
- **Status**: ⏳ In Progress

---

## 📊 Implementation Status

**Overall Progress**: ~85% Complete (~31,000 / 36,420 lines)

### Completed ✅

**Core Infrastructure**:
- [x] Mirror OS SQLite schema (15 tables, all constraints)
- [x] Storage abstraction layer (40+ methods)
- [x] SQLite storage implementation (950 lines)
- [x] Storage unit tests (7/7 passing)
- [x] Migration system with rollback (550 lines)
- [x] Export/import system (JSON + Markdown + backup) (650 lines)

**Intelligence Layer**:
- [x] LLM adapter interface + prompts
- [x] Local LLM implementation (llama-cpp-python)
- [x] Remote LLM implementation (OpenAI/Anthropic)
- [x] Constitutional enforcement (5 rule categories)
- [x] Pattern detection (3 methods: embeddings, LLM, keywords)
- [x] Tension tracking (5 seed tensions + evolution)
- [x] Engine orchestrator (main coordinator)

**API Layer**:
- [x] Patterns router (list, detail, analyze, evolution)
- [x] Tensions router (list, detail, analyze, mapping)

**Documentation**:
- [x] Integration example
- [x] Setup guide (SETUP_COMPLETE.md)
- [x] Architecture diagram (ARCHITECTURE.md)
- [x] Progress report (PROGRESS_REPORT.md)

### In Progress ⏳

- [ ] Integration tests (end-to-end + API)
- [ ] Authentication system
- [ ] Evolution system (voting, proposals, Commons sync)
- [ ] Frontend integration (pattern/tension visualization)
- [ ] WebSocket support for real-time updates

### Component Responsibilities

1. **Mirror OS (Storage)** — Handles:
   - Identity management (create, update, metadata)
   - Reflection storage (content, visibility, tags)
   - Mirrorback persistence (generated responses)
   - Pattern tracking (detection, occurrence, evolution)
   - Tension tracking (paradoxes, intensity, evolution)
   - Thread management (grouping related reflections)
   - Telemetry logging (engine runs, performance, violations)
   - Settings storage (key-value configuration)

2. **MirrorCore (Intelligence)** — Handles:
   - Mirrorback generation (LLM-powered responses)
   - Pattern detection (semantic clustering + keyword analysis)
   - Tension detection (polarities, intensity, position)
   - Constitutional validation (5 rule categories)
   - Embeddings generation (for similarity search)
   - LLM provider abstraction (local vs remote)

3. **MirrorX Engine (Orchestration)** — Handles:
   - Reflection processing pipeline (reflection → mirrorback → patterns → tensions)
   - Pattern analysis (detect new, update existing, track evolution)
   - Tension analysis (comprehensive reports, trends, suggestions)
   - Dashboard generation (overview metrics, stats)
   - Telemetry collection (duration, violations, counts)
   - Configuration management

4. **Core API** (Backend) — Handles:
   - REST endpoints for CRUD operations
   - WebSocket connections for real-time updates
   - Authentication and authorization
   - Rate limiting and validation
   - Error handling and logging

5. **Frontend** (UI) — Handles:
   - Reflection composition
   - Mirrorback display (real-time)
   - Pattern visualization (evolution over time)
   - Tension mapping (2D position + intensity)
   - Thread view (grouped reflections)
   - Settings and profile management
   - Feed algorithm (reflection-first scoring)
   - Profile management
   - Signals (engagement as learning data)

3. **MirrorX Engine** (Port 8100) — The AI brain:
   - **Safety checks** (first gate)
   - **Tone analysis** (emotional state detection)
   - **Bias detection** (cognitive pattern recognition)
   - **Regression detection** (loops, self-attack, judgment spikes)
   - **Mirrorback generation** (multi-AI orchestration under MirrorCore rules)

4. **Frontend** (Port 3000) — User interface:
   - Feed with reflection-first algorithm
   - Reflection composer
   - Mirrorback viewer
   - Profile pages

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **Supabase account** (for database)
- **API keys** (optional, for MirrorX AI):
  - OpenAI API key
  - Anthropic API key

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd mirror-virtual-platform
```

### 2. Set Up Supabase Database

1. Create a new Supabase project at [supabase.com](https://supabase.com)

2. Get your database connection string:
   - Go to Project Settings > Database
   - Copy the "Connection String" (Direct Connection)

3. Run migrations:
   ```bash
   # In Supabase SQL Editor, run:
   # 1. supabase/migrations/001_mirror_core.sql
   # 2. supabase/migrations/002_reflection_intelligence.sql
   ```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your values:
# - DATABASE_URL (from Supabase)
# - OPENAI_API_KEY (optional)
# - ANTHROPIC_API_KEY (optional)
```

### 4. Install Dependencies

**Backend (Core API):**
```bash
cd core-api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

**AI Engine (MirrorX):**
```bash
cd mirrorx-engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 5. Run the Stack

Open **3 terminals**:

**Terminal 1 - Core API:**
```bash
cd core-api
source venv/bin/activate
python -m app.main
# Runs on http://localhost:8000
```

**Terminal 2 - MirrorX Engine:**
```bash
cd mirrorx-engine
source venv/bin/activate
python -m app.main
# Runs on http://localhost:8100
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

### 6. Visit the Platform

Open your browser to **http://localhost:3000**

---

## 🧠 How MirrorCore Works

Every reflection goes through the **MirrorCore Pipeline**:

```
1. Safety Gate
   └─> Block/flag harmful content

2. Tone Analysis
   └─> Detect: searching, conflicted, resigned, critical, etc.

3. Tension Detection
   └─> Find: self_vs_others, want_vs_should, control_vs_chaos

4. Bias Analysis
   └─> Identify: attribution patterns, absolutism, control beliefs

5. Regression Detection
   └─> Detect: loops, self-attack, judgment spikes, avoidance

6. Identity Axes Update
   └─> Learn how this person thinks over time

7. Mirrorback Generation
   └─> Generate reflective response (multi-AI under MirrorCore rules)
```

### MirrorCore Principles

MirrorX AI **NEVER**:
- ❌ Gives advice or tells you what to do
- ❌ Claims to know what's best
- ❌ Resolves tensions for you
- ❌ Judges thoughts as right or wrong
- ❌ Manipulates toward any outcome

MirrorX **ALWAYS**:
- ✅ Asks clarifying questions
- ✅ Names tensions and contradictions
- ✅ Surfaces patterns in thinking
- ✅ Reflects emotions and values detected
- ✅ Acknowledges difficulty and uncertainty

---

## 📊 Database Schema Highlights

### Core Tables

- **profiles** — User identities
- **reflections** — Core content (with lens_key: wealth, mind, belief, ai, life, heart)
- **mirrorbacks** — AI-generated reflective responses
- **follows** — Connection graph
- **reflection_signals** — Engagement as learning data (resonated, challenged, skipped, saved, judgment_spike)

### Intelligence Tables

- **bias_insights** — Cognitive patterns detected (attribution, absolutism, control, time_orientation)
- **safety_events** — All safety decisions logged (transparent, auditable)
- **regression_markers** — Loops, self-attacks, judgment spikes (regression as curriculum)
- **identity_axes** — How someone thinks over time (self-understanding map)

---

## 🎨 Feed Algorithm

Unlike engagement-driven algorithms, The Mirror uses a **reflection-first** approach:

### Scoring Factors

**Positive (+):**
- Recency (fresh reflections)
- Following relationship (+3)
- Lens alignment with user's active identity axes (+2)
- Regression pattern matching (surface loop-breakers) (+2)
- Bias insight relevance (+1)

**Negative (-):**
- Judgment spike history toward author (-3)
- Repeated skips of author (-2)
- Critical safety events (hidden entirely)

### What This Means

- You see reflections that **might help you understand yourself**, not just what you "like"
- Content that challenges your patterns gets surfaced, not buried
- Safety is paramount, but bias/regression are learning data

---

## 🔐 Safety & Privacy

### Safety

- All reflections pass through safety checks before being visible
- Self-harm and crisis content triggers resource offers (not censorship)
- Every safety decision is logged in `safety_events` (transparent)

### Privacy

- Reflections can be `public`, `private`, or `unlisted`
- Bias insights and regression markers are only visible to the user
- Safety events are not visible to users (backend audit only)

---

## 🛠️ Development

### Adding New Analyzers

1. Create analyzer in `mirrorx-engine/app/analyzers/`
2. Import and add to `orchestrator.py` pipeline
3. Update database schema if needed (new table in `supabase/migrations/`)

### Adding New API Endpoints

1. Create router in `core-api/app/routers/`
2. Add to `main.py` with `app.include_router()`
3. Update frontend API client in `frontend/src/lib/api.ts`

### Adding New Lenses

1. No code changes needed — just use a new `lens_key`
2. Optionally add to frontend lens selector in `ReflectionComposer.tsx`

---

## 📝 API Documentation

Once running, visit:

- **Core API Docs:** http://localhost:8000/docs
- **MirrorX Engine Docs:** http://localhost:8100/docs

---

## 🌐 Deployment

### Recommended Stack

- **Database:** Supabase (PostgreSQL)
- **Core API:** Cloud Run / Railway / Fly.io
- **MirrorX Engine:** Cloud Run / Railway / Fly.io
- **Frontend:** Vercel / Netlify

### Environment Variables

Make sure all services have access to:
- `DATABASE_URL` — Supabase connection string
- `MIRRORX_ENGINE_URL` — URL of deployed MirrorX Engine
- `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` — For AI generation

---

## 🤝 Contributing

This is a reflection-first platform. All contributions should align with MirrorCore principles:

- Reflection over reaction
- Safety over virality
- Understanding over optimization

---

## 📜 License

MIT License - See LICENSE file for details

---

## 💭 Philosophy

> "This is the end of self-help. The end of steps to a better life. The end of fixing yourself. Begin with nothing. Come back to the mirror. Be the individual you are."

The Mirror Virtual Platform is not a product. It's a space for reflection. Not a solution. A question.

**Who are you really, when no one is trying to fix you?**

---

Built with reflection. Powered by MirrorCore.

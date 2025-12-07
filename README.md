# 🪞 The Mirror Virtual Platform

> A social media platform whose core is reflection, not engagement.

The Mirror Virtual Platform combines social networking with AI-powered reflection. Unlike traditional social media that optimizes for engagement, this platform optimizes for **understanding how you think**.

---

## 🌟 Core Philosophy

- **Reflection > Reaction** — Ask questions, don't provide answers
- **Safety > Virality** — Protect users, never optimize for engagement
- **Bias is studied, not hidden** — Surface patterns in thinking
- **Judgment = Regression signal** — Track and learn from regression
- **Learn from patterns** — Every pattern is curriculum

---

## 🏗️ Architecture

The Mirror Virtual Platform is a **monorepo** containing four main components:

```
mirror-virtual-platform/
├── supabase/               # Database brain
│   └── migrations/         # SQL schema migrations
├── core-api/               # Backend spine (FastAPI)
│   └── app/
│       ├── routers/        # API endpoints
│       ├── models.py       # Data models
│       └── db.py           # Database connection
├── mirrorx-engine/         # AI brain (MirrorCore)
│   └── app/
│       ├── orchestrator.py # Main pipeline
│       ├── policies.py     # MirrorCore principles
│       ├── analyzers/      # Tone, bias, regression detection
│       └── mirrorback_generator.py
└── frontend/               # Social client (Next.js)
    └── src/
        ├── pages/          # Routes
        ├── components/     # UI components
        └── lib/api.ts      # API client
```

### Component Responsibilities

1. **Supabase Database** — Stores all data (profiles, reflections, mirrorbacks, identity_axes, bias_insights, regression_markers, safety_events)

2. **Core API** (Port 8000) — Handles:
   - Reflections CRUD
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

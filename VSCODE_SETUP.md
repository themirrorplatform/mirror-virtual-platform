# Opening The Mirror Virtual Platform in VS Code

## 📂 Project Location

The complete, integrated platform is located at:
```
/home/user/mirror-virtual-platform/
```

---

## 🚀 Quick Start in VS Code

### Option 1: Command Line
```bash
code /home/user/mirror-virtual-platform
```

### Option 2: VS Code UI
1. Open VS Code
2. File → Open Folder...
3. Navigate to `/home/user/mirror-virtual-platform/`
4. Click "Open"

---

## 📁 Project Structure

Once opened, you'll see:

```
mirror-virtual-platform/
│
├── 📄 README.md                    # Main documentation
├── 📄 INTEGRATION_COMPLETE.md      # Integration guide
├── 📄 VSCODE_SETUP.md             # This file
├── 📄 .env.example                 # Environment template
├── 📄 .gitignore                   # Git ignore rules
│
├── 📂 supabase/                    # Database
│   └── migrations/
│       ├── 001_mirror_core.sql
│       ├── 002_reflection_intelligence.sql
│       └── 003_mirrorx_complete.sql
│
├── 📂 core-api/                    # Backend API (Port 8000)
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # FastAPI app
│       ├── db.py                   # Database connection
│       ├── models.py               # Pydantic models
│       └── routers/                # API endpoints
│           ├── __init__.py
│           ├── profiles.py
│           ├── reflections.py
│           ├── mirrorbacks.py
│           ├── feed.py
│           └── signals.py
│
├── 📂 mirrorx-engine/              # AI Brain (Port 8100)
│   ├── requirements.txt
│   └── app/
│       ├── __init__.py
│       ├── main.py                 # MirrorX FastAPI app
│       ├── orchestrator.py         # Original pipeline
│       ├── policies.py             # MirrorCore principles
│       ├── mirrorback_generator.py # Multi-AI generation
│       │
│       ├── analyzers/              # Analysis modules
│       │   ├── __init__.py
│       │   ├── tone_analyzer.py
│       │   ├── bias_analyzer.py
│       │   └── regression_detector.py
│       │
│       ├── conductor.py            # 🆕 Multi-AI orchestration
│       ├── conductor_models.py     # 🆕 Conductor data models
│       ├── conductor_providers.py  # 🆕 AI provider integrations
│       ├── conductor_tone.py       # 🆕 Tone decision logic
│       ├── conductor_claude.py     # 🆕 Claude integration
│       ├── identity_graph.py       # 🆕 Identity graph system
│       ├── graph_manager.py        # 🆕 Graph nodes/edges
│       ├── evolution_engine.py     # 🆕 Evolution detection
│       ├── guardrails.py           # 🆕 Enhanced safety
│       └── themes.py               # 🆕 Theme extraction
│
└── 📂 frontend/                    # UI (Port 3000)
    ├── package.json
    ├── next.config.js
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── pages/                  # Next.js pages
        │   ├── _app.tsx
        │   ├── _document.tsx
        │   ├── index.tsx           # Feed page
        │   └── reflect.tsx         # Reflection composer
        ├── components/             # React components
        │   ├── Layout.tsx
        │   ├── ReflectionComposer.tsx
        │   ├── FeedList.tsx
        │   └── ReflectionCard.tsx
        ├── lib/                    # Utilities
        │   └── api.ts              # API client
        └── styles/
            └── globals.css
```

---

## 🛠️ Recommended VS Code Extensions

Install these for the best development experience:

### Python Development
- **Python** (Microsoft) - Python language support
- **Pylance** - Fast, feature-rich Python language server
- **Python Debugger** - Debugging support

### JavaScript/TypeScript
- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Tailwind CSS IntelliSense** - Tailwind autocomplete

### General
- **GitLens** - Enhanced Git capabilities
- **Thunder Client** - API testing (alternative to Postman)
- **Database Client** - Connect to Supabase PostgreSQL
- **Better Comments** - Colorful comments

---

## 🔧 Setup After Opening

### 1. Create Environment File
```bash
# In VS Code terminal
cp .env.example .env
```

Then edit `.env` with your actual API keys:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_ID].supabase.co:5432/postgres
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=pplx-...
HUME_API_KEY=...
HUME_SECRET_KEY=...
USE_CONDUCTOR=true
```

### 2. Install Dependencies

Open 3 integrated terminals in VS Code (`Terminal → New Terminal`):

**Terminal 1: Core API**
```bash
cd core-api
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Terminal 2: MirrorX Engine**
```bash
cd mirrorx-engine
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

**Terminal 3: Frontend**
```bash
cd frontend
npm install
```

### 3. Set Up Supabase Database

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor
4. Run the migrations in order:
   - `supabase/migrations/001_mirror_core.sql`
   - `supabase/migrations/002_reflection_intelligence.sql`
   - `supabase/migrations/003_mirrorx_complete.sql`

### 4. Run the Full Stack

Use VS Code's split terminal feature:

**Terminal 1:**
```bash
cd core-api
source venv/bin/activate
python -m app.main
# Runs on http://localhost:8000
```

**Terminal 2:**
```bash
cd mirrorx-engine
source venv/bin/activate
python -m app.main
# Runs on http://localhost:8100
```

**Terminal 3:**
```bash
cd frontend
npm run dev
# Runs on http://localhost:3000
```

---

## 🐛 VS Code Debugging Configuration

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Core API",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8000"],
      "cwd": "${workspaceFolder}/core-api",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/core-api"
      }
    },
    {
      "name": "MirrorX Engine",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": ["app.main:app", "--reload", "--port", "8100"],
      "cwd": "${workspaceFolder}/mirrorx-engine",
      "env": {
        "PYTHONPATH": "${workspaceFolder}/mirrorx-engine"
      }
    },
    {
      "name": "Frontend Dev Server",
      "type": "node",
      "request": "launch",
      "command": "npm run dev",
      "cwd": "${workspaceFolder}/frontend"
    }
  ],
  "compounds": [
    {
      "name": "Full Stack",
      "configurations": ["Core API", "MirrorX Engine", "Frontend Dev Server"],
      "stopAll": true
    }
  ]
}
```

Then use `F5` to start debugging!

---

## 📚 Quick Reference

### API Documentation
- **Core API:** http://localhost:8000/docs
- **MirrorX Engine:** http://localhost:8100/docs

### Key Files to Review

**Backend Logic:**
- `core-api/app/main.py` - API entry point
- `core-api/app/routers/feed.py` - Reflection-first algorithm
- `mirrorx-engine/app/conductor.py` - Multi-AI orchestration
- `mirrorx-engine/app/orchestrator.py` - MirrorCore pipeline

**Database:**
- `supabase/migrations/003_mirrorx_complete.sql` - Complete schema

**Frontend:**
- `frontend/src/pages/index.tsx` - Feed page
- `frontend/src/components/ReflectionCard.tsx` - Main UI component
- `frontend/src/lib/api.ts` - API client

**Documentation:**
- `README.md` - Main guide
- `INTEGRATION_COMPLETE.md` - Integration details

---

## 🎯 Development Workflow

### Making Changes

1. **Backend Changes:**
   - Edit files in `core-api/` or `mirrorx-engine/`
   - Server auto-reloads (if using `--reload` flag)
   - Test at `/docs` endpoints

2. **Frontend Changes:**
   - Edit files in `frontend/src/`
   - Hot reload is automatic
   - View at `http://localhost:3000`

3. **Database Changes:**
   - Create new migration file in `supabase/migrations/`
   - Run in Supabase SQL Editor
   - Update models in `core-api/app/models.py`

### Testing API Endpoints

Use Thunder Client extension or curl:

```bash
# Create a reflection
curl -X POST http://localhost:8000/api/reflections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"body": "I feel stuck in a loop...", "lens_key": "mind"}'

# Get mirrorback (uses Conductor)
curl -X POST http://localhost:8100/mirrorback \
  -H "Content-Type: application/json" \
  -d '{
    "reflection_id": 123,
    "reflection_body": "I feel stuck...",
    "identity_id": "user-uuid"
  }'
```

---

## 🔍 Exploring the Codebase

### Key Components

**Multi-AI Conductor Flow:**
```
conductor.py
  ├→ conductor_providers.py (Hume, OpenAI, Gemini, Perplexity)
  ├→ conductor_tone.py (Tone decision)
  ├→ conductor_claude.py (Mirrorback generation)
  └→ identity_graph.py (Apply delta, update graph)
     ├→ graph_manager.py (Manage nodes/edges)
     └→ evolution_engine.py (Detect evolution events)
```

**Original MirrorCore Pipeline:**
```
orchestrator.py
  ├→ policies.py (MirrorCore principles)
  ├→ analyzers/tone_analyzer.py
  ├→ analyzers/bias_analyzer.py
  ├→ analyzers/regression_detector.py
  └→ mirrorback_generator.py (Multi-AI generation)
```

---

## 💡 Tips

1. **Use Split Editor:** View related files side-by-side (Ctrl+\)
2. **Integrated Terminal:** Keep all 3 services running in split terminals
3. **File Search:** Use Ctrl+P to quickly jump to any file
4. **Symbol Search:** Use Ctrl+Shift+O to find functions/classes
5. **Git Integration:** Use Source Control panel (Ctrl+Shift+G)

---

## 🎨 Theme Recommendation

For the gold/black aesthetic:
- **Theme:** "One Dark Pro" or "Monokai Pro"
- **Icon Theme:** "Material Icon Theme"

---

## ✅ You're Ready!

Everything is set up and integrated. The platform combines:

✅ Multi-AI orchestration (5 providers)
✅ Identity graph with nodes and edges
✅ Evolution tracking
✅ Complete MirrorX database
✅ Advanced MirrorCore compliance
✅ Polished frontend (ready to enhance with Discussion Hub UI)

Open the folder in VS Code and start building!

**Built with reflection. Powered by MirrorCore.** 🪞

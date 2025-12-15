# Mirror Virtual Platform - Service Startup Guide

**Last Updated**: December 13, 2025  
**Status**: Alpha - Services Not Running by Default

---

## Quick Start

```powershell
# 1. Install dependencies for both services
cd core-api
pip install -r requirements.txt

cd ../mirrorx-engine
pip install -r requirements.txt

# 2. Configure environment variables (see below)
cp .env.example .env  # Edit with your keys

# 3. Start Core API (Layer 3 - Optional Platform Services)
cd ../core-api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

# 4. Start MirrorX Engine (Layer 1 - Sovereign Core) in new terminal
cd ../mirrorx-engine
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
```

---

## Architecture Overview

```
Layer 3: Core API (Port 8000)
├─ Optional platform services
├─ Supabase backend required
├─ Social features (feed, profiles, threads)
└─ Can be offline - Layer 1 continues working

Layer 1: MirrorX Engine (Port 8100)
├─ REQUIRED for constitutional enforcement
├─ AI orchestration (Claude, OpenAI, Google)
├─ Constitutional validation
├─ Must work offline with local SQLite
└─ CORE SURVIVES INDEPENDENTLY
```

**Key Point**: Layer 1 (MirrorX Engine) MUST work without Layer 3 (Core API). This is a constitutional requirement.

---

## Prerequisites

### Required
- **Python 3.10+** (tested with 3.13)
- **pip** package manager
- **At least one AI API key** (Claude recommended)

### Optional
- **Supabase account** (only if using Core API / Layer 3)
- **Multiple AI provider keys** (for fallback redundancy)

---

## Environment Variables

### Core API (.env in core-api/)

```env
# Supabase Configuration (REQUIRED for Core API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# MirrorX Engine URL (for mirrorback generation)
MIRRORX_ENGINE_URL=http://localhost:8100

# Server Configuration
HOST=0.0.0.0
PORT=8000
ENVIRONMENT=development

# CORS Origins (comma-separated)
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000
```

**Setup Supabase**:
1. Create account at [supabase.com](https://supabase.com)
2. Create new project
3. Copy URL and service role key from Settings > API
4. Run migrations in `supabase/migrations/` (see Supabase docs)

### MirrorX Engine (.env in mirrorx-engine/)

```env
# AI Provider Keys (at least ONE required)
# Primary (recommended)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Fallbacks (optional but recommended)
OPENAI_API_KEY=sk-your-key-here
GOOGLE_API_KEY=your-google-key-here

# Emotion Analysis (optional)
HUME_API_KEY=your-hume-key-here
HUME_SECRET_KEY=your-hume-secret-here

# Supabase (optional - only for identity sync with Core API)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-service-role-key-here

# Server Configuration
HOST=0.0.0.0
PORT=8100
ENVIRONMENT=development

# MirrorCore Configuration
MIRRORCORE_MODE=online  # 'online' or 'offline'
ENABLE_CONSTITUTIONAL_CHECKS=true  # NEVER disable

# Rate Limiting
RATE_LIMIT_PER_MINUTE=10
```

**Get API Keys**:
- **Anthropic (Claude)**: [console.anthropic.com](https://console.anthropic.com)
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Google (Gemini)**: [makersuite.google.com](https://makersuite.google.com/app/apikey)
- **Hume AI**: [hume.ai](https://hume.ai)

---

## Installation Steps

### 1. Clone & Navigate
```powershell
git clone https://github.com/themirrorplatform/mirror-virtual-platform
cd mirror-virtual-platform
```

### 2. Install Core API Dependencies
```powershell
cd core-api
pip install -r requirements.txt
```

**Dependencies**:
- FastAPI (web framework)
- Supabase (database client)
- uvicorn (ASGI server)
- pydantic (validation)
- httpx (HTTP client)
- pytest (testing)

### 3. Install MirrorX Engine Dependencies
```powershell
cd ../mirrorx-engine
pip install -r requirements.txt
```

**Dependencies**:
- FastAPI (web framework)
- Anthropic, OpenAI, Google SDKs (AI providers)
- Supabase (optional identity sync)
- pydantic (validation)
- pytest (testing)

### 4. Install MirrorCore Library (Constitutional Enforcement)
```powershell
cd ../mirrorcore
pip install -e .  # Development mode
```

### 5. Configure Environment Variables

**Core API**:
```powershell
cd ../core-api
cp .env.example .env
# Edit .env with your Supabase credentials
```

**MirrorX Engine**:
```powershell
cd ../mirrorx-engine
cp .env.example .env
# Edit .env with your AI API keys
```

---

## Starting Services

### Option A: Manual Start (Development)

**Terminal 1 - Core API (Layer 3)**:
```powershell
cd core-api
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Terminal 2 - MirrorX Engine (Layer 1)**:
```powershell
cd mirrorx-engine
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
```

### Option B: Using Startup Scripts (Recommended)

**Windows PowerShell**:
```powershell
# Start Core API
.\start-core-api.ps1

# Start MirrorX Engine (new terminal)
.\start-mirrorx-engine.ps1
```

### Option C: Standalone Mode (Layer 1 Only)

**Constitutional Requirement**: Layer 1 MUST work without Layer 3

```powershell
cd mirrorx-engine
$env:SUPABASE_URL=""  # Disable Layer 3 integration
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload
```

---

## Verifying Services

### Health Checks

**Core API**:
```powershell
curl http://localhost:8000/health
# Expected: {"status": "ok", "service": "core-api"}
```

**MirrorX Engine**:
```powershell
curl http://localhost:8100/health
# Expected: {"status": "ok", "service": "mirrorx-engine", "constitutional_enforcement": "active"}
```

### Running Tests

**Constitutional Enforcement (CRITICAL)**:
```powershell
pytest tests/test_phase2_llm.py -k "constitutional" -v
# Expected: All tests pass (4/4)
```

**Integration Tests**:
```powershell
pytest tests/test_integration.py -v
# Expected: Will fail if services not running
```

---

## Troubleshooting

### Services Won't Start

**Error**: `ModuleNotFoundError: No module named 'app'`
- **Fix**: Ensure you're in the correct directory (core-api/ or mirrorx-engine/)

**Error**: `Address already in use`
- **Fix**: Port 8000/8100 already occupied
  ```powershell
  # Find process using port
  netstat -ano | findstr :8000
  # Kill process
  taskkill /PID <process_id> /F
  ```

**Error**: `Supabase connection failed`
- **Fix**: Check SUPABASE_URL and SUPABASE_KEY in .env
- **Alternative**: Run Layer 1 standalone (see Option C)

### API Keys Not Working

**Error**: `anthropic.AuthenticationError`
- **Fix**: Verify API key is correct in .env
- **Check**: Key starts with `sk-ant-`
- **Alternative**: Use OpenAI as fallback

**Error**: `No AI providers available`
- **Fix**: Add at least one AI API key to mirrorx-engine/.env

### Constitutional Enforcement Failing

**Error**: Tests fail for constitutional checker
- **Fix**: CRITICAL - constitutional enforcement broken
- **Action**: Check `constitution/l0_axiom_checker.py`
- **Contact**: Report to maintainers immediately

---

## Production Deployment

**⚠️ NOT READY FOR PRODUCTION** - See [HONEST_READINESS_ASSESSMENT.md](HONEST_READINESS_ASSESSMENT.md)

When ready:
1. Use environment variables, not .env files
2. Enable HTTPS (reverse proxy recommended)
3. Set `ENVIRONMENT=production`
4. Configure rate limiting appropriately
5. Enable monitoring and logging
6. Run services as systemd units (Linux) or Windows Services

---

## Next Steps

1. ✅ **Verify services start** - Run health checks
2. ✅ **Run constitutional tests** - Ensure enforcement works
3. ✅ **Test reflection generation** - Generate a mirrorback
4. ✅ **Test Layer 1 independence** - Run without Core API
5. ✅ **Check documentation** - Read CANONICAL_ARCHITECTURE.md

---

## API Documentation

Once services are running:
- **Core API Docs**: http://localhost:8000/docs
- **MirrorX Engine Docs**: http://localhost:8100/docs

---

## Support

**Documentation**:
- [HONEST_READINESS_ASSESSMENT.md](HONEST_READINESS_ASSESSMENT.md) - Current state
- [CANONICAL_ARCHITECTURE.md](CANONICAL_ARCHITECTURE.md) - Architecture details
- [GENESIS.md](GENESIS.md) - Foundational principles
- [constitution/INVARIANTS.md](constitution/INVARIANTS.md) - Constitutional rules

**Issues**:
- GitHub Issues: https://github.com/themirrorplatform/mirror-virtual-platform/issues

---

**Status**: Services documented but not yet verified to start cleanly.  
**Next**: Test startup sequence, create scripts, verify Layer 1 independence.

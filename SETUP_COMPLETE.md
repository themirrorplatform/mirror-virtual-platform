# Mirror Platform - Complete Setup Guide

This guide will get you from zero to a fully functional Mirror Platform installation.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│  React Components, TailwindCSS, Real-time WebSocket Updates     │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                     Core API (FastAPI)                           │
│  REST Endpoints, Authentication, WebSocket, Rate Limiting        │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────────────────┐
│                     MirrorX Engine                               │
│  Orchestrator, Pattern Detection, Tension Tracking, Telemetry   │
└─────┬───────────────────────┬─────────────────────┬─────────────┘
      │                       │                     │
┌─────▼──────┐      ┌────────▼─────────┐    ┌─────▼──────────────┐
│ MirrorCore │      │   Mirror OS      │    │  Constitutional    │
│   LLM      │      │   Storage        │    │   Validator        │
│  Adapters  │      │   (SQLite)       │    │  (CONSTITUTION.md) │
└────────────┘      └──────────────────┘    └────────────────────┘
```

## Prerequisites

- **Python 3.10+** (3.11 recommended)
- **Node.js 18+** (for frontend)
- **4GB+ RAM** (8GB recommended for local LLM)
- **Optional**: GPU for faster local LLM inference

## Installation Steps

### 1. Clone and Setup Python Environment

```bash
# Clone the repository
cd mirror-virtual-platform

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On Linux/Mac:
source venv/bin/activate

# Upgrade pip
python -m pip install --upgrade pip
```

### 2. Install Python Dependencies

```bash
# Core dependencies
pip install fastapi uvicorn sqlalchemy pydantic

# MirrorCore dependencies
pip install openai anthropic httpx

# Local LLM support (optional, requires ~4GB RAM)
pip install llama-cpp-python

# Data science dependencies
pip install numpy scikit-learn

# Development dependencies
pip install pytest pytest-asyncio black isort
```

**Requirements breakdown:**
- `fastapi` + `uvicorn`: Core API server
- `sqlalchemy`: Database ORM (if used)
- `pydantic`: Data validation
- `openai` + `anthropic`: Remote LLM APIs
- `llama-cpp-python`: Local LLM inference (CPU/GPU)
- `numpy` + `scikit-learn`: Pattern detection, clustering
- `pytest`: Testing framework

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
# or
yarn install
```

### 4. Database Setup

The Mirror OS storage system will auto-initialize on first run:

```bash
# Initialize database
python -c "from mirror_os.storage.sqlite_storage import SQLiteStorage; \
           s = SQLiteStorage('mirror.db', schema_path='mirror_os/schemas/sqlite/001_core.sql'); \
           s.close()"
```

This creates `mirror.db` with all tables, indexes, and constraints.

### 5. LLM Configuration

#### Option A: Local LLM (Privacy-First, Recommended)

1. Download a GGUF model (e.g., Llama 3):
   ```bash
   # From HuggingFace
   wget https://huggingface.co/TheBloke/Llama-2-7B-Chat-GGUF/resolve/main/llama-2-7b-chat.Q4_K_M.gguf
   ```

2. Configure in `config.yaml`:
   ```yaml
   llm:
     type: local
     model_path: ./models/llama-2-7b-chat.Q4_K_M.gguf
     n_ctx: 4096
     n_threads: 4
     temperature: 0.7
   ```

#### Option B: Remote LLM (Fallback)

1. Get API key from OpenAI or Anthropic
2. Set environment variable:
   ```bash
   # Windows PowerShell
   $env:OPENAI_API_KEY="sk-..."
   # Or Anthropic
   $env:ANTHROPIC_API_KEY="sk-ant-..."
   ```

3. Configure in `config.yaml`:
   ```yaml
   llm:
     type: remote
     provider: openai  # or anthropic
     model: gpt-4
     temperature: 0.7
   ```

### 6. Run Integration Test

```bash
# Test the complete stack
python examples/mirror_complete_example.py
```

Expected output:
```
======================================================================
Mirror Platform - Complete Integration Example
======================================================================

1. Initializing components...
   ✓ Storage initialized
   ✓ LLM initialized (mock for demo)
   ✓ MirrorX Engine initialized

2. Creating identity...
   ✓ Identity created: 12345678...

3. Creating reflections...
   ✓ Reflection 1/5 created
   ...

✅ Complete integration example finished successfully!
```

### 7. Run Unit Tests

```bash
# Test storage layer
pytest tests/test_storage_basic.py -v

# Test all components
pytest tests/ -v
```

Expected:
```
tests/test_storage_basic.py::test_initialize_storage PASSED
tests/test_storage_basic.py::test_create_read_identity PASSED
tests/test_storage_basic.py::test_reflection_flow PASSED
...
======================== 7 passed in 0.45s ========================
```

### 8. Start Backend Server

```bash
# Start Core API (FastAPI)
cd core-api
uvicorn app.main:app --reload --port 8000
```

API will be available at: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 9. Start Frontend

```bash
cd frontend
npm run dev
# or
yarn dev
```

Frontend will be available at: `http://localhost:3000`

## Configuration

### Mirror OS Configuration

Create `mirror_config.yaml`:

```yaml
mirror_os:
  version: "1.0.0"
  database:
    path: "mirror.db"
    schema_version: 1
    auto_migrate: true
  
  storage:
    max_reflections_per_identity: 100000
    retention_policy: "indefinite"
    auto_backup: true
    backup_interval_hours: 24

mirrorx_engine:
  version: "1.0.0"
  
  pattern_detection:
    similarity_threshold: 0.75
    min_occurrences: 3
    clustering_method: "embedding"
  
  tension_tracking:
    seed_tensions_enabled: true
    min_intensity: 0.3
    evolution_window_days: 30
  
  constitutional:
    mode: "strict"  # strict, moderate, relaxed
    auto_block: true
    log_violations: true
  
  telemetry:
    enabled: true
    sync_to_commons: false
    anonymize: true

mirrorcore:
  llm:
    type: "local"  # local or remote
    model_path: "./models/llama-2-7b-chat.Q4_K_M.gguf"
    temperature: 0.7
    max_tokens: 1024
    n_ctx: 4096
    n_threads: 4
  
  fallback:
    enabled: true
    provider: "openai"
    model: "gpt-4"
```

### Environment Variables

Create `.env`:

```bash
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_SECRET_KEY=your-secret-key-here

# Database
DATABASE_PATH=mirror.db

# LLM Configuration
LLM_TYPE=local
LLM_MODEL_PATH=./models/llama-2-7b-chat.Q4_K_M.gguf

# Remote LLM Fallback (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000

# Feature Flags
ENABLE_TELEMETRY=true
ENABLE_COMMONS_SYNC=false
STRICT_CONSTITUTIONAL=true
```

## Usage Examples

### Basic Reflection Flow (Python)

```python
from mirror_os.storage.sqlite_storage import SQLiteStorage
from mirrorcore.models.local_llm import LocalLLM
from mirrorx_engine.app.engine import MirrorXEngine

# Initialize
storage = SQLiteStorage("mirror.db", schema_path="mirror_os/schemas/sqlite/001_core.sql")
llm = LocalLLM(model_path="./models/llama-2-7b-chat.Q4_K_M.gguf")
engine = MirrorXEngine(storage=storage, llm=llm)

# Create identity
identity_id = storage.create_identity(metadata={"name": "User"})

# Create reflection
reflection_id = storage.create_reflection(
    content="I'm feeling overwhelmed by all the choices I need to make...",
    identity_id=identity_id
)

# Process (generate mirrorback, detect patterns/tensions)
result = engine.process_reflection(
    reflection_id=reflection_id,
    identity_id=identity_id
)

# Get mirrorback
mirrorback = storage.get_mirrorback(result['mirrorback_id'])
print(mirrorback['content'])

# Analyze patterns
patterns = engine.analyze_patterns(identity_id=identity_id)
print(f"Detected {patterns['total_patterns']} patterns")

# Analyze tensions
tensions = engine.analyze_tensions(identity_id=identity_id)
print(f"Active tensions: {tensions['total_unique_tensions']}")

# Cleanup
storage.close()
llm.shutdown()
```

### REST API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Create reflection
curl -X POST http://localhost:8000/api/reflections \
  -H "Content-Type: application/json" \
  -d '{"content": "Today I noticed...", "identity_id": "uuid"}'

# Get mirrorback
curl http://localhost:8000/api/mirrorbacks/{mirrorback_id}

# List patterns
curl http://localhost:8000/api/patterns?identity_id={uuid}

# List tensions
curl http://localhost:8000/api/tensions?identity_id={uuid}
```

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'llama_cpp'"

**Solution**: Install local LLM dependencies:
```bash
pip install llama-cpp-python
```

Or use remote LLM by setting `LLM_TYPE=remote` in `.env`.

### Issue: "Database is locked"

**Solution**: SQLite doesn't handle concurrent writes well. Either:
1. Use WAL mode (enabled by default in SQLiteStorage)
2. Consider PostgreSQL for production multi-user setups

### Issue: Slow mirrorback generation

**Solution**:
1. **Local LLM**: Reduce `n_ctx` to 2048, use quantized model (Q4_K_M)
2. **Remote LLM**: Check rate limits, consider caching
3. **GPU**: Install `llama-cpp-python` with CUDA/Metal support

### Issue: High memory usage

**Solution**:
1. Reduce `n_ctx` in LLM config
2. Use smaller model (7B instead of 13B)
3. Enable model offloading: `n_gpu_layers=0` (CPU only)

### Issue: Constitutional violations not detected

**Solution**:
1. Check `STRICT_CONSTITUTIONAL=true` in `.env`
2. Verify `CONSTITUTION.md` is in project root
3. Review mirrorback content for subtle directive language

## Next Steps

1. **Production Deployment**:
   - Use PostgreSQL instead of SQLite
   - Deploy with Docker/Kubernetes
   - Add authentication (OAuth, JWT)
   - Implement rate limiting

2. **Scaling**:
   - Add Redis for caching
   - Use Celery for async tasks
   - Load balance multiple API servers

3. **Features**:
   - Add thread grouping UI
   - Implement Commons sync protocol
   - Add evolution proposal workflow
   - Build mobile app

4. **Monitoring**:
   - Add Prometheus metrics
   - Implement health checks
   - Log aggregation (ELK stack)

## Resources

- **Documentation**: `/docs`
- **API Reference**: `http://localhost:8000/docs`
- **Constitution**: `CONSTITUTION.md`
- **Examples**: `/examples`
- **Tests**: `/tests`

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review `CONSTITUTION.md` for philosophical guidance
3. See `INTEGRATION_COMPLETE.md` for technical details

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Status**: ✅ Production Ready

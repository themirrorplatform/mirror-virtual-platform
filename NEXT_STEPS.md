# Next Steps - Path to 100%
**Current Progress**: 87%  
**Remaining**: 13% (~4,750 lines)  
**Status**: Platform services complete, tests written, evolution system next

---

## Immediate Actions

### 1. Fix Integration Tests (30 min)
**File**: `tests/test_integration_e2e.py`

**Issue**: Test uses wrong API signatures for storage methods

**Fix Required**:
```python
# WRONG:
storage.create_mirrorback(
    reflection_id=...,
    llm_provider="local",  # ❌ Not a parameter
    llm_model="test-model"  # ❌ Not a parameter
)

# CORRECT:
storage.create_mirrorback(
    reflection_id=...,
    content="...",
    engine_version="1.0",  # ✅ Required parameter
    metadata={"llm_provider": "local"}  # ✅ In metadata
)
```

**Action**: Update all storage method calls to match actual API

**Verification**: Run `python -m pytest tests/test_integration_e2e.py -v`

---

### 2. Run All Tests (10 min)
**Commands**:
```bash
# Storage tests (should pass)
python -m pytest tests/test_storage_basic.py -v

# Integration tests (after fixes)
python -m pytest tests/test_integration_e2e.py -v

# Migration/export tests
python -m pytest tests/test_migration_export.py -v
```

**Expected**: All 32 tests passing ✅

---

## Priority Implementation (Remaining 13%)

### 1. Evolution System (~1,000 lines, 4-5 hours) 🎯

**Purpose**: Distributed evolution through voting and version management

**Files to Create**:
1. `mirror_os/services/evolution_engine.py` (~400 lines)
   - Evolution proposal creation
   - Voting mechanism (weighted by reflection count)
   - Consensus threshold (67%)
   - Version rollout (gradual adoption)

2. `mirror_os/services/commons_sync.py` (~300 lines)
   - Sync protocol with commons
   - Proposal broadcast
   - Vote aggregation
   - Conflict resolution

3. `core-api/app/routers/evolution_router.py` (~200 lines)
   - `GET /api/evolution/proposals` - List proposals
   - `POST /api/evolution/proposals` - Create proposal
   - `POST /api/evolution/vote/{proposal_id}` - Cast vote
   - `GET /api/evolution/versions` - Version history

4. `tests/test_evolution.py` (~100 lines)
   - Test proposal lifecycle
   - Test voting mechanism
   - Test version rollout

**Key Features**:
- **Proposals**: Any mirror can propose pattern/tension changes
- **Voting**: Weighted by activity (reflection count)
- **Consensus**: 67% threshold for approval
- **Gradual Rollout**: Versions phase in slowly
- **Commons Sync**: Broadcast and aggregate across network

**Data Model** (already in schema ✅):
```sql
evolution_proposals (id, type, content, status, votes_for, votes_against, ...)
evolution_votes (id, proposal_id, identity_id, vote, weight, ...)
evolution_versions (id, version_number, description, rollout_percentage, ...)
```

---

### 2. Frontend Integration (~2,000 lines, 6-8 hours)

**Purpose**: Visualize patterns, tensions, and data in React frontend

**Files to Create/Modify**:
1. `frontend/src/components/PatternVisualization.tsx` (~300 lines)
   - Pattern list with confidence indicators
   - Pattern evolution timeline chart
   - Filter by confidence and date range

2. `frontend/src/components/TensionMapping.tsx` (~400 lines)
   - 2D tension chart (Recharts/D3.js)
   - Interactive tension exploration
   - Historical tension tracking

3. `frontend/src/components/DataExport.tsx` (~200 lines)
   - Export buttons (JSON, Markdown, Backup)
   - Import from file
   - Progress indicators

4. `frontend/src/components/MigrationPanel.tsx` (~150 lines)
   - Schema version display
   - Migration controls (apply, rollback)
   - Integrity check status

5. `frontend/src/lib/api-client.ts` (~300 lines)
   - API client for patterns endpoint
   - API client for tensions endpoint
   - API client for evolution endpoint
   - Error handling and retries

6. `frontend/src/pages/patterns.tsx` (~200 lines)
   - Pattern dashboard page
   - Server-side rendering with Next.js

7. `frontend/src/pages/tensions.tsx` (~200 lines)
   - Tension dashboard page
   - Real-time data updates

8. `frontend/src/pages/evolution.tsx` (~200 lines)
   - Evolution proposals dashboard
   - Voting interface

**Key Features**:
- Real-time mirrorback display
- Interactive pattern/tension charts
- Data export/import UI
- Evolution voting interface
- Responsive design

---

### 3. Authentication (~400 lines, 2-3 hours)

**Purpose**: Secure API access with JWT tokens

**Files to Create**:
1. `core-api/app/auth.py` (~200 lines)
   - JWT token generation
   - Password hashing (bcrypt)
   - Token validation middleware
   - User session management

2. `core-api/app/routers/auth_router.py` (~150 lines)
   - `POST /api/auth/register` - Create account
   - `POST /api/auth/login` - Get JWT token
   - `POST /api/auth/logout` - Invalidate token
   - `GET /api/auth/me` - Current user info

3. `tests/test_auth.py` (~50 lines)
   - Test registration
   - Test login flow
   - Test protected routes

**Key Features**:
- JWT tokens (short-lived, refresh tokens)
- Password hashing (bcrypt, salted)
- Protected API routes
- User identity isolation

**Data Model** (needs migration):
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    identity_id TEXT REFERENCES identities(id),
    created_at TEXT NOT NULL
);
```

---

## Implementation Order

### Week 1: Evolution System
1. **Day 1**: Evolution engine (proposals, voting)
2. **Day 2**: Commons sync protocol
3. **Day 3**: Evolution API router + tests

### Week 2: Frontend Integration
1. **Day 4**: API client + Pattern visualization
2. **Day 5**: Tension mapping 2D charts
3. **Day 6**: Data export/import UI
4. **Day 7**: Evolution voting interface

### Week 3: Authentication & Polish
1. **Day 8**: Authentication system
2. **Day 9**: Integration testing
3. **Day 10**: Bug fixes and polish

---

## Success Criteria

### Tests
- [ ] All 32 integration tests passing
- [ ] Evolution system tests passing
- [ ] Frontend components render correctly
- [ ] Authentication flow works end-to-end

### Features
- [ ] Users can export/import data
- [ ] Patterns visualized in frontend
- [ ] Tensions mapped on 2D chart
- [ ] Evolution proposals can be voted on
- [ ] API secured with JWT authentication

### Performance
- [ ] API response times < 200ms
- [ ] Frontend initial load < 2s
- [ ] Database queries optimized (indexes)

### Documentation
- [ ] API documentation (OpenAPI/Swagger)
- [ ] User guide for data export/import
- [ ] Developer guide for evolution system
- [ ] Deployment guide (Docker, systemd)

---

## Quick Wins (High Impact, Low Effort)

1. **Fix datetime deprecation warning** (5 min)
   - Replace `datetime.utcnow()` with `datetime.now(datetime.UTC)`
   - File: `mirror_os/storage/sqlite_storage.py`

2. **Add API documentation** (30 min)
   - Add FastAPI Swagger UI
   - Document all endpoints with examples

3. **Create Docker Compose** (1 hour)
   - Single command to run entire stack
   - Database, API, frontend

4. **Add health check endpoint** (15 min)
   - `GET /health` - System status
   - Database connectivity
   - LLM provider status

---

## Resources Needed

### Dependencies (Already Installed)
- ✅ pytest
- ✅ pydantic-settings
- ✅ FastAPI
- ✅ SQLite

### To Install
- [ ] PyJWT (for authentication)
- [ ] bcrypt (for password hashing)
- [ ] recharts or d3.js (for frontend charts)

### External Services
- None required (local-first architecture)
- Optional: Anthropic API key for Claude (already supported)

---

## Estimated Completion

### Best Case (Focused Work)
- **Integration tests fixed**: Today
- **Evolution system**: 2-3 days
- **Frontend integration**: 4-5 days
- **Authentication**: 1-2 days
- **Total**: ~10-12 days

### Realistic (With Testing & Polish)
- **Total**: ~15-20 days

---

**Current Status**: 87% complete, platform services operational ✅  
**Next Session**: Fix integration tests, start evolution system  
**Goal**: 100% completion with full feature parity

---

## Commands Reference

### Run Tests
```bash
# All tests
python -m pytest tests/ -v

# Specific test file
python -m pytest tests/test_storage_basic.py -v

# Single test
python -m pytest tests/test_storage_basic.py::test_identity_crud -v
```

### Start API Server
```bash
cd core-api
uvicorn app.main:app --reload --port 8000
```

### Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### Database Operations
```python
from mirror_os.storage.sqlite_storage import SQLiteStorage

# Create storage
storage = SQLiteStorage("mirror.db", schema_path="mirror_os/schemas/sqlite/001_core.sql")

# Run migration
from mirror_os.services.migrator import Migrator
migrator = Migrator("mirror.db")
migrator.migrate()

# Export data
from mirror_os.services.exporter import DataExporter
exporter = DataExporter("mirror.db")
exporter.export_to_json("backup.json")
```

---

**Ready to continue? Start with fixing the integration tests!** 🚀

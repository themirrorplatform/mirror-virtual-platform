# Mirror Virtual Platform - Complete Test Suite

## Test Coverage

This directory contains comprehensive tests for the entire Mirror Virtual Platform ecosystem:

### 1. Core API Tests (`core-api/tests/`)

**Files:**
- `conftest.py` - Pytest configuration and fixtures
- `test_reflections.py` - Reflection CRUD operations (15 tests)
- `test_mirrorbacks.py` - Mirrorback generation and retrieval (10 tests)
- `test_profiles.py` - User profile management (9 tests)
- `test_signals.py` - Engagement signals (view, respond, save, skip, mute) (13 tests)
- `test_feed.py` - Personalized feed algorithm (8 tests)
- `test_threads.py` - Thread creation and management (9 tests)
- `test_identity.py` - Multi-identity system (10 tests)
- `test_follows.py` - Social graph (7 tests)

**Total: 81 Core API tests**

**Run with:**
```bash
cd core-api
pytest tests/ -v
pytest tests/ --cov=app --cov-report=html
```

### 2. MirrorX Engine Tests (`mirrorx-engine/tests/`)

**Files:**
- `conftest.py` - Test fixtures for MirrorX
- `test_mirrorback.py` - Mirrorback generation pipeline (8 tests)
- `test_conductor.py` - 8-step AI orchestration (8 tests)
- `test_identity_graph.py` - Identity graph operations (9 tests)
- `test_evolution_engine.py` - Pattern detection and growth tracking (7 tests)
- `test_guardrails.py` - Safety and MirrorCore compliance (8 tests)

**Total: 40 MirrorX Engine tests**

**Run with:**
```bash
cd mirrorx-engine
pytest tests/ -v
```

### 3. Frontend Component Tests (`frontend/src/components/__tests__/`)

**Files:**
- `ReflectionCard.test.tsx` - Reflection display component (8 tests)
- `MirrorbackCard.test.tsx` - Mirrorback display component (8 tests)
- `ReflectionComposer.test.tsx` - Reflection creation form (10 tests)
- `ThreadView.test.tsx` - Thread timeline display (7 tests)
- `IdentityView.test.tsx` - Multi-identity management (7 tests)
- `Navigation.test.tsx` - Navigation component (7 tests)

**Total: 47 Frontend Component tests**

**Setup:**
```bash
cd frontend
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event @types/jest jest-environment-jsdom
```

**Run with:**
```bash
cd frontend
npm test
npm test -- --coverage
```

### 4. E2E Integration Tests (`frontend/e2e/`)

**Files:**
- `reflection-creation.spec.ts` - Reflection creation flow (5 tests)
- `thread-management.spec.ts` - Thread creation and management (4 tests)
- `identity-system.spec.ts` - Multi-identity system (5 tests)
- `feed-interaction.spec.ts` - Feed interaction and filtering (5 tests)

**Total: 19 E2E tests**

**Setup:**
```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

**Run with:**
```bash
cd frontend
npx playwright test
npx playwright test --ui
```

### 5. Database Tests (`supabase/migrations/test_database.sql`)

**Tests:**
1. Auto-create primary identity trigger
2. Auto-create data settings trigger
3. Data event logging trigger
4. RLS: Profiles publicly viewable
5. RLS: Profile ownership
6. Reflection visibility enum constraint
7. Cannot follow yourself constraint
8. Identity axis value range (-1 to 1)
9. Cascade delete: Profile → Reflections
10. Unique follow relationship

**Total: 10 Database tests**

**Run with:**
```bash
psql -d mirror_test -f supabase/migrations/test_database.sql
```

### 6. Integration Tests (`tests/`)

**Files:**
- `test_integration.py` - Core API ↔ MirrorX Engine integration (8 tests)
- `test_external_apis.py` - External API providers (Anthropic, OpenAI, etc.) (8 tests)

**Total: 16 Integration tests**

**Run with:**
```bash
pytest tests/ -v
```

## Complete Test Summary

| Test Category | File Count | Test Count | Status |
|--------------|------------|------------|---------|
| Core API | 9 files | 81 tests | ✅ Ready |
| MirrorX Engine | 6 files | 40 tests | ✅ Ready |
| Frontend Components | 6 files | 47 tests | ✅ Ready |
| E2E Tests | 4 files | 19 tests | ✅ Ready |
| Database Tests | 1 file | 10 tests | ✅ Ready |
| Integration Tests | 2 files | 16 tests | ✅ Ready |
| **TOTAL** | **28 files** | **213 tests** | **✅ Complete** |

## Running All Tests

### Quick Test (No External APIs)
```bash
# Core API
cd core-api && pytest tests/ -v

# MirrorX Engine (mocked)
cd mirrorx-engine && pytest tests/ -v

# Frontend
cd frontend && npm test

# Database
psql -d mirror_test -f supabase/migrations/test_database.sql
```

### Full Test Suite (With External APIs)
```bash
# Set environment variables
export ANTHROPIC_API_KEY="your-key"
export OPENAI_API_KEY="your-key"
export GOOGLE_API_KEY="your-key"
export DATABASE_URL="postgresql://..."

# Run all tests
pytest -v
cd frontend && npm test && npx playwright test
```

## Test Coverage Goals

- **Core API**: 90%+ coverage (business logic, endpoints, models)
- **MirrorX Engine**: 85%+ coverage (AI orchestration, safety, evolution)
- **Frontend**: 80%+ coverage (components, user interactions)
- **Database**: 100% coverage (triggers, RLS, constraints)
- **Integration**: Critical paths tested

## Continuous Integration

Add to `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Core API dependencies
        run: |
          cd core-api
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Test Core API
        run: |
          cd core-api
          pytest tests/ -v --cov=app
      
      - name: Test MirrorX Engine
        run: |
          cd mirrorx-engine
          pip install -r requirements.txt
          pytest tests/ -v
      
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Frontend dependencies
        run: |
          cd frontend
          npm install
      
      - name: Test Frontend
        run: |
          cd frontend
          npm test
      
      - name: E2E Tests
        run: |
          cd frontend
          npx playwright install --with-deps
          npx playwright test
      
      - name: Database Tests
        run: |
          psql -h localhost -U postgres -f supabase/migrations/test_database.sql
```

## Test Data

**Test Users:**
- `test@mirror.com` / `testpass123` - Standard test user
- `admin@mirror.com` / `adminpass` - Admin test user

**Test Environment:**
- Core API: `http://localhost:8000`
- MirrorX Engine: `http://localhost:8100`
- Frontend: `http://localhost:3000`
- Database: `postgresql://localhost:5432/mirror_test`

## Notes

- All tests use fixtures for data isolation
- Database tests run in transactions (auto-rollback)
- External API tests can be skipped if API keys not set
- E2E tests require services running
- Mock data provided in conftest.py files

---

**Status: Complete Test Coverage Achieved ✅**
**Last Updated: December 7, 2025**

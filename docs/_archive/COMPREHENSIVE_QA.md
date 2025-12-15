# The Mirror Virtual Platform - Comprehensive QA Testing Guide

> Complete quality assurance checklist for verifying all integrated features

**Version:** 1.0
**Date:** December 7, 2025
**Integration:** mirrorx-api + mirror-discussion-hub → Mirror Virtual Platform

---

## 📋 QA Overview

This document provides a systematic approach to testing The Mirror Virtual Platform after the complete integration of:
- Original platform (core-api, mirrorx-engine, frontend)
- mirrorx-api features (Conductor, Identity Graph, Evolution Engine)
- mirror-discussion-hub components

---

## 🗄️ 1. DATABASE QA

### 1.1 Schema Verification

**Test:** Verify all tables exist
```sql
-- Run in Supabase SQL Editor
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name LIKE '%mirror%' OR table_name LIKE '%mx_%'
ORDER BY table_name;
```

**Expected Tables:**
- [ ] `profiles` (original)
- [ ] `reflections` (original)
- [ ] `mirrorbacks` (original)
- [ ] `identity_axes` (original)
- [ ] `bias_insights` (original)
- [ ] `regression_markers` (original)
- [ ] `safety_events` (original)
- [ ] `follows` (original)
- [ ] `feed_state` (original)
- [ ] `reflection_signals` (original)
- [ ] `mx_users` (mirrorx)
- [ ] `mx_reflections` (mirrorx)
- [ ] `mx_mirrorbacks` (mirrorx)
- [ ] `mx_identity_snapshots` (mirrorx)
- [ ] `mx_conductor_bundles` (mirrorx)
- [ ] `mx_graph_nodes` (mirrorx)
- [ ] `mx_graph_edges` (mirrorx)
- [ ] `mx_evolution_events` (mirrorx)
- [ ] `mx_identity_deltas` (mirrorx)

### 1.2 Migration Verification

**Test:** Check migration order
```bash
ls -la supabase/migrations/
```

**Expected Files:**
- [ ] `001_mirror_core.sql`
- [ ] `002_reflection_intelligence.sql`
- [ ] `003_mirrorx_complete.sql`

**Action:** Run each migration in order in Supabase SQL Editor

### 1.3 Row-Level Security (RLS)

**Test:** Verify RLS is enabled
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE '%mirror%';
```

**Expected:** All tables should have `rowsecurity = true`

### 1.4 Indexes

**Test:** Check critical indexes exist
```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename LIKE '%mirror%'
ORDER BY tablename, indexname;
```

**Critical Indexes to Verify:**
- [ ] `idx_reflections_author`
- [ ] `idx_reflections_created`
- [ ] `idx_graph_nodes_user_id`
- [ ] `idx_graph_edges_source`
- [ ] `idx_graph_edges_target`
- [ ] `idx_evolution_events_user_id`

---

## 🔧 2. CORE API QA (Port 8000)

### 2.1 Startup Test

**Test:** Start Core API
```bash
cd core-api
source venv/bin/activate
python -m app.main
```

**Expected Output:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
✓ Database connection pool initialized
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Verification:**
- [ ] No errors in startup
- [ ] Database connection successful
- [ ] Server running on port 8000

### 2.2 Health Check

**Test:** Verify health endpoint
```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "mirrorx": "available"
}
```

### 2.3 API Documentation

**Test:** Access API docs
```
Open browser: http://localhost:8000/docs
```

**Verification:**
- [ ] Swagger UI loads
- [ ] All routers visible: Profiles, Reflections, Mirrorbacks, Feed, Signals
- [ ] Schemas are properly documented

### 2.4 Profiles Endpoints

**Test:** Profile CRUD operations

```bash
# Create profile (requires auth token)
curl -X POST http://localhost:8000/api/profiles \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "username": "test_user",
    "display_name": "Test User",
    "bio": "Testing the platform"
  }'

# Get profile
curl http://localhost:8000/api/profiles/test_user
```

**Verification:**
- [ ] Profile creation successful
- [ ] Profile retrieval works
- [ ] Username is unique (try creating duplicate)

### 2.5 Reflections Endpoints

**Test:** Reflection CRUD

```bash
# Create reflection
curl -X POST http://localhost:8000/api/reflections \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "body": "I feel stuck in a loop of overthinking.",
    "lens_key": "mind",
    "visibility": "public"
  }'

# Get reflection by ID
curl http://localhost:8000/api/reflections/1

# Get reflections by lens
curl http://localhost:8000/api/reflections/lens/mind
```

**Verification:**
- [ ] Reflection created successfully
- [ ] Returns reflection ID
- [ ] Lens filtering works
- [ ] Visibility respected

### 2.6 Feed Endpoint

**Test:** Feed algorithm

```bash
# Get personalized feed (requires auth)
curl http://localhost:8000/api/feed \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get public feed (no auth)
curl http://localhost:8000/api/feed/public?limit=10
```

**Verification:**
- [ ] Feed returns items
- [ ] Reflection-first scoring applied
- [ ] Cursor pagination works
- [ ] Public feed accessible without auth

### 2.7 Signals Endpoint

**Test:** Signal creation

```bash
# Create signal
curl -X POST http://localhost:8000/api/signals \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reflection_id": 1,
    "signal": "resonated"
  }'
```

**Verification:**
- [ ] Signal created
- [ ] Signal types: resonated, challenged, skipped, saved, judgment_spike

---

## 🧠 3. MIRRORX ENGINE QA (Port 8100)

### 3.1 Startup Test

**Test:** Start MirrorX Engine
```bash
cd mirrorx-engine
source venv/bin/activate
python -m app.main
```

**Expected Output:**
```
🧠 MirrorX Engine Starting...
✓ Database connected
✓ MirrorX Engine ready
INFO:     Uvicorn running on http://0.0.0.0:8100
```

**Verification:**
- [ ] No import errors
- [ ] Database connection successful
- [ ] All modules loaded (conductor, analyzers, etc.)

### 3.2 Health Check

**Test:** Engine health
```bash
curl http://localhost:8100/health
```

**Expected Response:**
```json
{
  "status": "operational",
  "mirrorcore": "active",
  "database": "connected",
  "ai_providers": {
    "anthropic": true,
    "openai": true,
    "google": false
  }
}
```

**Verification:**
- [ ] Status is operational
- [ ] Database connected
- [ ] AI providers status reflects .env configuration

### 3.3 Mirrorback Generation (Original Pipeline)

**Test:** Generate mirrorback without Conductor

```bash
# Set USE_CONDUCTOR=false in .env first
curl -X POST http://localhost:8100/mirrorback \
  -H "Content-Type: application/json" \
  -d '{
    "reflection_id": 1,
    "reflection_body": "I feel stuck in a loop of overthinking.",
    "lens_key": "mind",
    "identity_id": "test-user-id"
  }'
```

**Expected Response:**
```json
{
  "body": "I notice you're describing a loop. What does overthinking protect you from seeing?",
  "tone": "searching",
  "tensions": ["internal_contradiction", "want_vs_should"],
  "metadata": {
    "tone_confidence": 0.8,
    "question_ratio": 0.5
  }
}
```

**Verification:**
- [ ] Mirrorback generated
- [ ] Tone detected
- [ ] Tensions identified
- [ ] No advice given (MirrorCore compliance)

### 3.4 Conductor System (Multi-AI)

**Test:** Generate mirrorback with Conductor

```bash
# Set USE_CONDUCTOR=true in .env
# Requires: OPENAI_API_KEY, ANTHROPIC_API_KEY, GOOGLE_API_KEY, HUME_API_KEY

curl -X POST http://localhost:8100/mirrorback \
  -H "Content-Type: application/json" \
  -d '{
    "reflection_id": 2,
    "reflection_body": "I want to succeed but I am afraid of failure.",
    "lens_key": "belief",
    "identity_id": "test-user-id"
  }'
```

**Expected Response:**
```json
{
  "body": "There's a tension between desire and fear here. What would it mean to hold both at once?",
  "tone": "compassionate",
  "tensions": ["want_vs_fear", "success_vs_failure"],
  "metadata": {
    "bias_insights": ["control", "binary_thinking"],
    "regression_markers": [],
    "validation": {
      "valid": true,
      "violations": []
    }
  }
}
```

**Verification:**
- [ ] Conductor orchestration successful
- [ ] Multi-AI insights included
- [ ] MirrorCore validation passed
- [ ] Richer analysis than original pipeline

### 3.5 Analysis Endpoint

**Test:** Analyze reflection without generating mirrorback

```bash
curl -X POST http://localhost:8100/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "reflection_id": 3,
    "reflection_body": "Everyone is against me. Nothing ever works out.",
    "identity_id": "test-user-id"
  }'
```

**Expected Response:**
```json
{
  "tone": "resigned",
  "tensions": ["self_vs_others", "victimhood"],
  "bias_insights": [
    {
      "dimension": "attribution",
      "direction": "external_blame",
      "confidence": 0.85,
      "notes": "Attributes failure to external forces"
    },
    {
      "dimension": "absolutism",
      "direction": "high",
      "confidence": 0.9,
      "notes": "Uses 5 absolute terms (everyone, nothing, never)"
    }
  ],
  "regression_markers": [
    {
      "kind": "judgment_spike",
      "severity": 3,
      "description": "Harsh judgment toward others"
    }
  ]
}
```

**Verification:**
- [ ] Tone analysis working
- [ ] Bias detection working
- [ ] Regression detection working
- [ ] No mirrorback generated

### 3.6 MirrorCore Validation

**Test:** Verify MirrorCore blocks advice-giving

```bash
# Try to generate a mirrorback that would give advice (should be filtered)
curl -X POST http://localhost:8100/mirrorback \
  -H "Content-Type: application/json" \
  -d '{
    "reflection_id": 4,
    "reflection_body": "I do not know what to do about my job.",
    "identity_id": "test-user-id"
  }'
```

**Verification:**
- [ ] Mirrorback does NOT contain: "you should", "you need to", "I recommend"
- [ ] Mirrorback contains questions or observations
- [ ] MirrorCore validation passes

---

## 🎨 4. FRONTEND QA (Port 3000)

### 4.1 Startup Test

**Test:** Start frontend
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
ready - started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Verification:**
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Server starts successfully

### 4.2 Homepage / Feed

**Test:** Visit homepage
```
Open browser: http://localhost:3000
```

**Verification:**
- [ ] Page loads without errors
- [ ] Gold/black theme applied
- [ ] Navigation visible
- [ ] Feed loads (or shows empty state)
- [ ] No console errors

### 4.3 Reflection Composer

**Test:** Create reflection
```
Navigate to: http://localhost:3000/reflect
```

**Actions:**
1. Enter reflection text
2. Select a lens (optional)
3. Choose visibility (public/private/unlisted)
4. Submit

**Verification:**
- [ ] Composer form renders
- [ ] Lens selector works
- [ ] Visibility toggle works
- [ ] Character count displays
- [ ] Submission works
- [ ] Redirects to feed after submission

### 4.4 Reflection Card

**Test:** View reflection in feed

**Verification:**
- [ ] Author info displays
- [ ] Reflection body shows
- [ ] Lens badge visible (if applicable)
- [ ] Timestamp displays
- [ ] "Get Mirrorback" button visible
- [ ] Signal buttons work (Resonated, Challenged, Save)

### 4.5 Mirrorback Request

**Test:** Request mirrorback from frontend

**Actions:**
1. Click "Get Mirrorback" on a reflection
2. Wait for generation

**Verification:**
- [ ] Loading state shows
- [ ] Mirrorback displays in styled box
- [ ] Contains reflective questions
- [ ] No advice given
- [ ] Can view/hide mirrorback

### 4.6 API Client

**Test:** Check frontend API client

**File:** `frontend/src/lib/api.ts`

**Verification:**
- [ ] All endpoints defined
- [ ] TypeScript types correct
- [ ] Auth token handling works
- [ ] Error handling present

---

## 🔗 5. INTEGRATION QA

### 5.1 Core API ↔ MirrorX Engine

**Test:** End-to-end mirrorback generation

**Flow:**
1. Frontend submits reflection → Core API
2. Core API creates reflection in DB
3. Frontend requests mirrorback → Core API
4. Core API calls MirrorX Engine
5. MirrorX Engine generates mirrorback
6. Core API saves mirrorback to DB
7. Frontend displays mirrorback

**Verification:**
- [ ] Full flow completes without errors
- [ ] Data persists correctly
- [ ] API calls successful
- [ ] Response times acceptable (<5s for mirrorback)

### 5.2 Conductor → Database Integration

**Test:** Identity delta persistence

**Expected Flow:**
1. Conductor generates identity delta
2. `identity_graph.py` applies delta to DB
3. Graph nodes/edges updated
4. Evolution events recorded

**Verification:**
```sql
-- Check conductor bundles saved
SELECT COUNT(*) FROM mx_conductor_bundles;

-- Check graph nodes created
SELECT COUNT(*) FROM mx_graph_nodes;

-- Check graph edges created
SELECT COUNT(*) FROM mx_graph_edges;

-- Check evolution events
SELECT * FROM mx_evolution_events ORDER BY detected_at DESC LIMIT 5;
```

**Expected:**
- [ ] Conductor bundles stored
- [ ] Graph nodes created for tensions/loops/beliefs
- [ ] Edges created between related nodes
- [ ] Evolution events detected and recorded

### 5.3 Identity Graph Visualization

**Test:** Graph data retrieval

```bash
# Get graph for user
curl http://localhost:8000/api/user/test-user-id/graph
```

**Expected Response:**
```json
{
  "user_id": "test-user-id",
  "nodes": [
    {
      "id": "node-1",
      "label": "fear of failure",
      "node_type": "tension",
      "weight": 0.8
    }
  ],
  "edges": [
    {
      "source": "node-1",
      "target": "node-2",
      "edge_type": "reinforces",
      "weight": 0.7
    }
  ]
}
```

**Verification:**
- [ ] Nodes returned
- [ ] Edges returned
- [ ] Weights calculated
- [ ] Node types correct

### 5.4 Evolution Timeline

**Test:** Evolution events API

```bash
curl http://localhost:8000/api/user/test-user-id/evolution?limit=10
```

**Expected Response:**
```json
{
  "user_id": "test-user-id",
  "events": [
    {
      "event_type": "growth",
      "description": "New understanding emerged",
      "detected_at": "2025-12-07T10:00:00Z",
      "reflection_id": "ref-123"
    },
    {
      "event_type": "loop",
      "description": "Repeating pattern detected",
      "detected_at": "2025-12-06T15:30:00Z",
      "reflection_id": "ref-120"
    }
  ]
}
```

**Verification:**
- [ ] Events returned chronologically
- [ ] Event types valid (growth, stagnation, loop, regression, breakthrough, blind_spot)
- [ ] Descriptions present
- [ ] Reflection IDs linked

---

## 🛡️ 6. SECURITY & SAFETY QA

### 6.1 Safety Checks

**Test:** Crisis language detection

```bash
curl -X POST http://localhost:8100/mirrorback \
  -H "Content-Type: application/json" \
  -d '{
    "reflection_id": 99,
    "reflection_body": "I want to end it all. I cannot go on.",
    "identity_id": "test-user-id"
  }'
```

**Expected Behavior:**
- [ ] Safety check triggers
- [ ] Crisis response provided (not reflective mirrorback)
- [ ] Resources offered (crisis hotline, etc.)
- [ ] Event logged in `safety_events` table

**Verification:**
```sql
SELECT * FROM safety_events WHERE category = 'crisis' ORDER BY created_at DESC LIMIT 1;
```

### 6.2 MirrorCore Compliance

**Test:** Advice-giving blocked

**Action:** Try to manually inject advice-giving response

**Verification:**
- [ ] `mirrorcore_lint` catches violations
- [ ] Response rejected or rewritten
- [ ] Lint violations logged

### 6.3 Row-Level Security

**Test:** Unauthorized access blocked

```bash
# Try to access another user's private reflection (without auth)
curl http://localhost:8000/api/reflections/999
```

**Expected:**
- [ ] 404 or 403 error
- [ ] No data leaked
- [ ] RLS policies enforced

### 6.4 Input Validation

**Test:** Malformed requests

```bash
# Missing required fields
curl -X POST http://localhost:8000/api/reflections \
  -H "Content-Type: application/json" \
  -d '{}'

# Invalid data types
curl -X POST http://localhost:8000/api/reflections \
  -H "Content-Type: application/json" \
  -d '{"body": 123, "lens_key": true}'
```

**Expected:**
- [ ] 422 Validation Error
- [ ] Clear error messages
- [ ] No server crashes

---

## ⚡ 7. PERFORMANCE QA

### 7.1 Response Times

**Test:** Measure API response times

```bash
# Use curl with timing
curl -w "\nTime: %{time_total}s\n" http://localhost:8000/api/feed/public
```

**Targets:**
- [ ] Health check: <100ms
- [ ] Feed: <500ms
- [ ] Reflection creation: <300ms
- [ ] Mirrorback (without Conductor): <3s
- [ ] Mirrorback (with Conductor): <8s

### 7.2 Database Query Performance

**Test:** Check slow queries

```sql
-- Enable query logging in Supabase
-- Check query performance
EXPLAIN ANALYZE
SELECT * FROM reflections
WHERE visibility = 'public'
ORDER BY created_at DESC
LIMIT 20;
```

**Verification:**
- [ ] Indexes used
- [ ] Query time <100ms
- [ ] No sequential scans on large tables

### 7.3 Frontend Performance

**Test:** Lighthouse audit

**Action:** Run Chrome DevTools Lighthouse on `http://localhost:3000`

**Targets:**
- [ ] Performance: >80
- [ ] Accessibility: >90
- [ ] Best Practices: >80
- [ ] SEO: >80

### 7.4 Memory Usage

**Test:** Monitor memory during operation

```bash
# Core API memory
ps aux | grep "python -m app.main"

# Frontend memory
# Check browser DevTools Memory tab
```

**Verification:**
- [ ] No memory leaks
- [ ] Stable memory usage over time

---

## 📝 8. DOCUMENTATION QA

### 8.1 README.md

**Verification:**
- [ ] Accurate architecture description
- [ ] Complete setup instructions
- [ ] All features documented
- [ ] Environment variables explained
- [ ] API documentation links work

### 8.2 INTEGRATION_COMPLETE.md

**Verification:**
- [ ] All integrated features listed
- [ ] Before/after comparison accurate
- [ ] Database schema documented
- [ ] Code examples work

### 8.3 VSCODE_SETUP.md

**Verification:**
- [ ] VS Code setup instructions complete
- [ ] Extension recommendations accurate
- [ ] Debug configurations work
- [ ] File paths correct

### 8.4 Code Comments

**Verification:**
- [ ] Critical functions documented
- [ ] Complex logic explained
- [ ] TODOs marked where needed
- [ ] No outdated comments

---

## 🔬 9. CONDUCTOR SYSTEM QA

### 9.1 Multi-AI Providers

**Test:** Verify each provider works

```bash
# Test with USE_CONDUCTOR=true and all API keys set

# Should use:
# 1. Hume - Emotion
# 2. OpenAI - Semantic, Identity, Filter
# 3. Gemini - Logic/Paradox
# 4. Perplexity - Grounding (optional)
# 5. Claude - Mirrorback
```

**Check Logs For:**
- [ ] Hume emotion detection called
- [ ] OpenAI semantic analysis called
- [ ] Gemini logic mapping called
- [ ] Claude mirrorback generation called
- [ ] OpenAI safety filter called
- [ ] No provider errors

### 9.2 Identity Delta Computation

**Test:** Identity delta applied

**Check Database:**
```sql
SELECT * FROM mx_identity_deltas ORDER BY created_at DESC LIMIT 1;
```

**Verification:**
- [ ] New tensions logged
- [ ] Resolved tensions tracked
- [ ] New loops identified
- [ ] Delta applied successfully

### 9.3 Orchestrator Bundle

**Test:** Bundle persisted

```sql
SELECT bundle::json FROM mx_conductor_bundles ORDER BY created_at DESC LIMIT 1;
```

**Verification:**
- [ ] Bundle contains: emotion, semantic, identity, logic, tone, grounding
- [ ] All fields populated
- [ ] JSON valid

---

## 🌐 10. DEPLOYMENT READINESS QA

### 10.1 Environment Configuration

**Test:** .env.example completeness

**Verification:**
- [ ] All required variables listed
- [ ] Example values provided
- [ ] Comments explain each variable
- [ ] No secrets committed

### 10.2 Dependencies

**Test:** Check for security vulnerabilities

```bash
# Python
cd core-api
pip install safety
safety check

cd ../mirrorx-engine
safety check

# Node.js
cd ../frontend
npm audit
```

**Verification:**
- [ ] No critical vulnerabilities
- [ ] All dependencies up to date
- [ ] Deprecated packages identified

### 10.3 Docker Readiness (Optional)

**Test:** If Dockerfiles exist

```bash
docker build -t mirror-core-api ./core-api
docker build -t mirror-mirrorx ./mirrorx-engine
docker build -t mirror-frontend ./frontend
```

**Verification:**
- [ ] Builds succeed
- [ ] Images optimized
- [ ] Multi-stage builds used

### 10.4 Git Hygiene

**Test:** Check repository state

```bash
git status
git log --oneline -10
```

**Verification:**
- [ ] No uncommitted changes
- [ ] Commit messages clear
- [ ] No sensitive data in history
- [ ] .gitignore complete

---

## ✅ QA CHECKLIST SUMMARY

### Critical (Must Pass)

- [ ] **Database:** All 3 migrations run successfully
- [ ] **Core API:** Starts without errors, health check passes
- [ ] **MirrorX Engine:** Starts without errors, health check passes
- [ ] **Frontend:** Builds and runs without errors
- [ ] **Integration:** Full reflection → mirrorback flow works
- [ ] **Safety:** Crisis language detected and handled
- [ ] **MirrorCore:** Advice-giving blocked

### Important (Should Pass)

- [ ] **Conductor:** Multi-AI orchestration works
- [ ] **Identity Graph:** Nodes and edges created
- [ ] **Evolution Engine:** Events detected and recorded
- [ ] **Feed Algorithm:** Reflection-first scoring works
- [ ] **Performance:** Response times within targets
- [ ] **Security:** RLS policies enforced

### Nice to Have (Can Fix Later)

- [ ] **Documentation:** All docs up to date
- [ ] **Frontend Polish:** UI matches Figma design
- [ ] **Performance:** Lighthouse score >90
- [ ] **Code Quality:** No linting errors

---

## 🐛 ISSUE TRACKING

### Found Issues

**Template for reporting:**
```
Issue #: [Number]
Severity: [Critical/High/Medium/Low]
Component: [Core API/MirrorX/Frontend/Database]
Description: [What went wrong]
Steps to Reproduce: [How to trigger the issue]
Expected: [What should happen]
Actual: [What actually happened]
Fix: [Proposed solution]
```

---

## 📊 QA RESULTS

**Date:** _____________
**Tester:** _____________
**Version:** 1.0

**Overall Status:** [ ] Pass [ ] Pass with Issues [ ] Fail

**Critical Issues:** _____ / 7 Passed
**Important Issues:** _____ / 6 Passed
**Nice to Have:** _____ / 4 Passed

**Total Score:** _____ %

**Ready for Production:** [ ] Yes [ ] No [ ] With Fixes

---

## 🎯 NEXT STEPS AFTER QA

1. **Fix Critical Issues** - Must be resolved before deployment
2. **Address Important Issues** - Should be fixed soon
3. **Plan Enhancements** - Nice to have features
4. **Performance Optimization** - Based on metrics
5. **Security Hardening** - Additional safety measures
6. **Documentation Updates** - Based on findings
7. **User Testing** - Beta testing with real users

---

**Built with reflection. Powered by MirrorCore.** 🪞

**QA Complete: The Mirror Virtual Platform**

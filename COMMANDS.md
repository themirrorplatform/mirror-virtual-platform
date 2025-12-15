# Mirror Platform - Command Reference

Quick reference for common development tasks.

## Testing

### Run All Core Tests (Phases 1-3)
```bash
python3.13 -m pytest tests/test_storage_phase1.py tests/test_phase2_llm.py tests/test_phase2_reflection_engine.py tests/test_language_shapes.py tests/test_tension_tracker.py tests/test_evolution_engine.py tests/test_graph_manager.py -v
```

### Run Specific Phase
```bash
# Phase 1: Storage (20 tests)
pytest tests/test_storage_phase1.py -v

# Phase 2: MirrorCore (118 tests)
pytest tests/test_phase2_llm.py -v
pytest tests/test_phase2_reflection_engine.py -v
pytest tests/test_language_shapes.py -v
pytest tests/test_tension_tracker.py -v

# Phase 3: Evolution (50 tests)
pytest tests/test_evolution_engine.py -v
pytest tests/test_graph_manager.py -v
pytest tests/test_orchestrator_integration.py -v
```

### Quick Test Summary
```bash
pytest tests/ -v --tb=no -q
```

## API Server

### Start Server
```bash
cd c:\Users\ilyad\mirror-virtual-platform
python mirror_api/run_server.py
```

Server runs on: http://localhost:8000

### API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Test API Manually
```bash
python test_api_manual.py
```

## Database Management

### Clear Database
```powershell
Remove-Item data\mirror.db*
```

### View Database
```bash
sqlite3 data/mirror.db
.schema
.tables
SELECT * FROM reflections LIMIT 5;
.quit
```

## API Testing with PowerShell

### Health Check
```powershell
Invoke-WebRequest http://localhost:8000/health | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### Generate Reflection
```powershell
$body = @{
    text = "I feel uncertain about my path"
} | ConvertTo-Json

Invoke-WebRequest -Method POST `
  -Uri "http://localhost:8000/api/v1/reflect" `
  -Headers @{
      "X-Mirror-Id" = "mirror_test_123"
      "Content-Type" = "application/json"
  } `
  -Body $body | Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### Get Recent Reflections
```powershell
Invoke-WebRequest `
  -Uri "http://localhost:8000/api/v1/reflections/recent" `
  -Headers @{"X-Mirror-Id" = "mirror_test_123"} | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### Graph Statistics
```powershell
Invoke-WebRequest `
  -Uri "http://localhost:8000/api/v1/graph/stats" `
  -Headers @{"X-Mirror-Id" = "mirror_test_123"} | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json
```

### Shape Statistics
```powershell
Invoke-WebRequest `
  -Uri "http://localhost:8000/api/v1/statistics/shapes" `
  -Headers @{"X-Mirror-Id" = "mirror_test_123"} | 
  Select-Object -ExpandProperty Content | ConvertFrom-Json
```

## Development

### Set Python Path
```powershell
$env:PYTHONPATH = "c:\Users\ilyad\mirror-virtual-platform"
```

### Install Dependencies
```bash
pip install -r requirements.txt
```

### Install API Dependencies
```bash
pip install fastapi uvicorn slowapi python-multipart
```

## Common Issues

### ModuleNotFoundError
```powershell
$env:PYTHONPATH = "c:\Users\ilyad\mirror-virtual-platform"
```

### Database UNIQUE Constraint Error
```powershell
Remove-Item data\mirror.db*
```

### Port 8000 Already in Use
```powershell
Get-Process -Name python* | Stop-Process
```

## Verification Commands

### Check All Tests Pass
```bash
python3.13 -m pytest tests/ -v --tb=no -q
```

Expected: **168 passed**

### Verify API Runs
```bash
python mirror_api/run_server.py
```

Should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

### Test API Endpoint
```powershell
Invoke-WebRequest http://localhost:8000/health
```

Should return: `{"status":"healthy"}`

## Git Commands

### Status
```bash
git status
```

### Add All Changes
```bash
git add .
```

### Commit
```bash
git commit -m "Phase 4: Platform Integration complete"
```

### Push
```bash
git push origin main
```

## Production

### Run with Workers
```bash
uvicorn mirror_api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Run with Reload (Development)
```bash
uvicorn mirror_api.main:app --reload --host 0.0.0.0 --port 8000
```

## Quick Validation

Run this to validate everything works:

```bash
# 1. Tests
python3.13 -m pytest tests/test_storage_phase1.py tests/test_phase2_llm.py tests/test_phase2_reflection_engine.py tests/test_language_shapes.py tests/test_tension_tracker.py tests/test_evolution_engine.py tests/test_graph_manager.py -v --tb=no -q

# 2. Start server (in separate terminal)
python mirror_api/run_server.py

# 3. Test API (in another terminal)
Invoke-WebRequest http://localhost:8000/health
```

Expected:
- ✅ 168/168 tests pass
- ✅ Server starts without errors
- ✅ Health endpoint returns 200

---

**All systems operational!** 🎉

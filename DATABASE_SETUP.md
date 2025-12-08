# Database Setup Instructions

## Quick Start (Docker)

1. **Start Docker Desktop** (if not running)

2. **Start databases:**
   ```powershell
   docker-compose up -d
   ```

3. **Wait for databases to be ready (15 seconds):**
   ```powershell
   Start-Sleep -Seconds 15
   ```

4. **Apply migrations to test database:**
   ```powershell
   # Set password
   $env:PGPASSWORD = "postgres"
   
   # Apply migrations
   Get-Content .\supabase\migrations\001_mirror_core.sql | docker exec -i mirror-postgres-test psql -U postgres -d mirror_test
   Get-Content .\supabase\migrations\002_reflection_intelligence.sql | docker exec -i mirror-postgres-test psql -U postgres -d mirror_test
   Get-Content .\supabase\migrations\003_mirrorx_complete.sql | docker exec -i mirror-postgres-test psql -U postgres -d mirror_test
   ```

5. **Set environment variable:**
   ```powershell
   $env:DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mirror_test"
   ```

## Database Connections

- **Development:** `postgresql://postgres:postgres@localhost:5432/mirror_dev`
- **Test:** `postgresql://postgres:postgres@localhost:5433/mirror_test`

## Run Tests

```powershell
# Integration tests (no DB required)
python -m pytest tests/ -v

# Core API tests (requires DB)
cd core-api
python -m pytest tests/ -v

# Frontend tests
cd frontend
npm test
```

## Troubleshooting

### Docker not starting
```powershell
docker-compose down
docker-compose up -d
docker-compose logs
```

### Port already in use
```powershell
# Check what's using the port
netstat -ano | findstr "5432"
netstat -ano | findstr "5433"
```

### Reset databases
```powershell
docker-compose down -v
docker-compose up -d
# Reapply migrations
```

## Manual Database Setup (Without Docker)

If you have PostgreSQL installed locally:

```powershell
# Create test database
createdb -U postgres mirror_test

# Apply migrations
psql -U postgres -d mirror_test -f supabase\migrations\001_mirror_core.sql
psql -U postgres -d mirror_test -f supabase\migrations\002_reflection_intelligence.sql
psql -U postgres -d mirror_test -f supabase\migrations\003_mirrorx_complete.sql

# Set environment
$env:DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/mirror_test"
```

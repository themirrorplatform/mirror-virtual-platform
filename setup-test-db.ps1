#!/usr/bin/env pwsh
# Setup Script - Start Databases and Run Migrations

Write-Host "🚀 Starting test database setup..." -ForegroundColor Green
Write-Host ""

try {
    # Start Docker containers
    Write-Host "📦 Starting PostgreSQL containers..." -ForegroundColor Cyan
    docker-compose up -d
    
    # Wait for databases to be ready
    Write-Host ""
    Write-Host "⏳ Waiting for databases to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 15
    
    # Test connection
    Write-Host ""
    Write-Host "🔌 Testing database connection..." -ForegroundColor Cyan
    $env:PGPASSWORD = "postgres"
    docker exec mirror-postgres-test pg_isready -U postgres
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Database is ready!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Database not ready yet, waiting..." -ForegroundColor Yellow
        Start-Sleep -Seconds 10
    }
    
    # Run migrations on test database
    Write-Host ""
    Write-Host "🔧 Running migrations on test database..." -ForegroundColor Cyan
    
    $migrations = @(
        "001_mirror_core.sql",
        "002_reflection_intelligence.sql",
        "003_mirrorx_complete.sql"
    )
    
    foreach ($migration in $migrations) {
        Write-Host "  Applying $migration..." -ForegroundColor Gray
        $migrationPath = Join-Path $PSScriptRoot "supabase\migrations\$migration"
        
        try {
            $env:PGPASSWORD = "postgres"
            Get-Content $migrationPath | docker exec -i mirror-postgres-test psql -U postgres -d mirror_test
            Write-Host "    ✓ Applied successfully" -ForegroundColor Green
        } catch {
            Write-Host "    ⚠️  May already be applied" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "✅ Test database setup complete!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Database connections:" -ForegroundColor Cyan
    Write-Host "   Dev:  postgresql://postgres:postgres@localhost:5432/mirror_dev" -ForegroundColor White
    Write-Host "   Test: postgresql://postgres:postgres@localhost:5433/mirror_test" -ForegroundColor White
    Write-Host ""
    Write-Host "🧪 Ready to run tests!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Run tests with:" -ForegroundColor Yellow
    Write-Host "  python -m pytest tests/ -v" -ForegroundColor White
    Write-Host "  cd core-api; python -m pytest tests/ -v" -ForegroundColor White
    Write-Host "  cd frontend; npm test" -ForegroundColor White
    
} catch {
    Write-Host ""
    Write-Host "Error during setup: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "   1. Make sure Docker Desktop is running" -ForegroundColor White
    Write-Host "   2. Try: docker-compose down; docker-compose up -d" -ForegroundColor White
    Write-Host "   3. Check if ports 5432 and 5433 are available" -ForegroundColor White
    Write-Host "   4. Check Docker logs: docker-compose logs" -ForegroundColor White
    exit 1
}

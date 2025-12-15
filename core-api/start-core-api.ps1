# Mirror Virtual Platform - Core API Startup Script
# Layer 3: Optional Platform Services

Write-Host "🪞 Starting The Mirror - Core API (Layer 3)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "   Please copy .env.example to .env and configure:" -ForegroundColor Yellow
    Write-Host "   cp .env.example .env" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Required variables:" -ForegroundColor Yellow
    Write-Host "   - SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "   - SUPABASE_KEY" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "app\main.py")) {
    Write-Host "❌ Error: Must run from core-api/ directory" -ForegroundColor Red
    Write-Host "   cd core-api" -ForegroundColor Yellow
    Write-Host "   .\start-core-api.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✓ Python found: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Error: Python not found" -ForegroundColor Red
    Write-Host "   Install Python 3.10+ from: https://www.python.org/downloads/" -ForegroundColor Yellow
    exit 1
}

# Check if dependencies are installed
Write-Host ""
Write-Host "Checking dependencies..." -ForegroundColor Cyan
try {
    python -c "import fastapi" 2>$null
    Write-Host "✓ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Dependencies not found, installing..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if port 8000 is available
$portCheck = netstat -ano | Select-String ":8000"
if ($portCheck) {
    Write-Host ""
    Write-Host "⚠ Warning: Port 8000 is already in use" -ForegroundColor Yellow
    Write-Host "   Another process may be running on this port" -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Continue anyway? (y/n)"
    if ($response -ne "y") {
        exit 0
    }
}

# Load environment variables
Write-Host ""
Write-Host "Loading configuration..." -ForegroundColor Cyan
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        $name = $matches[1]
        $value = $matches[2]
        # Don't print sensitive values
        if ($name -match "KEY|SECRET|PASSWORD") {
            Write-Host "  $name = [REDACTED]" -ForegroundColor DarkGray
        } else {
            Write-Host "  $name = $value" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Starting Core API server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  URL: http://localhost:8000" -ForegroundColor White
Write-Host "  Docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Health: http://localhost:8000/health" -ForegroundColor White
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

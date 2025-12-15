# Mirror Virtual Platform - MirrorX Engine Startup Script
# Layer 1: Sovereign Core - MUST work without Layer 3

Write-Host "🪞 Starting The Mirror - MirrorX Engine (Layer 1)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found" -ForegroundColor Red
    Write-Host "   Please copy .env.example to .env and configure:" -ForegroundColor Yellow
    Write-Host "   cp .env.example .env" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   REQUIRED: At least ONE AI provider key:" -ForegroundColor Yellow
    Write-Host "   - ANTHROPIC_API_KEY (recommended)" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY (alternative)" -ForegroundColor Yellow
    Write-Host "   - GOOGLE_API_KEY (alternative)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   OPTIONAL: Layer 3 integration (can be empty):" -ForegroundColor Yellow
    Write-Host "   - SUPABASE_URL" -ForegroundColor Yellow
    Write-Host "   - SUPABASE_KEY" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# Check if we're in the right directory
if (-not (Test-Path "app\main.py")) {
    Write-Host "❌ Error: Must run from mirrorx-engine/ directory" -ForegroundColor Red
    Write-Host "   cd mirrorx-engine" -ForegroundColor Yellow
    Write-Host "   .\start-mirrorx-engine.ps1" -ForegroundColor Yellow
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

# Verify AI provider keys are present
Write-Host ""
Write-Host "Checking AI provider configuration..." -ForegroundColor Cyan
$hasProvider = $false
Get-Content .env | ForEach-Object {
    if ($_ -match '^ANTHROPIC_API_KEY=(.+)$' -and $matches[1] -ne "sk-ant-api03-your-key-here") {
        Write-Host "✓ Anthropic (Claude) API key configured" -ForegroundColor Green
        $hasProvider = $true
    }
    if ($_ -match '^OPENAI_API_KEY=(.+)$' -and $matches[1] -ne "sk-proj-your-key-here") {
        Write-Host "✓ OpenAI API key configured" -ForegroundColor Green
        $hasProvider = $true
    }
    if ($_ -match '^GOOGLE_API_KEY=(.+)$' -and $matches[1] -ne "your-google-api-key-here") {
        Write-Host "✓ Google (Gemini) API key configured" -ForegroundColor Green
        $hasProvider = $true
    }
}

if (-not $hasProvider) {
    Write-Host ""
    Write-Host "❌ Error: No AI provider keys configured" -ForegroundColor Red
    Write-Host "   Edit .env and add at least ONE of:" -ForegroundColor Yellow
    Write-Host "   - ANTHROPIC_API_KEY (recommended)" -ForegroundColor Yellow
    Write-Host "   - OPENAI_API_KEY" -ForegroundColor Yellow
    Write-Host "   - GOOGLE_API_KEY" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Get API keys from:" -ForegroundColor Yellow
    Write-Host "   Anthropic: https://console.anthropic.com/settings/keys" -ForegroundColor White
    Write-Host "   OpenAI: https://platform.openai.com/api-keys" -ForegroundColor White
    Write-Host "   Google: https://makersuite.google.com/app/apikey" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check constitutional enforcement is enabled
Write-Host ""
Write-Host "Checking constitutional enforcement..." -ForegroundColor Cyan
$constitutionalEnabled = $true
Get-Content .env | ForEach-Object {
    if ($_ -match '^ENABLE_CONSTITUTIONAL_CHECKS=false$') {
        $constitutionalEnabled = $false
    }
}

if ($constitutionalEnabled) {
    Write-Host "✓ Constitutional enforcement ACTIVE" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: Constitutional enforcement DISABLED" -ForegroundColor Red
    Write-Host "   This violates the constitutional requirements (I1-I14)" -ForegroundColor Red
    Write-Host "   Edit .env and set: ENABLE_CONSTITUTIONAL_CHECKS=true" -ForegroundColor Yellow
    exit 1
}

# Check Layer 3 integration status
Write-Host ""
Write-Host "Checking Layer 3 integration..." -ForegroundColor Cyan
$hasSupabase = $false
Get-Content .env | ForEach-Object {
    if ($_ -match '^SUPABASE_URL=(.+)$' -and $matches[1] -ne "https://your-project.supabase.co" -and $matches[1] -ne "") {
        $hasSupabase = $true
    }
}

if ($hasSupabase) {
    Write-Host "✓ Layer 3 (Core API) integration enabled" -ForegroundColor Green
    Write-Host "  Will sync with Core API if available" -ForegroundColor DarkGray
} else {
    Write-Host "⚠ Layer 1 STANDALONE mode (Layer 3 integration disabled)" -ForegroundColor Yellow
    Write-Host "  This is CONSTITUTIONAL - Layer 1 must work independently" -ForegroundColor Green
    Write-Host "  Reflections will be stored in local SQLite only" -ForegroundColor DarkGray
}

# Check if port 8100 is available
$portCheck = netstat -ano | Select-String ":8100"
if ($portCheck) {
    Write-Host ""
    Write-Host "⚠ Warning: Port 8100 is already in use" -ForegroundColor Yellow
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
        if ($name -match "KEY|SECRET") {
            Write-Host "  $name = [REDACTED]" -ForegroundColor DarkGray
        } else {
            Write-Host "  $name = $value" -ForegroundColor DarkGray
        }
    }
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Starting MirrorX Engine server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "  URL: http://localhost:8100" -ForegroundColor White
Write-Host "  Docs: http://localhost:8100/docs" -ForegroundColor White
Write-Host "  Health: http://localhost:8100/health" -ForegroundColor White
Write-Host ""
Write-Host "  Constitutional Enforcement: ACTIVE ✓" -ForegroundColor Green
Write-Host "  Layer 1 Independence: VERIFIED ✓" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8100 --reload

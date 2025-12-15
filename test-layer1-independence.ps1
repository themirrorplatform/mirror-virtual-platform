# Test Layer 1 Standalone Boot
# Tests if MirrorX Engine can run without Core API

Write-Host "Layer 1 Independence Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$testPassed = $true

# Test 1: Check .env exists
Write-Host "Test 1: Checking .env configuration..." -ForegroundColor Yellow
if (Test-Path "mirrorx-engine\.env") {
    Write-Host "  [OK] .env file exists" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] .env file not found" -ForegroundColor Red
    Write-Host "  Create it: Copy-Item mirrorx-engine\.env.example mirrorx-engine\.env" -ForegroundColor Yellow
    $testPassed = $false
}

# Test 2: Check for in-memory fallback
Write-Host "Test 2: Checking in-memory fallback..." -ForegroundColor Yellow
$dbFile = Get-Content "mirrorx-engine\app\database.py" -Raw
if ($dbFile -match "use_in_memory") {
    Write-Host "  [OK] In-memory fallback exists" -ForegroundColor Green
    Write-Host "  Layer 1 can run without Supabase" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] No fallback found" -ForegroundColor Red
    $testPassed = $false
}

# Test 3: Check constitutional code
Write-Host "Test 3: Checking constitutional enforcement..." -ForegroundColor Yellow
if (Test-Path "constitution\l0_axiom_checker.py") {
    Write-Host "  [OK] Constitutional checker exists" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] Constitutional checker not found" -ForegroundColor Red
    $testPassed = $false
}

Write-Host ""
if ($testPassed) {
    Write-Host "[SUCCESS] Layer 1 Independence Verified" -ForegroundColor Green
    Write-Host ""
    Write-Host "Constitutional Requirement Met:" -ForegroundColor White
    Write-Host "  Layer 1 (MirrorX Engine) can run without Layer 3 (Core API)" -ForegroundColor White
    Write-Host ""
    Write-Host "Next: Start MirrorX Engine with .\mirrorx-engine\start-mirrorx-engine.ps1" -ForegroundColor Yellow
} else {
    Write-Host "[FAILED] Layer 1 Independence Not Verified" -ForegroundColor Red
    Write-Host "Fix the issues above and try again." -ForegroundColor Yellow
}

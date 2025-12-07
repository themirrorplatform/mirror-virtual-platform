# The Mirror Virtual Platform - Quick Setup Script (Windows)

Write-Host "🪞 The Mirror Virtual Platform - Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "core-api\requirements.txt")) {
    Write-Host "❌ Error: Please run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

# Install backend dependencies
Write-Host "Installing Python dependencies..." -ForegroundColor Green
Set-Location core-api
pip install -r requirements.txt
Set-Location ..

# Install frontend dependencies
Write-Host ""
Write-Host "Installing Node.js dependencies..." -ForegroundColor Green
Set-Location frontend
npm install
Set-Location ..

Write-Host ""
Write-Host "✅ Dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Complete Supabase setup:" -ForegroundColor White
Write-Host "   - Run migrations in Supabase SQL Editor" -ForegroundColor Gray
Write-Host "   - Get JWT Secret from Settings → API" -ForegroundColor Gray
Write-Host "   - Get Service Role Key from Settings → API" -ForegroundColor Gray
Write-Host "   - Update core-api\.env with these values" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Start the backend:" -ForegroundColor White
Write-Host "   cd core-api" -ForegroundColor Gray
Write-Host "   python -m uvicorn app.main:app --reload --port 8000" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start the frontend (in a new terminal):" -ForegroundColor White
Write-Host "   cd frontend" -ForegroundColor Gray
Write-Host "   npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Visit http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "📚 See SUPABASE_DEPLOYMENT.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""

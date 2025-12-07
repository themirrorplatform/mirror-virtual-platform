#!/bin/bash

# The Mirror Virtual Platform - Quick Setup Script
echo "🪞 The Mirror Virtual Platform - Setup"
echo "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "core-api/requirements.txt" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
echo "Installing Python dependencies..."
cd core-api
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo ""
echo "Installing Node.js dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Dependencies installed!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Complete Supabase setup:"
echo "   - Run migrations in Supabase SQL Editor"
echo "   - Get JWT Secret from Settings → API"
echo "   - Get Service Role Key from Settings → API"
echo "   - Update core-api/.env with these values"
echo ""
echo "2. Start the backend:"
echo "   cd core-api"
echo "   python -m uvicorn app.main:app --reload --port 8000"
echo ""
echo "3. Start the frontend (in a new terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Visit http://localhost:3000"
echo ""
echo "📚 See SUPABASE_DEPLOYMENT.md for detailed instructions"
echo ""

#!/bin/bash

echo "🏗️  Building SRT Manager for Production..."

# Build Backend
echo "📦 Setting up Backend..."
cd backend
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi
source venv/bin/activate
pip install -r requirements.txt
deactivate
cd ..

# Build Frontend
echo "📦 Building Frontend..."
cd frontend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build Next.js for production
echo "Building Next.js..."
npm run build

cd ..

echo ""
echo "✅ Production build complete!"
echo ""
echo "🚀 To start the production server:"
echo "   1. Backend: cd backend && source venv/bin/activate && python main.py"
echo "   2. Frontend: cd frontend && npm run start"
echo ""
echo "Or use: ./start_all.sh"

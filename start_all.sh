#!/bin/bash

echo "🚀 Starting SRT Manager - Complete Stack"
echo "========================================"
echo ""

# Create logs directory if it doesn't exist
mkdir -p logs

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Check if build is needed
if [ ! -d "backend/venv" ] || [ ! -d "frontend/node_modules" ]; then
    echo "⚠️  First time setup detected. Running build..."
    ./build_production.sh
fi

# Start Backend
echo "📡 Starting Backend (FastAPI on port 8000)..."
cd backend
source venv/bin/activate
python main.py > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Start Frontend
echo "🌐 Starting Frontend (Next.js on port 3000)..."
cd frontend
npm run dev -- -H 0.0.0.0 > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ All services started!"
echo "========================================"
echo "🌐 Frontend:  http://207.180.240.247:3000"
echo "📡 Backend:   http://207.180.240.247:8000"
echo "📖 API Docs:  http://207.180.240.247:8000/docs"
echo "🔌 WebSocket: ws://207.180.240.247:8000/ws"
echo "========================================"
echo ""
echo "📝 Logs:"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for all background jobs
wait

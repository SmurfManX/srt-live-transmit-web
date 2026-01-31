#!/bin/bash

echo "🛑 Stopping SRT Manager - Complete Stack"
echo "========================================"
echo ""

# Stop Backend (Python/FastAPI)
echo "📡 Stopping Backend..."
pkill -f "python main.py" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ Backend stopped"
else
    echo "   ℹ Backend was not running"
fi

# Stop Frontend (Next.js)
echo "🌐 Stopping Frontend..."
pkill -f "next-server" 2>/dev/null || pkill -f "npm run dev" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "   ✓ Frontend stopped"
else
    echo "   ℹ Frontend was not running"
fi

# Give processes time to cleanup
sleep 1

echo ""
echo "✅ All services stopped!"
echo ""

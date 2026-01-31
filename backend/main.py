"""
SRT Channel Manager API
Main application entry point with modular architecture
"""

import os
import json
import asyncio
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from jose import JWTError

# Load environment variables
load_dotenv()

# Import from new modular structure
from app.api import auth_router, channels_router, system_router, users_router
from app.database import init_database
from app.core.websocket import manager
from app.core.security import SECRET_KEY, ALGORITHM, decode_token
from app.services.channel_service import load_channels, save_channels, ensure_directories
from app.services.stream_analyzer import start_analyzer, load_cache

# Create FastAPI app
app = FastAPI(
    title="SRT Channel Manager API",
    description="Modern API for managing SRT live streaming channels with authentication",
    version="3.0.0"
)

# CORS configuration
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Include routers
app.include_router(auth_router)
app.include_router(channels_router)
app.include_router(system_router)
app.include_router(users_router)


@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    # Initialize database
    init_database()

    # Ensure directories exist
    ensure_directories()
    Path("static/uploads").mkdir(parents=True, exist_ok=True)

    # Sync channel statuses with actual process states
    channels = load_channels()
    for channel in channels:
        if channel.pid:
            try:
                os.kill(channel.pid, 0)
                channel.status = "running"
            except OSError:
                channel.status = "stopped"
                channel.pid = None
        else:
            channel.status = "stopped"

    save_channels(channels)
    print(f"Startup complete: {len(channels)} channels processed")

    # Start background stream analyzer (every 10 seconds)
    load_cache()
    start_analyzer(interval=10)
    print("Stream analyzer started")


@app.get("/")
async def root():
    """Root API endpoint"""
    return {
        "name": "SRT Channel Manager API",
        "version": "3.0.0",
        "status": "running",
        "endpoints": {
            "login": "/api/auth/login",
            "channels": "/api/channels",
            "system": "/api/system/info",
            "interfaces": "/api/system/interfaces",
            "docs": "/docs",
            "websocket": "/ws"
        }
    }


@app.get("/health")
async def health_check():
    """API health check"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    """WebSocket for real-time channel status updates with authentication"""
    client_id = f"{websocket.client.host}:{websocket.client.port}" if websocket.client else "unknown"
    print(f"WebSocket connection attempt from {client_id}")

    # Verify token before accepting connection
    if not token:
        print(f"WebSocket rejected - no token from {client_id}")
        await websocket.close(code=1008, reason="Authentication required")
        return

    try:
        # Verify the JWT token
        payload = decode_token(token)
        if not payload:
            print(f"WebSocket rejected - invalid token from {client_id}")
            await websocket.close(code=1008, reason="Invalid token")
            return

        username = payload.get("sub")
        if not username:
            print(f"WebSocket rejected - invalid token (no sub) from {client_id}")
            await websocket.close(code=1008, reason="Invalid token")
            return

        print(f"WebSocket authenticated: {username} from {client_id}")
    except JWTError as e:
        print(f"WebSocket JWT error from {client_id}: {str(e)}")
        await websocket.close(code=1008, reason="Invalid token")
        return
    except Exception as e:
        print(f"WebSocket auth error from {client_id}: {str(e)}")
        await websocket.close(code=1008, reason="Authentication error")
        return

    await manager.connect(websocket)
    print(f"WebSocket connected: {username} ({client_id})")

    last_pong_time = asyncio.get_event_loop().time()
    heartbeat_timeout = 60

    try:
        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=5.0)

                try:
                    message = json.loads(data)
                    message_type = message.get("type")

                    if message_type == "ping":
                        await websocket.send_json({
                            "type": "pong",
                            "timestamp": datetime.now().isoformat()
                        })
                        last_pong_time = asyncio.get_event_loop().time()
                    elif message_type == "get_channels":
                        channels = load_channels()
                        await websocket.send_json({
                            "type": "channel_update",
                            "channels": [ch.model_dump() for ch in channels]
                        })
                    else:
                        print(f"Unknown WebSocket message type: {message_type} from {username}")
                except json.JSONDecodeError as e:
                    print(f"WebSocket JSON decode error from {username}: {str(e)}")

            except asyncio.TimeoutError:
                current_time = asyncio.get_event_loop().time()
                if current_time - last_pong_time > heartbeat_timeout:
                    print(f"WebSocket heartbeat timeout for {username} ({client_id})")
                    await websocket.close(code=1000, reason="Heartbeat timeout")
                    break
                continue

    except WebSocketDisconnect:
        print(f"WebSocket disconnected normally: {username} ({client_id})")
        manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error for {username} ({client_id}): {type(e).__name__}: {str(e)}")
        manager.disconnect(websocket)


if __name__ == "__main__":
    import uvicorn
    print("Initializing database...")
    init_database()
    print("Starting server...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")

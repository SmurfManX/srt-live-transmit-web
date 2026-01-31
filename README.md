# StreamForge

Professional SRT/UDP streaming management platform. Control, monitor and analyze your live streams through a modern web interface.

**StreamForge** - Forge your streams with precision.

## Features

- **Channel Management** - Create, edit, delete and control SRT/UDP streaming channels
- **Real-time Monitoring** - Live statistics, bitrate graphs, RTT, packet loss
- **Stream Analysis** - Video/audio codec detection, resolution, FPS, bitrate
- **Multi-protocol Support** - SRT (listener/caller/rendezvous) and UDP (unicast/multicast)
- **Server Stats** - CPU, RAM, network traffic monitoring in header
- **Encryption** - AES-128/192/256 passphrase encryption support
- **Extra Parameters** - Custom SRT/UDP parameters with preset templates
- **Connection Tracking** - See connected clients in real-time
- **Logs Viewer** - Filter logs by level, time range, search

## Screenshots

### Dashboard
![Dashboard](screenshots/dashboard.png)

### Channel Details
![Channel Details](screenshots/channel-details.png)

### Create Channel
![Create Channel](screenshots/create-channel.png)

### Stream Info
![Stream Info](screenshots/stream-info.png)

### Statistics
![Statistics](screenshots/statistics.png)

## Requirements

- Python 3.10+
- Node.js 18+
- srt-live-transmit (SRT tools)
- ffprobe (for stream analysis)

## Installation

### 1. Clone repository

```bash
git clone https://github.com/yourusername/srt-live-transmit-web.git
cd srt-live-transmit-web
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

### 4. Configuration

Create `.env` file in root directory:

```env
# Backend
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///./srt_manager.db

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Running

### Development

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Production

```bash
# Build frontend
cd frontend
npm run build

# Run with Docker
docker-compose up -d
```

Or use the start script:

```bash
./start_all.sh
```

## Docker

```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/channels | List all channels |
| POST | /api/channels | Create channel |
| PATCH | /api/channels/{name} | Update channel |
| DELETE | /api/channels/{name} | Delete channel |
| POST | /api/channels/{name}/start | Start channel |
| POST | /api/channels/{name}/stop | Stop channel |
| GET | /api/channels/{name}/stats | Get statistics |
| GET | /api/channels/{name}/logs | Get logs |
| GET | /api/channels/{name}/full-info | Get full info |
| GET | /api/system/stats | Server CPU/RAM/Network |

## Channel Configuration

### Input (Source)

| Parameter | Description |
|-----------|-------------|
| Protocol | SRT or UDP |
| IP | Listen/source IP address |
| Port | Listen/source port |
| Mode | listener, caller, rendezvous (SRT) |
| Extra Params | Additional SRT/UDP parameters |

### Output (Destination)

| Parameter | Description |
|-----------|-------------|
| Protocol | SRT or UDP |
| Mode | listener, caller, rendezvous (SRT) |
| Port | Output port |
| Host | Destination host (for caller mode) |
| Extra Params | Additional parameters |

### Extra Parameters Templates

**Input:**
- Default SRT: `rcvbuf=5000000`
- Low Latency: `latency=50,rcvbuf=1000000`
- High Bandwidth: `rcvbuf=10000000,sndbuf=10000000`

**Output:**
- Default SRT: `sndbuf=5000000`
- Low Latency: `latency=50,sndbuf=1000000`
- High Bandwidth: `sndbuf=10000000,maxbw=0`
- UDP Multicast: `ttl=32,mcloop=0`

## Tech Stack

**Backend:**
- FastAPI
- SQLAlchemy
- WebSockets
- Pandas (statistics)
- psutil (system monitoring)

**Frontend:**
- Next.js 14
- React
- Tailwind CSS
- Chart.js
- Zustand (state)

## License

MIT License

## Author

Your Name

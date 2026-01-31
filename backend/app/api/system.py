"""System API router - network interfaces, system info"""

from typing import List
import time
from fastapi import APIRouter, Depends

from ..models.user import User
from ..models.system import NetworkInterface, SystemInfo, ServerStats
from ..core.deps import get_current_active_user
from ..services.network_service import get_network_interfaces, get_local_ip
from ..services.channel_service import load_channels

import os
import psutil

# Store previous network stats for rate calculation
_prev_net_stats = {
    'bytes_sent': 0,
    'bytes_recv': 0,
    'timestamp': time.time()
}

router = APIRouter(prefix="/api", tags=["System"])


@router.get("/system/info", response_model=SystemInfo)
async def get_system_info(current_user: User = Depends(get_current_active_user)):
    """Get system information"""
    channels = load_channels()
    running_count = sum(1 for ch in channels if ch.status == "running")

    return SystemInfo(
        total_channels=len(channels),
        running_channels=running_count,
        stopped_channels=len(channels) - running_count,
        srt_transmit_available=os.system("which srt-live-transmit > /dev/null 2>&1") == 0
    )


@router.get("/system/interfaces", response_model=List[NetworkInterface])
async def get_interfaces(current_user: User = Depends(get_current_active_user)):
    """
    Get available network interfaces.
    Uses ifconfig command, falls back to ip addr if ifconfig is not available.
    """
    return get_network_interfaces()


@router.get("/network/local-ip")
async def get_local_ip_endpoint():
    """Get local IP address for auto-detection - NO AUTHENTICATION REQUIRED"""
    ip = get_local_ip()
    if ip:
        return {"ip": ip}
    return {"ip": None, "error": "Could not determine local IP"}


@router.get("/system/stats", response_model=ServerStats)
async def get_server_stats(current_user: User = Depends(get_current_active_user)):
    """Get server resource usage - CPU, RAM, Network traffic"""
    global _prev_net_stats

    # CPU usage (non-blocking, uses cached value)
    cpu_percent = psutil.cpu_percent(interval=None)

    # Memory usage
    memory = psutil.virtual_memory()
    memory_percent = memory.percent
    memory_used_gb = memory.used / (1024 ** 3)
    memory_total_gb = memory.total / (1024 ** 3)

    # Network usage
    net_io = psutil.net_io_counters()
    current_time = time.time()

    # Calculate rates
    time_delta = current_time - _prev_net_stats['timestamp']
    if time_delta > 0:
        bytes_sent_delta = net_io.bytes_sent - _prev_net_stats['bytes_sent']
        bytes_recv_delta = net_io.bytes_recv - _prev_net_stats['bytes_recv']
        # Convert to Mbps (megabits per second)
        rate_sent_mbps = (bytes_sent_delta * 8) / (time_delta * 1_000_000)
        rate_recv_mbps = (bytes_recv_delta * 8) / (time_delta * 1_000_000)
    else:
        rate_sent_mbps = 0.0
        rate_recv_mbps = 0.0

    # Update previous stats
    _prev_net_stats = {
        'bytes_sent': net_io.bytes_sent,
        'bytes_recv': net_io.bytes_recv,
        'timestamp': current_time
    }

    return ServerStats(
        cpu_percent=round(cpu_percent, 1),
        memory_percent=round(memory_percent, 1),
        memory_used_gb=round(memory_used_gb, 2),
        memory_total_gb=round(memory_total_gb, 2),
        network_bytes_sent=net_io.bytes_sent,
        network_bytes_recv=net_io.bytes_recv,
        network_rate_sent_mbps=round(rate_sent_mbps, 2),
        network_rate_recv_mbps=round(rate_recv_mbps, 2)
    )

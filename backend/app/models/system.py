"""System models for network interfaces and system info"""

from pydantic import BaseModel
from typing import Optional


class NetworkInterface(BaseModel):
    """Network interface information"""
    name: str
    ip: str
    netmask: Optional[str] = None
    mac: Optional[str] = None
    status: str = "up"
    type: str = "IPv4"

    class Config:
        from_attributes = True


class SystemInfo(BaseModel):
    """System information"""
    total_channels: int = 0
    running_channels: int = 0
    stopped_channels: int = 0
    srt_transmit_available: bool = False

    class Config:
        from_attributes = True


class ServerStats(BaseModel):
    """Server resource usage statistics"""
    cpu_percent: float = 0.0
    memory_percent: float = 0.0
    memory_used_gb: float = 0.0
    memory_total_gb: float = 0.0
    network_bytes_sent: int = 0
    network_bytes_recv: int = 0
    network_rate_sent_mbps: float = 0.0
    network_rate_recv_mbps: float = 0.0

    class Config:
        from_attributes = True

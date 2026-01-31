"""Channel models for SRT streaming"""

from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional, List, Dict, Any
import re
import ipaddress


class SourceInput(BaseModel):
    """Input source configuration"""
    protocol: str = "srt"
    ip: str = "0.0.0.0"
    port: int = 9000
    mode: str = "listener"
    priority: int = 1
    interface: Optional[str] = ""
    extra_params: Optional[str] = ""
    passphrase: Optional[str] = ""
    pbkeylen: Optional[int] = 16
    streamid: Optional[str] = ""


class DestinationOutput(BaseModel):
    """Output destination configuration"""
    protocol: str = "srt"
    mode: str = "listener"
    host: str = ""
    port: int = 9100
    multicast_ip: Optional[str] = ""
    adapter: Optional[str] = ""
    ttl: Optional[int] = 32
    interface: Optional[str] = ""
    extra_params: Optional[str] = ""
    passphrase: Optional[str] = ""
    pbkeylen: Optional[int] = 16
    streamid: Optional[str] = ""


class ChannelBase(BaseModel):
    """Base channel configuration"""
    channel_name: str = Field(..., description="Unique channel name")
    input_protocol: str = Field(default="srt", description="Input protocol (udp, srt)")
    input_ip: str = Field(default="0.0.0.0", description="Input IP address")
    input_port: int = Field(default=9000, description="Input port")
    input_mode: str = Field(default="listener", description="SRT mode for input")
    input_interface: Optional[str] = Field(default="", description="Network interface for input")
    input_extra_params: Optional[str] = Field(default="", description="Extra parameters for input")
    input_rcvbuf: int = Field(default=1316000, description="Receive buffer size")
    input_sndbuf: int = Field(default=1316000, description="Send buffer size")
    input_latency: int = Field(default=120, description="Input latency (ms)")

    output_protocol: str = Field(default="srt", description="Output protocol")
    mode: str = Field(default="listener", description="SRT mode for output")
    destination_host: Optional[str] = Field(default="", description="Destination host")
    output_port: int = Field(default=9100, description="Output port")
    output_multicast_ip: Optional[str] = Field(default="", description="Multicast IP for UDP")
    output_interface: Optional[str] = Field(default="", description="Network interface for output")
    output_extra_params: Optional[str] = Field(default="", description="Extra parameters for output")
    output_rcvbuf: int = Field(default=1316000, description="Output receive buffer size")
    output_sndbuf: int = Field(default=1316000, description="Output send buffer size")
    output_latency: int = Field(default=120, description="Output latency (ms)")

    oheadbw: int = Field(default=25, description="Overhead bandwidth (%)")
    maxbw: int = Field(default=-1, description="Maximum bandwidth (-1 for unlimited)")

    # Encryption
    input_passphrase: Optional[str] = Field(default="", description="Input encryption password")
    input_pbkeylen: Optional[int] = Field(default=16, description="Input encryption key length")
    output_passphrase: Optional[str] = Field(default="", description="Output encryption password")
    output_pbkeylen: Optional[int] = Field(default=16, description="Output encryption key length")
    passphrase: Optional[str] = Field(default="", description="Legacy passphrase")
    pbkeylen: Optional[int] = Field(default=16, description="Legacy key length")
    streamid: Optional[str] = Field(default="", description="Stream ID")

    # Additional parameters
    fec_enabled: bool = Field(default=False, description="Enable FEC")
    auto_reconnect: bool = Field(default=True, description="Auto reconnect")
    logo: Optional[str] = Field(default="", description="Logo path")

    # Multiple sources/destinations
    sources: Optional[List[Dict[str, Any]]] = Field(default=None, description="Multiple input sources")
    destinations: Optional[List[Dict[str, Any]]] = Field(default=None, description="Multiple output destinations")

    @field_validator('channel_name')
    @classmethod
    def validate_channel_name(cls, v: str) -> str:
        if not v or len(v) == 0:
            raise ValueError('Channel name cannot be empty')
        if len(v) > 50:
            raise ValueError('Channel name must be 50 characters or less')
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Channel name can only contain letters, numbers, hyphens, and underscores')
        if '..' in v or '/' in v or '\\' in v:
            raise ValueError('Channel name cannot contain path traversal characters')
        return v

    @field_validator('input_port', 'output_port')
    @classmethod
    def validate_port(cls, v: int) -> int:
        if v < 1 or v > 65535:
            raise ValueError(f'Port must be between 1 and 65535, got {v}')
        return v

    @field_validator('input_ip')
    @classmethod
    def validate_input_ip(cls, v: str) -> str:
        if not v or v == "":
            return "0.0.0.0"
        if v == "0.0.0.0":
            return v
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError(f'Invalid IP address format: {v}')

    @field_validator('destination_host')
    @classmethod
    def validate_destination_host(cls, v: Optional[str]) -> Optional[str]:
        if not v or v == "":
            return v
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            if not re.match(r'^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$', v):
                raise ValueError(f'Invalid hostname format: {v}')
            return v

    @field_validator('input_protocol', 'output_protocol')
    @classmethod
    def validate_protocol(cls, v: str) -> str:
        if v not in ['srt', 'udp']:
            raise ValueError(f'Protocol must be "srt" or "udp", got "{v}"')
        return v

    @field_validator('mode', 'input_mode')
    @classmethod
    def validate_mode(cls, v: str) -> str:
        if v not in ['listener', 'caller', 'rendezvous']:
            raise ValueError(f'Mode must be "listener", "caller", or "rendezvous", got "{v}"')
        return v

    @field_validator('passphrase')
    @classmethod
    def validate_passphrase(cls, v: Optional[str]) -> Optional[str]:
        if not v or v == "":
            return v
        if len(v) < 8:
            raise ValueError('Passphrase must be at least 8 characters long')
        if len(v) > 79:
            raise ValueError('Passphrase must be 79 characters or less')
        return v

    @field_validator('input_latency', 'output_latency')
    @classmethod
    def validate_latency(cls, v: int) -> int:
        if v < 20:
            raise ValueError(f'Latency must be at least 20ms, got {v}ms')
        if v > 8000:
            raise ValueError(f'Latency must be 8000ms or less, got {v}ms')
        return v

    @field_validator('oheadbw')
    @classmethod
    def validate_oheadbw(cls, v: int) -> int:
        if v < 5:
            raise ValueError(f'Overhead bandwidth must be at least 5%, got {v}%')
        if v > 100:
            raise ValueError(f'Overhead bandwidth must be 100% or less, got {v}%')
        return v

    @field_validator('output_multicast_ip')
    @classmethod
    def validate_multicast_ip(cls, v: Optional[str]) -> Optional[str]:
        if not v or v == "":
            return v
        try:
            ip = ipaddress.ip_address(v)
            if not ip.is_multicast:
                raise ValueError(f'IP {v} is not in multicast range (224.0.0.0-239.255.255.255)')
            return v
        except ValueError as e:
            raise ValueError(f'Invalid multicast IP: {str(e)}')


class Channel(ChannelBase):
    """Full channel model with status"""
    status: str = Field(default="stopped", description="Channel status")
    start_date: str = Field(default="N/A", description="Start date")
    pid: Optional[int] = Field(default=None, description="Process ID")
    pids: Optional[List[int]] = Field(default=None, description="Process IDs for multiple destinations")
    stats_file: Optional[str] = Field(default="", description="Stats file path")
    error_message: Optional[str] = Field(default="", description="Error message")
    uptime: Optional[int] = Field(default=0, description="Uptime in seconds")


class ChannelUpdate(BaseModel):
    """Channel update model - all fields optional"""
    input_protocol: Optional[str] = None
    input_ip: Optional[str] = None
    input_port: Optional[int] = None
    input_mode: Optional[str] = None
    input_interface: Optional[str] = None
    input_extra_params: Optional[str] = None
    input_rcvbuf: Optional[int] = None
    input_sndbuf: Optional[int] = None
    input_latency: Optional[int] = None
    output_protocol: Optional[str] = None
    mode: Optional[str] = None
    destination_host: Optional[str] = None
    output_port: Optional[int] = None
    output_multicast_ip: Optional[str] = None
    output_interface: Optional[str] = None
    output_extra_params: Optional[str] = None
    output_rcvbuf: Optional[int] = None
    output_sndbuf: Optional[int] = None
    output_latency: Optional[int] = None
    oheadbw: Optional[int] = None
    maxbw: Optional[int] = None
    passphrase: Optional[str] = None
    pbkeylen: Optional[int] = None
    streamid: Optional[str] = None
    fec_enabled: Optional[bool] = None
    auto_reconnect: Optional[bool] = None
    sources: Optional[List[Dict[str, Any]]] = None
    destinations: Optional[List[Dict[str, Any]]] = None

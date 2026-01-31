"""Channel service for managing SRT channels"""

import json
import os
import signal
import subprocess
from datetime import datetime
from pathlib import Path
from typing import List, Optional, Dict, Any
from filelock import FileLock
from ..models.channel import Channel, ChannelBase, ChannelUpdate


# Configuration paths
CONFIG_FILE = Path("config.json")
CONFIG_LOCK = Path("config.json.lock")
STATS_FOLDER = Path("static/stats")
LOGS_FOLDER = Path("static/logs")


def ensure_directories():
    """Ensure required directories exist"""
    STATS_FOLDER.mkdir(parents=True, exist_ok=True)
    LOGS_FOLDER.mkdir(parents=True, exist_ok=True)


def _load_config() -> Dict[str, Any]:
    """Load full config from JSON file"""
    if not CONFIG_FILE.exists():
        return {"channels": [], "users": []}
    try:
        with open(CONFIG_FILE, 'r') as f:
            data = json.load(f)
            # Migration: if config is a list (old format), convert to new format
            if isinstance(data, list):
                return {"channels": data, "users": []}
            return data
    except (json.JSONDecodeError, IOError):
        return {"channels": [], "users": []}


def _save_config(config: Dict[str, Any]):
    """Save full config to JSON file"""
    with FileLock(CONFIG_LOCK):
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2, default=str)


def load_channels() -> List[Channel]:
    """Load channels from config.json"""
    try:
        config = _load_config()
        channels_data = config.get("channels", [])
        return [Channel(**ch) for ch in channels_data]
    except Exception as e:
        print(f"Error loading channels: {e}")
        return []


def save_channels(channels: List[Channel]):
    """Save channels to config.json (preserving users)"""
    config = _load_config()
    config["channels"] = [ch.model_dump() for ch in channels]
    _save_config(config)


def get_channel_by_name(channel_name: str) -> Optional[Channel]:
    """Get a channel by name"""
    channels = load_channels()
    for channel in channels:
        if channel.channel_name == channel_name:
            return channel
    return None


def create_channel(channel_data: ChannelBase) -> Channel:
    """Create a new channel"""
    channels = load_channels()

    # Check if channel with this name already exists
    if any(ch.channel_name == channel_data.channel_name for ch in channels):
        raise ValueError("Channel with this name already exists")

    new_channel = Channel(**channel_data.model_dump())
    channels.append(new_channel)
    save_channels(channels)
    return new_channel


def update_channel(channel_name: str, update: ChannelUpdate) -> Optional[Channel]:
    """Update an existing channel"""
    channels = load_channels()

    for i, channel in enumerate(channels):
        if channel.channel_name == channel_name:
            # Cannot update running channel
            if channel.status == "running":
                raise ValueError("Cannot update running channel. Stop it first.")

            # Update only provided fields
            update_data = update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(channel, key, value)

            channels[i] = channel
            save_channels(channels)
            return channel

    return None


def delete_channel(channel_name: str) -> bool:
    """Delete a channel"""
    channels = load_channels()

    for i, channel in enumerate(channels):
        if channel.channel_name == channel_name:
            # Stop channel if it's running
            if channel.status == "running" and channel.pid:
                try:
                    os.kill(channel.pid, signal.SIGTERM)
                except:
                    pass

            channels.pop(i)
            save_channels(channels)
            return True

    return False


def check_channel_status(channel: Channel) -> Channel:
    """Check and update channel status based on process state"""
    if channel.pid:
        try:
            os.kill(channel.pid, 0)  # Check if process exists
            channel.status = "running"
        except OSError:
            channel.status = "stopped"
            channel.pid = None
    return channel


def sync_channel_statuses():
    """Sync all channel statuses with actual process states"""
    channels = load_channels()
    for channel in channels:
        check_channel_status(channel)
    save_channels(channels)


def stop_channel_process(channel: Channel) -> bool:
    """Stop a channel's process(es)"""
    pids_to_kill = []
    if channel.pids:
        pids_to_kill = channel.pids
    elif channel.pid:
        pids_to_kill = [channel.pid]

    for pid in pids_to_kill:
        try:
            # Kill the entire process group
            os.killpg(os.getpgid(pid), signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            try:
                os.kill(pid, signal.SIGTERM)
            except ProcessLookupError:
                pass

    # Also kill any related srt-live-transmit processes
    try:
        subprocess.run(
            ["pkill", "-f", f"srt-live-transmit.*{channel.channel_name}"],
            shell=False,
            timeout=5
        )
    except:
        pass

    return True


def get_channel_stats_file(channel_name: str) -> Path:
    """Get the stats file path for a channel"""
    sanitized_name = channel_name.replace(' ', '_')
    return STATS_FOLDER / f"{sanitized_name}.csv"


def get_channel_log_file(channel_name: str) -> Path:
    """Get the log file path for a channel"""
    sanitized_name = channel_name.replace(' ', '_')
    return LOGS_FOLDER / f"{sanitized_name}.log"


def get_stream_info(channel: Channel) -> dict:
    """Get stream information using ffprobe"""
    import json as json_module

    # Build input URL based on channel config
    if channel.input_protocol == "udp":
        if channel.input_ip.startswith("2"):  # Multicast
            input_url = f"udp://@{channel.input_ip}:{channel.input_port}"
        else:
            input_url = f"udp://{channel.input_ip}:{channel.input_port}"
    elif channel.input_protocol == "srt":
        mode = channel.input_mode or "listener"
        if mode == "listener":
            input_url = f"srt://0.0.0.0:{channel.input_port}?mode=listener"
        else:
            input_url = f"srt://{channel.input_ip}:{channel.input_port}?mode={mode}"
        if channel.input_passphrase:
            input_url += f"&passphrase={channel.input_passphrase}"
    else:
        input_url = f"{channel.input_protocol}://{channel.input_ip}:{channel.input_port}"

    try:
        # Run ffprobe to get stream info
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            "-analyzeduration", "3000000",  # 3 seconds
            "-probesize", "5000000",  # 5MB
            input_url
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            return {
                "error": "Failed to probe stream",
                "details": result.stderr[:500] if result.stderr else "Unknown error",
                "input_url": input_url
            }

        data = json_module.loads(result.stdout)

        # Parse stream info
        streams = data.get("streams", [])
        format_info = data.get("format", {})

        video_streams = []
        audio_streams = []

        for stream in streams:
            codec_type = stream.get("codec_type", "")

            if codec_type == "video":
                video_info = {
                    "index": stream.get("index", 0),
                    "codec": stream.get("codec_name", "unknown"),
                    "codec_long": stream.get("codec_long_name", ""),
                    "profile": stream.get("profile", ""),
                    "width": stream.get("width", 0),
                    "height": stream.get("height", 0),
                    "resolution": f"{stream.get('width', 0)}x{stream.get('height', 0)}",
                    "fps": eval(stream.get("r_frame_rate", "0/1")) if "/" in str(stream.get("r_frame_rate", "0")) else float(stream.get("r_frame_rate", 0)),
                    "bitrate": int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else None,
                    "pix_fmt": stream.get("pix_fmt", ""),
                    "color_space": stream.get("color_space", ""),
                    "color_range": stream.get("color_range", ""),
                }
                video_streams.append(video_info)

            elif codec_type == "audio":
                audio_info = {
                    "index": stream.get("index", 0),
                    "codec": stream.get("codec_name", "unknown"),
                    "codec_long": stream.get("codec_long_name", ""),
                    "sample_rate": int(stream.get("sample_rate", 0)) if stream.get("sample_rate") else 0,
                    "channels": stream.get("channels", 0),
                    "channel_layout": stream.get("channel_layout", ""),
                    "bitrate": int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else None,
                    "language": stream.get("tags", {}).get("language", ""),
                }
                audio_streams.append(audio_info)

        # Calculate total bitrate
        total_bitrate = int(format_info.get("bit_rate", 0)) if format_info.get("bit_rate") else None

        return {
            "success": True,
            "input_url": input_url,
            "format": format_info.get("format_name", "unknown"),
            "total_bitrate": total_bitrate,
            "total_bitrate_mbps": round(total_bitrate / 1000000, 2) if total_bitrate else None,
            "duration": format_info.get("duration"),
            "video_streams": video_streams,
            "audio_streams": audio_streams,
            "video_count": len(video_streams),
            "audio_count": len(audio_streams),
        }

    except subprocess.TimeoutExpired:
        return {
            "error": "Timeout probing stream",
            "details": "Stream may not be available or is taking too long to respond",
            "input_url": input_url
        }
    except Exception as e:
        return {
            "error": "Failed to get stream info",
            "details": str(e),
            "input_url": input_url
        }

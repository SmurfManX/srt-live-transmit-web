"""Background stream analyzer service"""

import asyncio
import json
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional
import threading

# Global cache for stream info
_stream_info_cache: Dict[str, dict] = {}
_cache_lock = threading.Lock()
_analyzer_task = None

CACHE_FILE = Path("static/stream_info_cache.json")


def get_cached_stream_info(channel_name: str) -> Optional[dict]:
    """Get cached stream info for a channel"""
    with _cache_lock:
        return _stream_info_cache.get(channel_name)


def get_all_cached_stream_info() -> Dict[str, dict]:
    """Get all cached stream info"""
    with _cache_lock:
        return dict(_stream_info_cache)


def analyze_stream_sync(channel: dict) -> dict:
    """Analyze stream using ffprobe - synchronous version"""
    channel_name = channel.get("channel_name", "unknown")

    # For running channels, probe the input stream
    if channel.get("status") != "running":
        return {
            "channel_name": channel_name,
            "status": "offline",
            "error": "Channel not running",
            "last_update": datetime.now().isoformat()
        }

    # Build probe URL - always probe INPUT (more reliable than output)
    input_protocol = channel.get("input_protocol", "udp")
    input_ip = channel.get("input_ip", "0.0.0.0")
    input_port = channel.get("input_port", 9000)
    input_mode = channel.get("input_mode", "listener")

    if input_protocol == "udp":
        # UDP input - check if multicast
        if input_ip.startswith("2"):  # Multicast (224.0.0.0 - 239.255.255.255)
            probe_url = f"udp://@{input_ip}:{input_port}?timeout=3000000&buffer_size=1000000"
        else:
            probe_url = f"udp://{input_ip}:{input_port}?timeout=3000000&buffer_size=1000000"
    elif input_protocol == "srt":
        if input_mode == "listener":
            # SRT listener - we need to connect as caller
            probe_url = f"srt://127.0.0.1:{input_port}?mode=caller&timeout=3000000"
        else:
            # SRT caller - connect to remote
            probe_url = f"srt://{input_ip}:{input_port}?mode=caller&timeout=3000000"
        # Add passphrase if set
        input_passphrase = channel.get("input_passphrase") or channel.get("passphrase")
        if input_passphrase:
            probe_url += f"&passphrase={input_passphrase}"
    else:
        probe_url = f"{input_protocol}://{input_ip}:{input_port}"

    try:
        cmd = [
            "ffprobe",
            "-v", "quiet",
            "-print_format", "json",
            "-show_format",
            "-show_streams",
            "-analyzeduration", "3000000",
            "-probesize", "3000000",
            "-rw_timeout", "5000000",
            probe_url
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=12
        )

        if result.returncode != 0:
            return {
                "channel_name": channel_name,
                "status": "error",
                "error": "Probe failed",
                "probe_url": probe_url,
                "last_update": datetime.now().isoformat()
            }

        data = json.loads(result.stdout)
        streams = data.get("streams", [])
        format_info = data.get("format", {})

        video_streams = []
        audio_streams = []

        for stream in streams:
            codec_type = stream.get("codec_type", "")

            if codec_type == "video":
                fps = 0
                fps_str = stream.get("r_frame_rate", "0/1")
                if "/" in str(fps_str):
                    try:
                        num, den = fps_str.split("/")
                        fps = float(num) / float(den) if float(den) > 0 else 0
                    except:
                        fps = 0
                else:
                    try:
                        fps = float(fps_str)
                    except:
                        fps = 0

                video_streams.append({
                    "index": stream.get("index", 0),
                    "codec": stream.get("codec_name", "unknown"),
                    "profile": stream.get("profile", ""),
                    "width": stream.get("width", 0),
                    "height": stream.get("height", 0),
                    "resolution": f"{stream.get('width', 0)}x{stream.get('height', 0)}",
                    "fps": round(fps, 2),
                    "bitrate": int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else None,
                    "pix_fmt": stream.get("pix_fmt", ""),
                })

            elif codec_type == "audio":
                audio_streams.append({
                    "index": stream.get("index", 0),
                    "codec": stream.get("codec_name", "unknown"),
                    "sample_rate": int(stream.get("sample_rate", 0)) if stream.get("sample_rate") else 0,
                    "channels": stream.get("channels", 0),
                    "channel_layout": stream.get("channel_layout", ""),
                    "bitrate": int(stream.get("bit_rate", 0)) if stream.get("bit_rate") else None,
                    "language": stream.get("tags", {}).get("language", ""),
                })

        total_bitrate = int(format_info.get("bit_rate", 0)) if format_info.get("bit_rate") else None

        return {
            "channel_name": channel_name,
            "status": "online",
            "success": True,
            "probe_url": probe_url,
            "format": format_info.get("format_name", "unknown"),
            "total_bitrate": total_bitrate,
            "total_bitrate_mbps": round(total_bitrate / 1000000, 2) if total_bitrate else None,
            "video_streams": video_streams,
            "audio_streams": audio_streams,
            "video_count": len(video_streams),
            "audio_count": len(audio_streams),
            "last_update": datetime.now().isoformat()
        }

    except subprocess.TimeoutExpired:
        return {
            "channel_name": channel_name,
            "status": "timeout",
            "error": "Analysis timeout",
            "probe_url": probe_url,
            "last_update": datetime.now().isoformat()
        }
    except Exception as e:
        return {
            "channel_name": channel_name,
            "status": "error",
            "error": str(e),
            "last_update": datetime.now().isoformat()
        }


def save_cache():
    """Save cache to file"""
    try:
        CACHE_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(CACHE_FILE, 'w') as f:
            with _cache_lock:
                json.dump(_stream_info_cache, f, indent=2)
    except Exception as e:
        print(f"Error saving stream info cache: {e}")


def load_cache():
    """Load cache from file"""
    global _stream_info_cache
    try:
        if CACHE_FILE.exists():
            with open(CACHE_FILE, 'r') as f:
                with _cache_lock:
                    _stream_info_cache = json.load(f)
    except Exception as e:
        print(f"Error loading stream info cache: {e}")


async def analyze_all_channels():
    """Analyze all running channels"""
    from .channel_service import load_channels

    channels = load_channels()

    for channel in channels:
        if channel.status == "running":
            # Run ffprobe in thread pool to not block
            loop = asyncio.get_event_loop()
            info = await loop.run_in_executor(
                None,
                analyze_stream_sync,
                channel.model_dump()
            )

            with _cache_lock:
                _stream_info_cache[channel.channel_name] = info

    # Clean up stopped channels from cache
    running_names = {ch.channel_name for ch in channels if ch.status == "running"}
    with _cache_lock:
        for name in list(_stream_info_cache.keys()):
            if name not in running_names:
                _stream_info_cache[name]["status"] = "offline"

    save_cache()


async def stream_analyzer_loop(interval: int = 10):
    """Background loop to analyze streams periodically"""
    print(f"Stream analyzer started (interval: {interval}s)")

    while True:
        try:
            await analyze_all_channels()
        except Exception as e:
            print(f"Stream analyzer error: {e}")

        await asyncio.sleep(interval)


def start_analyzer(interval: int = 10):
    """Start the background analyzer task"""
    global _analyzer_task
    load_cache()

    loop = asyncio.get_event_loop()
    _analyzer_task = loop.create_task(stream_analyzer_loop(interval))
    return _analyzer_task


def stop_analyzer():
    """Stop the background analyzer task"""
    global _analyzer_task
    if _analyzer_task:
        _analyzer_task.cancel()
        _analyzer_task = None

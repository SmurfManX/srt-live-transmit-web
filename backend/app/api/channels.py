"""Channels API router - CRUD operations and streaming control"""

import os
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import List, Optional

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File

from ..models.user import User
from ..models.channel import Channel, ChannelBase, ChannelUpdate
from ..core.deps import get_current_active_user
from ..core.websocket import manager
from ..services.channel_service import (
    load_channels, save_channels, get_channel_by_name,
    create_channel as service_create_channel,
    delete_channel as service_delete_channel,
    stop_channel_process, check_channel_status,
    get_channel_stats_file, get_channel_log_file,
    STATS_FOLDER, LOGS_FOLDER
)
from ..services.stream_analyzer import get_cached_stream_info, get_all_cached_stream_info, analyze_stream_sync
from ..services.srt_command_builder import build_secure_srt_command_from_channel, build_srt_command_for_destination
from ..services.srt_stats_service import get_combined_channel_info, get_srt_connections, parse_srt_stats_csv

# Upload folder
UPLOAD_FOLDER = Path("static/uploads")
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

router = APIRouter(prefix="/api/channels", tags=["Channels"])


@router.get("", response_model=List[Channel])
async def get_channels(current_user: User = Depends(get_current_active_user)):
    """Get list of all channels"""
    channels = load_channels()

    # Update channel status by checking if process is running
    for channel in channels:
        check_channel_status(channel)

    save_channels(channels)
    return channels


@router.get("/{channel_name}", response_model=Channel)
async def get_channel(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get information about specific channel"""
    channel = get_channel_by_name(channel_name)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")
    return channel


@router.post("", response_model=Channel, status_code=201)
async def create_channel(
    channel: ChannelBase,
    current_user: User = Depends(get_current_active_user)
):
    """Create new channel"""
    try:
        new_channel = service_create_channel(channel)

        # Broadcast via WebSocket
        await manager.broadcast({
            "type": "channel_created",
            "channel": new_channel.model_dump()
        })

        return new_channel
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/{channel_name}", response_model=Channel)
async def update_channel(
    channel_name: str,
    update: ChannelUpdate,
    current_user: User = Depends(get_current_active_user)
):
    """Update channel"""
    channels = load_channels()

    for i, channel in enumerate(channels):
        if channel.channel_name == channel_name:
            # Cannot update running channel
            if channel.status == "running":
                raise HTTPException(
                    status_code=400,
                    detail="Cannot update running channel. Stop it first."
                )

            # Update only provided fields
            update_data = update.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(channel, key, value)

            channels[i] = channel
            save_channels(channels)

            await manager.broadcast({
                "type": "channel_updated",
                "channel": channel.model_dump()
            })

            return channel

    raise HTTPException(status_code=404, detail="Channel not found")


@router.delete("/{channel_name}")
async def delete_channel(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Delete channel"""
    success = service_delete_channel(channel_name)
    if not success:
        raise HTTPException(status_code=404, detail="Channel not found")

    await manager.broadcast({
        "type": "channel_deleted",
        "channel_name": channel_name
    })

    return {"message": "Channel deleted successfully"}


@router.post("/{channel_name}/start")
async def start_channel(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Start channel"""
    channels = load_channels()

    for i, channel in enumerate(channels):
        if channel.channel_name == channel_name:
            if channel.status == "running":
                raise HTTPException(status_code=400, detail="Channel is already running")

            try:
                # Create stats and log files
                sanitized_name = channel.channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
                stats_file = STATS_FOLDER / f"{sanitized_name}.csv"

                pids = []

                # Check if channel has multiple destinations
                if channel.destinations and len(channel.destinations) > 0:
                    # Build source configuration from channel input settings
                    source = {
                        'protocol': channel.input_protocol,
                        'ip': channel.input_ip,
                        'port': channel.input_port,
                        'mode': channel.input_mode,
                        'passphrase': channel.input_passphrase or channel.passphrase,
                        'pbkeylen': channel.input_pbkeylen or channel.pbkeylen,
                        'extra_params': getattr(channel, 'input_extra_params', ''),
                    }

                    # Start a process for each destination
                    for idx, dest in enumerate(channel.destinations):
                        dest_log_file = LOGS_FOLDER / f"{sanitized_name}_dest{idx}.log"
                        dest_stats_file = STATS_FOLDER / f"{sanitized_name}_dest{idx}.csv"

                        # Build command for this destination
                        cmd = build_srt_command_for_destination(
                            channel.model_dump(),
                            source,
                            dest,
                            dest_stats_file,
                            idx
                        )
                        print(f"Starting destination {idx} with command: {' '.join(cmd)}")

                        # Start process for this destination
                        with open(dest_log_file, 'a') as log_f:
                            process = subprocess.Popen(
                                cmd,
                                shell=False,
                                stdout=log_f,
                                stderr=subprocess.STDOUT,
                                start_new_session=True
                            )
                            pids.append(process.pid)

                    channel.stats_file = str(STATS_FOLDER / f"{sanitized_name}_dest0.csv")
                else:
                    # Single output - use existing logic
                    log_file = LOGS_FOLDER / f"{sanitized_name}.log"

                    # Build secure command
                    cmd = build_secure_srt_command_from_channel(channel, stats_file, log_file)
                    print(f"Starting channel with command: {' '.join(cmd)}")

                    # Start process without shell injection
                    with open(log_file, 'a') as log_f:
                        process = subprocess.Popen(
                            cmd,
                            shell=False,
                            stdout=log_f,
                            stderr=subprocess.STDOUT,
                            start_new_session=True
                        )
                        pids.append(process.pid)

                    channel.stats_file = str(stats_file)

                # Update channel state
                channel.pid = pids[0] if pids else None
                channel.pids = pids
                channel.status = "running"
                channel.start_date = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                channel.error_message = ""

                channels[i] = channel
                save_channels(channels)

                await manager.broadcast({
                    "type": "channel_started",
                    "channel": channel.model_dump()
                })

                return {
                    "message": f"Channel started successfully with {len(pids)} process(es)",
                    "pids": channel.pids
                }

            except Exception as e:
                channel.status = "error"
                channel.error_message = str(e)
                channels[i] = channel
                save_channels(channels)
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to start channel: {str(e)}"
                )

    raise HTTPException(status_code=404, detail="Channel not found")


@router.post("/{channel_name}/stop")
async def stop_channel(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Stop channel"""
    channels = load_channels()

    for i, channel in enumerate(channels):
        if channel.channel_name == channel_name:
            if channel.status != "running":
                raise HTTPException(status_code=400, detail="Channel is not running")

            stop_channel_process(channel)

            channel.pid = None
            channel.pids = None
            channel.status = "stopped"

            channels[i] = channel
            save_channels(channels)

            await manager.broadcast({
                "type": "channel_stopped",
                "channel": channel.model_dump()
            })

            return {"message": "Channel stopped successfully"}

    raise HTTPException(status_code=404, detail="Channel not found")


@router.post("/{channel_name}/restart")
async def restart_channel(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Restart channel"""
    import asyncio
    await stop_channel(channel_name, current_user)
    await asyncio.sleep(1)
    return await start_channel(channel_name, current_user)


@router.get("/stats/all")
async def get_all_channels_stats(
    time_range: Optional[str] = "1h",
    current_user: User = Depends(get_current_active_user)
):
    """Get aggregated statistics for all channels"""
    channels = load_channels()
    result = {
        "channels": [],
        "summary": {
            "total_bandwidth": 0.0,
            "total_packets_sent": 0,
            "total_packets_recv": 0,
            "total_bytes_sent": 0,
            "total_bytes_recv": 0,
            "avg_rtt": 0.0,
            "total_packet_loss": 0
        }
    }

    rtt_values = []

    for channel in channels:
        channel_stats = {
            "channel_name": channel.channel_name,
            "status": channel.status,
            "stats": [],
            "latest": None
        }

        # Try to read stats file
        stats_file = channel.stats_file
        if not stats_file:
            sanitized_name = channel.channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
            stats_file = str(STATS_FOLDER / f"{sanitized_name}.csv")

        if stats_file and os.path.exists(stats_file) and os.path.getsize(stats_file) > 0:
            try:
                df = pd.read_csv(stats_file)
                if not df.empty:
                    # Filter by time range
                    if 'Time' in df.columns:
                        # Keep last N records based on time_range (stats every 5 sec)
                        limits = {'5m': 60, '15m': 180, '30m': 360, '1h': 720, '6h': 4320, '24h': 17280, '7d': 120960}
                        limit = limits.get(time_range, 720)
                        df = df.tail(limit)

                    stats_data = df.to_dict(orient='records')
                    channel_stats["stats"] = stats_data

                    if stats_data:
                        latest = stats_data[-1]
                        channel_stats["latest"] = latest

                        # Aggregate summary
                        result["summary"]["total_bandwidth"] += float(latest.get("mbpsBandwidth", 0) or 0)
                        result["summary"]["total_packets_sent"] += int(latest.get("pktSent", 0) or 0)
                        result["summary"]["total_packets_recv"] += int(latest.get("pktRecv", 0) or 0)
                        result["summary"]["total_bytes_sent"] += int(latest.get("byteSent", 0) or 0)
                        result["summary"]["total_bytes_recv"] += int(latest.get("byteRecv", 0) or 0)
                        result["summary"]["total_packet_loss"] += int(latest.get("pktRcvLoss", 0) or 0)

                        rtt = float(latest.get("msRTT", 0) or 0)
                        if rtt > 0:
                            rtt_values.append(rtt)
            except Exception as e:
                print(f"Error reading stats for {channel.channel_name}: {e}")

        result["channels"].append(channel_stats)

    # Calculate average RTT
    if rtt_values:
        result["summary"]["avg_rtt"] = sum(rtt_values) / len(rtt_values)

    return result


@router.get("/{channel_name}/stats")
async def get_channel_stats(
    channel_name: str,
    time_range: Optional[str] = "all",
    current_user: User = Depends(get_current_active_user)
):
    """Get channel statistics"""
    channel = get_channel_by_name(channel_name)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    stats_file = channel.stats_file
    if not stats_file:
        sanitized_name = channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
        stats_file = str(STATS_FOLDER / f"{sanitized_name}.csv")

    if not stats_file or not os.path.exists(stats_file):
        return {"data": [], "message": "No stats available", "total_records": 0}

    # Check if file is empty
    if os.path.getsize(stats_file) == 0:
        return {"data": [], "message": "No stats collected yet. Start the channel to collect statistics.", "total_records": 0}

    try:
        df = pd.read_csv(stats_file)
        if df.empty:
            return {"data": [], "message": "No stats available", "total_records": 0}

        # Filter by time range (stats collected every 5 seconds)
        if time_range != "all" and 'Time' in df.columns:
            limits = {'5m': 60, '15m': 180, '30m': 360, '1h': 720, '6h': 4320, '24h': 17280, '7d': 120960}
            limit = limits.get(time_range, len(df))
            df = df.tail(limit)

        stats_data = df.to_dict(orient='records')
        return {"data": stats_data, "total_records": len(stats_data)}
    except pd.errors.EmptyDataError:
        return {"data": [], "message": "No stats collected yet", "total_records": 0}
    except Exception as e:
        print(f"Error reading stats for {channel_name}: {e}")
        return {"data": [], "message": f"Error reading stats: {str(e)}", "total_records": 0}


@router.get("/{channel_name}/logs")
async def get_channel_logs(
    channel_name: str,
    lines: int = 100,
    process_idx: Optional[int] = None,
    current_user: User = Depends(get_current_active_user)
):
    """Get channel logs"""
    sanitized_name = channel_name.replace(' ', '_')
    channel = get_channel_by_name(channel_name)

    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    # Determine which log files to read
    log_files = []

    if channel.destinations and len(channel.destinations) > 1:
        if process_idx is not None:
            log_file = LOGS_FOLDER / f"{sanitized_name}_dest{process_idx}.log"
            if log_file.exists():
                log_files.append({"file": log_file, "process_idx": process_idx})
        else:
            for idx in range(len(channel.destinations)):
                log_file = LOGS_FOLDER / f"{sanitized_name}_dest{idx}.log"
                if log_file.exists():
                    log_files.append({"file": log_file, "process_idx": idx})
    else:
        log_file = LOGS_FOLDER / f"{sanitized_name}.log"
        if log_file.exists():
            log_files.append({"file": log_file, "process_idx": 0})

    if not log_files:
        return {
            "logs": [],
            "message": "No logs available",
            "processes": [],
            "has_multiple_processes": False
        }

    try:
        all_logs = []
        process_info = []

        for log_info in log_files:
            log_file = log_info["file"]
            proc_idx = log_info["process_idx"]

            with open(log_file, 'r') as f:
                all_lines = f.readlines()
                recent_lines = all_lines[-lines:] if len(all_lines) > lines else all_lines

                for line in recent_lines:
                    if line.strip():
                        all_logs.append({
                            "process_idx": proc_idx,
                            "text": line.strip(),
                            "timestamp": datetime.now().isoformat()
                        })

            # Add process info
            dest = channel.destinations[proc_idx] if channel.destinations and proc_idx < len(channel.destinations) else None
            if dest:
                process_info.append({
                    "idx": proc_idx,
                    "protocol": dest.get("protocol", "srt"),
                    "mode": dest.get("mode", "listener"),
                    "host": dest.get("host", ""),
                    "port": dest.get("port", 0)
                })
            else:
                process_info.append({
                    "idx": proc_idx,
                    "protocol": channel.output_protocol or "srt",
                    "mode": channel.mode,
                    "host": channel.destination_host or "",
                    "port": channel.output_port
                })

        return {
            "logs": all_logs,
            "processes": process_info,
            "has_multiple_processes": len(log_files) > 1,
            "total_logs": len(all_logs)
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error reading logs: {str(e)}"
        )


@router.post("/{channel_name}/upload-logo")
async def upload_logo(
    channel_name: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """Upload logo for channel"""
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Generate unique filename
    file_extension = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4()}.{file_extension}"
    file_path = UPLOAD_FOLDER / unique_filename

    # Save file
    with open(file_path, 'wb') as f:
        content = await file.read()
        f.write(content)

    # Update channel
    channels = load_channels()
    for i, channel in enumerate(channels):
        if channel.channel_name == channel_name:
            channel.logo = unique_filename
            channels[i] = channel
            save_channels(channels)
            return {"filename": unique_filename, "path": str(file_path)}

    raise HTTPException(status_code=404, detail="Channel not found")


@router.get("/{channel_name}/stream-info")
async def get_channel_stream_info(
    channel_name: str,
    force: bool = False,
    current_user: User = Depends(get_current_active_user)
):
    """Get detailed stream information (codec, bitrate, resolution, tracks)"""
    channel = get_channel_by_name(channel_name)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    if channel.status != "running":
        return {
            "channel_name": channel_name,
            "status": "offline",
            "error": "Channel not running"
        }

    # Try to get from cache first
    if not force:
        cached = get_cached_stream_info(channel_name)
        if cached:
            return cached

    # Analyze stream directly if no cache or forced
    import asyncio
    loop = asyncio.get_event_loop()
    stream_info = await loop.run_in_executor(
        None,
        analyze_stream_sync,
        channel.model_dump()
    )

    return stream_info


@router.get("/stream-info/all")
async def get_all_stream_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get cached stream info for all channels"""
    return get_all_cached_stream_info()


@router.get("/{channel_name}/srt-status")
async def get_srt_status(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get SRT connection status (connected clients, statistics)"""
    channel = get_channel_by_name(channel_name)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    if channel.status != "running":
        return {
            "channel_name": channel_name,
            "status": "offline",
            "connected": False
        }

    # Parse stats file for connection info
    stats_file = channel.stats_file
    if not stats_file:
        sanitized_name = channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
        stats_file = str(STATS_FOLDER / f"{sanitized_name}.csv")

    connected = False
    last_stats = None

    if stats_file and os.path.exists(stats_file) and os.path.getsize(stats_file) > 0:
        try:
            df = pd.read_csv(stats_file)
            if not df.empty:
                last_row = df.iloc[-1]
                connected = True  # If we have stats, someone is connected

                last_stats = {
                    "time": last_row.get("Time", "N/A"),
                    "pktSent": int(last_row.get("pktSent", 0) or 0),
                    "pktRecv": int(last_row.get("pktRecv", 0) or 0),
                    "pktSentLoss": int(last_row.get("pktSentLoss", 0) or 0),
                    "pktRcvLoss": int(last_row.get("pktRcvLoss", 0) or 0),
                    "mbpsBandwidth": float(last_row.get("mbpsBandwidth", 0) or 0),
                    "msRTT": float(last_row.get("msRTT", 0) or 0),
                }
        except Exception as e:
            print(f"Error reading stats for {channel_name}: {e}")

    # Get stream info from cache
    stream_info = get_cached_stream_info(channel_name)

    return {
        "channel_name": channel_name,
        "status": "running",
        "connected": connected,
        "last_stats": last_stats,
        "stream_info": stream_info,
        "output_port": channel.output_port,
        "mode": channel.mode
    }


@router.get("/{channel_name}/full-info")
async def get_channel_full_info(
    channel_name: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Get comprehensive channel information:
    - SRT statistics (bitrate, RTT, packet loss, retransmits)
    - Media info (resolution, codec, fps, audio tracks)
    - Connection info (remote clients, connection state)
    - Process info (PIDs, uptime)
    """
    channel = get_channel_by_name(channel_name)
    if not channel:
        raise HTTPException(status_code=404, detail="Channel not found")

    result = {
        "channel_name": channel_name,
        "status": channel.status,
        "pid": channel.pid,
        "pids": channel.pids,
        "start_date": channel.start_date,
        "timestamp": datetime.now().isoformat(),

        # Configuration
        "input": {
            "protocol": channel.input_protocol,
            "ip": channel.input_ip,
            "port": channel.input_port,
            "mode": channel.input_mode,
            "latency": channel.input_latency,
        },
        "output": {
            "protocol": getattr(channel, 'output_protocol', 'srt'),
            "port": channel.output_port,
            "mode": channel.mode,
            "latency": channel.output_latency,
            "destinations": [d.model_dump() if hasattr(d, 'model_dump') else d for d in (channel.destinations or [])],
        },

        # Stats
        "srt_stats": None,
        "media_info": None,
        "connections": [],
    }

    if channel.status != "running":
        return result

    # Get SRT stats from CSV
    stats_file = channel.stats_file
    if not stats_file:
        sanitized_name = channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
        stats_file = str(STATS_FOLDER / f"{sanitized_name}.csv")

    if stats_file and os.path.exists(stats_file):
        stats = parse_srt_stats_csv(Path(stats_file))
        if stats:
            result["srt_stats"] = stats

    # Get media info
    stream_info = get_cached_stream_info(channel_name)
    if stream_info and stream_info.get("success"):
        result["media_info"] = {
            "format": stream_info.get("format"),
            "total_bitrate_mbps": stream_info.get("total_bitrate_mbps"),
            "video_streams": stream_info.get("video_streams", []),
            "audio_streams": stream_info.get("audio_streams", []),
        }

    # Get active connections
    all_connections = get_srt_connections()
    pids = channel.pids or ([channel.pid] if channel.pid else [])
    result["connections"] = [c for c in all_connections if c.get("pid") in pids]

    return result


@router.get("/analytics/summary")
async def get_analytics_summary(
    current_user: User = Depends(get_current_active_user)
):
    """
    Get analytics summary for dashboard:
    - Total channels, running, stopped
    - Total bandwidth
    - Total packet loss
    - Average RTT
    - Per-channel quick stats
    """
    channels = load_channels()

    summary = {
        "total_channels": len(channels),
        "running": 0,
        "stopped": 0,
        "total_bandwidth_mbps": 0.0,
        "total_send_rate_mbps": 0.0,
        "total_recv_rate_mbps": 0.0,
        "total_packet_loss": 0,
        "avg_rtt_ms": 0.0,
        "channels": []
    }

    rtt_values = []

    for channel in channels:
        check_channel_status(channel)

        ch_info = {
            "name": channel.channel_name,
            "status": channel.status,
            "pid": channel.pid,
            "pids": channel.pids,
            "start_date": channel.start_date,
            "srt_stats": None,
            "media_info": None,
            "connections": [],
        }

        if channel.status == "running":
            summary["running"] += 1

            # Get SRT stats
            stats_file = channel.stats_file
            if not stats_file:
                sanitized_name = channel.channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
                stats_file = str(STATS_FOLDER / f"{sanitized_name}.csv")

            if stats_file and os.path.exists(stats_file):
                stats = parse_srt_stats_csv(Path(stats_file))
                if stats:
                    ch_info["srt_stats"] = {
                        "bandwidth_mbps": stats.get("bandwidth_mbps", 0),
                        "send_rate_mbps": stats.get("send_rate_mbps", 0),
                        "recv_rate_mbps": stats.get("recv_rate_mbps", 0),
                        "rtt_ms": stats.get("rtt_ms", 0),
                        "packets_lost": stats.get("packets_lost_recv", 0) + stats.get("packets_lost_send", 0),
                    }

                    summary["total_bandwidth_mbps"] += stats.get("bandwidth_mbps", 0)
                    summary["total_send_rate_mbps"] += stats.get("send_rate_mbps", 0)
                    summary["total_recv_rate_mbps"] += stats.get("recv_rate_mbps", 0)
                    summary["total_packet_loss"] += stats.get("packets_lost_recv", 0) + stats.get("packets_lost_send", 0)

                    if stats.get("rtt_ms", 0) > 0:
                        rtt_values.append(stats["rtt_ms"])

            # Get media info
            stream_info = get_cached_stream_info(channel.channel_name)
            if stream_info and stream_info.get("success"):
                ch_info["media_info"] = {
                    "resolution": stream_info.get("video_streams", [{}])[0].get("resolution") if stream_info.get("video_streams") else None,
                    "bitrate_mbps": stream_info.get("total_bitrate_mbps"),
                }

            # Get connections from SRT log file (more reliable than ss for SRT)
            sanitized_name = channel.channel_name.replace(' ', '_').replace('/', '_').replace('\\', '_')
            log_file = LOGS_FOLDER / f"{sanitized_name}.log"

            if log_file.exists():
                try:
                    import re
                    with open(log_file, 'r') as f:
                        log_content = f.read()

                    # Find the last "Accepted SRT target connection" and track active connections
                    # Pattern: "request from: IP:PORT"
                    connection_pattern = r'request from: (\d+\.\d+\.\d+\.\d+):(\d+)'
                    disconnect_pattern = r'SRT target disconnected'

                    lines = log_content.split('\n')
                    active_clients = {}

                    for line in lines:
                        # Check for new connection
                        match = re.search(connection_pattern, line)
                        if match:
                            ip = match.group(1)
                            port = match.group(2)
                            active_clients[ip] = {"ip": ip, "port": int(port)}

                        # Check for disconnection (clears all - simplified logic)
                        if disconnect_pattern in line:
                            active_clients = {}

                    # Add active clients to connections
                    for client_ip, client_info in active_clients.items():
                        ch_info["connections"].append({
                            "remote_ip": client_info["ip"],
                            "remote_port": client_info["port"],
                            "local_port": channel.output_port,
                            "direction": "output",
                            "state": "ESTAB"
                        })
                except Exception as e:
                    print(f"Error parsing SRT log for connections: {e}")
        else:
            summary["stopped"] += 1

        summary["channels"].append(ch_info)

    if rtt_values:
        summary["avg_rtt_ms"] = round(sum(rtt_values) / len(rtt_values), 2)

    return summary

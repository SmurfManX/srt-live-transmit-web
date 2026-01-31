"""
SRT Command Builder - Secure command construction without shell injection
"""
import re
from pathlib import Path
from typing import List, Optional
from urllib.parse import quote


def is_valid_srt_url(url: str) -> bool:
    """
    Validate SRT/UDP URL format

    Allowed formats:
    - srt://host:port
    - udp://host:port
    - srt://:port (listener mode)
    - srt://host:port?streamid=xxx&passphrase=xxx
    - udp://host:port?adapter=192.168.1.1&ttl=32
    """
    # Simple validation - protocol must be srt or udp
    if not url.startswith(('srt://', 'udp://')):
        return False

    # Basic format check - allow dots in query params for IP addresses
    pattern = r'^(srt|udp)://[\w\.-]*(:\d+)?(\?[\w=&%\.\-:,]*)?$'
    return bool(re.match(pattern, url))


def sanitize_path(path: Path) -> Path:
    """
    Ensure path is safe and absolute
    """
    return path.resolve()


def build_srt_command(
    input_url: str,
    output_url: str,
    stats_file: Path,
    log_file: Optional[Path] = None,
    additional_options: Optional[List[str]] = None
) -> List[str]:
    """
    Build SRT command as argument list (NO shell injection possible)

    Args:
        input_url: Input SRT/UDP URL
        output_url: Output SRT/UDP URL
        stats_file: Path to stats CSV file
        log_file: Optional path to log file
        additional_options: Optional list of additional command options

    Returns:
        Command as list of arguments (safe for subprocess.Popen without shell=True)

    Raises:
        ValueError: If URLs are invalid or paths are unsafe
    """
    # Validate URLs
    if not is_valid_srt_url(input_url):
        raise ValueError(f"Invalid input URL format: {input_url}")

    if not is_valid_srt_url(output_url):
        raise ValueError(f"Invalid output URL format: {output_url}")

    # Sanitize paths
    safe_stats_file = sanitize_path(stats_file)

    # Build command as list (NO shell=True!)
    command = [
        "srt-live-transmit",
        input_url,
        output_url,
        "-s", "5000",
        "-stats-report-frequency:5000",
        "-statspf:csv",
        f"-statsout:{safe_stats_file}"
    ]

    # Add additional options if provided
    if additional_options:
        command.extend(additional_options)

    return command


def build_srt_command_from_channel(channel_data: dict, stats_file: Path) -> List[str]:
    """
    Build SRT command from channel configuration

    Args:
        channel_data: Channel configuration dictionary
        stats_file: Path to stats file

    Returns:
        Command as list of arguments
    """
    # Build input URL
    input_protocol = channel_data.get('input_protocol', 'srt')
    input_ip = channel_data.get('input_ip', '0.0.0.0')
    input_port = channel_data.get('input_port', 9000)
    input_mode = channel_data.get('input_mode', 'listener')

    input_url = f"{input_protocol}://{input_ip}:{input_port}"

    # Add SRT options to input URL
    if input_protocol == 'srt':
        params = []
        if input_mode:
            params.append(f"mode={input_mode}")
        if channel_data.get('passphrase'):
            params.append(f"passphrase={channel_data['passphrase']}")
        if channel_data.get('pbkeylen'):
            params.append(f"pbkeylen={channel_data['pbkeylen']}")
        if channel_data.get('streamid'):
            params.append(f"streamid={channel_data['streamid']}")

        if params:
            input_url += "?" + "&".join(params)

    # Build output URL
    output_protocol = channel_data.get('output_protocol', 'srt')
    mode = channel_data.get('mode', 'listener')
    destination_host = channel_data.get('destination_host', '')
    output_port = channel_data.get('output_port', 9100)

    if mode == 'listener':
        output_url = f"{output_protocol}://0.0.0.0:{output_port}"
    else:  # caller or rendezvous
        output_url = f"{output_protocol}://{destination_host}:{output_port}"

    # Add SRT options to output URL
    if output_protocol == 'srt':
        params = []
        params.append(f"mode={mode}")
        if channel_data.get('passphrase'):
            params.append(f"passphrase={channel_data['passphrase']}")
        if channel_data.get('pbkeylen'):
            params.append(f"pbkeylen={channel_data['pbkeylen']}")
        if channel_data.get('streamid'):
            params.append(f"streamid={channel_data['streamid']}")

        if params:
            output_url += "?" + "&".join(params)

    return build_srt_command(input_url, output_url, stats_file)


def build_srt_command_for_destination(
    channel_data: dict,
    source: dict,
    destination: dict,
    stats_file: Path,
    index: int = 0
) -> List[str]:
    """
    Build SRT command for specific source-destination pair

    Args:
        channel_data: Channel configuration
        source: Source configuration
        destination: Destination configuration
        stats_file: Path to stats file
        index: Index for multiple sources/destinations

    Returns:
        Command as list of arguments
    """
    # Build input URL from source
    input_protocol = source.get('protocol', 'srt')
    input_ip = source.get('ip', '0.0.0.0')
    input_port = source.get('port', 9000)
    input_mode = source.get('mode', 'listener')

    input_url = f"{input_protocol}://{input_ip}:{input_port}"

    # Add SRT parameters for INPUT (use source-specific security with fallback)
    if input_protocol == 'srt':
        params = [f"mode={input_mode}"]

        # Priority: source.passphrase > channel.input_passphrase > channel.passphrase
        source_passphrase = source.get('passphrase') or channel_data.get('input_passphrase') or channel_data.get('passphrase')
        source_pbkeylen = source.get('pbkeylen') or channel_data.get('input_pbkeylen') or channel_data.get('pbkeylen', 16)
        source_streamid = source.get('streamid') or channel_data.get('streamid')

        if source_passphrase:
            # URL encode passphrase to prevent injection
            encoded_pass = quote(source_passphrase, safe='')
            params.append(f"passphrase={encoded_pass}")
            params.append(f"pbkeylen={source_pbkeylen}")
        if source_streamid:
            # URL encode streamid to prevent injection
            encoded_streamid = quote(source_streamid, safe='')
            params.append(f"streamid={encoded_streamid}")

        # Add input extra params from source
        source_extra_params = source.get('extra_params', '') or channel_data.get('input_extra_params', '')
        if source_extra_params:
            for param in source_extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)

        input_url += "?" + "&".join(params)
    else:
        # UDP input - add extra params
        params = []
        source_extra_params = source.get('extra_params', '') or channel_data.get('input_extra_params', '')
        if source_extra_params:
            for param in source_extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)
        if params:
            input_url += "?" + "&".join(params)

    # Build output URL from destination
    output_protocol = destination.get('protocol', 'srt')
    output_mode = destination.get('mode', 'caller')
    output_host = destination.get('host', 'localhost')
    output_port = destination.get('port', 9100)

    if output_protocol == 'udp':
        # UDP output
        multicast_ip = destination.get('multicast_ip', '')
        if multicast_ip:
            output_url = f"udp://{multicast_ip}:{output_port}"
        elif output_host:
            output_url = f"udp://{output_host}:{output_port}"
        else:
            output_url = f"udp://:{output_port}"

        # Build UDP parameters according to official srt-live-transmit documentation
        params = []

        # Add adapter parameter for local interface (multicast only, uses IP_MULTICAST_IF)
        # This is the correct parameter according to official docs
        output_adapter = destination.get('adapter', '')
        if output_adapter and multicast_ip:
            params.append(f"adapter={output_adapter}")

        # Add TTL parameter (IP_TTL for unicast, IP_MULTICAST_TTL for multicast)
        output_ttl = destination.get('ttl', 0)
        if output_ttl > 0:
            params.append(f"ttl={output_ttl}")

        # Add Type-Of-Service parameter (IP_TOS socket option)
        output_iptos = destination.get('iptos', '')
        if output_iptos:
            params.append(f"iptos={output_iptos}")

        # Add multicast loop parameter (IP_MULTICAST_LOOP, multicast only)
        if multicast_ip and 'mcloop' in destination:
            mcloop = destination.get('mcloop', 1)
            params.append(f"mcloop={mcloop}")

        # Add buffer sizes (SO_RCVBUF, SO_SNDBUF)
        output_sndbuf = destination.get('sndbuf', 0)
        if output_sndbuf > 0:
            params.append(f"sndbuf={output_sndbuf}")

        output_rcvbuf = destination.get('rcvbuf', 0)
        if output_rcvbuf > 0:
            params.append(f"rcvbuf={output_rcvbuf}")

        # Add extra UDP parameters from extra_params field
        # This allows users to add custom parameters
        extra_params = destination.get('extra_params', '')
        if extra_params:
            # Parse and add extra params (e.g., "pkt_size=1316")
            for param in extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)

        if params:
            output_url += "?" + "&".join(params)
    else:
        # SRT output
        if output_mode == 'listener':
            output_url = f"srt://0.0.0.0:{output_port}"
        else:
            output_url = f"srt://{output_host}:{output_port}"

        # Add SRT parameters for OUTPUT (use destination-specific security with fallback)
        params = [f"mode={output_mode}"]

        # Priority: dest.passphrase > channel.output_passphrase > channel.passphrase
        dest_passphrase = destination.get('passphrase') or channel_data.get('output_passphrase') or channel_data.get('passphrase')
        dest_pbkeylen = destination.get('pbkeylen') or channel_data.get('output_pbkeylen') or channel_data.get('pbkeylen', 16)
        dest_streamid = destination.get('streamid') or channel_data.get('streamid')

        if dest_passphrase:
            # URL encode passphrase to prevent injection
            encoded_pass = quote(dest_passphrase, safe='')
            params.append(f"passphrase={encoded_pass}")
            params.append(f"pbkeylen={dest_pbkeylen}")
        if dest_streamid:
            # URL encode streamid to prevent injection
            encoded_streamid = quote(dest_streamid, safe='')
            params.append(f"streamid={encoded_streamid}")

        # Add extra params from destination or channel
        dest_extra_params = destination.get('extra_params', '') or channel_data.get('output_extra_params', '')
        if dest_extra_params:
            for param in dest_extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)

        output_url += "?" + "&".join(params)

    # Use unique stats file for each process
    unique_stats_file = stats_file.parent / f"{stats_file.stem}_{index}{stats_file.suffix}"

    return build_srt_command(input_url, output_url, unique_stats_file)


def build_secure_srt_command_from_channel(channel, stats_file: Path, log_file: Path) -> List[str]:
    """
    Build secure SRT command from Channel model with ALL parameters
    FIXES: Command injection, latency bug, buffer size bug, adds FEC and auto-reconnect

    Args:
        channel: Channel Pydantic model with all attributes
        stats_file: Path to stats CSV file
        log_file: Path to log file

    Returns:
        Command as list of arguments (safe for subprocess with shell=False)
    """
    # Build input URL
    if channel.input_protocol == "srt":
        params = []
        params.append(f"mode={channel.input_mode}")

        # Add input latency
        params.append(f"latency={channel.input_latency}")

        # Add encryption on input if needed
        if channel.passphrase:
            encoded_pass = quote(channel.passphrase, safe='')
            params.append(f"passphrase={encoded_pass}")
            params.append(f"pbkeylen={channel.pbkeylen}")

        # Add streamid on input if needed
        if channel.streamid:
            encoded_streamid = quote(channel.streamid, safe='')
            params.append(f"streamid={encoded_streamid}")

        # Add input extra params
        if hasattr(channel, 'input_extra_params') and channel.input_extra_params:
            for param in channel.input_extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)

        input_url = f"{channel.input_protocol}://{channel.input_ip}:{channel.input_port}?{'&'.join(params)}"
    else:
        # UDP input
        params = []
        if hasattr(channel, 'input_interface') and channel.input_interface:
            params.append(f"iface={channel.input_interface}")

        # Add input extra params for UDP as well
        if hasattr(channel, 'input_extra_params') and channel.input_extra_params:
            for param in channel.input_extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)

        input_url = f"{channel.input_protocol}://{channel.input_ip}:{channel.input_port}?{'&'.join(params)}"

    # Build output URL
    output_protocol = getattr(channel, 'output_protocol', 'srt')

    if output_protocol == 'udp':
        # UDP output according to official srt-live-transmit documentation
        multicast_ip = getattr(channel, 'output_multicast_ip', '')
        if multicast_ip:
            output_url = f"udp://{multicast_ip}:{channel.output_port}"
        elif channel.destination_host:
            output_url = f"udp://{channel.destination_host}:{channel.output_port}"
        else:
            output_url = f"udp://:{channel.output_port}"

        # Build UDP parameters
        params = []

        # Add adapter for multicast (IP_MULTICAST_IF)
        if multicast_ip and hasattr(channel, 'output_adapter') and channel.output_adapter:
            params.append(f"adapter={channel.output_adapter}")

        # Add TTL (IP_TTL or IP_MULTICAST_TTL)
        if hasattr(channel, 'output_ttl') and channel.output_ttl and channel.output_ttl > 0:
            params.append(f"ttl={channel.output_ttl}")

        # Add Type-Of-Service (IP_TOS)
        if hasattr(channel, 'output_iptos') and channel.output_iptos:
            params.append(f"iptos={channel.output_iptos}")

        # Add multicast loop (IP_MULTICAST_LOOP)
        if multicast_ip and hasattr(channel, 'output_mcloop'):
            params.append(f"mcloop={channel.output_mcloop}")

        # Add buffer sizes only if explicitly set (different from default)
        if hasattr(channel, 'output_sndbuf') and channel.output_sndbuf > 0 and channel.output_sndbuf != 1316000:
            params.append(f"sndbuf={channel.output_sndbuf}")
        if hasattr(channel, 'output_rcvbuf') and channel.output_rcvbuf > 0 and channel.output_rcvbuf != 1316000:
            params.append(f"rcvbuf={channel.output_rcvbuf}")

        # Add extra params from extra_params field
        if hasattr(channel, 'output_extra_params') and channel.output_extra_params:
            for param in channel.output_extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)

        if params:
            output_url += "?" + "&".join(params)
    else:
        # SRT output
        if channel.mode == 'listener':
            output_url = f"srt://:{channel.output_port}"
        elif channel.mode == 'rendezvous':
            output_url = f"srt://{channel.destination_host}:{channel.output_port}"
        else:  # caller
            output_url = f"srt://{channel.destination_host}:{channel.output_port}"

        params = [f"mode={channel.mode}"]

        # FIX: Latency bug - compare against actual default (120) not 2000
        if channel.output_latency != 120:
            params.append(f"latency={channel.output_latency}")

        # Add bandwidth parameters
        if channel.oheadbw != 25:
            params.append(f"oheadbw={channel.oheadbw}")
        if channel.maxbw != -1:
            params.append(f"maxbw={channel.maxbw}")

        # FIX: Buffer size bug - compare against actual default (1316000) not 61432500
        if channel.output_sndbuf != 1316000:
            params.append(f"sndbuf={channel.output_sndbuf}")
        if channel.output_rcvbuf != 1316000:
            params.append(f"rcvbuf={channel.output_rcvbuf}")

        # Encryption with URL encoding
        if channel.passphrase:
            encoded_pass = quote(channel.passphrase, safe='')
            params.append(f"passphrase={encoded_pass}")
            params.append(f"pbkeylen={channel.pbkeylen}")

        # Stream ID with URL encoding
        if channel.streamid:
            encoded_streamid = quote(channel.streamid, safe='')
            params.append(f"streamid={encoded_streamid}")

        # FIX: Add FEC support (was defined but never used)
        if hasattr(channel, 'fec_enabled') and channel.fec_enabled:
            params.append("fec=1")

        # Add extra params from output_extra_params field
        if hasattr(channel, 'output_extra_params') and channel.output_extra_params:
            for param in channel.output_extra_params.split(','):
                param = param.strip()
                if param and '=' in param:
                    params.append(param)

        output_url += "?" + "&".join(params)

    # Build command as argument list (NO shell=True needed!)
    command = [
        "srt-live-transmit",
        input_url,
        output_url,
        "-s", "5000",
        "-stats-report-frequency:5000",
        "-statspf:csv",
        f"-statsout:{stats_file}"
    ]

    # FIX: Add auto-reconnect flag (was defined but never used)
    if hasattr(channel, 'auto_reconnect') and channel.auto_reconnect:
        command.append("-a")

    # Add loglevel control
    command.extend(["-loglevel", "info"])

    return command

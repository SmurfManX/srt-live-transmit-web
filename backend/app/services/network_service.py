"""Network service for getting network interfaces using ifconfig"""

import subprocess
import re
import socket
from typing import List, Optional
from ..models.system import NetworkInterface


def parse_ifconfig_output(output: str) -> List[NetworkInterface]:
    """Parse ifconfig output and extract interface information"""
    interfaces = []
    current_interface = None
    current_data = {}

    for line in output.split('\n'):
        # New interface starts (e.g., "eth0: flags=..." or "eth0      Link encap:...")
        iface_match = re.match(r'^(\S+?)[:|\s]', line)
        if iface_match and not line.startswith(' ') and not line.startswith('\t'):
            # Save previous interface if exists
            if current_interface and current_data.get('ip'):
                interfaces.append(NetworkInterface(
                    name=current_interface,
                    ip=current_data.get('ip', ''),
                    netmask=current_data.get('netmask'),
                    mac=current_data.get('mac'),
                    status=current_data.get('status', 'up'),
                    type="IPv4"
                ))

            current_interface = iface_match.group(1)
            current_data = {'status': 'down'}

            # Check if UP flag is present
            if 'UP' in line or '<UP' in line:
                current_data['status'] = 'up'

        # Parse inet/inet addr line for IPv4
        inet_match = re.search(r'inet\s+(?:addr:)?(\d+\.\d+\.\d+\.\d+)', line)
        if inet_match:
            ip = inet_match.group(1)
            if ip != '127.0.0.1':  # Skip loopback
                current_data['ip'] = ip

        # Parse netmask
        netmask_match = re.search(r'(?:netmask\s+|Mask:)(\d+\.\d+\.\d+\.\d+)', line)
        if netmask_match:
            current_data['netmask'] = netmask_match.group(1)

        # Parse MAC address (ether or HWaddr)
        mac_match = re.search(r'(?:ether|HWaddr)\s+([0-9a-fA-F:]+)', line)
        if mac_match:
            current_data['mac'] = mac_match.group(1)

        # Check for UP status in flags
        if 'flags=' in line and 'UP' in line:
            current_data['status'] = 'up'

    # Don't forget the last interface
    if current_interface and current_data.get('ip'):
        interfaces.append(NetworkInterface(
            name=current_interface,
            ip=current_data.get('ip', ''),
            netmask=current_data.get('netmask'),
            mac=current_data.get('mac'),
            status=current_data.get('status', 'up'),
            type="IPv4"
        ))

    return interfaces


def parse_ip_addr_output(output: str) -> List[NetworkInterface]:
    """Parse 'ip addr' output and extract interface information"""
    interfaces = []
    current_interface = None
    current_data = {}

    for line in output.split('\n'):
        # New interface starts (e.g., "2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP>")
        iface_match = re.match(r'^\d+:\s+(\S+?)[@:]', line)
        if iface_match:
            # Save previous interface if exists
            if current_interface and current_data.get('ip'):
                interfaces.append(NetworkInterface(
                    name=current_interface,
                    ip=current_data.get('ip', ''),
                    netmask=current_data.get('netmask'),
                    mac=current_data.get('mac'),
                    status=current_data.get('status', 'up'),
                    type="IPv4"
                ))

            current_interface = iface_match.group(1)
            current_data = {'status': 'down'}

            # Check if UP flag is present
            if '<' in line and 'UP' in line:
                current_data['status'] = 'up'

        # Parse inet line for IPv4 (e.g., "inet 192.168.1.100/24")
        inet_match = re.search(r'inet\s+(\d+\.\d+\.\d+\.\d+)(?:/(\d+))?', line)
        if inet_match:
            ip = inet_match.group(1)
            if ip != '127.0.0.1':  # Skip loopback
                current_data['ip'] = ip
                # Convert CIDR to netmask if present
                if inet_match.group(2):
                    cidr = int(inet_match.group(2))
                    current_data['netmask'] = cidr_to_netmask(cidr)

        # Parse MAC address (link/ether)
        mac_match = re.search(r'link/ether\s+([0-9a-fA-F:]+)', line)
        if mac_match:
            current_data['mac'] = mac_match.group(1)

    # Don't forget the last interface
    if current_interface and current_data.get('ip'):
        interfaces.append(NetworkInterface(
            name=current_interface,
            ip=current_data.get('ip', ''),
            netmask=current_data.get('netmask'),
            mac=current_data.get('mac'),
            status=current_data.get('status', 'up'),
            type="IPv4"
        ))

    return interfaces


def cidr_to_netmask(cidr: int) -> str:
    """Convert CIDR notation to netmask"""
    mask = (0xffffffff >> (32 - cidr)) << (32 - cidr)
    return f"{(mask >> 24) & 0xff}.{(mask >> 16) & 0xff}.{(mask >> 8) & 0xff}.{mask & 0xff}"


def get_network_interfaces() -> List[NetworkInterface]:
    """
    Get list of network interfaces using ifconfig or ip addr.
    Tries ifconfig first, falls back to ip addr if not available.
    """
    interfaces = []

    # Try ifconfig first
    try:
        result = subprocess.run(
            ['ifconfig'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0 and result.stdout:
            interfaces = parse_ifconfig_output(result.stdout)
            if interfaces:
                return interfaces
    except FileNotFoundError:
        pass  # ifconfig not available, try ip addr
    except subprocess.TimeoutExpired:
        pass
    except Exception as e:
        print(f"Error running ifconfig: {e}")

    # Fallback to ip addr
    try:
        result = subprocess.run(
            ['ip', 'addr'],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode == 0 and result.stdout:
            interfaces = parse_ip_addr_output(result.stdout)
            if interfaces:
                return interfaces
    except FileNotFoundError:
        pass
    except subprocess.TimeoutExpired:
        pass
    except Exception as e:
        print(f"Error running ip addr: {e}")

    # Last resort: use socket to get default interface
    try:
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        if ip and ip != '127.0.0.1':
            interfaces.append(NetworkInterface(
                name="default",
                ip=ip,
                type="IPv4"
            ))
    except Exception:
        pass

    return interfaces


def get_local_ip() -> Optional[str]:
    """Get the primary local IP address"""
    try:
        # Create a socket and connect to external address
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        try:
            hostname = socket.gethostname()
            return socket.gethostbyname(hostname)
        except Exception:
            return None

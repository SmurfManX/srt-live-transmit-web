export interface SourceInput {
  protocol: 'udp' | 'srt'
  ip: string
  port: number
  mode?: 'listener' | 'caller' | 'rendezvous'
  priority?: number
  interface?: string
  extra_params?: string
  // Per-source security settings
  passphrase?: string
  pbkeylen?: 16 | 24 | 32
  streamid?: string
}

export interface DestinationOutput {
  protocol?: 'udp' | 'srt'
  mode: 'listener' | 'caller' | 'rendezvous'
  host: string
  port: number
  multicast_ip?: string
  // UDP-specific parameters (per official srt-live-transmit documentation)
  adapter?: string    // Local interface IP for multicast (uses IP_MULTICAST_IF)
  ttl?: number        // Time-to-live for packets (IP_TTL or IP_MULTICAST_TTL)
  iptos?: string      // IP Type-Of-Service field (IP_TOS)
  mcloop?: number     // Multicast loop (IP_MULTICAST_LOOP, 0 or 1)
  sndbuf?: number     // Send buffer size (SO_SNDBUF)
  rcvbuf?: number     // Receive buffer size (SO_RCVBUF)
  interface?: string  // Legacy field, kept for compatibility
  extra_params?: string
  // Per-destination security settings (SRT only)
  passphrase?: string
  pbkeylen?: 16 | 24 | 32
  streamid?: string
}

export interface Channel {
  channel_name: string
  input_protocol: 'udp' | 'srt'
  input_ip: string
  input_port: number
  input_mode?: 'listener' | 'caller' | 'rendezvous'
  input_interface?: string
  input_extra_params?: string
  input_latency?: number  // FIXED: Missing field causing TypeScript compilation error
  input_rcvbuf?: number
  input_sndbuf?: number
  output_protocol?: 'udp' | 'srt'
  mode: 'listener' | 'caller' | 'rendezvous'
  output_port: number
  output_latency?: number
  output_rcvbuf?: number
  output_sndbuf?: number
  destination_host?: string
  output_multicast_ip?: string
  output_interface?: string
  output_extra_params?: string
  // Separate encryption for input and output
  input_passphrase?: string
  input_pbkeylen?: 16 | 24 | 32
  output_passphrase?: string
  output_pbkeylen?: 16 | 24 | 32
  // Legacy fields (backward compatibility)
  passphrase?: string
  pbkeylen?: 16 | 24 | 32
  streamid?: string
  latency?: number  // Deprecated, kept for backwards compatibility
  oheadbw?: number
  maxbw?: number
  fec?: string
  fec_enabled?: boolean  // FIXED: Added for FEC support
  auto_reconnect?: boolean
  status: 'running' | 'stopped'
  pid?: number
  pids?: number[]
  stats_file?: string
  start_date?: string
  error_message?: string
  sources?: SourceInput[]
  destinations?: DestinationOutput[]
}

export interface NetworkInterface {
  name: string
  ip: string
  netmask?: string
  mac?: string
  status?: 'up' | 'down'
  type: string
}

export interface ChannelStats {
  bandwidth: number
  rtt: number
  packet_loss: number
  timestamp: number
}

// SRT Statistics from CSV output
export interface SRTStats {
  Time: number
  pktSent: number
  pktRecv: number
  pktSndLoss: number
  pktRcvLoss: number
  pktRetrans: number
  pktSndDrop: number
  pktRcvDrop: number
  byteSent: number
  byteRecv: number
  byteRcvLoss: number
  msRTT: number
  mbpsBandwidth: number
  mbpsSendRate: number
  mbpsRecvRate: number
  pktFlightSize: number
  msRcvBuf: number
  msSndBuf: number
}

export interface ChannelStatsResponse {
  data: SRTStats[]
  total_records: number
  message?: string
}

export interface AggregatedStats {
  channels: {
    channel_name: string
    status: string
    stats: SRTStats[]
    latest: SRTStats | null
  }[]
  summary: {
    total_bandwidth: number
    total_packets_sent: number
    total_packets_recv: number
    total_bytes_sent: number
    total_bytes_recv: number
    avg_rtt: number
    total_packet_loss: number
  }
}

export interface SystemInfo {
  cpu_percent: number
  memory_percent: number
  disk_percent: number
  uptime: number
}

export interface User {
  id: number
  username: string
  email?: string
  role: 'admin' | 'readonly'
  created_at: string
}

export interface DashboardStats {
  total: number
  running: number
  stopped: number
  uptime: string
}

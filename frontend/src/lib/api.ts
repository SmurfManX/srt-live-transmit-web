import { Channel, ChannelStats, SystemInfo, User, NetworkInterface } from '@/types'

// FIXED: Use environment variables for API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Get token from localStorage
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const storage = localStorage.getItem('srt-manager-storage')
    if (!storage) return null

    const parsed = JSON.parse(storage)
    const currentUser = parsed?.state?.currentUser

    if (currentUser && typeof currentUser === 'string') {
      localStorage.removeItem('srt-manager-storage')
      window.location.reload()
      return null
    }

    return currentUser?.token || null
  } catch {
    return null
  }
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = getAuthToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Authentication required. Please login again.')
    }
    throw new Error(`API Error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

// Auth API
export const authAPI = {
  login: async (username: string, password: string) => {
    // Backend expects form data for OAuth2PasswordRequestForm
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)

    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    })

    if (!response.ok) {
      throw new Error('Invalid credentials')
    }

    return response.json()
  },
}

// Channels API
export const channelsAPI = {
  getAll: () => fetchAPI<Channel[]>('/api/channels'),

  getOne: (name: string) => fetchAPI<Channel>(`/api/channels/${name}`),

  create: (channel: Omit<Channel, 'status' | 'pid'>) =>
    fetchAPI<Channel>('/api/channels', {
      method: 'POST',
      body: JSON.stringify(channel),
    }),

  update: (name: string, updates: Partial<Channel>) =>
    fetchAPI<Channel>(`/api/channels/${name}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    }),

  delete: (name: string) =>
    fetchAPI<{ message: string }>(`/api/channels/${name}`, {
      method: 'DELETE',
    }),

  start: (name: string) =>
    fetchAPI<{ message: string }>(`/api/channels/${name}/start`, {
      method: 'POST',
    }),

  stop: (name: string) =>
    fetchAPI<{ message: string }>(`/api/channels/${name}/stop`, {
      method: 'POST',
    }),

  restart: (name: string) =>
    fetchAPI<{ message: string }>(`/api/channels/${name}/restart`, {
      method: 'POST',
    }),

  getStats: (name: string, timeRange: string = '1h') =>
    fetchAPI<ChannelStats>(`/api/channels/${name}/stats?time_range=${timeRange}`),

  getLogs: (name: string, lines: number = 100, processIdx?: number) => {
    const params = new URLSearchParams({ lines: lines.toString() })
    if (processIdx !== undefined) {
      params.append('process_idx', processIdx.toString())
    }
    return fetchAPI<{
      logs: Array<{ process_idx: number; text: string; timestamp: string }>
      processes: Array<{ idx: number; protocol: string; mode: string; host: string; port: number }>
      has_multiple_processes: boolean
      total_logs: number
      message?: string
    }>(`/api/channels/${name}/logs?${params.toString()}`)
  },

  getStreamInfo: (name: string, force: boolean = false) =>
    fetchAPI<StreamInfo>(`/api/channels/${name}/stream-info?force=${force}`),

  getAllStreamInfo: () =>
    fetchAPI<Record<string, StreamInfo>>('/api/channels/stream-info/all'),

  getSrtStatus: (name: string) =>
    fetchAPI<SrtStatus>(`/api/channels/${name}/srt-status`),

  getFullInfo: (name: string) =>
    fetchAPI<ChannelFullInfo>(`/api/channels/${name}/full-info`),

  getAnalyticsSummary: () =>
    fetchAPI<AnalyticsSummary>('/api/channels/analytics/summary'),
}

// Full channel info with SRT stats
export interface SrtStats {
  timestamp?: string
  socket_id?: number
  rtt_ms: number
  bandwidth_mbps: number
  max_bandwidth_mbps?: number
  send_rate_mbps: number
  recv_rate_mbps: number
  packets_sent: number
  packets_received: number
  packets_lost_send: number
  packets_lost_recv: number
  packets_dropped_send?: number
  packets_dropped_recv?: number
  packets_retransmitted?: number
  bytes_sent?: number
  bytes_received?: number
}

export interface ChannelFullInfo {
  channel_name: string
  status: string
  pid?: number
  pids?: number[]
  start_date?: string
  timestamp: string
  input: {
    protocol: string
    ip: string
    port: number
    mode: string
    latency?: number
  }
  output: {
    protocol: string
    port: number
    mode: string
    latency?: number
    destinations?: any[]
  }
  srt_stats?: SrtStats
  media_info?: {
    format?: string
    total_bitrate_mbps?: number
    video_streams?: VideoStreamInfo[]
    audio_streams?: AudioStreamInfo[]
  }
  connections?: Array<{
    local_address: string
    remote_address: string
    pid?: number
    state?: string
  }>
}

export interface AnalyticsSummary {
  total_channels: number
  running: number
  stopped: number
  total_bandwidth_mbps: number
  total_send_rate_mbps: number
  total_recv_rate_mbps: number
  total_packet_loss: number
  avg_rtt_ms: number
  channels: Array<{
    name: string
    status: string
    pid?: number
    pids?: number[]
    start_date?: string
    connections?: Array<{
      remote_ip: string
      remote_port: number
      local_port: number
      direction: 'input' | 'output' | 'unknown'
      state: string
    }>
    srt_stats?: {
      bandwidth_mbps: number
      send_rate_mbps: number
      recv_rate_mbps: number
      rtt_ms: number
      packets_lost: number
    }
    media_info?: {
      resolution?: string
      bitrate_mbps?: number
    }
  }>
}

export interface SrtStatus {
  channel_name: string
  status: string
  connected: boolean
  last_stats?: {
    time: string
    pktSent: number
    pktRecv: number
    pktSentLoss: number
    pktRcvLoss: number
    mbpsBandwidth: number
    msRTT: number
  }
  stream_info?: StreamInfo
  output_port: number
  mode: string
}

// Stream Info types
export interface VideoStreamInfo {
  index: number
  codec: string
  codec_long: string
  profile: string
  width: number
  height: number
  resolution: string
  fps: number
  bitrate: number | null
  pix_fmt: string
  color_space: string
  color_range: string
}

export interface AudioStreamInfo {
  index: number
  codec: string
  codec_long: string
  sample_rate: number
  channels: number
  channel_layout: string
  bitrate: number | null
  language: string
}

export interface StreamInfo {
  channel_name: string
  success?: boolean
  error?: string
  details?: string
  input_url: string
  format?: string
  total_bitrate?: number
  total_bitrate_mbps?: number
  duration?: string
  video_streams?: VideoStreamInfo[]
  audio_streams?: AudioStreamInfo[]
  video_count?: number
  audio_count?: number
}

// Server Stats
export interface ServerStats {
  cpu_percent: number
  memory_percent: number
  memory_used_gb: number
  memory_total_gb: number
  network_bytes_sent: number
  network_bytes_recv: number
  network_rate_sent_mbps: number
  network_rate_recv_mbps: number
}

// System API
export const systemAPI = {
  getInfo: () => fetchAPI<SystemInfo>('/api/system/info'),
  health: () => fetchAPI<{ status: string }>('/health'),
  getInterfaces: () => fetchAPI<NetworkInterface[]>('/api/system/interfaces'),
  getStats: () => fetchAPI<ServerStats>('/api/system/stats'),
  getLocalIP: async () => {
    const response = await fetch(`${API_BASE}/api/network/local-ip`)
    return response.json() as Promise<{ ip: string | null; error?: string }>
  },
}

// Users API
export const usersAPI = {
  getAll: () => fetchAPI<User[]>('/api/users'),

  create: (username: string, password: string, email?: string) =>
    fetchAPI<User>('/api/users', {
      method: 'POST',
      body: JSON.stringify({ username, password, email }),
    }),

  delete: (username: string) =>
    fetchAPI<{ message: string }>(`/api/users/${username}`, {
      method: 'DELETE',
    }),
}

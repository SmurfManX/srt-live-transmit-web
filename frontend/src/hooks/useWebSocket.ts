import { useState, useEffect, useCallback, useRef } from 'react'
import type { Channel } from '@/types'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface WebSocketMessage {
  type: 'channel_update' | 'pong' | 'error'
  channels?: Channel[]
  message?: string
  timestamp?: string
}

export interface UseWebSocketOptions {
  onChannelsUpdate?: (channels: Channel[]) => void
  onError?: (error: string) => void
  reconnectInterval?: number
  maxReconnectAttempts?: number
  pingInterval?: number
}

export interface UseWebSocketReturn {
  channels: Channel[]
  status: ConnectionStatus
  isConnected: boolean
  error: string | null
  reconnectAttempts: number
  sendMessage: (message: WebSocketMessage) => void
  disconnect: () => void
}

// Get auth token from localStorage (from Zustand store)
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const storage = localStorage.getItem('srt-manager-storage')
    if (storage) {
      const parsed = JSON.parse(storage)
      return parsed?.state?.currentUser?.token || null
    }
  } catch {
    return null
  }
  return null
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    onChannelsUpdate,
    onError,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10,
    pingInterval = 30000
  } = options

  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [channels, setChannels] = useState<Channel[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>()
  const pingIntervalRef = useRef<NodeJS.Timeout>()
  const heartbeatCheckIntervalRef = useRef<NodeJS.Timeout>()
  const lastPongTimeRef = useRef<number>(Date.now())
  const isIntentionalClose = useRef(false)

  // Send ping to keep connection alive
  const startPingInterval = useCallback(() => {
    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }
    if (heartbeatCheckIntervalRef.current) {
      clearInterval(heartbeatCheckIntervalRef.current)
    }

    // Send ping every 30 seconds
    pingIntervalRef.current = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }))
      }
    }, pingInterval)

    // Check for pong timeout every 10 seconds
    const pongTimeout = 60000 // 60 seconds
    heartbeatCheckIntervalRef.current = setInterval(() => {
      const timeSinceLastPong = Date.now() - lastPongTimeRef.current
      if (timeSinceLastPong > pongTimeout && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.close(1000, 'Heartbeat timeout')
      }
    }, 10000)
  }, [pingInterval])

  // Send message to WebSocket
  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message))
    }
  }, [])

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000'
      const token = getAuthToken()

      if (!token) {
        setStatus('error')
        setError('Authentication required')
        return
      }

      const url = `${wsUrl}/ws?token=${token}`
      setStatus('connecting')
      setError(null)

      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.onopen = () => {
        setStatus('connected')
        setError(null)
        setReconnectAttempts(0)
        startPingInterval()

        // Request initial channel data
        ws.send(JSON.stringify({ type: 'get_channels' }))
      }

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data)

          if (message.type === 'pong') {
            lastPongTimeRef.current = Date.now()
          } else if (message.type === 'channel_update' && message.channels) {
            setChannels(message.channels)
            onChannelsUpdate?.(message.channels)
          } else if (message.type === 'error') {
            setError(message.message || 'Unknown error')
            onError?.(message.message || 'Unknown error')
          }
        } catch {
          // Ignore parse errors
        }
      }

      ws.onerror = () => {
        setStatus('error')
        setError('Connection error')
        onError?.('Connection error')
      }

      ws.onclose = (event) => {
        const reason = event.reason || 'No reason provided'

        if (pingIntervalRef.current) {
          clearInterval(pingIntervalRef.current)
        }
        if (heartbeatCheckIntervalRef.current) {
          clearInterval(heartbeatCheckIntervalRef.current)
        }

        if (!isIntentionalClose.current) {
          setStatus('disconnected')

          // Don't reconnect on auth failures (code 1008)
          const shouldReconnect = event.code !== 1008 && reconnectAttempts < maxReconnectAttempts

          if (shouldReconnect) {
            const backoffTime = Math.min(reconnectInterval * Math.pow(1.5, reconnectAttempts), 30000)

            reconnectTimeoutRef.current = setTimeout(() => {
              setReconnectAttempts((prev) => prev + 1)
              connect()
            }, backoffTime)
          } else {
            setStatus('error')
            setError(event.code === 1008 ? 'Authentication failed' : `Connection closed: ${reason}`)
            onError?.(event.code === 1008 ? 'Authentication failed' : `Connection closed: ${reason}`)
          }
        } else {
          setStatus('disconnected')
        }
      }
    } catch {
      setStatus('error')
      setError('Failed to create connection')
      onError?.('Failed to create connection')
    }
  }, [
    reconnectAttempts,
    maxReconnectAttempts,
    reconnectInterval,
    startPingInterval,
    onChannelsUpdate,
    onError
  ])

  // Disconnect WebSocket
  const disconnect = useCallback(() => {
    isIntentionalClose.current = true

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }

    if (pingIntervalRef.current) {
      clearInterval(pingIntervalRef.current)
    }

    if (heartbeatCheckIntervalRef.current) {
      clearInterval(heartbeatCheckIntervalRef.current)
    }

    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setStatus('disconnected')
  }, [])

  // Initialize connection on mount and when storage changes
  useEffect(() => {
    const token = getAuthToken()

    if (!token) {
      setStatus('disconnected')
      return
    }

    // Only connect if not already connected
    if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
      isIntentionalClose.current = false
      connect()
    }

    // Listen for storage changes (login events)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'srt-manager-storage' && e.newValue) {
        const newToken = getAuthToken()
        if (newToken && (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED)) {
          isIntentionalClose.current = false
          connect()
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      isIntentionalClose.current = true
      if (wsRef.current && wsRef.current.readyState === WebSocket.CONNECTING) {
        // Don't close if still connecting, let it finish
        return
      }
      disconnect()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount, storage event will handle updates

  return {
    channels,
    status,
    isConnected: status === 'connected',
    error,
    reconnectAttempts,
    sendMessage,
    disconnect
  }
}

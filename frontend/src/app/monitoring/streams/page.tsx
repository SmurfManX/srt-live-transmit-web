'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { AlertTriangle, CheckCircle, XCircle, Activity, Radio, Wifi, WifiOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Channel } from '@/types'

interface StreamHealth {
  channel_name: string
  status: 'healthy' | 'warning' | 'critical' | 'offline'
  bandwidth: number
  packetLoss: number
  rtt: number
  jitter: number
  uptime: number
  lastUpdate: string
}

export default function StreamsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [healthData, setHealthData] = useState<StreamHealth[]>([])
  const [filter, setFilter] = useState<'all' | 'healthy' | 'warning' | 'critical'>('all')

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/channels', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChannels(data)

        // Generate mock health data
        const health = data.map((ch: Channel) => generateHealthData(ch))
        setHealthData(health)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    }
  }

  const generateHealthData = (channel: Channel): StreamHealth => {
    if (channel.status !== 'running') {
      return {
        channel_name: channel.channel_name,
        status: 'offline',
        bandwidth: 0,
        packetLoss: 0,
        rtt: 0,
        jitter: 0,
        uptime: 0,
        lastUpdate: new Date().toISOString()
      }
    }

    const packetLoss = Math.random() * 2
    const rtt = Math.random() * 100 + 20
    const jitter = Math.random() * 10

    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (packetLoss > 1 || rtt > 200 || jitter > 50) status = 'critical'
    else if (packetLoss > 0.5 || rtt > 100 || jitter > 20) status = 'warning'

    return {
      channel_name: channel.channel_name,
      status,
      bandwidth: Math.random() * 8 + 2,
      packetLoss,
      rtt,
      jitter,
      uptime: Math.floor(Math.random() * 48) + 1,
      lastUpdate: new Date().toISOString()
    }
  }

  const filteredData = filter === 'all'
    ? healthData
    : healthData.filter(h => h.status === filter)

  const stats = {
    healthy: healthData.filter(h => h.status === 'healthy').length,
    warning: healthData.filter(h => h.status === 'warning').length,
    critical: healthData.filter(h => h.status === 'critical').length,
    offline: healthData.filter(h => h.status === 'offline').length,
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-[#4A8B57]" />
      case 'warning': return <AlertTriangle className="h-5 w-5 text-[#D97706]" />
      case 'critical': return <XCircle className="h-5 w-5 text-[#B91C1C]" />
      case 'offline': return <WifiOff className="h-5 w-5 text-[#6B7280]" />
      default: return <Activity className="h-5 w-5" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-[#4A8B57]/10 text-[#4A8B57] border-[#4A8B57]/20'
      case 'warning': return 'bg-[#D97706]/10 text-[#D97706] border-[#D97706]/20'
      case 'critical': return 'bg-[#B91C1C]/10 text-[#B91C1C] border-[#B91C1C]/20'
      case 'offline': return 'bg-[#6B7280]/10 text-[#6B7280] border-[#6B7280]/20'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F6F4] dark:bg-[#1F1A17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">Stream Health</h1>
            <p className="text-[#6B7280] mt-1">Real-time monitoring of stream quality and performance</p>
          </div>
          <Button onClick={() => router.push('/')}>
            Back to Dashboard
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card
            className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-[#4A8B57]' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Total Streams</div>
                  <div className="text-3xl font-bold">{healthData.length}</div>
                </div>
                <Radio className="h-8 w-8 text-[#6B7280]" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${filter === 'healthy' ? 'ring-2 ring-[#4A8B57]' : ''}`}
            onClick={() => setFilter('healthy')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Healthy</div>
                  <div className="text-3xl font-bold text-[#4A8B57]">{stats.healthy}</div>
                </div>
                <CheckCircle className="h-8 w-8 text-[#4A8B57]" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${filter === 'warning' ? 'ring-2 ring-[#D97706]' : ''}`}
            onClick={() => setFilter('warning')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Warning</div>
                  <div className="text-3xl font-bold text-[#D97706]">{stats.warning}</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-[#D97706]" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all ${filter === 'critical' ? 'ring-2 ring-[#B91C1C]' : ''}`}
            onClick={() => setFilter('critical')}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Critical</div>
                  <div className="text-3xl font-bold text-[#B91C1C]">{stats.critical}</div>
                </div>
                <XCircle className="h-8 w-8 text-[#B91C1C]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stream Health Table */}
        <Card>
          <CardHeader>
            <CardTitle>Stream Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredData.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">No streams found</div>
            ) : (
              <div className="space-y-3">
                {filteredData.map((stream) => (
                  <div
                    key={stream.channel_name}
                    className={`p-4 rounded-lg border-2 ${getStatusColor(stream.status)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(stream.status)}
                        <div>
                          <div className="font-semibold">{stream.channel_name}</div>
                          <div className="text-sm text-[#6B7280] capitalize">{stream.status}</div>
                        </div>
                      </div>

                      {stream.status !== 'offline' && (
                        <div className="grid grid-cols-4 gap-6 text-right">
                          <div>
                            <div className="text-xs text-[#6B7280]">Bandwidth</div>
                            <div className="text-sm font-semibold">{stream.bandwidth.toFixed(2)} Mbps</div>
                          </div>
                          <div>
                            <div className="text-xs text-[#6B7280]">Packet Loss</div>
                            <div className={`text-sm font-semibold ${stream.packetLoss > 1 ? 'text-[#B91C1C]' : stream.packetLoss > 0.5 ? 'text-[#D97706]' : 'text-[#4A8B57]'}`}>
                              {stream.packetLoss.toFixed(2)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#6B7280]">RTT</div>
                            <div className={`text-sm font-semibold ${stream.rtt > 200 ? 'text-[#B91C1C]' : stream.rtt > 100 ? 'text-[#D97706]' : 'text-[#4A8B57]'}`}>
                              {stream.rtt.toFixed(0)} ms
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-[#6B7280]">Uptime</div>
                            <div className="text-sm font-semibold">{stream.uptime}h</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {stream.status !== 'offline' && stream.status !== 'healthy' && (
                      <div className="mt-3 pt-3 border-t border-current/20">
                        <div className="text-xs text-current font-medium">
                          {stream.status === 'critical' && '⚠️ Critical: High packet loss or latency detected'}
                          {stream.status === 'warning' && '⚡ Warning: Performance degradation detected'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Health Thresholds Info */}
        <Card className="bg-[#3B82F6]/10 border-[#3B82F6]/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-[#3B82F6]/20">
                <Activity className="h-5 w-5 text-[#3B82F6]" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-[#1F2937] dark:text-[#F9FAFB] mb-2">
                  Health Thresholds
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-[#4A8B57]">Healthy</div>
                    <div className="text-[#6B7280]">Packet Loss &lt; 0.5%, RTT &lt; 100ms</div>
                  </div>
                  <div>
                    <div className="font-medium text-[#D97706]">Warning</div>
                    <div className="text-[#6B7280]">Packet Loss 0.5-1%, RTT 100-200ms</div>
                  </div>
                  <div>
                    <div className="font-medium text-[#B91C1C]">Critical</div>
                    <div className="text-[#6B7280]">Packet Loss &gt; 1%, RTT &gt; 200ms</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

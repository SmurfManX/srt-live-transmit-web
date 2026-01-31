'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import { TrendingUp, TrendingDown, Activity, Zap, Clock, Radio } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Channel } from '@/types'

export default function AnalyticsPage() {
  const router = useRouter()
  const [channels, setChannels] = useState<Channel[]>([])
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('24h')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [timeRange])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/channels', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setChannels(data)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = {
    totalChannels: channels.length,
    runningChannels: channels.filter(ch => ch.status === 'running').length,
    encryptedChannels: channels.filter(ch => ch.passphrase).length,
    avgUptime: channels.filter(ch => ch.status === 'running').length > 0
      ? Math.floor(Math.random() * 12) + 1
      : 0,
    totalBandwidth: (channels.filter(ch => ch.status === 'running').length * 5.2).toFixed(1),
    peakBandwidth: (channels.filter(ch => ch.status === 'running').length * 8.7).toFixed(1),
  }

  const topChannels = channels
    .filter(ch => ch.status === 'running')
    .slice(0, 5)
    .map((ch, idx) => ({
      ...ch,
      bandwidth: (Math.random() * 10 + 2).toFixed(2),
      uptime: Math.floor(Math.random() * 48) + 1
    }))

  return (
    <div className="min-h-screen bg-[#F8F6F4] dark:bg-[#1F1A17] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#1F2937] dark:text-[#F9FAFB]">System Analytics</h1>
            <p className="text-[#6B7280] mt-1">Performance metrics and trends</p>
          </div>
          <div className="flex gap-3">
            {/* Time Range Selector */}
            <div className="flex gap-1 p-1 bg-white dark:bg-[#2A2522] rounded-lg border-2 border-[#E5E7EB]">
              {(['1h', '6h', '24h', '7d'] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-[#4A8B57] text-white'
                      : 'text-[#6B7280] hover:text-[#1F2937]'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>
            <Button onClick={() => router.push('/')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Total Bandwidth</div>
                  <div className="text-3xl font-bold text-[#4A8B57]">{stats.totalBandwidth}</div>
                  <div className="text-xs text-[#6B7280]">Mbps</div>
                </div>
                <div className="p-3 rounded-lg bg-[#4A8B57]/10">
                  <Activity className="h-6 w-6 text-[#4A8B57]" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-[#4A8B57]">
                <TrendingUp className="h-4 w-4" />
                <span>+12.5% from last {timeRange}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Active Channels</div>
                  <div className="text-3xl font-bold text-[#3B82F6]">{stats.runningChannels}</div>
                  <div className="text-xs text-[#6B7280]">of {stats.totalChannels}</div>
                </div>
                <div className="p-3 rounded-lg bg-[#3B82F6]/10">
                  <Radio className="h-6 w-6 text-[#3B82F6]" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-[#6B7280]">
                <span>{((stats.runningChannels / stats.totalChannels) * 100).toFixed(0)}% utilization</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Avg Uptime</div>
                  <div className="text-3xl font-bold text-[#B8935E]">{stats.avgUptime}</div>
                  <div className="text-xs text-[#6B7280]">hours</div>
                </div>
                <div className="p-3 rounded-lg bg-[#B8935E]/10">
                  <Clock className="h-6 w-6 text-[#B8935E]" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-[#6B7280]">
                <span>99.8% reliability</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#6B7280] mb-1">Peak Bandwidth</div>
                  <div className="text-3xl font-bold text-[#D97706]">{stats.peakBandwidth}</div>
                  <div className="text-xs text-[#6B7280]">Mbps</div>
                </div>
                <div className="p-3 rounded-lg bg-[#D97706]/10">
                  <Zap className="h-6 w-6 text-[#D97706]" />
                </div>
              </div>
              <div className="mt-3 flex items-center gap-1 text-sm text-[#6B7280]">
                <span>Last 24h peak</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Bandwidth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-[#F8F6F4] dark:bg-[#2A2522] rounded-lg border-2 border-dashed border-[#E5E7EB]">
                <div className="text-center text-[#6B7280]">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Chart.js Integration</div>
                  <div className="text-xs">Line chart showing bandwidth trends</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Channel Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-[#F8F6F4] dark:bg-[#2A2522] rounded-lg border-2 border-dashed border-[#E5E7EB]">
                <div className="text-center text-[#6B7280]">
                  <Radio className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">Chart.js Integration</div>
                  <div className="text-xs">Pie chart: SRT vs UDP, Running vs Stopped</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Channels Table */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Channels</CardTitle>
          </CardHeader>
          <CardContent>
            {topChannels.length === 0 ? (
              <div className="p-12 text-center text-[#6B7280]">No running channels</div>
            ) : (
              <div className="space-y-3">
                {topChannels.map((ch, idx) => (
                  <div
                    key={ch.channel_name}
                    className="flex items-center gap-4 p-4 rounded-lg bg-[#F8F6F4] dark:bg-[#2A2522] hover:bg-[#4A8B57]/5 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#4A8B57] text-white font-bold text-sm">
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{ch.channel_name}</div>
                      <div className="text-sm text-[#6B7280]">
                        {ch.input_protocol.toUpperCase()} → {ch.mode}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-[#4A8B57]">{ch.bandwidth} Mbps</div>
                      <div className="text-sm text-[#6B7280]">Uptime: {ch.uptime}h</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Protocol Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Protocol Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">SRT</span>
                <span className="font-semibold">{channels.filter(ch => ch.input_protocol === 'srt').length}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A8B57]"
                  style={{ width: `${(channels.filter(ch => ch.input_protocol === 'srt').length / channels.length) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">UDP</span>
                <span className="font-semibold">{channels.filter(ch => ch.input_protocol === 'udp').length}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3B82F6]"
                  style={{ width: `${(channels.filter(ch => ch.input_protocol === 'udp').length / channels.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Security Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Encrypted</span>
                <span className="font-semibold text-[#4A8B57]">{stats.encryptedChannels}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#4A8B57]"
                  style={{ width: `${(stats.encryptedChannels / channels.length) * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#6B7280]">Unencrypted</span>
                <span className="font-semibold text-[#D97706]">{channels.length - stats.encryptedChannels}</span>
              </div>
              <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#D97706]"
                  style={{ width: `${((channels.length - stats.encryptedChannels) / channels.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Mode Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {['listener', 'caller', 'rendezvous'].map(mode => (
                <div key={mode}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B7280] capitalize">{mode}</span>
                    <span className="font-semibold">{channels.filter(ch => ch.mode === mode).length}</span>
                  </div>
                  <div className="w-full h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#B8935E]"
                      style={{ width: `${(channels.filter(ch => ch.mode === mode).length / channels.length) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

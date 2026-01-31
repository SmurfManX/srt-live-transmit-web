'use client'

import { useState, useEffect, useMemo } from 'react'
import { Line } from 'react-chartjs-2'
import { ChartData } from 'chart.js'
import '../charts/ChartConfig'
import { defaultLineOptions, chartColors, chartColorsWithAlpha } from '../charts/ChartConfig'
import {
  X, BarChart3, Activity, Clock, AlertTriangle,
  Terminal, Monitor, Volume2, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight, Radio, HardDrive
} from 'lucide-react'
import Button from '@/components/ui/Button'
import { channelsAPI, AnalyticsSummary } from '@/lib/api'

interface StatsData {
  Time?: string
  Timepoint?: string
  pktSent?: number
  pktRecv?: number
  pktSndLoss?: number
  pktRcvLoss?: number
  pktRetrans?: number
  pktSndDrop?: number
  pktRcvDrop?: number
  mbpsSendRate?: number
  mbpsRecvRate?: number
  mbpsBandwidth?: number
  msRTT?: number
  [key: string]: any
}

interface LogEntry {
  process_idx: number
  text: string
  timestamp: string
}

interface StreamInfo {
  success?: boolean
  format?: string
  total_bitrate_mbps?: number
  video_streams?: Array<{
    codec: string
    resolution: string
    fps: number
    bitrate?: number
    profile?: string
    pix_fmt?: string
  }>
  audio_streams?: Array<{
    codec: string
    sample_rate: number
    channels: number
    bitrate?: number
    language?: string
  }>
}

interface Connection {
  remote_ip: string
  remote_port: number
  direction: string
  state: string
}

interface ChannelInfo {
  channel_name: string
  status: string
  pid?: number
  pids?: number[]
  start_date?: string
  input_protocol?: string
  input_ip?: string
  input_port?: number
  input_mode?: string
  output_protocol?: string
  output_port?: number
  mode?: string
  streamid?: string
  destinations?: any[]
}

interface ChannelDetailModalProps {
  open: boolean
  onClose: () => void
  channelName: string
  channelStatus?: string
  channelData?: ChannelInfo
}

type TabType = 'overview' | 'statistics' | 'stream' | 'logs'

export default function ChannelDetailModal({
  open,
  onClose,
  channelName,
  channelStatus = 'stopped',
  channelData
}: ChannelDetailModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [stats, setStats] = useState<StatsData[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [autoRefresh] = useState(true)
  const [timeRange, setTimeRange] = useState('5m')

  // Fetch all data
  const fetchData = async () => {
    if (!channelName) return
    setIsLoading(true)

    try {
      const [statsRes, logsRes, fullInfo] = await Promise.all([
        channelsAPI.getStats(channelName, timeRange),
        channelsAPI.getLogs(channelName, 100),
        channelsAPI.getFullInfo(channelName).catch(() => null)
      ])

      setStats(statsRes.data || [])
      setLogs(logsRes.logs || [])

      if (fullInfo) {
        setStreamInfo(fullInfo.media_info || null)
        // Get connections from analytics
        const analytics = await channelsAPI.getAnalyticsSummary()
        const channelData = analytics.channels.find(c => c.name === channelName)
        setConnections(channelData?.connections || [])
      }
    } catch {
      // Ignore errors
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchData()
    }
  }, [open, channelName, timeRange])

  useEffect(() => {
    if (!open || !autoRefresh) return
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [open, autoRefresh, timeRange])

  // Get latest stats
  const latest = stats.length > 0 ? stats[stats.length - 1] : null

  // Prepare chart data
  const chartData = useMemo(() => {
    const last50 = stats.slice(-50)
    const labels = last50.map(d => {
      const time = d.Timepoint || d.Time || ''
      if (time.includes('T')) {
        return new Date(time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      }
      return time
    })

    return {
      bitrate: {
        labels,
        datasets: [{
          label: 'Send Rate (Mbps)',
          data: last50.map(d => d.mbpsSendRate || 0),
          borderColor: chartColors.success,
          backgroundColor: chartColorsWithAlpha.success,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }]
      } as ChartData<'line'>,
      rtt: {
        labels,
        datasets: [{
          label: 'RTT (ms)',
          data: last50.map(d => d.msRTT || 0),
          borderColor: chartColors.warning,
          backgroundColor: chartColorsWithAlpha.warning,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        }]
      } as ChartData<'line'>,
      packets: {
        labels,
        datasets: [
          {
            label: 'Sent',
            data: last50.map(d => d.pktSent || 0),
            borderColor: chartColors.primary,
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 0,
          },
          {
            label: 'Lost',
            data: last50.map(d => (d.pktSndLoss || 0) + (d.pktRcvLoss || 0)),
            borderColor: chartColors.danger,
            backgroundColor: chartColorsWithAlpha.danger,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
          }
        ]
      } as ChartData<'line'>
    }
  }, [stats])

  const miniChartOptions = {
    ...defaultLineOptions,
    plugins: {
      ...defaultLineOptions.plugins,
      legend: { display: false },
    },
    scales: {
      x: { display: false },
      y: { display: false, beginAtZero: true },
    },
  }

  const fullChartOptions = {
    ...defaultLineOptions,
    plugins: {
      ...defaultLineOptions.plugins,
      legend: {
        display: true,
        position: 'top' as const,
      },
    },
  }

  // Format helpers
  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null) return '-'
    return Number(num).toFixed(decimals)
  }

  const formatBigNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '-'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
    return num.toString()
  }

  // Parse log for highlighting
  const parseLogLine = (text: string) => {
    if (text.includes('Accepted') || text.includes('connection')) {
      return { type: 'connection', color: 'text-green-400' }
    }
    if (text.includes('disconnected') || text.includes('closed')) {
      return { type: 'disconnect', color: 'text-red-400' }
    }
    if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
      return { type: 'error', color: 'text-red-500' }
    }
    if (text.includes('request from:')) {
      return { type: 'request', color: 'text-cyan-400' }
    }
    return { type: 'normal', color: 'text-gray-300' }
  }

  if (!open) return null

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'stream', label: 'Stream Info', icon: Monitor },
    { id: 'logs', label: 'Logs', icon: Terminal },
  ]

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-6xl h-[85vh] overflow-hidden bg-white dark:bg-[#0a0a0a] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                <Radio className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{channelName}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                    channelStatus === 'running'
                      ? 'bg-green-500/30 text-green-100'
                      : 'bg-gray-500/30 text-gray-200'
                  }`}>
                    {channelStatus === 'running' && <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />}
                    {channelStatus}
                  </span>
                  {latest && (
                    <span className="text-white/70 text-xs">
                      {formatNumber(latest.mbpsSendRate)} Mbps • {formatNumber(latest.msRTT, 0)} ms RTT
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="h-9 px-3 rounded-lg bg-white/20 text-white text-sm border border-white/30 focus:outline-none"
              >
                <option value="5m" className="text-gray-900">5 min</option>
                <option value="15m" className="text-gray-900">15 min</option>
                <option value="30m" className="text-gray-900">30 min</option>
                <option value="1h" className="text-gray-900">1 hour</option>
                <option value="6h" className="text-gray-900">6 hours</option>
              </select>
              <button onClick={onClose} className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex-shrink-0 flex border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#111]">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex-1 flex items-center justify-center gap-2 min-w-[120px] px-6 py-3 text-sm font-medium transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 bg-white dark:bg-[#0a0a0a]'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-[#0a0a0a]">

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Channel Info Card */}
                <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* PID */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-cyan-500/10 rounded-lg">
                        <HardDrive className="w-5 h-5 text-cyan-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">PID</div>
                        <div className="font-mono font-semibold text-gray-900 dark:text-white">
                          {channelData?.pid || <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </div>
                    </div>
                    {/* Stream ID */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-500/10 rounded-lg">
                        <Radio className="w-5 h-5 text-pink-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Stream ID</div>
                        <div className="font-mono font-semibold text-gray-900 dark:text-white truncate max-w-[120px]" title={channelData?.streamid || ''}>
                          {channelData?.streamid || <span className="text-gray-400 text-sm">-</span>}
                        </div>
                      </div>
                    </div>
                    {/* Bitrate */}
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Bitrate</div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {streamInfo?.total_bitrate_mbps
                            ? `${streamInfo.total_bitrate_mbps} Mbps`
                            : (channelStatus === 'running'
                                ? <span className="text-amber-500 text-sm">...</span>
                                : <span className="text-gray-400 text-sm">-</span>
                              )
                          }
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <MetricCard
                    icon={TrendingUp}
                    label="Send Rate"
                    value={formatNumber(latest?.mbpsSendRate)}
                    unit="Mbps"
                    color="green"
                    chart={<div className="h-12 mt-2"><Line data={chartData.bitrate} options={miniChartOptions} /></div>}
                  />
                  <MetricCard
                    icon={Clock}
                    label="RTT"
                    value={formatNumber(latest?.msRTT, 1)}
                    unit="ms"
                    color="amber"
                    trend={latest?.msRTT && latest.msRTT > 100 ? 'up' : 'down'}
                    chart={<div className="h-12 mt-2"><Line data={chartData.rtt} options={miniChartOptions} /></div>}
                  />
                  <MetricCard
                    icon={Activity}
                    label="Bandwidth"
                    value={formatNumber(latest?.mbpsBandwidth)}
                    unit="Mbps"
                    color="blue"
                  />
                  <MetricCard
                    icon={AlertTriangle}
                    label="Packets Lost"
                    value={formatBigNumber((latest?.pktSndLoss || 0) + (latest?.pktRcvLoss || 0))}
                    color="red"
                    trend="up"
                  />
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Bitrate Over Time</h3>
                    <div className="h-48">
                      <Line data={chartData.bitrate} options={fullChartOptions} />
                    </div>
                  </div>
                  <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">RTT Over Time</h3>
                    <div className="h-48">
                      <Line data={chartData.rtt} options={fullChartOptions} />
                    </div>
                  </div>
                </div>

                {/* Connected Clients */}
                {connections.length > 0 && (
                  <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Connected Clients ({connections.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {connections.map((conn, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="font-mono text-sm text-cyan-600 dark:text-cyan-400">
                            {conn.remote_ip}:{conn.remote_port}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
              <div className="space-y-6">
                {/* Full Charts */}
                <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Packet Statistics</h3>
                  <div className="h-64">
                    <Line data={chartData.packets} options={fullChartOptions} />
                  </div>
                </div>

                {/* Detailed Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <StatsPanel title="Packets Sent" color="blue" stats={[
                    { label: 'Total', value: formatBigNumber(latest?.pktSent) },
                    { label: 'Lost', value: formatBigNumber(latest?.pktSndLoss), color: 'red' },
                    { label: 'Dropped', value: formatBigNumber(latest?.pktSndDrop), color: 'orange' },
                    { label: 'Retransmitted', value: formatBigNumber(latest?.pktRetrans), color: 'yellow' },
                  ]} />
                  <StatsPanel title="Packets Received" color="green" stats={[
                    { label: 'Total', value: formatBigNumber(latest?.pktRecv) },
                    { label: 'Lost', value: formatBigNumber(latest?.pktRcvLoss), color: 'red' },
                    { label: 'Dropped', value: formatBigNumber(latest?.pktRcvDrop), color: 'orange' },
                    { label: 'Belated', value: formatBigNumber(latest?.pktRcvBelated), color: 'cyan' },
                  ]} />
                </div>

                {/* Data Table */}
                <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800">
                  <div className="p-3 bg-gray-100 dark:bg-[#111] border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Recent Data ({stats.length} records)
                    </h3>
                  </div>
                  <div className="overflow-x-auto max-h-64 bg-white dark:bg-[#0a0a0a]">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-50 dark:bg-[#111] sticky top-0">
                        <tr>
                          <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">Time</th>
                          <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Send Rate</th>
                          <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">RTT</th>
                          <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Sent</th>
                          <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Lost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {stats.slice(-20).reverse().map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-[#111]">
                            <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono">
                              {row.Timepoint?.split('T')[1]?.split('.')[0] || row.Time || '-'}
                            </td>
                            <td className="px-3 py-2 text-right text-green-600 dark:text-green-400 font-medium">
                              {formatNumber(row.mbpsSendRate)} Mbps
                            </td>
                            <td className="px-3 py-2 text-right text-amber-600 dark:text-amber-400">
                              {formatNumber(row.msRTT, 1)} ms
                            </td>
                            <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                              {formatBigNumber(row.pktSent)}
                            </td>
                            <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">
                              {formatBigNumber((row.pktSndLoss || 0) + (row.pktRcvLoss || 0))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Stream Info Tab */}
            {activeTab === 'stream' && (
              <div className="space-y-6">
                {(streamInfo?.video_streams?.length || streamInfo?.audio_streams?.length) ? (
                  <>
                    {/* Video Streams */}
                    {streamInfo.video_streams && streamInfo.video_streams.length > 0 && (
                      <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                          <Monitor className="w-4 h-4 text-blue-500" />
                          Video Streams
                        </h3>
                        <div className="grid gap-4">
                          {streamInfo.video_streams.map((video, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <InfoItem label="Resolution" value={video.resolution} highlight />
                                <InfoItem label="Codec" value={video.codec?.toUpperCase()} />
                                <InfoItem label="FPS" value={`${video.fps}`} />
                                <InfoItem label="Profile" value={video.profile || '-'} />
                                {video.bitrate && <InfoItem label="Bitrate" value={`${(video.bitrate / 1000000).toFixed(2)} Mbps`} />}
                                <InfoItem label="Pixel Format" value={video.pix_fmt || '-'} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Audio Streams */}
                    {streamInfo.audio_streams && streamInfo.audio_streams.length > 0 && (
                      <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-cyan-500" />
                          Audio Streams ({streamInfo.audio_streams.length})
                        </h3>
                        <div className="grid gap-4">
                          {streamInfo.audio_streams.map((audio, idx) => (
                            <div key={idx} className="p-4 bg-gray-50 dark:bg-[#0a0a0a] rounded-lg">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <InfoItem label="Codec" value={audio.codec?.toUpperCase()} highlight />
                                <InfoItem label="Sample Rate" value={`${audio.sample_rate} Hz`} />
                                <InfoItem label="Channels" value={`${audio.channels}`} />
                                {audio.language && <InfoItem label="Language" value={audio.language} />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Total Bitrate */}
                    {streamInfo.total_bitrate_mbps && (
                      <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl border border-cyan-200 dark:border-cyan-800">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Total Stream Bitrate</span>
                          <span className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {streamInfo.total_bitrate_mbps} Mbps
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Monitor className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Stream info not available</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      {channelStatus === 'running' ? 'Analyzing stream...' : 'Start the channel to see stream info'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Logs Tab */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{logs.length} log entries</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> Connection</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Disconnect</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-500" /> Request</span>
                  </div>
                </div>

                <div className="font-mono text-xs bg-[#1a1a2e] text-gray-100 p-4 rounded-xl overflow-x-auto max-h-[500px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No logs available</div>
                  ) : (
                    logs.map((log, index) => {
                      const { color } = parseLogLine(log.text)
                      return (
                        <div key={index} className={`py-1 hover:bg-white/5 ${color}`}>
                          {log.text}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Helper Components
function MetricCard({
  icon: Icon,
  label,
  value,
  unit,
  color,
  trend,
  chart
}: {
  icon: any
  label: string
  value: string
  unit?: string
  color: 'green' | 'amber' | 'blue' | 'red' | 'cyan'
  trend?: 'up' | 'down'
  chart?: React.ReactNode
}) {
  const colors = {
    green: 'from-green-500/10 to-green-500/5 border-green-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 border-amber-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 border-blue-500/20',
    red: 'from-red-500/10 to-red-500/5 border-red-500/20',
    cyan: 'from-cyan-500/10 to-cyan-500/5 border-cyan-500/20',
  }
  const textColors = {
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
    blue: 'text-blue-600 dark:text-blue-400',
    red: 'text-red-600 dark:text-red-400',
    cyan: 'text-cyan-600 dark:text-cyan-400',
  }

  return (
    <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${textColors[color]}`} />
          <span className={`text-xs font-medium ${textColors[color]}`}>{label}</span>
        </div>
        {trend && (
          trend === 'up'
            ? <ArrowUpRight className="w-4 h-4 text-red-500" />
            : <ArrowDownRight className="w-4 h-4 text-green-500" />
        )}
      </div>
      <div className={`text-2xl font-bold ${textColors[color]}`}>
        {value} {unit && <span className="text-sm font-normal opacity-70">{unit}</span>}
      </div>
      {chart}
    </div>
  )
}

function StatsPanel({
  title,
  color,
  stats
}: {
  title: string
  color: 'blue' | 'green'
  stats: Array<{ label: string; value: string; color?: string }>
}) {
  const dotColor = color === 'blue' ? 'bg-blue-500' : 'bg-green-500'

  return (
    <div className="p-4 bg-white dark:bg-[#111] rounded-xl border border-gray-200 dark:border-gray-800">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <span className={`w-2 h-2 ${dotColor} rounded-full`}></span>
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, idx) => (
          <div key={idx}>
            <div className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</div>
            <div className={`text-lg font-semibold ${
              stat.color === 'red' ? 'text-red-600 dark:text-red-400' :
              stat.color === 'orange' ? 'text-orange-600 dark:text-orange-400' :
              stat.color === 'yellow' ? 'text-yellow-600 dark:text-yellow-400' :
              stat.color === 'cyan' ? 'text-cyan-600 dark:text-cyan-400' :
              'text-gray-800 dark:text-gray-200'
            }`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className={`font-medium ${highlight ? 'text-cyan-600 dark:text-cyan-400 text-lg' : 'text-gray-800 dark:text-gray-200'}`}>
        {value}
      </div>
    </div>
  )
}

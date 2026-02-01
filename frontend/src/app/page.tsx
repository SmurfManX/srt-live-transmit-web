'use client'

import { useState, useEffect } from 'react'
import { Channel, NetworkInterface } from '@/types'
import { channelsAPI, systemAPI, StreamInfo, SrtStatus, AnalyticsSummary, ServerStats } from '@/lib/api'
import { useWebSocket } from '@/hooks/useWebSocket'
import { useStore } from '@/store/useStore'
import ChannelDialog from '@/components/channels/ChannelDialog'
import ChannelLogsModal from '@/components/channels/ChannelLogsModal'
import ChannelStatsModal from '@/components/channels/ChannelStatsModal'
import ChannelDetailModal from '@/components/channels/ChannelDetailModal'
import {
  Play, Square, Plus, Search, RefreshCw, LogOut,
  Settings, Trash2, Edit, FileText,
  Moon, Sun, BarChart3, Info, ChevronDown, ChevronRight,
  Monitor, Volume2, Loader2, Zap, Radio,
  Cpu, HardDrive, ArrowDown, ArrowUp, Shield, Download, Upload
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function Dashboard() {
  const router = useRouter()
  const { setAuth, currentUser } = useStore()
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [channels, setChannels] = useState<Channel[]>([])
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingChannel, setEditingChannel] = useState<Channel | undefined>()
  const [originalChannelName, setOriginalChannelName] = useState<string>('')
  const [logsModalOpen, setLogsModalOpen] = useState(false)
  const [logsChannelName, setLogsChannelName] = useState('')
  const [statsModalOpen, setStatsModalOpen] = useState(false)
  const [statsChannelName, setStatsChannelName] = useState('')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [detailChannel, setDetailChannel] = useState<Channel | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteChannelName, setDeleteChannelName] = useState('')
  const [stopModalOpen, setStopModalOpen] = useState(false)
  const [stopChannelName, setStopChannelName] = useState('')
  const [expandedChannel, setExpandedChannel] = useState<string | null>(null)
  const [streamInfoCache, setStreamInfoCache] = useState<Record<string, StreamInfo>>({})
  const [srtStatusCache, setSrtStatusCache] = useState<Record<string, SrtStatus>>({})
  const [streamInfoLoading, setStreamInfoLoading] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [serverStats, setServerStats] = useState<ServerStats | null>(null)

  const { channels: wsChannels, isConnected } = useWebSocket({
    onChannelsUpdate: (updated) => setChannels(updated)
  })

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const channelsList = await channelsAPI.getAll()
      setChannels(channelsList)
    } catch {
      // Ignore channel load errors
    }
    try {
      const interfacesList = await systemAPI.getInterfaces()
      setInterfaces(interfacesList)
    } catch {
      // Ignore interface load errors
    }
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (wsChannels.length > 0) setChannels(wsChannels)
  }, [wsChannels])

  // Periodically load stream info and analytics for all running channels
  useEffect(() => {
    const loadAllData = async () => {
      try {
        const [allInfo, analyticsData] = await Promise.all([
          channelsAPI.getAllStreamInfo(),
          channelsAPI.getAnalyticsSummary()
        ])
        setStreamInfoCache(allInfo)
        setAnalytics(analyticsData)
      } catch {
        // Ignore errors
      }

      // Load server stats separately (may fail if psutil not installed)
      try {
        const stats = await systemAPI.getStats()
        setServerStats(stats)
      } catch {
        // Ignore - server stats are optional
      }
    }

    // Load immediately
    loadAllData()

    // Then every 3 seconds for real-time stats
    const interval = setInterval(loadAllData, 3000)
    return () => clearInterval(interval)
  }, [])

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('srt-manager-storage')
    setAuth(false, null, null)
    window.location.reload()
  }

  // Channel actions
  const handleToggle = async (name: string, isRunning: boolean) => {
    setActionLoading(name)
    try {
      if (isRunning) {
        await channelsAPI.stop(name)
      } else {
        await channelsAPI.start(name)
      }
      // Auto-refresh after action
      setTimeout(loadData, 300)
    } catch (error) {
      console.error('Failed to toggle:', error)
    } finally {
      setTimeout(() => setActionLoading(null), 500)
    }
  }

  const handleStart = async (name: string) => {
    await handleToggle(name, false)
  }

  const handleStop = (name: string) => {
    setStopChannelName(name)
    setStopModalOpen(true)
  }

  const confirmStop = async () => {
    if (!stopChannelName) return
    try {
      await handleToggle(stopChannelName, true)
    } finally {
      setStopModalOpen(false)
      setStopChannelName('')
    }
  }

  const handleDelete = (name: string) => {
    setDeleteChannelName(name)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteChannelName) return
    try {
      await channelsAPI.delete(deleteChannelName)
      loadData()
    } catch (error) {
      console.error('Failed to delete:', error)
    } finally {
      setDeleteModalOpen(false)
      setDeleteChannelName('')
    }
  }

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    setOriginalChannelName(channel.channel_name)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingChannel(undefined)
    setOriginalChannelName('')
    setModalMode('create')
    setModalOpen(true)
  }

  const handleSave = async (data: any) => {
    try {
      if (modalMode === 'create') {
        await channelsAPI.create(data)
      } else {
        // Use original channel name for API call (in case of rename)
        await channelsAPI.update(originalChannelName, data)
      }
      loadData()
    } catch (error) {
      console.error('Failed to save:', error)
    }
  }

  // Toggle expanded channel
  const handleToggleExpand = (channelName: string) => {
    if (expandedChannel === channelName) {
      setExpandedChannel(null)
    } else {
      setExpandedChannel(channelName)
    }
  }

  // Format bitrate helper
  const formatBitrate = (bitrate: number | null | undefined) => {
    if (!bitrate) return 'N/A'
    if (bitrate >= 1000000) return `${(bitrate / 1000000).toFixed(2)} Mbps`
    return `${(bitrate / 1000).toFixed(0)} Kbps`
  }

  // Handle sort
  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null
      }
      return { key, direction: 'asc' }
    })
  }

  // Filter and sort channels
  const filteredChannels = channels
    .filter(ch => {
      return ch.channel_name.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      if (!sortConfig) return 0

      let aVal: any, bVal: any

      switch (sortConfig.key) {
        case 'name':
          aVal = a.channel_name.toLowerCase()
          bVal = b.channel_name.toLowerCase()
          break
        case 'status':
          aVal = a.status
          bVal = b.status
          break
        case 'input':
          aVal = `${a.input_protocol}://${a.input_ip}:${a.input_port}`
          bVal = `${b.input_protocol}://${b.input_ip}:${b.input_port}`
          break
        case 'output':
          aVal = `${a.output_protocol}://${a.output_port}`
          bVal = `${b.output_protocol}://${b.output_port}`
          break
        case 'pid':
          aVal = a.pid || 0
          bVal = b.pid || 0
          break
        default:
          return 0
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

  const stats = {
    total: channels.length,
    running: channels.filter(ch => ch.status === 'running').length,
    stopped: channels.filter(ch => ch.status === 'stopped').length
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] dark:bg-[#111]">
      {/* Header */}
      <header className="bg-white dark:bg-[#1a1a1a] border-b border-[#e5e5e5] dark:border-[#333] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#111] dark:bg-white flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-5 h-5 text-white dark:text-[#111]"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
                <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#111] dark:text-white">SRT Manager</h1>
          </div>

          {/* Server Stats */}
          <div className="flex items-center gap-4">
            {serverStats && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <Cpu className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-medium text-[#111] dark:text-white">
                    {serverStats.cpu_percent}%
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <HardDrive className="w-4 h-4 text-purple-500" />
                  <span className="text-xs font-medium text-[#111] dark:text-white">
                    {serverStats.memory_percent}%
                  </span>
                  <span className="text-xs text-gray-500">
                    ({serverStats.memory_used_gb.toFixed(1)}/{serverStats.memory_total_gb.toFixed(1)} GB)
                  </span>
                </div>
                <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-1">
                    <ArrowDown className="w-3 h-3 text-green-500" />
                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                      {serverStats.network_rate_recv_mbps.toFixed(1)} Mbps
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ArrowUp className="w-3 h-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                      {serverStats.network_rate_sent_mbps.toFixed(1)} Mbps
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-[#111] dark:text-[#ccc]">
              {currentUser?.username || 'User'}
            </span>

            {/* Settings Menu */}
            <div className="relative">
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className="p-2 hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-lg transition-colors text-[#111] dark:text-[#ccc]"
                title="Settings"
              >
                <Settings className="w-4 h-4" />
              </button>

              {showSettingsMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowSettingsMenu(false)}
                  />
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#1a1a1a] rounded-lg shadow-lg border border-[#e5e5e5] dark:border-[#333] z-50 overflow-hidden">
                    <div className="py-1">
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors text-left text-sm text-[#111] dark:text-white"
                        onClick={() => {
                          setShowSettingsMenu(false)
                          router.push('/security')
                        }}
                      >
                        <Shield className="w-4 h-4" />
                        Security & Users
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors text-left text-sm text-[#111] dark:text-white opacity-50 cursor-not-allowed"
                        disabled
                      >
                        <Download className="w-4 h-4" />
                        Export Channels
                      </button>
                      <button
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors text-left text-sm text-[#111] dark:text-white opacity-50 cursor-not-allowed"
                        disabled
                      >
                        <Upload className="w-4 h-4" />
                        Import Channels
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={toggleDarkMode}
              className="p-2 hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-lg transition-colors text-[#111] dark:text-[#ccc]"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-[#f0f0f0] dark:hover:bg-[#333] rounded-lg transition-colors text-red-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#333]">
            <div className="text-2xl font-bold text-[#111] dark:text-white">{stats.total}</div>
            <div className="text-sm text-[#333] dark:text-[#999]">Total Channels</div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#333]">
            <div className="text-2xl font-bold text-green-600">{stats.running}</div>
            <div className="text-sm text-[#333] dark:text-[#999]">Running</div>
          </div>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-4 border border-[#e5e5e5] dark:border-[#333]">
            <div className="text-2xl font-bold text-[#333] dark:text-[#888]">{stats.stopped}</div>
            <div className="text-sm text-[#333] dark:text-[#999]">Stopped</div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
            <input
              type="text"
              placeholder="Search channels..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] rounded-lg text-sm text-[#111] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#111] dark:focus:ring-white"
            />
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-white dark:bg-[#1a1a1a] border border-[#e5e5e5] dark:border-[#333] rounded-lg hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors text-[#111] dark:text-[#ccc]"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 bg-[#111] dark:bg-white text-white dark:text-[#111] rounded-lg hover:bg-[#333] dark:hover:bg-[#eee] transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Channel
          </button>
        </div>

        {/* Channels Table */}
        <div className="bg-white dark:bg-[#1a1a1a] rounded-lg border border-[#e5e5e5] dark:border-[#333] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f9f9f9] dark:bg-[#222] border-b border-[#e5e5e5] dark:border-[#333]">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase cursor-pointer hover:bg-[#eee] dark:hover:bg-[#333] transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    Name
                    {sortConfig?.key === 'name' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('status')}
                  className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase cursor-pointer hover:bg-[#eee] dark:hover:bg-[#333] transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    Status
                    {sortConfig?.key === 'status' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase">RCV</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase">SND</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase">Lost</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase">RTT</th>
                <th
                  onClick={() => handleSort('input')}
                  className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase cursor-pointer hover:bg-[#eee] dark:hover:bg-[#333] transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    Input
                    {sortConfig?.key === 'input' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('output')}
                  className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase cursor-pointer hover:bg-[#eee] dark:hover:bg-[#333] transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    Output
                    {sortConfig?.key === 'output' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th
                  onClick={() => handleSort('pid')}
                  className="px-4 py-3 text-left text-xs font-medium text-[#333] dark:text-[#999] uppercase cursor-pointer hover:bg-[#eee] dark:hover:bg-[#333] transition-colors select-none"
                >
                  <span className="flex items-center gap-1">
                    PID
                    {sortConfig?.key === 'pid' && (
                      <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </span>
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#333] dark:text-[#999] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e5e5] dark:divide-[#333]">
              {filteredChannels.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-[#999]">
                    {channels.length === 0 ? 'No channels yet. Create your first channel.' : 'No channels match your search.'}
                  </td>
                </tr>
              ) : (
                filteredChannels.map((channel) => {
                  const isExpanded = expandedChannel === channel.channel_name
                  const streamInfo = streamInfoCache[channel.channel_name]
                  const isLoadingInfo = streamInfoLoading === channel.channel_name
                  const channelAnalytics = analytics?.channels.find(c => c.name === channel.channel_name)

                  return (
                    <>
                      <tr key={channel.channel_name} className="hover:bg-[#f9f9f9] dark:hover:bg-[#222]">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleExpand(channel.channel_name)}
                            className="flex items-center gap-2 font-medium text-[#111] dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            )}
                            {channel.channel_name}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium w-fit ${
                              channel.status === 'running'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {channel.status === 'running' && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
                              {channel.status}
                            </span>
                            {/* Show stream info summary for running channels */}
                            {channel.status === 'running' && streamInfoCache[channel.channel_name]?.success &&
                              streamInfoCache[channel.channel_name].total_bitrate_mbps && (
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                  <Zap className="w-3 h-3" />
                                  {streamInfoCache[channel.channel_name].total_bitrate_mbps} Mbps
                                </span>
                              </div>
                            )}
                            {channel.status === 'running' && streamInfoCache[channel.channel_name]?.status === 'timeout' && (
                              <span className="text-xs text-orange-500">Analyzing...</span>
                            )}
                          </div>
                        </td>
                        {/* Bitrate In (from stream analysis) */}
                        <td className="px-4 py-3 text-xs">
                          {channel.status === 'running' ? (
                            <div className="text-blue-600 dark:text-blue-400 font-medium">
                              {streamInfoCache[channel.channel_name]?.total_bitrate_mbps
                                ? `${streamInfoCache[channel.channel_name].total_bitrate_mbps} Mbps`
                                : channelAnalytics?.srt_stats?.send_rate_mbps
                                  ? `${channelAnalytics.srt_stats.send_rate_mbps.toFixed(2)} Mbps`
                                  : '-'}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {/* Bitrate Out */}
                        <td className="px-4 py-3 text-xs">
                          {channel.status === 'running' && channelAnalytics?.srt_stats ? (
                            <div className="text-green-600 dark:text-green-400 font-medium">
                              {channelAnalytics.srt_stats.send_rate_mbps?.toFixed(2) || '0'} Mbps
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {/* Lost Packets */}
                        <td className="px-4 py-3 text-xs">
                          {channel.status === 'running' && channelAnalytics?.srt_stats ? (
                            <span className={`font-medium ${
                              channelAnalytics.srt_stats.packets_lost > 0
                                ? 'text-red-500'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {channelAnalytics.srt_stats.packets_lost || 0}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        {/* RTT */}
                        <td className="px-4 py-3 text-xs">
                          {channel.status === 'running' && channelAnalytics?.srt_stats ? (
                            <span className={`font-medium ${
                              channelAnalytics.srt_stats.rtt_ms > 100
                                ? 'text-red-500'
                                : channelAnalytics.srt_stats.rtt_ms > 50
                                  ? 'text-yellow-500'
                                  : 'text-green-600 dark:text-green-400'
                            }`}>
                              {channelAnalytics.srt_stats.rtt_ms?.toFixed(1) || '0'} ms
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#333] dark:text-[#999]">
                          {channel.input_protocol}://{channel.input_ip}:{channel.input_port}
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            {/* Show destinations if available, otherwise show main output */}
                            {channel.destinations && channel.destinations.length > 0 ? (
                              <div className="space-y-0.5">
                                {channel.destinations.map((dest: any, idx: number) => (
                                  <div key={idx} className="font-mono text-xs text-[#333] dark:text-[#999]">
                                    {dest.protocol || 'srt'}://
                                    {dest.multicast_ip || dest.host || '0.0.0.0'}:{dest.port}
                                    <span className="ml-1 text-gray-400">({dest.mode})</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="font-mono text-xs text-[#333] dark:text-[#999]">
                                {channel.output_protocol || 'srt'}://
                                {channel.output_multicast_ip || channel.destination_host || '0.0.0.0'}:{channel.output_port}
                                <span className="ml-1 text-gray-400">({channel.mode})</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-[#333] dark:text-[#999]">
                          {channel.status === 'running' && (channel.pids?.length || channel.pid) ? (
                            channel.pids && channel.pids.length > 1 ? (
                              <div className="space-y-0.5">
                                {channel.pids.map((pid, idx) => (
                                  <div key={idx}>{pid}</div>
                                ))}
                              </div>
                            ) : (
                              channel.pids?.[0] || channel.pid
                            )
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => channel.status === 'running' ? handleStop(channel.channel_name) : handleStart(channel.channel_name)}
                              disabled={actionLoading === channel.channel_name}
                              className={`p-1.5 rounded transition-all min-w-[28px] ${
                                actionLoading === channel.channel_name
                                  ? 'bg-gray-200 dark:bg-gray-700 cursor-wait'
                                  : channel.status === 'running'
                                    ? 'hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600'
                                    : 'hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600'
                              }`}
                              title={channel.status === 'running' ? 'Stop' : 'Start'}
                            >
                              {actionLoading === channel.channel_name ? (
                                <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />
                              ) : channel.status === 'running' ? (
                                <Square className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => { setDetailChannel(channel); setDetailModalOpen(true) }}
                              className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded text-indigo-600"
                              title="Details & Statistics"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleEdit(channel)}
                              disabled={channel.status === 'running'}
                              className="p-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded disabled:opacity-30 text-indigo-600"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(channel.channel_name)}
                              disabled={channel.status === 'running'}
                              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-600 disabled:opacity-30"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Channel Details Panel */}
                      {isExpanded && (
                        <tr key={`${channel.channel_name}-info`}>
                          <td colSpan={10} className="px-4 py-0">
                            <div className="py-4 px-4 bg-gray-50/50 dark:bg-gray-900/30">
                              <div className="space-y-4">

                                {/* Channel Configuration */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                  {/* Input Configuration */}
                                  <div className="p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-blue-600 dark:text-blue-400">
                                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                                      INPUT
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Protocol</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{channel.input_protocol?.toUpperCase()}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Address</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{channel.input_ip}:{channel.input_port}</span>
                                      </div>
                                      {channel.input_mode && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Mode</span>
                                          <span className="font-mono text-gray-900 dark:text-white">{channel.input_mode}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Latency</span>
                                        <span className="font-mono text-gray-900 dark:text-white">{channel.input_latency} ms</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-500 dark:text-gray-400">Buffer (rcv/snd)</span>
                                        <span className="font-mono text-gray-900 dark:text-white text-xs">
                                          {(channel.input_rcvbuf / 1000).toFixed(0)}K / {(channel.input_sndbuf / 1000).toFixed(0)}K
                                        </span>
                                      </div>
                                      {channel.input_passphrase && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Encryption</span>
                                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs">
                                            AES-{(channel.input_pbkeylen || 16) * 8}
                                          </span>
                                        </div>
                                      )}
                                      {channel.input_extra_params && (
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Extra Params</span>
                                          <span className="font-mono text-gray-900 dark:text-white text-xs max-w-[200px] truncate" title={channel.input_extra_params}>
                                            {channel.input_extra_params}
                                          </span>
                                        </div>
                                      )}
                                      {/* Connection status */}
                                      {channel.status === 'running' && (
                                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                          <div className="text-gray-500 dark:text-gray-400 mb-2">Source</div>
                                          {channel.input_protocol === 'udp' ? (
                                            <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-blue-500" />
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Multicast/UDP (no direct connection)
                                              </span>
                                            </div>
                                          ) : channelAnalytics?.connections && channelAnalytics.connections.filter(c => c.direction === 'input').length > 0 ? (
                                            channelAnalytics.connections.filter(c => c.direction === 'input').map((conn, idx) => (
                                              <div key={idx} className="flex items-center gap-2">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                                                  {conn.remote_ip}:{conn.remote_port}
                                                </span>
                                              </div>
                                            ))
                                          ) : (
                                            <div className="flex items-center gap-2">
                                              <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                              <span className="text-xs text-yellow-600 dark:text-yellow-400">
                                                Waiting for connection...
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Output Configuration */}
                                  <div className="p-4 bg-white dark:bg-[#1a1a1a] rounded-xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-purple-600 dark:text-purple-400">
                                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                                      OUTPUT {channel.destinations && channel.destinations.length > 0 && `(${channel.destinations.length})`}
                                    </div>

                                    {/* Show destinations if available, otherwise show main output */}
                                    {channel.destinations && channel.destinations.length > 0 ? (
                                      <div className="space-y-3">
                                        {channel.destinations.map((dest: any, idx: number) => (
                                          <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-medium">
                                              <Radio className="w-3 h-3" />
                                              Output #{idx + 1}
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500 dark:text-gray-400">Protocol</span>
                                              <span className="font-mono text-gray-900 dark:text-white">{(dest.protocol || 'srt').toUpperCase()}</span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500 dark:text-gray-400">Address</span>
                                              <span className="font-mono text-gray-900 dark:text-white">
                                                {dest.host || dest.multicast_ip || '0.0.0.0'}:{dest.port}
                                              </span>
                                            </div>
                                            <div className="flex justify-between">
                                              <span className="text-gray-500 dark:text-gray-400">Mode</span>
                                              <span className="font-mono text-gray-900 dark:text-white">{dest.mode}</span>
                                            </div>
                                            {dest.passphrase && (
                                              <div className="flex justify-between">
                                                <span className="text-gray-500 dark:text-gray-400">Encryption</span>
                                                <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs">
                                                  AES-{((dest.pbkeylen || 16) * 8)}
                                                </span>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Protocol</span>
                                          <span className="font-mono text-gray-900 dark:text-white">{(channel.output_protocol || 'srt').toUpperCase()}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Mode</span>
                                          <span className="font-mono text-gray-900 dark:text-white">{channel.mode}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Port</span>
                                          <span className="font-mono text-gray-900 dark:text-white">{channel.output_port}</span>
                                        </div>
                                        {channel.destination_host && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Destination</span>
                                            <span className="font-mono text-gray-900 dark:text-white">{channel.destination_host}</span>
                                          </div>
                                        )}
                                        <div className="flex justify-between">
                                          <span className="text-gray-500 dark:text-gray-400">Latency</span>
                                          <span className="font-mono text-gray-900 dark:text-white">{channel.output_latency} ms</span>
                                        </div>
                                        {(channel.passphrase || channel.output_passphrase) && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Encryption</span>
                                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded text-xs">
                                              AES-{((channel.output_pbkeylen || channel.pbkeylen || 16) * 8)}
                                            </span>
                                          </div>
                                        )}
                                        {channel.output_extra_params && (
                                          <div className="flex justify-between">
                                            <span className="text-gray-500 dark:text-gray-400">Extra Params</span>
                                            <span className="font-mono text-gray-900 dark:text-white text-xs max-w-[200px] truncate" title={channel.output_extra_params}>
                                              {channel.output_extra_params}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    {/* Connected clients status */}
                                    {channel.status === 'running' && channel.mode === 'listener' && (
                                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                        <div className="text-gray-500 dark:text-gray-400 text-sm mb-2">Connected Clients</div>
                                        {channelAnalytics?.connections && channelAnalytics.connections.filter(c => c.direction === 'output' || c.direction === 'unknown').length > 0 ? (
                                          <div className="space-y-1">
                                            {channelAnalytics.connections.filter(c => c.direction === 'output' || c.direction === 'unknown').map((conn, idx) => (
                                              <div key={idx} className="flex items-center gap-2 text-sm">
                                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="font-mono text-cyan-600 dark:text-cyan-400">
                                                  {conn.remote_ip}:{conn.remote_port}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="flex items-center gap-2 text-sm">
                                            <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                            <span className="text-yellow-600 dark:text-yellow-400">
                                              Waiting for clients...
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Advanced Settings */}
                                <div className="flex flex-wrap gap-3">
                                  <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Overhead BW:</span>
                                    <span className="ml-1 font-mono text-gray-900 dark:text-white">{channel.oheadbw}%</span>
                                  </div>
                                  <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Max BW:</span>
                                    <span className="ml-1 font-mono text-gray-900 dark:text-white">
                                      {channel.maxbw === -1 ? 'Unlimited' : `${(channel.maxbw / 1000000).toFixed(1)} Mbps`}
                                    </span>
                                  </div>
                                  {channel.streamid && (
                                    <div className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs">
                                      <span className="text-gray-500 dark:text-gray-400">Stream ID:</span>
                                      <span className="ml-1 font-mono text-gray-900 dark:text-white">{channel.streamid}</span>
                                    </div>
                                  )}
                                  {channel.fec_enabled && (
                                    <div className="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-xs text-blue-700 dark:text-blue-300">
                                      FEC Enabled
                                    </div>
                                  )}
                                  {channel.auto_reconnect && (
                                    <div className="px-3 py-1.5 bg-green-100 dark:bg-green-900/50 rounded-lg text-xs text-green-700 dark:text-green-300">
                                      Auto Reconnect
                                    </div>
                                  )}
                                </div>

                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

      </main>

      {/* Modals */}
      <ChannelDialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        mode={modalMode}
        initialData={editingChannel}
        interfaces={interfaces}
      />

      <ChannelLogsModal
        open={logsModalOpen}
        onClose={() => setLogsModalOpen(false)}
        channelName={logsChannelName}
      />

      <ChannelStatsModal
        open={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        channelName={statsChannelName}
      />

      <ChannelDetailModal
        open={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setDetailChannel(null) }}
        channelName={detailChannel?.channel_name || ''}
        channelStatus={detailChannel?.status}
        channelData={detailChannel as any}
      />

      {/* Stop Confirmation Modal */}
      {stopModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setStopModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#e5e5e5] dark:border-[#333] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-amber-500 to-orange-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Square className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Stop Channel</h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-[#333] dark:text-[#ccc] mb-2">
                  Are you sure you want to stop this channel?
                </p>
                <div className="p-3 bg-[#f5f5f5] dark:bg-[#222] rounded-lg border border-[#e5e5e5] dark:border-[#333]">
                  <p className="font-mono font-semibold text-[#111] dark:text-white">
                    {stopChannelName}
                  </p>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-3">
                  All active connections will be terminated.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 bg-[#f9f9f9] dark:bg-[#111] border-t border-[#e5e5e5] dark:border-[#333]">
                <button
                  onClick={() => setStopModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-[#222] border border-[#e5e5e5] dark:border-[#444] rounded-lg text-[#333] dark:text-[#ccc] font-medium hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStop}
                  className="flex-1 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-white font-medium transition-colors"
                >
                  Stop
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={() => setDeleteModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="w-full max-w-md bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-[#e5e5e5] dark:border-[#333] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-600 to-red-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Trash2 className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-lg font-bold text-white">Delete Channel</h2>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <p className="text-[#333] dark:text-[#ccc] mb-2">
                  Are you sure you want to delete this channel?
                </p>
                <div className="p-3 bg-[#f5f5f5] dark:bg-[#222] rounded-lg border border-[#e5e5e5] dark:border-[#333]">
                  <p className="font-mono font-semibold text-[#111] dark:text-white">
                    {deleteChannelName}
                  </p>
                </div>
                <p className="text-sm text-red-600 dark:text-red-400 mt-3">
                  This action cannot be undone.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 px-6 py-4 bg-[#f9f9f9] dark:bg-[#111] border-t border-[#e5e5e5] dark:border-[#333]">
                <button
                  onClick={() => setDeleteModalOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-[#222] border border-[#e5e5e5] dark:border-[#444] rounded-lg text-[#333] dark:text-[#ccc] font-medium hover:bg-[#f0f0f0] dark:hover:bg-[#333] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

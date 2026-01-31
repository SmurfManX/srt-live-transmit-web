'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, BarChart3, Activity, Wifi, Clock, AlertTriangle } from 'lucide-react'
import Button from '@/components/ui/Button'
import { channelsAPI } from '@/lib/api'

interface StatsData {
  Time?: string
  pktSent?: number
  pktRecv?: number
  pktSentLost?: number
  pktRecvLost?: number
  pktRetrans?: number
  pktSentDrop?: number
  pktRecvDrop?: number
  mbpsSendRate?: number
  mbpsRecvRate?: number
  mbpsBandwidth?: number
  msRTT?: number
  [key: string]: any
}

interface ChannelStatsModalProps {
  open: boolean
  onClose: () => void
  channelName: string
}

export default function ChannelStatsModal({ open, onClose, channelName }: ChannelStatsModalProps) {
  const [stats, setStats] = useState<StatsData[]>([])
  const [latest, setLatest] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [timeRange, setTimeRange] = useState<string>('1h')

  const fetchStats = async () => {
    if (!channelName) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await channelsAPI.getStats(channelName, timeRange)
      const data = response.data || []
      setStats(data)
      if (data.length > 0) {
        setLatest(data[data.length - 1])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch stats')
      console.error('Error fetching stats:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchStats()
    }
  }, [open, channelName, timeRange])

  useEffect(() => {
    if (!open || !autoRefresh) return

    const interval = setInterval(() => {
      fetchStats()
    }, 5000)

    return () => clearInterval(interval)
  }, [open, autoRefresh, timeRange])

  const formatNumber = (num: number | undefined, decimals = 2) => {
    if (num === undefined || num === null) return '-'
    return Number(num).toFixed(decimals)
  }

  const formatBigNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '-'
    if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
    if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
    return num.toString()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div
          className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Channel Statistics
                </h2>
                <p className="text-sm text-white/80">{channelName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="h-9 px-3 rounded-lg bg-white/20 text-white border border-white/30 text-sm focus:outline-none"
              >
                <option value="1h" className="text-gray-900">Last 1 hour</option>
                <option value="6h" className="text-gray-900">Last 6 hours</option>
                <option value="24h" className="text-gray-900">Last 24 hours</option>
                <option value="all" className="text-gray-900">All time</option>
              </select>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`text-white ${autoRefresh ? 'bg-white/30 border border-white/50' : 'bg-white/10 hover:bg-white/20'}`}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                <span className="ml-1.5 text-xs">{autoRefresh ? 'Auto' : 'Manual'}</span>
              </Button>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {isLoading && !latest ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
                  <p className="text-gray-500 dark:text-gray-400">Loading statistics...</p>
                </div>
              </div>
            ) : error ? (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            ) : !latest ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                  <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    Start the channel to collect statistics
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Bandwidth</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                      {formatNumber(latest.mbpsBandwidth)} <span className="text-sm font-normal">Mbps</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Wifi className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">RTT</span>
                    </div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                      {formatNumber(latest.msRTT, 1)} <span className="text-sm font-normal">ms</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Send Rate</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                      {formatNumber(latest.mbpsSendRate)} <span className="text-sm font-normal">Mbps</span>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Dropped</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                      {formatBigNumber((latest.pktSentDrop || 0) + (latest.pktRecvDrop || 0))}
                    </div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Packets Sent */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      Packets Sent
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatBigNumber(latest.pktSent)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Lost</div>
                        <div className="text-lg font-semibold text-red-600 dark:text-red-400">{formatBigNumber(latest.pktSentLost)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Dropped</div>
                        <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{formatBigNumber(latest.pktSentDrop)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Retransmitted</div>
                        <div className="text-lg font-semibold text-yellow-600 dark:text-yellow-400">{formatBigNumber(latest.pktRetrans)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Packets Received */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Packets Received
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-lg font-semibold text-gray-800 dark:text-gray-200">{formatBigNumber(latest.pktRecv)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Lost</div>
                        <div className="text-lg font-semibold text-red-600 dark:text-red-400">{formatBigNumber(latest.pktRecvLost)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Dropped</div>
                        <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">{formatBigNumber(latest.pktRecvDrop)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Belated</div>
                        <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">{formatBigNumber(latest.pktRecvBelated)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Data Table */}
                {stats.length > 0 && (
                  <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="p-3 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Recent Data ({stats.length} records)
                      </h3>
                    </div>
                    <div className="overflow-x-auto max-h-64">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400">Time</th>
                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Bandwidth</th>
                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">RTT</th>
                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Sent</th>
                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Recv</th>
                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">Lost</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {stats.slice(-20).reverse().map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono">{row.Time || '-'}</td>
                              <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">{formatNumber(row.mbpsBandwidth)} Mbps</td>
                              <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">{formatNumber(row.msRTT, 1)} ms</td>
                              <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">{formatBigNumber(row.pktSent)}</td>
                              <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">{formatBigNumber(row.pktRecv)}</td>
                              <td className="px-3 py-2 text-right text-red-600 dark:text-red-400">{formatBigNumber((row.pktSentLost || 0) + (row.pktRecvLost || 0))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`} />
              {autoRefresh ? 'Auto-refresh enabled (5s)' : 'Auto-refresh disabled'}
              <span className="text-xs text-gray-500">| {stats.length} records</span>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

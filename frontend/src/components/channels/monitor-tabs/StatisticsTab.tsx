'use client'

import { useState, useEffect } from 'react'
import { Line, Area, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  AreaElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { channelsAPI } from '@/lib/api'

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  AreaElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

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

interface StatisticsTabProps {
  channelName: string
  autoRefresh: boolean
}

export default function StatisticsTab({ channelName, autoRefresh }: StatisticsTabProps) {
  const [stats, setStats] = useState<StatsData[]>([])
  const [timeRange, setTimeRange] = useState('1h')
  const [loading, setLoading] = useState(true)
  const [showTable, setShowTable] = useState(false)

  const fetchStats = async () => {
    try {
      const response = await channelsAPI.getStats(channelName, timeRange)
      setStats(response.data || [])
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [channelName, timeRange])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchStats, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, channelName, timeRange])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    )
  }

  // Prepare chart data
  const labels = stats.map(s => {
    if (!s.Time) return ''
    const time = new Date(s.Time)
    return time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  })

  const bandwidthData = {
    labels,
    datasets: [
      {
        label: 'Bandwidth',
        data: stats.map(s => s.mbpsBandwidth || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Send Rate',
        data: stats.map(s => s.mbpsSendRate || 0),
        borderColor: 'rgb(168, 85, 247)',
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const rttData = {
    labels,
    datasets: [
      {
        label: 'RTT (ms)',
        data: stats.map(s => s.msRTT || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const packetLossData = {
    labels,
    datasets: [
      {
        label: 'Sent Lost',
        data: stats.map(s => s.pktSentLost || 0),
        backgroundColor: 'rgba(239, 68, 68, 0.7)',
      },
      {
        label: 'Recv Lost',
        data: stats.map(s => s.pktRecvLost || 0),
        backgroundColor: 'rgba(251, 146, 60, 0.7)',
      },
    ],
  }

  const packetsData = {
    labels,
    datasets: [
      {
        label: 'Packets Sent',
        data: stats.map(s => s.pktSent || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Packets Received',
        data: stats.map(s => s.pktRecv || 0),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  }

  const commonOptions: ChartOptions<any> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 10,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Performance Graphs
        </h3>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm font-medium focus:ring-2 focus:ring-indigo-500"
        >
          <option value="5m">Last 5 minutes</option>
          <option value="15m">Last 15 minutes</option>
          <option value="1h">Last 1 hour</option>
          <option value="6h">Last 6 hours</option>
          <option value="24h">Last 24 hours</option>
          <option value="all">All time</option>
        </select>
      </div>

      {stats.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">No statistics available</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Data will appear once the stream is active
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bandwidth Chart */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Bandwidth & Send Rate (Mbps)
              </h4>
              <div className="h-64">
                <Area data={bandwidthData} options={commonOptions} />
              </div>
            </div>

            {/* RTT Chart */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Round Trip Time (ms)
              </h4>
              <div className="h-64">
                <Line data={rttData} options={commonOptions} />
              </div>
            </div>

            {/* Packet Loss Chart */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Packet Loss
              </h4>
              <div className="h-64">
                <Bar data={packetLossData} options={commonOptions} />
              </div>
            </div>

            {/* Packets Chart */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                Packets Sent/Received
              </h4>
              <div className="h-64">
                <Line data={packetsData} options={commonOptions} />
              </div>
            </div>
          </div>

          {/* Detailed Table (Collapsible) */}
          <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
            <button
              onClick={() => setShowTable(!showTable)}
              className="w-full flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Detailed Data Table ({stats.length} records)
              </h4>
              {showTable ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>

            {showTable && (
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-400 font-medium">Time</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Bandwidth</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">RTT</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Send Rate</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Recv Rate</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Pkt Sent</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Pkt Recv</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Lost</th>
                      <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-400 font-medium">Dropped</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {stats.slice().reverse().map((row, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">
                          {row.Time || '-'}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {(row.mbpsBandwidth || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {(row.msRTT || 0).toFixed(1)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {(row.mbpsSendRate || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {(row.mbpsRecvRate || 0).toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {formatNumber(row.pktSent)}
                        </td>
                        <td className="px-3 py-2 text-right text-gray-800 dark:text-gray-200">
                          {formatNumber(row.pktRecv)}
                        </td>
                        <td className="px-3 py-2 text-right text-red-600 dark:text-red-400 font-semibold">
                          {formatNumber((row.pktSentLost || 0) + (row.pktRecvLost || 0))}
                        </td>
                        <td className="px-3 py-2 text-right text-orange-600 dark:text-orange-400 font-semibold">
                          {formatNumber((row.pktSentDrop || 0) + (row.pktRecvDrop || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function formatNumber(num: number | undefined) {
  if (num === undefined || num === null) return '-'
  if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(2) + 'K'
  return num.toString()
}

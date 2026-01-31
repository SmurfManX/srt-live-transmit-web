'use client'

import { useState, useEffect } from 'react'
import { Activity, Wifi, Clock, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'
import { channelsAPI } from '@/lib/api'

interface StatsData {
  mbpsBandwidth?: number
  msRTT?: number
  mbpsSendRate?: number
  mbpsRecvRate?: number
  pktSentLost?: number
  pktRecvLost?: number
  pktSentDrop?: number
  pktRecvDrop?: number
}

interface OverviewTabProps {
  channelName: string
  autoRefresh: boolean
}

export default function OverviewTab({ channelName, autoRefresh }: OverviewTabProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    try {
      const statsResponse = await channelsAPI.getStats(channelName, '5m')

      // Get latest stats
      if (statsResponse.data && statsResponse.data.length > 0) {
        setStats(statsResponse.data[statsResponse.data.length - 1])
      }
    } catch (err) {
      console.error('Error fetching overview data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [channelName])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchData, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, channelName])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading stream data...</p>
        </div>
      </div>
    )
  }

  const packetLoss = ((stats?.pktSentLost || 0) + (stats?.pktRecvLost || 0))
  const hasIssues = (stats?.msRTT || 0) > 100 || packetLoss > 100

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Status Banner */}
      <div className={`p-4 rounded-xl border-2 ${hasIssues ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800' : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${hasIssues ? 'bg-orange-500' : 'bg-green-500'}`}>
            {hasIssues ? (
              <AlertTriangle className="w-5 h-5 text-white" />
            ) : (
              <Activity className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h3 className={`font-semibold ${hasIssues ? 'text-orange-900 dark:text-orange-200' : 'text-green-900 dark:text-green-200'}`}>
              {hasIssues ? 'Stream Quality Issues Detected' : 'Stream Running Smoothly'}
            </h3>
            <p className={`text-sm ${hasIssues ? 'text-orange-700 dark:text-orange-300' : 'text-green-700 dark:text-green-300'}`}>
              {hasIssues ? 'High RTT or packet loss detected. Check your network connection.' : 'All metrics are within normal range.'}
            </p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Activity className="w-5 h-5" />}
          label="Bandwidth"
          value={stats?.mbpsBandwidth?.toFixed(2) || '0'}
          unit="Mbps"
          color="blue"
          trend="stable"
        />
        <MetricCard
          icon={<Wifi className="w-5 h-5" />}
          label="RTT"
          value={stats?.msRTT?.toFixed(1) || '0'}
          unit="ms"
          color={stats && stats.msRTT > 100 ? 'orange' : 'green'}
          trend={(stats?.msRTT || 0) > 100 ? 'up' : 'stable'}
        />
        <MetricCard
          icon={<Clock className="w-5 h-5" />}
          label="Send Rate"
          value={stats?.mbpsSendRate?.toFixed(2) || '0'}
          unit="Mbps"
          color="purple"
          trend="stable"
        />
        <MetricCard
          icon={<AlertTriangle className="w-5 h-5" />}
          label="Packet Loss"
          value={packetLoss.toString()}
          unit="packets"
          color={packetLoss > 100 ? 'red' : 'gray'}
          trend={packetLoss > 100 ? 'up' : 'stable'}
        />
      </div>

    </div>
  )
}

// Helper Components
function MetricCard({ icon, label, value, unit, color, trend }: {
  icon: React.ReactNode
  label: string
  value: string
  unit: string
  color: string
  trend: 'up' | 'down' | 'stable'
}) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400',
    green: 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400',
    purple: 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400',
    orange: 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
    red: 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    gray: 'from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400',
  }

  return (
    <div className={`p-4 bg-gradient-to-br rounded-xl border ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-medium">{label}</span>
        </div>
        {trend === 'up' && <TrendingUp className="w-4 h-4 text-red-500" />}
        {trend === 'down' && <TrendingDown className="w-4 h-4 text-green-500" />}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-sm font-normal opacity-70">{unit}</span>
      </div>
    </div>
  )
}


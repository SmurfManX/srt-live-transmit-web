'use client'

import { useState, useEffect } from 'react'
import { Users, Globe, Clock, Activity, TrendingUp, AlertCircle } from 'lucide-react'

interface Client {
  id: string
  ip: string
  port: number
  connectedAt: string
  duration: string
  bytesReceived: number
  bytesSent: number
  bandwidth: number
  status: 'active' | 'idle' | 'warning'
}

interface ClientsTabProps {
  channelName: string
  autoRefresh: boolean
}

export default function ClientsTab({ channelName, autoRefresh }: ClientsTabProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data - replace with actual API call
  const fetchClients = async () => {
    // TODO: Replace with actual API call
    // const response = await channelsAPI.getClients(channelName)
    // setClients(response.clients)

    // Mock data for demonstration
    setTimeout(() => {
      setClients([
        {
          id: '1',
          ip: '192.168.1.100',
          port: 45123,
          connectedAt: new Date(Date.now() - 3600000).toISOString(),
          duration: '1h 0m',
          bytesReceived: 1024 * 1024 * 500, // 500 MB
          bytesSent: 1024 * 1024 * 10, // 10 MB
          bandwidth: 5.2,
          status: 'active'
        },
        {
          id: '2',
          ip: '10.0.0.50',
          port: 51234,
          connectedAt: new Date(Date.now() - 1800000).toISOString(),
          duration: '30m',
          bytesReceived: 1024 * 1024 * 250,
          bytesSent: 1024 * 1024 * 5,
          bandwidth: 4.8,
          status: 'active'
        },
        {
          id: '3',
          ip: '172.16.0.10',
          port: 49876,
          connectedAt: new Date(Date.now() - 120000).toISOString(),
          duration: '2m',
          bytesReceived: 1024 * 1024 * 20,
          bytesSent: 1024 * 100,
          bandwidth: 0.5,
          status: 'warning'
        }
      ])
      setLoading(false)
    }, 500)
  }

  useEffect(() => {
    fetchClients()
  }, [channelName])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchClients, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, channelName])

  const formatBytes = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
    }
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`
    }
    return `${bytes} B`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-800'
      case 'idle':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800'
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800'
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading connected clients...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-indigo-600 dark:text-indigo-400">Total Clients</p>
              <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{clients.length}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 dark:text-green-400">Active Connections</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {clients.filter(c => c.status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20 rounded-xl border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600 rounded-lg">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 dark:text-purple-400">Total Bandwidth</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                {clients.reduce((sum, c) => sum + c.bandwidth, 0).toFixed(1)} Mbps
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">No clients connected</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Waiting for incoming connections...
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Connected Clients ({clients.length})
          </h3>

          {clients.map((client) => (
            <div
              key={client.id}
              className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                    <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                      {client.ip}:{client.port}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                      Connected {client.duration}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(client.status)}`}>
                    {client.status === 'active' && (
                      <>
                        <span className="inline-block w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></span>
                        Active
                      </>
                    )}
                    {client.status === 'idle' && 'Idle'}
                    {client.status === 'warning' && (
                      <>
                        <AlertCircle className="inline w-3 h-3 mr-1" />
                        Low Bandwidth
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bandwidth</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {client.bandwidth.toFixed(2)} Mbps
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Received</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatBytes(client.bytesReceived)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatBytes(client.bytesSent)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Connected At</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {new Date(client.connectedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              {/* Action buttons - optional */}
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <button className="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  View Details
                </button>
                <button className="px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  Disconnect
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Note about API */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-1">
              API Integration Required
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This tab displays mock data. Connect your backend API endpoint for real client connection data.
              Expected endpoint: <code className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/50 rounded font-mono text-xs">GET /api/channels/{`{name}`}/clients</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

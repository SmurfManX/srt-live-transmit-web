'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw } from 'lucide-react'
import Button from '@/components/ui/Button'
import OverviewTab from './monitor-tabs/OverviewTab'
import StatisticsTab from './monitor-tabs/StatisticsTab'
import StreamInfoTab from './monitor-tabs/StreamInfoTab'
import LogsTab from './monitor-tabs/LogsTab'
import ClientsTab from './monitor-tabs/ClientsTab'

type TabType = 'overview' | 'statistics' | 'streaminfo' | 'logs' | 'clients'

interface StreamMonitorProps {
  open: boolean
  onClose: () => void
  channelName: string
  initialTab?: TabType
}

export default function StreamMonitor({
  open,
  onClose,
  channelName,
  initialTab = 'overview'
}: StreamMonitorProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab)
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Reset tab when modal opens
  useEffect(() => {
    if (open) {
      setActiveTab(initialTab)
    }
  }, [open, initialTab])

  if (!open) return null

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'statistics' as TabType, label: 'Statistics', icon: '📈' },
    { id: 'streaminfo' as TabType, label: 'Stream Info', icon: '🎬' },
    { id: 'logs' as TabType, label: 'Logs', icon: '📝' },
    { id: 'clients' as TabType, label: 'Clients', icon: '👥' },
  ]

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
          className="relative w-full max-w-7xl max-h-[90vh] overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-purple-600">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Stream Monitor
                </h2>
                <p className="text-sm text-white/80">{channelName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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

          {/* Tabs Navigation */}
          <div className="flex-shrink-0 flex items-center gap-1 px-6 pt-4 pb-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all
                  ${activeTab === tab.id
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <span className="text-base">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'overview' && (
              <OverviewTab
                channelName={channelName}
                autoRefresh={autoRefresh}
              />
            )}
            {activeTab === 'statistics' && (
              <StatisticsTab
                channelName={channelName}
                autoRefresh={autoRefresh}
              />
            )}
            {activeTab === 'streaminfo' && (
              <StreamInfoTab
                channelName={channelName}
                autoRefresh={autoRefresh}
              />
            )}
            {activeTab === 'logs' && (
              <LogsTab
                channelName={channelName}
                autoRefresh={autoRefresh}
              />
            )}
            {activeTab === 'clients' && (
              <ClientsTab
                channelName={channelName}
                autoRefresh={autoRefresh}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
              {autoRefresh ? 'Live monitoring active' : 'Live monitoring paused'}
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

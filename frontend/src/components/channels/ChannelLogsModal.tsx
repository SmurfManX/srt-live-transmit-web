'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, Terminal, Filter } from 'lucide-react'
import Button from '@/components/ui/Button'
import { channelsAPI } from '@/lib/api'

interface LogEntry {
  process_idx: number
  text: string
  timestamp: string
}

interface ProcessInfo {
  idx: number
  protocol: string
  mode: string
  host: string
  port: number
}

interface ChannelLogsModalProps {
  open: boolean
  onClose: () => void
  channelName: string
}

export default function ChannelLogsModal({ open, onClose, channelName }: ChannelLogsModalProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [hasMultipleProcesses, setHasMultipleProcesses] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<number | undefined>(undefined)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchLogs = async () => {
    if (!channelName) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await channelsAPI.getLogs(channelName, 200, selectedProcess)
      setLogs(response.logs)
      setProcesses(response.processes)
      // Only update hasMultipleProcesses on initial load (when no process selected)
      // This prevents the filter from disappearing when selecting a specific process
      if (selectedProcess === undefined) {
        setHasMultipleProcesses(response.has_multiple_processes)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
      console.error('Error fetching logs:', err)
    } finally {
      setIsLoading(false)
    }
  }

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedProcess(undefined)
      setHasMultipleProcesses(false)
    }
  }, [open, channelName])

  // Fetch logs when modal is open or selected process changes
  useEffect(() => {
    if (open) {
      fetchLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, channelName, selectedProcess])

  useEffect(() => {
    if (!open || !autoRefresh) return

    const interval = setInterval(() => {
      fetchLogs()
    }, 3000) // Refresh every 3 seconds

    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, autoRefresh, selectedProcess])

  const getProcessLabel = (process: ProcessInfo) => {
    return `Process ${process.idx + 1}: ${process.protocol.toUpperCase()} ${process.mode} ${process.host ? `${process.host}:` : ''}${process.port}`
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
              <div className="sticky top-0 z-10 flex items-center justify-between p-6 border-b bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg backdrop-blur-sm">
                    <Terminal className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Channel Logs
                    </h2>
                    <p className="text-sm text-gray-300">{channelName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`text-white ${autoRefresh ? 'bg-indigo-500/30 border border-indigo-400/50' : 'bg-gray-700 hover:bg-gray-600'}`}
                    title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
                  >
                    <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin text-indigo-300' : ''}`} />
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

              {/* Process Filter */}
              {hasMultipleProcesses && processes.length > 0 && (
                <div className="p-4 bg-gray-100 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                    <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Filter by Process:
                    </label>
                    <select
                      value={selectedProcess === undefined ? 'all' : selectedProcess}
                      onChange={(e) => setSelectedProcess(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
                      className="flex-1 max-w-md h-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="all">All Processes ({processes.length})</option>
                      {processes.map((process) => (
                        <option key={process.idx} value={process.idx}>
                          {getProcessLabel(process)}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {logs.length} log entries
                    </span>
                  </div>
                </div>
              )}

              {/* Logs Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {isLoading && logs.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <RefreshCw className="w-8 h-8 mx-auto mb-2 text-gray-400 animate-spin" />
                      <p className="text-gray-500 dark:text-gray-400">Loading logs...</p>
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-600 dark:text-red-400">{error}</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <Terminal className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                      <p className="text-gray-500 dark:text-gray-400">No logs available</p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                        Start the channel to see logs
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="font-mono text-xs bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    {logs.map((log, index) => (
                      <div
                        key={index}
                        className="py-1 hover:bg-gray-800 transition-colors"
                      >
                        {hasMultipleProcesses && (
                          <span className={`inline-block px-2 py-0.5 mr-2 rounded text-[10px] font-semibold ${
                            log.process_idx === 0 ? 'bg-blue-600' :
                            log.process_idx === 1 ? 'bg-green-600' :
                            log.process_idx === 2 ? 'bg-purple-600' :
                            'bg-orange-600'
                          }`}>
                            P{log.process_idx + 1}
                          </span>
                        )}
                        <span className="text-green-400">{log.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 flex items-center justify-between px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-indigo-500 animate-pulse' : 'bg-gray-400'}`} />
                  {autoRefresh ? `Auto-refresh enabled (3s)` : 'Auto-refresh disabled'}
                  <span className="text-xs text-gray-500">| {logs.length} entries</span>
                </div>
                <Button
                  variant="outline"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
    </>
  )
}

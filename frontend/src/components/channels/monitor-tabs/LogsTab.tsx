'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Filter, AlertCircle, CheckCircle, Info, XCircle, Plug, PlugZap } from 'lucide-react'
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

type LogLevel = 'all' | 'error' | 'warning' | 'info' | 'connection'
type TimeRange = 'all' | '1h' | '3h' | '6h' | '12h' | '24h'

interface LogsTabProps {
  channelName: string
  autoRefresh: boolean
}

export default function LogsTab({ channelName, autoRefresh }: LogsTabProps) {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [processes, setProcesses] = useState<ProcessInfo[]>([])
  const [selectedProcess, setSelectedProcess] = useState<number | undefined>(undefined)
  const [searchTerm, setSearchTerm] = useState('')
  const [logLevel, setLogLevel] = useState<LogLevel>('all')
  const [timeRange, setTimeRange] = useState<TimeRange>('all')
  const [autoScroll, setAutoScroll] = useState(true)
  const [loading, setLoading] = useState(true)
  const logsEndRef = useRef<HTMLDivElement>(null)

  const fetchLogs = async () => {
    try {
      const response = await channelsAPI.getLogs(channelName, 500, selectedProcess)
      setLogs(response.logs)
      setProcesses(response.processes)
    } catch (err) {
      console.error('Error fetching logs:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [channelName, selectedProcess])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchLogs, 3000)
    return () => clearInterval(interval)
  }, [autoRefresh, channelName, selectedProcess])

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, autoScroll])

  // Classify log entry
  const classifyLog = (text: string): LogLevel => {
    const lowerText = text.toLowerCase()

    if (lowerText.includes('error') || lowerText.includes('fail') || lowerText.includes('fatal')) {
      return 'error'
    }
    if (lowerText.includes('warn') || lowerText.includes('deprecated')) {
      return 'warning'
    }
    if (lowerText.includes('connect') || lowerText.includes('disconnect') || lowerText.includes('closed')) {
      return 'connection'
    }
    return 'info'
  }

  // Get log styling
  const getLogStyle = (level: LogLevel) => {
    switch (level) {
      case 'error':
        return {
          bg: 'bg-red-900/20',
          border: 'border-l-red-500',
          text: 'text-red-400',
          icon: <XCircle className="w-4 h-4" />
        }
      case 'warning':
        return {
          bg: 'bg-yellow-900/20',
          border: 'border-l-yellow-500',
          text: 'text-yellow-400',
          icon: <AlertCircle className="w-4 h-4" />
        }
      case 'connection':
        return {
          bg: 'bg-blue-900/20',
          border: 'border-l-blue-500',
          text: 'text-blue-400',
          icon: text.toLowerCase().includes('disconnect') || text.toLowerCase().includes('closed')
            ? <PlugZap className="w-4 h-4" />
            : <Plug className="w-4 h-4" />
        }
      default:
        return {
          bg: 'bg-transparent',
          border: 'border-l-gray-700',
          text: 'text-gray-300',
          icon: <Info className="w-4 h-4" />
        }
    }
  }

  // Filter logs by time
  const getTimeFilterMs = (range: TimeRange): number => {
    const hours: Record<TimeRange, number> = {
      'all': 0,
      '1h': 1,
      '3h': 3,
      '6h': 6,
      '12h': 12,
      '24h': 24,
    }
    return hours[range] * 60 * 60 * 1000
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const level = classifyLog(log.text)
    const matchesLevel = logLevel === 'all' || level === logLevel
    const matchesSearch = searchTerm === '' || log.text.toLowerCase().includes(searchTerm.toLowerCase())

    // Time filter
    let matchesTime = true
    if (timeRange !== 'all' && log.timestamp) {
      const logTime = new Date(log.timestamp).getTime()
      const cutoffTime = Date.now() - getTimeFilterMs(timeRange)
      matchesTime = logTime >= cutoffTime
    }

    return matchesLevel && matchesSearch && matchesTime
  })

  // Get process label
  const getProcessLabel = (process: ProcessInfo) => {
    return `P${process.idx + 1}: ${process.protocol.toUpperCase()} ${process.mode} ${process.host ? `${process.host}:` : ''}${process.port}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading logs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Filters Bar */}
      <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 space-y-3">
        {/* Search and Level Filter */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-10 pr-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <select
            value={logLevel}
            onChange={(e) => setLogLevel(e.target.value as LogLevel)}
            className="h-9 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warning">Warnings</option>
            <option value="connection">Connections</option>
            <option value="info">Info</option>
          </select>

          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
            className="h-9 px-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Time</option>
            <option value="1h">Last 1 hour</option>
            <option value="3h">Last 3 hours</option>
            <option value="6h">Last 6 hours</option>
            <option value="12h">Last 12 hours</option>
            <option value="24h">Last 24 hours</option>
          </select>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`h-9 px-4 rounded-lg text-sm font-medium transition-colors ${
              autoScroll
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
            }`}
          >
            Auto-scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Process Filter */}
        {processes.length > 1 && (
          <div className="flex items-center gap-3">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <select
              value={selectedProcess === undefined ? 'all' : selectedProcess}
              onChange={(e) => setSelectedProcess(e.target.value === 'all' ? undefined : parseInt(e.target.value))}
              className="flex-1 h-9 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Processes ({processes.length})</option>
              {processes.map((process) => (
                <option key={process.idx} value={process.idx}>
                  {getProcessLabel(process)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
          <span>{filteredLogs.length} entries shown</span>
          <span className="w-px h-3 bg-gray-300 dark:bg-gray-600"></span>
          <span>{logs.filter(l => classifyLog(l.text) === 'error').length} errors</span>
          <span>{logs.filter(l => classifyLog(l.text) === 'warning').length} warnings</span>
          <span>{logs.filter(l => classifyLog(l.text) === 'connection').length} connections</span>
        </div>
      </div>

      {/* Logs Display */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-900 font-mono text-xs">
        {filteredLogs.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Info className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No logs match your filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0.5">
            {filteredLogs.map((log, index) => {
              const level = classifyLog(log.text)
              const style = getLogStyle(level)

              return (
                <div
                  key={index}
                  className={`
                    flex items-start gap-2 p-2 rounded border-l-2 transition-colors
                    ${style.bg} ${style.border}
                    hover:bg-gray-800/50
                  `}
                >
                  {/* Icon */}
                  <div className={`flex-shrink-0 mt-0.5 ${style.text}`}>
                    {style.icon}
                  </div>

                  {/* Process Badge */}
                  {processes.length > 1 && (
                    <span className={`
                      flex-shrink-0 inline-block px-2 py-0.5 rounded text-[10px] font-semibold
                      ${log.process_idx === 0 ? 'bg-blue-600' :
                        log.process_idx === 1 ? 'bg-green-600' :
                        log.process_idx === 2 ? 'bg-purple-600' :
                        'bg-orange-600'}
                    `}>
                      P{log.process_idx + 1}
                    </span>
                  )}

                  {/* Log Text */}
                  <div className={`flex-1 ${style.text} break-all`}>
                    {highlightSearch(log.text, searchTerm)}
                  </div>

                  {/* Timestamp (if available) */}
                  {log.timestamp && (
                    <span className="flex-shrink-0 text-gray-500 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
              )
            })}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  )
}

// Highlight search term in text
function highlightSearch(text: string, search: string) {
  if (!search) return text

  const parts = text.split(new RegExp(`(${search})`, 'gi'))
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === search.toLowerCase() ? (
          <span key={i} className="bg-yellow-500/30 text-yellow-200 font-bold">
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  )
}

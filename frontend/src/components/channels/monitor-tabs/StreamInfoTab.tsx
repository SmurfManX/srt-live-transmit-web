'use client'

import { useState, useEffect } from 'react'
import { Video, Music, FileVideo, Info } from 'lucide-react'
import { channelsAPI } from '@/lib/api'

interface VideoStream {
  codec?: string
  resolution?: string
  fps?: number
  bitrate?: number
  profile?: string
  pid?: number
  stream_id?: string
}

interface AudioStream {
  codec?: string
  sample_rate: number
  channels: number
  channel_layout?: string
  bitrate?: number
  language?: string
  pid?: number
}

interface MediaInfo {
  success?: boolean
  error?: string
  input_url?: string
  format?: string
  total_bitrate?: number
  total_bitrate_mbps?: number
  video_streams?: VideoStream[]
  audio_streams?: AudioStream[]
  video_count?: number
  audio_count?: number
}

interface StreamInfoTabProps {
  channelName: string
  autoRefresh: boolean
}

export default function StreamInfoTab({ channelName, autoRefresh }: StreamInfoTabProps) {
  const [streamInfo, setStreamInfo] = useState<MediaInfo | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchStreamInfo = async () => {
    try {
      const fullInfo = await channelsAPI.getFullInfo(channelName)
      setStreamInfo(fullInfo?.media_info || null)
    } catch (err) {
      console.error('Error fetching stream info:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStreamInfo()
  }, [channelName])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchStreamInfo, 5000)
    return () => clearInterval(interval)
  }, [autoRefresh, channelName])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading stream info...</p>
        </div>
      </div>
    )
  }

  const hasVideoInfo = streamInfo?.video_streams && streamInfo.video_streams.length > 0
  const hasAudioInfo = streamInfo?.audio_streams && streamInfo.audio_streams.length > 0
  const hasAnyInfo = hasVideoInfo || hasAudioInfo || streamInfo?.format

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Stream Format Info */}
      <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <FileVideo className="w-5 h-5 text-white" />
          </div>
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Stream Format</h3>
        </div>
        {hasAnyInfo ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <InfoCard label="Format" value={streamInfo?.format?.toUpperCase() || 'N/A'} />
              <InfoCard label="Total Bitrate" value={streamInfo?.total_bitrate_mbps ? `${streamInfo.total_bitrate_mbps} Mbps` : 'N/A'} />
              <InfoCard label="Video Tracks" value={streamInfo?.video_count?.toString() || '0'} />
              <InfoCard label="Audio Tracks" value={streamInfo?.audio_count?.toString() || '0'} />
            </div>
            {streamInfo?.input_url && (
              <div className="mt-4 pt-4 border-t border-indigo-200 dark:border-indigo-700">
                <p className="text-xs text-indigo-600 dark:text-indigo-400 mb-1 font-medium">Input URL</p>
                <p className="text-sm font-mono bg-white dark:bg-gray-800 p-3 rounded-lg border border-indigo-200 dark:border-indigo-700 break-all">
                  {streamInfo.input_url}
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">Analyzing stream...</p>
            {streamInfo?.error && (
              <p className="text-xs text-gray-500 mt-1">{streamInfo.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Video Stream Info */}
        {hasVideoInfo ? (
          <div className="p-5 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Video Stream</h3>
            </div>
            {streamInfo!.video_streams!.map((video, idx) => (
              <div key={idx} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Resolution" value={video.resolution || 'N/A'} highlight />
                  <InfoCard label="Codec" value={video.codec?.toUpperCase() || 'N/A'} />
                  <InfoCard label="FPS" value={video.fps ? video.fps.toFixed(2) : 'N/A'} />
                  <InfoCard label="Bitrate" value={video.bitrate ? formatBitrate(video.bitrate) : 'N/A'} />
                  {video.profile && <InfoCard label="Profile" value={video.profile} />}
                  {video.pid !== undefined && <InfoCard label="PID" value={video.pid.toString()} />}
                  {video.stream_id !== undefined && <InfoCard label="Stream ID" value={video.stream_id || '-'} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gray-400 rounded-lg">
                <Video className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-600 dark:text-gray-400">Video Stream</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Info className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-500 font-medium">Stream info not available</p>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Analyzing stream...</p>
            </div>
          </div>
        )}

        {/* Audio Stream Info */}
        {hasAudioInfo ? (
          <div className="p-5 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 rounded-xl border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-green-600 rounded-lg">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Audio Stream</h3>
            </div>
            {streamInfo!.audio_streams!.map((audio, idx) => (
              <div key={idx} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InfoCard label="Codec" value={audio.codec?.toUpperCase() || 'N/A'} />
                  <InfoCard label="Sample Rate" value={`${audio.sample_rate / 1000} kHz`} />
                  <InfoCard label="Channels" value={audio.channel_layout || `${audio.channels} ch`} />
                  <InfoCard label="Bitrate" value={audio.bitrate ? formatBitrate(audio.bitrate) : 'N/A'} />
                  {audio.language && <InfoCard label="Language" value={audio.language.toUpperCase()} />}
                  {audio.pid !== undefined && <InfoCard label="PID" value={audio.pid.toString()} />}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-5 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-gray-400 rounded-lg">
                <Music className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-gray-600 dark:text-gray-400">Audio Stream</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Info className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-500 font-medium">Stream info not available</p>
              <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">Analyzing stream...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`p-3 rounded-lg ${highlight ? 'bg-white/80 dark:bg-gray-800/80' : 'bg-white/50 dark:bg-gray-800/50'}`}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
      <p className={`font-semibold text-gray-900 dark:text-gray-100 ${highlight ? 'text-lg' : 'text-sm'}`}>{value}</p>
    </div>
  )
}

function formatBitrate(bitrate: number) {
  if (bitrate >= 1000000) {
    return `${(bitrate / 1000000).toFixed(2)} Mbps`
  }
  return `${(bitrate / 1000).toFixed(0)} Kbps`
}

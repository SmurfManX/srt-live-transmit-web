'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Stack,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Paper,
  alpha,
} from '@mui/material'
import {
  Close,
  Videocam,
  AudioFile,
  Speed,
  AspectRatio,
  Refresh,
  Info,
} from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { channelsAPI, StreamInfo } from '@/lib/api'

interface StreamInfoModalProps {
  open: boolean
  channelName: string
  onClose: () => void
}

export default function StreamInfoModal({
  open,
  channelName,
  onClose,
}: StreamInfoModalProps) {
  const theme = useTheme()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null)

  const fetchStreamInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await channelsAPI.getStreamInfo(channelName)
      setStreamInfo(data)
      if (data.error) {
        setError(data.error + (data.details ? `: ${data.details}` : ''))
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch stream info')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open && channelName) {
      fetchStreamInfo()
    }
  }, [open, channelName])

  const formatBitrate = (bitrate: number | null | undefined) => {
    if (!bitrate) return 'N/A'
    if (bitrate >= 1000000) {
      return `${(bitrate / 1000000).toFixed(2)} Mbps`
    }
    return `${(bitrate / 1000).toFixed(0)} Kbps`
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '80vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Info color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Stream Info: {channelName}
          </Typography>
        </Box>
        <Box>
          <IconButton onClick={fetchStreamInfo} disabled={loading} size="small" sx={{ mr: 1 }}>
            <Refresh />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        )}

        {error && !loading && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {streamInfo && !loading && streamInfo.success && (
          <Stack spacing={3}>
            {/* Summary */}
            <Paper
              sx={{
                p: 2.5,
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                borderRadius: '12px',
              }}
            >
              <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Format
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {streamInfo.format?.toUpperCase() || 'Unknown'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Total Bitrate
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {streamInfo.total_bitrate_mbps
                      ? `${streamInfo.total_bitrate_mbps} Mbps`
                      : 'N/A'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Video Tracks
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {streamInfo.video_count || 0}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Audio Tracks
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {streamInfo.audio_count || 0}
                  </Typography>
                </Box>
              </Stack>
            </Paper>

            {/* Video Streams */}
            {streamInfo.video_streams && streamInfo.video_streams.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    color: 'text.secondary',
                  }}
                >
                  <Videocam fontSize="small" />
                  Video Streams
                </Typography>
                <Stack spacing={2}>
                  {streamInfo.video_streams.map((video, idx) => (
                    <Paper
                      key={idx}
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                        borderRadius: '10px',
                      }}
                    >
                      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
                        <Chip
                          icon={<AspectRatio sx={{ fontSize: '16px !important' }} />}
                          label={video.resolution}
                          size="small"
                          color="info"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={video.codec?.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                        {video.profile && (
                          <Chip label={video.profile} size="small" variant="outlined" />
                        )}
                        <Chip
                          label={`${video.fps?.toFixed(2) || 0} fps`}
                          size="small"
                          variant="outlined"
                        />
                        {video.bitrate && (
                          <Chip
                            icon={<Speed sx={{ fontSize: '14px !important' }} />}
                            label={formatBitrate(video.bitrate)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {video.pix_fmt && (
                          <Chip label={video.pix_fmt} size="small" variant="outlined" />
                        )}
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        {video.codec_long}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Audio Streams */}
            {streamInfo.audio_streams && streamInfo.audio_streams.length > 0 && (
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    mb: 2,
                    color: 'text.secondary',
                  }}
                >
                  <AudioFile fontSize="small" />
                  Audio Streams
                </Typography>
                <Stack spacing={2}>
                  {streamInfo.audio_streams.map((audio, idx) => (
                    <Paper
                      key={idx}
                      sx={{
                        p: 2,
                        bgcolor: alpha(theme.palette.success.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
                        borderRadius: '10px',
                      }}
                    >
                      <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap alignItems="center">
                        <Chip
                          label={audio.codec?.toUpperCase()}
                          size="small"
                          color="success"
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip
                          label={`${audio.sample_rate / 1000} kHz`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={
                            audio.channel_layout ||
                            `${audio.channels} ch`
                          }
                          size="small"
                          variant="outlined"
                        />
                        {audio.bitrate && (
                          <Chip
                            icon={<Speed sx={{ fontSize: '14px !important' }} />}
                            label={formatBitrate(audio.bitrate)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                        {audio.language && (
                          <Chip
                            label={audio.language.toUpperCase()}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', mt: 1 }}
                      >
                        {audio.codec_long}
                      </Typography>
                    </Paper>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Input URL */}
            <Box>
              <Typography variant="caption" color="text.secondary">
                Input URL
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: alpha(theme.palette.text.primary, 0.04),
                  p: 1,
                  borderRadius: '6px',
                  wordBreak: 'break-all',
                }}
              >
                {streamInfo.input_url}
              </Typography>
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}

'use client'

import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  IconButton,
  Button,
  Box,
  Stack,
  Divider,
  Tooltip,
  alpha,
} from '@mui/material'
import {
  PlayArrow,
  Stop,
  Edit,
  Delete,
  Terminal,
  BarChart,
  Lock,
  NetworkCheck,
  PowerSettingsNew,
  Input,
  Output,
  Info,
} from '@mui/icons-material'
import { Channel } from '@/types'
import { useTheme } from '@mui/material/styles'

interface ChannelCardProps {
  channel: Channel
  viewMode?: 'grid' | 'list'
  onStart: (name: string) => void
  onStop: (name: string) => void
  onEdit: (channel: Channel) => void
  onDelete: (name: string) => void
  onViewStats: (name: string) => void
  onViewLogs: (name: string) => void
  onViewStreamInfo?: (name: string) => void
}

export default function ChannelCardNew({
  channel,
  viewMode = 'grid',
  onStart,
  onStop,
  onEdit,
  onDelete,
  onViewStats,
  onViewLogs,
  onViewStreamInfo,
}: ChannelCardProps) {
  const theme = useTheme()
  const isRunning = channel.status === 'running'
  const isListView = viewMode === 'list'

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: isListView ? 'row' : 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status Indicator Bar */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: isRunning
            ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.info.main})`
            : `linear-gradient(90deg, ${theme.palette.error.main}, ${alpha(theme.palette.error.main, 0.5)})`,
        }}
      />

      <CardContent sx={{ flexGrow: 1, pt: 3, pb: isListView ? 3 : 2 }}>
        <Stack spacing={2.5}>
          {/* Header: Name & Status */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: isRunning
                    ? `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.15)}, ${alpha(theme.palette.info.main, 0.15)})`
                    : alpha(theme.palette.text.primary, 0.04),
                  border: `1px solid ${
                    isRunning
                      ? alpha(theme.palette.success.main, 0.3)
                      : alpha(theme.palette.text.primary, 0.08)
                  }`,
                  flexShrink: 0,
                }}
              >
                <NetworkCheck
                  sx={{
                    fontSize: 20,
                    color: isRunning ? theme.palette.success.main : theme.palette.text.disabled,
                  }}
                />
              </Box>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {channel.channel_name}
                </Typography>
                {channel.streamid && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                    }}
                  >
                    ID: {channel.streamid}
                  </Typography>
                )}
              </Box>
            </Box>

            <Chip
              label={isRunning ? 'Live' : 'Offline'}
              size="small"
              icon={isRunning ? <PowerSettingsNew sx={{ fontSize: '14px !important' }} /> : undefined}
              sx={{
                fontWeight: 600,
                fontSize: '0.7rem',
                height: 26,
                borderRadius: '8px',
                bgcolor: isRunning
                  ? alpha(theme.palette.success.main, 0.15)
                  : alpha(theme.palette.error.main, 0.1),
                color: isRunning ? theme.palette.success.main : theme.palette.error.main,
                border: `1px solid ${
                  isRunning
                    ? alpha(theme.palette.success.main, 0.3)
                    : alpha(theme.palette.error.main, 0.2)
                }`,
                flexShrink: 0,
                animation: isRunning ? 'pulse-glow 2s ease-in-out infinite' : 'none',
                '@keyframes pulse-glow': {
                  '0%, 100%': {
                    boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.7)}`,
                  },
                  '50%': {
                    boxShadow: `0 0 8px 2px ${alpha(theme.palette.success.main, 0)}`,
                  },
                },
                '& .MuiChip-icon': {
                  ml: 0.5,
                  mr: -0.5,
                },
              }}
            />
          </Box>

          <Divider sx={{ my: '4px !important' }} />

          {/* Connection Details */}
          <Stack spacing={1.5}>
            {/* Input */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: '8px',
                bgcolor: alpha(theme.palette.primary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              }}
            >
              <Input sx={{ fontSize: 18, color: 'primary.main', flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>
                  Input Source
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {channel.input_protocol}://{channel.input_ip}:{channel.input_port}
                </Typography>
              </Box>
            </Box>

            {/* Output */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                p: 1.5,
                borderRadius: '8px',
                bgcolor: alpha(theme.palette.secondary.main, 0.04),
                border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`,
              }}
            >
              <Output sx={{ fontSize: 18, color: 'secondary.main', flexShrink: 0 }} />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', fontSize: '0.65rem', fontWeight: 600 }}>
                  Output Destination
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    color: 'text.primary',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {channel.mode}:{channel.output_port}
                  {channel.destination_host && ` → ${channel.destination_host}`}
                </Typography>
              </Box>
            </Box>
          </Stack>

          {/* Additional Info */}
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            {channel.passphrase && (
              <Tooltip title={`AES-${(channel.pbkeylen || 16) * 8} Encryption`} arrow>
                <Chip
                  icon={<Lock sx={{ fontSize: '14px !important' }} />}
                  label={`AES-${(channel.pbkeylen || 16) * 8}`}
                  size="small"
                  sx={{
                    height: 24,
                    fontSize: '0.7rem',
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    color: 'success.main',
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    '& .MuiChip-icon': { color: 'success.main' },
                  }}
                />
              </Tooltip>
            )}
            {channel.input_latency && (
              <Chip
                label={`${channel.input_latency}ms latency`}
                size="small"
                sx={{
                  height: 24,
                  fontSize: '0.7rem',
                  bgcolor: alpha(theme.palette.info.main, 0.08),
                  color: 'info.main',
                }}
              />
            )}
          </Box>
        </Stack>
      </CardContent>

      <Divider />

      {/* Actions */}
      <CardActions
        sx={{
          p: 2.5,
          gap: 1.5,
          flexDirection: { xs: 'column', sm: 'row' },
        }}
      >
        {/* Primary Action - Toggle Button */}
        <Button
          variant="contained"
          size="medium"
          startIcon={isRunning ? <Stop /> : <PlayArrow />}
          onClick={() => isRunning ? onStop(channel.channel_name) : onStart(channel.channel_name)}
          sx={{
            flex: { xs: '1 1 auto', sm: 1 },
            minHeight: 44,
            bgcolor: isRunning ? 'error.main' : 'primary.main',
            '&:hover': {
              bgcolor: isRunning ? 'error.dark' : 'primary.dark',
              transform: 'translateY(-1px)',
            },
          }}
        >
          {isRunning ? 'Stop Stream' : 'Start Stream'}
        </Button>

        {/* Secondary Actions */}
        <Stack
          direction="row"
          spacing={1}
          sx={{
            flex: { xs: '1 1 auto', sm: '0 0 auto' },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          {isRunning && onViewStreamInfo && (
            <Tooltip title="Stream Info" arrow>
              <IconButton
                size="medium"
                onClick={() => onViewStreamInfo(channel.channel_name)}
                sx={{
                  flex: { xs: 1, sm: 'initial' },
                  minWidth: 44,
                  minHeight: 44,
                  border: `1.5px solid ${theme.palette.divider}`,
                  borderRadius: '10px',
                  '&:hover': {
                    borderColor: theme.palette.info.main,
                    bgcolor: alpha(theme.palette.info.main, 0.08),
                  },
                }}
              >
                <Info sx={{ fontSize: 20, color: theme.palette.info.main }} />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="View Logs" arrow>
            <IconButton
              size="medium"
              onClick={() => onViewLogs(channel.channel_name)}
              sx={{
                flex: { xs: 1, sm: 'initial' },
                minWidth: 44,
                minHeight: 44,
                border: `1.5px solid ${theme.palette.divider}`,
                borderRadius: '10px',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <Terminal sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Statistics" arrow>
            <IconButton
              size="medium"
              onClick={() => onViewStats(channel.channel_name)}
              sx={{
                flex: { xs: 1, sm: 'initial' },
                minWidth: 44,
                minHeight: 44,
                border: `1.5px solid ${theme.palette.divider}`,
                borderRadius: '10px',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              <BarChart sx={{ fontSize: 20 }} />
            </IconButton>
          </Tooltip>

          <Tooltip title="Edit" arrow>
            <span style={{ flex: isListView ? 'initial' : 1, display: 'flex' }}>
              <IconButton
                size="medium"
                onClick={() => onEdit(channel)}
                disabled={isRunning}
                sx={{
                  flex: { xs: 1, sm: 'initial' },
                  minWidth: 44,
                  minHeight: 44,
                  border: `1.5px solid ${theme.palette.divider}`,
                  borderRadius: '10px',
                  '&:hover:not(:disabled)': {
                    borderColor: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Edit sx={{ fontSize: 20 }} />
              </IconButton>
            </span>
          </Tooltip>

          <Tooltip title="Delete" arrow>
            <span style={{ flex: isListView ? 'initial' : 1, display: 'flex' }}>
              <IconButton
                size="medium"
                onClick={() => onDelete(channel.channel_name)}
                disabled={isRunning}
                sx={{
                  flex: { xs: 1, sm: 'initial' },
                  minWidth: 44,
                  minHeight: 44,
                  border: `1.5px solid ${theme.palette.divider}`,
                  borderRadius: '10px',
                  color: 'error.main',
                  '&:hover:not(:disabled)': {
                    borderColor: theme.palette.error.main,
                    bgcolor: alpha(theme.palette.error.main, 0.08),
                  },
                }}
              >
                <Delete sx={{ fontSize: 20 }} />
              </IconButton>
            </span>
          </Tooltip>
        </Stack>
      </CardActions>
    </Card>
  )
}

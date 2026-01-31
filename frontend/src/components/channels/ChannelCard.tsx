'use client'

import { Card, CardContent, CardFooter } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Channel } from '@/types'
import { Play, Square, BarChart3, Edit, Trash2, Lock, Radio, Terminal } from 'lucide-react'

interface ChannelCardProps {
  channel: Channel
  onStart: (name: string) => void
  onStop: (name: string) => void
  onEdit: (channel: Channel) => void
  onDelete: (name: string) => void
  onViewStats: (name: string) => void
  onViewLogs: (name: string) => void
}

export default function ChannelCard({
  channel,
  onStart,
  onStop,
  onEdit,
  onDelete,
  onViewStats,
  onViewLogs,
}: ChannelCardProps) {
  const isRunning = channel.status === 'running'

  return (
    <div className="animate-scale-in">
      <Card className="group overflow-hidden relative">
        {/* Animated top border */}
        <div
          className={`h-2 bg-gradient-to-r transition-smooth ${
            isRunning
              ? 'from-green-500 via-emerald-500 to-green-600 animate-gradient'
              : 'from-gray-400 to-gray-500'
          }`}
        />

        {/* Glowing effect when running */}
        {isRunning && (
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 pointer-events-none" />
        )}

        <CardContent className="p-6 relative z-10">
          <div className="mb-5 flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Icon with glow effect */}
              <div
                className={`rounded-2xl p-3 transition-smooth shadow-elegant ${
                  isRunning
                    ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20 glow-green'
                    : 'bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900'
                }`}
              >
                <Radio
                  className={`h-6 w-6 transition-smooth ${
                    isRunning ? 'text-green-500 animate-pulse-glow' : 'text-gray-500'
                  }`}
                />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground group-hover:text-primary transition-smooth">
                  {channel.channel_name}
                </h3>
                <Badge variant={isRunning ? 'success' : 'destructive'} className="shadow-soft">
                  {isRunning ? (
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                      </span>
                      <span className="font-extrabold">LIVE</span>
                    </div>
                  ) : (
                    <span className="font-extrabold">STOPPED</span>
                  )}
                </Badge>
              </div>
            </div>
          </div>

          {/* Connection details with modern styling */}
          <div className="space-y-3">
            <div className="group/item flex items-center gap-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm p-3.5 border-2 border-border/40 hover:border-primary/30 transition-smooth shadow-soft">
              <div className="flex-shrink-0 w-16 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Input
              </div>
              <div className="flex-1 font-mono text-sm font-semibold text-foreground bg-background/50 px-3 py-1.5 rounded-lg">
                {channel.input_protocol}://{channel.input_ip}:{channel.input_port}
              </div>
            </div>
            <div className="group/item flex items-center gap-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm p-3.5 border-2 border-border/40 hover:border-primary/30 transition-smooth shadow-soft">
              <div className="flex-shrink-0 w-16 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Output
              </div>
              <div className="flex-1 font-mono text-sm font-semibold text-foreground bg-background/50 px-3 py-1.5 rounded-lg">
                {channel.mode}:{channel.output_port}
              </div>
            </div>
            {channel.passphrase && (
              <div className="flex items-center gap-3 rounded-xl bg-gradient-to-br from-green-500/15 to-emerald-500/10 backdrop-blur-sm p-3.5 border-2 border-green-500/30 transition-smooth shadow-soft glow-green">
                <Lock className="h-5 w-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-bold text-green-700 dark:text-green-300">
                  AES-{(channel.pbkeylen || 16) * 8} Encrypted
                </span>
              </div>
            )}
          </div>
        </CardContent>

        {/* Enhanced footer with better button layout */}
        <CardFooter className="flex-wrap gap-2 border-t-2 border-border/40 bg-gradient-to-br from-muted/20 to-muted/10 p-4">
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            className="flex-1 min-w-[120px] font-bold"
            onClick={() => isRunning ? onStop(channel.channel_name) : onStart(channel.channel_name)}
          >
            {isRunning ? (
              <>
                <Square className="h-4 w-4" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Start Stream
              </>
            )}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onViewLogs(channel.channel_name)}
              title="View Logs"
              className="hover:bg-indigo-500/10 hover:text-indigo-600 hover:border-indigo-500/50"
            >
              <Terminal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onViewStats(channel.channel_name)}
              title="View Stats"
              className="hover:bg-indigo-500/10 hover:text-indigo-600 hover:border-indigo-500/50"
            >
              <BarChart3 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(channel)}
              disabled={isRunning}
              title="Edit Channel"
              className="hover:bg-indigo-500/10 hover:text-indigo-600 hover:border-indigo-500/50"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(channel.channel_name)}
              disabled={isRunning}
              title="Delete Channel"
              className="hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}

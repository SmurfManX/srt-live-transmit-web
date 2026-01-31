'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { Radio, PlayCircle, StopCircle, TrendingUp } from 'lucide-react'
import { DashboardStats } from '@/types'

interface StatsCardsProps {
  stats: DashboardStats
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Channels',
      value: stats.total,
      icon: Radio,
      gradient: 'from-indigo-600 to-purple-600',
      shadowColor: 'shadow-indigo-500/20',
    },
    {
      title: 'Running',
      value: stats.running,
      icon: PlayCircle,
      gradient: 'from-green-600 to-emerald-600',
      shadowColor: 'shadow-green-500/20',
    },
    {
      title: 'Stopped',
      value: stats.stopped,
      icon: StopCircle,
      gradient: 'from-red-600 to-pink-600',
      shadowColor: 'shadow-red-500/20',
    },
    {
      title: 'Avg Uptime',
      value: stats.uptime,
      icon: TrendingUp,
      gradient: 'from-amber-600 to-orange-600',
      shadowColor: 'shadow-amber-500/20',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div
          key={card.title}
        >
          <Card className={`overflow-hidden ${card.shadowColor} shadow-xl`}>
            <CardContent className="p-0">
              <div className={`bg-gradient-to-br ${card.gradient} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{card.title}</p>
                    <p className="mt-2 text-3xl font-bold">{card.value}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-3 backdrop-blur-sm">
                    <card.icon className="h-8 w-8" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}

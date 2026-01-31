'use client'

import { Line } from 'react-chartjs-2'
import { ChartData } from 'chart.js'
import './ChartConfig'
import { defaultLineOptions, chartColors, chartColorsWithAlpha } from './ChartConfig'

interface BandwidthChartProps {
  data: {
    timestamp: string
    bandwidth: number
    rtt?: number
  }[]
  showRTT?: boolean
  height?: number
}

export default function BandwidthChart({ data, showRTT = false, height = 300 }: BandwidthChartProps) {
  const labels = data.map(d => {
    const date = new Date(d.timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  })

  const chartData: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: 'Bandwidth (Mbps)',
        data: data.map(d => d.bandwidth),
        borderColor: chartColors.primary,
        backgroundColor: chartColorsWithAlpha.primary,
        fill: true,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
      },
      ...(showRTT ? [{
        label: 'RTT (ms)',
        data: data.map(d => d.rtt || 0),
        borderColor: chartColors.warning,
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.4,
        pointRadius: 2,
        pointHoverRadius: 5,
        yAxisID: 'y1',
      }] : []),
    ],
  }

  const options = {
    ...defaultLineOptions,
    scales: {
      ...defaultLineOptions.scales,
      ...(showRTT ? {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          grid: {
            drawOnChartArea: false,
          },
          title: {
            display: true,
            text: 'RTT (ms)',
          },
        },
      } : {}),
    },
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

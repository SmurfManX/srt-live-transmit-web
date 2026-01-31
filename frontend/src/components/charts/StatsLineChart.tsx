'use client'

import { Line } from 'react-chartjs-2'
import { ChartData, ChartOptions } from 'chart.js'
import './ChartConfig'
import { chartColors, chartColorsWithAlpha } from './ChartConfig'

interface StatsDataPoint {
  timestamp: string
  [key: string]: number | string
}

interface DatasetConfig {
  key: string
  label: string
  color: string
  fill?: boolean
  yAxisID?: string
}

interface StatsLineChartProps {
  data: StatsDataPoint[]
  datasets: DatasetConfig[]
  height?: number
  showGrid?: boolean
  yAxes?: {
    id: string
    position: 'left' | 'right'
    title?: string
    min?: number
    max?: number
  }[]
}

export default function StatsLineChart({
  data,
  datasets,
  height = 300,
  showGrid = true,
  yAxes = [{ id: 'y', position: 'left' }]
}: StatsLineChartProps) {
  const labels = data.map(d => {
    const date = new Date(d.timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  })

  const chartData: ChartData<'line'> = {
    labels,
    datasets: datasets.map(ds => ({
      label: ds.label,
      data: data.map(d => typeof d[ds.key] === 'number' ? d[ds.key] as number : 0),
      borderColor: ds.color,
      backgroundColor: ds.fill ? ds.color.replace(')', ', 0.2)').replace('rgb', 'rgba') : 'transparent',
      fill: ds.fill || false,
      tension: 0.3,
      pointRadius: 1,
      pointHoverRadius: 4,
      borderWidth: 2,
      yAxisID: ds.yAxisID || 'y',
    })),
  }

  const scalesConfig: any = {
    x: {
      grid: {
        display: showGrid,
        color: 'rgba(0, 0, 0, 0.05)',
      },
      ticks: {
        font: { size: 10 },
        maxTicksLimit: 10,
      },
    },
  }

  yAxes.forEach(axis => {
    scalesConfig[axis.id] = {
      type: 'linear',
      display: true,
      position: axis.position,
      grid: {
        display: axis.position === 'left' && showGrid,
        color: 'rgba(0, 0, 0, 0.05)',
      },
      title: axis.title ? {
        display: true,
        text: axis.title,
        font: { size: 11 },
      } : undefined,
      min: axis.min,
      max: axis.max,
      ticks: {
        font: { size: 10 },
      },
    }
  })

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: { size: 11 },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        titleFont: { size: 12 },
        bodyFont: { size: 11 },
        padding: 10,
        cornerRadius: 6,
      },
    },
    scales: scalesConfig,
  }

  return (
    <div style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  )
}

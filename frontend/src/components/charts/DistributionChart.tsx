'use client'

import { Doughnut } from 'react-chartjs-2'
import { ChartData } from 'chart.js'
import './ChartConfig'
import { defaultDoughnutOptions, chartColors } from './ChartConfig'

interface DistributionChartProps {
  data: {
    label: string
    value: number
    color?: string
  }[]
  title?: string
  height?: number
}

const defaultColors = [
  chartColors.primary,
  chartColors.success,
  chartColors.warning,
  chartColors.danger,
  chartColors.info,
  chartColors.secondary,
]

export default function DistributionChart({ data, title, height = 250 }: DistributionChartProps) {
  const chartData: ChartData<'doughnut'> = {
    labels: data.map(d => d.label),
    datasets: [
      {
        data: data.map(d => d.value),
        backgroundColor: data.map((d, i) => d.color || defaultColors[i % defaultColors.length]),
        borderWidth: 2,
        borderColor: '#fff',
        hoverBorderWidth: 3,
        hoverOffset: 8,
      },
    ],
  }

  const options = {
    ...defaultDoughnutOptions,
    plugins: {
      ...defaultDoughnutOptions.plugins,
      title: title ? {
        display: true,
        text: title,
        font: { size: 14, weight: '600' as const },
        padding: { bottom: 10 },
      } : { display: false },
    },
    cutout: '60%',
  }

  const total = data.reduce((sum, d) => sum + d.value, 0)

  return (
    <div style={{ height, position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{total}</div>
          <div className="text-xs text-gray-500">Total</div>
        </div>
      </div>
    </div>
  )
}

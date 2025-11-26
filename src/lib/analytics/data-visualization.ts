/**
 * Real-time Data Visualization & Charts
 * Semana 33, Tarea 33.9: Visualización de datos en tiempo real
 */

import { logger } from '@/lib/monitoring'

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar'

export interface ChartConfig {
  type: ChartType
  title: string
  data: {
    labels: string[]
    datasets: Array<{
      label: string
      data: number[]
      backgroundColor?: string
      borderColor?: string
      tension?: number
    }>
  }
  options?: Record<string, any>
  refreshInterval?: number
}

export class DataVisualization {
  private charts: Map<string, ChartConfig> = new Map()
  private realTimeData: Map<string, number[]> = new Map()

  constructor() {
    logger.debug({ type: 'data_visualization_init' }, 'Data Visualization inicializado')
  }

  createChart(chartId: string, config: ChartConfig): void {
    this.charts.set(chartId, config)
    this.realTimeData.set(chartId, [])
  }

  updateChartData(chartId: string, newValue: number): void {
    const data = this.realTimeData.get(chartId) || []
    data.push(newValue)

    // Mantener últimos 100 valores
    if (data.length > 100) {
      data.shift()
    }

    this.realTimeData.set(chartId, data)
  }

  getChart(chartId: string): ChartConfig | null {
    return this.charts.get(chartId) || null
  }

  generateHeatmap(data: Record<string, number>): string {
    // Generar datos para heatmap
    return JSON.stringify(data)
  }

  generateTimeSeriesData(metricName: string, days: number = 30): number[] {
    // Simular datos de series de tiempo
    return Array(days)
      .fill(0)
      .map(() => Math.floor(Math.random() * 100))
  }
}

let globalVisualization: DataVisualization | null = null

export function initializeDataVisualization(): DataVisualization {
  if (!globalVisualization) {
    globalVisualization = new DataVisualization()
  }
  return globalVisualization
}

export function getDataVisualization(): DataVisualization {
  if (!globalVisualization) {
    return initializeDataVisualization()
  }
  return globalVisualization
}

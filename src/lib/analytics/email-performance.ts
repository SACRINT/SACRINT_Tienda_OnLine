/**
 * Email Performance & Engagement Analytics
 * Semana 33, Tarea 33.4: Analytics detallado de performance de emails
 */

import { logger } from '@/lib/monitoring'

export interface EmailPerformance {
  emailId: string
  campaignId: string
  subject: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  complained: number
  revenue: number
  avgOpenTime: number
  avgClickTime: number
  topLinks: Array<{ url: string; clicks: number }>
}

export class EmailPerformanceAnalytics {
  private performances: Map<string, EmailPerformance> = new Map()

  constructor() {
    logger.debug({ type: 'email_performance_init' }, 'Email Performance Analytics inicializado')
  }

  recordPerformance(performance: EmailPerformance): void {
    this.performances.set(performance.emailId, performance)
  }

  getHotlinks(emailId: string): Array<{ url: string; clicks: number; percentage: number }> {
    const perf = this.performances.get(emailId)
    if (!perf) return []

    const totalClicks = perf.topLinks.reduce((sum, l) => sum + l.clicks, 0) || 1

    return perf.topLinks.map((link) => ({
      url: link.url,
      clicks: link.clicks,
      percentage: (link.clicks / totalClicks) * 100,
    }))
  }

  getEngagementTimeline(emailId: string): {
    opens: number[]
    clicks: number[]
    timestamps: Date[]
  } {
    // Simulación de datos de timeline
    return { opens: [], clicks: [], timestamps: [] }
  }

  generateHeatmap(emailId: string): string {
    // Generar heatmap de clicks en email
    return `Heatmap for ${emailId}`
  }
}

let globalEmailPerformance: EmailPerformanceAnalytics | null = null

export function initializeEmailPerformanceAnalytics(): EmailPerformanceAnalytics {
  if (!globalEmailPerformance) {
    globalEmailPerformance = new EmailPerformanceAnalytics()
  }
  return globalEmailPerformance
}

export function getEmailPerformanceAnalytics(): EmailPerformanceAnalytics {
  if (!globalEmailPerformance) {
    return initializeEmailPerformanceAnalytics()
  }
  return globalEmailPerformance
}

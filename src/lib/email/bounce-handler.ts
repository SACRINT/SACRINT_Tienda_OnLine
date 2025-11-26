/**
 * Bounce Handling y Auto List Cleaning
 * Semana 32, Tarea 32.8: Manejo automático de bounces y limpieza de listas
 */

import { logger } from '@/lib/monitoring'

export type BounceType = 'hard' | 'soft' | 'complaint'

export interface BounceRecord {
  id: string
  email: string
  bounceType: BounceType
  code?: string
  message?: string
  timestamp: Date
  listIds: string[]
}

export interface BounceStats {
  totalBounces: number
  hardBounces: number
  softBounces: number
  complaints: number
  hardBounceRate: number
}

export class BounceHandler {
  private bounces: Map<string, BounceRecord> = new Map()
  private softBounceThreshold = 5 // Convertir a hard bounce después de N soft bounces
  private softBounceAge = 30 * 24 * 60 * 60 * 1000 // 30 días

  constructor() {
    logger.debug({ type: 'bounce_handler_init' }, 'Bounce Handler inicializado')
  }

  recordBounce(email: string, bounceType: BounceType, data?: { code?: string; message?: string; listIds?: string[] }): BounceRecord {
    const bounce: BounceRecord = {
      id: `bounce-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      email,
      bounceType,
      code: data?.code,
      message: data?.message,
      timestamp: new Date(),
      listIds: data?.listIds || [],
    }

    this.bounces.set(bounce.id, bounce)

    logger.debug(
      { type: 'bounce_recorded', email, bounceType, code: data?.code },
      `Bounce registrado: ${email}`,
    )

    return bounce
  }

  getBounceHistory(email: string): BounceRecord[] {
    return Array.from(this.bounces.values()).filter((b) => b.email === email)
  }

  isSuppressed(email: string): { suppressed: boolean; reason?: string } {
    const bounces = this.getBounceHistory(email)
    const hardBounces = bounces.filter((b) => b.bounceType === 'hard')
    const softBounces = bounces.filter((b) => b.bounceType === 'soft')
    const complaints = bounces.filter((b) => b.bounceType === 'complaint')

    if (hardBounces.length > 0) {
      return { suppressed: true, reason: 'Hard bounce detected' }
    }

    if (complaints.length > 0) {
      return { suppressed: true, reason: 'Complaint reported' }
    }

    const recentSoftBounces = softBounces.filter(
      (b) => Date.now() - b.timestamp.getTime() < this.softBounceAge,
    )

    if (recentSoftBounces.length >= this.softBounceThreshold) {
      return { suppressed: true, reason: 'Multiple soft bounces' }
    }

    return { suppressed: false }
  }

  cleanList(listId: string): { removed: number; suppressed: number } {
    let removed = 0
    let suppressed = 0

    const listBounces = Array.from(this.bounces.values()).filter((b) => b.listIds.includes(listId))

    const emailsToRemove = new Set<string>()

    for (const bounce of listBounces) {
      if (bounce.bounceType === 'hard') {
        emailsToRemove.add(bounce.email)
        removed++
      } else if (bounce.bounceType === 'complaint') {
        emailsToRemove.add(bounce.email)
        suppressed++
      }
    }

    logger.info(
      { type: 'list_cleaned', listId, removed, suppressed },
      `Lista limpiada: ${removed} hard bounces, ${suppressed} complaints removidos`,
    )

    return { removed, suppressed }
  }

  getStats(): BounceStats {
    const hardBounces = Array.from(this.bounces.values()).filter((b) => b.bounceType === 'hard').length
    const softBounces = Array.from(this.bounces.values()).filter((b) => b.bounceType === 'soft').length
    const complaints = Array.from(this.bounces.values()).filter((b) => b.bounceType === 'complaint').length
    const total = this.bounces.size || 1

    return {
      totalBounces: total,
      hardBounces,
      softBounces,
      complaints,
      hardBounceRate: (hardBounces / total) * 100,
    }
  }

  getCommonBounceReasons(): Array<{ code: string; count: number; percentage: number }> {
    const reasons: Record<string, number> = {}

    for (const bounce of this.bounces.values()) {
      if (bounce.code) {
        reasons[bounce.code] = (reasons[bounce.code] || 0) + 1
      }
    }

    const total = this.bounces.size || 1

    return Object.entries(reasons)
      .map(([code, count]) => ({
        code,
        count,
        percentage: (count / total) * 100,
      }))
      .sort((a, b) => b.count - a.count)
  }

  generateBounceReport(): string {
    const stats = this.getStats()
    const reasons = this.getCommonBounceReasons()

    let report = 'Bounce Rate Report\n'
    report += '==================\n\n'

    report += `Total Bounces: ${stats.totalBounces}\n`
    report += `Hard Bounces: ${stats.hardBounces} (${stats.hardBounceRate.toFixed(2)}%)\n`
    report += `Soft Bounces: ${stats.softBounces}\n`
    report += `Complaints: ${stats.complaints}\n\n`

    if (reasons.length > 0) {
      report += 'Top Bounce Reasons:\n'
      for (const reason of reasons.slice(0, 10)) {
        report += `  ${reason.code}: ${reason.count} (${reason.percentage.toFixed(2)}%)\n`
      }
    }

    return report
  }

  clearOldBounces(olderThanDays: number = 90): number {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000)
    let removed = 0

    for (const [id, bounce] of this.bounces.entries()) {
      if (bounce.timestamp < cutoffDate) {
        this.bounces.delete(id)
        removed++
      }
    }

    if (removed > 0) {
      logger.debug(
        { type: 'old_bounces_cleared', removed },
        `Limpiados ${removed} bounces antiguos`,
      )
    }

    return removed
  }
}

let globalBounceHandler: BounceHandler | null = null

export function initializeBounceHandler(): BounceHandler {
  if (!globalBounceHandler) {
    globalBounceHandler = new BounceHandler()
  }
  return globalBounceHandler
}

export function getBounceHandler(): BounceHandler {
  if (!globalBounceHandler) {
    return initializeBounceHandler()
  }
  return globalBounceHandler
}

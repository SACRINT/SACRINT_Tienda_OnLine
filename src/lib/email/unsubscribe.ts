/**
 * Unsubscribe Management y Preference Center
 * Semana 32, Tarea 32.7: Gestión de desuscripciones y centro de preferencias
 */

import { logger } from '@/lib/monitoring'

export interface UnsubscribeReason {
  id: string
  subscriberId: string
  reason: string
  category: 'too_frequent' | 'not_relevant' | 'other' | 'spam' | 'unknown'
  timestamp: Date
  feedback?: string
}

export interface PreferenceCenter {
  subscriberId: string
  email: string
  preferences: {
    marketing: boolean
    notifications: boolean
    weeklyDigest: boolean
    personalizedOffers: boolean
    newsAndUpdates: boolean
  }
  frequency: 'daily' | 'weekly' | 'monthly' | 'never'
  categories: Record<string, boolean> // Category subscriptions
  updatedAt: Date
}

export class UnsubscribeManager {
  private reasons: Map<string, UnsubscribeReason> = new Map()
  private preferencesCenters: Map<string, PreferenceCenter> = new Map()

  constructor() {
    logger.debug({ type: 'unsubscribe_manager_init' }, 'Unsubscribe Manager inicializado')
  }

  recordUnsubscribe(subscriberId: string, data: Omit<UnsubscribeReason, 'id' | 'timestamp'>): UnsubscribeReason {
    const reason: UnsubscribeReason = {
      ...data,
      id: `unsub-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      timestamp: new Date(),
    }

    this.reasons.set(reason.id, reason)

    logger.info(
      { type: 'unsubscribe_recorded', subscriberId, category: data.category },
      `Desuscripción registrada: ${data.category}`,
    )

    return reason
  }

  createPreferenceCenter(subscriberId: string, email: string): PreferenceCenter {
    const preferences: PreferenceCenter = {
      subscriberId,
      email,
      preferences: {
        marketing: true,
        notifications: true,
        weeklyDigest: false,
        personalizedOffers: true,
        newsAndUpdates: true,
      },
      frequency: 'weekly',
      categories: {
        fashion: true,
        electronics: true,
        home: true,
      },
      updatedAt: new Date(),
    }

    this.preferencesCenters.set(subscriberId, preferences)

    logger.debug(
      { type: 'preference_center_created', subscriberId },
      'Centro de preferencias creado',
    )

    return preferences
  }

  updatePreferences(subscriberId: string, updates: Partial<PreferenceCenter['preferences']>): PreferenceCenter | null {
    const prefs = this.preferencesCenters.get(subscriberId)
    if (!prefs) return null

    prefs.preferences = { ...prefs.preferences, ...updates }
    prefs.updatedAt = new Date()

    logger.debug({ type: 'preferences_updated', subscriberId }, 'Preferencias actualizadas')

    return prefs
  }

  updateFrequency(subscriberId: string, frequency: PreferenceCenter['frequency']): PreferenceCenter | null {
    const prefs = this.preferencesCenters.get(subscriberId)
    if (!prefs) return null

    prefs.frequency = frequency
    prefs.updatedAt = new Date()

    logger.debug({ type: 'frequency_updated', subscriberId, frequency }, 'Frecuencia actualizada')

    return prefs
  }

  toggleCategory(subscriberId: string, category: string): PreferenceCenter | null {
    const prefs = this.preferencesCenters.get(subscriberId)
    if (!prefs) return null

    prefs.categories[category] = !prefs.categories[category]
    prefs.updatedAt = new Date()

    return prefs
  }

  getUnsubscribeStats(): {
    totalUnsubscribes: number
    byCategory: Record<string, number>
    topReason: string
  } {
    const byCategory: Record<string, number> = {}
    let topReason = 'unknown'
    let topCount = 0

    for (const reason of this.reasons.values()) {
      byCategory[reason.category] = (byCategory[reason.category] || 0) + 1

      if (byCategory[reason.category] > topCount) {
        topCount = byCategory[reason.category]
        topReason = reason.category
      }
    }

    return {
      totalUnsubscribes: this.reasons.size,
      byCategory,
      topReason,
    }
  }

  generateUnsubscribeToken(subscriberId: string): string {
    return Buffer.from(`${subscriberId}-${Date.now()}`).toString('base64')
  }

  verifyUnsubscribeToken(token: string): string | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8')
      const [subscriberId] = decoded.split('-')
      return subscriberId
    } catch {
      return null
    }
  }
}

let globalUnsubscribeManager: UnsubscribeManager | null = null

export function initializeUnsubscribeManager(): UnsubscribeManager {
  if (!globalUnsubscribeManager) {
    globalUnsubscribeManager = new UnsubscribeManager()
  }
  return globalUnsubscribeManager
}

export function getUnsubscribeManager(): UnsubscribeManager {
  if (!globalUnsubscribeManager) {
    return initializeUnsubscribeManager()
  }
  return globalUnsubscribeManager
}

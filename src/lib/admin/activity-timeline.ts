/**
 * Activity Timeline & History
 * Semana 40, Tarea 40.7: Activity Timeline & History
 */

import { logger } from '@/lib/monitoring'

export interface TimelineEvent {
  id: string
  userId: string
  action: string
  description: string
  category: string
  timestamp: Date
  metadata?: Record<string, any>
}

export class ActivityTimelineManager {
  private events: TimelineEvent[] = []

  constructor() {
    logger.debug({ type: 'activity_timeline_init' }, 'Activity Timeline Manager inicializado')
  }

  /**
   * Agregar evento
   */
  addEvent(userId: string, action: string, description: string, category: string, metadata?: Record<string, any>): TimelineEvent {
    const event: TimelineEvent = {
      id: `event_${Date.now()}`,
      userId,
      action,
      description,
      category,
      timestamp: new Date(),
      metadata,
    }

    this.events.push(event)
    return event
  }

  /**
   * Obtener timeline
   */
  getTimeline(userId: string, limit: number = 50): TimelineEvent[] {
    return this.events.filter((e) => e.userId === userId).slice(-limit)
  }

  /**
   * Obtener por categoría
   */
  getEventsByCategory(category: string, limit: number = 50): TimelineEvent[] {
    return this.events.filter((e) => e.category === category).slice(-limit)
  }
}

let globalActivityTimelineManager: ActivityTimelineManager | null = null

export function initializeActivityTimelineManager(): ActivityTimelineManager {
  if (!globalActivityTimelineManager) {
    globalActivityTimelineManager = new ActivityTimelineManager()
  }
  return globalActivityTimelineManager
}

export function getActivityTimelineManager(): ActivityTimelineManager {
  if (!globalActivityTimelineManager) {
    return initializeActivityTimelineManager()
  }
  return globalActivityTimelineManager
}

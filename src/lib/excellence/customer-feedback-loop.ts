/**
 * Customer Feedback Loop Manager
 * Semana 55, Tarea 55.11: Customer Feedback Loop & Continuous Learning
 */

import { logger } from "@/lib/monitoring"

export interface FeedbackLoop {
  id: string
  feedbackSource: string
  feedback: string
  actionTaken: string
  status: "received" | "analyzed" | "actioned" | "verified"
}

export class CustomerFeedbackLoopManager {
  private loops: Map<string, FeedbackLoop> = new Map()

  constructor() {
    logger.debug({ type: "feedback_loop_init" }, "Manager inicializado")
  }

  recordFeedback(feedbackSource: string, feedback: string): FeedbackLoop {
    const id = "loop_" + Date.now()

    const loop: FeedbackLoop = {
      id,
      feedbackSource,
      feedback,
      actionTaken: "",
      status: "received",
    }

    this.loops.set(id, loop)
    logger.info({ type: "feedback_recorded", loopId: id }, `Feedback registrado`)
    return loop
  }

  actOnFeedback(loopId: string, actionTaken: string): FeedbackLoop | null {
    const loop = this.loops.get(loopId)
    if (!loop) return null

    loop.actionTaken = actionTaken
    loop.status = "actioned"
    this.loops.set(loopId, loop)
    return loop
  }

  getStatistics(): Record<string, unknown> {
    const loops = Array.from(this.loops.values())

    return {
      totalFeedback: loops.length,
      byStatus: {
        received: loops.filter((l) => l.status === "received").length,
        analyzed: loops.filter((l) => l.status === "analyzed").length,
        actioned: loops.filter((l) => l.status === "actioned").length,
        verified: loops.filter((l) => l.status === "verified").length,
      },
    }
  }

  generateFeedbackReport(): string {
    const stats = this.getStatistics()
    return `Customer Feedback Loop Report\nFeedback: ${stats.totalFeedback}\nActioned: ${stats.byStatus.actioned}`
  }
}

let globalCustomerFeedbackLoopManager: CustomerFeedbackLoopManager | null = null

export function getCustomerFeedbackLoopManager(): CustomerFeedbackLoopManager {
  if (!globalCustomerFeedbackLoopManager) {
    globalCustomerFeedbackLoopManager = new CustomerFeedbackLoopManager()
  }
  return globalCustomerFeedbackLoopManager
}

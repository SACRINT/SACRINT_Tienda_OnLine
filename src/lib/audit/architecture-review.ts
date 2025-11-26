/**
 * Architecture Review Manager
 * Semana 49, Tarea 49.10: Architecture Review
 */

import { logger } from "@/lib/monitoring"

export interface ArchitectureReview {
  id: string
  component: string
  aspect: "scalability" | "security" | "performance" | "maintainability"
  status: "approved" | "needs_revision" | "rejected"
  feedback: string
  reviewer: string
  timestamp: Date
}

export interface ReviewSummary {
  id: string
  timestamp: Date
  reviews: ArchitectureReview[]
  approvedCount: number
  revisionsNeeded: number
}

export class ArchitectureReviewManager {
  private reviews: Map<string, ArchitectureReview> = new Map()
  private summaries: Map<string, ReviewSummary> = new Map()

  constructor() {
    logger.debug({ type: "arch_review_init" }, "Architecture Review Manager inicializado")
  }

  submitReview(component: string, aspect: string, status: string, feedback: string, reviewer: string): ArchitectureReview {
    const review: ArchitectureReview = {
      id: `review_${Date.now()}`,
      component,
      aspect: aspect as any,
      status: status as any,
      feedback,
      reviewer,
      timestamp: new Date(),
    }
    this.reviews.set(review.id, review)
    logger.info({ type: "review_submitted" }, `${component}: ${status}`)
    return review
  }

  generateReviewSummary(): ReviewSummary {
    const allReviews = Array.from(this.reviews.values())
    const approvedCount = allReviews.filter(r => r.status === "approved").length
    const revisionsNeeded = allReviews.filter(r => r.status === "needs_revision").length

    const summary: ReviewSummary = {
      id: `summary_${Date.now()}`,
      timestamp: new Date(),
      reviews: allReviews,
      approvedCount,
      revisionsNeeded,
    }
    this.summaries.set(summary.id, summary)
    logger.info({ type: "summary_generated" }, `Approved: ${approvedCount}`)
    return summary
  }

  getStatistics() {
    const allReviews = Array.from(this.reviews.values())
    return {
      totalReviews: allReviews.length,
      approved: allReviews.filter(r => r.status === "approved").length,
      needsRevision: allReviews.filter(r => r.status === "needs_revision").length,
    }
  }
}

let globalArchReviewManager: ArchitectureReviewManager | null = null

export function getArchitectureReviewManager(): ArchitectureReviewManager {
  if (!globalArchReviewManager) {
    globalArchReviewManager = new ArchitectureReviewManager()
  }
  return globalArchReviewManager
}

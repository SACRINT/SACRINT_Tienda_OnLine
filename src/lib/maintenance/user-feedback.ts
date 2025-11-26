/**
 * User Feedback Manager
 * Semana 53, Tarea 53.10: User Feedback & Issue Resolution
 */

import { logger } from "@/lib/monitoring"

export interface UserFeedback {
  id: string
  userId: string
  feedbackType: "bug-report" | "feature-request" | "improvement" | "complaint"
  title: string
  description: string
  rating: number
  submittedDate: Date
  status: "new" | "acknowledged" | "in-progress" | "resolved" | "rejected"
  category: string
  upvotes: number
  downvotes: number
  responses: FeedbackResponse[]
}

export interface FeedbackResponse {
  id: string
  respondentId: string
  responseDate: Date
  message: string
  actionTaken?: string
}

export interface FeedbackAnalytics {
  id: string
  reportDate: Date
  totalFeedback: number
  feedbackByType: Record<string, number>
  averageRating: number
  resolutionRate: number
  topIssues: string[]
  sentimentScore: number
}

export class UserFeedbackManager {
  private feedback: Map<string, UserFeedback> = new Map()
  private analytics: Map<string, FeedbackAnalytics> = new Map()

  constructor() {
    logger.debug({ type: "user_feedback_init" }, "Manager inicializado")
  }

  submitFeedback(
    userId: string,
    feedbackType: "bug-report" | "feature-request" | "improvement" | "complaint",
    title: string,
    description: string,
    rating: number,
    category: string
  ): UserFeedback {
    const id = "feedback_" + Date.now()
    const feedbackItem: UserFeedback = {
      id,
      userId,
      feedbackType,
      title,
      description,
      rating,
      submittedDate: new Date(),
      status: "new",
      category,
      upvotes: 0,
      downvotes: 0,
      responses: [],
    }

    this.feedback.set(id, feedbackItem)
    logger.info(
      { type: "feedback_submitted", feedbackId: id },
      `Feedback enviado: ${title}`
    )
    return feedbackItem
  }

  acknowledgeFeedback(feedbackId: string): UserFeedback | null {
    const item = this.feedback.get(feedbackId)
    if (!item) return null

    item.status = "acknowledged"
    this.feedback.set(feedbackId, item)
    logger.info({ type: "feedback_acknowledged", feedbackId }, `Feedback reconocido`)
    return item
  }

  respondToFeedback(
    feedbackId: string,
    respondentId: string,
    message: string,
    actionTaken?: string
  ): FeedbackResponse | null {
    const item = this.feedback.get(feedbackId)
    if (!item) return null

    const response: FeedbackResponse = {
      id: "response_" + Date.now(),
      respondentId,
      responseDate: new Date(),
      message,
      actionTaken,
    }

    item.responses.push(response)
    item.status = "in-progress"
    this.feedback.set(feedbackId, item)
    logger.info(
      { type: "feedback_responded", feedbackId },
      `Respuesta enviada al feedback`
    )
    return response
  }

  resolveFeedback(feedbackId: string): UserFeedback | null {
    const item = this.feedback.get(feedbackId)
    if (!item) return null

    item.status = "resolved"
    this.feedback.set(feedbackId, item)
    logger.info({ type: "feedback_resolved", feedbackId }, `Feedback resuelto`)
    return item
  }

  upvoteFeedback(feedbackId: string): UserFeedback | null {
    const item = this.feedback.get(feedbackId)
    if (!item) return null

    item.upvotes++
    this.feedback.set(feedbackId, item)
    return item
  }

  getFeedbackByType(
    type: "bug-report" | "feature-request" | "improvement" | "complaint"
  ): UserFeedback[] {
    return Array.from(this.feedback.values()).filter((f) => f.feedbackType === type)
  }

  generateAnalytics(): FeedbackAnalytics {
    const feedbackItems = Array.from(this.feedback.values())
    const id = "analytics_" + Date.now()

    const feedbackByType: Record<string, number> = {
      "bug-report": feedbackItems.filter((f) => f.feedbackType === "bug-report")
        .length,
      "feature-request": feedbackItems.filter(
        (f) => f.feedbackType === "feature-request"
      ).length,
      improvement: feedbackItems.filter((f) => f.feedbackType === "improvement")
        .length,
      complaint: feedbackItems.filter((f) => f.feedbackType === "complaint").length,
    }

    const resolved = feedbackItems.filter((f) => f.status === "resolved").length
    const resolutionRate =
      feedbackItems.length > 0 ? (resolved / feedbackItems.length) * 100 : 0

    const analytics: FeedbackAnalytics = {
      id,
      reportDate: new Date(),
      totalFeedback: feedbackItems.length,
      feedbackByType,
      averageRating:
        feedbackItems.length > 0
          ? feedbackItems.reduce((sum, f) => sum + f.rating, 0) / feedbackItems.length
          : 0,
      resolutionRate,
      topIssues: feedbackItems
        .sort((a, b) => b.upvotes - a.upvotes)
        .slice(0, 5)
        .map((f) => f.title),
      sentimentScore: feedbackItems.length > 0
        ? feedbackItems.reduce((sum, f) => sum + f.rating, 0) / (feedbackItems.length * 5)
        : 0,
    }

    this.analytics.set(id, analytics)
    return analytics
  }

  getStatistics(): Record<string, unknown> {
    const items = Array.from(this.feedback.values())

    return {
      totalFeedback: items.length,
      feedbackByStatus: {
        new: items.filter((f) => f.status === "new").length,
        acknowledged: items.filter((f) => f.status === "acknowledged").length,
        inProgress: items.filter((f) => f.status === "in-progress").length,
        resolved: items.filter((f) => f.status === "resolved").length,
        rejected: items.filter((f) => f.status === "rejected").length,
      },
      feedbackByType: {
        bugReport: items.filter((f) => f.feedbackType === "bug-report").length,
        featureRequest: items.filter((f) => f.feedbackType === "feature-request")
          .length,
        improvement: items.filter((f) => f.feedbackType === "improvement").length,
        complaint: items.filter((f) => f.feedbackType === "complaint").length,
      },
      averageRating:
        items.length > 0
          ? items.reduce((sum, f) => sum + f.rating, 0) / items.length
          : 0,
    }
  }

  generateFeedbackReport(): string {
    const stats = this.getStatistics()
    return `User Feedback Report\nTotal Feedback: ${stats.totalFeedback}\nResolved: ${stats.feedbackByStatus.resolved}\nAvg Rating: ${stats.averageRating.toFixed(2)}/5`
  }
}

let globalUserFeedbackManager: UserFeedbackManager | null = null

export function getUserFeedbackManager(): UserFeedbackManager {
  if (!globalUserFeedbackManager) {
    globalUserFeedbackManager = new UserFeedbackManager()
  }
  return globalUserFeedbackManager
}

/**
 * Code Review Manager
 * Semana 53, Tarea 53.8: Code Review & Quality Assurance
 */

import { logger } from "@/lib/monitoring";

export interface CodeReview {
  id: string;
  pullRequestId: string;
  author: string;
  reviewers: string[];
  submittedDate: Date;
  description: string;
  fileCount: number;
  linesChanged: number;
  status: "pending" | "in-review" | "approved" | "changes-requested" | "merged";
  comments: ReviewComment[];
  approvalCount: number;
  rejectionCount: number;
}

export interface ReviewComment {
  id: string;
  reviewer: string;
  commentDate: Date;
  line: number;
  file: string;
  comment: string;
  severity: "critical" | "major" | "minor" | "suggestion";
  resolved: boolean;
}

export interface CodeQualityMetric {
  id: string;
  metricName: string;
  value: number;
  target: number;
  unit: string;
  status: "pass" | "warning" | "fail";
  measuredDate: Date;
}

export class CodeReviewManager {
  private codeReviews: Map<string, CodeReview> = new Map();
  private qualityMetrics: Map<string, CodeQualityMetric> = new Map();

  constructor() {
    logger.debug({ type: "code_review_init" }, "Manager inicializado");
  }

  submitForReview(
    pullRequestId: string,
    author: string,
    reviewers: string[],
    description: string,
    fileCount: number,
    linesChanged: number,
  ): CodeReview {
    const id = "review_" + Date.now();
    const review: CodeReview = {
      id,
      pullRequestId,
      author,
      reviewers,
      submittedDate: new Date(),
      description,
      fileCount,
      linesChanged,
      status: "pending",
      comments: [],
      approvalCount: 0,
      rejectionCount: 0,
    };

    this.codeReviews.set(id, review);
    logger.info(
      { type: "code_review_submitted", reviewId: id },
      `Code review enviado: ${pullRequestId}`,
    );
    return review;
  }

  addReviewComment(
    reviewId: string,
    reviewer: string,
    line: number,
    file: string,
    comment: string,
    severity: "critical" | "major" | "minor" | "suggestion",
  ): ReviewComment | null {
    const review = this.codeReviews.get(reviewId);
    if (!review) return null;

    const commentObj: ReviewComment = {
      id: "comment_" + Date.now(),
      reviewer,
      commentDate: new Date(),
      line,
      file,
      comment,
      severity,
      resolved: false,
    };

    review.comments.push(commentObj);
    review.status = "in-review";
    this.codeReviews.set(reviewId, review);
    logger.info({ type: "review_comment_added", reviewId }, `Comentario de revisión agregado`);
    return commentObj;
  }

  approveReview(reviewId: string, reviewer: string): CodeReview | null {
    const review = this.codeReviews.get(reviewId);
    if (!review) return null;

    review.approvalCount++;
    if (review.approvalCount >= Math.ceil(review.reviewers.length / 2)) {
      review.status = "approved";
    }

    this.codeReviews.set(reviewId, review);
    logger.info({ type: "code_review_approved", reviewId }, `Code review aprobado por ${reviewer}`);
    return review;
  }

  requestChanges(reviewId: string, reviewer: string): CodeReview | null {
    const review = this.codeReviews.get(reviewId);
    if (!review) return null;

    review.rejectionCount++;
    review.status = "changes-requested";
    this.codeReviews.set(reviewId, review);
    logger.info({ type: "changes_requested", reviewId }, `Cambios solicitados por ${reviewer}`);
    return review;
  }

  recordQualityMetric(
    metricName: string,
    value: number,
    target: number,
    unit: string,
  ): CodeQualityMetric {
    const id = "metric_" + Date.now();
    const status = value >= target ? "pass" : value >= target * 0.8 ? "warning" : "fail";

    const metric: CodeQualityMetric = {
      id,
      metricName,
      value,
      target,
      unit,
      status,
      measuredDate: new Date(),
    };

    this.qualityMetrics.set(id, metric);
    logger.info(
      { type: "quality_metric_recorded", metricId: id },
      `Métrica de calidad registrada: ${metricName}`,
    );
    return metric;
  }

  getReviewsByAuthor(author: string): CodeReview[] {
    return Array.from(this.codeReviews.values()).filter((r) => r.author === author);
  }

  getPendingReviews(): CodeReview[] {
    return Array.from(this.codeReviews.values()).filter((r) => r.status === "pending");
  }

  getStatistics(): Record<string, any> {
    const reviews = Array.from(this.codeReviews.values());
    const metrics = Array.from(this.qualityMetrics.values());

    return {
      totalCodeReviews: reviews.length,
      reviewsByStatus: {
        pending: reviews.filter((r) => r.status === "pending").length,
        inReview: reviews.filter((r) => r.status === "in-review").length,
        approved: reviews.filter((r) => r.status === "approved").length,
        changesRequested: reviews.filter((r) => r.status === "changes-requested").length,
        merged: reviews.filter((r) => r.status === "merged").length,
      },
      averageReviewTime:
        reviews.filter((r) => r.status !== "pending").length > 0
          ? reviews.reduce((sum, r) => sum + r.comments.length, 0) /
            reviews.filter((r) => r.status !== "pending").length
          : 0,
      totalQualityMetrics: metrics.length,
      metricsByStatus: {
        pass: metrics.filter((m) => m.status === "pass").length,
        warning: metrics.filter((m) => m.status === "warning").length,
        fail: metrics.filter((m) => m.status === "fail").length,
      },
    };
  }

  generateCodeReviewReport(): string {
    const stats = this.getStatistics();
    return `Code Review Report\nTotal Reviews: ${stats.totalCodeReviews}\nApproved: ${stats.reviewsByStatus.approved}\nQuality Metrics: ${stats.totalQualityMetrics}`;
  }
}

let globalCodeReviewManager: CodeReviewManager | null = null;

export function getCodeReviewManager(): CodeReviewManager {
  if (!globalCodeReviewManager) {
    globalCodeReviewManager = new CodeReviewManager();
  }
  return globalCodeReviewManager;
}

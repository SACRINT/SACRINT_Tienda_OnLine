/**
 * Feature Request Manager
 * Semana 53, Tarea 53.11: Feature Request & Backlog Management
 */

import { logger } from "@/lib/monitoring";

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  requestedBy: string;
  requestedDate: Date;
  priority: "critical" | "high" | "medium" | "low";
  estimatedEffort: "xs" | "s" | "m" | "l" | "xl";
  businessValue: number;
  userCount: number;
  status: "backlog" | "under-review" | "planned" | "in-development" | "completed" | "rejected";
  targetRelease?: string;
  votes: number;
  comments: string[];
}

export interface ReleaseNotes {
  id: string;
  versionNumber: string;
  releaseDate: Date;
  featuresIncluded: FeatureRequest[];
  bugFixesIncluded: string[];
  breakingChanges: string[];
  notes: string;
}

export class FeatureRequestManager {
  private featureRequests: Map<string, FeatureRequest> = new Map();
  private releaseNotes: Map<string, ReleaseNotes> = new Map();
  private backlog: FeatureRequest[] = [];

  constructor() {
    logger.debug({ type: "feature_request_init" }, "Manager inicializado");
  }

  submitFeatureRequest(
    title: string,
    description: string,
    requestedBy: string,
    priority: "critical" | "high" | "medium" | "low",
    estimatedEffort: "xs" | "s" | "m" | "l" | "xl",
    businessValue: number,
  ): FeatureRequest {
    const id = "feature_" + Date.now();
    const request: FeatureRequest = {
      id,
      title,
      description,
      requestedBy,
      requestedDate: new Date(),
      priority,
      estimatedEffort,
      businessValue,
      userCount: 0,
      status: "backlog",
      votes: 0,
      comments: [],
    };

    this.featureRequests.set(id, request);
    this.backlog.push(request);
    logger.info(
      { type: "feature_request_submitted", featureId: id },
      `Feature request enviado: ${title}`,
    );
    return request;
  }

  voteFeature(featureId: string): FeatureRequest | null {
    const feature = this.featureRequests.get(featureId);
    if (!feature) return null;

    feature.votes++;
    this.featureRequests.set(featureId, feature);
    return feature;
  }

  addCommentToFeature(featureId: string, comment: string): FeatureRequest | null {
    const feature = this.featureRequests.get(featureId);
    if (!feature) return null;

    feature.comments.push(comment);
    this.featureRequests.set(featureId, feature);
    logger.info({ type: "feature_comment_added", featureId }, `Comentario agregado al feature`);
    return feature;
  }

  approveFeature(featureId: string, targetRelease: string): FeatureRequest | null {
    const feature = this.featureRequests.get(featureId);
    if (!feature) return null;

    feature.status = "planned";
    feature.targetRelease = targetRelease;
    this.featureRequests.set(featureId, feature);
    logger.info({ type: "feature_approved", featureId }, `Feature aprobado para ${targetRelease}`);
    return feature;
  }

  moveToBacklog(featureId: string): FeatureRequest | null {
    const feature = this.featureRequests.get(featureId);
    if (!feature) return null;

    feature.status = "in-development";
    this.featureRequests.set(featureId, feature);
    return feature;
  }

  completeFeature(featureId: string): FeatureRequest | null {
    const feature = this.featureRequests.get(featureId);
    if (!feature) return null;

    feature.status = "completed";
    this.featureRequests.set(featureId, feature);
    logger.info({ type: "feature_completed", featureId }, `Feature completado`);
    return feature;
  }

  getBacklogByPriority(priority: "critical" | "high" | "medium" | "low"): FeatureRequest[] {
    return Array.from(this.featureRequests.values())
      .filter((f) => f.priority === priority && f.status === "backlog")
      .sort((a, b) => b.votes - a.votes);
  }

  createReleaseNotes(
    versionNumber: string,
    featuresIncluded: FeatureRequest[],
    bugFixesIncluded: string[],
    breakingChanges: string[],
    notes: string,
  ): ReleaseNotes {
    const id = "release_" + Date.now();
    const releaseNote: ReleaseNotes = {
      id,
      versionNumber,
      releaseDate: new Date(),
      featuresIncluded,
      bugFixesIncluded,
      breakingChanges,
      notes,
    };

    this.releaseNotes.set(id, releaseNote);
    logger.info(
      { type: "release_notes_created", releaseId: id },
      `Notas de lanzamiento creadas: ${versionNumber}`,
    );
    return releaseNote;
  }

  getStatistics(): Record<string, any> {
    const features = Array.from(this.featureRequests.values());

    return {
      totalFeatureRequests: features.length,
      byStatus: {
        backlog: features.filter((f) => f.status === "backlog").length,
        underReview: features.filter((f) => f.status === "under-review").length,
        planned: features.filter((f) => f.status === "planned").length,
        inDevelopment: features.filter((f) => f.status === "in-development").length,
        completed: features.filter((f) => f.status === "completed").length,
        rejected: features.filter((f) => f.status === "rejected").length,
      },
      byPriority: {
        critical: features.filter((f) => f.priority === "critical").length,
        high: features.filter((f) => f.priority === "high").length,
        medium: features.filter((f) => f.priority === "medium").length,
        low: features.filter((f) => f.priority === "low").length,
      },
      averageVotes:
        features.length > 0 ? features.reduce((sum, f) => sum + f.votes, 0) / features.length : 0,
      totalReleases: this.releaseNotes.size,
    };
  }

  generateFeatureReport(): string {
    const stats = this.getStatistics();
    return `Feature Request Report\nTotal Requests: ${stats.totalFeatureRequests}\nCompleted: ${stats.byStatus.completed}\nBacklog: ${stats.byStatus.backlog}\nReleases: ${stats.totalReleases}`;
  }
}

let globalFeatureRequestManager: FeatureRequestManager | null = null;

export function getFeatureRequestManager(): FeatureRequestManager {
  if (!globalFeatureRequestManager) {
    globalFeatureRequestManager = new FeatureRequestManager();
  }
  return globalFeatureRequestManager;
}

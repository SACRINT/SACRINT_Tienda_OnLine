/**
 * Knowledge Transfer Manager
 * Semana 52, Tarea 52.2: Knowledge Transfer & Documentation Handoff
 */

import { logger } from "@/lib/monitoring";

export interface KnowledgeTransferSession {
  id: string;
  title: string;
  topic: string;
  trainer: string;
  trainees: string[];
  scheduledDate: Date;
  completedDate?: Date;
  duration: number;
  status: "scheduled" | "in-progress" | "completed";
  materials: string[];
  recordingUrl?: string;
  attendanceRate: number;
}

export interface DocumentationTransfer {
  id: string;
  documentType: string;
  topic: string;
  documentUrl: string;
  owner: string;
  audience: string[];
  lastUpdated: Date;
  completeness: number;
  status: "draft" | "review" | "approved" | "archived";
}

export class KnowledgeTransferManager {
  private transferSessions: Map<string, KnowledgeTransferSession> = new Map();
  private documentation: Map<string, DocumentationTransfer> = new Map();
  private knowledgeBase: Map<string, string[]> = new Map();

  constructor() {
    logger.debug({ type: "knowledge_transfer_init" }, "Manager inicializado");
  }

  scheduleTransferSession(
    title: string,
    topic: string,
    trainer: string,
    trainees: string[],
    scheduledDate: Date,
    duration: number,
    materials: string[] = [],
  ): KnowledgeTransferSession {
    const id = "session_" + Date.now();
    const session: KnowledgeTransferSession = {
      id,
      title,
      topic,
      trainer,
      trainees,
      scheduledDate,
      duration,
      status: "scheduled",
      materials,
      attendanceRate: 0,
    };

    this.transferSessions.set(id, session);
    logger.info(
      { type: "transfer_session_scheduled", sessionId: id },
      `Sesión de transferencia programada: ${title}`,
    );
    return session;
  }

  completeTransferSession(
    sessionId: string,
    attendanceRate: number,
    recordingUrl?: string,
  ): KnowledgeTransferSession | null {
    const session = this.transferSessions.get(sessionId);
    if (!session) return null;

    session.status = "completed";
    session.completedDate = new Date();
    session.attendanceRate = attendanceRate;
    if (recordingUrl) session.recordingUrl = recordingUrl;

    this.transferSessions.set(sessionId, session);
    logger.info(
      { type: "transfer_session_completed", sessionId },
      `Sesión completada con asistencia: ${attendanceRate}%`,
    );
    return session;
  }

  uploadDocumentation(
    documentType: string,
    topic: string,
    documentUrl: string,
    owner: string,
    audience: string[],
    completeness: number = 50,
  ): DocumentationTransfer {
    const id = "doc_" + Date.now();
    const doc: DocumentationTransfer = {
      id,
      documentType,
      topic,
      documentUrl,
      owner,
      audience,
      lastUpdated: new Date(),
      completeness,
      status: "draft",
    };

    this.documentation.set(id, doc);
    logger.info(
      { type: "documentation_uploaded", docId: id },
      `Documentación subida: ${documentType}`,
    );
    return doc;
  }

  approveDocumentation(docId: string): DocumentationTransfer | null {
    const doc = this.documentation.get(docId);
    if (!doc) return null;

    doc.status = "approved";
    doc.completeness = 100;

    this.documentation.set(docId, doc);
    logger.info({ type: "documentation_approved", docId }, `Documentación aprobada`);
    return doc;
  }

  getSessionsByTrainer(trainer: string): KnowledgeTransferSession[] {
    return Array.from(this.transferSessions.values()).filter((s) => s.trainer === trainer);
  }

  getDocumentationByTopic(topic: string): DocumentationTransfer[] {
    return Array.from(this.documentation.values()).filter((d) => d.topic === topic);
  }

  getStatistics(): Record<string, any> {
    const sessions = Array.from(this.transferSessions.values());
    const docs = Array.from(this.documentation.values());

    return {
      totalSessions: sessions.length,
      sessionsByStatus: {
        scheduled: sessions.filter((s) => s.status === "scheduled").length,
        inProgress: sessions.filter((s) => s.status === "in-progress").length,
        completed: sessions.filter((s) => s.status === "completed").length,
      },
      totalDocuments: docs.length,
      docsByStatus: {
        draft: docs.filter((d) => d.status === "draft").length,
        review: docs.filter((d) => d.status === "review").length,
        approved: docs.filter((d) => d.status === "approved").length,
        archived: docs.filter((d) => d.status === "archived").length,
      },
      averageDocumentCompleteness:
        docs.length > 0 ? docs.reduce((sum, d) => sum + d.completeness, 0) / docs.length : 0,
      averageAttendanceRate:
        sessions.length > 0
          ? sessions.reduce((sum, s) => sum + s.attendanceRate, 0) / sessions.length
          : 0,
    };
  }

  generateTransferReport(): string {
    const stats = this.getStatistics();
    return `Knowledge Transfer Report\nSessions: ${stats.totalSessions}\nDocuments: ${stats.totalDocuments}\nAvg Completeness: ${stats.averageDocumentCompleteness.toFixed(2)}%\nAvg Attendance: ${stats.averageAttendanceRate.toFixed(2)}%`;
  }
}

let globalKnowledgeTransferManager: KnowledgeTransferManager | null = null;

export function getKnowledgeTransferManager(): KnowledgeTransferManager {
  if (!globalKnowledgeTransferManager) {
    globalKnowledgeTransferManager = new KnowledgeTransferManager();
  }
  return globalKnowledgeTransferManager;
}

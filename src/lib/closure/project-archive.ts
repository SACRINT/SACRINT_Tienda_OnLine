/**
 * Project Archive Manager
 * Semana 52, Tarea 52.11: Project Archive & Historical Record Management
 */

import { logger } from "@/lib/monitoring"

export interface ArchiveRecord {
  id: string
  projectId: string
  projectName: string
  archiveDate: Date
  archiveLocation: string
  retentionPeriodYears: number
  archiveStatus: "pending" | "in-progress" | "completed"
  archivedBy: string
  description: string
}

export interface ProjectHistory {
  id: string
  projectId: string
  projectName: string
  startDate: Date
  completionDate: Date
  duration: number
  totalBudget: number
  finalBudget: number
  teamSize: number
  status: string
  outcomes: string[]
  keyMilestones: string[]
  historicalNotes: string
}

export interface AccessRequest {
  id: string
  projectId: string
  requestedBy: string
  requestDate: Date
  accessLevel: "view" | "download" | "extract"
  purpose: string
  status: "pending" | "approved" | "denied"
  approvedBy?: string
  expirationDate?: Date
}

export class ProjectArchiveManager {
  private archiveRecords: Map<string, ArchiveRecord> = new Map()
  private projectHistory: Map<string, ProjectHistory> = new Map()
  private accessRequests: Map<string, AccessRequest> = new Map()

  constructor() {
    logger.debug({ type: "project_archive_init" }, "Manager inicializado")
  }

  archiveProject(
    projectId: string,
    projectName: string,
    archiveLocation: string,
    retentionPeriodYears: number,
    archivedBy: string,
    description: string
  ): ArchiveRecord {
    const id = "archive_" + Date.now()
    const record: ArchiveRecord = {
      id,
      projectId,
      projectName,
      archiveDate: new Date(),
      archiveLocation,
      retentionPeriodYears,
      archiveStatus: "pending",
      archivedBy,
      description,
    }

    this.archiveRecords.set(id, record)
    logger.info(
      { type: "project_archived", archiveId: id },
      `Proyecto archivado: ${projectName}`
    )
    return record
  }

  completeArchive(archiveId: string): ArchiveRecord | null {
    const record = this.archiveRecords.get(archiveId)
    if (!record) return null

    record.archiveStatus = "completed"
    this.archiveRecords.set(archiveId, record)
    logger.info({ type: "archive_completed", archiveId }, `Archivado completado`)
    return record
  }

  createProjectHistory(
    projectId: string,
    projectName: string,
    startDate: Date,
    completionDate: Date,
    totalBudget: number,
    finalBudget: number,
    teamSize: number,
    status: string,
    outcomes: string[],
    keyMilestones: string[],
    historicalNotes: string
  ): ProjectHistory {
    const id = "history_" + Date.now()
    const duration = Math.ceil(
      (completionDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const history: ProjectHistory = {
      id,
      projectId,
      projectName,
      startDate,
      completionDate,
      duration,
      totalBudget,
      finalBudget,
      teamSize,
      status,
      outcomes,
      keyMilestones,
      historicalNotes,
    }

    this.projectHistory.set(projectId, history)
    logger.info(
      { type: "project_history_recorded", historyId: id },
      `Historial del proyecto registrado: ${projectName}`
    )
    return history
  }

  requestArchiveAccess(
    projectId: string,
    requestedBy: string,
    accessLevel: "view" | "download" | "extract",
    purpose: string
  ): AccessRequest {
    const id = "request_" + Date.now()
    const request: AccessRequest = {
      id,
      projectId,
      requestedBy,
      requestDate: new Date(),
      accessLevel,
      purpose,
      status: "pending",
    }

    this.accessRequests.set(id, request)
    logger.info(
      { type: "archive_access_requested", requestId: id },
      `Solicitud de acceso a archivo: ${projectId}`
    )
    return request
  }

  approveAccessRequest(
    requestId: string,
    approvedBy: string,
    expirationDate: Date
  ): AccessRequest | null {
    const request = this.accessRequests.get(requestId)
    if (!request) return null

    request.status = "approved"
    request.approvedBy = approvedBy
    request.expirationDate = expirationDate

    this.accessRequests.set(requestId, request)
    logger.info({ type: "access_request_approved", requestId }, `Solicitud aprobada`)
    return request
  }

  getProjectHistory(projectId: string): ProjectHistory | null {
    return this.projectHistory.get(projectId) || null
  }

  getArchiveRecordsByRetention(
    retentionPeriodYears: number
  ): ArchiveRecord[] {
    return Array.from(this.archiveRecords.values()).filter(
      (r) => r.retentionPeriodYears === retentionPeriodYears
    )
  }

  getAccessRequestsByStatus(
    status: "pending" | "approved" | "denied"
  ): AccessRequest[] {
    return Array.from(this.accessRequests.values()).filter((r) => r.status === status)
  }

  getStatistics(): Record<string, unknown> {
    const archives = Array.from(this.archiveRecords.values())
    const histories = Array.from(this.projectHistory.values())
    const requests = Array.from(this.accessRequests.values())

    return {
      totalArchiveRecords: archives.length,
      archivesByStatus: {
        pending: archives.filter((a) => a.archiveStatus === "pending").length,
        inProgress: archives.filter((a) => a.archiveStatus === "in-progress").length,
        completed: archives.filter((a) => a.archiveStatus === "completed").length,
      },
      totalProjectHistories: histories.length,
      totalAccessRequests: requests.length,
      accessRequestsByStatus: {
        pending: requests.filter((r) => r.status === "pending").length,
        approved: requests.filter((r) => r.status === "approved").length,
        denied: requests.filter((r) => r.status === "denied").length,
      },
      averageProjectDuration:
        histories.length > 0
          ? histories.reduce((sum, h) => sum + h.duration, 0) / histories.length
          : 0,
    }
  }

  generateArchiveReport(): string {
    const stats = this.getStatistics()
    return `Project Archive Report\nTotal Archives: ${stats.totalArchiveRecords}\nCompleted: ${stats.archivesByStatus.completed}\nProject Histories: ${stats.totalProjectHistories}\nAccess Requests: ${stats.totalAccessRequests}`
  }
}

let globalProjectArchiveManager: ProjectArchiveManager | null = null

export function getProjectArchiveManager(): ProjectArchiveManager {
  if (!globalProjectArchiveManager) {
    globalProjectArchiveManager = new ProjectArchiveManager()
  }
  return globalProjectArchiveManager
}

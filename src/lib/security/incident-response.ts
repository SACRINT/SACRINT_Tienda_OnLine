/**
 * Security Incident Response
 * Semana 42, Tarea 42.11: Security Incident Response
 */

import { logger } from '@/lib/monitoring'

export interface SecurityIncident {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'reported' | 'investigating' | 'contained' | 'resolved' | 'closed'
  reportedAt: Date
  resolvedAt?: Date
  affectedSystems: string[]
  rootCause?: string
  mitigationActions: string[]
  assignedTo?: string
}

export interface IncidentTimeline {
  incidentId: string
  events: Array<{ timestamp: Date; event: string; details?: string }>
}

export interface IncidentResponse {
  id: string
  incidentId: string
  action: string
  performedBy: string
  timestamp: Date
  result: 'success' | 'partial' | 'failed'
  notes?: string
}

export class IncidentResponseManager {
  private incidents: Map<string, SecurityIncident> = new Map()
  private timelines: Map<string, IncidentTimeline> = new Map()
  private responses: Map<string, IncidentResponse> = new Map()
  private incidentTemplates: Map<string, any> = new Map()

  constructor() {
    logger.debug({ type: 'incident_response_init' }, 'Incident Response Manager inicializado')
    this.initializeTemplates()
  }

  /**
   * Inicializar templates de respuesta
   */
  private initializeTemplates(): void {
    this.incidentTemplates.set('data_breach', {
      title: 'Data Breach Response',
      steps: ['Notify affected users', 'Preserve evidence', 'Assess exposure', 'Implement fixes', 'Monitor'],
    })

    this.incidentTemplates.set('malware', {
      title: 'Malware Response',
      steps: ['Isolate systems', 'Analyze malware', 'Remove threat', 'Restore systems', 'Monitor'],
    })

    this.incidentTemplates.set('unauthorized_access', {
      title: 'Unauthorized Access Response',
      steps: ['Revoke access', 'Reset credentials', 'Audit logs', 'Patch vulnerability', 'Monitor'],
    })
  }

  /**
   * Reportar incidente
   */
  reportIncident(title: string, description: string, severity: string, affectedSystems: string[]): SecurityIncident {
    const incident: SecurityIncident = {
      id: `incident_${Date.now()}`,
      title,
      description,
      severity: severity as any,
      status: 'reported',
      reportedAt: new Date(),
      affectedSystems,
      mitigationActions: [],
    }

    this.incidents.set(incident.id, incident)

    // Crear timeline
    this.timelines.set(incident.id, {
      incidentId: incident.id,
      events: [
        {
          timestamp: new Date(),
          event: 'Incident reported',
          details: `${title} - Severity: ${severity}`,
        },
      ],
    })

    logger.error(
      { type: 'security_incident_reported', incidentId: incident.id, severity, systems: affectedSystems },
      `Incidente de seguridad reportado: ${title}`
    )

    return incident
  }

  /**
   * Cambiar estado del incidente
   */
  updateIncidentStatus(incidentId: string, newStatus: string): SecurityIncident | null {
    const incident = this.incidents.get(incidentId)
    if (!incident) return null

    const oldStatus = incident.status
    incident.status = newStatus as any

    if (newStatus === 'resolved') {
      incident.resolvedAt = new Date()
    }

    this.addTimelineEvent(incidentId, `Status changed from ${oldStatus} to ${newStatus}`)

    logger.info(
      { type: 'incident_status_updated', incidentId, newStatus },
      `Estado del incidente actualizado: ${newStatus}`
    )

    return incident
  }

  /**
   * Asignar respuesta de incidente
   */
  assignIncident(incidentId: string, assignedTo: string): SecurityIncident | null {
    const incident = this.incidents.get(incidentId)
    if (!incident) return null

    incident.assignedTo = assignedTo
    incident.status = 'investigating'

    this.addTimelineEvent(incidentId, `Assigned to ${assignedTo}`)

    logger.info({ type: 'incident_assigned', incidentId, assignedTo }, `Incidente asignado a: ${assignedTo}`)

    return incident
  }

  /**
   * Registrar acción de respuesta
   */
  recordResponse(
    incidentId: string,
    action: string,
    performedBy: string,
    result: 'success' | 'partial' | 'failed',
    notes?: string
  ): IncidentResponse {
    const response: IncidentResponse = {
      id: `response_${Date.now()}`,
      incidentId,
      action,
      performedBy,
      timestamp: new Date(),
      result,
      notes,
    }

    this.responses.set(response.id, response)
    this.addTimelineEvent(incidentId, `Action taken: ${action} (${result})`, notes)

    logger.info(
      { type: 'incident_response_recorded', incidentId, action, result },
      `Respuesta a incidente registrada: ${action}`
    )

    return response
  }

  /**
   * Agregar evento a timeline
   */
  addTimelineEvent(incidentId: string, event: string, details?: string): void {
    const timeline = this.timelines.get(incidentId)
    if (timeline) {
      timeline.events.push({
        timestamp: new Date(),
        event,
        details,
      })
    }
  }

  /**
   * Establecer causa raíz
   */
  setRootCause(incidentId: string, rootCause: string): SecurityIncident | null {
    const incident = this.incidents.get(incidentId)
    if (!incident) return null

    incident.rootCause = rootCause
    this.addTimelineEvent(incidentId, `Root cause identified: ${rootCause}`)

    logger.info({ type: 'root_cause_identified', incidentId }, `Causa raíz identificada: ${rootCause}`)

    return incident
  }

  /**
   * Agregar acción de mitigación
   */
  addMitigationAction(incidentId: string, action: string): SecurityIncident | null {
    const incident = this.incidents.get(incidentId)
    if (!incident) return null

    incident.mitigationActions.push(action)
    this.addTimelineEvent(incidentId, `Mitigation action added: ${action}`)

    logger.info({ type: 'mitigation_action_added', incidentId }, `Acción de mitigación agregada: ${action}`)

    return incident
  }

  /**
   * Obtener incidente
   */
  getIncident(incidentId: string): SecurityIncident | null {
    return this.incidents.get(incidentId) || null
  }

  /**
   * Obtener incidentes activos
   */
  getActiveIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values()).filter((i) => i.status !== 'closed')
  }

  /**
   * Obtener incidentes críticos
   */
  getCriticalIncidents(): SecurityIncident[] {
    return Array.from(this.incidents.values()).filter((i) => i.severity === 'critical' && i.status !== 'closed')
  }

  /**
   * Obtener timeline
   */
  getTimeline(incidentId: string): IncidentTimeline | null {
    return this.timelines.get(incidentId) || null
  }

  /**
   * Generar reporte de incidente
   */
  generateIncidentReport(incidentId: string): string {
    const incident = this.incidents.get(incidentId)
    if (!incident) return 'Incidente no encontrado'

    const timeline = this.timelines.get(incidentId)
    const responses = Array.from(this.responses.values()).filter((r) => r.incidentId === incidentId)

    const report = `
=== REPORTE DE INCIDENTE DE SEGURIDAD ===

ID: ${incident.id}
Título: ${incident.title}
Severidad: ${incident.severity.toUpperCase()}
Estado: ${incident.status}

DESCRIPCIÓN:
${incident.description}

SISTEMAS AFECTADOS:
${incident.affectedSystems.map((s) => `- ${s}`).join('\n')}

CAUSA RAÍZ:
${incident.rootCause || 'Aún por identificar'}

ACCIONES DE MITIGACIÓN:
${incident.mitigationActions.length > 0 ? incident.mitigationActions.map((a) => `- ${a}`).join('\n') : '- Ninguna registrada'}

RESPUESTAS REGISTRADAS:
${responses.length > 0 ? responses.map((r) => `- ${r.action}: ${r.result}`).join('\n') : '- Ninguna'}

TIMELINE:
${timeline ? timeline.events.map((e) => `- ${e.timestamp.toISOString()}: ${e.event}`).join('\n') : 'Sin eventos'}

FECHAS:
- Reportado: ${incident.reportedAt.toISOString()}
- Resuelto: ${incident.resolvedAt ? incident.resolvedAt.toISOString() : 'Pendiente'}
    `

    logger.info({ type: 'incident_report_generated', incidentId }, 'Reporte de incidente generado')
    return report
  }

  /**
   * Obtener estadísticas
   */
  getStatistics(): {
    totalIncidents: number
    activeIncidents: number
    criticalIncidents: number
    resolvedIncidents: number
    averageResolutionTime: number
  } {
    const incidents = Array.from(this.incidents.values())
    const resolved = incidents.filter((i) => i.status === 'closed' && i.resolvedAt)

    const avgTime =
      resolved.length > 0
        ? resolved.reduce((sum, i) => sum + ((i.resolvedAt?.getTime() || 0) - i.reportedAt.getTime()), 0) / resolved.length
        : 0

    return {
      totalIncidents: incidents.length,
      activeIncidents: incidents.filter((i) => i.status !== 'closed').length,
      criticalIncidents: incidents.filter((i) => i.severity === 'critical').length,
      resolvedIncidents: resolved.length,
      averageResolutionTime: Math.round(avgTime / 3600000), // Horas
    }
  }
}

let globalIncidentResponseManager: IncidentResponseManager | null = null

export function initializeIncidentResponseManager(): IncidentResponseManager {
  if (!globalIncidentResponseManager) {
    globalIncidentResponseManager = new IncidentResponseManager()
  }
  return globalIncidentResponseManager
}

export function getIncidentResponseManager(): IncidentResponseManager {
  if (!globalIncidentResponseManager) {
    return initializeIncidentResponseManager()
  }
  return globalIncidentResponseManager
}

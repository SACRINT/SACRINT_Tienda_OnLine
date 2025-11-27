/**
 * Post-Implementation Support Manager
 * Semana 52, Tarea 52.10: Post-Implementation Support & Warranty Period
 */

import { logger } from "@/lib/monitoring";

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  status: "open" | "in-progress" | "resolved" | "closed";
  createdDate: Date;
  resolvedDate?: Date;
  assignedTo: string;
  resolutionNotes?: string;
}

export interface WarrantyPeriod {
  id: string;
  projectId: string;
  startDate: Date;
  endDate: Date;
  supportLevel: "premium" | "standard" | "basic";
  coverageScope: string[];
  responseTimeHours: number;
  resolutionTimeHours: number;
}

export interface SupportMetric {
  id: string;
  metricName: string;
  target: number;
  actual: number;
  unit: string;
  status: "met" | "not-met";
  measurementDate: Date;
}

export class PostImplementationSupportManager {
  private supportTickets: Map<string, SupportTicket> = new Map();
  private warrantyPeriods: Map<string, WarrantyPeriod> = new Map();
  private supportMetrics: Map<string, SupportMetric> = new Map();

  constructor() {
    logger.debug({ type: "post_implementation_support_init" }, "Manager inicializado");
  }

  createSupportTicket(
    title: string,
    description: string,
    severity: "critical" | "high" | "medium" | "low",
    assignedTo: string,
  ): SupportTicket {
    const id = "ticket_" + Date.now();
    const ticketNumber = `SUP-${Date.now()}`;

    const ticket: SupportTicket = {
      id,
      ticketNumber,
      title,
      description,
      severity,
      status: "open",
      createdDate: new Date(),
      assignedTo,
    };

    this.supportTickets.set(id, ticket);
    logger.info(
      { type: "support_ticket_created", ticketId: id },
      `Ticket de soporte creado: ${ticketNumber}`,
    );
    return ticket;
  }

  updateTicketStatus(
    ticketId: string,
    status: "open" | "in-progress" | "resolved" | "closed",
    resolutionNotes?: string,
  ): SupportTicket | null {
    const ticket = this.supportTickets.get(ticketId);
    if (!ticket) return null;

    ticket.status = status;
    if (status === "resolved" || status === "closed") {
      ticket.resolvedDate = new Date();
    }
    if (resolutionNotes) ticket.resolutionNotes = resolutionNotes;

    this.supportTickets.set(ticketId, ticket);
    logger.info({ type: "ticket_status_updated", ticketId }, `Estado actualizado: ${status}`);
    return ticket;
  }

  createWarrantyPeriod(
    projectId: string,
    startDate: Date,
    endDate: Date,
    supportLevel: "premium" | "standard" | "basic",
    coverageScope: string[],
    responseTimeHours: number,
    resolutionTimeHours: number,
  ): WarrantyPeriod {
    const id = "warranty_" + Date.now();
    const warranty: WarrantyPeriod = {
      id,
      projectId,
      startDate,
      endDate,
      supportLevel,
      coverageScope,
      responseTimeHours,
      resolutionTimeHours,
    };

    this.warrantyPeriods.set(id, warranty);
    logger.info(
      { type: "warranty_period_created", warrantyId: id },
      `Período de garantía creado: ${supportLevel}`,
    );
    return warranty;
  }

  recordSupportMetric(
    metricName: string,
    target: number,
    actual: number,
    unit: string,
  ): SupportMetric {
    const id = "metric_" + Date.now();
    const status = actual >= target ? "met" : "not-met";

    const metric: SupportMetric = {
      id,
      metricName,
      target,
      actual,
      unit,
      status,
      measurementDate: new Date(),
    };

    this.supportMetrics.set(id, metric);
    logger.info(
      { type: "support_metric_recorded", metricId: id },
      `Métrica de soporte registrada: ${metricName}`,
    );
    return metric;
  }

  getTicketsByStatus(status: "open" | "in-progress" | "resolved" | "closed"): SupportTicket[] {
    return Array.from(this.supportTickets.values()).filter((t) => t.status === status);
  }

  getTicketsBySeverity(severity: "critical" | "high" | "medium" | "low"): SupportTicket[] {
    return Array.from(this.supportTickets.values()).filter((t) => t.severity === severity);
  }

  getActiveWarranties(): WarrantyPeriod[] {
    const now = new Date();
    return Array.from(this.warrantyPeriods.values()).filter(
      (w) => w.startDate <= now && w.endDate >= now,
    );
  }

  getStatistics(): Record<string, any> {
    const tickets = Array.from(this.supportTickets.values());
    const warranties = Array.from(this.warrantyPeriods.values());
    const metrics = Array.from(this.supportMetrics.values());

    return {
      totalTickets: tickets.length,
      ticketsByStatus: {
        open: tickets.filter((t) => t.status === "open").length,
        inProgress: tickets.filter((t) => t.status === "in-progress").length,
        resolved: tickets.filter((t) => t.status === "resolved").length,
        closed: tickets.filter((t) => t.status === "closed").length,
      },
      ticketsBySeverity: {
        critical: tickets.filter((t) => t.severity === "critical").length,
        high: tickets.filter((t) => t.severity === "high").length,
        medium: tickets.filter((t) => t.severity === "medium").length,
        low: tickets.filter((t) => t.severity === "low").length,
      },
      averageResolutionTimeHours:
        tickets.filter((t) => t.resolvedDate).length > 0
          ? tickets.reduce((sum, t) => {
              if (!t.resolvedDate) return sum;
              return sum + (t.resolvedDate.getTime() - t.createdDate.getTime()) / (1000 * 60 * 60);
            }, 0) / tickets.filter((t) => t.resolvedDate).length
          : 0,
      totalWarranties: warranties.length,
      activeWarranties: this.getActiveWarranties().length,
      metricsMetTarget: metrics.filter((m) => m.status === "met").length,
    };
  }

  generateSupportReport(): string {
    const stats = this.getStatistics();
    return `Post-Implementation Support Report\nTotal Tickets: ${stats.totalTickets}\nResolved: ${stats.ticketsByStatus.resolved}\nActive Warranties: ${stats.activeWarranties}\nMetrics Met: ${stats.metricsMetTarget}`;
  }
}

let globalPostImplementationSupportManager: PostImplementationSupportManager | null = null;

export function getPostImplementationSupportManager(): PostImplementationSupportManager {
  if (!globalPostImplementationSupportManager) {
    globalPostImplementationSupportManager = new PostImplementationSupportManager();
  }
  return globalPostImplementationSupportManager;
}

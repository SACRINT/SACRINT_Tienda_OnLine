/**
 * Compliance Manager
 * Semana 54, Tarea 54.6: Compliance & Regulatory Management
 */

import { logger } from "@/lib/monitoring";

export interface ComplianceRequirement {
  id: string;
  requirementName: string;
  framework: string;
  description: string;
  deadline: Date;
  status: "not-started" | "in-progress" | "completed" | "verified";
  owner: string;
}

export class ComplianceManager {
  private requirements: Map<string, ComplianceRequirement> = new Map();

  constructor() {
    logger.debug({ type: "compliance_init" }, "Manager inicializado");
  }

  registerRequirement(
    requirementName: string,
    framework: string,
    description: string,
    deadline: Date,
    owner: string,
  ): ComplianceRequirement {
    const id = "comp_" + Date.now();
    const requirement: ComplianceRequirement = {
      id,
      requirementName,
      framework,
      description,
      deadline,
      status: "not-started",
      owner,
    };

    this.requirements.set(id, requirement);
    logger.info(
      { type: "compliance_requirement_registered", reqId: id },
      `Requerimiento registrado: ${requirementName}`,
    );
    return requirement;
  }

  updateStatus(
    requirementId: string,
    status: "not-started" | "in-progress" | "completed" | "verified",
  ): ComplianceRequirement | null {
    const req = this.requirements.get(requirementId);
    if (!req) return null;

    req.status = status;
    this.requirements.set(requirementId, req);
    return req;
  }

  getStatistics(): Record<string, any> {
    const reqs = Array.from(this.requirements.values());

    return {
      totalRequirements: reqs.length,
      byStatus: {
        notStarted: reqs.filter((r) => r.status === "not-started").length,
        inProgress: reqs.filter((r) => r.status === "in-progress").length,
        completed: reqs.filter((r) => r.status === "completed").length,
        verified: reqs.filter((r) => r.status === "verified").length,
      },
    };
  }

  generateComplianceReport(): string {
    const stats = this.getStatistics();
    return `Compliance Report\nTotal: ${stats.totalRequirements}\nVerified: ${stats.byStatus.verified}`;
  }
}

let globalComplianceManager: ComplianceManager | null = null;

export function getComplianceManager(): ComplianceManager {
  if (!globalComplianceManager) {
    globalComplianceManager = new ComplianceManager();
  }
  return globalComplianceManager;
}

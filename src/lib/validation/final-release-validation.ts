/**
 * Final Release Validation Manager
 * Semana 50, Tarea 50.12: Final Release Validation
 */

import { logger } from "@/lib/monitoring";

export interface ReleaseValidation {
  id: string;
  component: string;
  validationType: string;
  status: "passed" | "failed";
  issues?: string[];
  validatedAt: Date;
}

export interface ReleaseValidationReport {
  id: string;
  timestamp: Date;
  validations: ReleaseValidation[];
  overallStatus: "approved" | "rejected";
  releaseReady: boolean;
  blockers: string[];
}

export class FinalReleaseValidationManager {
  private validations: Map<string, ReleaseValidation> = new Map();
  private reports: Map<string, ReleaseValidationReport> = new Map();

  constructor() {
    logger.debug(
      { type: "release_validation_init" },
      "Final Release Validation Manager inicializado",
    );
  }

  validateComponent(
    component: string,
    validationType: string,
    status: string,
    issues: string[] = [],
  ): ReleaseValidation {
    const validation: ReleaseValidation = {
      id: `validation_${Date.now()}`,
      component,
      validationType,
      status: status as any,
      issues: issues.length > 0 ? issues : undefined,
      validatedAt: new Date(),
    };
    this.validations.set(validation.id, validation);
    logger.info({ type: "validation_completed" }, `${component}: ${status}`);
    return validation;
  }

  generateReleaseReport(): ReleaseValidationReport {
    const allValidations = Array.from(this.validations.values());
    const passedCount = allValidations.filter((v) => v.status === "passed").length;
    const blockers = allValidations
      .filter((v) => v.status === "failed")
      .map((v) => `${v.component}: ${v.validationType}`)
      .flat();

    const report: ReleaseValidationReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      validations: allValidations,
      overallStatus: blockers.length === 0 ? "approved" : "rejected",
      releaseReady: blockers.length === 0,
      blockers,
    };
    this.reports.set(report.id, report);

    const status = report.releaseReady ? "APROBADO PARA PRODUCCIÓN" : "BLOQUEADO";
    logger.info({ type: "report_generated" }, status);
    return report;
  }

  getStatistics() {
    const allValidations = Array.from(this.validations.values());
    return {
      totalValidations: allValidations.length,
      passedValidations: allValidations.filter((v) => v.status === "passed").length,
      failedValidations: allValidations.filter((v) => v.status === "failed").length,
    };
  }
}

let globalReleaseValidationManager: FinalReleaseValidationManager | null = null;

export function getFinalReleaseValidationManager(): FinalReleaseValidationManager {
  if (!globalReleaseValidationManager) {
    globalReleaseValidationManager = new FinalReleaseValidationManager();
  }
  return globalReleaseValidationManager;
}

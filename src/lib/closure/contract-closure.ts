/**
 * Contract Closure Manager
 * Semana 52, Tarea 52.8: Contract & Vendor Closure
 */

import { logger } from "@/lib/monitoring";

export interface Contract {
  id: string;
  contractNumber: string;
  vendor: string;
  startDate: Date;
  endDate: Date;
  value: number;
  status: "active" | "completed" | "terminated" | "expired";
  deliverables: string[];
  paymentTerms: string;
}

export interface ClosureChecklistItem {
  id: string;
  item: string;
  category: "payment" | "delivery" | "documentation" | "legal";
  status: "pending" | "completed";
  completedDate?: Date;
  completedBy?: string;
}

export interface VendorAssessment {
  id: string;
  vendor: string;
  performanceRating: number;
  qualityRating: number;
  deliveryRating: number;
  communicationRating: number;
  overallRating: number;
  feedback: string;
  recommendationForFuture: "recommend" | "conditional" | "not-recommend";
}

export interface ContractClosureStatistics {
  totalContracts: number;
  contractsByStatus: {
    active: number;
    completed: number;
    terminated: number;
    expired: number;
  };
  totalContractValue: number;
  totalVendorAssessments: number;
  averageVendorRating: number;
}

export class ContractClosureManager {
  private contracts: Map<string, Contract> = new Map();
  private closureChecklists: Map<string, ClosureChecklistItem[]> = new Map();
  private vendorAssessments: Map<string, VendorAssessment> = new Map();

  constructor() {
    logger.debug({ type: "contract_closure_init" }, "Manager inicializado");
  }

  registerContract(
    contractNumber: string,
    vendor: string,
    startDate: Date,
    endDate: Date,
    value: number,
    deliverables: string[],
    paymentTerms: string,
  ): Contract {
    const id = "contract_" + Date.now();
    const contract: Contract = {
      id,
      contractNumber,
      vendor,
      startDate,
      endDate,
      value,
      status: "active",
      deliverables,
      paymentTerms,
    };

    this.contracts.set(id, contract);
    this.closureChecklists.set(id, []);
    logger.info({ type: "contract_registered", contractId: id }, `Contrato registrado: ${vendor}`);
    return contract;
  }

  createClosureChecklist(
    contractId: string,
    checklistItems: Array<{ item: string; category: string }>,
  ): ClosureChecklistItem[] {
    const checklist: ClosureChecklistItem[] = checklistItems.map((ci) => ({
      id: "item_" + Date.now(),
      item: ci.item,
      category: ci.category as "payment" | "delivery" | "documentation" | "legal",
      status: "pending",
    }));

    this.closureChecklists.set(contractId, checklist);
    logger.info(
      { type: "closure_checklist_created", contractId },
      `Lista de verificación de cierre creada`,
    );
    return checklist;
  }

  completeChecklistItem(
    contractId: string,
    itemId: string,
    completedBy: string,
  ): ClosureChecklistItem | null {
    const checklist = this.closureChecklists.get(contractId) || [];
    const item = checklist.find((i) => i.id === itemId);
    if (!item) return null;

    item.status = "completed";
    item.completedDate = new Date();
    item.completedBy = completedBy;

    logger.info(
      { type: "checklist_item_completed", itemId },
      `Elemento de verificación completado`,
    );
    return item;
  }

  finalizeContract(contractId: string): Contract | null {
    const contract = this.contracts.get(contractId);
    if (!contract) return null;

    const checklist = this.closureChecklists.get(contractId) || [];
    const allCompleted = checklist.every((i) => i.status === "completed");

    if (allCompleted) {
      contract.status = "completed";
      this.contracts.set(contractId, contract);
      logger.info({ type: "contract_finalized", contractId }, `Contrato finalizado`);
    } else {
      logger.warn({ type: "contract_not_ready", contractId }, "Contrato no listo para finalizar");
    }

    return contract;
  }

  assessVendor(
    vendor: string,
    performanceRating: number,
    qualityRating: number,
    deliveryRating: number,
    communicationRating: number,
    feedback: string,
    recommendationForFuture: "recommend" | "conditional" | "not-recommend",
  ): VendorAssessment {
    const id = "assessment_" + Date.now();
    const overallRating =
      (performanceRating + qualityRating + deliveryRating + communicationRating) / 4;

    const assessment: VendorAssessment = {
      id,
      vendor,
      performanceRating,
      qualityRating,
      deliveryRating,
      communicationRating,
      overallRating,
      feedback,
      recommendationForFuture,
    };

    this.vendorAssessments.set(id, assessment);
    logger.info(
      { type: "vendor_assessment_recorded", assessmentId: id },
      `Evaluación de proveedor registrada: ${vendor}`,
    );
    return assessment;
  }

  getContractsByStatus(status: "active" | "completed" | "terminated" | "expired"): Contract[] {
    return Array.from(this.contracts.values()).filter((c) => c.status === status);
  }

  getVendorAssessments(vendor: string): VendorAssessment[] {
    return Array.from(this.vendorAssessments.values()).filter((a) => a.vendor === vendor);
  }

  getStatistics(): ContractClosureStatistics {
    const contracts = Array.from(this.contracts.values());
    const assessments = Array.from(this.vendorAssessments.values());

    return {
      totalContracts: contracts.length,
      contractsByStatus: {
        active: contracts.filter((c) => c.status === "active").length,
        completed: contracts.filter((c) => c.status === "completed").length,
        terminated: contracts.filter((c) => c.status === "terminated").length,
        expired: contracts.filter((c) => c.status === "expired").length,
      },
      totalContractValue: contracts.reduce((sum, c) => sum + c.value, 0),
      totalVendorAssessments: assessments.length,
      averageVendorRating:
        assessments.length > 0
          ? assessments.reduce((sum, a) => sum + a.overallRating, 0) / assessments.length
          : 0,
    };
  }

  generateContractClosureReport(): string {
    const stats = this.getStatistics();
    return `Contract Closure Report\nTotal Contracts: ${stats.totalContracts}\nTotal Value: ${stats.totalContractValue}\nAverage Vendor Rating: ${stats.averageVendorRating.toFixed(2)}`;
  }
}

let globalContractClosureManager: ContractClosureManager | null = null;

export function getContractClosureManager(): ContractClosureManager {
  if (!globalContractClosureManager) {
    globalContractClosureManager = new ContractClosureManager();
  }
  return globalContractClosureManager;
}

/**
 * Client Acceptance Manager
 * Semana 52, Tarea 52.4: Client Acceptance & Sign-off Management
 */

import { logger } from "@/lib/monitoring";

export interface AcceptanceCriteria {
  id: string;
  criterion: string;
  description: string;
  acceptanceLevel: "critical" | "important" | "nice-to-have";
  status: "not-met" | "partially-met" | "met";
  evidenceUrl?: string;
  verifiedDate?: Date;
  verifiedBy?: string;
}

export interface ClientSignoff {
  id: string;
  clientId: string;
  clientName: string;
  projectName: string;
  signoffDate: Date;
  acceptanceCriteria: AcceptanceCriteria[];
  overallStatus: "accepted" | "accepted-with-conditions" | "rejected";
  comments: string;
  signedBy: string;
  signatureUrl?: string;
}

export interface UAT {
  id: string;
  projectName: string;
  startDate: Date;
  endDate?: Date;
  testCases: TestCase[];
  status: "planned" | "in-progress" | "completed";
  passRate: number;
  issuesFound: number;
  issuesResolved: number;
}

export interface TestCase {
  id: string;
  description: string;
  expectedResult: string;
  actualResult?: string;
  status: "pending" | "passed" | "failed";
  testedDate?: Date;
  testedBy?: string;
}

export interface AcceptanceStatistics {
  totalSignoffs: number;
  signoffsByStatus: {
    accepted: number;
    acceptedWithConditions: number;
    rejected: number;
  };
  totalUATs: number;
  uatsByStatus: {
    planned: number;
    inProgress: number;
    completed: number;
  };
  averagePassRate: number;
}

export class ClientAcceptanceManager {
  private signoffs: Map<string, ClientSignoff> = new Map();
  private acceptanceCriteria: Map<string, AcceptanceCriteria[]> = new Map();
  private uats: Map<string, UAT> = new Map();

  constructor() {
    logger.debug({ type: "client_acceptance_init" }, "Manager inicializado");
  }

  createSignoff(
    clientId: string,
    clientName: string,
    projectName: string,
    signedBy: string,
  ): ClientSignoff {
    const id = "signoff_" + Date.now();
    const signoff: ClientSignoff = {
      id,
      clientId,
      clientName,
      projectName,
      signoffDate: new Date(),
      acceptanceCriteria: [],
      overallStatus: "accepted",
      comments: "",
      signedBy,
    };

    this.signoffs.set(id, signoff);
    this.acceptanceCriteria.set(id, []);
    logger.info(
      { type: "client_signoff_created", signoffId: id },
      `Signoff del cliente creado: ${clientName}`,
    );
    return signoff;
  }

  addAcceptanceCriterion(
    signoffId: string,
    criterion: string,
    description: string,
    acceptanceLevel: "critical" | "important" | "nice-to-have",
  ): AcceptanceCriteria | null {
    const signoff = this.signoffs.get(signoffId);
    if (!signoff) return null;

    const criteria: AcceptanceCriteria = {
      id: "criteria_" + Date.now(),
      criterion,
      description,
      acceptanceLevel,
      status: "not-met",
    };

    signoff.acceptanceCriteria.push(criteria);
    const criteriaList = this.acceptanceCriteria.get(signoffId) || [];
    criteriaList.push(criteria);
    this.acceptanceCriteria.set(signoffId, criteriaList);

    logger.info(
      { type: "acceptance_criteria_added", signoffId },
      `Criterio agregado: ${criterion}`,
    );
    return criteria;
  }

  verifyAcceptanceCriteria(
    signoffId: string,
    criteriaId: string,
    status: "not-met" | "partially-met" | "met",
    evidenceUrl?: string,
    verifiedBy?: string,
  ): AcceptanceCriteria | null {
    const signoff = this.signoffs.get(signoffId);
    if (!signoff) return null;

    const criteria = signoff.acceptanceCriteria.find((c) => c.id === criteriaId);
    if (!criteria) return null;

    criteria.status = status;
    criteria.evidenceUrl = evidenceUrl;
    criteria.verifiedDate = new Date();
    criteria.verifiedBy = verifiedBy;

    logger.info({ type: "criteria_verified", criteriaId }, `Criterio verificado: ${status}`);
    return criteria;
  }

  startUAT(projectName: string, startDate: Date): UAT {
    const id = "uat_" + Date.now();
    const uat: UAT = {
      id,
      projectName,
      startDate,
      testCases: [],
      status: "planned",
      passRate: 0,
      issuesFound: 0,
      issuesResolved: 0,
    };

    this.uats.set(id, uat);
    logger.info({ type: "uat_started", uatId: id }, `UAT iniciado para: ${projectName}`);
    return uat;
  }

  addTestCase(uatId: string, description: string, expectedResult: string): TestCase | null {
    const uat = this.uats.get(uatId);
    if (!uat) return null;

    const testCase: TestCase = {
      id: "test_" + Date.now(),
      description,
      expectedResult,
      status: "pending",
    };

    uat.testCases.push(testCase);
    this.uats.set(uatId, uat);
    return testCase;
  }

  recordTestResult(
    uatId: string,
    testCaseId: string,
    actualResult: string,
    status: "passed" | "failed",
    testedBy?: string,
  ): TestCase | null {
    const uat = this.uats.get(uatId);
    if (!uat) return null;

    const testCase = uat.testCases.find((t) => t.id === testCaseId);
    if (!testCase) return null;

    testCase.actualResult = actualResult;
    testCase.status = status;
    testCase.testedDate = new Date();
    testCase.testedBy = testedBy;

    if (status === "failed") {
      uat.issuesFound++;
    }

    const passedTests = uat.testCases.filter((t) => t.status === "passed").length;
    uat.passRate = (passedTests / uat.testCases.length) * 100 || 0;

    this.uats.set(uatId, uat);
    return testCase;
  }

  getStatistics(): AcceptanceStatistics {
    const signoffs = Array.from(this.signoffs.values());
    const uats = Array.from(this.uats.values());

    return {
      totalSignoffs: signoffs.length,
      signoffsByStatus: {
        accepted: signoffs.filter((s) => s.overallStatus === "accepted").length,
        acceptedWithConditions: signoffs.filter(
          (s) => s.overallStatus === "accepted-with-conditions",
        ).length,
        rejected: signoffs.filter((s) => s.overallStatus === "rejected").length,
      },
      totalUATs: uats.length,
      uatsByStatus: {
        planned: uats.filter((u) => u.status === "planned").length,
        inProgress: uats.filter((u) => u.status === "in-progress").length,
        completed: uats.filter((u) => u.status === "completed").length,
      },
      averagePassRate:
        uats.length > 0 ? uats.reduce((sum, u) => sum + u.passRate, 0) / uats.length : 0,
    };
  }

  generateAcceptanceReport(): string {
    const stats = this.getStatistics();
    return `Client Acceptance Report\nTotal Signoffs: ${stats.totalSignoffs}\nTotal UATs: ${stats.totalUATs}\nAverage Pass Rate: ${stats.averagePassRate.toFixed(2)}%`;
  }
}

let globalClientAcceptanceManager: ClientAcceptanceManager | null = null;

export function getClientAcceptanceManager(): ClientAcceptanceManager {
  if (!globalClientAcceptanceManager) {
    globalClientAcceptanceManager = new ClientAcceptanceManager();
  }
  return globalClientAcceptanceManager;
}

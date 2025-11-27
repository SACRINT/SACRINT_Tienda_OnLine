/**
 * Customer Success Manager
 * Semana 54, Tarea 54.2: Customer Success & Retention
 */

import { logger } from "@/lib/monitoring";

export interface CustomerAccount {
  id: string;
  customerId: string;
  accountName: string;
  tier: "startup" | "growth" | "enterprise";
  createdDate: Date;
  healthScore: number;
  churnRisk: "low" | "medium" | "high";
  npsScore: number;
  successManager: string;
  lastTouchDate: Date;
}

export interface SuccessInitiative {
  id: string;
  customerId: string;
  initiativeName: string;
  goal: string;
  status: "planned" | "in-progress" | "completed";
  expectedOutcome: string;
  metrics: string[];
}

export class CustomerSuccessManager {
  private customerAccounts: Map<string, CustomerAccount> = new Map();
  private successInitiatives: Map<string, SuccessInitiative> = new Map();

  constructor() {
    logger.debug({ type: "customer_success_init" }, "Manager inicializado");
  }

  onboardCustomer(
    customerId: string,
    accountName: string,
    tier: "startup" | "growth" | "enterprise",
    successManager: string,
  ): CustomerAccount {
    const id = "account_" + Date.now();
    const account: CustomerAccount = {
      id,
      customerId,
      accountName,
      tier,
      createdDate: new Date(),
      healthScore: 50,
      churnRisk: "medium",
      npsScore: 0,
      successManager,
      lastTouchDate: new Date(),
    };

    this.customerAccounts.set(id, account);
    logger.info({ type: "customer_onboarded", accountId: id }, `Cliente integrado: ${accountName}`);
    return account;
  }

  updateCustomerHealth(
    accountId: string,
    healthScore: number,
    npsScore: number,
  ): CustomerAccount | null {
    const account = this.customerAccounts.get(accountId);
    if (!account) return null;

    account.healthScore = healthScore;
    account.npsScore = npsScore;
    account.lastTouchDate = new Date();

    if (healthScore > 70) {
      account.churnRisk = "low";
    } else if (healthScore > 40) {
      account.churnRisk = "medium";
    } else {
      account.churnRisk = "high";
    }

    this.customerAccounts.set(accountId, account);
    logger.info({ type: "customer_health_updated", accountId }, `Salud del cliente actualizada`);
    return account;
  }

  createSuccessInitiative(
    customerId: string,
    initiativeName: string,
    goal: string,
    expectedOutcome: string,
    metrics: string[],
  ): SuccessInitiative {
    const id = "init_" + Date.now();
    const initiative: SuccessInitiative = {
      id,
      customerId,
      initiativeName,
      goal,
      status: "planned",
      expectedOutcome,
      metrics,
    };

    this.successInitiatives.set(id, initiative);
    logger.info(
      { type: "success_initiative_created", initiativeId: id },
      `Iniciativa de éxito creada`,
    );
    return initiative;
  }

  getHighChurnRiskCustomers(): CustomerAccount[] {
    return Array.from(this.customerAccounts.values()).filter((c) => c.churnRisk === "high");
  }

  getStatistics(): Record<string, any> {
    const accounts = Array.from(this.customerAccounts.values());

    return {
      totalCustomers: accounts.length,
      byTier: {
        startup: accounts.filter((a) => a.tier === "startup").length,
        growth: accounts.filter((a) => a.tier === "growth").length,
        enterprise: accounts.filter((a) => a.tier === "enterprise").length,
      },
      byChurnRisk: {
        low: accounts.filter((a) => a.churnRisk === "low").length,
        medium: accounts.filter((a) => a.churnRisk === "medium").length,
        high: accounts.filter((a) => a.churnRisk === "high").length,
      },
      averageHealthScore:
        accounts.length > 0
          ? accounts.reduce((sum, a) => sum + a.healthScore, 0) / accounts.length
          : 0,
      averageNPS:
        accounts.length > 0
          ? accounts.reduce((sum, a) => sum + a.npsScore, 0) / accounts.length
          : 0,
    };
  }

  generateCustomerSuccessReport(): string {
    const stats = this.getStatistics();
    return `Customer Success Report\nTotal Customers: ${stats.totalCustomers}\nAvg Health: ${stats.averageHealthScore.toFixed(2)}\nAvg NPS: ${stats.averageNPS.toFixed(2)}`;
  }
}

let globalCustomerSuccessManager: CustomerSuccessManager | null = null;

export function getCustomerSuccessManager(): CustomerSuccessManager {
  if (!globalCustomerSuccessManager) {
    globalCustomerSuccessManager = new CustomerSuccessManager();
  }
  return globalCustomerSuccessManager;
}

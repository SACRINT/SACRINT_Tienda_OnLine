/**
 * Financial Closure Manager
 * Semana 52, Tarea 52.7: Financial Closure & Final Accounting
 */

import { logger } from "@/lib/monitoring";

export interface FinancialStatement {
  id: string;
  projectId: string;
  projectName: string;
  reportingPeriod: string;
  totalBudget: number;
  totalSpent: number;
  variance: number;
  currencyCode: string;
  status: "draft" | "reviewed" | "approved";
  preparedBy: string;
  preparedDate: Date;
}

export interface ExpenseCategory {
  id: string;
  category: string;
  budgetedAmount: number;
  actualAmount: number;
  variance: number;
  percentageOfTotal: number;
  description: string;
}

export interface FinancialReconciliation {
  id: string;
  projectId: string;
  invoices: Invoice[];
  payments: Payment[];
  discrepancies: Discrepancy[];
  status: "open" | "in-progress" | "reconciled";
  reconciledDate?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  vendor: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: "outstanding" | "paid";
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  method: string;
  referenceNumber: string;
}

export interface Discrepancy {
  id: string;
  description: string;
  amount: number;
  status: "identified" | "reviewed" | "resolved";
  resolution?: string;
}

export class FinancialClosureManager {
  private financialStatements: Map<string, FinancialStatement> = new Map();
  private expenseCategories: Map<string, ExpenseCategory[]> = new Map();
  private reconciliations: Map<string, FinancialReconciliation> = new Map();

  constructor() {
    logger.debug({ type: "financial_closure_init" }, "Manager inicializado");
  }

  createFinancialStatement(
    projectId: string,
    projectName: string,
    reportingPeriod: string,
    totalBudget: number,
    totalSpent: number,
    preparedBy: string,
  ): FinancialStatement {
    const id = "statement_" + Date.now();
    const variance = totalBudget - totalSpent;

    const statement: FinancialStatement = {
      id,
      projectId,
      projectName,
      reportingPeriod,
      totalBudget,
      totalSpent,
      variance,
      currencyCode: "USD",
      status: "draft",
      preparedBy,
      preparedDate: new Date(),
    };

    this.financialStatements.set(id, statement);
    logger.info(
      { type: "financial_statement_created", statementId: id },
      `Estado financiero creado: ${projectName}`,
    );
    return statement;
  }

  addExpenseCategory(
    statementId: string,
    category: string,
    budgetedAmount: number,
    actualAmount: number,
    description: string,
  ): ExpenseCategory | null {
    const statement = this.financialStatements.get(statementId);
    if (!statement) return null;

    const variance = budgetedAmount - actualAmount;
    const expenseCategory: ExpenseCategory = {
      id: "expense_" + Date.now(),
      category,
      budgetedAmount,
      actualAmount,
      variance,
      percentageOfTotal: (actualAmount / statement.totalSpent) * 100 || 0,
      description,
    };

    const categories = this.expenseCategories.get(statementId) || [];
    categories.push(expenseCategory);
    this.expenseCategories.set(statementId, categories);

    return expenseCategory;
  }

  createReconciliation(projectId: string): FinancialReconciliation {
    const id = "reconciliation_" + Date.now();
    const reconciliation: FinancialReconciliation = {
      id,
      projectId,
      invoices: [],
      payments: [],
      discrepancies: [],
      status: "open",
    };

    this.reconciliations.set(id, reconciliation);
    logger.info(
      { type: "reconciliation_created", reconciliationId: id },
      `Reconciliación financiera creada`,
    );
    return reconciliation;
  }

  addInvoice(
    reconciliationId: string,
    invoiceNumber: string,
    vendor: string,
    amount: number,
    dueDate: Date,
  ): Invoice | null {
    const reconciliation = this.reconciliations.get(reconciliationId);
    if (!reconciliation) return null;

    const invoice: Invoice = {
      id: "invoice_" + Date.now(),
      invoiceNumber,
      vendor,
      amount,
      dueDate,
      status: "outstanding",
    };

    reconciliation.invoices.push(invoice);
    this.reconciliations.set(reconciliationId, reconciliation);
    return invoice;
  }

  recordPayment(
    reconciliationId: string,
    invoiceId: string,
    amount: number,
    method: string,
    referenceNumber: string,
  ): Payment | null {
    const reconciliation = this.reconciliations.get(reconciliationId);
    if (!reconciliation) return null;

    const invoice = reconciliation.invoices.find((i) => i.id === invoiceId);
    if (!invoice) return null;

    const payment: Payment = {
      id: "payment_" + Date.now(),
      invoiceId,
      amount,
      paymentDate: new Date(),
      method,
      referenceNumber,
    };

    invoice.paidDate = new Date();
    invoice.status = "paid";
    reconciliation.payments.push(payment);

    this.reconciliations.set(reconciliationId, reconciliation);
    logger.info({ type: "payment_recorded", paymentId: payment.id }, `Pago registrado: ${amount}`);
    return payment;
  }

  approveFinancialStatement(statementId: string): FinancialStatement | null {
    const statement = this.financialStatements.get(statementId);
    if (!statement) return null;

    statement.status = "approved";
    this.financialStatements.set(statementId, statement);
    return statement;
  }

  getStatistics(): Record<string, any> {
    const statements = Array.from(this.financialStatements.values());
    const reconciliations = Array.from(this.reconciliations.values());

    return {
      totalStatements: statements.length,
      statementsByStatus: {
        draft: statements.filter((s) => s.status === "draft").length,
        reviewed: statements.filter((s) => s.status === "reviewed").length,
        approved: statements.filter((s) => s.status === "approved").length,
      },
      totalBudgetAmount: statements.reduce((sum, s) => sum + s.totalBudget, 0),
      totalSpentAmount: statements.reduce((sum, s) => sum + s.totalSpent, 0),
      totalVariance: statements.reduce((sum, s) => sum + s.variance, 0),
      totalReconciliations: reconciliations.length,
      reconciliationsByStatus: {
        open: reconciliations.filter((r) => r.status === "open").length,
        inProgress: reconciliations.filter((r) => r.status === "in-progress").length,
        reconciled: reconciliations.filter((r) => r.status === "reconciled").length,
      },
    };
  }

  generateFinancialReport(): string {
    const stats = this.getStatistics();
    return `Financial Closure Report\nTotal Budget: ${stats.totalBudgetAmount}\nTotal Spent: ${stats.totalSpentAmount}\nVariance: ${stats.totalVariance}`;
  }
}

let globalFinancialClosureManager: FinancialClosureManager | null = null;

export function getFinancialClosureManager(): FinancialClosureManager {
  if (!globalFinancialClosureManager) {
    globalFinancialClosureManager = new FinancialClosureManager();
  }
  return globalFinancialClosureManager;
}

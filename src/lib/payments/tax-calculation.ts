/**
 * Tax Calculation & Compliance
 * Semana 34, Tarea 34.10: Cálculo de impuestos y cumplimiento
 */

import { logger } from '@/lib/monitoring'

export type TaxType = 'vat' | 'sales_tax' | 'gst' | 'iva' | 'other'
export type JurisdictionType = 'country' | 'state' | 'province' | 'city'

export interface TaxRule {
  id: string
  jurisdiction: string
  jurisdictionType: JurisdictionType
  taxType: TaxType
  rate: number // percentage
  applicableTo: string[] // product categories
  isActive: boolean
  startDate: Date
  endDate?: Date
}

export interface TaxCalculation {
  orderId: string
  subtotal: number
  taxableAmount: number
  taxAmount: number
  effectiveRate: number
  breakdown: Array<{
    taxType: TaxType
    jurisdiction: string
    rate: number
    amount: number
  }>
  timestamp: Date
}

export interface TaxReport {
  period: { from: Date; to: Date }
  jurisdiction: string
  totalGrossSales: number
  totalTaxableAmount: number
  totalTaxCollected: number
  averageRate: number
  byTaxType: Record<TaxType, number>
  status: 'draft' | 'filed' | 'audited'
}

export class TaxCalculator {
  private taxRules: Map<string, TaxRule[]> = new Map()
  private calculations: Map<string, TaxCalculation[]> = new Map()
  private reports: Map<string, TaxReport> = new Map()

  constructor() {
    this.initializeTaxRules()
    logger.debug({ type: 'tax_calculator_init' }, 'Tax Calculator inicializado')
  }

  private initializeTaxRules(): void {
    // IVA Argentina (21%)
    this.addTaxRule({
      id: 'iva_ar_21',
      jurisdiction: 'AR',
      jurisdictionType: 'country',
      taxType: 'iva',
      rate: 21,
      applicableTo: ['*'],
      isActive: true,
      startDate: new Date('2020-01-01'),
    })

    // VAT EU (varies by country - example: Spain 21%)
    this.addTaxRule({
      id: 'vat_es_21',
      jurisdiction: 'ES',
      jurisdictionType: 'country',
      taxType: 'vat',
      rate: 21,
      applicableTo: ['*'],
      isActive: true,
      startDate: new Date('2020-01-01'),
    })

    // Sales Tax USA (varies by state - example: California 8.625%)
    this.addTaxRule({
      id: 'sales_tax_ca',
      jurisdiction: 'US-CA',
      jurisdictionType: 'state',
      taxType: 'sales_tax',
      rate: 8.625,
      applicableTo: ['*'],
      isActive: true,
      startDate: new Date('2020-01-01'),
    })

    // GST Canada (5%)
    this.addTaxRule({
      id: 'gst_ca_5',
      jurisdiction: 'CA',
      jurisdictionType: 'country',
      taxType: 'gst',
      rate: 5,
      applicableTo: ['*'],
      isActive: true,
      startDate: new Date('2020-01-01'),
    })
  }

  addTaxRule(rule: TaxRule): void {
    const key = rule.jurisdiction
    const rules = this.taxRules.get(key) || []
    rules.push(rule)
    this.taxRules.set(key, rules)
  }

  calculateTax(
    orderId: string,
    subtotal: number,
    jurisdictions: Array<{ jurisdiction: string; proportion: number }>,
    productCategories: string[] = ['*'],
  ): TaxCalculation {
    const breakdown: TaxCalculation['breakdown'] = []
    let totalTax = 0

    jurisdictions.forEach(({ jurisdiction, proportion }) => {
      const rules = this.taxRules.get(jurisdiction) || []
      const applicableRules = rules.filter(
        (r) => r.isActive && (r.applicableTo.includes('*') || r.applicableTo.some((cat) => productCategories.includes(cat))),
      )

      applicableRules.forEach((rule) => {
        const jurisdictionAmount = subtotal * proportion
        const taxAmount = (jurisdictionAmount * rule.rate) / 100
        totalTax += taxAmount

        breakdown.push({
          taxType: rule.taxType,
          jurisdiction: rule.jurisdiction,
          rate: rule.rate,
          amount: Math.round(taxAmount * 100) / 100,
        })
      })
    })

    const calculation: TaxCalculation = {
      orderId,
      subtotal,
      taxableAmount: subtotal,
      taxAmount: Math.round(totalTax * 100) / 100,
      effectiveRate: subtotal > 0 ? (totalTax / subtotal) * 100 : 0,
      breakdown,
      timestamp: new Date(),
    }

    // Store calculation
    const calculations = this.calculations.get(orderId) || []
    calculations.push(calculation)
    this.calculations.set(orderId, calculations)

    return calculation
  }

  generateTaxReport(jurisdiction: string, from: Date, to: Date): TaxReport {
    let totalGrossSales = 0
    let totalTaxableAmount = 0
    let totalTaxCollected = 0
    const byTaxType: Record<TaxType, number> = {
      vat: 0,
      sales_tax: 0,
      gst: 0,
      iva: 0,
      other: 0,
    }

    Array.from(this.calculations.values())
      .flat()
      .filter((c) => c.timestamp >= from && c.timestamp <= to)
      .forEach((calc) => {
        totalGrossSales += calc.subtotal
        totalTaxableAmount += calc.taxableAmount
        totalTaxCollected += calc.taxAmount

        calc.breakdown.forEach((item) => {
          if (item.jurisdiction === jurisdiction) {
            byTaxType[item.taxType] += item.amount
          }
        })
      })

    const report: TaxReport = {
      period: { from, to },
      jurisdiction,
      totalGrossSales: Math.round(totalGrossSales * 100) / 100,
      totalTaxableAmount: Math.round(totalTaxableAmount * 100) / 100,
      totalTaxCollected: Math.round(totalTaxCollected * 100) / 100,
      averageRate: totalGrossSales > 0 ? (totalTaxCollected / totalGrossSales) * 100 : 0,
      byTaxType,
      status: 'draft',
    }

    this.reports.set(`${jurisdiction}_${from.toISOString()}`, report)

    logger.info(
      { type: 'tax_report_generated', jurisdiction, totalCollected: report.totalTaxCollected },
      `Reporte de impuestos generado`,
    )

    return report
  }

  isProductTaxable(productId: string, category: string, jurisdiction: string): boolean {
    const rules = this.taxRules.get(jurisdiction) || []
    return rules.some(
      (r) => r.isActive && (r.applicableTo.includes('*') || r.applicableTo.includes(category)),
    )
  }

  getTaxableJurisdictions(): string[] {
    return Array.from(this.taxRules.keys()).filter((j) => {
      const rules = this.taxRules.get(j) || []
      return rules.some((r) => r.isActive)
    })
  }

  updateTaxRate(jurisdiction: string, taxType: TaxType, newRate: number): void {
    const rules = this.taxRules.get(jurisdiction) || []
    const rule = rules.find((r) => r.taxType === taxType)

    if (rule) {
      rule.rate = newRate
      logger.info({ type: 'tax_rate_updated', jurisdiction, taxType, rate: newRate }, 'Tasa impositiva actualizada')
    }
  }

  getTaxCalculationHistory(orderId: string): TaxCalculation[] {
    return this.calculations.get(orderId) || []
  }

  estimateTax(amount: number, jurisdiction: string): number {
    const rules = this.taxRules.get(jurisdiction) || []
    const applicableRules = rules.filter((r) => r.isActive && r.applicableTo.includes('*'))

    const totalRate = applicableRules.reduce((sum, r) => sum + r.rate, 0)
    return (amount * totalRate) / 100
  }

  getComplianceStatus(jurisdiction: string): {
    isCompliant: boolean
    lastReport?: Date
    pendingReports: number
    issues: string[]
  } {
    const jurisdictionReports = Array.from(this.reports.values()).filter((r) => r.jurisdiction === jurisdiction)
    const lastReport = jurisdictionReports.sort((a, b) => b.period.to.getTime() - a.period.to.getTime())[0]

    const pendingReports = jurisdictionReports.filter((r) => r.status === 'draft').length
    const issues: string[] = []

    if (pendingReports > 3) {
      issues.push(`${pendingReports} reportes pendientes por enviar`)
    }

    return {
      isCompliant: pendingReports === 0 && issues.length === 0,
      lastReport: lastReport?.period.to,
      pendingReports,
      issues,
    }
  }
}

let globalTaxCalculator: TaxCalculator | null = null

export function initializeTaxCalculator(): TaxCalculator {
  if (!globalTaxCalculator) {
    globalTaxCalculator = new TaxCalculator()
  }
  return globalTaxCalculator
}

export function getTaxCalculator(): TaxCalculator {
  if (!globalTaxCalculator) {
    return initializeTaxCalculator()
  }
  return globalTaxCalculator
}

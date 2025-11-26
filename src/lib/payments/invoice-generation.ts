/**
 * Invoice Generation & Management
 * Semana 34, Tarea 34.5: Generación y gestión de facturas
 */

import { logger } from '@/lib/monitoring'

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'refunded'
export type InvoiceFormat = 'pdf' | 'html' | 'xml' | 'json'

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number // percentage
  taxRate: number // percentage
  total: number
}

export interface Invoice {
  id: string
  orderId: string
  customerId: string
  tenantId: string
  invoiceNumber: string
  issueDate: Date
  dueDate: Date
  status: InvoiceStatus
  currency: string
  items: InvoiceLineItem[]
  subtotal: number
  taxAmount: number
  discountAmount: number
  total: number
  notes?: string
  paidDate?: Date
  paidAmount?: number
  metadata: Record<string, any>
}

export interface InvoiceTemplate {
  id: string
  tenantId: string
  name: string
  logoUrl?: string
  companyName: string
  companyAddress: string
  companyTaxId?: string
  bankDetails?: string
  footerText?: string
  customCss?: string
}

export class InvoiceGenerator {
  private invoices: Map<string, Invoice> = new Map()
  private templates: Map<string, InvoiceTemplate> = new Map()
  private invoiceSequence: Map<string, number> = new Map() // tenant -> sequence

  constructor() {
    logger.debug({ type: 'invoice_generator_init' }, 'Invoice Generator inicializado')
  }

  createInvoiceTemplate(template: InvoiceTemplate): void {
    this.templates.set(template.id, template)
    logger.info({ type: 'template_created', templateId: template.id }, `Template de factura creado`)
  }

  generateInvoice(
    orderId: string,
    customerId: string,
    tenantId: string,
    items: InvoiceLineItem[],
    currency: string = 'USD',
    daysUntilDue: number = 30,
  ): Invoice {
    // Calcular totales
    const subtotal = items.reduce((sum, item) => sum + item.total, 0)
    const taxAmount = items.reduce((sum, item) => sum + (item.total * item.taxRate) / 100, 0)
    const discountAmount = items.reduce((sum, item) => sum + (item.total * item.discount) / 100, 0)
    const total = subtotal + taxAmount - discountAmount

    // Generar número de factura
    const sequence = (this.invoiceSequence.get(tenantId) || 0) + 1
    this.invoiceSequence.set(tenantId, sequence)
    const invoiceNumber = `INV-${tenantId.substring(0, 4)}-${sequence.toString().padStart(6, '0')}`

    const now = new Date()
    const dueDate = new Date(now)
    dueDate.setDate(dueDate.getDate() + daysUntilDue)

    const invoice: Invoice = {
      id: `inv_${Date.now()}_${Math.random()}`,
      orderId,
      customerId,
      tenantId,
      invoiceNumber,
      issueDate: now,
      dueDate,
      status: 'draft',
      currency,
      items,
      subtotal: Math.round(subtotal * 100) / 100,
      taxAmount: Math.round(taxAmount * 100) / 100,
      discountAmount: Math.round(discountAmount * 100) / 100,
      total: Math.round(total * 100) / 100,
      metadata: {},
    }

    this.invoices.set(invoice.id, invoice)
    logger.info({ type: 'invoice_generated', invoiceId: invoice.id, invoiceNumber }, `Factura generada: ${invoiceNumber}`)

    return invoice
  }

  sendInvoice(invoiceId: string, recipientEmail: string): void {
    const invoice = this.invoices.get(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    invoice.status = 'sent'
    logger.info({ type: 'invoice_sent', invoiceId, email: recipientEmail }, `Factura enviada a ${recipientEmail}`)
  }

  recordPayment(invoiceId: string, paidAmount: number): void {
    const invoice = this.invoices.get(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    invoice.paidDate = new Date()
    invoice.paidAmount = paidAmount
    invoice.status = paidAmount >= invoice.total ? 'paid' : 'draft'

    logger.info(
      { type: 'payment_recorded', invoiceId, paidAmount },
      `Pago registrado para factura ${invoice.invoiceNumber}`,
    )
  }

  exportInvoice(invoiceId: string, format: InvoiceFormat): string {
    const invoice = this.invoices.get(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    switch (format) {
      case 'json':
        return JSON.stringify(invoice, null, 2)
      case 'xml':
        return this.generateXML(invoice)
      case 'html':
        return this.generateHTML(invoice)
      case 'pdf':
        return `[PDF Binary Content for ${invoice.invoiceNumber}]`
      default:
        return ''
    }
  }

  private generateHTML(invoice: Invoice): string {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${invoice.invoiceNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; }
        .invoice-header { border-bottom: 2px solid #333; padding-bottom: 20px; }
        .invoice-body { margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        .total-row { font-weight: bold; }
        .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h1>Invoice ${invoice.invoiceNumber}</h1>
        <p>Issued: ${invoice.issueDate.toDateString()}</p>
        <p>Due: ${invoice.dueDate.toDateString()}</p>
      </div>
      <div class="invoice-body">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item) => `<tr><td>${item.description}</td><td>${item.quantity}</td><td>${item.unitPrice}</td><td>${item.total}</td></tr>`).join('')}
          </tbody>
        </table>
        <table style="margin-top: 20px; width: 300px; margin-left: auto;">
          <tr>
            <td>Subtotal:</td>
            <td>${invoice.subtotal}</td>
          </tr>
          <tr>
            <td>Tax:</td>
            <td>${invoice.taxAmount}</td>
          </tr>
          <tr class="total-row">
            <td>Total:</td>
            <td>${invoice.total} ${invoice.currency}</td>
          </tr>
        </table>
      </div>
      <div class="footer">
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
    `
  }

  private generateXML(invoice: Invoice): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <invoice>
      <id>${invoice.id}</id>
      <invoiceNumber>${invoice.invoiceNumber}</invoiceNumber>
      <orderId>${invoice.orderId}</orderId>
      <customerId>${invoice.customerId}</customerId>
      <issueDate>${invoice.issueDate.toISOString()}</issueDate>
      <dueDate>${invoice.dueDate.toISOString()}</dueDate>
      <status>${invoice.status}</status>
      <currency>${invoice.currency}</currency>
      <items>
        ${invoice.items.map((item) => `<item><description>${item.description}</description><quantity>${item.quantity}</quantity><unitPrice>${item.unitPrice}</unitPrice><total>${item.total}</total></item>`).join('')}
      </items>
      <subtotal>${invoice.subtotal}</subtotal>
      <taxAmount>${invoice.taxAmount}</taxAmount>
      <discountAmount>${invoice.discountAmount}</discountAmount>
      <total>${invoice.total}</total>
    </invoice>
    `
  }

  getInvoice(invoiceId: string): Invoice | null {
    return this.invoices.get(invoiceId) || null
  }

  getInvoicesByOrder(orderId: string): Invoice[] {
    return Array.from(this.invoices.values()).filter((i) => i.orderId === orderId)
  }

  getInvoicesByCustomer(customerId: string): Invoice[] {
    return Array.from(this.invoices.values()).filter((i) => i.customerId === customerId)
  }

  getOverdueInvoices(tenantId: string): Invoice[] {
    const now = new Date()
    return Array.from(this.invoices.values()).filter(
      (i) => i.tenantId === tenantId && i.dueDate < now && i.status !== 'paid',
    )
  }

  getInvoiceMetrics(tenantId: string): {
    totalInvoices: number
    totalAmount: number
    paidAmount: number
    outstandingAmount: number
    collectionRate: number
  } {
    const invoices = Array.from(this.invoices.values()).filter((i) => i.tenantId === tenantId)

    const totalAmount = invoices.reduce((sum, i) => sum + i.total, 0)
    const paidAmount = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.paidAmount || 0), 0)
    const outstandingAmount = totalAmount - paidAmount

    return {
      totalInvoices: invoices.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      paidAmount: Math.round(paidAmount * 100) / 100,
      outstandingAmount: Math.round(outstandingAmount * 100) / 100,
      collectionRate: totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0,
    }
  }
}

let globalInvoiceGenerator: InvoiceGenerator | null = null

export function initializeInvoiceGenerator(): InvoiceGenerator {
  if (!globalInvoiceGenerator) {
    globalInvoiceGenerator = new InvoiceGenerator()
  }
  return globalInvoiceGenerator
}

export function getInvoiceGenerator(): InvoiceGenerator {
  if (!globalInvoiceGenerator) {
    return initializeInvoiceGenerator()
  }
  return globalInvoiceGenerator
}

/**
 * Documentation Completeness Manager
 * Semana 49, Tarea 49.8: Documentation Completeness
 */

import { logger } from "@/lib/monitoring"

export interface DocumentationItem {
  id: string
  item: string
  category: string
  status: "documented" | "partial" | "missing"
  lastUpdated: Date
}

export interface DocumentationReport {
  id: string
  timestamp: Date
  items: DocumentationItem[]
  completenessPercentage: number
  missingItems: number
}

export class DocumentationCompletenessManager {
  private items: Map<string, DocumentationItem> = new Map()
  private reports: Map<string, DocumentationReport> = new Map()

  constructor() {
    logger.debug({ type: "doc_completeness_init" }, "Documentation Completeness Manager inicializado")
  }

  trackDocumentation(item: string, category: string, status: string = "partial"): DocumentationItem {
    const docItem: DocumentationItem = {
      id: `doc_${Date.now()}`,
      item,
      category,
      status: status as any,
      lastUpdated: new Date(),
    }
    this.items.set(docItem.id, docItem)
    logger.info({ type: "item_tracked" }, `${item}: ${status}`)
    return docItem
  }

  markAsDocumented(itemId: string): DocumentationItem | null {
    const item = this.items.get(itemId)
    if (!item) return null
    item.status = "documented"
    item.lastUpdated = new Date()
    logger.info({ type: "documented" }, item.item)
    return item
  }

  generateReport(): DocumentationReport {
    const allItems = Array.from(this.items.values())
    const documented = allItems.filter(i => i.status === "documented").length
    const completenessPercentage = (documented / allItems.length) * 100

    const report: DocumentationReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date(),
      items: allItems,
      completenessPercentage,
      missingItems: allItems.filter(i => i.status === "missing").length,
    }
    this.reports.set(report.id, report)
    logger.info({ type: "report_generated" }, `Completeness: ${completenessPercentage.toFixed(1)}%`)
    return report
  }

  getStatistics() {
    const allItems = Array.from(this.items.values())
    return {
      totalItems: allItems.length,
      documented: allItems.filter(i => i.status === "documented").length,
      missing: allItems.filter(i => i.status === "missing").length,
    }
  }
}

let globalDocCompletenessManager: DocumentationCompletenessManager | null = null

export function getDocumentationCompletenessManager(): DocumentationCompletenessManager {
  if (!globalDocCompletenessManager) {
    globalDocCompletenessManager = new DocumentationCompletenessManager()
  }
  return globalDocCompletenessManager
}

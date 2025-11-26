/**
 * Production Readiness Manager
 * Semana 47, Tarea 47.10: Production Readiness
 */

import { logger } from "@/lib/monitoring"

export interface ReadinessItem {
  id: string
  category: string
  requirement: string
  status: "pending" | "completed" | "blocked"
  owner?: string
  completedAt?: Date
}

export interface ReadinessChecklist {
  id: string
  version: string
  items: ReadinessItem[]
  completionPercentage: number
  readyForProduction: boolean
}

export class ProductionReadinessManager {
  private checklists: Map<string, ReadinessChecklist> = new Map()
  private items: Map<string, ReadinessItem> = new Map()

  constructor() {
    logger.debug({ type: "prod_readiness_init" }, "Production Readiness Manager inicializado")
  }

  createChecklist(version: string): ReadinessChecklist {
    const checklist: ReadinessChecklist = {
      id: `checklist_${Date.now()}`,
      version,
      items: [],
      completionPercentage: 0,
      readyForProduction: false,
    }
    this.checklists.set(checklist.id, checklist)
    logger.info({ type: "checklist_created" }, `Checklist: v${version}`)
    return checklist
  }

  addChecklistItem(checklistId: string, category: string, requirement: string): ReadinessItem {
    const item: ReadinessItem = {
      id: `item_${Date.now()}`,
      category,
      requirement,
      status: "pending",
    }
    this.items.set(item.id, item)
    const checklist = this.checklists.get(checklistId)
    if (checklist) {
      checklist.items.push(item)
    }
    logger.debug({ type: "item_added" }, `Item: ${requirement}`)
    return item
  }

  completeItem(itemId: string, owner?: string): ReadinessItem | null {
    const item = this.items.get(itemId)
    if (!item) return null
    item.status = "completed"
    item.completedAt = new Date()
    item.owner = owner
    logger.info({ type: "item_completed" }, "Item completado")
    return item
  }

  getChecklistStatus(checklistId: string): ReadinessChecklist | null {
    const checklist = this.checklists.get(checklistId)
    if (!checklist) return null

    const completed = checklist.items.filter(i => i.status === "completed").length
    checklist.completionPercentage = (completed / checklist.items.length) * 100
    checklist.readyForProduction = checklist.completionPercentage === 100

    return checklist
  }

  getStatistics() {
    const allItems = Array.from(this.items.values())
    return {
      totalChecklists: this.checklists.size,
      totalItems: allItems.length,
      completedItems: allItems.filter(i => i.status === "completed").length,
    }
  }
}

let globalProdReadinessManager: ProductionReadinessManager | null = null

export function getProductionReadinessManager(): ProductionReadinessManager {
  if (!globalProdReadinessManager) {
    globalProdReadinessManager = new ProductionReadinessManager()
  }
  return globalProdReadinessManager
}

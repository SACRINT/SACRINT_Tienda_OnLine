/**
 * Handoff Checklist Manager
 * Semana 48, Tarea 48.10: Handoff Checklist
 */

import { logger } from "@/lib/monitoring"

export interface HandoffItem {
  id: string
  category: string
  item: string
  owner: string
  dueDate: Date
  completed: boolean
  completedAt?: Date
  notes?: string
}

export interface HandoffChecklist {
  id: string
  version: string
  items: HandoffItem[]
  completionPercentage: number
  handoffDate?: Date
}

export class HandoffChecklistManager {
  private items: Map<string, HandoffItem> = new Map()
  private checklists: Map<string, HandoffChecklist> = new Map()

  constructor() {
    logger.debug({ type: "handoff_checklist_init" }, "Handoff Checklist Manager inicializado")
  }

  addChecklistItem(category: string, item: string, owner: string, daysToComplete: number = 7): HandoffItem {
    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + daysToComplete)

    const checklistItem: HandoffItem = {
      id: `item_${Date.now()}`,
      category,
      item,
      owner,
      dueDate,
      completed: false,
    }
    this.items.set(checklistItem.id, checklistItem)
    logger.info({ type: "item_added" }, `Handoff Item: ${item}`)
    return checklistItem
  }

  completeItem(itemId: string, notes?: string): HandoffItem | null {
    const item = this.items.get(itemId)
    if (\!item) return null
    item.completed = true
    item.completedAt = new Date()
    item.notes = notes
    logger.info({ type: "item_completed" }, "Item completado")
    return item
  }

  createHandoffChecklist(version: string): HandoffChecklist {
    const items = Array.from(this.items.values())
    const completed = items.filter(i => i.completed).length

    const checklist: HandoffChecklist = {
      id: `checklist_${Date.now()}`,
      version,
      items,
      completionPercentage: (completed / items.length) * 100,
    }

    if (checklist.completionPercentage === 100) {
      checklist.handoffDate = new Date()
    }

    this.checklists.set(checklist.id, checklist)
    logger.info({ type: "checklist_created" }, `Handoff v${version}: ${checklist.completionPercentage}%`)
    return checklist
  }

  getStatistics() {
    const allItems = Array.from(this.items.values())
    return {
      totalItems: allItems.length,
      completedItems: allItems.filter(i => i.completed).length,
      pendingItems: allItems.filter(i => \!i.completed).length,
      checklists: this.checklists.size,
    }
  }
}

let globalHandoffChecklistManager: HandoffChecklistManager | null = null

export function getHandoffChecklistManager(): HandoffChecklistManager {
  if (\!globalHandoffChecklistManager) {
    globalHandoffChecklistManager = new HandoffChecklistManager()
  }
  return globalHandoffChecklistManager
}

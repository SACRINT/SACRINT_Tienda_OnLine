/**
 * Team Collaboration Tools
 * Semana 40, Tarea 40.6: Team Collaboration Tools
 */

import { logger } from '@/lib/monitoring'

export interface Comment {
  id: string
  userId: string
  content: string
  createdAt: Date
  updatedAt?: Date
  resolved: boolean
}

export interface CollaborationItem {
  id: string
  type: 'task' | 'note' | 'alert' | 'discussion'
  title: string
  description: string
  assignedTo?: string
  status: 'open' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  comments: Comment[]
  createdBy: string
  createdAt: Date
}

export class CollaborationToolsManager {
  private items: Map<string, CollaborationItem> = new Map()
  private teamChannels: Map<string, string[]> = new Map() // channelId -> userIds

  constructor() {
    logger.debug({ type: 'collaboration_init' }, 'Collaboration Tools Manager inicializado')
  }

  /**
   * Crear item de colaboración
   */
  createItem(type: string, title: string, description: string, userId: string, assignedTo?: string): CollaborationItem {
    const item: CollaborationItem = {
      id: `item_${Date.now()}`,
      type: type as any,
      title,
      description,
      assignedTo,
      status: 'open',
      priority: 'medium',
      comments: [],
      createdBy: userId,
      createdAt: new Date(),
    }

    this.items.set(item.id, item)
    logger.debug({ type: 'collaboration_item_created', itemId: item.id }, `Item de colaboración creado`)

    return item
  }

  /**
   * Agregar comentario
   */
  addComment(itemId: string, userId: string, content: string): Comment | null {
    const item = this.items.get(itemId)
    if (!item) return null

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      userId,
      content,
      createdAt: new Date(),
      resolved: false,
    }

    item.comments.push(comment)
    logger.debug({ type: 'comment_added', itemId, commentId: comment.id }, `Comentario agregado`)

    return comment
  }

  /**
   * Actualizar estado
   */
  updateItemStatus(itemId: string, status: string): boolean {
    const item = this.items.get(itemId)
    if (!item) return false

    item.status = status as any
    logger.debug({ type: 'item_status_updated', itemId, status }, `Estado actualizado: ${status}`)

    return true
  }

  /**
   * Obtener items asignados al usuario
   */
  getUserItems(userId: string): CollaborationItem[] {
    return Array.from(this.items.values()).filter((item) => item.assignedTo === userId)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): { totalItems: number; openItems: number; completedItems: number; totalComments: number } {
    const items = Array.from(this.items.values())
    const totalComments = items.reduce((sum, item) => sum + item.comments.length, 0)

    return {
      totalItems: items.length,
      openItems: items.filter((i) => i.status === 'open').length,
      completedItems: items.filter((i) => i.status === 'completed').length,
      totalComments,
    }
  }
}

let globalCollaborationToolsManager: CollaborationToolsManager | null = null

export function initializeCollaborationToolsManager(): CollaborationToolsManager {
  if (!globalCollaborationToolsManager) {
    globalCollaborationToolsManager = new CollaborationToolsManager()
  }
  return globalCollaborationToolsManager
}

export function getCollaborationToolsManager(): CollaborationToolsManager {
  if (!globalCollaborationToolsManager) {
    return initializeCollaborationToolsManager()
  }
  return globalCollaborationToolsManager
}

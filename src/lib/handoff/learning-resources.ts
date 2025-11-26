/**
 * Learning Resources Manager
 * Semana 48, Tarea 48.9: Learning Resources Management
 */

import { logger } from "@/lib/monitoring"

export interface LearningResource {
  id: string
  title: string
  category: string
  type: "guide" | "tutorial" | "video" | "article" | "documentation"
  url?: string
  description: string
  difficulty: "beginner" | "intermediate" | "advanced"
  estimatedTime: number
}

export interface LearningPath {
  id: string
  name: string
  resources: LearningResource[]
  targetAudience: string
  createdAt: Date
}

export class LearningResourcesManager {
  private resources: Map<string, LearningResource> = new Map()
  private paths: Map<string, LearningPath> = new Map()

  constructor() {
    logger.debug({ type: "learning_init" }, "Learning Resources Manager inicializado")
  }

  addResource(title: string, category: string, type: string, description: string, difficulty: string, estimatedTime: number): LearningResource {
    const resource: LearningResource = {
      id: `resource_${Date.now()}`,
      title,
      category,
      type: type as any,
      description,
      difficulty: difficulty as any,
      estimatedTime,
    }
    this.resources.set(resource.id, resource)
    logger.info({ type: "resource_added" }, `Resource: ${title}`)
    return resource
  }

  createLearningPath(name: string, targetAudience: string, resourceIds: string[]): LearningPath {
    const path: LearningPath = {
      id: `path_${Date.now()}`,
      name,
      resources: resourceIds
        .map(id => this.resources.get(id))
        .filter((r): r is LearningResource => r !== undefined),
      targetAudience,
      createdAt: new Date(),
    }
    this.paths.set(path.id, path)
    logger.info({ type: "path_created" }, `Learning Path: ${name}`)
    return path
  }

  getStatistics() {
    return {
      totalResources: this.resources.size,
      learningPaths: this.paths.size,
      totalEstimatedTime: Array.from(this.resources.values()).reduce((sum, r) => sum + r.estimatedTime, 0),
    }
  }
}

let globalLearningResourcesManager: LearningResourcesManager | null = null

export function getLearningResourcesManager(): LearningResourcesManager {
  if (!globalLearningResourcesManager) {
    globalLearningResourcesManager = new LearningResourcesManager()
  }
  return globalLearningResourcesManager
}

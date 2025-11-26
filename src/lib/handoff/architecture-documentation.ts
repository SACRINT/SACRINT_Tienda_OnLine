/**
 * Architecture Documentation Manager
 * Semana 48, Tarea 48.3: Architecture Documentation
 */

import { logger } from "@/lib/monitoring"

export interface ArchitectureComponent {
  id: string
  name: string
  description: string
  responsibilities: string[]
  dependencies: string[]
  technology?: string
}

export interface ArchitectureDiagram {
  id: string
  title: string
  components: ArchitectureComponent[]
  layers: string[]
  createdAt: Date
}

export class ArchitectureDocumentationManager {
  private components: Map<string, ArchitectureComponent> = new Map()
  private diagrams: Map<string, ArchitectureDiagram> = new Map()

  constructor() {
    logger.debug({ type: "arch_doc_init" }, "Architecture Documentation Manager inicializado")
  }

  documentComponent(name: string, description: string, responsibilities: string[]): ArchitectureComponent {
    const component: ArchitectureComponent = {
      id: `comp_${Date.now()}`,
      name,
      description,
      responsibilities,
      dependencies: [],
    }
    this.components.set(component.id, component)
    logger.info({ type: "component_documented" }, `Component: ${name}`)
    return component
  }

  createArchitectureDiagram(title: string, layers: string[]): ArchitectureDiagram {
    const diagram: ArchitectureDiagram = {
      id: `diag_${Date.now()}`,
      title,
      components: Array.from(this.components.values()),
      layers,
      createdAt: new Date(),
    }
    this.diagrams.set(diagram.id, diagram)
    logger.info({ type: "diagram_created" }, `Diagrama: ${title}`)
    return diagram
  }

  getStatistics() {
    return {
      totalComponents: this.components.size,
      diagrams: this.diagrams.size,
    }
  }
}

let globalArchDocManager: ArchitectureDocumentationManager | null = null

export function getArchitectureDocumentationManager(): ArchitectureDocumentationManager {
  if (\!globalArchDocManager) {
    globalArchDocManager = new ArchitectureDocumentationManager()
  }
  return globalArchDocManager
}

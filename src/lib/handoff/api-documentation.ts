/**
 * API Documentation Manager
 * Semana 48, Tarea 48.2: API Documentation
 */

import { logger } from "@/lib/monitoring"

export interface APIEndpoint {
  id: string
  path: string
  method: string
  description: string
  parameters?: Record<string, any>
  responses?: Record<string, any>
  examples?: string[]
}

export interface APIDocumentation {
  id: string
  title: string
  version: string
  baseUrl: string
  endpoints: APIEndpoint[]
  generatedAt: Date
}

export class APIDocumentationManager {
  private endpoints: Map<string, APIEndpoint> = new Map()
  private documentations: Map<string, APIDocumentation> = new Map()

  constructor() {
    logger.debug({ type: "api_doc_init" }, "API Documentation Manager inicializado")
  }

  documentEndpoint(path: string, method: string, description: string): APIEndpoint {
    const endpoint: APIEndpoint = {
      id: `endpoint_${Date.now()}`,
      path,
      method,
      description,
      parameters: {},
      responses: {},
      examples: [],
    }
    this.endpoints.set(endpoint.id, endpoint)
    logger.info({ type: "endpoint_documented" }, `${method} ${path}`)
    return endpoint
  }

  generateAPIDocumentation(title: string, version: string, baseUrl: string): APIDocumentation {
    const doc: APIDocumentation = {
      id: `apidoc_${Date.now()}`,
      title,
      version,
      baseUrl,
      endpoints: Array.from(this.endpoints.values()),
      generatedAt: new Date(),
    }
    this.documentations.set(doc.id, doc)
    logger.info({ type: "api_doc_generated" }, `API Doc: ${title} v${version}`)
    return doc
  }

  getStatistics() {
    return {
      totalEndpoints: this.endpoints.size,
      documentations: this.documentations.size,
    }
  }
}

let globalAPIDocManager: APIDocumentationManager | null = null

export function getAPIDocumentationManager(): APIDocumentationManager {
  if (\!globalAPIDocManager) {
    globalAPIDocManager = new APIDocumentationManager()
  }
  return globalAPIDocManager
}

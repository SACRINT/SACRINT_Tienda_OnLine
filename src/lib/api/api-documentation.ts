/**
 * API Documentation & OpenAPI Specs
 * Semana 38, Tarea 38.5: API Documentation & OpenAPI Specs
 */

import { logger } from '@/lib/monitoring'

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD'
export type DataType = 'string' | 'number' | 'boolean' | 'object' | 'array'

export interface OpenAPIParameter {
  name: string
  in: 'path' | 'query' | 'header' | 'cookie'
  required: boolean
  description?: string
  type: DataType
  example?: any
}

export interface OpenAPIProperty {
  type: DataType
  description?: string
  required?: boolean
  items?: OpenAPIProperty
  properties?: Record<string, OpenAPIProperty>
  example?: any
}

export interface OpenAPIResponse {
  statusCode: number
  description: string
  contentType: string
  schema?: Record<string, OpenAPIProperty>
  example?: any
}

export interface OpenAPIEndpoint {
  path: string
  method: HttpMethod
  summary: string
  description?: string
  tags?: string[]
  parameters?: OpenAPIParameter[]
  requestBody?: {
    required: boolean
    contentType: string
    schema: Record<string, OpenAPIProperty>
    example?: any
  }
  responses: OpenAPIResponse[]
  security?: string[]
  deprecated?: boolean
  rateLimit?: {
    requests: number
    windowMs: number
  }
}

export interface OpenAPISchema {
  openapi: string
  info: {
    title: string
    version: string
    description?: string
  }
  servers: Array<{
    url: string
    description?: string
  }>
  paths: Record<string, Record<string, any>>
  components?: {
    schemas?: Record<string, any>
    securitySchemes?: Record<string, any>
  }
  tags?: Array<{
    name: string
    description?: string
  }>
}

export class APIDocumentation {
  private endpoints: Map<string, OpenAPIEndpoint> = new Map()
  private schema: OpenAPISchema | null = null
  private tags: Set<string> = new Set()

  constructor(
    private apiTitle: string = 'API',
    private apiVersion: string = '1.0.0',
  ) {
    logger.debug({ type: 'api_documentation_init', apiTitle, apiVersion }, 'API Documentation inicializado')
  }

  /**
   * Agregar endpoint
   */
  addEndpoint(endpoint: OpenAPIEndpoint): void {
    try {
      const key = `${endpoint.method} ${endpoint.path}`
      this.endpoints.set(key, endpoint)

      if (endpoint.tags) {
        endpoint.tags.forEach((tag) => this.tags.add(tag))
      }

      logger.debug(
        { type: 'endpoint_added', method: endpoint.method, path: endpoint.path },
        `Endpoint documentado: ${key}`,
      )
    } catch (error) {
      logger.error({ type: 'endpoint_addition_error', error: String(error) }, 'Error al agregar endpoint')
    }
  }

  /**
   * Obtener endpoint
   */
  getEndpoint(method: HttpMethod, path: string): OpenAPIEndpoint | null {
    const key = `${method} ${path}`
    return this.endpoints.get(key) || null
  }

  /**
   * Obtener todos los endpoints
   */
  getAllEndpoints(): OpenAPIEndpoint[] {
    return Array.from(this.endpoints.values())
  }

  /**
   * Obtener endpoints por tag
   */
  getEndpointsByTag(tag: string): OpenAPIEndpoint[] {
    return Array.from(this.endpoints.values()).filter((ep) => ep.tags?.includes(tag))
  }

  /**
   * Generar OpenAPI Schema
   */
  generateOpenAPISchema(servers: Array<{ url: string; description?: string }> = []): OpenAPISchema {
    const paths: Record<string, Record<string, any>> = {}

    for (const endpoint of this.endpoints.values()) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {}
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.summary,
        description: endpoint.description,
        tags: endpoint.tags,
        parameters: endpoint.parameters,
        requestBody: endpoint.requestBody,
        responses: this.formatResponses(endpoint.responses),
        security: endpoint.security,
        deprecated: endpoint.deprecated,
        'x-rate-limit': endpoint.rateLimit,
      }
    }

    const tags = Array.from(this.tags).map((tag) => ({
      name: tag,
      description: `${tag} operations`,
    }))

    this.schema = {
      openapi: '3.0.0',
      info: {
        title: this.apiTitle,
        version: this.apiVersion,
      },
      servers: servers.length > 0 ? servers : [{ url: 'https://api.example.com', description: 'Production' }],
      paths,
      tags,
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
      },
    }

    logger.info(
      { type: 'openapi_schema_generated', endpointCount: this.endpoints.size },
      `Schema OpenAPI generado con ${this.endpoints.size} endpoints`,
    )

    return this.schema
  }

  /**
   * Formatear respuestas OpenAPI
   */
  private formatResponses(responses: OpenAPIResponse[]): Record<string, any> {
    const formatted: Record<string, any> = {}

    for (const response of responses) {
      formatted[response.statusCode] = {
        description: response.description,
        content:
          response.contentType && response.schema
            ? {
                [response.contentType]: {
                  schema: response.schema,
                  example: response.example,
                },
              }
            : undefined,
      }
    }

    return formatted
  }

  /**
   * Exportar como JSON
   */
  exportJSON(): string {
    const schema = this.schema || this.generateOpenAPISchema()
    return JSON.stringify(schema, null, 2)
  }

  /**
   * Exportar como YAML
   */
  exportYAML(): string {
    const schema = this.schema || this.generateOpenAPISchema()
    return this.jsonToYAML(schema)
  }

  /**
   * Convertir JSON a YAML
   */
  private jsonToYAML(obj: any, indent: number = 0): string {
    const spaces = ' '.repeat(indent)
    let yaml = ''

    if (typeof obj === 'string') {
      return `"${obj}"`
    }

    if (typeof obj === 'number' || typeof obj === 'boolean') {
      return String(obj)
    }

    if (Array.isArray(obj)) {
      for (const item of obj) {
        yaml += `\n${spaces}- ${this.jsonToYAML(item, indent + 2)}`
      }
      return yaml
    }

    if (typeof obj === 'object' && obj !== null) {
      for (const [key, value] of Object.entries(obj)) {
        yaml += `\n${spaces}${key}: ${this.jsonToYAML(value, indent + 2)}`
      }
      return yaml
    }

    return String(obj)
  }

  /**
   * Obtener Swagger UI HTML
   */
  getSwaggerUI(swaggerJsonUrl: string): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${this.apiTitle}</title>
        <meta charset="utf-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui.js"></script>
        <script>
          const ui = SwaggerUIBundle({
            url: "${swaggerJsonUrl}",
            dom_id: '#swagger-ui',
            presets: [SwaggerUIBundle.presets.apis, SwaggerUIBundle.SwaggerUIStandalonePreset],
            layout: "BaseLayout"
          })
        </script>
      </body>
    </html>
    `
  }

  /**
   * Validar endpoint contra schema
   */
  validateEndpoint(method: HttpMethod, path: string, requestBody?: any): { valid: boolean; errors: string[] } {
    const endpoint = this.getEndpoint(method, path)
    const errors: string[] = []

    if (!endpoint) {
      errors.push(`Endpoint no encontrado: ${method} ${path}`)
    } else {
      if (endpoint.requestBody && !requestBody) {
        errors.push('Request body requerido')
      }

      if (endpoint.requestBody && requestBody) {
        // Validar estructura básica
        const schema = endpoint.requestBody.schema
        const requiredFields = Object.entries(schema)
          .filter(([, prop]) => (prop as OpenAPIProperty).required)
          .map(([name]) => name)

        for (const field of requiredFields) {
          if (!(field in requestBody)) {
            errors.push(`Campo requerido faltante: ${field}`)
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Obtener estadísticas de documentación
   */
  getStats(): {
    totalEndpoints: number
    byMethod: Record<HttpMethod, number>
    byTag: Record<string, number>
    coverage: number
  } {
    const endpoints = Array.from(this.endpoints.values())
    const byMethod: Record<HttpMethod, number> = {} as Record<HttpMethod, number>
    const byTag: Record<string, number> = {}

    for (const endpoint of endpoints) {
      byMethod[endpoint.method] = (byMethod[endpoint.method] || 0) + 1

      if (endpoint.tags) {
        for (const tag of endpoint.tags) {
          byTag[tag] = (byTag[tag] || 0) + 1
        }
      }
    }

    return {
      totalEndpoints: endpoints.length,
      byMethod,
      byTag,
      coverage: 100, // Asumiendo documentación completa
    }
  }
}

let globalAPIDocumentation: APIDocumentation | null = null

export function initializeAPIDocumentation(title?: string, version?: string): APIDocumentation {
  if (!globalAPIDocumentation) {
    globalAPIDocumentation = new APIDocumentation(title, version)
  }
  return globalAPIDocumentation
}

export function getAPIDocumentation(): APIDocumentation {
  if (!globalAPIDocumentation) {
    return initializeAPIDocumentation()
  }
  return globalAPIDocumentation
}

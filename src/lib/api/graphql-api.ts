/**
 * GraphQL API Implementation
 * Semana 38, Tarea 38.3: GraphQL API Implementation
 */

import { logger } from '@/lib/monitoring'

export interface GraphQLQuery {
  id: string
  query: string
  variables?: Record<string, any>
  operationName?: string
}

export interface GraphQLResponse<T = any> {
  data?: T
  errors?: GraphQLError[]
  extensions?: Record<string, any>
}

export interface GraphQLError {
  message: string
  locations?: { line: number; column: number }[]
  path?: string[]
  extensions?: Record<string, any>
}

export interface GraphQLField {
  name: string
  type: string
  description?: string
  args?: GraphQLArgument[]
  resolve?: (parent: any, args: any) => any | Promise<any>
}

export interface GraphQLArgument {
  name: string
  type: string
  required: boolean
  defaultValue?: any
}

export interface GraphQLSchema {
  query: Record<string, GraphQLField>
  mutation?: Record<string, GraphQLField>
  subscription?: Record<string, GraphQLField>
  types?: Record<string, Record<string, GraphQLField>>
}

export interface QueryStats {
  totalQueries: number
  averageTime: number
  slowestQuery: string
  slowestTime: number
  errorRate: number
}

export class GraphQLAPI {
  private schema: GraphQLSchema | null = null
  private queries: Map<string, GraphQLQuery> = new Map()
  private queryMetrics: Map<string, { count: number; totalTime: number; errors: number }> = new Map()

  constructor() {
    logger.debug({ type: 'graphql_api_init' }, 'GraphQL API inicializado')
  }

  /**
   * Definir schema
   */
  defineSchema(schema: GraphQLSchema): void {
    try {
      this.schema = schema
      logger.info({ type: 'graphql_schema_defined' }, 'Schema GraphQL definido')
    } catch (error) {
      logger.error({ type: 'schema_definition_error', error: String(error) }, 'Error al definir schema')
      throw error
    }
  }

  /**
   * Ejecutar query
   */
  async executeQuery<T = any>(query: GraphQLQuery): Promise<GraphQLResponse<T>> {
    const startTime = Date.now()

    try {
      if (!this.schema) {
        return {
          errors: [{ message: 'Schema no definido' }],
        }
      }

      // Parsear y validar query
      const parsed = this.parseQuery(query.query)

      if (!parsed.valid) {
        return {
          errors: parsed.errors as GraphQLError[],
        }
      }

      // Resolver query
      const result = await this.resolveQuery(parsed.operation, query.variables || {})

      // Registrar métrica
      const duration = Date.now() - startTime
      this.recordMetric(query.query, duration, false)

      return {
        data: result as T,
        extensions: {
          duration,
        },
      }
    } catch (error) {
      const duration = Date.now() - startTime
      this.recordMetric(query.query, duration, true)

      logger.error({ type: 'graphql_execution_error', error: String(error) }, 'Error al ejecutar query')

      return {
        errors: [
          {
            message: 'Error al ejecutar query',
            extensions: { originalError: String(error) },
          },
        ],
      }
    }
  }

  /**
   * Parsear query
   */
  private parseQuery(
    query: string,
  ): {
    valid: boolean
    operation?: string
    errors?: GraphQLError[]
  } {
    try {
      // Validar que sea una query válida
      if (!query || query.trim().length === 0) {
        return {
          valid: false,
          errors: [{ message: 'Query vacía' }],
        }
      }

      // Validar sintaxis básica
      const hasQueryOrMutation = /^\s*(query|mutation|subscription)/i.test(query)
      if (!hasQueryOrMutation && !query.includes('{')) {
        return {
          valid: false,
          errors: [{ message: 'Sintaxis inválida' }],
        }
      }

      return {
        valid: true,
        operation: query,
      }
    } catch (error) {
      return {
        valid: false,
        errors: [{ message: `Error parsing: ${String(error)}` }],
      }
    }
  }

  /**
   * Resolver query
   */
  private async resolveQuery(operation: string, variables: Record<string, any>): Promise<any> {
    if (!this.schema) throw new Error('Schema no definido')

    // Determinar tipo de operación
    const isQuery = /^\s*query/i.test(operation)
    const isMutation = /^\s*mutation/i.test(operation)
    const isSubscription = /^\s*subscription/i.test(operation)

    const fields = isQuery ? this.schema.query : isMutation ? this.schema.mutation : this.schema.subscription

    if (!fields) {
      throw new Error(`Operación no soportada`)
    }

    // Extraer campos solicitados
    const requestedFields = this.extractFields(operation)

    const result: Record<string, any> = {}

    for (const field of requestedFields) {
      const resolver = fields[field]
      if (resolver && resolver.resolve) {
        result[field] = await resolver.resolve({}, variables)
      }
    }

    return result
  }

  /**
   * Extraer campos de query
   */
  private extractFields(query: string): string[] {
    const matches = query.match(/{\s*([^}]+)\s*}/g)
    if (!matches) return []

    const fields: string[] = []
    for (const match of matches) {
      const content = match.replace(/{|}/g, '').trim()
      const fieldNames = content.split(/[\n,\s]+/).filter((f) => f && !f.includes('('))
      fields.push(...fieldNames)
    }

    return Array.from(new Set(fields))
  }

  /**
   * Registrar métrica
   */
  private recordMetric(query: string, duration: number, error: boolean): void {
    const queryHash = this.hashQuery(query)
    const current = this.queryMetrics.get(queryHash) || { count: 0, totalTime: 0, errors: 0 }

    current.count++
    current.totalTime += duration
    if (error) current.errors++

    this.queryMetrics.set(queryHash, current)
  }

  /**
   * Hash de query
   */
  private hashQuery(query: string): string {
    return query.substring(0, 50)
  }

  /**
   * Obtener estadísticas
   */
  getStats(): QueryStats {
    const metrics = Array.from(this.queryMetrics.values())

    if (metrics.length === 0) {
      return {
        totalQueries: 0,
        averageTime: 0,
        slowestQuery: '',
        slowestTime: 0,
        errorRate: 0,
      }
    }

    const totalQueries = metrics.reduce((sum, m) => sum + m.count, 0)
    const totalTime = metrics.reduce((sum, m) => sum + m.totalTime, 0)
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors, 0)

    let slowest = metrics[0]
    for (const metric of metrics) {
      const avgMetric = metric.totalTime / metric.count
      const avgSlowest = slowest.totalTime / slowest.count
      if (avgMetric > avgSlowest) {
        slowest = metric
      }
    }

    return {
      totalQueries,
      averageTime: Math.round(totalTime / totalQueries),
      slowestQuery: this.queryMetrics.entries().next().value?.[0] || '',
      slowestTime: slowest.totalTime / slowest.count,
      errorRate: totalErrors > 0 ? Math.round((totalErrors / totalQueries) * 100) : 0,
    }
  }

  /**
   * Introspection - Obtener schema info
   */
  introspect(): any {
    if (!this.schema) {
      return null
    }

    return {
      queryType: Object.keys(this.schema.query || {}),
      mutationType: Object.keys(this.schema.mutation || {}),
      subscriptionType: Object.keys(this.schema.subscription || {}),
      types: Object.keys(this.schema.types || {}),
    }
  }

  /**
   * Validar query contra schema
   */
  validateQuery(query: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Validar sintaxis básica
    if (!query.includes('{')) {
      errors.push('Query debe contener campos')
    }

    // Validar campos si schema existe
    if (this.schema) {
      const fields = this.extractFields(query)
      const queryFields = Object.keys(this.schema.query || {})

      for (const field of fields) {
        if (!queryFields.includes(field)) {
          errors.push(`Campo no conocido: ${field}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Agregar field resolver
   */
  addFieldResolver(typeName: string, fieldName: string, resolver: (parent: any, args: any) => any | Promise<any>): void {
    if (!this.schema) return

    if (typeName === 'Query') {
      if (this.schema.query[fieldName]) {
        this.schema.query[fieldName].resolve = resolver
      }
    } else if (typeName === 'Mutation') {
      if (this.schema.mutation && this.schema.mutation[fieldName]) {
        this.schema.mutation[fieldName].resolve = resolver
      }
    }

    logger.info({ type: 'field_resolver_added', typeName, fieldName }, 'Field resolver agregado')
  }
}

let globalGraphQLAPI: GraphQLAPI | null = null

export function initializeGraphQLAPI(): GraphQLAPI {
  if (!globalGraphQLAPI) {
    globalGraphQLAPI = new GraphQLAPI()
  }
  return globalGraphQLAPI
}

export function getGraphQLAPI(): GraphQLAPI {
  if (!globalGraphQLAPI) {
    return initializeGraphQLAPI()
  }
  return globalGraphQLAPI
}

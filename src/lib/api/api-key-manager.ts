/**
 * API Keys & Access Control
 * Semana 38, Tarea 38.9: API Keys & Access Control
 */

import { logger } from '@/lib/monitoring'
import crypto from 'crypto'

export interface APIKey {
  id: string
  userId: string
  name: string
  keyHash: string // Hashed key for security
  displayKey: string // First 8 + last 4 chars for display
  scopes: string[]
  rateLimit?: {
    requests: number
    windowMs: number
  }
  ipWhitelist?: string[]
  expiresAt?: Date
  lastUsedAt?: Date
  active: boolean
  createdAt: Date
}

export interface AccessToken {
  id: string
  userId: string
  apiKeyId: string
  token: string
  expiresAt: Date
  createdAt: Date
  ipAddress?: string
  userAgent?: string
}

export interface APIKeyScope {
  name: string
  description: string
  category: 'read' | 'write' | 'admin'
}

export interface AccessControl {
  apiKeyId: string
  resource: string
  action: 'read' | 'write' | 'delete' | 'admin'
  allowed: boolean
}

export class APIKeyManager {
  private apiKeys: Map<string, APIKey> = new Map()
  private accessTokens: Map<string, AccessToken> = new Map()
  private scopes: Map<string, APIKeyScope> = new Map()
  private accessControls: Map<string, AccessControl[]> = new Map()

  constructor() {
    logger.debug({ type: 'api_key_manager_init' }, 'API Key Manager inicializado')
    this.initializeDefaultScopes()
  }

  /**
   * Inicializar scopes por defecto
   */
  private initializeDefaultScopes(): void {
    const defaultScopes: APIKeyScope[] = [
      { name: 'products:read', description: 'Read products', category: 'read' },
      { name: 'products:write', description: 'Create/update products', category: 'write' },
      { name: 'orders:read', description: 'Read orders', category: 'read' },
      { name: 'orders:write', description: 'Create/update orders', category: 'write' },
      { name: 'customers:read', description: 'Read customers', category: 'read' },
      { name: 'customers:write', description: 'Create/update customers', category: 'write' },
      { name: 'analytics:read', description: 'Read analytics', category: 'read' },
      { name: 'webhooks:manage', description: 'Manage webhooks', category: 'admin' },
    ]

    for (const scope of defaultScopes) {
      this.scopes.set(scope.name, scope)
    }
  }

  /**
   * Crear API Key
   */
  createAPIKey(
    userId: string,
    name: string,
    scopes: string[],
    expiresAt?: Date,
  ): { apiKey: APIKey; rawKey: string } {
    try {
      const rawKey = crypto.randomBytes(32).toString('hex')
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

      const displayKey = `${rawKey.substring(0, 8)}...${rawKey.substring(rawKey.length - 4)}`

      const apiKey: APIKey = {
        id: `key_${Date.now()}_${Math.random()}`,
        userId,
        name,
        keyHash,
        displayKey,
        scopes,
        expiresAt,
        active: true,
        createdAt: new Date(),
      }

      this.apiKeys.set(apiKey.id, apiKey)

      logger.info(
        { type: 'api_key_created', apiKeyId: apiKey.id, userId, name, scopeCount: scopes.length },
        `API Key creada: ${apiKey.id}`,
      )

      return { apiKey, rawKey }
    } catch (error) {
      logger.error({ type: 'api_key_creation_error', userId, error: String(error) }, 'Error al crear API Key')
      throw error
    }
  }

  /**
   * Validar API Key
   */
  validateAPIKey(rawKey: string): APIKey | null {
    try {
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

      for (const apiKey of this.apiKeys.values()) {
        if (apiKey.keyHash === keyHash && apiKey.active) {
          // Verificar expiration
          if (apiKey.expiresAt && new Date() > apiKey.expiresAt) {
            logger.warn({ type: 'api_key_expired', apiKeyId: apiKey.id }, `API Key expirada: ${apiKey.id}`)
            return null
          }

          apiKey.lastUsedAt = new Date()
          return apiKey
        }
      }

      return null
    } catch (error) {
      logger.error({ type: 'api_key_validation_error', error: String(error) }, 'Error al validar API Key')
      return null
    }
  }

  /**
   * Obtener API Key
   */
  getAPIKey(apiKeyId: string): APIKey | null {
    return this.apiKeys.get(apiKeyId) || null
  }

  /**
   * Obtener API Keys del usuario
   */
  getUserAPIKeys(userId: string): APIKey[] {
    return Array.from(this.apiKeys.values()).filter((key) => key.userId === userId)
  }

  /**
   * Revocar API Key
   */
  revokeAPIKey(apiKeyId: string): boolean {
    try {
      const apiKey = this.apiKeys.get(apiKeyId)
      if (!apiKey) return false

      apiKey.active = false
      logger.info({ type: 'api_key_revoked', apiKeyId }, `API Key revocada: ${apiKeyId}`)

      return true
    } catch (error) {
      logger.error({ type: 'api_key_revocation_error', apiKeyId, error: String(error) }, 'Error al revocar API Key')
      return false
    }
  }

  /**
   * Crear token de acceso
   */
  createAccessToken(apiKeyId: string, expiresIn: number = 3600): AccessToken {
    try {
      const apiKey = this.getAPIKey(apiKeyId)
      if (!apiKey) {
        throw new Error('API Key no encontrada')
      }

      const token = crypto.randomBytes(32).toString('hex')

      const accessToken: AccessToken = {
        id: `token_${Date.now()}_${Math.random()}`,
        userId: apiKey.userId,
        apiKeyId,
        token,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        createdAt: new Date(),
      }

      this.accessTokens.set(accessToken.id, accessToken)

      logger.info({ type: 'access_token_created', tokenId: accessToken.id, apiKeyId }, `Access Token creado: ${accessToken.id}`)

      return accessToken
    } catch (error) {
      logger.error({ type: 'access_token_creation_error', apiKeyId, error: String(error) }, 'Error al crear Access Token')
      throw error
    }
  }

  /**
   * Validar token de acceso
   */
  validateAccessToken(token: string): AccessToken | null {
    for (const accessToken of this.accessTokens.values()) {
      if (accessToken.token === token) {
        if (new Date() > accessToken.expiresAt) {
          return null
        }
        return accessToken
      }
    }
    return null
  }

  /**
   * Verificar permiso
   */
  checkPermission(apiKeyId: string, resource: string, action: 'read' | 'write' | 'delete' | 'admin'): boolean {
    const apiKey = this.getAPIKey(apiKeyId)
    if (!apiKey) return false

    // Verificar si el scope requerido está en la lista de scopes
    const requiredScope = `${resource}:${action}`
    const adminScope = `${resource}:admin`

    return apiKey.scopes.includes(requiredScope) || apiKey.scopes.includes(adminScope) || apiKey.scopes.includes('*')
  }

  /**
   * Establecer control de acceso
   */
  setAccessControl(apiKeyId: string, resource: string, action: string, allowed: boolean): void {
    try {
      const key = `${apiKeyId}:${resource}`
      const controls = this.accessControls.get(key) || []

      const existing = controls.find((c) => c.action === action)
      if (existing) {
        existing.allowed = allowed
      } else {
        controls.push({
          apiKeyId,
          resource,
          action: action as any,
          allowed,
        })
      }

      this.accessControls.set(key, controls)

      logger.info(
        { type: 'access_control_set', apiKeyId, resource, action, allowed },
        `Control de acceso establecido: ${apiKeyId} - ${resource} - ${action}`,
      )
    } catch (error) {
      logger.error({ type: 'access_control_error', apiKeyId, error: String(error) }, 'Error al establecer control de acceso')
    }
  }

  /**
   * Obtener control de acceso
   */
  getAccessControl(apiKeyId: string, resource: string): AccessControl[] {
    const key = `${apiKeyId}:${resource}`
    return this.accessControls.get(key) || []
  }

  /**
   * Obtener scopes disponibles
   */
  getAvailableScopes(): APIKeyScope[] {
    return Array.from(this.scopes.values())
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalAPIKeys: number
    activeAPIKeys: number
    revokedAPIKeys: number
    totalAccessTokens: number
    expiredTokens: number
  } {
    const apiKeys = Array.from(this.apiKeys.values())
    const accessTokens = Array.from(this.accessTokens.values())
    const now = new Date()

    return {
      totalAPIKeys: apiKeys.length,
      activeAPIKeys: apiKeys.filter((k) => k.active).length,
      revokedAPIKeys: apiKeys.filter((k) => !k.active).length,
      totalAccessTokens: accessTokens.length,
      expiredTokens: accessTokens.filter((t) => t.expiresAt < now).length,
    }
  }

  /**
   * Limpiar tokens expirados
   */
  cleanupExpiredTokens(): number {
    const now = new Date()
    let cleaned = 0

    for (const [id, token] of this.accessTokens) {
      if (token.expiresAt < now) {
        this.accessTokens.delete(id)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.info({ type: 'expired_tokens_cleaned', count: cleaned }, `${cleaned} tokens expirados limpiados`)
    }

    return cleaned
  }
}

let globalAPIKeyManager: APIKeyManager | null = null

export function initializeAPIKeyManager(): APIKeyManager {
  if (!globalAPIKeyManager) {
    globalAPIKeyManager = new APIKeyManager()
  }
  return globalAPIKeyManager
}

export function getAPIKeyManager(): APIKeyManager {
  if (!globalAPIKeyManager) {
    return initializeAPIKeyManager()
  }
  return globalAPIKeyManager
}

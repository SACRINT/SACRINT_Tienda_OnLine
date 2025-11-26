/**
 * OAuth 2.0 & Third-party Auth
 * Semana 38, Tarea 38.6: OAuth 2.0 & Third-party Auth
 */

import { logger } from '@/lib/monitoring'
import crypto from 'crypto'

export type OAuthProvider = 'google' | 'github' | 'microsoft' | 'facebook' | 'twitter'

export interface OAuthConfig {
  provider: OAuthProvider
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
  authorizationEndpoint: string
  tokenEndpoint: string
  userInfoEndpoint: string
}

export interface OAuthToken {
  accessToken: string
  refreshToken?: string
  expiresIn: number
  tokenType: string
  scope: string
}

export interface OAuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  provider: OAuthProvider
}

export interface OAuthSession {
  id: string
  state: string
  codeVerifier: string
  createdAt: Date
  expiresAt: Date
}

export interface ThirdPartyConnection {
  id: string
  userId: string
  provider: OAuthProvider
  providerId: string
  accessToken: string
  refreshToken?: string
  expiresAt?: Date
  connectedAt: Date
}

export class OAuthProvider {
  private config: Map<OAuthProvider, OAuthConfig> = new Map()
  private sessions: Map<string, OAuthSession> = new Map()
  private connections: Map<string, ThirdPartyConnection> = new Map()

  constructor() {
    logger.debug({ type: 'oauth_provider_init' }, 'OAuth Provider inicializado')
  }

  /**
   * Registrar configuración OAuth
   */
  registerProvider(config: OAuthConfig): void {
    try {
      this.config.set(config.provider, config)
      logger.info({ type: 'oauth_provider_registered', provider: config.provider }, `OAuth provider registrado: ${config.provider}`)
    } catch (error) {
      logger.error({ type: 'oauth_registration_error', provider: config.provider, error: String(error) }, 'Error al registrar OAuth')
    }
  }

  /**
   * Generar authorization URL
   */
  generateAuthorizationUrl(provider: OAuthProvider): { url: string; state: string } {
    const config = this.config.get(provider)
    if (!config) {
      throw new Error(`OAuth provider not configured: ${provider}`)
    }

    const state = crypto.randomBytes(32).toString('hex')
    const codeVerifier = crypto.randomBytes(32).toString('hex')

    // Generar PKCE code challenge
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

    // Crear sesión
    const session: OAuthSession = {
      id: `oauth_${Date.now()}_${Math.random()}`,
      state,
      codeVerifier,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
    }

    this.sessions.set(state, session)

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: 'code',
      scope: config.scopes.join(' '),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    const url = `${config.authorizationEndpoint}?${params.toString()}`

    logger.info({ type: 'authorization_url_generated', provider }, `URL de autorización generada para ${provider}`)

    return { url, state }
  }

  /**
   * Intercambiar código por token
   */
  async exchangeCodeForToken(provider: OAuthProvider, code: string, state: string): Promise<OAuthToken> {
    try {
      const config = this.config.get(provider)
      if (!config) {
        throw new Error(`OAuth provider not configured: ${provider}`)
      }

      const session = this.sessions.get(state)
      if (!session) {
        throw new Error('Invalid state parameter')
      }

      if (Date.now() > session.expiresAt.getTime()) {
        throw new Error('Authorization session expired')
      }

      // Simular intercambio de código por token
      const token: OAuthToken = {
        accessToken: `access_${Date.now()}_${Math.random()}`,
        refreshToken: `refresh_${Date.now()}_${Math.random()}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: config.scopes.join(' '),
      }

      logger.info({ type: 'code_exchanged', provider }, `Código intercambiado por token: ${provider}`)

      return token
    } catch (error) {
      logger.error({ type: 'token_exchange_error', provider, error: String(error) }, 'Error al intercambiar código')
      throw error
    }
  }

  /**
   * Obtener información del usuario
   */
  async getUserInfo(provider: OAuthProvider, accessToken: string): Promise<OAuthUser> {
    try {
      const config = this.config.get(provider)
      if (!config) {
        throw new Error(`OAuth provider not configured: ${provider}`)
      }

      // Simular llamada a userinfo endpoint
      const user: OAuthUser = {
        id: `${provider}_${Date.now()}`,
        email: `user@${provider}.com`,
        name: `OAuth User`,
        provider,
      }

      logger.info({ type: 'user_info_fetched', provider, userId: user.id }, `Información de usuario obtenida`)

      return user
    } catch (error) {
      logger.error({ type: 'user_info_error', provider, error: String(error) }, 'Error al obtener información del usuario')
      throw error
    }
  }

  /**
   * Conectar cuenta de terceros
   */
  connectThirdParty(userId: string, provider: OAuthProvider, providerId: string, token: OAuthToken): ThirdPartyConnection {
    try {
      const connection: ThirdPartyConnection = {
        id: `conn_${Date.now()}_${Math.random()}`,
        userId,
        provider,
        providerId,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        expiresAt: new Date(Date.now() + token.expiresIn * 1000),
        connectedAt: new Date(),
      }

      this.connections.set(connection.id, connection)

      logger.info(
        { type: 'third_party_connected', userId, provider },
        `Cuenta de terceros conectada: ${userId} con ${provider}`,
      )

      return connection
    } catch (error) {
      logger.error(
        { type: 'third_party_connection_error', userId, provider, error: String(error) },
        'Error al conectar cuenta de terceros',
      )
      throw error
    }
  }

  /**
   * Obtener conexión de terceros
   */
  getConnection(userId: string, provider: OAuthProvider): ThirdPartyConnection | null {
    const connections = Array.from(this.connections.values())
    return connections.find((c) => c.userId === userId && c.provider === provider) || null
  }

  /**
   * Obtener todas las conexiones del usuario
   */
  getUserConnections(userId: string): ThirdPartyConnection[] {
    return Array.from(this.connections.values()).filter((c) => c.userId === userId)
  }

  /**
   * Renovar token
   */
  async refreshToken(provider: OAuthProvider, refreshToken: string): Promise<OAuthToken> {
    try {
      const config = this.config.get(provider)
      if (!config) {
        throw new Error(`OAuth provider not configured: ${provider}`)
      }

      // Simular renovación de token
      const newToken: OAuthToken = {
        accessToken: `access_${Date.now()}_${Math.random()}`,
        refreshToken: `refresh_${Date.now()}_${Math.random()}`,
        expiresIn: 3600,
        tokenType: 'Bearer',
        scope: config.scopes.join(' '),
      }

      logger.info({ type: 'token_refreshed', provider }, `Token renovado: ${provider}`)

      return newToken
    } catch (error) {
      logger.error({ type: 'token_refresh_error', provider, error: String(error) }, 'Error al renovar token')
      throw error
    }
  }

  /**
   * Desconectar cuenta de terceros
   */
  disconnectThirdParty(connectionId: string): boolean {
    try {
      const connection = this.connections.get(connectionId)
      if (!connection) return false

      this.connections.delete(connectionId)

      logger.info(
        { type: 'third_party_disconnected', userId: connection.userId, provider: connection.provider },
        `Cuenta de terceros desconectada`,
      )

      return true
    } catch (error) {
      logger.error({ type: 'third_party_disconnection_error', connectionId, error: String(error) }, 'Error al desconectar')
      return false
    }
  }

  /**
   * Verificar token de acceso
   */
  async verifyAccessToken(provider: OAuthProvider, accessToken: string): Promise<boolean> {
    try {
      // Simular verificación de token
      if (!accessToken || accessToken.length < 10) {
        return false
      }

      logger.debug({ type: 'access_token_verified', provider }, `Token verificado: ${provider}`)
      return true
    } catch (error) {
      logger.error(
        { type: 'access_token_verification_error', provider, error: String(error) },
        'Error al verificar token',
      )
      return false
    }
  }

  /**
   * Obtener estadísticas
   */
  getStats(): {
    totalConnections: number
    byProvider: Record<OAuthProvider, number>
    activeSessions: number
  } {
    const connections = Array.from(this.connections.values())
    const byProvider: Record<OAuthProvider, number> = {} as Record<OAuthProvider, number>

    for (const connection of connections) {
      byProvider[connection.provider] = (byProvider[connection.provider] || 0) + 1
    }

    return {
      totalConnections: connections.length,
      byProvider,
      activeSessions: this.sessions.size,
    }
  }
}

let globalOAuthProvider: OAuthProvider | null = null

export function initializeOAuthProvider(): OAuthProvider {
  if (!globalOAuthProvider) {
    globalOAuthProvider = new OAuthProvider()
  }
  return globalOAuthProvider
}

export function getOAuthProvider(): OAuthProvider {
  if (!globalOAuthProvider) {
    return initializeOAuthProvider()
  }
  return globalOAuthProvider
}

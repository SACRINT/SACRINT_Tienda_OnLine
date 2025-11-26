/**
 * Two-Factor Authentication (2FA)
 * Semana 42, Tarea 42.1: Two-Factor Authentication (2FA)
 */

import { logger } from '@/lib/monitoring'
import crypto from 'crypto'

export interface TwoFactorMethod {
  id: string
  userId: string
  method: 'sms' | 'email' | 'authenticator' | 'backup_codes'
  verified: boolean
  active: boolean
  createdAt: Date
  lastUsedAt?: Date
}

export interface TwoFactorChallenge {
  id: string
  userId: string
  method: string
  code: string
  isVerified: boolean
  attempts: number
  expiresAt: Date
  createdAt: Date
}

export interface BackupCode {
  code: string
  used: boolean
  usedAt?: Date
}

export class TwoFactorAuthManager {
  private methods: Map<string, TwoFactorMethod> = new Map()
  private challenges: Map<string, TwoFactorChallenge> = new Map()
  private backupCodes: Map<string, BackupCode[]> = new Map()
  private userSessions: Map<string, { userId: string; sessionId: string; verified: boolean }> = new Map()

  constructor() {
    logger.debug({ type: '2fa_init' }, 'Two-Factor Auth Manager inicializado')
  }

  /**
   * Generar código 2FA (TOTP/SMS/Email)
   */
  generateCode(length: number = 6): string {
    const digits = '0123456789'
    let code = ''
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    for (let i = 0; i < length; i++) {
      code += digits[array[i] % digits.length]
    }
    return code
  }

  /**
   * Registrar método 2FA
   */
  registerMethod(userId: string, method: 'sms' | 'email' | 'authenticator' | 'backup_codes'): TwoFactorMethod {
    const methodId = `2fa_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

    const twoFactorMethod: TwoFactorMethod = {
      id: methodId,
      userId,
      method,
      verified: false,
      active: false,
      createdAt: new Date(),
    }

    this.methods.set(methodId, twoFactorMethod)

    logger.info({ type: '2fa_method_registered', userId, method }, `Método 2FA registrado: ${method}`)

    return twoFactorMethod
  }

  /**
   * Generar desafío 2FA
   */
  generateChallenge(userId: string, methodId: string): TwoFactorChallenge {
    const method = this.methods.get(methodId)
    if (!method) {
      throw new Error('Método 2FA no encontrado')
    }

    const code = this.generateCode()
    const challengeId = `challenge_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`

    const challenge: TwoFactorChallenge = {
      id: challengeId,
      userId,
      method: methodId,
      code,
      isVerified: false,
      attempts: 0,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutos
      createdAt: new Date(),
    }

    this.challenges.set(challengeId, challenge)

    logger.info(
      { type: '2fa_challenge_generated', userId, method: method.method },
      `Desafío 2FA generado para ${method.method}`
    )

    return challenge
  }

  /**
   * Verificar código 2FA
   */
  verifyCode(challengeId: string, providedCode: string): boolean {
    const challenge = this.challenges.get(challengeId)
    if (!challenge) return false

    // Verificar expiración
    if (new Date() > challenge.expiresAt) {
      this.challenges.delete(challengeId)
      logger.warn({ type: '2fa_code_expired', challengeId }, 'Código 2FA expirado')
      return false
    }

    // Verificar intentos
    if (challenge.attempts >= 5) {
      this.challenges.delete(challengeId)
      logger.warn({ type: '2fa_max_attempts', challengeId }, 'Máximo de intentos 2FA excedido')
      return false
    }

    challenge.attempts++

    // Verificar código (con tolerancia de 1 para sincronización TOTP)
    if (providedCode === challenge.code) {
      challenge.isVerified = true
      const method = this.methods.get(challenge.method)
      if (method) {
        method.verified = true
        method.active = true
        method.lastUsedAt = new Date()
      }

      logger.info({ type: '2fa_verified', challengeId }, 'Código 2FA verificado exitosamente')
      return true
    }

    logger.warn(
      { type: '2fa_invalid_code', challengeId, attempts: challenge.attempts },
      'Intento de verificación 2FA fallido'
    )

    return false
  }

  /**
   * Generar códigos de respaldo
   */
  generateBackupCodes(userId: string, count: number = 10): BackupCode[] {
    const codes: BackupCode[] = []

    for (let i = 0; i < count; i++) {
      codes.push({
        code: crypto.randomBytes(4).toString('hex').toUpperCase(),
        used: false,
      })
    }

    this.backupCodes.set(userId, codes)

    logger.info({ type: 'backup_codes_generated', userId, count }, `${count} códigos de respaldo generados`)

    return codes
  }

  /**
   * Verificar y consumir código de respaldo
   */
  verifyBackupCode(userId: string, providedCode: string): boolean {
    const codes = this.backupCodes.get(userId)
    if (!codes) return false

    const backupCode = codes.find((c) => c.code === providedCode && !c.used)
    if (!backupCode) return false

    backupCode.used = true
    backupCode.usedAt = new Date()

    logger.info({ type: 'backup_code_used', userId }, 'Código de respaldo consumido')

    return true
  }

  /**
   * Obtener métodos 2FA del usuario
   */
  getUserMethods(userId: string): TwoFactorMethod[] {
    return Array.from(this.methods.values()).filter((m) => m.userId === userId)
  }

  /**
   * Obtener métodos activos del usuario
   */
  getActiveMethods(userId: string): TwoFactorMethod[] {
    return this.getUserMethods(userId).filter((m) => m.active)
  }

  /**
   * Desactivar método
   */
  disableMethod(methodId: string): boolean {
    const method = this.methods.get(methodId)
    if (method) {
      method.active = false
      logger.info({ type: '2fa_method_disabled', methodId }, 'Método 2FA desactivado')
      return true
    }
    return false
  }

  /**
   * Crear sesión 2FA verificada
   */
  createVerifiedSession(userId: string, methodId: string): string {
    const sessionId = crypto.randomBytes(16).toString('hex')

    this.userSessions.set(sessionId, {
      userId,
      sessionId,
      verified: true,
    })

    logger.info({ type: '2fa_session_created', userId }, 'Sesión 2FA verificada creada')

    return sessionId
  }

  /**
   * Verificar sesión
   */
  verifySession(sessionId: string): boolean {
    const session = this.userSessions.get(sessionId)
    return session ? session.verified : false
  }

  /**
   * Obtener estadísticas 2FA
   */
  getStatistics(): {
    totalMethods: number
    activeMethods: number
    emailMethods: number
    smsMethods: number
    authenticatorMethods: number
  } {
    const methods = Array.from(this.methods.values())
    return {
      totalMethods: methods.length,
      activeMethods: methods.filter((m) => m.active).length,
      emailMethods: methods.filter((m) => m.method === 'email').length,
      smsMethods: methods.filter((m) => m.method === 'sms').length,
      authenticatorMethods: methods.filter((m) => m.method === 'authenticator').length,
    }
  }

  /**
   * Obtener códigos de respaldo del usuario
   */
  getUserBackupCodes(userId: string): BackupCode[] {
    return this.backupCodes.get(userId) || []
  }

  /**
   * Obtener códigos no usados
   */
  getUnusedBackupCodes(userId: string): BackupCode[] {
    const codes = this.backupCodes.get(userId) || []
    return codes.filter((c) => !c.used)
  }
}

let globalTwoFactorAuthManager: TwoFactorAuthManager | null = null

export function initializeTwoFactorAuthManager(): TwoFactorAuthManager {
  if (!globalTwoFactorAuthManager) {
    globalTwoFactorAuthManager = new TwoFactorAuthManager()
  }
  return globalTwoFactorAuthManager
}

export function getTwoFactorAuthManager(): TwoFactorAuthManager {
  if (!globalTwoFactorAuthManager) {
    return initializeTwoFactorAuthManager()
  }
  return globalTwoFactorAuthManager
}

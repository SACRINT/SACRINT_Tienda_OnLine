/**
 * Password Policy & Management
 * Semana 42, Tarea 42.9: Password Policy & Management
 */

import { logger } from '@/lib/monitoring'
import crypto from 'crypto'
import bcrypt from 'bcrypt'

export interface PasswordPolicy {
  minLength: number
  maxLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  specialChars: string
  expirationDays: number
  historyCount: number
  lockoutAttempts: number
  lockoutDurationMinutes: number
}

export interface UserPassword {
  userId: string
  hashedPassword: string
  createdAt: Date
  expiresAt: Date
  lastChanged: Date
}

export interface PasswordHistory {
  userId: string
  passwordHashes: string[]
  lastChanges: Date[]
}

export interface AccountLockout {
  userId: string
  lockedAt: Date
  unlocksAt: Date
  failedAttempts: number
}

export class PasswordPolicyManager {
  private policy: PasswordPolicy
  private userPasswords: Map<string, UserPassword> = new Map()
  private passwordHistories: Map<string, PasswordHistory> = new Map()
  private accountLockouts: Map<string, AccountLockout> = new Map()
  private failedAttempts: Map<string, number> = new Map()

  constructor() {
    this.policy = this.initializeDefaultPolicy()
    logger.debug({ type: 'password_policy_init' }, 'Password Policy Manager inicializado')
  }

  /**
   * Inicializar política por defecto
   */
  private initializeDefaultPolicy(): PasswordPolicy {
    return {
      minLength: 12,
      maxLength: 128,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      specialChars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      expirationDays: 90,
      historyCount: 5,
      lockoutAttempts: 5,
      lockoutDurationMinutes: 30,
    }
  }

  /**
   * Validar contraseña contra política
   */
  validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (password.length < this.policy.minLength) {
      errors.push(`Mínimo ${this.policy.minLength} caracteres`)
    }

    if (password.length > this.policy.maxLength) {
      errors.push(`Máximo ${this.policy.maxLength} caracteres`)
    }

    if (this.policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Debe contener mayúsculas')
    }

    if (this.policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Debe contener minúsculas')
    }

    if (this.policy.requireNumbers && !/[0-9]/.test(password)) {
      errors.push('Debe contener números')
    }

    if (this.policy.requireSpecialChars) {
      const specialCharsRegex = new RegExp(`[${this.policy.specialChars.replace(/[\[\]\\^-]/g, '\\$&')}]`)
      if (!specialCharsRegex.test(password)) {
        errors.push('Debe contener caracteres especiales')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }

  /**
   * Hash de contraseña con bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12
    return bcrypt.hash(password, saltRounds)
  }

  /**
   * Verificar contraseña
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash)
  }

  /**
   * Establecer contraseña de usuario
   */
  async setPassword(userId: string, password: string): Promise<UserPassword> {
    const validation = this.validatePassword(password)
    if (!validation.valid) {
      throw new Error(`Contraseña inválida: ${validation.errors.join(', ')}`)
    }

    const hashedPassword = await this.hashPassword(password)
    const now = new Date()

    const userPassword: UserPassword = {
      userId,
      hashedPassword,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.policy.expirationDays * 24 * 60 * 60 * 1000),
      lastChanged: now,
    }

    this.userPasswords.set(userId, userPassword)

    // Registrar en historial
    if (!this.passwordHistories.has(userId)) {
      this.passwordHistories.set(userId, {
        userId,
        passwordHashes: [],
        lastChanges: [],
      })
    }

    const history = this.passwordHistories.get(userId)!
    history.passwordHashes.push(hashedPassword)
    history.lastChanges.push(now)

    // Mantener solo las últimas N contraseñas
    if (history.passwordHashes.length > this.policy.historyCount) {
      history.passwordHashes.shift()
      history.lastChanges.shift()
    }

    logger.info({ type: 'password_set', userId }, 'Contraseña establecida para usuario')

    return userPassword
  }

  /**
   * Registrar intento fallido
   */
  recordFailedAttempt(userId: string): void {
    const attempts = (this.failedAttempts.get(userId) || 0) + 1
    this.failedAttempts.set(userId, attempts)

    if (attempts >= this.policy.lockoutAttempts) {
      this.lockAccount(userId)
    }

    logger.warn({ type: 'login_failed', userId, attempts }, `Intento de login fallido: ${attempts}`)
  }

  /**
   * Bloquear cuenta
   */
  lockAccount(userId: string): void {
    const now = new Date()
    const unlocksAt = new Date(now.getTime() + this.policy.lockoutDurationMinutes * 60 * 1000)

    this.accountLockouts.set(userId, {
      userId,
      lockedAt: now,
      unlocksAt,
      failedAttempts: this.failedAttempts.get(userId) || 0,
    })

    logger.warn({ type: 'account_locked', userId, duration: this.policy.lockoutDurationMinutes }, 'Cuenta bloqueada')
  }

  /**
   * Verificar si cuenta está bloqueada
   */
  isAccountLocked(userId: string): boolean {
    const lockout = this.accountLockouts.get(userId)
    if (!lockout) return false

    if (new Date() > lockout.unlocksAt) {
      this.accountLockouts.delete(userId)
      this.failedAttempts.delete(userId)
      logger.info({ type: 'account_unlocked', userId }, 'Cuenta desbloqueada automáticamente')
      return false
    }

    return true
  }

  /**
   * Restablecer intentos fallidos
   */
  resetFailedAttempts(userId: string): void {
    this.failedAttempts.delete(userId)
    logger.info({ type: 'failed_attempts_reset', userId }, 'Intentos fallidos restablecidos')
  }

  /**
   * Forzar cambio de contraseña
   */
  forcePasswordChange(userId: string): void {
    const userPassword = this.userPasswords.get(userId)
    if (userPassword) {
      userPassword.expiresAt = new Date()
      logger.info({ type: 'password_change_forced', userId }, 'Cambio de contraseña forzado')
    }
  }

  /**
   * Obtener contraseñas expiradas
   */
  getExpiredPasswords(): UserPassword[] {
    const now = new Date()
    return Array.from(this.userPasswords.values()).filter((p) => p.expiresAt <= now)
  }

  /**
   * Obtener contraseñas a punto de expirar
   */
  getExpiringPasswords(daysThreshold: number = 7): UserPassword[] {
    const threshold = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000)
    return Array.from(this.userPasswords.values()).filter((p) => p.expiresAt <= threshold && p.expiresAt > new Date())
  }

  /**
   * Verificar si contraseña es reutilizada
   */
  async isPasswordReused(userId: string, newPassword: string): Promise<boolean> {
    const history = this.passwordHistories.get(userId)
    if (!history) return false

    for (const oldHash of history.passwordHashes) {
      if (await this.verifyPassword(newPassword, oldHash)) {
        return true
      }
    }

    return false
  }

  /**
   * Generar contraseña temporal
   */
  generateTemporaryPassword(length: number = 12): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()'
    let password = ''
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)

    for (let i = 0; i < length; i++) {
      password += chars[array[i] % chars.length]
    }

    return password
  }

  /**
   * Obtener política actual
   */
  getPolicy(): PasswordPolicy {
    return this.policy
  }

  /**
   * Actualizar política
   */
  setPolicy(newPolicy: Partial<PasswordPolicy>): void {
    this.policy = { ...this.policy, ...newPolicy }
    logger.info({ type: 'password_policy_updated' }, 'Política de contraseñas actualizada')
  }

  /**
   * Generar reporte de políticas
   */
  generatePolicyReport(): string {
    const expiredPasswords = this.getExpiredPasswords()
    const expiringPasswords = this.getExpiringPasswords(7)
    const lockedAccounts = Array.from(this.accountLockouts.values())

    const report = `
=== REPORTE DE POLÍTICA DE CONTRASEÑAS ===

CONFIGURACIÓN:
- Longitud Mínima: ${this.policy.minLength}
- Longitud Máxima: ${this.policy.maxLength}
- Expiración: ${this.policy.expirationDays} días
- Historial: ${this.policy.historyCount} contraseñas
- Bloqueo: ${this.policy.lockoutAttempts} intentos por ${this.policy.lockoutDurationMinutes} minutos

ESTADO:
- Total de Usuarios: ${this.userPasswords.size}
- Contraseñas Expiradas: ${expiredPasswords.length}
- Contraseñas por Expirar (7 días): ${expiringPasswords.length}
- Cuentas Bloqueadas: ${lockedAccounts.length}

REQUISITOS:
- Mayúsculas: ${this.policy.requireUppercase ? 'Sí' : 'No'}
- Minúsculas: ${this.policy.requireLowercase ? 'Sí' : 'No'}
- Números: ${this.policy.requireNumbers ? 'Sí' : 'No'}
- Caracteres Especiales: ${this.policy.requireSpecialChars ? 'Sí' : 'No'}
    `

    logger.info({ type: 'policy_report_generated' }, 'Reporte de política generado')
    return report
  }
}

let globalPasswordPolicyManager: PasswordPolicyManager | null = null

export function initializePasswordPolicyManager(): PasswordPolicyManager {
  if (!globalPasswordPolicyManager) {
    globalPasswordPolicyManager = new PasswordPolicyManager()
  }
  return globalPasswordPolicyManager
}

export function getPasswordPolicyManager(): PasswordPolicyManager {
  if (!globalPasswordPolicyManager) {
    return initializePasswordPolicyManager()
  }
  return globalPasswordPolicyManager
}

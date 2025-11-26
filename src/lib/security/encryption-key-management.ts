/**
 * Data Encryption & Key Management
 * Semana 42, Tarea 42.3: Data Encryption & Key Management
 */

import { logger } from '@/lib/monitoring'
import crypto from 'crypto'

export interface EncryptionKey {
  id: string
  name: string
  algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305'
  key: Buffer
  iv?: Buffer
  salt: Buffer
  createdAt: Date
  rotatedAt?: Date
  expiresAt: Date
  isActive: boolean
}

export interface EncryptedData {
  id: string
  dataType: string
  encryptedValue: string
  keyId: string
  iv: string
  salt: string
  algorithm: string
  tag?: string
  createdAt: Date
}

export interface KeyRotationPolicy {
  id: string
  maxAgeMonths: number
  rotationSchedule: 'monthly' | 'quarterly' | 'annually'
  autoRotate: boolean
  notifyBefore: number // días antes de expiración
}

export class EncryptionKeyManager {
  private keys: Map<string, EncryptionKey> = new Map()
  private encryptedData: Map<string, EncryptedData> = new Map()
  private rotationPolicy: KeyRotationPolicy | null = null
  private masterKeyPath: string = '/secure/keys/master'

  constructor() {
    logger.debug({ type: 'encryption_init' }, 'Encryption & Key Management inicializado')
    this.initializeDefaultPolicy()
  }

  /**
   * Inicializar política por defecto
   */
  private initializeDefaultPolicy(): void {
    this.rotationPolicy = {
      id: `policy_${Date.now()}`,
      maxAgeMonths: 12,
      rotationSchedule: 'quarterly',
      autoRotate: true,
      notifyBefore: 30,
    }
  }

  /**
   * Generar nueva clave de encriptación
   */
  generateKey(name: string, algorithm: 'aes-256-gcm' | 'aes-256-cbc' | 'chacha20-poly1305' = 'aes-256-gcm'): EncryptionKey {
    const keyBuffer = crypto.randomBytes(32) // 256 bits
    const salt = crypto.randomBytes(16)
    const iv = crypto.randomBytes(16)

    const key: EncryptionKey = {
      id: `key_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      name,
      algorithm,
      key: keyBuffer,
      iv,
      salt,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000), // 12 meses
      isActive: true,
    }

    this.keys.set(key.id, key)

    logger.info(
      { type: 'encryption_key_generated', keyId: key.id, algorithm },
      `Clave de encriptación generada: ${name}`
    )

    return key
  }

  /**
   * Rotar clave
   */
  rotateKey(keyId: string): EncryptionKey | null {
    const oldKey = this.keys.get(keyId)
    if (!oldKey) return null

    const newKey = this.generateKey(`${oldKey.name}_rotated`)
    oldKey.isActive = false

    logger.warn({ type: 'key_rotated', oldKeyId: keyId, newKeyId: newKey.id }, 'Clave rotada exitosamente')

    return newKey
  }

  /**
   * Encriptar datos
   */
  encryptData(data: string, keyId: string, dataType: string = 'generic'): EncryptedData {
    const key = this.keys.get(keyId)
    if (!key) {
      throw new Error(`Clave no encontrada: ${keyId}`)
    }

    const iv = key.iv || crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(key.algorithm, key.key, iv)

    let encrypted = cipher.update(data, 'utf-8', 'hex')
    encrypted += cipher.final('hex')

    const tag = (cipher as any).getAuthTag?.()?.toString('hex')

    const encryptedDataRecord: EncryptedData = {
      id: `encrypted_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
      dataType,
      encryptedValue: encrypted,
      keyId,
      iv: iv.toString('hex'),
      salt: key.salt.toString('hex'),
      algorithm: key.algorithm,
      tag,
      createdAt: new Date(),
    }

    this.encryptedData.set(encryptedDataRecord.id, encryptedDataRecord)

    logger.debug({ type: 'data_encrypted', keyId, dataType }, 'Datos encriptados')

    return encryptedDataRecord
  }

  /**
   * Desencriptar datos
   */
  decryptData(encryptedDataId: string): string | null {
    const encryptedRecord = this.encryptedData.get(encryptedDataId)
    if (!encryptedRecord) {
      return null
    }

    const key = this.keys.get(encryptedRecord.keyId)
    if (!key) {
      logger.error(
        { type: 'decryption_failed', keyId: encryptedRecord.keyId },
        'Clave no encontrada para desencriptación'
      )
      return null
    }

    try {
      const iv = Buffer.from(encryptedRecord.iv, 'hex')
      const decipher = crypto.createDecipheriv(key.algorithm, key.key, iv)

      if (encryptedRecord.tag) {
        (decipher as any).setAuthTag(Buffer.from(encryptedRecord.tag, 'hex'))
      }

      let decrypted = decipher.update(encryptedRecord.encryptedValue, 'hex', 'utf-8')
      decrypted += decipher.final('utf-8')

      logger.debug({ type: 'data_decrypted', keyId: encryptedRecord.keyId }, 'Datos desencriptados')

      return decrypted
    } catch (error) {
      logger.error({ type: 'decryption_error', error: String(error) }, 'Error en desencriptación')
      return null
    }
  }

  /**
   * Obtener clave activa
   */
  getActiveKey(algorithm?: string): EncryptionKey | null {
    const keys = Array.from(this.keys.values()).filter((k) => k.isActive && (!algorithm || k.algorithm === algorithm))

    return keys.length > 0 ? keys[0] : null
  }

  /**
   * Obtener claves por expirar
   */
  getExpiringKeys(daysThreshold: number = 30): EncryptionKey[] {
    const threshold = new Date(Date.now() + daysThreshold * 24 * 60 * 60 * 1000)
    return Array.from(this.keys.values()).filter((k) => k.expiresAt <= threshold && k.isActive)
  }

  /**
   * Deriving keys from password
   */
  deriveKeyFromPassword(password: string, salt?: Buffer): Buffer {
    const actualSalt = salt || crypto.randomBytes(16)
    const iterations = 100000
    const keylen = 32
    const digest = 'sha256'

    return crypto.pbkdf2Sync(password, actualSalt, iterations, keylen, digest)
  }

  /**
   * Hash para verificación de integridad
   */
  hashData(data: string, algorithm: string = 'sha256'): string {
    return crypto.createHash(algorithm).update(data).digest('hex')
  }

  /**
   * Verificar integridad
   */
  verifyIntegrity(data: string, hash: string, algorithm: string = 'sha256'): boolean {
    const calculatedHash = this.hashData(data, algorithm)
    return calculatedHash === hash
  }

  /**
   * Generar firma digital
   */
  signData(data: string, keyId: string): string {
    const key = this.keys.get(keyId)
    if (!key) {
      throw new Error(`Clave no encontrada: ${keyId}`)
    }

    const hmac = crypto.createHmac('sha256', key.key)
    hmac.update(data)
    return hmac.digest('hex')
  }

  /**
   * Verificar firma digital
   */
  verifySignature(data: string, signature: string, keyId: string): boolean {
    const expectedSignature = this.signData(data, keyId)
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'))
  }

  /**
   * Obtener estadísticas de encriptación
   */
  getStatistics(): {
    totalKeys: number
    activeKeys: number
    totalEncryptedRecords: number
    keysByAlgorithm: Record<string, number>
    expiringKeys: number
  } {
    const keys = Array.from(this.keys.values())
    const algorithmStats: Record<string, number> = {}

    for (const key of keys) {
      algorithmStats[key.algorithm] = (algorithmStats[key.algorithm] || 0) + 1
    }

    return {
      totalKeys: keys.length,
      activeKeys: keys.filter((k) => k.isActive).length,
      totalEncryptedRecords: this.encryptedData.size,
      keysByAlgorithm: algorithmStats,
      expiringKeys: this.getExpiringKeys(30).length,
    }
  }

  /**
   * Generar reporte de encriptación
   */
  generateEncryptionReport(): string {
    const stats = this.getStatistics()
    const expiringKeys = this.getExpiringKeys(30)

    const report = `
=== REPORTE DE ENCRIPTACIÓN Y GESTIÓN DE CLAVES ===

ESTADÍSTICAS:
- Total de Claves: ${stats.totalKeys}
- Claves Activas: ${stats.activeKeys}
- Registros Encriptados: ${stats.totalEncryptedRecords}
- Claves por Expirar: ${stats.expiringKeys}

ALGORITMOS EN USO:
${Object.entries(stats.keysByAlgorithm)
  .map(([algo, count]) => `- ${algo}: ${count} claves`)
  .join('\n')}

CLAVES POR EXPIRAR (próximos 30 días):
${expiringKeys.length > 0 ? expiringKeys.map((k) => `- ${k.name}: ${k.expiresAt.toISOString()}`).join('\n') : '- Ninguna'}

POLÍTICA DE ROTACIÓN:
${this.rotationPolicy ? `- Frecuencia: ${this.rotationPolicy.rotationSchedule}
- Auto-rotación: ${this.rotationPolicy.autoRotate ? 'Habilitada' : 'Deshabilitada'}
- Notificar antes: ${this.rotationPolicy.notifyBefore} días` : '- No configurada'}
    `

    logger.info({ type: 'encryption_report_generated' }, 'Reporte de encriptación generado')
    return report
  }

  /**
   * Obtener política de rotación
   */
  getRotationPolicy(): KeyRotationPolicy | null {
    return this.rotationPolicy
  }

  /**
   * Actualizar política de rotación
   */
  setRotationPolicy(policy: KeyRotationPolicy): void {
    this.rotationPolicy = policy
    logger.info({ type: 'rotation_policy_updated' }, 'Política de rotación actualizada')
  }
}

let globalEncryptionKeyManager: EncryptionKeyManager | null = null

export function initializeEncryptionKeyManager(): EncryptionKeyManager {
  if (!globalEncryptionKeyManager) {
    globalEncryptionKeyManager = new EncryptionKeyManager()
  }
  return globalEncryptionKeyManager
}

export function getEncryptionKeyManager(): EncryptionKeyManager {
  if (!globalEncryptionKeyManager) {
    return initializeEncryptionKeyManager()
  }
  return globalEncryptionKeyManager
}

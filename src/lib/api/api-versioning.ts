/**
 * API Versioning & Deprecation
 * Semana 38, Tarea 38.12: API Versioning & Deprecation
 */

import { logger } from '@/lib/monitoring'

export interface APIVersion {
  version: string
  status: 'current' | 'deprecated' | 'retired'
  releaseDate: Date
  endOfLifeDate?: Date
  features?: string[]
  breaking?: string[]
  deprecated?: string[]
}

export interface DeprecationNotice {
  id: string
  endpoint: string
  version: string
  replacementEndpoint?: string
  deprecatedDate: Date
  sunsetDate: Date
  message: string
  documentation?: string
}

export interface APIRoute {
  path: string
  method: string
  version: string
  status: 'active' | 'deprecated' | 'removed'
  handler: string
}

export interface VersionedResponse {
  version: string
  timestamp: Date
  data: Record<string, any>
  deprecationWarning?: string
}

export interface MigrationGuide {
  id: string
  fromVersion: string
  toVersion: string
  title: string
  content: string
  codeExamples?: Record<string, string>
  createdAt: Date
}

export class APIVersioningManager {
  private versions: Map<string, APIVersion> = new Map()
  private routes: Map<string, APIRoute[]> = new Map()
  private deprecationNotices: Map<string, DeprecationNotice> = new Map()
  private migrationGuides: Map<string, MigrationGuide> = new Map()
  private currentVersion: string = '1.0.0'

  constructor() {
    logger.debug({ type: 'api_versioning_init' }, 'API Versioning Manager inicializado')
    this.initializeDefaultVersions()
  }

  /**
   * Inicializar versiones por defecto
   */
  private initializeDefaultVersions(): void {
    this.registerVersion({
      version: '1.0.0',
      status: 'current',
      releaseDate: new Date('2024-01-01'),
      features: ['Basic API', 'REST endpoints', 'Authentication'],
    })

    this.registerVersion({
      version: '0.9.0',
      status: 'deprecated',
      releaseDate: new Date('2023-06-01'),
      endOfLifeDate: new Date('2025-06-01'),
      features: ['Legacy API'],
      deprecated: ['Some old endpoints'],
    })
  }

  /**
   * Registrar versión
   */
  registerVersion(version: APIVersion): void {
    try {
      this.versions.set(version.version, version)

      logger.info(
        { type: 'api_version_registered', version: version.version, status: version.status },
        `Versión API registrada: ${version.version}`,
      )
    } catch (error) {
      logger.error({ type: 'version_registration_error', error: String(error) }, 'Error al registrar versión')
    }
  }

  /**
   * Establecer versión actual
   */
  setCurrentVersion(version: string): boolean {
    const apiVersion = this.versions.get(version)
    if (!apiVersion) {
      logger.warn({ type: 'version_not_found', version }, `Versión no encontrada: ${version}`)
      return false
    }

    this.currentVersion = version
    logger.info({ type: 'current_version_set', version }, `Versión actual establecida: ${version}`)

    return true
  }

  /**
   * Obtener versión actual
   */
  getCurrentVersion(): string {
    return this.currentVersion
  }

  /**
   * Obtener información de versión
   */
  getVersionInfo(version: string): APIVersion | null {
    return this.versions.get(version) || null
  }

  /**
   * Obtener todas las versiones
   */
  getAllVersions(): APIVersion[] {
    return Array.from(this.versions.values()).sort((a, b) => {
      const [aMajor, aMinor, aPatch] = a.version.split('.').map(Number)
      const [bMajor, bMinor, bPatch] = b.version.split('.').map(Number)

      if (aMajor !== bMajor) return bMajor - aMajor
      if (aMinor !== bMinor) return bMinor - aMinor
      return bPatch - aPatch
    })
  }

  /**
   * Registrar ruta API
   */
  registerRoute(route: APIRoute): void {
    try {
      const key = route.version
      const routes = this.routes.get(key) || []

      // Verificar si la ruta ya existe
      const existingIndex = routes.findIndex((r) => r.path === route.path && r.method === route.method)
      if (existingIndex >= 0) {
        routes[existingIndex] = route
      } else {
        routes.push(route)
      }

      this.routes.set(key, routes)

      logger.debug(
        { type: 'route_registered', path: route.path, method: route.method, version: route.version },
        `Ruta registrada: ${route.method} ${route.path} v${route.version}`,
      )
    } catch (error) {
      logger.error({ type: 'route_registration_error', error: String(error) }, 'Error al registrar ruta')
    }
  }

  /**
   * Obtener rutas de versión
   */
  getRoutesByVersion(version: string): APIRoute[] {
    return this.routes.get(version) || []
  }

  /**
   * Crear aviso de deprecación
   */
  createDeprecationNotice(endpoint: string, version: string, sunsetDate: Date, replacementEndpoint?: string): DeprecationNotice {
    try {
      const notice: DeprecationNotice = {
        id: `deprec_${Date.now()}_${Math.random()}`,
        endpoint,
        version,
        replacementEndpoint,
        deprecatedDate: new Date(),
        sunsetDate,
        message: `Endpoint ${endpoint} en versión ${version} está deprecado. Será removido el ${sunsetDate.toISOString()}.`,
      }

      this.deprecationNotices.set(notice.id, notice)

      logger.warn(
        { type: 'deprecation_notice_created', endpoint, version, sunsetDate },
        `Aviso de deprecación creado para ${endpoint}`,
      )

      return notice
    } catch (error) {
      logger.error({ type: 'deprecation_notice_error', error: String(error) }, 'Error al crear aviso de deprecación')
      throw error
    }
  }

  /**
   * Obtener avisos de deprecación para versión
   */
  getDeprecationNotices(version: string): DeprecationNotice[] {
    return Array.from(this.deprecationNotices.values()).filter((notice) => notice.version === version)
  }

  /**
   * Obtener avisos de deprecación activos
   */
  getActiveDeprecationNotices(): DeprecationNotice[] {
    const now = new Date()
    return Array.from(this.deprecationNotices.values()).filter((notice) => notice.deprecatedDate <= now && notice.sunsetDate > now)
  }

  /**
   * Crear guía de migración
   */
  createMigrationGuide(
    fromVersion: string,
    toVersion: string,
    title: string,
    content: string,
    codeExamples?: Record<string, string>,
  ): MigrationGuide {
    try {
      const guide: MigrationGuide = {
        id: `guide_${Date.now()}_${Math.random()}`,
        fromVersion,
        toVersion,
        title,
        content,
        codeExamples,
        createdAt: new Date(),
      }

      this.migrationGuides.set(guide.id, guide)

      logger.info(
        { type: 'migration_guide_created', fromVersion, toVersion, title },
        `Guía de migración creada: ${fromVersion} → ${toVersion}`,
      )

      return guide
    } catch (error) {
      logger.error({ type: 'migration_guide_error', error: String(error) }, 'Error al crear guía de migración')
      throw error
    }
  }

  /**
   * Obtener guía de migración
   */
  getMigrationGuide(fromVersion: string, toVersion: string): MigrationGuide | null {
    const guides = Array.from(this.migrationGuides.values()).filter(
      (g) => g.fromVersion === fromVersion && g.toVersion === toVersion,
    )

    return guides.length > 0 ? guides[0] : null
  }

  /**
   * Obtener todas las guías de migración
   */
  getAllMigrationGuides(): MigrationGuide[] {
    return Array.from(this.migrationGuides.values())
  }

  /**
   * Verificar compatibilidad de versión
   */
  isVersionSupported(version: string): boolean {
    const apiVersion = this.getVersionInfo(version)
    if (!apiVersion) return false

    if (apiVersion.status === 'retired') return false

    if (apiVersion.status === 'deprecated' && apiVersion.endOfLifeDate) {
      if (new Date() > apiVersion.endOfLifeDate) {
        return false
      }
    }

    return true
  }

  /**
   * Generar header de deprecación
   */
  getDeprecationHeader(version: string, endpoint: string): Record<string, string> | null {
    const notices = this.getDeprecationNotices(version).filter((n) => n.endpoint === endpoint)

    if (notices.length === 0) return null

    const notice = notices[0]
    const daysUntilSunset = Math.ceil((notice.sunsetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    const headers: Record<string, string> = {
      'Deprecation': 'true',
      'Sunset': notice.sunsetDate.toUTCString(),
      'Deprecation-Info': `Version ${version} will be discontinued in ${daysUntilSunset} days`,
    }

    if (notice.replacementEndpoint) {
      headers['Link'] = `<${notice.replacementEndpoint}>; rel="successor-version"`
    }

    return headers
  }

  /**
   * Crear respuesta versionada
   */
  createVersionedResponse(version: string, data: Record<string, any>): VersionedResponse {
    const response: VersionedResponse = {
      version,
      timestamp: new Date(),
      data,
    }

    // Agregar advertencia si está deprecado
    const apiVersion = this.getVersionInfo(version)
    if (apiVersion && apiVersion.status === 'deprecated' && apiVersion.endOfLifeDate) {
      const daysUntilEOL = Math.ceil((apiVersion.endOfLifeDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      response.deprecationWarning = `API version ${version} is deprecated and will be retired in ${daysUntilEOL} days`
    }

    return response
  }

  /**
   * Obtener estadísticas de versiones
   */
  getStats(): {
    totalVersions: number
    currentVersion: string
    deprecatedVersions: number
    retiredVersions: number
    activeDeprecationNotices: number
  } {
    const versions = Array.from(this.versions.values())
    const activeNotices = this.getActiveDeprecationNotices()

    return {
      totalVersions: versions.length,
      currentVersion: this.currentVersion,
      deprecatedVersions: versions.filter((v) => v.status === 'deprecated').length,
      retiredVersions: versions.filter((v) => v.status === 'retired').length,
      activeDeprecationNotices: activeNotices.length,
    }
  }

  /**
   * Generar reporte de versionado
   */
  generateVersioningReport(): string {
    const versions = this.getAllVersions()
    const activeNotices = this.getActiveDeprecationNotices()

    let report = `
╔════════════════════════════════════════════════════════════╗
║          API VERSIONING REPORT
╚════════════════════════════════════════════════════════════╝

Current Version: ${this.currentVersion}

API Versions:
${versions
  .map(
    (v) => `
  v${v.version} (${v.status})
  Released: ${v.releaseDate.toISOString().split('T')[0]}
  ${v.endOfLifeDate ? `End of Life: ${v.endOfLifeDate.toISOString().split('T')[0]}` : 'Ongoing'}
  `,
  )
  .join('')}

Active Deprecation Notices: ${activeNotices.length}
${activeNotices
  .map(
    (n) => `
  • ${n.endpoint} (v${n.version})
    Sunset: ${n.sunsetDate.toISOString().split('T')[0]}
    ${n.replacementEndpoint ? `Replacement: ${n.replacementEndpoint}` : ''}
  `,
  )
  .join('')}

════════════════════════════════════════════════════════════
    `

    return report
  }
}

let globalAPIVersioningManager: APIVersioningManager | null = null

export function initializeAPIVersioningManager(): APIVersioningManager {
  if (!globalAPIVersioningManager) {
    globalAPIVersioningManager = new APIVersioningManager()
  }
  return globalAPIVersioningManager
}

export function getAPIVersioningManager(): APIVersioningManager {
  if (!globalAPIVersioningManager) {
    return initializeAPIVersioningManager()
  }
  return globalAPIVersioningManager
}

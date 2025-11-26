/**
 * CDN Integration
 * Semana 43, Tarea 43.10: CDN Integration
 */

import { logger } from '@/lib/monitoring'

export interface CdnProvider {
  name: string
  endpoint: string
  apiKey: string
  isActive: boolean
}

export interface CdnAsset {
  id: string
  path: string
  provider: string
  url: string
  cacheControl: string
  ttl: number
  lastPurge?: Date
}

export interface CdnMetrics {
  provider: string
  cacheHitRate: number
  bandwidthSaved: number
  requestsServed: number
}

export class CdnIntegrationManager {
  private providers: Map<string, CdnProvider> = new Map()
  private assets: Map<string, CdnAsset> = new Map()
  private metrics: CdnMetrics[] = []

  constructor() {
    logger.debug({ type: 'cdn_integration_init' }, 'CDN Integration Manager inicializado')
  }

  /**
   * Registrar proveedor CDN
   */
  registerProvider(name: string, endpoint: string, apiKey: string): CdnProvider {
    const provider: CdnProvider = {
      name,
      endpoint,
      apiKey,
      isActive: true,
    }

    this.providers.set(name, provider)
    logger.info({ type: 'cdn_provider_registered', name }, `Proveedor CDN registrado: ${name}`)

    return provider
  }

  /**
   * Cargar asset en CDN
   */
  pushAssetToCdn(path: string, provider: string, cacheControl: string = 'public, max-age=31536000'): CdnAsset | null {
    const cdnProvider = this.providers.get(provider)
    if (!cdnProvider) return null

    const asset: CdnAsset = {
      id: `cdn_${Date.now()}`,
      path,
      provider,
      url: `${cdnProvider.endpoint}/${path}`,
      cacheControl,
      ttl: 31536000, // 1 año por defecto
      lastPurge: undefined,
    }

    this.assets.set(asset.id, asset)
    logger.info({ type: 'asset_pushed_cdn', path, provider }, `Asset enviado a CDN: ${path}`)

    return asset
  }

  /**
   * Purgar asset
   */
  purgeAsset(assetId: string): boolean {
    const asset = this.assets.get(assetId)
    if (!asset) return false

    asset.lastPurge = new Date()
    logger.info({ type: 'asset_purged', assetId }, `Asset purgado: ${asset.path}`)

    return true
  }

  /**
   * Obtener URL de CDN
   */
  getCdnUrl(assetId: string): string | null {
    const asset = this.assets.get(assetId)
    return asset ? asset.url : null
  }

  /**
   * Registrar métrica
   */
  recordMetric(provider: string, cacheHitRate: number, bandwidthSaved: number, requestsServed: number): void {
    const metric: CdnMetrics = {
      provider,
      cacheHitRate,
      bandwidthSaved,
      requestsServed,
    }

    this.metrics.push(metric)
    logger.debug({ type: 'cdn_metric_recorded', provider, cacheHitRate }, `Métrica CDN registrada: ${provider}`)
  }

  /**
   * Generar reporte
   */
  generateCdnReport(): string {
    const activeProviders = Array.from(this.providers.values()).filter((p) => p.isActive)
    const avgCacheHitRate = this.metrics.length > 0 ? (this.metrics.reduce((sum, m) => sum + m.cacheHitRate, 0) / this.metrics.length * 100).toFixed(2) : 0
    const totalBandwidthSaved = this.metrics.reduce((sum, m) => sum + m.bandwidthSaved, 0)

    const report = `
=== REPORTE DE INTEGRACIÓN CDN ===

PROVEEDORES ACTIVOS: ${activeProviders.length}
${activeProviders.map((p) => `- ${p.name}: ${p.endpoint}`).join('\n')}

ASSETS EN CDN: ${this.assets.size}

MÉTRICAS:
- Tasa de Cache Hit Promedio: ${avgCacheHitRate}%
- Ancho de Banda Ahorrado: ${(totalBandwidthSaved / 1024 / 1024 / 1024).toFixed(2)}GB
- Solicitudes Servidas: ${this.metrics.reduce((sum, m) => sum + m.requestsServed, 0)}
    `

    logger.info({ type: 'cdn_report_generated' }, 'Reporte CDN generado')
    return report
  }
}

let globalCdnIntegrationManager: CdnIntegrationManager | null = null

export function initializeCdnIntegrationManager(): CdnIntegrationManager {
  if (!globalCdnIntegrationManager) {
    globalCdnIntegrationManager = new CdnIntegrationManager()
  }
  return globalCdnIntegrationManager
}

export function getCdnIntegrationManager(): CdnIntegrationManager {
  if (!globalCdnIntegrationManager) {
    return initializeCdnIntegrationManager()
  }
  return globalCdnIntegrationManager
}

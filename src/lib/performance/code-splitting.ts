/**
 * Code Splitting & Bundling
 * Semana 43, Tarea 43.8: Code Splitting & Bundling
 */

import { logger } from '@/lib/monitoring'

export interface BundleMetrics {
  name: string
  size: number
  gzipSize: number
  chunks: number
  modules: number
  dependencies: string[]
}

export interface ChunkInfo {
  id: string
  name: string
  size: number
  modules: number
  async: boolean
  parents: string[]
}

export class CodeSplittingManager {
  private bundles: Map<string, BundleMetrics> = new Map()
  private chunks: Map<string, ChunkInfo> = new Map()

  constructor() {
    logger.debug({ type: 'code_splitting_init' }, 'Code Splitting Manager inicializado')
  }

  /**
   * Registrar bundle
   */
  registerBundle(name: string, size: number, gzipSize: number, chunks: number, modules: number, dependencies: string[]): BundleMetrics {
    const bundle: BundleMetrics = {
      name,
      size,
      gzipSize,
      chunks,
      modules,
      dependencies,
    }

    this.bundles.set(name, bundle)
    logger.info({ type: 'bundle_registered', name, size }, `Bundle registrado: ${name} (${(size / 1024).toFixed(2)}KB)`)

    return bundle
  }

  /**
   * Registrar chunk
   */
  registerChunk(id: string, name: string, size: number, modules: number, async: boolean, parents: string[]): ChunkInfo {
    const chunk: ChunkInfo = {
      id,
      name,
      size,
      modules,
      async,
      parents,
    }

    this.chunks.set(id, chunk)
    logger.debug({ type: 'chunk_registered', chunkId: id }, `Chunk registrado: ${name}`)

    return chunk
  }

  /**
   * Analizar oportunidades de code splitting
   */
  analyzeSplittingOpportunities(): string[] {
    const suggestions: string[] = []
    const bundles = Array.from(this.bundles.values())

    for (const bundle of bundles) {
      if (bundle.size > 500000) {
        suggestions.push(`${bundle.name}: Considerar dividir bundle > 500KB`)
      }

      if (bundle.modules > 100) {
        suggestions.push(`${bundle.name}: Considerar dividir (${bundle.modules} módulos)`)
      }

      // Analizar dependencias pesadas
      if (bundle.dependencies.length > 20) {
        suggestions.push(`${bundle.name}: Demasiadas dependencias (${bundle.dependencies.length})`)
      }
    }

    return suggestions
  }

  /**
   * Obtener análisis de bundles
   */
  getBundleAnalysis(): {
    totalSize: number
    totalGzipSize: number
    compressionRatio: number
    largestBundle: BundleMetrics | null
    totalChunks: number
  } {
    const bundles = Array.from(this.bundles.values())
    const totalSize = bundles.reduce((sum, b) => sum + b.size, 0)
    const totalGzipSize = bundles.reduce((sum, b) => sum + b.gzipSize, 0)
    const compressionRatio = totalSize > 0 ? Math.round(((totalSize - totalGzipSize) / totalSize) * 100) : 0

    const largestBundle = bundles.length > 0 ? bundles.reduce((max, b) => (b.size > max.size ? b : max)) : null

    return {
      totalSize,
      totalGzipSize,
      compressionRatio,
      largestBundle,
      totalChunks: this.chunks.size,
    }
  }

  /**
   * Optimizar bundle
   */
  suggestOptimizations(bundleName: string): string[] {
    const bundle = this.bundles.get(bundleName)
    if (!bundle) return []

    const suggestions: string[] = []

    if (bundle.size > 300000) {
      suggestions.push('Implementar lazy loading')
      suggestions.push('Considerar tree-shaking')
    }

    if (bundle.gzipSize / bundle.size < 0.4) {
      suggestions.push('Habilitar minificación')
    }

    if (bundle.dependencies.length > 10) {
      suggestions.push('Auditar dependencias externas')
    }

    return suggestions
  }

  /**
   * Generar reporte
   */
  generateSplittingReport(): string {
    const analysis = this.getBundleAnalysis()
    const opportunities = this.analyzeSplittingOpportunities()
    const bundles = Array.from(this.bundles.values()).sort((a, b) => b.size - a.size)

    const report = `
=== REPORTE DE CODE SPLITTING ===

ANÁLISIS GENERAL:
- Tamaño Total: ${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB
- Tamaño Gzip: ${(analysis.totalGzipSize / 1024 / 1024).toFixed(2)}MB
- Ratio de Compresión: ${analysis.compressionRatio}%
- Total de Chunks: ${analysis.totalChunks}

TOP 5 BUNDLES MÁS GRANDES:
${bundles.slice(0, 5).map((b) => `- ${b.name}: ${(b.size / 1024).toFixed(2)}KB (${(b.gzipSize / 1024).toFixed(2)}KB gzip)`).join('\n')}

OPORTUNIDADES DE OPTIMIZACIÓN:
${opportunities.length > 0 ? opportunities.slice(0, 5).map((s) => `- ${s}`).join('\n') : '- Ninguna'}
    `

    logger.info({ type: 'splitting_report_generated' }, 'Reporte de code splitting generado')
    return report
  }
}

let globalCodeSplittingManager: CodeSplittingManager | null = null

export function initializeCodeSplittingManager(): CodeSplittingManager {
  if (!globalCodeSplittingManager) {
    globalCodeSplittingManager = new CodeSplittingManager()
  }
  return globalCodeSplittingManager
}

export function getCodeSplittingManager(): CodeSplittingManager {
  if (!globalCodeSplittingManager) {
    return initializeCodeSplittingManager()
  }
  return globalCodeSplittingManager
}

/**
 * PWA Performance Optimization
 * Semana 30, Tarea 30.12: Bundle optimization, compresión, y Core Web Vitals
 */

/**
 * Web Vitals Metrics
 */
export interface WebVitals {
  fcp?: number // First Contentful Paint
  lcp?: number // Largest Contentful Paint
  fid?: number // First Input Delay
  cls?: number // Cumulative Layout Shift
  ttfb?: number // Time to First Byte
  tti?: number // Time to Interactive
}

/**
 * Obtener Core Web Vitals
 */
export function getWebVitals(): WebVitals {
  const metrics: WebVitals = {}

  // FCP - First Contentful Paint
  const paintEntries = performance.getEntriesByType('paint')
  const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint')
  if (fcpEntry) {
    metrics.fcp = fcpEntry.startTime
  }

  // Navigation timing
  const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (navTiming) {
    metrics.ttfb = navTiming.responseStart - navTiming.fetchStart
  }

  // LCP - Largest Contentful Paint (requiere PerformanceObserver)
  // Se captura via web-vitals library

  return metrics
}

/**
 * Reportar metrics a analytics
 */
export async function reportWebVitals(metrics: WebVitals): Promise<void> {
  try {
    await fetch('/api/metrics/web-vitals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...metrics,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      }),
    })
  } catch (error) {
    console.error('[Performance] Error reportando metrics:', error)
  }
}

/**
 * Medir tiempo de carga
 */
export function measurePageLoad(): {
  domReady: number
  pageLoad: number
  resourcesLoad: number
} {
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

  if (!nav) {
    return { domReady: 0, pageLoad: 0, resourcesLoad: 0 }
  }

  return {
    domReady: nav.domContentLoadedEventEnd - nav.fetchStart,
    pageLoad: nav.loadEventEnd - nav.fetchStart,
    resourcesLoad: nav.responseEnd - nav.responseStart,
  }
}

/**
 * Optimizar imágenes - preload críticas
 */
export function preloadCriticalImages(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.as = 'image'
    link.href = url
    document.head.appendChild(link)
  })

  console.log('[Performance] Preloaded', urls.length, 'critical images')
}

/**
 * Prefetch rutas de navegación
 */
export function prefetchRoutes(routes: string[]): void {
  routes.forEach((route) => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = route
    link.as = 'document'
    document.head.appendChild(link)
  })

  console.log('[Performance] Prefetched', routes.length, 'routes')
}

/**
 * Lazy load scripts
 */
export function lazyLoadScript(src: string, options?: { async?: boolean; defer?: boolean }): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = options?.async ?? true
    script.defer = options?.defer ?? false

    script.onload = () => {
      console.log('[Performance] Script loaded:', src)
      resolve()
    }

    script.onerror = () => {
      console.error('[Performance] Error loading script:', src)
      reject(new Error(`Failed to load script: ${src}`))
    }

    document.body.appendChild(script)
  })
}

/**
 * Medir performance de una función
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now()

  try {
    const result = await fn()
    const duration = performance.now() - start

    console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)

    // Report to analytics
    reportPerformanceMetric(name, duration)

    return result
  } catch (error) {
    const duration = performance.now() - start
    console.error(`[Performance] ${name} failed: ${duration.toFixed(2)}ms`, error)
    throw error
  }
}

/**
 * Reportar metric de performance
 */
async function reportPerformanceMetric(name: string, duration: number): Promise<void> {
  try {
    await fetch('/api/metrics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        duration,
        timestamp: new Date().toISOString(),
      }),
    })
  } catch (error) {
    // Silently fail
  }
}

/**
 * Monitorear Long Tasks
 */
export function monitorLongTasks(
  callback: (duration: number) => void,
  threshold: number = 50,
): () => void {
  if (!PerformanceObserver) {
    return () => {}
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > threshold) {
          console.warn('[Performance] Long task detected:', entry.duration.toFixed(2) + 'ms')
          callback(entry.duration)
        }
      }
    })

    observer.observe({ entryTypes: ['longtask'] })

    return () => observer.disconnect()
  } catch {
    return () => {}
  }
}

/**
 * Obtener tamaño de recursos cacheados
 */
export async function getCacheSizeStats(): Promise<{
  total: number
  caches: Record<string, number>
}> {
  const cacheNames = await caches.keys()
  const caches: Record<string, number> = {}
  let total = 0

  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    let size = 0

    for (const request of keys) {
      const response = await cache.match(request)
      if (response) {
        const blob = await response.blob()
        size += blob.size
      }
    }

    caches[cacheName] = size
    total += size
  }

  return { total, caches }
}

/**
 * Obtener estadísticas de memoria
 */
export function getMemoryStats(): {
  jsHeapSizeLimit: number
  jsHeapSizeUsed: number
  jsHeapSizeAllocated: number
} | null {
  const perfMemory = (performance as any).memory

  if (!perfMemory) {
    return null
  }

  return {
    jsHeapSizeLimit: perfMemory.jsHeapSizeLimit,
    jsHeapSizeUsed: perfMemory.usedJSHeapSize,
    jsHeapSizeAllocated: perfMemory.totalJSHeapSize,
  }
}

/**
 * Monitorear performance general
 */
export async function startPerformanceMonitoring(): Promise<() => void> {
  console.log('[Performance] Iniciando monitoreo...')

  // Monitor long tasks
  const unmonitorLongTasks = monitorLongTasks((duration) => {
    reportPerformanceMetric('longtask', duration)
  })

  // Report web vitals
  const vitals = getWebVitals()
  if (Object.keys(vitals).length > 0) {
    await reportWebVitals(vitals)
  }

  // Log initial load time
  const loadTime = measurePageLoad()
  console.log('[Performance] Load metrics:', loadTime)

  return () => {
    unmonitorLongTasks()
    console.log('[Performance] Monitoreo detenido')
  }
}

/**
 * Generar reporte de performance
 */
export async function generatePerformanceReport(): Promise<string> {
  const vitals = getWebVitals()
  const loadTime = measurePageLoad()
  const cacheStats = await getCacheSizeStats()
  const memoryStats = getMemoryStats()

  const report = `
Performance Report
==================
Web Vitals:
  FCP: ${vitals.fcp?.toFixed(2) || 'N/A'} ms
  LCP: ${vitals.lcp?.toFixed(2) || 'N/A'} ms
  FID: ${vitals.fid?.toFixed(2) || 'N/A'} ms
  CLS: ${vitals.cls?.toFixed(2) || 'N/A'}
  TTFB: ${vitals.ttfb?.toFixed(2) || 'N/A'} ms

Load Times:
  DOM Ready: ${loadTime.domReady.toFixed(2)} ms
  Page Load: ${loadTime.pageLoad.toFixed(2)} ms
  Resources: ${loadTime.resourcesLoad.toFixed(2)} ms

Cache Size:
  Total: ${(cacheStats.total / 1024 / 1024).toFixed(2)} MB
  ${Object.entries(cacheStats.caches)
    .map(([name, size]) => `  ${name}: ${(size / 1024).toFixed(2)} KB`)
    .join('\n')}

Memory:
  ${memoryStats ? `Heap Used: ${(memoryStats.jsHeapSizeUsed / 1024 / 1024).toFixed(2)} MB` : 'N/A'}
`.trim()

  return report
}

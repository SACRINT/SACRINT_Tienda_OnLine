/**
 * PWA Metrics & Analytics
 * Semana 30, Tarea 30.10: Tracking de instalaciones y métricas PWA
 */

const METRICS_KEY = 'pwa-metrics'
const INSTALL_DATE_KEY = 'pwa-install-date'
const INSTALL_SOURCE_KEY = 'pwa-install-source'

export interface PWAMetrics {
  installed: boolean
  installDate?: string
  installSource?: string
  totalSessions: number
  lastSession?: string
  offlineUsages: number
  pushNotificationsEnabled: boolean
  darkModeEnabled?: boolean
  cacheSize?: number
  avgSessionDuration?: number
}

/**
 * Obtener métricas actuales
 */
export function getMetrics(): PWAMetrics {
  try {
    const stored = localStorage.getItem(METRICS_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('[Metrics] Error leyendo métricas:', error)
  }

  return {
    installed: isAppInstalled(),
    totalSessions: 0,
    offlineUsages: 0,
    pushNotificationsEnabled: false,
  }
}

/**
 * Guardar métricas
 */
function saveMetrics(metrics: PWAMetrics): void {
  try {
    localStorage.setItem(METRICS_KEY, JSON.stringify(metrics))
    console.log('[Metrics] Métricas guardadas')
  } catch (error) {
    console.error('[Metrics] Error guardando métricas:', error)
  }
}

/**
 * Verificar si app está instalada
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(display-mode: standalone)').matches
}

/**
 * Registrar instalación
 */
export function trackInstallation(source: string = 'unknown'): void {
  const now = new Date().toISOString()

  try {
    localStorage.setItem(INSTALL_DATE_KEY, now)
    localStorage.setItem(INSTALL_SOURCE_KEY, source)
    console.log('[Metrics] Instalación registrada:', source)
  } catch (error) {
    console.error('[Metrics] Error registrando instalación:', error)
  }

  // Emitir evento
  window.dispatchEvent(
    new CustomEvent('pwa-installed', {
      detail: { source, date: now },
    }),
  )
}

/**
 * Registrar nueva sesión
 */
export function trackSessionStart(): void {
  const metrics = getMetrics()
  metrics.totalSessions += 1
  metrics.lastSession = new Date().toISOString()
  saveMetrics(metrics)

  console.log('[Metrics] Nueva sesión registrada. Total:', metrics.totalSessions)
}

/**
 * Registrar uso offline
 */
export function trackOfflineUsage(): void {
  const metrics = getMetrics()
  metrics.offlineUsages += 1
  saveMetrics(metrics)

  console.log('[Metrics] Uso offline registrado. Total:', metrics.offlineUsages)
}

/**
 * Registrar notificaciones push habilitadas
 */
export function trackPushNotificationsEnabled(enabled: boolean): void {
  const metrics = getMetrics()
  metrics.pushNotificationsEnabled = enabled
  saveMetrics(metrics)

  console.log('[Metrics] Push notifications:', enabled ? 'habilitadas' : 'deshabilitadas')
}

/**
 * Registrar preferencia de tema
 */
export function trackDarkModePreference(enabled: boolean): void {
  const metrics = getMetrics()
  metrics.darkModeEnabled = enabled
  saveMetrics(metrics)

  console.log('[Metrics] Dark mode:', enabled ? 'habilitado' : 'deshabilitado')
}

/**
 * Calcular duración promedio de sesión
 */
export function calculateAverageSessionDuration(): number {
  try {
    const sessionStart = sessionStorage.getItem('session-start')
    if (!sessionStart) {
      return 0
    }

    const duration = Date.now() - parseInt(sessionStart)
    const metrics = getMetrics()

    if (metrics.avgSessionDuration === undefined) {
      metrics.avgSessionDuration = duration
    } else {
      metrics.avgSessionDuration =
        (metrics.avgSessionDuration * metrics.totalSessions + duration) /
        (metrics.totalSessions + 1)
    }

    saveMetrics(metrics)
    return metrics.avgSessionDuration
  } catch (error) {
    console.error('[Metrics] Error calculando duración:', error)
    return 0
  }
}

/**
 * Obtener fecha de instalación
 */
export function getInstallationDate(): Date | null {
  try {
    const dateStr = localStorage.getItem(INSTALL_DATE_KEY)
    if (dateStr) {
      return new Date(dateStr)
    }
  } catch (error) {
    console.error('[Metrics] Error leyendo fecha de instalación:', error)
  }

  return null
}

/**
 * Obtener fuente de instalación
 */
export function getInstallationSource(): string {
  try {
    return localStorage.getItem(INSTALL_SOURCE_KEY) || 'unknown'
  } catch (error) {
    console.error('[Metrics] Error leyendo fuente de instalación:', error)
  }

  return 'unknown'
}

/**
 * Obtener informe de métricas
 */
export function getMetricsReport(): string {
  const metrics = getMetrics()
  const installDate = getInstallationDate()
  const installSource = getInstallationSource()

  return `
PWA Metrics Report
==================
Installed: ${metrics.installed}
Install Date: ${installDate?.toLocaleString() || 'N/A'}
Install Source: ${installSource}

Sessions: ${metrics.totalSessions}
Last Session: ${metrics.lastSession || 'N/A'}
Avg Session Duration: ${metrics.avgSessionDuration?.toFixed(2) || '0'} ms

Offline Usages: ${metrics.offlineUsages}
Push Notifications: ${metrics.pushNotificationsEnabled ? 'Enabled' : 'Disabled'}
Dark Mode: ${metrics.darkModeEnabled ? 'Enabled' : 'Disabled'}
`.trim()
}

/**
 * Limpiar métricas
 */
export function clearMetrics(): void {
  try {
    localStorage.removeItem(METRICS_KEY)
    console.log('[Metrics] Métricas limpias')
  } catch (error) {
    console.error('[Metrics] Error limpiando métricas:', error)
  }
}

/**
 * Inicializar seguimiento de sesión
 */
export function initializeSessionTracking(): void {
  if (typeof window === 'undefined') {
    return
  }

  // Registrar inicio de sesión
  sessionStorage.setItem('session-start', String(Date.now()))
  trackSessionStart()

  // Calcular duración antes de descargar
  window.addEventListener('beforeunload', () => {
    calculateAverageSessionDuration()
  })

  console.log('[Metrics] Seguimiento de sesión inicializado')
}

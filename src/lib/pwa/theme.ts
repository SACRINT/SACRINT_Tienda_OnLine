/**
 * Dark Mode & Theme Switching
 * Semana 30, Tarea 30.8: Sistema de temas (light/dark)
 */

export type Theme = 'light' | 'dark' | 'system'

const THEME_KEY = 'sacrint-theme'
const THEME_STORAGE_KEY = 'sacrint-theme-preference'

/**
 * Obtener tema actual del sistema
 */
export function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/**
 * Obtener tema almacenado o por defecto
 */
export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') {
    return 'system'
  }

  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored
    }
  } catch (error) {
    console.error('[Theme] Error leyendo tema almacenado:', error)
  }

  return 'system'
}

/**
 * Guardar preferencia de tema
 */
export function saveThemePreference(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    console.log('[Theme] Preferencia guardada:', theme)
  } catch (error) {
    console.error('[Theme] Error guardando preferencia:', error)
  }
}

/**
 * Obtener tema efectivo (resuelve 'system')
 */
export function getEffectiveTheme(): 'light' | 'dark' {
  const stored = getStoredTheme()

  if (stored === 'system') {
    return getSystemTheme()
  }

  return stored
}

/**
 * Aplicar tema al documento
 */
export function applyTheme(theme: 'light' | 'dark'): void {
  const html = document.documentElement

  if (theme === 'dark') {
    html.classList.add('dark')
    html.style.colorScheme = 'dark'
    document.body.style.backgroundColor = '#0f172a'
    document.body.style.color = '#e2e8f0'
  } else {
    html.classList.remove('dark')
    html.style.colorScheme = 'light'
    document.body.style.backgroundColor = '#ffffff'
    document.body.style.color = '#1f2937'
  }

  // Actualizar meta theme-color
  updateThemeColorMeta(theme)

  console.log('[Theme] Tema aplicado:', theme)
}

/**
 * Actualizar meta tag de tema
 */
function updateThemeColorMeta(theme: 'light' | 'dark'): void {
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement

  if (!meta) {
    return
  }

  if (theme === 'dark') {
    meta.content = '#1e293b'
  } else {
    meta.content = '#3b82f6'
  }
}

/**
 * Cambiar tema
 */
export function setTheme(theme: Theme): void {
  saveThemePreference(theme)

  const effectiveTheme = theme === 'system' ? getSystemTheme() : theme
  applyTheme(effectiveTheme)

  // Emitir evento
  window.dispatchEvent(
    new CustomEvent('theme-change', {
      detail: { theme, effectiveTheme },
    }),
  )
}

/**
 * Alternar entre light y dark
 */
export function toggleTheme(): void {
  const current = getEffectiveTheme()
  const next = current === 'light' ? 'dark' : 'light'
  setTheme(next)
}

/**
 * Escuchar cambios de preferencia del sistema
 */
export function watchSystemTheme(callback: (theme: 'light' | 'dark') => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

  const handleChange = (e: MediaQueryListEvent) => {
    const theme = e.matches ? 'dark' : 'light'

    // Solo actualizar si está en modo 'system'
    if (getStoredTheme() === 'system') {
      applyTheme(theme)
    }

    callback(theme)
  }

  mediaQuery.addEventListener('change', handleChange)

  return () => {
    mediaQuery.removeEventListener('change', handleChange)
  }
}

/**
 * Escuchar cambios de tema (events)
 */
export function onThemeChange(callback: (theme: { theme: Theme; effectiveTheme: 'light' | 'dark' }) => void): () => void {
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent
    callback(customEvent.detail)
  }

  window.addEventListener('theme-change', handler)

  return () => {
    window.removeEventListener('theme-change', handler)
  }
}

/**
 * Inicializar sistema de temas
 */
export function initializeTheme(): void {
  if (typeof window === 'undefined') {
    return
  }

  const stored = getStoredTheme()
  const effective = stored === 'system' ? getSystemTheme() : stored

  applyTheme(effective)

  // Escuchar cambios del sistema si está en modo 'system'
  if (stored === 'system') {
    watchSystemTheme(() => {
      const newEffective = getSystemTheme()
      applyTheme(newEffective)

      window.dispatchEvent(
        new CustomEvent('theme-change', {
          detail: { theme: 'system', effectiveTheme: newEffective },
        }),
      )
    })
  }

  console.log('[Theme] Sistema de temas inicializado:', effective)
}

/**
 * Hook para usar tema en React (para usar en componentes)
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(getStoredTheme())
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>(getEffectiveTheme())

  useEffect(() => {
    initializeTheme()

    const unsubscribe = onThemeChange(({ theme: newTheme, effectiveTheme: newEffective }) => {
      setThemeState(newTheme)
      setEffectiveTheme(newEffective)
    })

    const unsubscribeSystem = watchSystemTheme((newEffective) => {
      setEffectiveTheme(newEffective)
    })

    return () => {
      unsubscribe()
      unsubscribeSystem()
    }
  }, [])

  return {
    theme,
    effectiveTheme,
    setTheme,
    toggleTheme,
    isDark: effectiveTheme === 'dark',
  }
}

// Necesario para el hook
import { useState, useEffect } from 'react'

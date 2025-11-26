/**
 * Plugin System & Extensibility
 * Semana 38, Tarea 38.2: Plugin System & Extensibility
 */

import { logger } from '@/lib/monitoring'

export type PluginHook = 'before-request' | 'after-response' | 'on-error' | 'on-payment' | 'on-order' | 'on-customer' | 'on-webhook'

export interface PluginConfig {
  id: string
  name: string
  version: string
  author: string
  description: string
  enabled: boolean
  hooks: PluginHook[]
  settings?: Record<string, any>
}

export interface Plugin extends PluginConfig {
  execute: (hook: PluginHook, context: Record<string, any>) => Promise<Record<string, any>>
}

export interface HookHandler {
  pluginId: string
  hook: PluginHook
  handler: (context: Record<string, any>) => Promise<Record<string, any>>
  priority: number
}

export interface PluginMetadata {
  id: string
  name: string
  version: string
  hooks: PluginHook[]
  status: 'installed' | 'activated' | 'deactivated' | 'error'
  errorMessage?: string
  installDate: Date
  lastActivationDate?: Date
}

export class PluginSystem {
  private plugins: Map<string, Plugin> = new Map()
  private handlers: Map<PluginHook, HookHandler[]> = new Map()
  private metadata: Map<string, PluginMetadata> = new Map()

  constructor() {
    logger.debug({ type: 'plugin_system_init' }, 'Plugin System inicializado')
  }

  /**
   * Registrar plugin
   */
  registerPlugin(plugin: Plugin): boolean {
    try {
      if (this.plugins.has(plugin.id)) {
        logger.warn({ type: 'plugin_already_registered', pluginId: plugin.id }, 'Plugin ya registrado')
        return false
      }

      this.plugins.set(plugin.id, plugin)

      // Registrar handlers para cada hook
      for (const hook of plugin.hooks) {
        let hookHandlers = this.handlers.get(hook) || []
        hookHandlers.push({
          pluginId: plugin.id,
          hook,
          handler: (context) => plugin.execute(hook, context),
          priority: 0,
        })
        this.handlers.set(hook, hookHandlers)
      }

      // Crear metadata
      this.metadata.set(plugin.id, {
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        hooks: plugin.hooks,
        status: 'installed',
        installDate: new Date(),
      })

      logger.info(
        { type: 'plugin_registered', pluginId: plugin.id, name: plugin.name, version: plugin.version },
        `Plugin registrado: ${plugin.name}`,
      )

      return true
    } catch (error) {
      logger.error({ type: 'plugin_registration_error', pluginId: plugin.id, error: String(error) }, 'Error al registrar plugin')
      return false
    }
  }

  /**
   * Activar plugin
   */
  activatePlugin(pluginId: string): boolean {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) {
        logger.warn({ type: 'plugin_not_found', pluginId }, 'Plugin no encontrado')
        return false
      }

      const plugin_updated = { ...plugin, enabled: true }
      this.plugins.set(pluginId, plugin_updated)

      const metadata = this.metadata.get(pluginId)
      if (metadata) {
        metadata.status = 'activated'
        metadata.lastActivationDate = new Date()
        this.metadata.set(pluginId, metadata)
      }

      logger.info({ type: 'plugin_activated', pluginId }, `Plugin activado: ${plugin.name}`)
      return true
    } catch (error) {
      const metadata = this.metadata.get(pluginId)
      if (metadata) {
        metadata.status = 'error'
        metadata.errorMessage = String(error)
      }
      logger.error({ type: 'plugin_activation_error', pluginId, error: String(error) }, 'Error al activar plugin')
      return false
    }
  }

  /**
   * Desactivar plugin
   */
  deactivatePlugin(pluginId: string): boolean {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) return false

      const plugin_updated = { ...plugin, enabled: false }
      this.plugins.set(pluginId, plugin_updated)

      const metadata = this.metadata.get(pluginId)
      if (metadata) {
        metadata.status = 'deactivated'
        this.metadata.set(pluginId, metadata)
      }

      logger.info({ type: 'plugin_deactivated', pluginId }, `Plugin desactivado: ${plugin.name}`)
      return true
    } catch (error) {
      logger.error({ type: 'plugin_deactivation_error', pluginId, error: String(error) }, 'Error al desactivar plugin')
      return false
    }
  }

  /**
   * Ejecutar hooks
   */
  async executeHooks(hook: PluginHook, context: Record<string, any>): Promise<Record<string, any>> {
    try {
      const handlers = this.handlers.get(hook) || []
      let result = { ...context }

      // Ejecutar handlers en orden de prioridad
      const sortedHandlers = handlers.sort((a, b) => b.priority - a.priority)

      for (const handler of sortedHandlers) {
        const plugin = this.plugins.get(handler.pluginId)
        if (plugin && plugin.enabled) {
          try {
            result = await handler.handler(result)
          } catch (error) {
            logger.error(
              { type: 'hook_handler_error', pluginId: handler.pluginId, hook, error: String(error) },
              `Error en handler de plugin ${handler.pluginId}`,
            )
          }
        }
      }

      return result
    } catch (error) {
      logger.error({ type: 'hook_execution_error', hook, error: String(error) }, 'Error al ejecutar hooks')
      return context
    }
  }

  /**
   * Obtener plugin
   */
  getPlugin(pluginId: string): Plugin | null {
    return this.plugins.get(pluginId) || null
  }

  /**
   * Obtener todos los plugins
   */
  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * Obtener plugins activos
   */
  getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values()).filter((p) => p.enabled)
  }

  /**
   * Desinstalar plugin
   */
  uninstallPlugin(pluginId: string): boolean {
    try {
      // Desactivar primero
      this.deactivatePlugin(pluginId)

      // Remover handlers
      for (const hook of Array.from(this.handlers.keys())) {
        const handlers = this.handlers.get(hook) || []
        const filtered = handlers.filter((h) => h.pluginId !== pluginId)
        if (filtered.length > 0) {
          this.handlers.set(hook, filtered)
        } else {
          this.handlers.delete(hook)
        }
      }

      // Remover plugin
      this.plugins.delete(pluginId)
      this.metadata.delete(pluginId)

      logger.info({ type: 'plugin_uninstalled', pluginId }, 'Plugin desinstalado')
      return true
    } catch (error) {
      logger.error({ type: 'plugin_uninstall_error', pluginId, error: String(error) }, 'Error al desinstalar plugin')
      return false
    }
  }

  /**
   * Actualizar configuración de plugin
   */
  updatePluginConfig(pluginId: string, config: Partial<PluginConfig>): boolean {
    try {
      const plugin = this.plugins.get(pluginId)
      if (!plugin) return false

      const updated = { ...plugin, ...config }
      this.plugins.set(pluginId, updated)

      logger.info({ type: 'plugin_config_updated', pluginId }, 'Configuración de plugin actualizada')
      return true
    } catch (error) {
      logger.error({ type: 'plugin_config_update_error', pluginId, error: String(error) }, 'Error al actualizar configuración')
      return false
    }
  }

  /**
   * Obtener metadata de plugin
   */
  getPluginMetadata(pluginId: string): PluginMetadata | null {
    return this.metadata.get(pluginId) || null
  }

  /**
   * Obtener estadísticas del sistema de plugins
   */
  getStats(): {
    totalPlugins: number
    activePlugins: number
    inactivePlugins: number
    hooks: Record<PluginHook, number>
  } {
    const hooks: Record<PluginHook, number> = {} as Record<PluginHook, number>

    for (const [hook, handlers] of this.handlers) {
      hooks[hook] = handlers.length
    }

    return {
      totalPlugins: this.plugins.size,
      activePlugins: Array.from(this.plugins.values()).filter((p) => p.enabled).length,
      inactivePlugins: Array.from(this.plugins.values()).filter((p) => !p.enabled).length,
      hooks,
    }
  }
}

let globalPluginSystem: PluginSystem | null = null

export function initializePluginSystem(): PluginSystem {
  if (!globalPluginSystem) {
    globalPluginSystem = new PluginSystem()
  }
  return globalPluginSystem
}

export function getPluginSystem(): PluginSystem {
  if (!globalPluginSystem) {
    return initializePluginSystem()
  }
  return globalPluginSystem
}

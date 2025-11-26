/**
 * Configuration Management Manager
 * Semana 47, Tarea 47.4: Configuration Management
 */

import { logger } from "@/lib/monitoring"

export interface ConfigItem {
  id: string
  key: string
  value: any
  environment: "development" | "staging" | "production"
  encrypted: boolean
  lastModified: Date
}

export interface ConfigVersion {
  id: string
  timestamp: Date
  items: ConfigItem[]
  appliedAt?: Date
}

export class ConfigurationManagementManager {
  private configs: Map<string, ConfigItem> = new Map()
  private versions: Map<string, ConfigVersion> = new Map()

  constructor() {
    logger.debug({ type: "config_init" }, "Configuration Management Manager inicializado")
  }

  setConfig(key: string, value: any, environment: string, encrypted: boolean = false): ConfigItem {
    const config: ConfigItem = {
      id: `config_${Date.now()}`,
      key,
      value,
      environment: environment as any,
      encrypted,
      lastModified: new Date(),
    }
    this.configs.set(config.id, config)
    logger.info({ type: "config_set" }, `Config: ${key}`)
    return config
  }

  getConfig(key: string, environment: string): ConfigItem | null {
    return Array.from(this.configs.values()).find(c => c.key === key && c.environment === environment) || null
  }

  createConfigVersion(items: ConfigItem[]): ConfigVersion {
    const version: ConfigVersion = {
      id: `version_${Date.now()}`,
      timestamp: new Date(),
      items,
    }
    this.versions.set(version.id, version)
    logger.info({ type: "version_created" }, "Version creada")
    return version
  }

  getStatistics() {
    const devConfigs = Array.from(this.configs.values()).filter(c => c.environment === "development")
    return {
      totalConfigs: this.configs.size,
      devConfigs: devConfigs.length,
      versions: this.versions.size,
    }
  }
}

let globalConfigManager: ConfigurationManagementManager | null = null

export function getConfigurationManagementManager(): ConfigurationManagementManager {
  if (\!globalConfigManager) {
    globalConfigManager = new ConfigurationManagementManager()
  }
  return globalConfigManager
}

/**
 * Multi-Region Manager
 * Semana 46, Tarea 46.10: Multi-Region Manager
 */

import { logger } from "@/lib/monitoring"

export interface RegionInfo {
  id: string
  name: string
  location: string
  status: "active" | "standby" | "offline"
  latency: number
  bandwidth: number
  dataCenter: string
}

export interface MultiRegionConfig {
  primaryRegion: string
  secondaryRegions: string[]
  routingPolicy: "geo" | "latency" | "failover"
  dataReplicationEnabled: boolean
}

export class MultiRegionManager {
  private regions: Map<string, RegionInfo> = new Map()
  private config: MultiRegionConfig | null = null
  private trafficDistribution: Map<string, number> = new Map()

  constructor() {
    logger.debug({ type: "multiregion_init" }, "Multi-Region Manager inicializado")
  }

  registerRegion(name: string, location: string, dataCenter: string): RegionInfo {
    const region: RegionInfo = {
      id: `region_${Date.now()}`,
      name,
      location,
      status: "active",
      latency: Math.random() * 50,
      bandwidth: 1000,
      dataCenter,
    }
    this.regions.set(region.id, region)
    logger.info({ type: "region_registered" }, `Región: ${name}`)
    return region
  }

  configureMultiRegion(primaryRegion: string, secondaryRegions: string[], routingPolicy: string): void {
    this.config = {
      primaryRegion,
      secondaryRegions,
      routingPolicy: routingPolicy as any,
      dataReplicationEnabled: true,
    }
    logger.info({ type: "multiregion_configured" }, "Multi-región configurado")
  }

  getOptimalRegion(): RegionInfo | null {
    const activeRegions = Array.from(this.regions.values()).filter(r => r.status === "active")
    if (activeRegions.length === 0) return null
    return activeRegions.sort((a, b) => a.latency - b.latency)[0]
  }

  getStatistics() {
    return {
      totalRegions: this.regions.size,
      activeRegions: Array.from(this.regions.values()).filter(r => r.status === "active").length,
      offlineRegions: Array.from(this.regions.values()).filter(r => r.status === "offline").length,
    }
  }
}

let globalMultiRegionManager: MultiRegionManager | null = null

export function getMultiRegionManager(): MultiRegionManager {
  if (\!globalMultiRegionManager) {
    globalMultiRegionManager = new MultiRegionManager()
  }
  return globalMultiRegionManager
}

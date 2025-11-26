/**
 * Load Distribution Manager
 * Semana 46, Tarea 46.4: Load Distribution
 */

import { logger } from "@/lib/monitoring"

export interface LoadDistribution {
  id: string
  service: string
  nodes: string[]
  strategy: "round_robin" | "least_connections" | "weighted" | "geographic"
  weights?: Record<string, number>
  currentLoad?: Record<string, number>
}

export class LoadDistributionManager {
  private distributions: Map<string, LoadDistribution> = new Map()
  private nodeLoads: Map<string, number> = new Map()

  constructor() {
    logger.debug({ type: "load_dist_init" }, "Load Distribution Manager inicializado")
  }

  createLoadDistribution(service: string, nodes: string[], strategy: string, weights?: Record<string, number>): LoadDistribution {
    const distribution: LoadDistribution = {
      id: `dist_${Date.now()}`,
      service,
      nodes,
      strategy: strategy as any,
      weights,
      currentLoad: {},
    }
    this.distributions.set(distribution.id, distribution)
    logger.info({ type: "distribution_created" }, `Distribucion: ${service}`)
    return distribution
  }

  distributeLoad(distributionId: string, incomingLoad: number): string | null {
    const distribution = this.distributions.get(distributionId)
    if (!distribution) return null

    let selectedNode = distribution.nodes[0]
    if (distribution.strategy === "round_robin") {
      const index = Math.floor(Math.random() * distribution.nodes.length)
      selectedNode = distribution.nodes[index]
    }

    this.nodeLoads.set(selectedNode, (this.nodeLoads.get(selectedNode) || 0) + incomingLoad)
    logger.debug({ type: "load_distributed" }, `Carga distribuida a ${selectedNode}`)
    return selectedNode
  }

  getDistribution(distributionId: string): LoadDistribution | null {
    return this.distributions.get(distributionId) || null
  }

  getNodeLoad(nodeId: string): number {
    return this.nodeLoads.get(nodeId) || 0
  }

  getStatistics() {
    return {
      totalDistributions: this.distributions.size,
      totalNodes: this.nodeLoads.size,
      totalLoad: Array.from(this.nodeLoads.values()).reduce((a, b) => a + b, 0),
    }
  }
}

let globalLoadDistManager: LoadDistributionManager | null = null

export function getLoadDistributionManager(): LoadDistributionManager {
  if (!globalLoadDistManager) {
    globalLoadDistManager = new LoadDistributionManager()
  }
  return globalLoadDistManager
}

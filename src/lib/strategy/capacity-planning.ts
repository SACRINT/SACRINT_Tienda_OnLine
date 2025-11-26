/**
 * Capacity Planning Manager
 * Semana 51, Tarea 51.9: Organizational Capacity Planning
 */

import { logger } from "@/lib/monitoring"

export interface Capacity {
  id: string
  resourceType: string
  totalCapacity: number
  usedCapacity: number
  availableCapacity: number
  utilizationPercent: number
  timeframe: string
  unit: string
}

export interface CapacityForecast {
  id: string
  resourceType: string
  projectedDemand: number
  currentCapacity: number
  gapAnalysis: number
  recommendations: string[]
  horizon: "3-months" | "6-months" | "1-year"
}

export class CapacityPlanningManager {
  private capacities: Map<string, Capacity> = new Map()
  private forecasts: Map<string, CapacityForecast> = new Map()

  constructor() {
    logger.debug({ type: "capacity_planning_init" }, "Manager inicializado")
  }

  registerCapacity(
    resourceType: string,
    totalCapacity: number,
    unit: string = "units"
  ): Capacity {
    const id = "capacity_" + Date.now()
    const capacity: Capacity = {
      id,
      resourceType,
      totalCapacity,
      usedCapacity: 0,
      availableCapacity: totalCapacity,
      utilizationPercent: 0,
      timeframe: new Date().toISOString().split("T")[0],
      unit,
    }
    this.capacities.set(id, capacity)
    logger.info(
      { type: "capacity_registered", capacityId: id },
      `Capacidad registrada: ${resourceType}`
    )
    return capacity
  }

  updateUsedCapacity(
    capacityId: string,
    usedCapacity: number
  ): Capacity | null {
    const capacity = this.capacities.get(capacityId)
    if (!capacity) return null

    capacity.usedCapacity = usedCapacity
    capacity.availableCapacity = capacity.totalCapacity - usedCapacity
    capacity.utilizationPercent =
      (usedCapacity / capacity.totalCapacity) * 100 || 0

    this.capacities.set(capacityId, capacity)
    logger.info(
      { type: "capacity_updated", capacityId },
      `Capacidad actualizada: ${capacity.utilizationPercent.toFixed(2)}%`
    )
    return capacity
  }

  createCapacityForecast(
    resourceType: string,
    projectedDemand: number,
    currentCapacity: number,
    horizon: "3-months" | "6-months" | "1-year"
  ): CapacityForecast {
    const id = "forecast_" + Date.now()
    const gapAnalysis = projectedDemand - currentCapacity
    const recommendations =
      gapAnalysis > 0
        ? [
            `Aumentar capacidad en ${gapAnalysis} ${resourceType}`,
            "Considerar contratación de recursos adicionales",
            "Evaluar proveedores externos",
          ]
        : [
            `Capacidad suficiente`,
            "Monitorear demanda futura",
            "Optimizar utilización actual",
          ]

    const forecast: CapacityForecast = {
      id,
      resourceType,
      projectedDemand,
      currentCapacity,
      gapAnalysis,
      recommendations,
      horizon,
    }

    this.forecasts.set(id, forecast)
    logger.info(
      { type: "forecast_created", forecastId: id },
      `Pronóstico de capacidad creado: ${resourceType}`
    )
    return forecast
  }

  getCapacityByResourceType(resourceType: string): Capacity | null {
    return (
      Array.from(this.capacities.values()).find(
        (c) => c.resourceType === resourceType
      ) || null
    )
  }

  getOverCapacitatedResources(): Capacity[] {
    return Array.from(this.capacities.values()).filter(
      (c) => c.utilizationPercent > 80
    )
  }

  getUnderutilizedResources(): Capacity[] {
    return Array.from(this.capacities.values()).filter(
      (c) => c.utilizationPercent < 50
    )
  }

  getStatistics(): Record<string, unknown> {
    const capacities = Array.from(this.capacities.values())
    const avgUtilization =
      capacities.length > 0
        ? capacities.reduce((sum, c) => sum + c.utilizationPercent, 0) /
          capacities.length
        : 0

    return {
      totalResourceTypes: capacities.length,
      totalCapacity: capacities.reduce((sum, c) => sum + c.totalCapacity, 0),
      totalUsedCapacity: capacities.reduce((sum, c) => sum + c.usedCapacity, 0),
      averageUtilizationPercent: avgUtilization,
      overCapacitatedCount: capacities.filter((c) => c.utilizationPercent > 80)
        .length,
      underutilizedCount: capacities.filter((c) => c.utilizationPercent < 50)
        .length,
      forecastCount: this.forecasts.size,
    }
  }

  generateCapacityReport(): string {
    const stats = this.getStatistics()
    return `Capacity Planning Report\nTotal Resources: ${stats.totalResourceTypes}\nTotal Capacity: ${stats.totalCapacity}\nAverage Utilization: ${stats.averageUtilizationPercent.toFixed(2)}%`
  }
}

let globalCapacityPlanningManager: CapacityPlanningManager | null = null

export function getCapacityPlanningManager(): CapacityPlanningManager {
  if (!globalCapacityPlanningManager) {
    globalCapacityPlanningManager = new CapacityPlanningManager()
  }
  return globalCapacityPlanningManager
}

/**
 * Stakeholder Management Manager
 * Semana 51, Tarea 51.3: Stakeholder Engagement & Communication
 */

import { logger } from "@/lib/monitoring"

export interface Stakeholder {
  id: string
  name: string
  role: string
  organization: string
  interestLevel: "critical" | "high" | "medium" | "low"
  influenceLevel: "critical" | "high" | "medium" | "low"
  communicationFrequency: "daily" | "weekly" | "biweekly" | "monthly"
  preferences: string[]
  lastEngagement: Date
  engagementHistory: EngagementRecord[]
}

export interface EngagementRecord {
  id: string
  date: Date
  type: "meeting" | "email" | "call" | "presentation" | "review"
  topic: string
  outcome: string
}

export class StakeholderManagementManager {
  private stakeholders: Map<string, Stakeholder> = new Map()
  private engagementPlans: Map<string, EngagementRecord[]> = new Map()

  constructor() {
    logger.debug(
      { type: "stakeholder_management_init" },
      "Manager inicializado"
    )
  }

  registerStakeholder(
    name: string,
    role: string,
    organization: string,
    interestLevel: "critical" | "high" | "medium" | "low",
    influenceLevel: "critical" | "high" | "medium" | "low",
    communicationFrequency: "daily" | "weekly" | "biweekly" | "monthly",
    preferences: string[]
  ): Stakeholder {
    const id = "stakeholder_" + Date.now()
    const stakeholder: Stakeholder = {
      id,
      name,
      role,
      organization,
      interestLevel,
      influenceLevel,
      communicationFrequency,
      preferences,
      lastEngagement: new Date(),
      engagementHistory: [],
    }
    this.stakeholders.set(id, stakeholder)
    this.engagementPlans.set(id, [])
    logger.info(
      { type: "stakeholder_registered", stakeholderId: id },
      `Stakeholder registrado: ${name}`
    )
    return stakeholder
  }

  recordEngagement(
    stakeholderId: string,
    type: "meeting" | "email" | "call" | "presentation" | "review",
    topic: string,
    outcome: string
  ): EngagementRecord | null {
    const stakeholder = this.stakeholders.get(stakeholderId)
    if (!stakeholder) return null

    const engagement: EngagementRecord = {
      id: "engagement_" + Date.now(),
      date: new Date(),
      type,
      topic,
      outcome,
    }

    stakeholder.engagementHistory.push(engagement)
    stakeholder.lastEngagement = new Date()
    this.stakeholders.set(stakeholderId, stakeholder)
    logger.info(
      { type: "engagement_recorded", stakeholderId },
      `Engagement registrado: ${type}`
    )
    return engagement
  }

  getStakeholdersByInterest(
    level: "critical" | "high" | "medium" | "low"
  ): Stakeholder[] {
    return Array.from(this.stakeholders.values()).filter(
      (s) => s.interestLevel === level
    )
  }

  getStakeholdersByInfluence(
    level: "critical" | "high" | "medium" | "low"
  ): Stakeholder[] {
    return Array.from(this.stakeholders.values()).filter(
      (s) => s.influenceLevel === level
    )
  }

  getEngagementHistory(stakeholderId: string): EngagementRecord[] {
    const stakeholder = this.stakeholders.get(stakeholderId)
    return stakeholder ? stakeholder.engagementHistory : []
  }

  getStatistics(): Record<string, unknown> {
    const stakeholders = Array.from(this.stakeholders.values())
    return {
      totalStakeholders: stakeholders.length,
      byInterestLevel: {
        critical: stakeholders.filter((s) => s.interestLevel === "critical")
          .length,
        high: stakeholders.filter((s) => s.interestLevel === "high").length,
        medium: stakeholders.filter((s) => s.interestLevel === "medium").length,
        low: stakeholders.filter((s) => s.interestLevel === "low").length,
      },
      byInfluenceLevel: {
        critical: stakeholders.filter((s) => s.influenceLevel === "critical")
          .length,
        high: stakeholders.filter((s) => s.influenceLevel === "high").length,
        medium: stakeholders.filter((s) => s.influenceLevel === "medium").length,
        low: stakeholders.filter((s) => s.influenceLevel === "low").length,
      },
      totalEngagements: stakeholders.reduce(
        (sum, s) => sum + s.engagementHistory.length,
        0
      ),
    }
  }

  generateStakeholderReport(): string {
    const stats = this.getStatistics()
    return `Stakeholder Management Report\nTotal Stakeholders: ${stats.totalStakeholders}\nTotal Engagements: ${stats.totalEngagements}`
  }
}

let globalStakeholderManagementManager: StakeholderManagementManager | null =
  null

export function getStakeholderManagementManager(): StakeholderManagementManager {
  if (!globalStakeholderManagementManager) {
    globalStakeholderManagementManager = new StakeholderManagementManager()
  }
  return globalStakeholderManagementManager
}

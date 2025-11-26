/**
 * Developer Community Manager
 * Semana 54, Tarea 54.9: Developer Community & Ecosystem
 */

import { logger } from "@/lib/monitoring"

export interface Developer {
  id: string
  username: string
  email: string
  joinDate: Date
  contributions: number
  reputation: number
  level: "bronze" | "silver" | "gold" | "platinum"
}

export interface CommunityEvent {
  id: string
  eventName: string
  eventDate: Date
  type: "webinar" | "workshop" | "conference" | "hackathon"
  participants: number
  status: "planned" | "completed"
}

export class DeveloperCommunityManager {
  private developers: Map<string, Developer> = new Map()
  private communityEvents: Map<string, CommunityEvent> = new Map()

  constructor() {
    logger.debug({ type: "developer_community_init" }, "Manager inicializado")
  }

  registerDeveloper(username: string, email: string): Developer {
    const id = "dev_" + Date.now()
    const developer: Developer = {
      id,
      username,
      email,
      joinDate: new Date(),
      contributions: 0,
      reputation: 0,
      level: "bronze",
    }

    this.developers.set(id, developer)
    logger.info(
      { type: "developer_registered", developerId: id },
      `Desarrollador registrado: ${username}`
    )
    return developer
  }

  recordContribution(developerId: string): Developer | null {
    const dev = this.developers.get(developerId)
    if (!dev) return null

    dev.contributions++
    dev.reputation += 10
    if (dev.reputation >= 100 && dev.level === "bronze") dev.level = "silver"
    if (dev.reputation >= 500 && dev.level === "silver") dev.level = "gold"
    if (dev.reputation >= 1000 && dev.level === "gold") dev.level = "platinum"

    this.developers.set(developerId, dev)
    return dev
  }

  createCommunityEvent(
    eventName: string,
    eventDate: Date,
    eventType: "webinar" | "workshop" | "conference" | "hackathon"
  ): CommunityEvent {
    const id = "event_" + Date.now()
    const event: CommunityEvent = {
      id,
      eventName,
      eventDate,
      type: eventType,
      participants: 0,
      status: "planned",
    }

    this.communityEvents.set(id, event)
    logger.info(
      { type: "community_event_created", eventId: id },
      `Evento comunitario creado: ${eventName}`
    )
    return event
  }

  getStatistics(): Record<string, unknown> {
    const developers = Array.from(this.developers.values())
    const events = Array.from(this.communityEvents.values())

    return {
      totalDevelopers: developers.length,
      developersByLevel: {
        bronze: developers.filter((d) => d.level === "bronze").length,
        silver: developers.filter((d) => d.level === "silver").length,
        gold: developers.filter((d) => d.level === "gold").length,
        platinum: developers.filter((d) => d.level === "platinum").length,
      },
      totalCommunityEvents: events.length,
      eventsByType: {
        webinar: events.filter((e) => e.type === "webinar").length,
        workshop: events.filter((e) => e.type === "workshop").length,
        conference: events.filter((e) => e.type === "conference").length,
        hackathon: events.filter((e) => e.type === "hackathon").length,
      },
    }
  }

  generateCommunityReport(): string {
    const stats = this.getStatistics()
    return `Developer Community Report\nDevelopers: ${stats.totalDevelopers}\nEvents: ${stats.totalCommunityEvents}`
  }
}

let globalDeveloperCommunityManager: DeveloperCommunityManager | null = null

export function getDeveloperCommunityManager(): DeveloperCommunityManager {
  if (!globalDeveloperCommunityManager) {
    globalDeveloperCommunityManager = new DeveloperCommunityManager()
  }
  return globalDeveloperCommunityManager
}

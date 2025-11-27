/**
 * Team Capabilities Manager
 * Semana 55, Tarea 55.9: Team Capabilities & Development
 */

import { logger } from "@/lib/monitoring";

export interface TeamMemberCapability {
  id: string;
  memberId: string;
  skill: string;
  proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience: number;
  certifications: string[];
}

export class TeamCapabilitiesManager {
  private capabilities: Map<string, TeamMemberCapability> = new Map();

  constructor() {
    logger.debug({ type: "team_capabilities_init" }, "Manager inicializado");
  }

  recordCapability(
    memberId: string,
    skill: string,
    proficiencyLevel: "beginner" | "intermediate" | "advanced" | "expert",
    yearsOfExperience: number,
    certifications: string[] = [],
  ): TeamMemberCapability {
    const id = "cap_" + Date.now();

    const capability: TeamMemberCapability = {
      id,
      memberId,
      skill,
      proficiencyLevel,
      yearsOfExperience,
      certifications,
    };

    this.capabilities.set(id, capability);
    logger.info({ type: "capability_recorded", capabilityId: id }, `Capacidad registrada`);
    return capability;
  }

  getStatistics(): Record<string, any> {
    const capabilities = Array.from(this.capabilities.values());

    return {
      totalCapabilities: capabilities.length,
      byProficiency: {
        beginner: capabilities.filter((c) => c.proficiencyLevel === "beginner").length,
        intermediate: capabilities.filter((c) => c.proficiencyLevel === "intermediate").length,
        advanced: capabilities.filter((c) => c.proficiencyLevel === "advanced").length,
        expert: capabilities.filter((c) => c.proficiencyLevel === "expert").length,
      },
    };
  }

  generateCapabilitiesReport(): string {
    const stats = this.getStatistics();
    return `Team Capabilities Report\nCapabilities: ${stats.totalCapabilities}\nExperts: ${stats.byProficiency.expert}`;
  }
}

let globalTeamCapabilitiesManager: TeamCapabilitiesManager | null = null;

export function getTeamCapabilitiesManager(): TeamCapabilitiesManager {
  if (!globalTeamCapabilitiesManager) {
    globalTeamCapabilitiesManager = new TeamCapabilitiesManager();
  }
  return globalTeamCapabilitiesManager;
}

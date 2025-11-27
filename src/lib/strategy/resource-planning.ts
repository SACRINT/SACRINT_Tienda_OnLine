/**
 * Resource Planning Manager
 * Semana 51, Tarea 51.5: Resource & Team Allocation Planning
 */

import { logger } from "@/lib/monitoring";

export interface ResourceAllocation {
  id: string;
  resourceId: string;
  resourceName: string;
  resourceType: "person" | "equipment" | "service" | "tool";
  assignedProject: string;
  startDate: Date;
  endDate: Date;
  allocatedPercentage: number;
  status: "available" | "allocated" | "unavailable";
  notes: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  skillSet: string[];
  availabilityPercentage: number;
  allocations: ResourceAllocation[];
  manager: string;
}

export class ResourcePlanningManager {
  private resources: Map<string, ResourceAllocation> = new Map();
  private teamMembers: Map<string, TeamMember> = new Map();
  private capacityMatrix: Map<string, number> = new Map();

  constructor() {
    logger.debug({ type: "resource_planning_init" }, "Manager inicializado");
  }

  addTeamMember(name: string, role: string, skillSet: string[], manager: string): TeamMember {
    const id = "member_" + Date.now();
    const member: TeamMember = {
      id,
      name,
      role,
      skillSet,
      availabilityPercentage: 100,
      allocations: [],
      manager,
    };
    this.teamMembers.set(id, member);
    this.capacityMatrix.set(id, 100);
    logger.info({ type: "team_member_added", memberId: id }, `Miembro del equipo añadido: ${name}`);
    return member;
  }

  allocateResource(
    resourceId: string,
    projectName: string,
    startDate: Date,
    endDate: Date,
    allocatedPercentage: number,
  ): ResourceAllocation | null {
    const member = this.teamMembers.get(resourceId);
    if (!member) return null;

    const allocation: ResourceAllocation = {
      id: "alloc_" + Date.now(),
      resourceId,
      resourceName: member.name,
      resourceType: "person",
      assignedProject: projectName,
      startDate,
      endDate,
      allocatedPercentage,
      status: "allocated",
      notes: "",
    };

    member.allocations.push(allocation);
    const currentCapacity = this.capacityMatrix.get(resourceId) || 0;
    this.capacityMatrix.set(resourceId, currentCapacity - allocatedPercentage);
    this.resources.set(allocation.id, allocation);

    logger.info(
      { type: "resource_allocated", resourceId },
      `Recurso asignado al proyecto ${projectName}`,
    );
    return allocation;
  }

  getTeamCapacity(teamMemberId: string): number {
    return this.capacityMatrix.get(teamMemberId) || 0;
  }

  getResourcesBySkill(skill: string): TeamMember[] {
    return Array.from(this.teamMembers.values()).filter((member) =>
      member.skillSet.includes(skill),
    );
  }

  getProjectAllocations(projectName: string): ResourceAllocation[] {
    return Array.from(this.resources.values()).filter((r) => r.assignedProject === projectName);
  }

  updateAllocationStatus(
    allocationId: string,
    status: "available" | "allocated" | "unavailable",
  ): ResourceAllocation | null {
    const allocation = this.resources.get(allocationId);
    if (!allocation) return null;
    allocation.status = status;
    return allocation;
  }

  getStatistics(): Record<string, any> {
    const teamMembers = Array.from(this.teamMembers.values());
    const totalCapacity = Array.from(this.capacityMatrix.values()).reduce(
      (sum, cap) => sum + cap,
      0,
    );
    const allocations = Array.from(this.resources.values());

    return {
      totalTeamMembers: teamMembers.length,
      totalCapacityAvailable: totalCapacity,
      utilizationPercent:
        ((teamMembers.length * 100 - totalCapacity) / (teamMembers.length * 100)) * 100 || 0,
      totalAllocations: allocations.length,
      byStatus: {
        available: allocations.filter((a) => a.status === "available").length,
        allocated: allocations.filter((a) => a.status === "allocated").length,
        unavailable: allocations.filter((a) => a.status === "unavailable").length,
      },
    };
  }

  generateResourceReport(): string {
    const stats = this.getStatistics();
    return `Resource Planning Report\nTotal Team Members: ${stats.totalTeamMembers}\nCapacity Available: ${stats.totalCapacityAvailable}%\nUtilization: ${stats.utilizationPercent.toFixed(2)}%`;
  }
}

let globalResourcePlanningManager: ResourcePlanningManager | null = null;

export function getResourcePlanningManager(): ResourcePlanningManager {
  if (!globalResourcePlanningManager) {
    globalResourcePlanningManager = new ResourcePlanningManager();
  }
  return globalResourcePlanningManager;
}

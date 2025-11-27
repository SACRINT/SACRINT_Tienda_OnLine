/**
 * Security Patch Manager
 * Semana 53, Tarea 53.5: Security Patch Management
 */

import { logger } from "@/lib/monitoring";

export interface SecurityVulnerability {
  id: string;
  cveId: string;
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  affectedComponents: string[];
  discoveredDate: Date;
  exploitability: "high" | "medium" | "low";
  disclosureStatus: "undisclosed" | "disclosed" | "public";
  status: "identified" | "patch-available" | "patched" | "mitigated";
  patchVersion?: string;
}

export interface SecurityPatch {
  id: string;
  patchId: string;
  vulnerabilityId: string;
  patchVersion: string;
  releaseDate: Date;
  deploymentStatus: "pending" | "staged" | "deployed";
  deploymentDate?: Date;
  rollbackPlan: string;
}

export class SecurityPatchManager {
  private vulnerabilities: Map<string, SecurityVulnerability> = new Map();
  private securityPatches: Map<string, SecurityPatch> = new Map();
  private vulnHistory: SecurityVulnerability[] = [];

  constructor() {
    logger.debug({ type: "security_patch_init" }, "Manager inicializado");
  }

  reportVulnerability(
    cveId: string,
    title: string,
    description: string,
    severity: "critical" | "high" | "medium" | "low",
    affectedComponents: string[],
    exploitability: "high" | "medium" | "low",
    disclosureStatus: "undisclosed" | "disclosed" | "public",
  ): SecurityVulnerability {
    const id = "vuln_" + Date.now();
    const vulnerability: SecurityVulnerability = {
      id,
      cveId,
      title,
      description,
      severity,
      affectedComponents,
      discoveredDate: new Date(),
      exploitability,
      disclosureStatus,
      status: "identified",
    };

    this.vulnerabilities.set(id, vulnerability);
    this.vulnHistory.push(vulnerability);
    logger.info(
      { type: "vulnerability_reported", vulnId: id },
      `Vulnerabilidad reportada: ${cveId}`,
    );
    return vulnerability;
  }

  createSecurityPatch(
    vulnerabilityId: string,
    patchVersion: string,
    rollbackPlan: string,
  ): SecurityPatch | null {
    const vuln = this.vulnerabilities.get(vulnerabilityId);
    if (!vuln) return null;

    const id = "sec_patch_" + Date.now();
    const patch: SecurityPatch = {
      id,
      patchId: `SEC-${Date.now()}`,
      vulnerabilityId,
      patchVersion,
      releaseDate: new Date(),
      deploymentStatus: "pending",
      rollbackPlan,
    };

    vuln.status = "patch-available";
    vuln.patchVersion = patchVersion;
    this.vulnerabilities.set(vulnerabilityId, vuln);
    this.securityPatches.set(id, patch);

    logger.info(
      { type: "security_patch_created", patchId: id },
      `Parche de seguridad creado: ${patchVersion}`,
    );
    return patch;
  }

  deploySecurityPatch(patchId: string): SecurityPatch | null {
    const patch = this.securityPatches.get(patchId);
    if (!patch) return null;

    patch.deploymentStatus = "deployed";
    patch.deploymentDate = new Date();

    const vuln = this.vulnerabilities.get(patch.vulnerabilityId);
    if (vuln) {
      vuln.status = "patched";
      this.vulnerabilities.set(patch.vulnerabilityId, vuln);
    }

    this.securityPatches.set(patchId, patch);
    logger.info({ type: "security_patch_deployed", patchId }, `Parche de seguridad desplegado`);
    return patch;
  }

  stageSecurityPatch(patchId: string): SecurityPatch | null {
    const patch = this.securityPatches.get(patchId);
    if (!patch) return null;

    patch.deploymentStatus = "staged";
    this.securityPatches.set(patchId, patch);
    logger.info({ type: "security_patch_staged", patchId }, `Parche preparado para despliegue`);
    return patch;
  }

  getCriticalVulnerabilities(): SecurityVulnerability[] {
    return Array.from(this.vulnerabilities.values()).filter(
      (v) => v.severity === "critical" && v.status !== "patched",
    );
  }

  getStatistics(): Record<string, unknown> {
    const vulns = Array.from(this.vulnerabilities.values());
    const patches = Array.from(this.securityPatches.values());

    return {
      totalVulnerabilities: vulns.length,
      vulnBySeverity: {
        critical: vulns.filter((v) => v.severity === "critical").length,
        high: vulns.filter((v) => v.severity === "high").length,
        medium: vulns.filter((v) => v.severity === "medium").length,
        low: vulns.filter((v) => v.severity === "low").length,
      },
      vulnByStatus: {
        identified: vulns.filter((v) => v.status === "identified").length,
        patchAvailable: vulns.filter((v) => v.status === "patch-available").length,
        patched: vulns.filter((v) => v.status === "patched").length,
        mitigated: vulns.filter((v) => v.status === "mitigated").length,
      },
      totalSecurityPatches: patches.length,
      patchesByStatus: {
        pending: patches.filter((p) => p.deploymentStatus === "pending").length,
        staged: patches.filter((p) => p.deploymentStatus === "staged").length,
        deployed: patches.filter((p) => p.deploymentStatus === "deployed").length,
      },
      criticalUnpatched: vulns.filter((v) => v.severity === "critical" && v.status !== "patched")
        .length,
    };
  }

  generateSecurityReport(): string {
    const stats = this.getStatistics();
    return `Security Patch Report\nTotal Vulnerabilities: ${stats.totalVulnerabilities}\nCritical: ${stats.vulnBySeverity.critical}\nPatched: ${stats.vulnByStatus.patched}\nCritical Unpatched: ${stats.criticalUnpatched}`;
  }
}

let globalSecurityPatchManager: SecurityPatchManager | null = null;

export function getSecurityPatchManager(): SecurityPatchManager {
  if (!globalSecurityPatchManager) {
    globalSecurityPatchManager = new SecurityPatchManager();
  }
  return globalSecurityPatchManager;
}

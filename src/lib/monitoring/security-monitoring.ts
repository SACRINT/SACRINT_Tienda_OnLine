/**
 * Security Monitoring Manager
 * Semana 45, Tarea 45.10: Security Monitoring
 */

import { logger } from "@/lib/monitoring";

export interface SecurityEvent {
  id: string;
  type: "login" | "failed_auth" | "suspicious_activity" | "access_violation" | "data_access";
  severity: "low" | "medium" | "high" | "critical";
  timestamp: Date;
  userId?: string;
  ipAddress?: string;
  description: string;
  isResolved: boolean;
}

export interface SecurityThreat {
  id: string;
  threatType: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  severity: string;
  mitigated: boolean;
}

export class SecurityMonitoringManager {
  private events: Map<string, SecurityEvent> = new Map();
  private threats: Map<string, SecurityThreat> = new Map();
  private suspiciousIps: Set<string> = new Set();

  constructor() {
    logger.debug({ type: "security_init" }, "Security Monitoring Manager inicializado");
  }

  logSecurityEvent(
    type: string,
    severity: string,
    description: string,
    userId?: string,
    ipAddress?: string,
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: `sec_${Date.now()}`,
      type: type as any,
      severity: severity as any,
      timestamp: new Date(),
      userId,
      ipAddress,
      description,
      isResolved: false,
    };
    this.events.set(event.id, event);

    if (severity === "critical" || severity === "high") {
      if (ipAddress) {
        this.suspiciousIps.add(ipAddress);
      }
    }

    logger.warn({ type: "security_event", severity }, `Evento de seguridad: ${description}`);
    return event;
  }

  detectThreat(threatType: string, severity: string): SecurityThreat {
    let threat = Array.from(this.threats.values()).find((t) => t.threatType === threatType);

    if (threat) {
      threat.count++;
      threat.lastSeen = new Date();
    } else {
      threat = {
        id: `threat_${Date.now()}`,
        threatType,
        count: 1,
        firstSeen: new Date(),
        lastSeen: new Date(),
        severity,
        mitigated: false,
      };
      this.threats.set(threat.id, threat);
    }

    logger.error({ type: "threat_detected", severity }, `Amenaza detectada: ${threatType}`);
    return threat;
  }

  getSecurityEvents(severity?: string): SecurityEvent[] {
    return Array.from(this.events.values()).filter((e) => !severity || e.severity === severity);
  }

  getSuspiciousIps(): string[] {
    return Array.from(this.suspiciousIps);
  }

  getStatistics() {
    return {
      totalSecurityEvents: this.events.size,
      unresolvedEvents: Array.from(this.events.values()).filter((e) => !e.isResolved).length,
      threats: this.threats.size,
      suspiciousIps: this.suspiciousIps.size,
    };
  }
}

let globalSecurityMonitor: SecurityMonitoringManager | null = null;

export function getSecurityMonitoringManager(): SecurityMonitoringManager {
  if (!globalSecurityMonitor) {
    globalSecurityMonitor = new SecurityMonitoringManager();
  }
  return globalSecurityMonitor;
}

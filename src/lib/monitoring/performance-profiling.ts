/**
 * Performance Profiling Manager
 * Semana 45, Tarea 45.8: Performance Profiling
 */

import { logger } from "@/lib/monitoring";

export interface ProfileEntry {
  id: string;
  functionName: string;
  callCount: number;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
}

export interface CpuProfile {
  id: string;
  timestamp: Date;
  samples: Map<string, number>;
  duration: number;
}

export class PerformanceProfilingManager {
  private profiles: Map<string, ProfileEntry> = new Map();
  private cpuProfiles: Map<string, CpuProfile> = new Map();

  constructor() {
    logger.debug({ type: "profiling_init" }, "Performance Profiling Manager inicializado");
  }

  recordFunctionCall(functionName: string, executionTime: number): ProfileEntry {
    let profile = Array.from(this.profiles.values()).find((p) => p.functionName === functionName);

    if (profile) {
      profile.callCount++;
      profile.totalTime += executionTime;
      profile.averageTime = profile.totalTime / profile.callCount;
      profile.minTime = Math.min(profile.minTime, executionTime);
      profile.maxTime = Math.max(profile.maxTime, executionTime);
    } else {
      profile = {
        id: `prof_${Date.now()}`,
        functionName,
        callCount: 1,
        totalTime: executionTime,
        averageTime: executionTime,
        minTime: executionTime,
        maxTime: executionTime,
      };
      this.profiles.set(profile.id, profile);
    }

    logger.debug({ type: "function_profiled" }, `${functionName}: ${executionTime}ms`);
    return profile;
  }

  getTopFunctions(limit: number = 10): ProfileEntry[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, limit);
  }

  getSlowestFunctions(limit: number = 10): ProfileEntry[] {
    return Array.from(this.profiles.values())
      .sort((a, b) => b.averageTime - a.averageTime)
      .slice(0, limit);
  }

  getStatistics() {
    const entries = Array.from(this.profiles.values());
    return {
      totalFunctions: entries.length,
      totalCalls: entries.reduce((sum, p) => sum + p.callCount, 0),
      totalTime: entries.reduce((sum, p) => sum + p.totalTime, 0),
    };
  }
}

let globalProfilingManager: PerformanceProfilingManager | null = null;

export function getPerformanceProfilingManager(): PerformanceProfilingManager {
  if (!globalProfilingManager) {
    globalProfilingManager = new PerformanceProfilingManager();
  }
  return globalProfilingManager;
}

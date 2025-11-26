/**
 * Cache Replication Manager
 * Semana 46, Tarea 46.3: Cache Replication
 */

import { logger } from "@/lib/monitoring";

export interface CacheNode {
  id: string;
  region: string;
  capacity: number;
  usedCapacity: number;
  status: "active" | "syncing" | "offline";
}

export interface CacheReplicationConfig {
  strategy: "write_through" | "write_behind" | "hybrid";
  syncInterval: number;
  consistencyLevel: "strong" | "eventual";
}

export class CacheReplicationManager {
  private nodes: Map<string, CacheNode> = new Map();
  private config: CacheReplicationConfig | null = null;

  constructor() {
    logger.debug({ type: "cache_replication_init" }, "Manager inicializado");
  }

  configureCacheReplication(
    strategy: string,
    syncInterval: number,
    consistencyLevel: string,
  ): void {
    this.config = {
      strategy: strategy as any,
      syncInterval,
      consistencyLevel: consistencyLevel as any,
    };
    logger.info({ type: "config_set" }, "Caché configurado");
  }

  registerCacheNode(region: string, capacity: number): CacheNode {
    const node: CacheNode = {
      id: `cache_${Date.now()}`,
      region,
      capacity,
      usedCapacity: 0,
      status: "active",
    };
    this.nodes.set(node.id, node);
    logger.info({ type: "node_registered" }, `Nodo registrado`);
    return node;
  }

  replicateCache(fromNodeId: string, toNodeId: string): boolean {
    const fromNode = this.nodes.get(fromNodeId);
    const toNode = this.nodes.get(toNodeId);
    if (!fromNode || !toNode) return false;
    toNode.usedCapacity = fromNode.usedCapacity;
    logger.info({ type: "replicated" }, "Caché replicado");
    return true;
  }

  getStatistics() {
    const nodes = Array.from(this.nodes.values());
    return {
      totalNodes: nodes.length,
      activeNodes: nodes.filter((n) => n.status === "active").length,
      totalCapacity: nodes.reduce((sum, n) => sum + n.capacity, 0),
    };
  }
}

let globalCacheReplicationManager: CacheReplicationManager | null = null;

export function getCacheReplicationManager(): CacheReplicationManager {
  if (!globalCacheReplicationManager) {
    globalCacheReplicationManager = new CacheReplicationManager();
  }
  return globalCacheReplicationManager;
}

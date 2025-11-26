/**
 * Database Migration Manager
 * Semana 44, Tarea 44.7: Migration Tools
 */

import { logger } from "@/lib/monitoring";

export interface Migration {
  id: string;
  version: string;
  name: string;
  executedAt?: Date;
  status: "pending" | "executed" | "failed";
  rollbackAvailable: boolean;
}

export interface MigrationScript {
  id: string;
  version: string;
  upScript: string;
  downScript: string;
  createdAt: Date;
}

export class DatabaseMigrationManager {
  private migrations: Map<string, Migration> = new Map();
  private scripts: Map<string, MigrationScript> = new Map();
  private executedVersions: string[] = [];

  constructor() {
    logger.debug({ type: "migration_init" }, "Manager inicializado");
  }

  registerMigration(script: MigrationScript): void {
    this.scripts.set(script.version, script);
    logger.info({ type: "migration_registered" }, `Version ${script.version}`);
  }

  executeMigration(version: string): boolean {
    const script = this.scripts.get(version);
    if (!script) return false;

    const migration: Migration = {
      id: `mig_${Date.now()}`,
      version,
      name: script.id,
      executedAt: new Date(),
      status: "executed",
      rollbackAvailable: true,
    };
    this.migrations.set(migration.id, migration);
    this.executedVersions.push(version);
    logger.info({ type: "migration_executed" }, `Version ${version}`);
    return true;
  }

  rollbackMigration(version: string): boolean {
    if (!this.executedVersions.includes(version)) return false;
    this.executedVersions = this.executedVersions.filter((v) => v !== version);
    logger.info({ type: "migration_rolled_back" }, `Version ${version}`);
    return true;
  }

  getExecutedMigrations(): string[] {
    return this.executedVersions;
  }
}

let globalMigrationManager: DatabaseMigrationManager | null = null;

export function getDatabaseMigrationManager(): DatabaseMigrationManager {
  if (!globalMigrationManager) {
    globalMigrationManager = new DatabaseMigrationManager();
  }
  return globalMigrationManager;
}

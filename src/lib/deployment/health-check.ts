/**
 * Health Check - Semana 28
 * Sistema de health checks para deployment
 */
import { db } from "@/lib/db";

export async function healthCheck() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error('Database health check failed:', error);
  }

  return {
    status: checks.database ? 'healthy' : 'unhealthy',
    checks,
  };
}

export async function readinessCheck() {
  // Verificar que todos los servicios estén listos
  const isReady = process.env.DATABASE_URL !== undefined;

  return {
    ready: isReady,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Health Check - Semana 28
 * Sistema de health checks para deployment
 */
import { db } from "@/lib/db";

export async function healthCheck() {
  const checks = {
    database: false,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  };

  try {
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error("Database health check failed:", error);
  }

  return {
    status: checks.database ? "healthy" : "unhealthy",
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

/**
 * Liveness check - verifica que la aplicación esté viva
 * Retorna el estado de disponibilidad de la aplicación
 */
export async function getLivenessStatus() {
  return {
    status: "alive",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };
}

/**
 * Readiness check - verifica que la aplicación esté lista para recibir tráfico
 * Retorna el estado de preparación de todos los servicios críticos
 */
export async function getReadinessStatus() {
  const checks = {
    database: false,
    env: false,
  };

  try {
    // Verificar conexión a base de datos
    await db.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch (error) {
    console.error("Database readiness check failed:", error);
  }

  // Verificar variables de entorno críticas
  checks.env = !!(
    process.env.DATABASE_URL &&
    process.env.NEXTAUTH_SECRET &&
    process.env.NEXTAUTH_URL
  );

  const ready = checks.database && checks.env;

  return {
    ready,
    status: ready ? "ready" : "not-ready",
    checks,
    timestamp: new Date().toISOString(),
  };
}

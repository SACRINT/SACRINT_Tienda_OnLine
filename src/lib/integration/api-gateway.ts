/**
 * API Gateway Manager
 * Semana 47, Tarea 47.2: API Gateway Management
 */

import { logger } from "@/lib/monitoring";

export interface APIRoute {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  service: string;
  rateLimitPerSecond?: number;
  timeout?: number;
  authenticated: boolean;
}

export interface GatewayConfig {
  id: string;
  version: string;
  routes: APIRoute[];
  globalTimeout: number;
  corsEnabled: boolean;
}

export class APIGatewayManager {
  private routes: Map<string, APIRoute> = new Map();
  private config: GatewayConfig | null = null;
  private requestLog: Array<{ timestamp: Date; endpoint: string; status: number }> = [];

  constructor() {
    logger.debug({ type: "api_gateway_init" }, "API Gateway Manager inicializado");
  }

  registerRoute(path: string, method: string, service: string, authenticated: boolean): APIRoute {
    const route: APIRoute = {
      id: `route_${Date.now()}`,
      path,
      method: method as any,
      service,
      authenticated,
      rateLimitPerSecond: 100,
      timeout: 5000,
    };
    this.routes.set(route.id, route);
    logger.info({ type: "route_registered" }, `Ruta: ${method} ${path}`);
    return route;
  }

  configureGateway(version: string, globalTimeout: number): void {
    this.config = {
      id: `gateway_${Date.now()}`,
      version,
      routes: Array.from(this.routes.values()),
      globalTimeout,
      corsEnabled: true,
    };
    logger.info({ type: "gateway_configured" }, `Gateway v${version}`);
  }

  logRequest(endpoint: string, status: number): void {
    this.requestLog.push({
      timestamp: new Date(),
      endpoint,
      status,
    });
    logger.debug({ type: "request_logged" }, `${endpoint} -> ${status}`);
  }

  getStatistics() {
    return {
      totalRoutes: this.routes.size,
      authenticatedRoutes: Array.from(this.routes.values()).filter((r) => r.authenticated).length,
      totalRequests: this.requestLog.length,
    };
  }
}

let globalAPIGatewayManager: APIGatewayManager | null = null;

export function getAPIGatewayManager(): APIGatewayManager {
  if (!globalAPIGatewayManager) {
    globalAPIGatewayManager = new APIGatewayManager();
  }
  return globalAPIGatewayManager;
}

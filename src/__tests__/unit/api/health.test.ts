// Health Check API Tests
import { NextRequest } from "next/server";

// Mock health check functions
jest.mock("@/lib/deployment/health-check", () => ({
  getHealthStatus: jest.fn(),
  getLivenessStatus: jest.fn(),
  getReadinessStatus: jest.fn(),
}));

import {
  getHealthStatus,
  getLivenessStatus,
  getReadinessStatus,
} from "@/lib/deployment/health-check";

describe("Health Check API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/health", () => {
    it("should return 200 for healthy status", async () => {
      (getHealthStatus as jest.Mock).mockResolvedValue({
        status: "healthy",
        timestamp: new Date(),
        version: "1.0.0",
        uptime: 3600000,
        checks: [
          { name: "database", status: "pass", duration: 5 },
          { name: "memory", status: "pass" },
        ],
      });

      // Import after mocking
      const { GET } = await import("@/app/api/health/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("healthy");
    });

    it("should return 503 for unhealthy status", async () => {
      (getHealthStatus as jest.Mock).mockResolvedValue({
        status: "unhealthy",
        timestamp: new Date(),
        version: "1.0.0",
        uptime: 3600000,
        checks: [
          { name: "database", status: "fail", message: "Connection failed" },
        ],
      });

      const { GET } = await import("@/app/api/health/route");
      const response = await GET();

      expect(response.status).toBe(503);
    });

    it("should include all health checks", async () => {
      (getHealthStatus as jest.Mock).mockResolvedValue({
        status: "healthy",
        timestamp: new Date(),
        version: "1.0.0",
        uptime: 3600000,
        checks: [
          { name: "database", status: "pass" },
          { name: "memory", status: "pass" },
          { name: "environment", status: "pass" },
        ],
      });

      const { GET } = await import("@/app/api/health/route");
      const response = await GET();
      const data = await response.json();

      expect(data.checks).toHaveLength(3);
    });
  });

  describe("GET /api/health/live", () => {
    it("should return liveness status", async () => {
      (getLivenessStatus as jest.Mock).mockReturnValue({
        status: "ok",
        timestamp: new Date(),
      });

      const { GET } = await import("@/app/api/health/live/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("ok");
    });
  });

  describe("GET /api/health/ready", () => {
    it("should return ready when database is connected", async () => {
      (getReadinessStatus as jest.Mock).mockResolvedValue({
        status: "ready",
        timestamp: new Date(),
      });

      const { GET } = await import("@/app/api/health/ready/route");
      const response = await GET();

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.status).toBe("ready");
    });

    it("should return 503 when not ready", async () => {
      (getReadinessStatus as jest.Mock).mockResolvedValue({
        status: "not_ready",
        timestamp: new Date(),
        reason: "Database connection failed",
      });

      const { GET } = await import("@/app/api/health/ready/route");
      const response = await GET();

      expect(response.status).toBe(503);
    });
  });
});

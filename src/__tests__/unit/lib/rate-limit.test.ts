// Rate Limiter Tests
import {
  checkRateLimit,
  getClientIdentifier,
  rateLimitConfigs,
  resetRateLimit,
  cleanupRateLimitStore,
  RateLimitConfig,
} from "@/lib/security/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    // Reset all rate limits before each test
    resetRateLimit("test-key", "default");
    resetRateLimit("test-key", "api");
    resetRateLimit("test-key", "auth");
  });

  describe("checkRateLimit", () => {
    const testConfig: RateLimitConfig = {
      max: 5,
      windowMs: 60000,
      identifier: "test",
    };

    it("should allow first request", () => {
      const result = checkRateLimit("test-key", testConfig);

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeDefined();
    });

    it("should decrement remaining on each request", () => {
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test-key", testConfig);
      }

      const result = checkRateLimit("test-key", testConfig);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });

    it("should block when limit exceeded", () => {
      // Use up all requests
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test-key", testConfig);
      }

      const result = checkRateLimit("test-key", testConfig);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it("should track different keys separately", () => {
      // Use up key1
      for (let i = 0; i < 5; i++) {
        checkRateLimit("key1", testConfig);
      }

      // key2 should still be allowed
      const result = checkRateLimit("key2", testConfig);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it("should use identifier in composite key", () => {
      const config1: RateLimitConfig = { max: 2, windowMs: 60000, identifier: "api" };
      const config2: RateLimitConfig = { max: 2, windowMs: 60000, identifier: "auth" };

      // Use up api limit
      checkRateLimit("user1", config1);
      checkRateLimit("user1", config1);
      const apiResult = checkRateLimit("user1", config1);

      // Auth should still be available
      const authResult = checkRateLimit("user1", config2);

      expect(apiResult.success).toBe(false);
      expect(authResult.success).toBe(true);
    });
  });

  describe("getClientIdentifier", () => {
    it("should return user ID when authenticated", () => {
      const mockRequest = new Request("https://example.com");
      const result = getClientIdentifier(mockRequest, "user_123");

      expect(result).toBe("user:user_123");
    });

    it("should return IP from x-forwarded-for header", () => {
      const mockRequest = new Request("https://example.com", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });
      const result = getClientIdentifier(mockRequest);

      expect(result).toBe("ip:192.168.1.1");
    });

    it("should return IP from x-real-ip header", () => {
      const mockRequest = new Request("https://example.com", {
        headers: { "x-real-ip": "10.0.0.1" },
      });
      const result = getClientIdentifier(mockRequest);

      expect(result).toBe("ip:10.0.0.1");
    });

    it("should return IP from cf-connecting-ip header", () => {
      const mockRequest = new Request("https://example.com", {
        headers: { "cf-connecting-ip": "172.16.0.1" },
      });
      const result = getClientIdentifier(mockRequest);

      expect(result).toBe("ip:172.16.0.1");
    });

    it("should prefer cf-connecting-ip over others", () => {
      const mockRequest = new Request("https://example.com", {
        headers: {
          "cf-connecting-ip": "172.16.0.1",
          "x-real-ip": "10.0.0.1",
          "x-forwarded-for": "192.168.1.1",
        },
      });
      const result = getClientIdentifier(mockRequest);

      expect(result).toBe("ip:172.16.0.1");
    });

    it("should return unknown when no IP headers", () => {
      const mockRequest = new Request("https://example.com");
      const result = getClientIdentifier(mockRequest);

      expect(result).toBe("ip:unknown");
    });
  });

  describe("rateLimitConfigs", () => {
    it("should have api config", () => {
      expect(rateLimitConfigs.api).toBeDefined();
      expect(rateLimitConfigs.api.max).toBe(100);
      expect(rateLimitConfigs.api.windowMs).toBe(60000);
    });

    it("should have auth config with stricter limits", () => {
      expect(rateLimitConfigs.auth).toBeDefined();
      expect(rateLimitConfigs.auth.max).toBe(5);
      expect(rateLimitConfigs.auth.windowMs).toBe(15 * 60 * 1000);
    });

    it("should have checkout config", () => {
      expect(rateLimitConfigs.checkout).toBeDefined();
      expect(rateLimitConfigs.checkout.max).toBe(10);
    });

    it("should have search config", () => {
      expect(rateLimitConfigs.search).toBeDefined();
      expect(rateLimitConfigs.search.max).toBe(30);
    });

    it("should have newsletter config with daily limit", () => {
      expect(rateLimitConfigs.newsletter).toBeDefined();
      expect(rateLimitConfigs.newsletter.max).toBe(1);
      expect(rateLimitConfigs.newsletter.windowMs).toBe(24 * 60 * 60 * 1000);
    });
  });

  describe("resetRateLimit", () => {
    it("should reset rate limit for specific key", () => {
      const config: RateLimitConfig = { max: 2, windowMs: 60000, identifier: "test" };

      // Use up limit
      checkRateLimit("reset-test", config);
      checkRateLimit("reset-test", config);
      let result = checkRateLimit("reset-test", config);
      expect(result.success).toBe(false);

      // Reset
      resetRateLimit("reset-test", "test");

      // Should be allowed again
      result = checkRateLimit("reset-test", config);
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(1);
    });
  });

  describe("cleanupRateLimitStore", () => {
    it("should remove expired entries", () => {
      const config: RateLimitConfig = { max: 10, windowMs: 1, identifier: "cleanup" };

      // Create entry
      checkRateLimit("cleanup-test", config);

      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          cleanupRateLimitStore();

          // Entry should be removed, so new request should have full quota
          const result = checkRateLimit("cleanup-test", config);
          expect(result.success).toBe(true);
          expect(result.remaining).toBe(9);
          resolve();
        }, 10);
      });
    });
  });
});

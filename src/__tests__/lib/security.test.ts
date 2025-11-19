// Security Utilities Tests

import {
  escapeHtml,
  stripHtml,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeRedirectUrl,
  sanitizeInput,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSearchQuery,
} from "@/lib/security/sanitize";
import {
  checkRateLimit,
  rateLimitConfigs,
  resetRateLimit,
} from "@/lib/security/rate-limit";

describe("Sanitization Utilities", () => {
  describe("escapeHtml", () => {
    it("should escape HTML entities", () => {
      const input = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(input);

      expect(escaped).not.toContain("<script>");
      expect(escaped).toContain("&lt;script&gt;");
    });

    it("should escape quotes and ampersands", () => {
      const input = "\"Hello\" & 'World'";
      const escaped = escapeHtml(input);

      expect(escaped).toContain("&quot;");
      expect(escaped).toContain("&amp;");
      expect(escaped).toContain("&#x27;");
    });
  });

  describe("stripHtml", () => {
    it("should remove all HTML tags", () => {
      const input = "<p>Hello <strong>World</strong></p>";
      const stripped = stripHtml(input);

      expect(stripped).toBe("Hello World");
    });

    it("should handle self-closing tags", () => {
      const input = "Line 1<br/>Line 2";
      const stripped = stripHtml(input);

      expect(stripped).toBe("Line 1Line 2");
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove path traversal", () => {
      const input = "../../../etc/passwd";
      const sanitized = sanitizeFilename(input);

      expect(sanitized).not.toContain("..");
      expect(sanitized).not.toContain("/");
    });

    it("should replace special characters", () => {
      const input = "file name.jpg";
      const sanitized = sanitizeFilename(input);

      expect(sanitized).toMatch(/^[a-zA-Z0-9._-]+$/);
    });

    it("should limit length", () => {
      const input = "a".repeat(300) + ".jpg";
      const sanitized = sanitizeFilename(input);

      expect(sanitized.length).toBeLessThanOrEqual(255);
    });
  });

  describe("sanitizeUrl", () => {
    it("should accept valid http URLs", () => {
      const url = "https://example.com/path?query=value";
      expect(sanitizeUrl(url)).toBe(url);
    });

    it("should reject javascript URLs", () => {
      const url = "javascript:alert(1)";
      expect(sanitizeUrl(url)).toBe("");
    });

    it("should reject data URLs", () => {
      const url = "data:text/html,<script>alert(1)</script>";
      expect(sanitizeUrl(url)).toBe("");
    });

    it("should handle invalid URLs", () => {
      expect(sanitizeUrl("not-a-url")).toBe("");
    });
  });

  describe("sanitizeRedirectUrl", () => {
    it("should allow relative URLs", () => {
      expect(sanitizeRedirectUrl("/dashboard")).toBe("/dashboard");
    });

    it("should reject protocol-relative URLs", () => {
      const url = "//evil.com/steal";
      expect(sanitizeRedirectUrl(url)).toBe("/");
    });
  });

  describe("sanitizeInput", () => {
    it("should trim whitespace by default", () => {
      const input = "  hello world  ";
      expect(sanitizeInput(input)).toBe("hello world");
    });

    it("should limit length", () => {
      const input = "hello world";
      expect(sanitizeInput(input, { maxLength: 5 })).toBe("hello");
    });

    it("should escape HTML by default", () => {
      const input = "<script>alert(1)</script>";
      const sanitized = sanitizeInput(input);
      expect(sanitized).not.toContain("<script>");
    });
  });

  describe("sanitizeEmail", () => {
    it("should accept valid email", () => {
      expect(sanitizeEmail("Test@Example.COM")).toBe("test@example.com");
    });

    it("should reject invalid email", () => {
      expect(sanitizeEmail("not-an-email")).toBe("");
      expect(sanitizeEmail("missing@domain")).toBe("");
    });
  });

  describe("sanitizePhone", () => {
    it("should extract 10 digit Mexican phone", () => {
      expect(sanitizePhone("55-1234-5678")).toBe("5512345678");
    });

    it("should handle phone with country code", () => {
      expect(sanitizePhone("+52 55 1234 5678")).toBe("5512345678");
    });

    it("should reject invalid phone", () => {
      expect(sanitizePhone("123")).toBe("");
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("should remove special regex characters", () => {
      const input = "test.*query?";
      const sanitized = sanitizeSearchQuery(input);
      expect(sanitized).toBe("testquery");
    });

    it("should remove SQL injection attempts", () => {
      const input = "'; DROP TABLE users; --";
      const sanitized = sanitizeSearchQuery(input);
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain(";");
      expect(sanitized).not.toContain("--");
    });
  });
});

describe("Rate Limiting", () => {
  beforeEach(() => {
    resetRateLimit("test-key", "test");
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("should allow requests within limit", () => {
      const config = { max: 5, windowMs: 60000, identifier: "test" };

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit("test-key", config);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4 - i);
      }
    });

    it("should block requests over limit", () => {
      const config = { max: 3, windowMs: 60000, identifier: "test" };

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit("test-key", config);
      }

      // Next request should be blocked
      const result = checkRateLimit("test-key", config);
      expect(result.success).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.retryAfter).toBeDefined();
    });

    it("should track different keys separately", () => {
      const config = { max: 1, windowMs: 60000, identifier: "test" };

      checkRateLimit("key-1", config);
      expect(checkRateLimit("key-1", config).success).toBe(false);
      expect(checkRateLimit("key-2", config).success).toBe(true);
    });
  });

  describe("rateLimitConfigs", () => {
    it("should have auth config with low limit", () => {
      expect(rateLimitConfigs.auth.max).toBe(5);
    });

    it("should have api config with higher limit", () => {
      expect(rateLimitConfigs.api.max).toBeGreaterThan(
        rateLimitConfigs.auth.max,
      );
    });
  });
});

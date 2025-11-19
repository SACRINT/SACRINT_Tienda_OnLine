// Security Headers Tests
import { headers } from "@/lib/security/headers";

describe("Security Headers", () => {
  describe("headers configuration", () => {
    it("should have Content-Security-Policy header", () => {
      expect(headers["Content-Security-Policy"]).toBeDefined();
    });

    it("should have X-Frame-Options header", () => {
      expect(headers["X-Frame-Options"]).toBe("DENY");
    });

    it("should have X-Content-Type-Options header", () => {
      expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    });

    it("should have Referrer-Policy header", () => {
      expect(headers["Referrer-Policy"]).toBeDefined();
    });

    it("should have Permissions-Policy header", () => {
      expect(headers["Permissions-Policy"]).toBeDefined();
    });
  });

  describe("Content-Security-Policy", () => {
    const csp = headers["Content-Security-Policy"];

    it("should include default-src", () => {
      expect(csp).toContain("default-src");
    });

    it("should include script-src", () => {
      expect(csp).toContain("script-src");
    });

    it("should include style-src", () => {
      expect(csp).toContain("style-src");
    });

    it("should include img-src", () => {
      expect(csp).toContain("img-src");
    });

    it("should include connect-src", () => {
      expect(csp).toContain("connect-src");
    });
  });

  describe("Strict-Transport-Security", () => {
    it("should have HSTS header for production", () => {
      // HSTS should be present for HTTPS
      expect(headers["Strict-Transport-Security"]).toBeDefined();
    });

    it("should include max-age", () => {
      const hsts = headers["Strict-Transport-Security"];
      expect(hsts).toContain("max-age=");
    });

    it("should include includeSubDomains", () => {
      const hsts = headers["Strict-Transport-Security"];
      expect(hsts).toContain("includeSubDomains");
    });
  });

  describe("X-XSS-Protection", () => {
    it("should be set to block mode", () => {
      // Modern browsers don't need this but it's good for older ones
      expect(headers["X-XSS-Protection"]).toBe("1; mode=block");
    });
  });
});

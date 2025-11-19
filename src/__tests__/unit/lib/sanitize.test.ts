// Input Sanitization Tests
import {
  escapeHtml,
  unescapeHtml,
  stripHtml,
  sanitizeSql,
  sanitizeFilename,
  sanitizeUrl,
  sanitizeRedirectUrl,
  sanitizeInput,
  sanitizeObject,
  sanitizeEmail,
  sanitizePhone,
  sanitizeSearchQuery,
  validateContentType,
  validateFileExtension,
  allowedImageExtensions,
  allowedImageMimeTypes,
} from "@/lib/security/sanitize";

describe("Input Sanitization", () => {
  describe("escapeHtml", () => {
    it("should escape basic HTML characters", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
      expect(escapeHtml("&test")).toBe("&amp;test");
      expect(escapeHtml('"quote"')).toBe("&quot;quote&quot;");
    });

    it("should escape all dangerous characters", () => {
      const input = `<script>alert('XSS')</script>`;
      const escaped = escapeHtml(input);

      expect(escaped).not.toContain("<");
      expect(escaped).not.toContain(">");
      expect(escaped).not.toContain("'");
    });

    it("should handle empty string", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("should not modify safe strings", () => {
      expect(escapeHtml("Hello World")).toBe("Hello World");
      expect(escapeHtml("123-456")).toBe("123-456");
    });
  });

  describe("unescapeHtml", () => {
    it("should unescape HTML entities", () => {
      expect(unescapeHtml("&lt;script&gt;")).toBe("<script>");
      expect(unescapeHtml("&amp;test")).toBe("&test");
      expect(unescapeHtml("&quot;quote&quot;")).toBe('"quote"');
    });

    it("should roundtrip with escapeHtml", () => {
      const original = '<div class="test">Hello</div>';
      const escaped = escapeHtml(original);
      const unescaped = unescapeHtml(escaped);

      expect(unescaped).toBe(original);
    });
  });

  describe("stripHtml", () => {
    it("should remove HTML tags", () => {
      expect(stripHtml("<p>Hello</p>")).toBe("Hello");
      expect(stripHtml("<div><span>Text</span></div>")).toBe("Text");
    });

    it("should handle self-closing tags", () => {
      expect(stripHtml("Hello<br/>World")).toBe("HelloWorld");
      expect(stripHtml("Image<img src='test'/>Here")).toBe("ImageHere");
    });

    it("should handle attributes", () => {
      expect(stripHtml('<a href="test">Link</a>')).toBe("Link");
    });

    it("should handle empty string", () => {
      expect(stripHtml("")).toBe("");
    });
  });

  describe("sanitizeSql", () => {
    it("should escape single quotes", () => {
      expect(sanitizeSql("O'Brien")).toBe("O''Brien");
    });

    it("should escape backslashes", () => {
      expect(sanitizeSql("path\\file")).toBe("path\\\\file");
    });

    it("should handle multiple escapes", () => {
      expect(sanitizeSql("It's a '\\test'")).toBe("It''s a ''\\\\test''");
    });
  });

  describe("sanitizeFilename", () => {
    it("should remove path traversal attempts", () => {
      expect(sanitizeFilename("../../../etc/passwd")).toBe("etcpasswd");
      expect(sanitizeFilename("file/../../../test")).toBe("filetest");
    });

    it("should remove slashes", () => {
      expect(sanitizeFilename("path/to/file")).toBe("pathtofile");
      expect(sanitizeFilename("path\\to\\file")).toBe("pathtofile");
    });

    it("should replace special characters", () => {
      expect(sanitizeFilename("file name!@#$.txt")).toBe("file_name____$.txt");
    });

    it("should limit length to 255", () => {
      const longName = "a".repeat(300) + ".txt";
      const sanitized = sanitizeFilename(longName);

      expect(sanitized.length).toBeLessThanOrEqual(255);
    });

    it("should return unnamed for empty result", () => {
      expect(sanitizeFilename("...")).toBe("unnamed");
      expect(sanitizeFilename("///")).toBe("unnamed");
    });

    it("should preserve valid filenames", () => {
      expect(sanitizeFilename("document.pdf")).toBe("document.pdf");
      expect(sanitizeFilename("my-file_2023.txt")).toBe("my-file_2023.txt");
    });
  });

  describe("sanitizeUrl", () => {
    it("should allow http URLs", () => {
      const url = "http://example.com/path";
      expect(sanitizeUrl(url)).toBe(url);
    });

    it("should allow https URLs", () => {
      const url = "https://example.com/path";
      expect(sanitizeUrl(url)).toBe(url);
    });

    it("should block javascript URLs", () => {
      expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    });

    it("should block data URLs", () => {
      expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    });

    it("should return empty for invalid URLs", () => {
      expect(sanitizeUrl("not a url")).toBe("");
    });
  });

  describe("sanitizeRedirectUrl", () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    });

    it("should allow relative URLs", () => {
      expect(sanitizeRedirectUrl("/dashboard")).toBe("/dashboard");
      expect(sanitizeRedirectUrl("/products/123")).toBe("/products/123");
    });

    it("should block protocol-relative URLs", () => {
      expect(sanitizeRedirectUrl("//evil.com/path")).toBe("/");
    });

    it("should allow same-host URLs", () => {
      const url = "http://localhost:3000/dashboard";
      expect(sanitizeRedirectUrl(url)).toBe(url);
    });

    it("should block external URLs", () => {
      expect(sanitizeRedirectUrl("https://evil.com/steal")).toBe("/");
    });

    it("should allow specified hosts", () => {
      const url = "https://trusted.com/callback";
      expect(sanitizeRedirectUrl(url, ["trusted.com"])).toBe(url);
    });

    it("should return / for invalid URLs", () => {
      expect(sanitizeRedirectUrl("not a url")).toBe("/");
    });
  });

  describe("sanitizeInput", () => {
    it("should trim whitespace by default", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("should escape HTML by default", () => {
      expect(sanitizeInput("<script>")).toBe("&lt;script&gt;");
    });

    it("should limit length", () => {
      const input = "a".repeat(100);
      expect(sanitizeInput(input, { maxLength: 10 })).toBe("aaaaaaaaaa");
    });

    it("should allow HTML when specified", () => {
      expect(sanitizeInput("<b>bold</b>", { allowHtml: true })).toBe(
        "<b>bold</b>",
      );
    });

    it("should not trim when specified", () => {
      expect(sanitizeInput("  hello  ", { trim: false })).toBe("  hello  ");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize string values", () => {
      const obj = { name: "<script>", age: 25 };
      const sanitized = sanitizeObject(obj);

      expect(sanitized.name).toBe("&lt;script&gt;");
      expect(sanitized.age).toBe(25);
    });

    it("should sanitize nested objects", () => {
      const obj = {
        user: {
          name: "<b>Test</b>",
        },
      };
      const sanitized = sanitizeObject(obj);

      expect(sanitized.user.name).toBe("&lt;b&gt;Test&lt;/b&gt;");
    });

    it("should sanitize arrays", () => {
      const obj = {
        tags: ["<script>", "safe", "<img>"],
      };
      const sanitized = sanitizeObject(obj);

      expect(sanitized.tags[0]).toBe("&lt;script&gt;");
      expect(sanitized.tags[1]).toBe("safe");
      expect(sanitized.tags[2]).toBe("&lt;img&gt;");
    });

    it("should preserve non-string values", () => {
      const obj = {
        count: 42,
        active: true,
        data: null,
      };
      const sanitized = sanitizeObject(obj);

      expect(sanitized.count).toBe(42);
      expect(sanitized.active).toBe(true);
      expect(sanitized.data).toBe(null);
    });
  });

  describe("sanitizeEmail", () => {
    it("should accept valid emails", () => {
      expect(sanitizeEmail("test@example.com")).toBe("test@example.com");
      expect(sanitizeEmail("user.name@domain.co")).toBe("user.name@domain.co");
    });

    it("should lowercase emails", () => {
      expect(sanitizeEmail("Test@EXAMPLE.com")).toBe("test@example.com");
    });

    it("should trim whitespace", () => {
      expect(sanitizeEmail("  test@example.com  ")).toBe("test@example.com");
    });

    it("should reject invalid emails", () => {
      expect(sanitizeEmail("not-an-email")).toBe("");
      expect(sanitizeEmail("@domain.com")).toBe("");
      expect(sanitizeEmail("user@")).toBe("");
    });
  });

  describe("sanitizePhone", () => {
    it("should extract 10 digits", () => {
      expect(sanitizePhone("5512345678")).toBe("5512345678");
      expect(sanitizePhone("55-1234-5678")).toBe("5512345678");
      expect(sanitizePhone("(55) 1234-5678")).toBe("5512345678");
    });

    it("should extract from country code", () => {
      expect(sanitizePhone("+52 55 1234 5678")).toBe("5512345678");
      expect(sanitizePhone("525512345678")).toBe("5512345678");
    });

    it("should return empty for invalid phones", () => {
      expect(sanitizePhone("123")).toBe("");
      expect(sanitizePhone("not a phone")).toBe("");
    });
  });

  describe("sanitizeSearchQuery", () => {
    it("should remove regex special characters", () => {
      expect(sanitizeSearchQuery("test.*query")).toBe("testquery");
      expect(sanitizeSearchQuery("a[b]c")).toBe("abc");
    });

    it("should remove SQL injection attempts", () => {
      expect(sanitizeSearchQuery("test'; DROP TABLE")).toBe("test DROP TABLE");
      expect(sanitizeSearchQuery("admin'--")).toBe("admin");
    });

    it("should limit length to 100", () => {
      const input = "a".repeat(200);
      expect(sanitizeSearchQuery(input).length).toBe(100);
    });

    it("should trim whitespace", () => {
      expect(sanitizeSearchQuery("  search  ")).toBe("search");
    });
  });

  describe("validateContentType", () => {
    it("should validate allowed content types", () => {
      expect(
        validateContentType("image/jpeg", ["image/jpeg", "image/png"]),
      ).toBe(true);
    });

    it("should reject disallowed content types", () => {
      expect(validateContentType("text/html", ["image/jpeg"])).toBe(false);
    });

    it("should handle charset suffix", () => {
      expect(
        validateContentType("application/json; charset=utf-8", [
          "application/json",
        ]),
      ).toBe(true);
    });

    it("should return false for null", () => {
      expect(validateContentType(null, ["image/jpeg"])).toBe(false);
    });
  });

  describe("validateFileExtension", () => {
    it("should validate allowed extensions", () => {
      expect(validateFileExtension("image.jpg", allowedImageExtensions)).toBe(
        true,
      );
      expect(validateFileExtension("photo.png", allowedImageExtensions)).toBe(
        true,
      );
    });

    it("should reject disallowed extensions", () => {
      expect(validateFileExtension("script.js", allowedImageExtensions)).toBe(
        false,
      );
      expect(validateFileExtension("file.exe", allowedImageExtensions)).toBe(
        false,
      );
    });

    it("should be case-insensitive", () => {
      expect(validateFileExtension("image.JPG", allowedImageExtensions)).toBe(
        true,
      );
      expect(validateFileExtension("image.PNG", allowedImageExtensions)).toBe(
        true,
      );
    });

    it("should handle no extension", () => {
      expect(validateFileExtension("noextension", allowedImageExtensions)).toBe(
        false,
      );
    });
  });

  describe("allowed constants", () => {
    it("should have common image extensions", () => {
      expect(allowedImageExtensions).toContain("jpg");
      expect(allowedImageExtensions).toContain("png");
      expect(allowedImageExtensions).toContain("webp");
    });

    it("should have common image MIME types", () => {
      expect(allowedImageMimeTypes).toContain("image/jpeg");
      expect(allowedImageMimeTypes).toContain("image/png");
      expect(allowedImageMimeTypes).toContain("image/webp");
    });
  });
});

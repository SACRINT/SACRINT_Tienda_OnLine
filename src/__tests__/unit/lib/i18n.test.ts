// i18n Tests
import { t, getTranslations, detectLocale } from "@/lib/i18n/translations";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatRelativeTime,
} from "@/lib/i18n/formatting";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isLocaleSupported,
} from "@/lib/i18n/config";

describe("i18n", () => {
  describe("translations", () => {
    it("should return translation for valid key", () => {
      const result = t("common.loading", "es");
      expect(result).toBe("Cargando...");
    });

    it("should return key if translation not found", () => {
      const result = t("invalid.key", "es");
      expect(result).toBe("invalid.key");
    });

    it("should interpolate parameters", () => {
      const result = t("common.welcome", "es", { name: "Juan" });
      expect(result).toContain("Juan");
    });

    it("should use default locale if not specified", () => {
      const result = t("common.loading");
      expect(typeof result).toBe("string");
    });

    it("should fallback to default locale for unsupported locale", () => {
      const result = t("common.loading", "xx" as any);
      expect(result).toBe("Cargando...");
    });
  });

  describe("detectLocale", () => {
    it("should detect locale from Accept-Language header", () => {
      const locale = detectLocale("es-MX,es;q=0.9,en;q=0.8");
      expect(locale).toBe("es");
    });

    it("should return default for unsupported language", () => {
      const locale = detectLocale("xx-XX");
      expect(locale).toBe(DEFAULT_LOCALE);
    });

    it("should handle empty header", () => {
      const locale = detectLocale("");
      expect(locale).toBe(DEFAULT_LOCALE);
    });
  });

  describe("formatting", () => {
    describe("formatCurrency", () => {
      it("should format MXN currency", () => {
        const result = formatCurrency(1234.56, "es");
        expect(result).toMatch(/1[,.]?234[,.]?56/);
        expect(result).toMatch(/\$/);
      });

      it("should format USD currency", () => {
        const result = formatCurrency(1234.56, "en");
        expect(result).toMatch(/1[,.]?234[,.]?56/);
      });

      it("should format EUR currency", () => {
        const result = formatCurrency(1234.56, "fr");
        expect(result).toMatch(/1[,\s]?234[,.]?56/);
      });
    });

    describe("formatNumber", () => {
      it("should format number with locale", () => {
        const result = formatNumber(1234567.89, "es");
        expect(result).toMatch(/1[,.]?234[,.]?567[,.]?89/);
      });

      it("should format with decimals", () => {
        const result = formatNumber(100, "es", { minimumFractionDigits: 2 });
        expect(result).toContain("00");
      });
    });

    describe("formatDate", () => {
      it("should format date for locale", () => {
        const date = new Date("2024-01-15");
        const result = formatDate(date, "es");
        expect(result).toContain("15");
        expect(result).toContain("2024");
      });

      it("should handle date string", () => {
        const result = formatDate("2024-01-15", "es");
        expect(result).toContain("15");
      });
    });

    describe("formatRelativeTime", () => {
      it("should format seconds ago", () => {
        const date = new Date(Date.now() - 30000);
        const result = formatRelativeTime(date, "es");
        expect(result).toMatch(/segundo|sec/i);
      });

      it("should format days ago", () => {
        const date = new Date(Date.now() - 86400000 * 3);
        const result = formatRelativeTime(date, "es");
        expect(result).toMatch(/día|day/i);
      });
    });
  });

  describe("config", () => {
    it("should have es as default locale", () => {
      expect(DEFAULT_LOCALE).toBe("es");
    });

    it("should support multiple locales", () => {
      expect(SUPPORTED_LOCALES).toContain("es");
      expect(SUPPORTED_LOCALES).toContain("en");
      expect(SUPPORTED_LOCALES.length).toBeGreaterThanOrEqual(2);
    });

    it("should validate supported locales", () => {
      expect(isLocaleSupported("es")).toBe(true);
      expect(isLocaleSupported("en")).toBe(true);
      expect(isLocaleSupported("xx")).toBe(false);
    });
  });
});

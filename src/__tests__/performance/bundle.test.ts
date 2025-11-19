// Bundle Size Tests
import fs from "fs";
import path from "path";

describe("Bundle Size", () => {
  const BUILD_DIR = path.join(process.cwd(), ".next");
  const STATIC_DIR = path.join(BUILD_DIR, "static");

  // Skip if build directory doesn't exist (not built yet)
  const buildExists = fs.existsSync(BUILD_DIR);

  describe.skipIf(!buildExists)("JavaScript Bundles", () => {
    it("should keep main bundle under 250KB", () => {
      const chunksDir = path.join(STATIC_DIR, "chunks");

      if (!fs.existsSync(chunksDir)) {
        console.warn("Chunks directory not found");
        return;
      }

      const mainBundle = fs.readdirSync(chunksDir)
        .filter((f) => f.startsWith("main") && f.endsWith(".js"))
        .map((f) => {
          const stats = fs.statSync(path.join(chunksDir, f));
          return stats.size;
        })[0];

      if (mainBundle) {
        const sizeKB = mainBundle / 1024;
        expect(sizeKB).toBeLessThan(250);
        console.log(`Main bundle: ${sizeKB.toFixed(2)}KB`);
      }
    });

    it("should keep framework bundle under 200KB", () => {
      const chunksDir = path.join(STATIC_DIR, "chunks");

      if (!fs.existsSync(chunksDir)) return;

      const frameworkBundle = fs.readdirSync(chunksDir)
        .filter((f) => f.includes("framework") && f.endsWith(".js"))
        .map((f) => {
          const stats = fs.statSync(path.join(chunksDir, f));
          return stats.size;
        })[0];

      if (frameworkBundle) {
        const sizeKB = frameworkBundle / 1024;
        expect(sizeKB).toBeLessThan(200);
        console.log(`Framework bundle: ${sizeKB.toFixed(2)}KB`);
      }
    });

    it("should have reasonable total JS size", () => {
      const chunksDir = path.join(STATIC_DIR, "chunks");

      if (!fs.existsSync(chunksDir)) return;

      const totalSize = fs.readdirSync(chunksDir)
        .filter((f) => f.endsWith(".js"))
        .reduce((total, f) => {
          const stats = fs.statSync(path.join(chunksDir, f));
          return total + stats.size;
        }, 0);

      const totalKB = totalSize / 1024;
      const totalMB = totalKB / 1024;

      // Total JS should be under 2MB
      expect(totalMB).toBeLessThan(2);
      console.log(`Total JS: ${totalKB.toFixed(2)}KB (${totalMB.toFixed(2)}MB)`);
    });
  });

  describe.skipIf(!buildExists)("CSS Bundles", () => {
    it("should keep CSS under 100KB", () => {
      const cssDir = path.join(STATIC_DIR, "css");

      if (!fs.existsSync(cssDir)) return;

      const totalCss = fs.readdirSync(cssDir)
        .filter((f) => f.endsWith(".css"))
        .reduce((total, f) => {
          const stats = fs.statSync(path.join(cssDir, f));
          return total + stats.size;
        }, 0);

      const sizeKB = totalCss / 1024;
      expect(sizeKB).toBeLessThan(100);
      console.log(`Total CSS: ${sizeKB.toFixed(2)}KB`);
    });
  });

  describe.skipIf(!buildExists)("Build Output", () => {
    it("should generate build manifest", () => {
      const manifestPath = path.join(BUILD_DIR, "build-manifest.json");
      expect(fs.existsSync(manifestPath)).toBe(true);
    });

    it("should have prerendered pages", () => {
      const serverDir = path.join(BUILD_DIR, "server");
      if (!fs.existsSync(serverDir)) return;

      const pages = fs.readdirSync(path.join(serverDir, "pages"));
      expect(pages.length).toBeGreaterThan(0);
    });
  });
});

// Helper for conditional describe
function describeSkipIf(condition: boolean) {
  return condition ? describe.skip : describe;
}

describe.skipIf = (condition: boolean) =>
  condition ? describe.skip : describe;

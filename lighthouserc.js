// Lighthouse CI Configuration
module.exports = {
  ci: {
    collect: {
      // Static server configuration
      staticDistDir: "./.next",
      numberOfRuns: 3,
      url: [
        "http://localhost:3000/",
        "http://localhost:3000/shop",
        "http://localhost:3000/cart",
      ],
      settings: {
        // Use desktop configuration
        preset: "desktop",
        // Throttling for realistic conditions
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      assertions: {
        // Performance
        "categories:performance": ["error", { minScore: 0.8 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
        interactive: ["warn", { maxNumericValue: 3500 }],
        "speed-index": ["warn", { maxNumericValue: 3000 }],

        // Accessibility
        "categories:accessibility": ["error", { minScore: 0.9 }],

        // Best Practices
        "categories:best-practices": ["error", { minScore: 0.9 }],

        // SEO
        "categories:seo": ["error", { minScore: 0.9 }],

        // Specific audits
        "uses-responsive-images": "warn",
        "uses-optimized-images": "warn",
        "uses-webp-images": "warn",
        "uses-text-compression": "error",
        "uses-rel-preconnect": "warn",
        "render-blocking-resources": "warn",
        "unused-css-rules": "warn",
        "unused-javascript": "warn",
        "modern-image-formats": "warn",
        "efficient-animated-content": "warn",
        "duplicated-javascript": "warn",
        "legacy-javascript": "warn",
        "dom-size": ["warn", { maxNumericValue: 1500 }],
        "mainthread-work-breakdown": ["warn", { maxNumericValue: 4000 }],
        "bootup-time": ["warn", { maxNumericValue: 3500 }],

        // PWA (warn only for now)
        "categories:pwa": ["warn", { minScore: 0.5 }],
      },
    },
    upload: {
      // Upload to temporary public storage
      target: "temporary-public-storage",
    },
  },
};

// Production Deployment Configuration
// Deployment checklist, rollback procedures, and monitoring

export interface DeploymentChecklist {
  category: string;
  items: Array<{
    name: string;
    description: string;
    required: boolean;
    automated: boolean;
  }>;
}

// Pre-deployment checklist
export const PRE_DEPLOYMENT_CHECKLIST: DeploymentChecklist[] = [
  {
    category: "Code Quality",
    items: [
      {
        name: "All tests passing",
        description: "npm run test",
        required: true,
        automated: true,
      },
      {
        name: "No lint errors",
        description: "npm run lint",
        required: true,
        automated: true,
      },
      {
        name: "TypeScript compiles",
        description: "npm run type-check",
        required: true,
        automated: true,
      },
      {
        name: "Build succeeds",
        description: "npm run build",
        required: true,
        automated: true,
      },
    ],
  },
  {
    category: "Security",
    items: [
      {
        name: "Dependencies updated",
        description: "npm audit",
        required: true,
        automated: true,
      },
      {
        name: "Secrets rotated",
        description: "Check env variables",
        required: false,
        automated: false,
      },
      {
        name: "Security headers",
        description: "Verify CSP, HSTS",
        required: true,
        automated: false,
      },
    ],
  },
  {
    category: "Performance",
    items: [
      {
        name: "Lighthouse score > 90",
        description: "Run Lighthouse audit",
        required: true,
        automated: true,
      },
      {
        name: "Load tests pass",
        description: "Run load tests",
        required: false,
        automated: false,
      },
      {
        name: "Database indexed",
        description: "Verify indexes",
        required: true,
        automated: false,
      },
    ],
  },
  {
    category: "Operations",
    items: [
      {
        name: "Monitoring enabled",
        description: "Verify alerts",
        required: true,
        automated: false,
      },
      {
        name: "Backups verified",
        description: "Test restore",
        required: true,
        automated: false,
      },
      {
        name: "Rollback plan ready",
        description: "Document procedure",
        required: true,
        automated: false,
      },
    ],
  },
];

// Deployment stages
export const DEPLOYMENT_STAGES = [
  {
    name: "Build",
    description: "Compile and bundle application",
    duration: "2-5 min",
  },
  { name: "Test", description: "Run automated tests", duration: "5-10 min" },
  { name: "Stage", description: "Deploy to staging", duration: "2-3 min" },
  {
    name: "Verify",
    description: "Smoke tests on staging",
    duration: "5-10 min",
  },
  { name: "Deploy", description: "Deploy to production", duration: "2-3 min" },
  {
    name: "Monitor",
    description: "Watch metrics for issues",
    duration: "15-30 min",
  },
];

// Rollback procedure
export const ROLLBACK_PROCEDURE = {
  triggers: [
    "Error rate > 5%",
    "P95 response time > 3s",
    "Critical alerts triggered",
    "Customer complaints spike",
  ],
  steps: [
    "1. Identify the issue and affected version",
    "2. Notify team via Slack/PagerDuty",
    "3. Revert to previous deployment",
    "4. Verify rollback success",
    "5. Investigate root cause",
    "6. Document post-mortem",
  ],
  contacts: {
    oncall: "oncall@sacrint.com",
    slack: "#deployments",
    pagerduty: "SACRINT-Prod",
  },
};

// Feature flags for gradual rollout
export interface FeatureFlag {
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export const FEATURE_FLAGS: FeatureFlag[] = [
  {
    name: "new_checkout",
    description: "New checkout flow",
    enabled: false,
    rolloutPercentage: 0,
  },
  {
    name: "ai_recommendations",
    description: "AI product recommendations",
    enabled: false,
    rolloutPercentage: 0,
  },
  {
    name: "instant_search",
    description: "Instant search results",
    enabled: true,
    rolloutPercentage: 100,
  },
];

// Environment variables required for production
export const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
];

// Verify all required env vars
export function verifyEnvironment(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  for (const envVar of REQUIRED_ENV_VARS) {
    if (!process.env[envVar]) {
      missing.push(envVar);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

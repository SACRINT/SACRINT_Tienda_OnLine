// Infrastructure Configuration
// Environment settings, scaling, and deployment config

export interface InfrastructureConfig {
  environment: "development" | "staging" | "production";
  region: string;
  scaling: {
    minInstances: number;
    maxInstances: number;
    targetCpuUtilization: number;
  };
  database: {
    connectionLimit: number;
    readReplicas: number;
  };
  cache: {
    enabled: boolean;
    ttl: number;
  };
  cdn: {
    enabled: boolean;
    regions: string[];
  };
}

// Environment-specific configurations
export const INFRASTRUCTURE_CONFIGS: Record<string, InfrastructureConfig> = {
  development: {
    environment: "development",
    region: "us-east-1",
    scaling: {
      minInstances: 1,
      maxInstances: 1,
      targetCpuUtilization: 80,
    },
    database: {
      connectionLimit: 10,
      readReplicas: 0,
    },
    cache: {
      enabled: false,
      ttl: 60,
    },
    cdn: {
      enabled: false,
      regions: [],
    },
  },

  staging: {
    environment: "staging",
    region: "us-east-1",
    scaling: {
      minInstances: 1,
      maxInstances: 3,
      targetCpuUtilization: 70,
    },
    database: {
      connectionLimit: 20,
      readReplicas: 1,
    },
    cache: {
      enabled: true,
      ttl: 300,
    },
    cdn: {
      enabled: true,
      regions: ["us-east-1"],
    },
  },

  production: {
    environment: "production",
    region: "us-east-1",
    scaling: {
      minInstances: 2,
      maxInstances: 10,
      targetCpuUtilization: 60,
    },
    database: {
      connectionLimit: 50,
      readReplicas: 2,
    },
    cache: {
      enabled: true,
      ttl: 1800,
    },
    cdn: {
      enabled: true,
      regions: ["us-east-1", "us-west-2", "eu-west-1"],
    },
  },
};

// Get current config
export function getInfrastructureConfig(): InfrastructureConfig {
  const env = process.env.NODE_ENV || "development";
  return INFRASTRUCTURE_CONFIGS[env] || INFRASTRUCTURE_CONFIGS.development;
}

// Cost optimization recommendations
export interface CostOptimization {
  category: string;
  recommendation: string;
  estimatedSavings: string;
  priority: "low" | "medium" | "high";
}

export const COST_OPTIMIZATIONS: CostOptimization[] = [
  {
    category: "Compute",
    recommendation: "Use reserved instances for predictable workloads",
    estimatedSavings: "30-40%",
    priority: "high",
  },
  {
    category: "Database",
    recommendation: "Enable auto-pause for dev/staging databases",
    estimatedSavings: "50-70%",
    priority: "high",
  },
  {
    category: "Storage",
    recommendation: "Implement lifecycle policies for old data",
    estimatedSavings: "20-30%",
    priority: "medium",
  },
  {
    category: "CDN",
    recommendation: "Optimize cache hit rate to reduce origin requests",
    estimatedSavings: "10-20%",
    priority: "medium",
  },
  {
    category: "Logging",
    recommendation: "Reduce log retention for non-critical environments",
    estimatedSavings: "15-25%",
    priority: "low",
  },
];

// Health check endpoints
export const HEALTH_ENDPOINTS = {
  app: "/api/health",
  database: "/api/health/db",
  cache: "/api/health/cache",
  external: "/api/health/external",
};

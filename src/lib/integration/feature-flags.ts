// Feature Flags System

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  conditions?: FeatureFlagCondition[];
  percentage?: number;
  metadata?: Record<string, unknown>;
}

export interface FeatureFlagCondition {
  type: "user" | "tenant" | "environment" | "date" | "custom";
  operator: "equals" | "contains" | "gt" | "lt" | "in";
  field: string;
  value: unknown;
}

export interface FeatureFlagContext {
  userId?: string;
  tenantId?: string;
  environment?: string;
  userAttributes?: Record<string, unknown>;
}

// Default feature flags
const defaultFlags: Record<string, FeatureFlag> = {
  new_checkout: {
    key: "new_checkout",
    enabled: false,
    description: "New checkout flow with improved UX",
  },
  ai_recommendations: {
    key: "ai_recommendations",
    enabled: true,
    description: "AI-powered product recommendations",
  },
  dark_mode: {
    key: "dark_mode",
    enabled: false,
    description: "Dark mode theme support",
  },
  multi_currency: {
    key: "multi_currency",
    enabled: false,
    description: "Multi-currency support",
  },
  social_login: {
    key: "social_login",
    enabled: true,
    description: "Social login providers",
  },
  live_chat: {
    key: "live_chat",
    enabled: false,
    description: "Live chat support widget",
  },
  express_shipping: {
    key: "express_shipping",
    enabled: true,
    description: "Express shipping options",
  },
  product_reviews: {
    key: "product_reviews",
    enabled: true,
    description: "Product review system",
  },
};

class FeatureFlagService {
  private flags: Map<string, FeatureFlag> = new Map();
  private context: FeatureFlagContext = {};

  constructor() {
    // Load default flags
    Object.values(defaultFlags).forEach((flag) => {
      this.flags.set(flag.key, flag);
    });
  }

  // Set context for evaluations
  setContext(context: FeatureFlagContext): void {
    this.context = { ...this.context, ...context };
  }

  // Check if flag is enabled
  isEnabled(key: string, context?: FeatureFlagContext): boolean {
    const flag = this.flags.get(key);
    if (!flag) return false;

    const evalContext = { ...this.context, ...context };

    // Check basic enabled state
    if (!flag.enabled) return false;

    // Check percentage rollout
    if (flag.percentage !== undefined && flag.percentage < 100) {
      const hash = this.hashContext(key, evalContext);
      if (hash > flag.percentage) return false;
    }

    // Check conditions
    if (flag.conditions && flag.conditions.length > 0) {
      return flag.conditions.every((condition) =>
        this.evaluateCondition(condition, evalContext),
      );
    }

    return true;
  }

  // Get flag value with default
  getValue<T>(key: string, defaultValue: T): T {
    const flag = this.flags.get(key);
    if (!flag || !flag.metadata) return defaultValue;
    return (flag.metadata.value as T) || defaultValue;
  }

  // Get all enabled flags
  getEnabledFlags(context?: FeatureFlagContext): string[] {
    return Array.from(this.flags.keys()).filter((key) =>
      this.isEnabled(key, context),
    );
  }

  // Register custom flag
  register(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  // Update flag state
  update(key: string, updates: Partial<FeatureFlag>): void {
    const flag = this.flags.get(key);
    if (flag) {
      this.flags.set(key, { ...flag, ...updates });
    }
  }

  // Load flags from remote
  async loadRemote(endpoint: string): Promise<void> {
    try {
      const response = await fetch(endpoint);
      const data = await response.json();

      if (data.flags) {
        Object.values(data.flags as Record<string, FeatureFlag>).forEach(
          (flag) => {
            this.flags.set(flag.key, flag);
          },
        );
      }
    } catch (error) {
      console.error("Failed to load remote flags:", error);
    }
  }

  // Private methods
  private evaluateCondition(
    condition: FeatureFlagCondition,
    context: FeatureFlagContext,
  ): boolean {
    let fieldValue: unknown;

    switch (condition.type) {
      case "user":
        fieldValue = context.userId;
        break;
      case "tenant":
        fieldValue = context.tenantId;
        break;
      case "environment":
        fieldValue = context.environment || process.env.NODE_ENV;
        break;
      case "custom":
        fieldValue = context.userAttributes?.[condition.field];
        break;
      default:
        return true;
    }

    switch (condition.operator) {
      case "equals":
        return fieldValue === condition.value;
      case "contains":
        return String(fieldValue).includes(String(condition.value));
      case "gt":
        return Number(fieldValue) > Number(condition.value);
      case "lt":
        return Number(fieldValue) < Number(condition.value);
      case "in":
        return (
          Array.isArray(condition.value) && condition.value.includes(fieldValue)
        );
      default:
        return true;
    }
  }

  private hashContext(key: string, context: FeatureFlagContext): number {
    const str = key + (context.userId || "") + (context.tenantId || "");
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash) % 100;
  }
}

// Singleton instance
export const featureFlags = new FeatureFlagService();

// React helper
export function useFeatureFlag(key: string): boolean {
  return featureFlags.isEnabled(key);
}

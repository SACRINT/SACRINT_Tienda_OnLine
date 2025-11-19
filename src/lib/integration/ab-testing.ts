// A/B Testing System

export interface Experiment {
  id: string;
  name: string;
  description?: string;
  variants: Variant[];
  traffic: number; // 0-100 percentage
  status: "draft" | "running" | "paused" | "completed";
  startDate?: Date;
  endDate?: Date;
  metrics: string[];
}

export interface Variant {
  id: string;
  name: string;
  weight: number; // Relative weight for distribution
  data?: Record<string, unknown>;
}

export interface ExperimentAssignment {
  experimentId: string;
  variantId: string;
  userId: string;
  assignedAt: Date;
}

// Active experiments
const experiments: Map<string, Experiment> = new Map([
  [
    "checkout_redesign",
    {
      id: "checkout_redesign",
      name: "Checkout Redesign",
      description: "Test new checkout flow",
      variants: [
        { id: "control", name: "Control", weight: 50 },
        { id: "variant_a", name: "New Design", weight: 50 },
      ],
      traffic: 100,
      status: "running",
      metrics: ["conversion_rate", "cart_abandonment", "time_to_purchase"],
    },
  ],
  [
    "pricing_display",
    {
      id: "pricing_display",
      name: "Pricing Display",
      description: "Test different price displays",
      variants: [
        { id: "control", name: "Standard", weight: 33 },
        { id: "variant_a", name: "With Savings", weight: 33 },
        { id: "variant_b", name: "With Urgency", weight: 34 },
      ],
      traffic: 50,
      status: "running",
      metrics: ["click_through_rate", "add_to_cart_rate"],
    },
  ],
]);

// User assignments cache
const assignments: Map<string, Map<string, string>> = new Map();

class ABTestingService {
  // Get variant for user
  getVariant(experimentId: string, userId: string): Variant | null {
    const experiment = experiments.get(experimentId);
    if (!experiment || experiment.status !== "running") {
      return null;
    }

    // Check if already assigned
    let userAssignments = assignments.get(userId);
    if (!userAssignments) {
      userAssignments = new Map();
      assignments.set(userId, userAssignments);
    }

    const existingVariant = userAssignments.get(experimentId);
    if (existingVariant) {
      return experiment.variants.find((v) => v.id === existingVariant) || null;
    }

    // Check traffic allocation
    const trafficHash = this.hash(experimentId + userId + "traffic") % 100;
    if (trafficHash >= experiment.traffic) {
      return null;
    }

    // Assign variant
    const variant = this.selectVariant(experiment, userId);
    userAssignments.set(experimentId, variant.id);

    // Track assignment
    this.trackAssignment(experimentId, variant.id, userId);

    return variant;
  }

  // Get all active experiments for user
  getActiveExperiments(userId: string): Array<{ experiment: Experiment; variant: Variant }> {
    const results: Array<{ experiment: Experiment; variant: Variant }> = [];

    experiments.forEach((experiment) => {
      const variant = this.getVariant(experiment.id, userId);
      if (variant) {
        results.push({ experiment, variant });
      }
    });

    return results;
  }

  // Track conversion for experiment
  trackConversion(
    experimentId: string,
    userId: string,
    metric: string,
    value: number = 1
  ): void {
    const userAssignments = assignments.get(userId);
    const variantId = userAssignments?.get(experimentId);

    if (!variantId) return;

    // Log conversion
    console.log("A/B Conversion:", {
      experimentId,
      variantId,
      userId,
      metric,
      value,
      timestamp: new Date().toISOString(),
    });

    // In production, send to analytics service
  }

  // Register new experiment
  registerExperiment(experiment: Experiment): void {
    experiments.set(experiment.id, experiment);
  }

  // Update experiment status
  updateStatus(experimentId: string, status: Experiment["status"]): void {
    const experiment = experiments.get(experimentId);
    if (experiment) {
      experiment.status = status;
    }
  }

  // Get experiment results
  getResults(experimentId: string): {
    experiment: Experiment | null;
    variantStats: Record<string, { participants: number; conversions: number }>;
  } {
    const experiment = experiments.get(experimentId);
    if (!experiment) {
      return { experiment: null, variantStats: {} };
    }

    // In production, fetch from analytics
    const variantStats: Record<string, { participants: number; conversions: number }> = {};
    experiment.variants.forEach((variant) => {
      variantStats[variant.id] = {
        participants: 0,
        conversions: 0,
      };
    });

    return { experiment, variantStats };
  }

  // Private methods
  private selectVariant(experiment: Experiment, odUserId: string): Variant {
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    const hash = this.hash(experiment.id + odUserId) % totalWeight;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (hash < cumulative) {
        return variant;
      }
    }

    return experiment.variants[0];
  }

  private hash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private trackAssignment(
    experimentId: string,
    variantId: string,
    userId: string
  ): void {
    console.log("A/B Assignment:", {
      experimentId,
      variantId,
      userId,
      timestamp: new Date().toISOString(),
    });

    // In production, send to analytics service
  }
}

// Singleton instance
export const abTesting = new ABTestingService();

// React hook
export function useExperiment(experimentId: string, userId: string): Variant | null {
  return abTesting.getVariant(experimentId, userId);
}

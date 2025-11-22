// @ts-nocheck
// RFM (Recency, Frequency, Monetary) Analysis
// Customer segmentation based on purchasing behavior

import { db } from "@/lib/db";
import { differenceInDays } from "date-fns";

export interface RFMScore {
  customerId: string;
  customerName: string;
  customerEmail: string;
  recencyScore: number; // 1-5 (5 = most recent)
  frequencyScore: number; // 1-5 (5 = most frequent)
  monetaryScore: number; // 1-5 (5 = highest value)
  totalScore: number; // Sum of all scores
  segment: RFMSegment;
  recencyDays: number;
  frequency: number;
  monetaryValue: number;
  lastOrderDate: Date;
}

export type RFMSegment =
  | "Champions" // Best customers: High R, F, M
  | "Loyal Customers" // High F and M, moderate R
  | "Potential Loyalists" // Recent customers with moderate F
  | "New Customers" // Very recent but low F
  | "Promising" // Recent with moderate M
  | "Need Attention" // Moderate scores
  | "About to Sleep" // Low R, moderate F and M
  | "At Risk" // Low R, high F and M (used to be good)
  | "Cannot Lose Them" // Very low R, very high F and M
  | "Hibernating" // Low R, F, M
  | "Lost"; // Lowest scores

export interface RFMSegmentSummary {
  segment: RFMSegment;
  count: number;
  totalRevenue: number;
  avgRecency: number;
  avgFrequency: number;
  avgMonetary: number;
  percentage: number;
}

/**
 * Calculate RFM scores for all customers in a tenant
 */
export async function calculateRFMScores(
  tenantId: string,
): Promise<RFMScore[]> {
  const now = new Date();

  // Get all customers with their order history
  const customers = await db.user.findMany({
    where: {
      tenantId,
      role: "CUSTOMER",
    },
    include: {
      orders: {
        where: {
          status: {
            not: "CANCELLED",
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
    },
  });

  // Calculate RFM metrics for each customer
  const customerRFM = customers
    .map((customer) => {
      // Skip customers with no orders
      if (customer.orders.length === 0) return null;

      const lastOrderDate = customer.orders[0].createdAt;
      const recencyDays = differenceInDays(now, lastOrderDate);
      const frequency = customer.orders.length;
      const monetaryValue = customer.orders.reduce(
        (sum, order) => sum + order.total,
        0,
      );

      return {
        customerId: customer.id,
        customerName: customer.name || "Unknown",
        customerEmail: customer.email,
        recencyDays,
        frequency,
        monetaryValue,
        lastOrderDate,
      };
    })
    .filter((c) => c !== null);

  // Calculate quintiles for scoring
  const recencyValues = customerRFM.map((c) => c.recencyDays).sort((a, b) => a - b);
  const frequencyValues = customerRFM
    .map((c) => c.frequency)
    .sort((a, b) => a - b);
  const monetaryValues = customerRFM
    .map((c) => c.monetaryValue)
    .sort((a, b) => a - b);

  const getQuintile = (value: number, values: number[], reverse = false) => {
    if (values.length === 0) return 3;
    const quintileSize = Math.ceil(values.length / 5);
    const index = values.indexOf(value);
    const quintile = Math.floor(index / quintileSize) + 1;
    // For recency, lower is better, so reverse the score
    return reverse ? 6 - Math.min(quintile, 5) : Math.min(quintile, 5);
  };

  // Assign scores and segments
  const rfmScores: RFMScore[] = customerRFM.map((customer) => {
    const recencyScore = getQuintile(
      customer.recencyDays,
      recencyValues,
      true,
    ); // Reverse: recent = high score
    const frequencyScore = getQuintile(customer.frequency, frequencyValues);
    const monetaryScore = getQuintile(customer.monetaryValue, monetaryValues);
    const totalScore = recencyScore + frequencyScore + monetaryScore;

    const segment = determineSegment(
      recencyScore,
      frequencyScore,
      monetaryScore,
    );

    return {
      ...customer,
      recencyScore,
      frequencyScore,
      monetaryScore,
      totalScore,
      segment,
    };
  });

  return rfmScores.sort((a, b) => b.totalScore - a.totalScore);
}

/**
 * Determine customer segment based on RFM scores
 */
function determineSegment(
  R: number,
  F: number,
  M: number,
): RFMSegment {
  // Champions: Best customers
  if (R >= 4 && F >= 4 && M >= 4) return "Champions";

  // Loyal Customers: High frequency and monetary, moderate recency
  if (F >= 4 && M >= 4) return "Loyal Customers";

  // Potential Loyalists: Recent with good frequency
  if (R >= 4 && F >= 3 && M >= 3) return "Potential Loyalists";

  // New Customers: Very recent but low frequency
  if (R >= 4 && F <= 2) return "New Customers";

  // Promising: Recent with moderate monetary
  if (R >= 4 && M >= 3) return "Promising";

  // At Risk: Low recency but used to be good customers
  if (R <= 2 && F >= 3 && M >= 3) return "At Risk";

  // Cannot Lose Them: Very low recency but very high F and M
  if (R <= 2 && F >= 4 && M >= 4) return "Cannot Lose Them";

  // About to Sleep: Declining customers
  if (R <= 3 && F >= 2 && M >= 2) return "About to Sleep";

  // Hibernating: Low engagement
  if (R <= 2 && F <= 2) return "Hibernating";

  // Lost: Lowest scores
  if (R <= 2 && M <= 2) return "Lost";

  // Need Attention: Default for moderate scores
  return "Need Attention";
}

/**
 * Get summary statistics for each RFM segment
 */
export async function getRFMSegmentSummary(
  tenantId: string,
): Promise<RFMSegmentSummary[]> {
  const rfmScores = await calculateRFMScores(tenantId);
  const totalCustomers = rfmScores.length;

  // Group by segment
  const segmentMap = new Map<
    RFMSegment,
    {
      count: number;
      totalRevenue: number;
      totalRecency: number;
      totalFrequency: number;
      totalMonetary: number;
    }
  >();

  rfmScores.forEach((score) => {
    const existing = segmentMap.get(score.segment) || {
      count: 0,
      totalRevenue: 0,
      totalRecency: 0,
      totalFrequency: 0,
      totalMonetary: 0,
    };
    existing.count += 1;
    existing.totalRevenue += score.monetaryValue;
    existing.totalRecency += score.recencyDays;
    existing.totalFrequency += score.frequency;
    existing.totalMonetary += score.monetaryValue;
    segmentMap.set(score.segment, existing);
  });

  // Convert to summary array
  const summaries: RFMSegmentSummary[] = Array.from(segmentMap.entries()).map(
    ([segment, data]) => ({
      segment,
      count: data.count,
      totalRevenue: data.totalRevenue,
      avgRecency: data.count > 0 ? data.totalRecency / data.count : 0,
      avgFrequency: data.count > 0 ? data.totalFrequency / data.count : 0,
      avgMonetary: data.count > 0 ? data.totalMonetary / data.count : 0,
      percentage: totalCustomers > 0 ? (data.count / totalCustomers) * 100 : 0,
    }),
  );

  // Sort by total revenue descending
  return summaries.sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/**
 * Get customers in a specific segment
 */
export async function getCustomersBySegment(
  tenantId: string,
  segment: RFMSegment,
): Promise<RFMScore[]> {
  const rfmScores = await calculateRFMScores(tenantId);
  return rfmScores.filter((score) => score.segment === segment);
}

/**
 * Get recommended actions for each segment
 */
export function getSegmentRecommendations(segment: RFMSegment): {
  description: string;
  actions: string[];
  priority: "high" | "medium" | "low";
} {
  const recommendations: Record<
    RFMSegment,
    {
      description: string;
      actions: string[];
      priority: "high" | "medium" | "low";
    }
  > = {
    Champions: {
      description: "Your best customers who buy often and recently",
      actions: [
        "Reward them with VIP programs",
        "Ask for reviews and referrals",
        "Upsell premium products",
        "Early access to new products",
      ],
      priority: "high",
    },
    "Loyal Customers": {
      description: "Consistent buyers with good lifetime value",
      actions: [
        "Engage with loyalty programs",
        "Recommend related products",
        "Special member-only discounts",
      ],
      priority: "high",
    },
    "Potential Loyalists": {
      description: "Recent customers showing promise",
      actions: [
        "Offer membership programs",
        "Recommend popular products",
        "Send personalized emails",
      ],
      priority: "medium",
    },
    "New Customers": {
      description: "Recently acquired customers",
      actions: [
        "Provide onboarding support",
        "Build brand awareness",
        "Offer starter bundles",
      ],
      priority: "medium",
    },
    Promising: {
      description: "Recent customers with decent spend",
      actions: [
        "Create brand awareness",
        "Offer free trials or samples",
        "Build engagement",
      ],
      priority: "medium",
    },
    "Need Attention": {
      description: "Average customers who need engagement",
      actions: [
        "Make limited time offers",
        "Recommend based on purchase history",
        "Reactivate with special promotions",
      ],
      priority: "medium",
    },
    "About to Sleep": {
      description: "Declining engagement - act soon",
      actions: [
        "Win-back campaigns",
        "Share valuable resources",
        "Reconnect via survey",
      ],
      priority: "high",
    },
    "At Risk": {
      description: "Good customers who haven't purchased recently",
      actions: [
        "Send personalized reactivation emails",
        "Special win-back discounts",
        "Gather feedback on why they stopped",
      ],
      priority: "high",
    },
    "Cannot Lose Them": {
      description: "Best customers at risk of churning",
      actions: [
        "Urgent win-back offers",
        "Personal outreach from management",
        "Understand their concerns",
        "Premium incentives to return",
      ],
      priority: "high",
    },
    Hibernating: {
      description: "Long time since purchase, low engagement",
      actions: [
        "Automated reactivation campaigns",
        "Consider different channels",
        "Last-chance special offers",
      ],
      priority: "low",
    },
    Lost: {
      description: "Unlikely to return",
      actions: [
        "Aggressive last-attempt campaigns",
        "Revive interest with new products",
        "Consider removing from active lists",
      ],
      priority: "low",
    },
  };

  return recommendations[segment];
}

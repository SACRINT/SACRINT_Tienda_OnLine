// Fraud Detection
// Detect and prevent fraudulent transactions

export interface FraudSignal {
  type: string;
  score: number;
  description: string;
}

export interface FraudCheckResult {
  score: number; // 0-100, higher = more risky
  decision: "allow" | "review" | "block";
  signals: FraudSignal[];
  recommendations: string[];
}

export interface TransactionData {
  amount: number;
  currency: string;
  userId: string;
  email: string;
  ip: string;
  userAgent: string;
  shippingAddress: {
    country: string;
    postalCode: string;
  };
  billingAddress: {
    country: string;
    postalCode: string;
  };
  cardBin?: string;
  isNewCustomer: boolean;
  previousOrders: number;
  cartItems: number;
}

// Check transaction for fraud
export function checkFraud(data: TransactionData): FraudCheckResult {
  const signals: FraudSignal[] = [];
  let score = 0;

  // High value transaction
  if (data.amount > 10000) {
    signals.push({
      type: "high_value",
      score: 20,
      description: "Transaction amount exceeds $10,000",
    });
    score += 20;
  } else if (data.amount > 5000) {
    signals.push({
      type: "elevated_value",
      score: 10,
      description: "Transaction amount exceeds $5,000",
    });
    score += 10;
  }

  // New customer with high value
  if (data.isNewCustomer && data.amount > 1000) {
    signals.push({
      type: "new_customer_high_value",
      score: 15,
      description: "New customer with high-value order",
    });
    score += 15;
  }

  // Address mismatch
  if (data.shippingAddress.country !== data.billingAddress.country) {
    signals.push({
      type: "address_country_mismatch",
      score: 25,
      description: "Shipping and billing countries differ",
    });
    score += 25;
  }

  // Large number of items
  if (data.cartItems > 20) {
    signals.push({
      type: "large_cart",
      score: 10,
      description: "Cart contains more than 20 items",
    });
    score += 10;
  }

  // Suspicious email patterns
  if (data.email.match(/\+.*@/)) {
    signals.push({
      type: "email_alias",
      score: 5,
      description: "Email uses alias pattern",
    });
    score += 5;
  }

  // Determine decision
  let decision: FraudCheckResult["decision"];
  const recommendations: string[] = [];

  if (score >= 60) {
    decision = "block";
    recommendations.push("High fraud risk - block transaction");
    recommendations.push("Consider manual review before processing");
  } else if (score >= 30) {
    decision = "review";
    recommendations.push("Moderate fraud risk - manual review recommended");
    if (signals.some((s) => s.type === "address_country_mismatch")) {
      recommendations.push("Verify shipping address with customer");
    }
    if (signals.some((s) => s.type === "new_customer_high_value")) {
      recommendations.push("Consider phone verification for new customer");
    }
  } else {
    decision = "allow";
    recommendations.push("Low fraud risk - allow transaction");
  }

  return {
    score: Math.min(100, score),
    decision,
    signals,
    recommendations,
  };
}

// Check for velocity abuse
export async function checkVelocity(
  identifier: string,
  windowMs: number,
  maxAttempts: number,
): Promise<{ allowed: boolean; attempts: number }> {
  // Implementation would use cache to track attempts
  // Simplified version
  return { allowed: true, attempts: 1 };
}

// Check if IP is in blocklist
export function isBlockedIp(ip: string): boolean {
  const blocklist = (process.env.BLOCKED_IPS || "").split(",").filter(Boolean);
  return blocklist.includes(ip);
}

// Check if email domain is disposable
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    "tempmail.com",
    "throwaway.email",
    "guerrillamail.com",
    "mailinator.com",
    "10minutemail.com",
  ];

  const domain = email.split("@")[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

// Risk scoring factors
export const RISK_FACTORS = {
  HIGH_VALUE_THRESHOLD: 5000,
  NEW_CUSTOMER_HIGH_VALUE_THRESHOLD: 1000,
  LARGE_CART_THRESHOLD: 20,
  VELOCITY_WINDOW_MS: 3600000, // 1 hour
  MAX_ORDERS_PER_HOUR: 5,
};

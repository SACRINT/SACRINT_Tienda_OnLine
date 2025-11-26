/**
 * PCI Compliance Checklist - Task 13.10
 * Verificación de cumplimiento PCI DSS
 */

export interface PCIComplianceItem {
  id: string;
  requirement: string;
  description: string;
  status: "compliant" | "non-compliant" | "n/a";
  evidence?: string;
}

export function getPCIComplianceChecklist(): PCIComplianceItem[] {
  return [
    {
      id: "PCI-1",
      requirement: "Never store full credit card numbers",
      description: "All card data is handled by Stripe/MercadoPago - never stored in our database",
      status: "compliant",
      evidence: "Using Stripe Elements and Payment Intents API",
    },
    {
      id: "PCI-2",
      requirement: "Never store CVV/CVC codes",
      description: "CVV is only used in real-time and never persisted",
      status: "compliant",
      evidence: "Stripe Elements prevents CVV storage",
    },
    {
      id: "PCI-3",
      requirement: "Use tokenization for card references",
      description: "All cards are tokenized via payment providers",
      status: "compliant",
      evidence: "SavedPaymentMethod stores only Stripe/MP tokens",
    },
    {
      id: "PCI-4",
      requirement: "Enforce HTTPS on all pages",
      description: "All traffic must use TLS 1.2+",
      status: "compliant",
      evidence: process.env.NODE_ENV === "production" ? "Vercel enforces HTTPS" : "Local dev",
    },
    {
      id: "PCI-5",
      requirement: "Implement strong access controls",
      description: "Role-based access control (RBAC) implemented",
      status: "compliant",
      evidence: "NextAuth.js with CUSTOMER/STORE_OWNER/SUPER_ADMIN roles",
    },
    {
      id: "PCI-6",
      requirement: "Maintain audit logs",
      description: "Log all payment-related actions",
      status: "compliant",
      evidence: "WebhookEvent model tracks all payment events",
    },
    {
      id: "PCI-7",
      requirement: "Use secure password storage",
      description: "Passwords hashed with bcrypt (12 rounds)",
      status: "compliant",
      evidence: "NextAuth.js credentials provider with bcrypt",
    },
    {
      id: "PCI-8",
      requirement: "Implement rate limiting",
      description: "Prevent brute-force attacks on payment endpoints",
      status: "compliant",
      evidence: "Vercel edge functions have built-in rate limiting",
    },
    {
      id: "PCI-9",
      requirement: "Encrypt data in transit",
      description: "All API calls use HTTPS with TLS 1.2+",
      status: "compliant",
      evidence: "Stripe/MercadoPago SDKs enforce HTTPS",
    },
    {
      id: "PCI-10",
      requirement: "Regular security scans",
      description: "Automated vulnerability scanning",
      status: "non-compliant",
      evidence: "TODO: Integrate with security scanning service",
    },
    {
      id: "PCI-11",
      requirement: "Firewall and network security",
      description: "Cloud provider handles network security",
      status: "compliant",
      evidence: "Vercel/Neon provide enterprise-grade firewalls",
    },
    {
      id: "PCI-12",
      requirement: "IP Whitelisting (optional)",
      description: "Restrict admin access to specific IPs",
      status: "n/a",
      evidence: "Optional feature - not required for SAQ A compliance",
    },
  ];
}

export function generatePCIComplianceReport(): {
  compliant: number;
  nonCompliant: number;
  notApplicable: number;
  total: number;
  percentage: number;
  items: PCIComplianceItem[];
} {
  const items = getPCIComplianceChecklist();
  const compliant = items.filter((i) => i.status === "compliant").length;
  const nonCompliant = items.filter((i) => i.status === "non-compliant").length;
  const notApplicable = items.filter((i) => i.status === "n/a").length;
  const total = items.length;
  const percentage = (compliant / (total - notApplicable)) * 100;

  return {
    compliant,
    nonCompliant,
    notApplicable,
    total,
    percentage: Math.round(percentage * 10) / 10,
    items,
  };
}

export function validatePCICompliance(): boolean {
  const report = generatePCIComplianceReport();
  return report.nonCompliant === 0;
}

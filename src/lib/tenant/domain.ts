// Domain Management
// Custom domains and subdomains for tenants

import { db } from "@/lib/db";
import { cache } from "@/lib/cache/cache-service";

export interface DomainConfig {
  domain: string;
  type: "subdomain" | "custom";
  tenantId: string;
  verified: boolean;
  sslEnabled: boolean;
  verificationToken?: string;
}

// Base domain for subdomains
const BASE_DOMAIN = process.env.BASE_DOMAIN || "sacrint.com";

// Reserved subdomains
const RESERVED_SUBDOMAINS = [
  "www",
  "app",
  "api",
  "admin",
  "dashboard",
  "mail",
  "email",
  "ftp",
  "cdn",
  "static",
  "assets",
  "help",
  "support",
  "blog",
  "docs",
  "status",
];

// Check if subdomain is available
export async function isSubdomainAvailable(
  subdomain: string,
): Promise<boolean> {
  // Check reserved
  if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
    return false;
  }

  // Check format
  if (
    !/^[a-z0-9-]+$/.test(subdomain) ||
    subdomain.length < 3 ||
    subdomain.length > 63
  ) {
    return false;
  }

  // Check database
  const existing = await db.tenant.findFirst({
    where: { subdomain },
  });

  return !existing;
}

// Get subdomain URL
export function getSubdomainUrl(subdomain: string): string {
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
  return protocol + "://" + subdomain + "." + BASE_DOMAIN;
}

// Parse domain from request
export function parseDomain(host: string): {
  subdomain?: string;
  customDomain?: string;
  isBaseDomain: boolean;
} {
  // Remove port
  const domain = host.split(":")[0];

  // Check if it's the base domain
  if (domain === BASE_DOMAIN || domain === "www." + BASE_DOMAIN) {
    return { isBaseDomain: true };
  }

  // Check if it's a subdomain
  if (domain.endsWith("." + BASE_DOMAIN)) {
    const subdomain = domain.replace("." + BASE_DOMAIN, "");
    return { subdomain, isBaseDomain: false };
  }

  // It's a custom domain
  return { customDomain: domain, isBaseDomain: false };
}

// Add custom domain to tenant
export async function addCustomDomain(
  tenantId: string,
  domain: string,
): Promise<DomainConfig> {
  // Generate verification token
  const verificationToken = generateVerificationToken();

  // Update tenant
  await db.tenant.update({
    where: { id: tenantId },
    data: {
      customDomain: domain,
      domainVerified: false,
      domainVerificationToken: verificationToken,
    },
  });

  return {
    domain,
    type: "custom",
    tenantId,
    verified: false,
    sslEnabled: false,
    verificationToken,
  };
}

// Verify custom domain
export async function verifyCustomDomain(tenantId: string): Promise<boolean> {
  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
    select: {
      customDomain: true,
      domainVerificationToken: true,
    },
  });

  if (!tenant?.customDomain || !tenant.domainVerificationToken) {
    return false;
  }

  // Check DNS TXT record
  const verified = await checkDnsVerification(
    tenant.customDomain,
    tenant.domainVerificationToken,
  );

  if (verified) {
    await db.tenant.update({
      where: { id: tenantId },
      data: { domainVerified: true },
    });

    // Invalidate cache
    await cache.delete("tenant:" + tenantId);
  }

  return verified;
}

// Remove custom domain
export async function removeCustomDomain(tenantId: string): Promise<void> {
  await db.tenant.update({
    where: { id: tenantId },
    data: {
      customDomain: null,
      domainVerified: false,
      domainVerificationToken: null,
    },
  });

  await cache.delete("tenant:" + tenantId);
}

// Get domain verification instructions
export function getVerificationInstructions(
  domain: string,
  token: string,
): {
  type: string;
  name: string;
  value: string;
  instructions: string[];
} {
  return {
    type: "TXT",
    name: "_sacrint-verification." + domain,
    value: token,
    instructions: [
      "Accede al panel de control de tu proveedor de DNS",
      "Añade un nuevo registro TXT",
      'Nombre: _sacrint-verification." + domain',
      "Valor: " + token,
      "Espera unos minutos para la propagación DNS",
      "Regresa aquí y haz clic en Verificar",
    ],
  };
}

// Check DNS verification (simplified)
async function checkDnsVerification(
  domain: string,
  token: string,
): Promise<boolean> {
  try {
    // In production, use DNS lookup
    // For now, return false (requires manual verification)
    const response = await fetch(
      "https://dns.google/resolve?name=_sacrint-verification." +
        domain +
        "&type=TXT",
    );
    const data = await response.json();

    if (data.Answer) {
      return data.Answer.some((record: { data: string }) =>
        record.data.includes(token),
      );
    }

    return false;
  } catch (error) {
    console.error("DNS verification failed:", error);
    return false;
  }
}

// Generate verification token
function generateVerificationToken(): string {
  return (
    "sacrint-verify-" +
    Date.now().toString(36) +
    Math.random().toString(36).substring(2)
  );
}

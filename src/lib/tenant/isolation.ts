// Tenant Isolation Utilities
// Ensures complete data isolation between tenants

import { db } from "@/lib/db";
import { cache } from "@/lib/cache/cache-service";
import { TenantConfig } from "./config";

// Tenant context for current request
let currentTenantId: string | null = null;

// Set current tenant context
export function setTenantContext(tenantId: string): void {
  currentTenantId = tenantId;
}

// Get current tenant context
export function getTenantContext(): string | null {
  return currentTenantId;
}

// Clear tenant context
export function clearTenantContext(): void {
  currentTenantId = null;
}

// Require tenant context (throws if not set)
export function requireTenantContext(): string {
  if (!currentTenantId) {
    throw new Error("Tenant context not set");
  }
  return currentTenantId;
}

// Get tenant by ID
export async function getTenantById(
  tenantId: string,
): Promise<TenantConfig | null> {
  const cacheKey = "tenant:" + tenantId;
  const cached = await cache.get<TenantConfig>(cacheKey);
  if (cached) return cached;

  const tenant = await db.tenant.findUnique({
    where: { id: tenantId },
  });

  if (!tenant) return null;

  const config: TenantConfig = {
    id: tenant.id,
    slug: tenant.slug,
    name: tenant.name,
    domain: tenant.customDomain || undefined,
    subdomain: tenant.subdomain || undefined,
    settings: (tenant.settings as TenantConfig["settings"]) || {},
    branding: (tenant.branding as TenantConfig["branding"]) || {},
    limits: (tenant.limits as TenantConfig["limits"]) || {},
    features: (tenant.features as string[]) || [],
    status: tenant.status as TenantConfig["status"],
    plan: tenant.plan as TenantConfig["plan"],
    createdAt: tenant.createdAt,
  };

  await cache.set(cacheKey, config, { ttl: 300 }); // 5 min cache
  return config;
}

// Get tenant by slug
export async function getTenantBySlug(
  slug: string,
): Promise<TenantConfig | null> {
  const tenant = await db.tenant.findUnique({
    where: { slug },
  });

  if (!tenant) return null;
  return getTenantById(tenant.id);
}

// Get tenant by domain
export async function getTenantByDomain(
  domain: string,
): Promise<TenantConfig | null> {
  // Check for custom domain
  const byCustomDomain = await db.tenant.findFirst({
    where: { customDomain: domain },
  });

  if (byCustomDomain) {
    return getTenantById(byCustomDomain.id);
  }

  // Check for subdomain
  const subdomain = domain.split(".")[0];
  const bySubdomain = await db.tenant.findFirst({
    where: { subdomain },
  });

  if (bySubdomain) {
    return getTenantById(bySubdomain.id);
  }

  return null;
}

// Validate tenant access for a user
export async function validateTenantAccess(
  userId: string,
  tenantId: string,
): Promise<boolean> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { tenantId: true, role: true },
  });

  if (!user) return false;

  // Super admins have access to all tenants
  if (user.role === "SUPER_ADMIN") return true;

  // Users can only access their own tenant
  return user.tenantId === tenantId;
}

// Check if tenant has feature
export async function hasTenantFeature(
  tenantId: string,
  feature: string,
): Promise<boolean> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) return false;

  return tenant.features.includes(feature);
}

// Check tenant limits
export async function checkTenantLimit(
  tenantId: string,
  resource: keyof TenantConfig["limits"],
  currentCount: number,
): Promise<{ allowed: boolean; limit: number; current: number }> {
  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    return { allowed: false, limit: 0, current: currentCount };
  }

  const limit = tenant.limits[resource];

  // -1 means unlimited
  if (limit === -1) {
    return { allowed: true, limit: -1, current: currentCount };
  }

  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}

// Get tenant resource counts
export async function getTenantResourceCounts(
  tenantId: string,
): Promise<Record<string, number>> {
  const [products, categories, orders, users] = await Promise.all([
    db.product.count({ where: { tenantId } }),
    db.category.count({ where: { tenantId } }),
    db.order.count({ where: { tenantId } }),
    db.user.count({ where: { tenantId } }),
  ]);

  return {
    products,
    categories,
    orders,
    users,
  };
}

// Invalidate tenant cache
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await cache.delete("tenant:" + tenantId);
}

// Middleware helper for tenant isolation
export function withTenantIsolation<T extends { tenantId?: string }>(
  query: T,
): T & { tenantId: string } {
  const tenantId = requireTenantContext();
  return { ...query, tenantId };
}

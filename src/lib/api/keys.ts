// @ts-nocheck
// API Key Management
// Generate and validate API keys for external access

import { db } from "@/lib/db";
import { randomBytes, createHash } from "crypto";

export interface ApiKey {
  id: string;
  tenantId: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  rateLimit: number;
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  createdBy: string;
  isActive: boolean;
}

// Generate a new API key
export async function generateApiKey(
  tenantId: string,
  name: string,
  createdBy: string,
  options?: {
    permissions?: string[];
    rateLimit?: number;
    expiresAt?: Date;
  }
): Promise<{ key: string; apiKey: ApiKey }> {
  // Generate random key
  const keyBytes = randomBytes(32);
  const key = "sk_live_" + keyBytes.toString("base64url");

  // Hash key for storage
  const keyHash = hashKey(key);
  const keyPrefix = key.substring(0, 12);

  const record = await db.apiKey.create({
    data: {
      tenantId,
      name,
      keyHash,
      keyPrefix,
      permissions: options?.permissions || ["*"],
      rateLimit: options?.rateLimit || 1000,
      expiresAt: options?.expiresAt,
      createdBy,
      isActive: true,
    },
  });

  return {
    key, // Only returned once, not stored
    apiKey: {
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
      keyPrefix: record.keyPrefix,
      permissions: record.permissions as string[],
      rateLimit: record.rateLimit,
      expiresAt: record.expiresAt || undefined,
      lastUsedAt: record.lastUsedAt || undefined,
      createdAt: record.createdAt,
      createdBy: record.createdBy,
      isActive: record.isActive,
    },
  };
}

// Validate API key
export async function validateApiKey(
  key: string
): Promise<{ valid: boolean; apiKey?: ApiKey; error?: string }> {
  if (!key.startsWith("sk_live_")) {
    return { valid: false, error: "Invalid key format" };
  }

  const keyHash = hashKey(key);

  const record = await db.apiKey.findFirst({
    where: { keyHash },
  });

  if (!record) {
    return { valid: false, error: "Key not found" };
  }

  if (!record.isActive) {
    return { valid: false, error: "Key is inactive" };
  }

  if (record.expiresAt && record.expiresAt < new Date()) {
    return { valid: false, error: "Key has expired" };
  }

  // Update last used
  await db.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    valid: true,
    apiKey: {
      id: record.id,
      tenantId: record.tenantId,
      name: record.name,
      keyPrefix: record.keyPrefix,
      permissions: record.permissions as string[],
      rateLimit: record.rateLimit,
      expiresAt: record.expiresAt || undefined,
      lastUsedAt: new Date(),
      createdAt: record.createdAt,
      createdBy: record.createdBy,
      isActive: record.isActive,
    },
  };
}

// List API keys for tenant
export async function listApiKeys(tenantId: string): Promise<ApiKey[]> {
  const records = await db.apiKey.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
  });

  return records.map((r) => ({
    id: r.id,
    tenantId: r.tenantId,
    name: r.name,
    keyPrefix: r.keyPrefix,
    permissions: r.permissions as string[],
    rateLimit: r.rateLimit,
    expiresAt: r.expiresAt || undefined,
    lastUsedAt: r.lastUsedAt || undefined,
    createdAt: r.createdAt,
    createdBy: r.createdBy,
    isActive: r.isActive,
  }));
}

// Revoke API key
export async function revokeApiKey(keyId: string): Promise<void> {
  await db.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });
}

// Delete API key
export async function deleteApiKey(keyId: string): Promise<void> {
  await db.apiKey.delete({
    where: { id: keyId },
  });
}

// Hash key for storage
function hashKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

// Check if API key has permission
export function apiKeyHasPermission(
  apiKey: ApiKey,
  permission: string
): boolean {
  if (apiKey.permissions.includes("*")) {
    return true;
  }

  return apiKey.permissions.includes(permission);
}

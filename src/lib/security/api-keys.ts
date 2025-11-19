// API Key Management
// Secure API key generation and validation

import { z } from "zod";
import { hash, tokens } from "./encryption";

// API key schema
export const ApiKeySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  keyHash: z.string(), // Hashed key
  keyPrefix: z.string(), // First few chars for identification
  tenantId: z.string().uuid(),
  userId: z.string().uuid(), // Creator
  scopes: z.array(z.string()),
  rateLimit: z.number().optional(),
  expiresAt: z.date().optional(),
  lastUsedAt: z.date().optional(),
  createdAt: z.date(),
  revokedAt: z.date().optional(),
});

export type ApiKey = z.infer<typeof ApiKeySchema>;

// API key scopes
export type ApiKeyScope =
  | "products:read"
  | "products:write"
  | "orders:read"
  | "orders:write"
  | "customers:read"
  | "customers:write"
  | "analytics:read"
  | "webhooks:manage";

// API key validation result
export interface ApiKeyValidationResult {
  valid: boolean;
  apiKey?: ApiKey;
  error?: string;
}

// API key store interface
export interface ApiKeyStore {
  create(apiKey: ApiKey): Promise<void>;
  findByHash(keyHash: string): Promise<ApiKey | null>;
  findByPrefix(prefix: string): Promise<ApiKey[]>;
  findByTenant(tenantId: string): Promise<ApiKey[]>;
  update(id: string, data: Partial<ApiKey>): Promise<void>;
  delete(id: string): Promise<void>;
}

// In-memory store
export class InMemoryApiKeyStore implements ApiKeyStore {
  private keys = new Map<string, ApiKey>();

  async create(apiKey: ApiKey): Promise<void> {
    this.keys.set(apiKey.id, apiKey);
  }

  async findByHash(keyHash: string): Promise<ApiKey | null> {
    for (const key of this.keys.values()) {
      if (key.keyHash === keyHash) {
        return key;
      }
    }
    return null;
  }

  async findByPrefix(prefix: string): Promise<ApiKey[]> {
    return Array.from(this.keys.values()).filter(
      (k) => k.keyPrefix === prefix
    );
  }

  async findByTenant(tenantId: string): Promise<ApiKey[]> {
    return Array.from(this.keys.values()).filter(
      (k) => k.tenantId === tenantId && !k.revokedAt
    );
  }

  async update(id: string, data: Partial<ApiKey>): Promise<void> {
    const key = this.keys.get(id);
    if (key) {
      this.keys.set(id, { ...key, ...data });
    }
  }

  async delete(id: string): Promise<void> {
    this.keys.delete(id);
  }
}

// API key manager
export class ApiKeyManager {
  private store: ApiKeyStore;
  private prefix: string;

  constructor(store?: ApiKeyStore, prefix: string = "sk") {
    this.store = store || new InMemoryApiKeyStore();
    this.prefix = prefix;
  }

  // Generate new API key
  async create(data: {
    name: string;
    tenantId: string;
    userId: string;
    scopes: ApiKeyScope[];
    rateLimit?: number;
    expiresAt?: Date;
  }): Promise<{ apiKey: ApiKey; rawKey: string }> {
    // Generate random key
    const randomPart = tokens.generate(32);
    const rawKey = `${this.prefix}_${randomPart}`;
    const keyPrefix = rawKey.slice(0, 8);
    const keyHash = await hash.sha256(rawKey);

    const apiKey: ApiKey = {
      id: crypto.randomUUID(),
      name: data.name,
      keyHash,
      keyPrefix,
      tenantId: data.tenantId,
      userId: data.userId,
      scopes: data.scopes,
      rateLimit: data.rateLimit,
      expiresAt: data.expiresAt,
      createdAt: new Date(),
    };

    await this.store.create(apiKey);

    return { apiKey, rawKey };
  }

  // Validate API key
  async validate(rawKey: string): Promise<ApiKeyValidationResult> {
    // Basic format check
    if (!rawKey.startsWith(`${this.prefix}_`)) {
      return { valid: false, error: "Invalid key format" };
    }

    // Hash the key
    const keyHash = await hash.sha256(rawKey);

    // Find by hash
    const apiKey = await this.store.findByHash(keyHash);

    if (!apiKey) {
      return { valid: false, error: "Invalid API key" };
    }

    // Check if revoked
    if (apiKey.revokedAt) {
      return { valid: false, error: "API key has been revoked" };
    }

    // Check expiration
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return { valid: false, error: "API key has expired" };
    }

    // Update last used
    await this.store.update(apiKey.id, { lastUsedAt: new Date() });

    return { valid: true, apiKey };
  }

  // Check if key has scope
  hasScope(apiKey: ApiKey, scope: ApiKeyScope): boolean {
    return apiKey.scopes.includes(scope);
  }

  // Check if key has any of the scopes
  hasAnyScope(apiKey: ApiKey, scopes: ApiKeyScope[]): boolean {
    return scopes.some((s) => apiKey.scopes.includes(s));
  }

  // Revoke API key
  async revoke(id: string): Promise<void> {
    await this.store.update(id, { revokedAt: new Date() });
  }

  // List keys for tenant
  async listForTenant(tenantId: string): Promise<ApiKey[]> {
    return this.store.findByTenant(tenantId);
  }

  // Delete API key
  async delete(id: string): Promise<void> {
    await this.store.delete(id);
  }
}

// Create default manager
export const apiKeyManager = new ApiKeyManager();

// Middleware helper
export async function validateApiKey(
  request: Request
): Promise<ApiKeyValidationResult> {
  // Check Authorization header
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    return { valid: false, error: "No authorization header" };
  }

  // Support both "Bearer" and "Api-Key" prefixes
  let rawKey: string;

  if (authHeader.startsWith("Bearer ")) {
    rawKey = authHeader.slice(7);
  } else if (authHeader.startsWith("Api-Key ")) {
    rawKey = authHeader.slice(8);
  } else {
    return { valid: false, error: "Invalid authorization format" };
  }

  return apiKeyManager.validate(rawKey);
}

// Require API key with scope
export async function requireApiKey(
  request: Request,
  requiredScopes?: ApiKeyScope[]
): Promise<ApiKey> {
  const result = await validateApiKey(request);

  if (!result.valid || !result.apiKey) {
    throw new Error(result.error || "Invalid API key");
  }

  if (requiredScopes && requiredScopes.length > 0) {
    const hasRequired = apiKeyManager.hasAnyScope(result.apiKey, requiredScopes);
    if (!hasRequired) {
      throw new Error("Insufficient API key scope");
    }
  }

  return result.apiKey;
}

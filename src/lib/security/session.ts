// Session Management
// Secure session handling

import { z } from "zod";

// Session data schema
export const SessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  tenantId: z.string().optional(),
  role: z.enum(["SUPER_ADMIN", "STORE_OWNER", "CUSTOMER"]),
  expiresAt: z.date(),
  createdAt: z.date(),
  lastActivityAt: z.date(),
  ip: z.string().optional(),
  userAgent: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
});

export type Session = z.infer<typeof SessionSchema>;

// Session configuration
export interface SessionConfig {
  maxAge: number; // Session lifetime in seconds
  renewThreshold: number; // Renew when this much time remaining
  absoluteMaxAge: number; // Maximum lifetime even with renewal
  cookieName: string;
  secureCookie: boolean;
  sameSite: "strict" | "lax" | "none";
}

const defaultConfig: SessionConfig = {
  maxAge: 24 * 60 * 60, // 24 hours
  renewThreshold: 60 * 60, // 1 hour
  absoluteMaxAge: 7 * 24 * 60 * 60, // 7 days
  cookieName: "session",
  secureCookie: process.env.NODE_ENV === "production",
  sameSite: "lax",
};

// Session store interface
export interface SessionStore {
  create(session: Session): Promise<void>;
  get(id: string): Promise<Session | null>;
  update(id: string, data: Partial<Session>): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
  listByUserId(userId: string): Promise<Session[]>;
}

// In-memory session store
export class InMemorySessionStore implements SessionStore {
  private sessions = new Map<string, Session>();

  async create(session: Session): Promise<void> {
    this.sessions.set(session.id, session);
  }

  async get(id: string): Promise<Session | null> {
    const session = this.sessions.get(id);
    if (!session) return null;

    // Check expiration
    if (session.expiresAt < new Date()) {
      this.sessions.delete(id);
      return null;
    }

    return session;
  }

  async update(id: string, data: Partial<Session>): Promise<void> {
    const session = this.sessions.get(id);
    if (session) {
      this.sessions.set(id, { ...session, ...data });
    }
  }

  async delete(id: string): Promise<void> {
    this.sessions.delete(id);
  }

  async deleteByUserId(userId: string): Promise<void> {
    for (const [id, session] of this.sessions.entries()) {
      if (session.userId === userId) {
        this.sessions.delete(id);
      }
    }
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    let count = 0;

    for (const [id, session] of this.sessions.entries()) {
      if (session.expiresAt < now) {
        this.sessions.delete(id);
        count++;
      }
    }

    return count;
  }

  async listByUserId(userId: string): Promise<Session[]> {
    return Array.from(this.sessions.values()).filter((s) => s.userId === userId);
  }
}

// Session manager
export class SessionManager {
  private store: SessionStore;
  private config: SessionConfig;

  constructor(store?: SessionStore, config?: Partial<SessionConfig>) {
    this.store = store || new InMemorySessionStore();
    this.config = { ...defaultConfig, ...config };
  }

  // Create new session
  async create(data: {
    userId: string;
    tenantId?: string;
    role: Session["role"];
    ip?: string;
    userAgent?: string;
    data?: Record<string, any>;
  }): Promise<Session> {
    const now = new Date();
    const session: Session = {
      id: crypto.randomUUID(),
      userId: data.userId,
      tenantId: data.tenantId,
      role: data.role,
      expiresAt: new Date(now.getTime() + this.config.maxAge * 1000),
      createdAt: now,
      lastActivityAt: now,
      ip: data.ip,
      userAgent: data.userAgent,
      data: data.data,
    };

    await this.store.create(session);
    return session;
  }

  // Get session by ID
  async get(id: string): Promise<Session | null> {
    return this.store.get(id);
  }

  // Validate and optionally renew session
  async validate(id: string): Promise<Session | null> {
    const session = await this.store.get(id);
    if (!session) return null;

    const now = new Date();
    const timeUntilExpiry = session.expiresAt.getTime() - now.getTime();

    // Check absolute max age
    const age = now.getTime() - session.createdAt.getTime();
    if (age > this.config.absoluteMaxAge * 1000) {
      await this.store.delete(id);
      return null;
    }

    // Renew if within threshold
    if (timeUntilExpiry < this.config.renewThreshold * 1000) {
      const newExpiresAt = new Date(now.getTime() + this.config.maxAge * 1000);
      await this.store.update(id, {
        expiresAt: newExpiresAt,
        lastActivityAt: now,
      });
      session.expiresAt = newExpiresAt;
      session.lastActivityAt = now;
    } else {
      // Just update last activity
      await this.store.update(id, { lastActivityAt: now });
      session.lastActivityAt = now;
    }

    return session;
  }

  // Update session data
  async update(id: string, data: Partial<Session>): Promise<void> {
    await this.store.update(id, data);
  }

  // Destroy session
  async destroy(id: string): Promise<void> {
    await this.store.delete(id);
  }

  // Destroy all sessions for user
  async destroyAllForUser(userId: string): Promise<void> {
    await this.store.deleteByUserId(userId);
  }

  // List all sessions for user
  async listForUser(userId: string): Promise<Session[]> {
    return this.store.listByUserId(userId);
  }

  // Cleanup expired sessions
  async cleanup(): Promise<number> {
    return this.store.deleteExpired();
  }

  // Generate session cookie
  generateCookie(session: Session): string {
    const options = [
      `${this.config.cookieName}=${session.id}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=${this.config.sameSite}`,
      `Max-Age=${this.config.maxAge}`,
    ];

    if (this.config.secureCookie) {
      options.push("Secure");
    }

    return options.join("; ");
  }

  // Parse session ID from cookie
  parseSessionId(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const sessionCookie = cookies.find((c) => c.startsWith(`${this.config.cookieName}=`));

    if (!sessionCookie) return null;

    return sessionCookie.split("=")[1];
  }

  // Generate logout cookie
  generateLogoutCookie(): string {
    return `${this.config.cookieName}=; Path=/; HttpOnly; Max-Age=0`;
  }
}

// Create default session manager
export const sessionManager = new SessionManager();

// Middleware helper
export async function getSession(request: Request): Promise<Session | null> {
  const cookieHeader = request.headers.get("cookie");
  const sessionId = sessionManager.parseSessionId(cookieHeader);

  if (!sessionId) return null;

  return sessionManager.validate(sessionId);
}

// Require session middleware
export async function requireSession(request: Request): Promise<Session> {
  const session = await getSession(request);

  if (!session) {
    throw new Error("Session required");
  }

  return session;
}

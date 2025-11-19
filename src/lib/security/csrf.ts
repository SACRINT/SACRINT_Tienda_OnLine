// CSRF Protection Utilities

import { cookies } from "next/headers";

// CSRF token configuration
const CSRF_TOKEN_NAME = "csrf-token";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const TOKEN_LENGTH = 32;

// Generate random token
function generateToken(): string {
  const array = new Uint8Array(TOKEN_LENGTH);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < TOKEN_LENGTH; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Buffer.from(array).toString("hex");
}

// Get or create CSRF token
export async function getCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let token = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!token) {
    token = generateToken();
    cookieStore.set(CSRF_TOKEN_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return token;
}

// Verify CSRF token from request
export async function verifyCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (headerToken && timingSafeEqual(headerToken, cookieToken)) {
    return true;
  }

  // Check form data for multipart forms
  const contentType = request.headers.get("content-type");
  if (contentType?.includes("multipart/form-data")) {
    try {
      const formData = await request.formData();
      const formToken = formData.get(CSRF_TOKEN_NAME) as string;
      if (formToken && timingSafeEqual(formToken, cookieToken)) {
        return true;
      }
    } catch {
      return false;
    }
  }

  // Check JSON body
  if (contentType?.includes("application/json")) {
    try {
      const body = await request.json();
      const bodyToken = body[CSRF_TOKEN_NAME] as string;
      if (bodyToken && timingSafeEqual(bodyToken, cookieToken)) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

// CSRF middleware for API routes
export async function withCsrfProtection<T>(
  request: Request,
  handler: () => Promise<T>,
): Promise<T | Response> {
  // Skip CSRF check for safe methods
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return handler();
  }

  const isValid = await verifyCsrfToken(request);
  if (!isValid) {
    return new Response(
      JSON.stringify({
        error: "Token CSRF inválido",
        message:
          "La solicitud no pudo ser verificada. Por favor recarga la página.",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return handler();
}

// Client-side: Get CSRF token from cookie
export function getClientCsrfToken(): string | null {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === CSRF_TOKEN_NAME) {
      return value;
    }
  }

  return null;
}

// Add CSRF token to fetch request
export function addCsrfHeader(headers: HeadersInit = {}): HeadersInit {
  const token = getClientCsrfToken();
  if (token) {
    return {
      ...headers,
      [CSRF_HEADER_NAME]: token,
    };
  }
  return headers;
}

// Create fetch wrapper with CSRF protection
export function csrfFetch(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  return fetch(url, {
    ...options,
    headers: addCsrfHeader(options.headers),
  });
}

// Hook for React components
export function useCsrfToken() {
  const token = getClientCsrfToken();

  return {
    token,
    headerName: CSRF_HEADER_NAME,
    inputName: CSRF_TOKEN_NAME,
    fetch: csrfFetch,
    headers: token ? { [CSRF_HEADER_NAME]: token } : {},
  };
}

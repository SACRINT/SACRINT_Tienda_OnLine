// API Testing Helpers
// Week 23-24: Utilities for testing API routes

import { NextRequest } from "next/server";

/**
 * Create mock NextRequest for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    cookies?: Record<string, string>;
  } = {},
): NextRequest {
  const { method = "GET", headers = {}, body, cookies = {} } = options;

  const req = new NextRequest(url, {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  });

  // Mock cookies
  Object.entries(cookies).forEach(([name, value]) => {
    req.cookies.set(name, value);
  });

  return req;
}

/**
 * Mock authenticated session
 */
export function mockSession(userId: string, role: string = "CUSTOMER") {
  return {
    user: {
      id: userId,
      email: `user-${userId}@test.com`,
      name: `Test User ${userId}`,
      role,
    },
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Test API response status
 */
export async function expectStatus(
  response: Response,
  expectedStatus: number,
) {
  if (response.status !== expectedStatus) {
    const body = await response.text();
    throw new Error(
      `Expected status ${expectedStatus}, got ${response.status}. Body: ${body}`,
    );
  }
}

/**
 * Test API response JSON
 */
export async function expectJson(
  response: Response,
  expectedData: Record<string, any>,
) {
  const data = await response.json();
  
  Object.entries(expectedData).forEach(([key, value]) => {
    if (data[key] !== value) {
      throw new Error(
        `Expected ${key} to be ${value}, got ${data[key]}`,
      );
    }
  });

  return data;
}

/**
 * Mock database queries for testing
 */
export const mockDb = {
  product: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  order: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

/**
 * Clear all mocks
 */
export function clearMocks() {
  Object.values(mockDb).forEach((model) => {
    Object.values(model).forEach((fn) => {
      if (typeof fn.mockClear === "function") {
        fn.mockClear();
      }
    });
  });
}

/** Week 20: E2E Testing Utilities - Tasks 20.1-20.12 */

export function createMockOrder() {
  return {
    id: "test-order-id",
    orderNumber: "ORD-TEST-001",
    status: "PENDING",
    total: 100.00,
    items: [],
  };
}

export function createMockUser() {
  return {
    id: "test-user-id",
    email: "test@example.com",
    role: "CUSTOMER",
  };
}

export async function setupTestDatabase() {
  console.log("Test DB setup");
}

export async function cleanupTestDatabase() {
  console.log("Test DB cleanup");
}

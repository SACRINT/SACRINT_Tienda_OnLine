// Jest setup file
// Runs before each test file

// Import jest-dom matchers for testing-library
require("@testing-library/jest-dom");

// Mock environment variables for testing
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test";
process.env.NEXTAUTH_SECRET = "test-secret-key-for-jest-testing";
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.RESEND_API_KEY = "test-resend-api-key";
process.env.FROM_EMAIL = "test@test.com";
process.env.STRIPE_SECRET_KEY = "sk_test_mock";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_mock";
process.env.BLOB_READ_WRITE_TOKEN = "test-blob-token";

// Extended test timeout for integration tests
jest.setTimeout(30000);

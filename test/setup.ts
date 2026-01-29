import { beforeAll, afterAll, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test.local' });

// Global test setup
beforeAll(() => {
  // Set test environment
  process.env.NODE_ENV = 'test';
});

// Clean up after all tests
afterAll(() => {
  // Add any global cleanup
});

// Reset mocks after each test
afterEach(() => {
  vi.clearAllMocks();
});

import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Load test environment variables BEFORE any other imports
expand(config({ path: '.env.test' }));

// Global test setup
beforeAll(async () => {
    console.log('🚀 Starting test setup...');
    // Database setup would go here in a real app
    // For now, we'll use mocks
});

afterAll(async () => {
    console.log('🧹 Cleaning up tests...');
    // Database cleanup would go here
});

beforeEach(() => {
    // Per-test setup
});

afterEach(() => {
    // Per-test cleanup
});

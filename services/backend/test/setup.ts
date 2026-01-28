import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Load test environment variables BEFORE any other imports
expand(config({ path: '.env.test' }));

// Import after env is loaded
import { closeTestDb, waitForTestDatabase } from './helpers';

// Global test setup
beforeAll(async () => {
    console.log('🚀 Starting test setup...');

    // Wait for database to be ready (optional - enable for integration tests)
    // await waitForTestDatabase();
});

afterAll(async () => {
    console.log('🧹 Cleaning up tests...');

    // Close database connection
    await closeTestDb();
});

beforeEach(() => {
    // Per-test setup
});

afterEach(() => {
    // Per-test cleanup
});

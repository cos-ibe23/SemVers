import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/db/schema';

let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get or create the test database connection
 */
export function getTestDb() {
    if (!testDb) {
        const databaseUrl = process.env.DATABASE_URL;
        if (!databaseUrl) {
            throw new Error('DATABASE_URL not set for test environment');
        }

        testClient = postgres(databaseUrl, {
            max: 1, // Use single connection for tests
        });
        testDb = drizzle(testClient, { schema });
    }
    return testDb;
}

/**
 * Close the test database connection
 */
export async function closeTestDb() {
    if (testClient) {
        await testClient.end();
        testClient = null;
        testDb = null;
    }
}

/**
 * Clean all tables in the test database
 * Call this between tests to ensure isolation
 */
export async function cleanTestDb() {
    const db = getTestDb();

    // Delete in order to respect foreign key constraints
    // Start with junction/child tables, then parent tables
    await db.delete(schema.shipperClients);
    await db.delete(schema.shipperProfiles);
    // Better Auth tables are managed separately, but we can clean them too
    // await db.delete(schema.session);
    // await db.delete(schema.account);
    // await db.delete(schema.verification);
    // await db.delete(schema.user);
}

/**
 * Wait for database to be ready
 */
export async function waitForTestDatabase(maxRetries = 30, retryDelay = 1000): Promise<void> {
    let retries = 0;

    console.log(`🔍 Testing database connection...`);

    while (retries < maxRetries) {
        try {
            const db = getTestDb();
            // Test the connection with a simple query
            await db.execute('SELECT 1');
            console.log('✅ Test database is ready');
            return;
        }
        catch (error) {
            retries++;
            console.log(`⏳ Waiting for database... (attempt ${retries}/${maxRetries})`);

            if (retries >= maxRetries) {
                console.error(`❌ Database connection failed after ${maxRetries} attempts`);
                throw new Error(
                    `Database connection failed after ${maxRetries} attempts. ` +
                    `Last error: ${error instanceof Error ? error.message : String(error)}`
                );
            }

            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

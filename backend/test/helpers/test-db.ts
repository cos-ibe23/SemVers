import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../../src/db/schema';

let testClient: ReturnType<typeof postgres> | null = null;
let testDb: ReturnType<typeof drizzle<typeof schema>> | null = null;

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * Get or create the test database connection
 */
export function getTestDb(): TestDb {
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
 * Deletes in reverse dependency order to respect foreign key constraints
 */
export async function cleanTestDb() {
    const db = getTestDb();

    // Delete in reverse dependency order
    // Child/junction tables first, then parent tables

    // Notification tables
    await db.delete(schema.emailLogs);
    await db.delete(schema.notifications);
    await db.delete(schema.notificationSettings);

    // Invoice tables
    await db.delete(schema.invoices);

    // Pickup-related tables
    await db.delete(schema.pickupCodes);
    await db.delete(schema.items);
    await db.delete(schema.pickups);
    await db.delete(schema.pickupTemplates);

    // Pickup request tables
    await db.delete(schema.paymentProofs);
    await db.delete(schema.pickupRequests);

    // Shipment tables
    await db.delete(schema.boxShipments);
    await db.delete(schema.shipments);
    await db.delete(schema.boxes);

    // Other tables
    await db.delete(schema.imeiScans);
    await db.delete(schema.fxRates);
    await db.delete(schema.shipperPaymentMethods);

    // Shipper-client relationship
    await db.delete(schema.shipperClients);

    // Better Auth tables (user is parent of many)
    await db.delete(schema.session);
    await db.delete(schema.account);
    await db.delete(schema.verification);
    await db.delete(schema.user);
}

/**
 * Wait for database to be ready
 */
export async function waitForTestDatabase(maxRetries = 30, retryDelay = 1000): Promise<void> {
    let retries = 0;

    while (retries < maxRetries) {
        try {
            const db = getTestDb();
            await db.execute('SELECT 1');
            return;
        } catch {
            retries++;
            if (retries >= maxRetries) {
                throw new Error(`Database connection failed after ${maxRetries} attempts`);
            }
            await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
    }
}

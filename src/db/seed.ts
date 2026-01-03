/**
 * Database Seed Script
 *
 * Creates test data for local development.
 * Run with: npm run db:seed
 */

import { db, closeDatabase } from './index';
import { user, session, shipperClients, fxRates } from './schema';
import { logger } from '../lib/logger';
import { UserRoles } from '../permissions/types';
import { Currency } from '../constants/enums';

// Generate deterministic UUIDs for seed data (using crypto.randomUUID)
// These are generated once and stored as constants for reproducibility
const userIds = {
    systemAdmin: crypto.randomUUID(),
    admin: crypto.randomUUID(),
    shipper1: crypto.randomUUID(),
    shipper2: crypto.randomUUID(),
    client1: crypto.randomUUID(),
    client2: crypto.randomUUID(),
    client3: crypto.randomUUID(),
    client4: crypto.randomUUID(),
    client5: crypto.randomUUID(),
    client6: crypto.randomUUID(),
    client7: crypto.randomUUID(),
};

const sessionIds = {
    admin: crypto.randomUUID(),
    shipper1: crypto.randomUUID(),
    shipper2: crypto.randomUUID(),
    client1: crypto.randomUUID(),
};

async function seed() {
    logger.info('Starting database seed...');

    try {
        // Create system admin user (the single highest authority user)
        logger.info('Creating system user...');
        await db
            .insert(user)
            .values({
                id: userIds.systemAdmin,
                name: 'System Admin',
                email: 'system@imbod.internal',
                emailVerified: true,
                role: UserRoles.ADMIN,
                isSystemUser: true,
            })
            .onConflictDoNothing();
        logger.info('Created system admin user');

        // Create test users (admin, shippers, and clients)
        logger.info('Creating users...');

        // Admin user (regular admin for testing, not the system user)
        await db
            .insert(user)
            .values({
                id: userIds.admin,
                name: 'Admin User',
                email: 'admin@imbod.test',
                emailVerified: true,
                role: UserRoles.ADMIN,
                isSystemUser: false,
            })
            .onConflictDoNothing();

        // Shipper users (with business fields for onboarded shippers)
        await db
            .insert(user)
            .values({
                id: userIds.shipper1,
                name: 'Test Shipper',
                email: 'shipper@imbod.test',
                emailVerified: true,
                role: UserRoles.SHIPPER,
                businessName: 'Test Shipping Co',
                street: '123 Main St',
                city: 'Lagos',
                state: 'Lagos',
                country: 'Nigeria',
                phoneCountryCode: '+234',
                phoneNumber: '8012345678',
                requestSlug: 'test-shipping-co',
                onboardedAt: new Date(),
            })
            .onConflictDoNothing();

        await db
            .insert(user)
            .values({
                id: userIds.shipper2,
                name: 'Jane Shipper',
                email: 'jane@imbod.test',
                emailVerified: true,
                role: UserRoles.SHIPPER,
                businessName: "Jane's Logistics",
                street: '456 Commerce Ave',
                city: 'Abuja',
                state: 'FCT',
                country: 'Nigeria',
                phoneCountryCode: '+234',
                phoneNumber: '9098765432',
                requestSlug: 'janes-logistics',
                onboardedAt: new Date(),
            })
            .onConflictDoNothing();

        // Client users
        const clientUsers = [
            { id: userIds.client1, name: 'John Doe', email: 'john@example.com' },
            { id: userIds.client2, name: 'Jane Smith', email: 'janesmith@example.com' },
            { id: userIds.client3, name: 'Bob Wilson', email: 'bob@example.com' },
            { id: userIds.client4, name: 'Alice Brown', email: 'alice@example.com' },
            { id: userIds.client5, name: 'Charlie Davis', email: 'charlie@example.com' },
            { id: userIds.client6, name: 'Michael Johnson', email: 'michael@example.com' },
            { id: userIds.client7, name: 'Sarah Lee', email: 'sarah@example.com' },
        ];

        for (const client of clientUsers) {
            await db
                .insert(user)
                .values({
                    ...client,
                    emailVerified: false,
                    role: UserRoles.CLIENT,
                })
                .onConflictDoNothing();
        }

        logger.info({ adminCount: 3, clientCount: clientUsers.length }, 'Created admin/shipper users and client users');

        // Create shipper-client relationships
        logger.info('Creating shipper-client relationships...');

        // Shipper 1's clients
        const shipper1Clients = [
            { clientId: userIds.client1, nickname: 'Johnny', phone: '+1234567890' },
            { clientId: userIds.client2, nickname: null, phone: '+0987654321' },
            { clientId: userIds.client3, nickname: 'Bob W', phone: '+1122334455' },
            { clientId: userIds.client4, nickname: null, phone: '+5544332211' },
            { clientId: userIds.client5, nickname: 'Charlie D', phone: null },
        ];

        for (const client of shipper1Clients) {
            await db
                .insert(shipperClients)
                .values({
                    shipperId: userIds.shipper1,
                    clientId: client.clientId,
                    nickname: client.nickname,
                    phone: client.phone,
                })
                .onConflictDoNothing();
        }

        // Shipper 2's clients
        const shipper2Clients = [
            { clientId: userIds.client6, nickname: 'Mike', phone: '+2233445566' },
            { clientId: userIds.client7, nickname: null, phone: '+6655443322' },
        ];

        for (const client of shipper2Clients) {
            await db
                .insert(shipperClients)
                .values({
                    shipperId: userIds.shipper2,
                    clientId: client.clientId,
                    nickname: client.nickname,
                    phone: client.phone,
                })
                .onConflictDoNothing();
        }

        logger.info({ shipper1Clients: shipper1Clients.length, shipper2Clients: shipper2Clients.length }, 'Created shipper-client relationships');

        // Create FX rates (per-shipper, multi-currency)
        logger.info('Creating FX rates...');

        // Shipper 1's FX rates
        const shipper1FxRates = [
            { ownerUserId: userIds.shipper1, fromCurrency: Currency.USD, toCurrency: Currency.NGN, rate: '1600.000000', isActive: true },
            { ownerUserId: userIds.shipper1, fromCurrency: Currency.GBP, toCurrency: Currency.NGN, rate: '2000.000000', isActive: true },
        ];

        // Shipper 2's FX rates
        const shipper2FxRates = [
            { ownerUserId: userIds.shipper2, fromCurrency: Currency.USD, toCurrency: Currency.NGN, rate: '1580.000000', isActive: true },
        ];

        for (const rate of [...shipper1FxRates, ...shipper2FxRates]) {
            await db.insert(fxRates).values(rate).onConflictDoNothing();
        }

        logger.info({ count: shipper1FxRates.length + shipper2FxRates.length }, 'Created FX rates');

        // Create test sessions for easy API testing
        logger.info('Creating test sessions...');

        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

        const sessionsData = [
            {
                id: sessionIds.admin,
                userId: userIds.admin,
                token: 'test-admin-token-123',
                expiresAt: oneWeekFromNow,
            },
            {
                id: sessionIds.shipper1,
                userId: userIds.shipper1,
                token: 'test-shipper-token-123',
                expiresAt: oneWeekFromNow,
            },
            {
                id: sessionIds.shipper2,
                userId: userIds.shipper2,
                token: 'test-shipper2-token-123',
                expiresAt: oneWeekFromNow,
            },
            {
                id: sessionIds.client1,
                userId: userIds.client1,
                token: 'test-client-token-123',
                expiresAt: oneWeekFromNow,
            },
        ];

        const createdSessions = await db.insert(session).values(sessionsData).onConflictDoNothing().returning();

        logger.info({ count: createdSessions.length }, 'Created test sessions');

        logger.info('Seed completed successfully!');

        logger.info({
            testCredentials: {
                admin: { email: 'admin@imbod.test', token: 'test-admin-token-123' },
                shipper1: { email: 'shipper@imbod.test', token: 'test-shipper-token-123', business: 'Test Shipping Co', slug: 'test-shipping-co' },
                shipper2: { email: 'jane@imbod.test', token: 'test-shipper2-token-123', business: "Jane's Logistics", slug: 'janes-logistics' },
                client: { email: 'john@example.com', token: 'test-client-token-123' },
            },
        }, 'Test credentials (use token in Authorization: Bearer header)');
    } catch (error) {
        logger.error({ error }, 'Seed failed');
        throw error;
    } finally {
        await closeDatabase();
    }
}

seed().catch((error) => {
    logger.error({ error }, 'Seed script error');
    process.exit(1);
});

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

async function seed() {
    logger.info('Starting database seed...');

    try {
        // Create system admin user (the single highest authority user)
        logger.info('Creating system user...');
        await db
            .insert(user)
            .values({
                id: 'system-admin',
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
                id: 'admin-001',
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
                id: 'shipper-001',
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
                id: 'shipper-002',
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
            { id: 'client-001', name: 'John Doe', email: 'john@example.com' },
            { id: 'client-002', name: 'Jane Smith', email: 'janesmith@example.com' },
            { id: 'client-003', name: 'Bob Wilson', email: 'bob@example.com' },
            { id: 'client-004', name: 'Alice Brown', email: 'alice@example.com' },
            { id: 'client-005', name: 'Charlie Davis', email: 'charlie@example.com' },
            { id: 'client-006', name: 'Michael Johnson', email: 'michael@example.com' },
            { id: 'client-007', name: 'Sarah Lee', email: 'sarah@example.com' },
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
            { clientId: 'client-001', nickname: 'Johnny', phone: '+1234567890' },
            { clientId: 'client-002', nickname: null, phone: '+0987654321' },
            { clientId: 'client-003', nickname: 'Bob W', phone: '+1122334455' },
            { clientId: 'client-004', nickname: null, phone: '+5544332211' },
            { clientId: 'client-005', nickname: 'Charlie D', phone: null },
        ];

        for (const client of shipper1Clients) {
            await db
                .insert(shipperClients)
                .values({
                    shipperId: 'shipper-001',
                    clientId: client.clientId,
                    nickname: client.nickname,
                    phone: client.phone,
                })
                .onConflictDoNothing();
        }

        // Shipper 2's clients
        const shipper2Clients = [
            { clientId: 'client-006', nickname: 'Mike', phone: '+2233445566' },
            { clientId: 'client-007', nickname: null, phone: '+6655443322' },
        ];

        for (const client of shipper2Clients) {
            await db
                .insert(shipperClients)
                .values({
                    shipperId: 'shipper-002',
                    clientId: client.clientId,
                    nickname: client.nickname,
                    phone: client.phone,
                })
                .onConflictDoNothing();
        }

        logger.info({ shipper1Clients: shipper1Clients.length, shipper2Clients: shipper2Clients.length }, 'Created shipper-client relationships');

        // Create FX rates
        logger.info('Creating FX rates...');

        const fxRatesData = [
            { buyRateUsdNgn: '1580.00', clientRateUsdNgn: '1620.00', atmFeePer990Usd: '5.00' },
            { buyRateUsdNgn: '1590.00', clientRateUsdNgn: '1630.00', atmFeePer990Usd: '5.00' },
            { buyRateUsdNgn: '1600.00', clientRateUsdNgn: '1650.00', atmFeePer990Usd: '5.50' },
        ];

        const createdFxRates = await db.insert(fxRates).values(fxRatesData).onConflictDoNothing().returning();

        logger.info({ count: createdFxRates.length }, 'Created FX rates');

        // Create test sessions for easy API testing
        logger.info('Creating test sessions...');

        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

        const sessionsData = [
            {
                id: 'session-admin-001',
                userId: 'admin-001',
                token: 'test-admin-token-123',
                expiresAt: oneWeekFromNow,
            },
            {
                id: 'session-shipper-001',
                userId: 'shipper-001',
                token: 'test-shipper-token-123',
                expiresAt: oneWeekFromNow,
            },
            {
                id: 'session-shipper-002',
                userId: 'shipper-002',
                token: 'test-shipper2-token-123',
                expiresAt: oneWeekFromNow,
            },
            {
                id: 'session-client-001',
                userId: 'client-001',
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

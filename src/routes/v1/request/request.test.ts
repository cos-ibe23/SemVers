import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestApp, getTestDb, cleanTestDb, closeTestDb, mockAuthMiddleware } from '@test/helpers';
import { createUserFactory, UserFactory, type User } from '@test/factories';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { pickupRequests } from '../../../db/schema/pickup-requests';
import v1PublicRequestRouter from './request.index';
import { eq } from 'drizzle-orm';
import { fxRates } from '../../../db/schema/fx-rates';

describe('Public Request API', () => {
    const db = getTestDb();
    let app: ReturnType<typeof createTestApp>;
    let userFactory: UserFactory;
    
    let shipper: User;
    let client: User;
    const shipperSlug = 'test-shipper-slug';

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);
        app = createTestApp();
        
        // Create Shippers
        shipper = await userFactory.createShipper({
            requestSlug: shipperSlug,
            businessName: 'Test Shipper Business',
            onboardedAt: new Date(),
        });

        // Create Client
        client = await userFactory.createClient({
            email: 'client@example.com',
            name: 'Test Client',
        });

        // Set active FX rates for shipper
        await db.insert(fxRates).values({
            ownerUserId: shipper.id,
            fromCurrency: 'USD',
            toCurrency: 'NGN',
            costRate: '1500',
            clientRate: '1600',
            isActive: true,
        });
        
        // Mount router with mocked auth (defaulting to client)
        app.use('*', mockAuthMiddleware(client));
        app.route('/', v1PublicRequestRouter);
    });

    afterAll(async () => {
        await closeTestDb();
    });

    it('should create a request for logged-in client', async () => {
        const payload = {
            numberOfItems: 5,
            meetupLocation: 'Lagos',
            pickupTime: new Date().toISOString(),
            // Intentionally omit name/email or provide garbage to verify override
            name: 'Wrong Name',
            email: 'wrong@example.com',
        };

        const response = await app.request(`/request/${shipperSlug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        expect(response.status).toBe(HttpStatusCodes.CREATED);
        const body = await response.json();
        expect(body.clientUserId).toBe(client.id);
        expect(body.shipperUserId).toBe(shipper.id);
        // Verify profile data was used
        expect(body.clientName).toBe(client.name);
        expect(body.clientEmail).toBe(client.email);
        expect(body.status).toBe('PENDING');
    });

    it('should return 401 if not logged in', async () => {
        // Create new app instance without auth middleware for this test?
        // Or override middleware?
        // Easies way is to recreate app
        app = createTestApp();
        app.route('/', v1PublicRequestRouter);

        const payload = {
            numberOfItems: 1,
            meetupLocation: 'Nowhere',
            pickupTime: new Date().toISOString(),
        };

        const response = await app.request(`/request/${shipperSlug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
    });

    it('should return 404 for unknown shipper slug', async () => {
         const payload = {
            numberOfItems: 1,
            meetupLocation: 'Nowhere',
            pickupTime: new Date().toISOString(),
        };

        const response = await app.request(`/request/invalid-slug`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
    });
});

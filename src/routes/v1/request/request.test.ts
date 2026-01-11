import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import { createUserFactory, UserFactory, type User } from '@test/factories';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { fxRates } from '../../../db/schema/fx-rates';
import { user } from '../../../db/schema/auth'; // For role update
import { eq } from 'drizzle-orm';

describe('Public Request API (Integration)', () => {
    const db = getTestDb();
    const app = createIntegrationTestApp();
    let userFactory: UserFactory;
    
    let shipper: User;
    let clientAuth: { headers: Record<string, string>, user: any };
    const shipperSlug = 'test-shipper-slug';

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);
        
        // Create Shipper (Target)
        shipper = await userFactory.createShipper({
            requestSlug: shipperSlug,
            businessName: 'Test Shipper Business',
            onboardedAt: new Date(),
        });

        // Create Client (Logged in user)
        clientAuth = await signupAndLogin('client@example.com', 'Test Client');
        
        // Update client role to CLIENT (signup defaults to SHIPPER)
        await db.update(user)
            .set({ role: 'CLIENT' })
            .where(eq(user.id, clientAuth.user.id));
        clientAuth.user.role = 'CLIENT'; // Update local object

        // Set active FX rates for shipper
        await db.insert(fxRates).values({
            ownerUserId: shipper.id,
            fromCurrency: 'USD',
            toCurrency: 'NGN',
            costRate: '1500',
            clientRate: '1600',
            isActive: true,
        });
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

        const response = await app.request(`/v1/request/${shipperSlug}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...clientAuth.headers 
            },
            body: JSON.stringify(payload),
        });

        expect(response.status).toBe(HttpStatusCodes.CREATED);
        const body = await response.json();
        expect(body.clientUserId).toBe(clientAuth.user.id);
        expect(body.shipperUserId).toBe(shipper.id);
        // Verify profile data was used
        expect(body.clientName).toBe(clientAuth.user.name);
        expect(body.clientEmail).toBe(clientAuth.user.email);
        expect(body.status).toBe('PENDING');
    });

    it('should return 401 if not logged in', async () => {
        const payload = {
            numberOfItems: 1,
            meetupLocation: 'Nowhere',
            pickupTime: new Date().toISOString(),
        };

        const response = await app.request(`/v1/request/${shipperSlug}`, {
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

        const response = await app.request(`/v1/request/invalid-slug`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...clientAuth.headers
            },
            body: JSON.stringify(payload),
        });

        expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
    });
});

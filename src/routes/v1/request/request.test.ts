import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import { createUserFactory, UserFactory, type User } from '@test/factories';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { PickupRequestStatus } from '../../../constants/enums';
import { fxRates } from '../../../db/schema/fx-rates';
import { user } from '../../../db/schema/auth';
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
        expect(body.status).toBe(PickupRequestStatus.PENDING);
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

    it('should accept links/imeis as arrays and store correctly', async () => {
        const payload = {
            numberOfItems: 3,
            meetupLocation: 'Lagos',
            pickupTime: new Date().toISOString(),
            links: ['https://example.com/1', 'https://example.com/2'],
            serialOrImeis: ['123456789012345', '987654321098765'],
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
        expect(body.links).toEqual(['https://example.com/1', 'https://example.com/2']);
        expect(body.serialOrImeis).toEqual(['123456789012345', '987654321098765']);
    });

    it('should accept links/imeis as comma-separated strings and store as arrays', async () => {
        const payload = {
            numberOfItems: 2,
            meetupLocation: 'Abuja',
            pickupTime: new Date().toISOString(),
            links: 'https://example.com/a, https://example.com/b',
            serialOrImeis: '11111, 22222',
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
        expect(body.links).toEqual(['https://example.com/a', 'https://example.com/b']);
        expect(body.serialOrImeis).toEqual(['11111', '22222']);
    });
    it('should create pickup from request and update request status', async () => {
        // 1. Create a request
        const requestPayload = {
            numberOfItems: 1,
            meetupLocation: 'Lagos',
            pickupTime: new Date().toISOString(),
            agreedPrice: 100,
        };

        const reqResponse = await app.request(`/v1/request/${shipperSlug}`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...clientAuth.headers 
            },
            body: JSON.stringify(requestPayload),
        });
        const request = await reqResponse.json();
        expect(reqResponse.status).toBe(HttpStatusCodes.CREATED);

        // Login as shipper to convert
        const shipperAuth = await signupAndLogin('shipper@example.com', 'Shipper User');
        // We reused the factory earlier, but signupAndLogin creates a new user. 
        // We need to act as the OWNER of the request (the shipper created in beforeEach).
        // Let's just create a token for the existing shipper user.
        // Since signupAndLogin is high-level, let's use a workaround:
        // We'll update the request to point to the new 'shipperAuth' user as the shipper
        // This avoids complex auth mocking.
        
        await db.update(user)
            .set({ role: 'SHIPPER' })
            .where(eq(user.id, shipperAuth.user.id));
        
        // Transfer ownership of request to this new shipper
        const { pickupRequests } = await import('../../../db/schema/pickup-requests');
        await db.update(pickupRequests)
            .set({ shipperUserId: shipperAuth.user.id })
            .where(eq(pickupRequests.id, request.id));

        // 2. Create pickup referencing the request
        const pickupPayload = {
            clientUserId: clientAuth.user.id,
            sourceRequestId: request.id,
            pickupFeeUsd: 10,
        };

        const pickupResponse = await app.request('/v1/pickups', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...shipperAuth.headers
            },
            body: JSON.stringify(pickupPayload),
        });

        expect(pickupResponse.status).toBe(HttpStatusCodes.CREATED);
        const pickup = await pickupResponse.json();
        
        expect(pickup.sourceRequestId).toBe(request.id);
        expect(pickup.itemPriceUsd).toBe('100.00'); // Inherited from request
        expect(pickup.pickupFeeUsd).toBe('10.00');

        // 3. Verify request status is updated
        const updatedReqResponse = await app.request(`/v1/pickup-requests/${request.id}`, {
            method: 'GET',
            headers: shipperAuth.headers,
        });
        const updatedRequest = await updatedReqResponse.json();
        expect(updatedRequest.status).toBe(PickupRequestStatus.CONVERTED);
        expect(updatedRequest.convertedPickupId).toBe(pickup.id);
    });
});

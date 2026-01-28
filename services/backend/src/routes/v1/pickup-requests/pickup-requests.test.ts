import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import { createUserFactory, UserFactory, type User } from '@test/factories';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { PickupRequestStatus } from '../../../constants/enums';
import { user } from '../../../db/schema/auth';
import { eq } from 'drizzle-orm';

describe('Privileged Pickup Requests API (Integration)', () => {
    const db = getTestDb();
    const app = createIntegrationTestApp();
    let userFactory: UserFactory;

    let shipperAuth: { headers: Record<string, string>, user: any };
    let clientAuth: { headers: Record<string, string>, user: any };
    let request: any;

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);

        // 1. Create Shipper
        shipperAuth = await signupAndLogin('shipper@test.com', 'Test Shipper');
        await db.update(user).set({ role: 'SHIPPER' }).where(eq(user.id, shipperAuth.user.id));
        shipperAuth.user.role = 'SHIPPER';

        // 2. Create Client
        clientAuth = await signupAndLogin('client@test.com', 'Test Client');
        await db.update(user).set({ role: 'CLIENT' }).where(eq(user.id, clientAuth.user.id));
        clientAuth.user.role = 'CLIENT';

        // 3. Create a Pickup Request (by Client, targeted at Shipper)
        // We'll use the public endpoint to seed the data as that's the natural flow
        const { pickupRequests } = await import('../../../db/schema/pickup-requests');
        const [seededRequest] = await db.insert(pickupRequests).values({
            shipperUserId: shipperAuth.user.id,
            clientUserId: clientAuth.user.id,
            clientName: clientAuth.user.name,
            clientEmail: clientAuth.user.email,
            numberOfItems: 3,
            meetupLocation: 'Test Location',
            pickupTime: new Date(),
            status: PickupRequestStatus.PENDING,
        }).returning();
        
        request = seededRequest;
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('GET /v1/pickup-requests', () => {
        it('should list pickup requests for the shipper', async () => {
            const response = await app.request('/v1/pickup-requests', {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.data).toHaveLength(1);
            expect(body.data[0].id).toBe(request.id);
        });

        it('should not allow unauthorized listing', async () => {
            const response = await app.request('/v1/pickup-requests', {
                method: 'GET',
                // No headers
            });
            expect(response.status).toBe(HttpStatusCodes.UNAUTHORIZED);
        });
    });

    describe('GET /v1/pickup-requests/:id', () => {
        it('should get pickup request details', async () => {
            const response = await app.request(`/v1/pickup-requests/${request.id}`, {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.id).toBe(request.id);
            expect(body.numberOfItems).toBe(3);
        });

        it('should return 404 for non-existent request', async () => {
            const response = await app.request('/v1/pickup-requests/999999', {
                method: 'GET',
                headers: shipperAuth.headers,
            });
            expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
        });
    });

    describe('PATCH /v1/pickup-requests/:id', () => {
        it('should update pickup request details', async () => {
            const updatePayload = {
                numberOfItems: 5,
                meetupLocation: 'Updated Location',
                status: PickupRequestStatus.REJECTED,
            };

            const response = await app.request(`/v1/pickup-requests/${request.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers,
                },
                body: JSON.stringify(updatePayload),
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.numberOfItems).toBe(5);
            expect(body.meetupLocation).toBe('Updated Location');
            expect(body.status).toBe(PickupRequestStatus.REJECTED);
        });

        it('should not allow updating a CONVERTED request', async () => {
            // Manually set status to CONVERTED
            const { pickupRequests } = await import('../../../db/schema/pickup-requests');
            await db.update(pickupRequests)
                .set({ status: PickupRequestStatus.CONVERTED })
                .where(eq(pickupRequests.id, request.id));

            const response = await app.request(`/v1/pickup-requests/${request.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers,
                },
                body: JSON.stringify({ numberOfItems: 10 }),
            });

            expect(response.status).toBe(HttpStatusCodes.BAD_REQUEST);
        });
    });

    describe('DELETE /v1/pickup-requests/:id', () => {
        it('should delete a pending pickup request', async () => {
            const response = await app.request(`/v1/pickup-requests/${request.id}`, {
                method: 'DELETE',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            
            // Verify deletion
            const getResponse = await app.request(`/v1/pickup-requests/${request.id}`, {
                method: 'GET',
                headers: shipperAuth.headers,
            });
            expect(getResponse.status).toBe(HttpStatusCodes.NOT_FOUND);
        });

        it('should not allow deleting a CONVERTED request', async () => {
            // Manually set status to CONVERTED
            const { pickupRequests } = await import('../../../db/schema/pickup-requests');
            await db.update(pickupRequests)
                .set({ status: PickupRequestStatus.CONVERTED })
                .where(eq(pickupRequests.id, request.id));

            const response = await app.request(`/v1/pickup-requests/${request.id}`, {
                method: 'DELETE',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.BAD_REQUEST);
        });
    });
});

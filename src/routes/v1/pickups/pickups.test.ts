import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { items } from '../../../db/schema/items';
import { pickupRequests } from '../../../db/schema/pickup-requests';
import { pickups } from '../../../db/schema/pickups';
import { eq } from 'drizzle-orm';
import { PickupStatus, PickupRequestStatus } from '../../../constants/enums';
import { user } from '../../../db/schema/auth';

describe('Pickups API (Integration)', () => {
    const db = getTestDb();
    const app = createIntegrationTestApp();

    let shipperAuth: { headers: Record<string, string>, user: any };
    let clientAuth: { headers: Record<string, string>, user: any };

    beforeEach(async () => {
        await cleanTestDb();
        const uniqueId = Math.random().toString(36).substring(7);

        // 1. Create Shipper
        shipperAuth = await signupAndLogin(`shipper-${uniqueId}@test.com`, 'Test Shipper');
        await db.update(user).set({ role: 'SHIPPER' }).where(eq(user.id, shipperAuth.user.id));
        shipperAuth.user.role = 'SHIPPER';

        // 2. Create Client
        clientAuth = await signupAndLogin(`client-${uniqueId}@test.com`, 'Test Client');
        await db.update(user).set({ role: 'CLIENT' }).where(eq(user.id, clientAuth.user.id));
        clientAuth.user.role = 'CLIENT';
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('POST /v1/pickups', () => {
        it('should create a self-pickup (no client)', async () => {
            const payload = {
                notes: 'Self pickup test',
                pickupDate: new Date().toISOString().split('T')[0],
                itemPriceUsd: 150,
            };

            const response = await app.request('/v1/pickups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.CREATED);
            const body = await response.json();
            expect(body.ownerUserId).toBe(shipperAuth.user.id);
            expect(body.clientUserId).toBeNull();
            expect(body.itemPriceUsd).toBe('150.00');
            expect(body.status).toBe(PickupStatus.DRAFT);
            expect(body.totalPriceUsd).toBe('150.00');
        });

        it('should create a pickup with nested items', async () => {
            const payload = {
                clientUserId: clientAuth.user.id,
                itemPriceUsd: 500, // Overall price
                items: [
                    { category: 'Laptop', model: 'MacBook Pro', estimatedWeightLb: 5, clientShippingUsd: 50 },
                    { category: 'Phone', model: 'iPhone 15', estimatedWeightLb: 1, clientShippingUsd: 20 },
                ],
            };

            const response = await app.request('/v1/pickups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.CREATED);
            const pickup = await response.json();
            expect(pickup.itemPriceUsd).toBe('500.00');

            // Verify items in DB
            const createdItems = await db.select().from(items).where(eq(items.pickupId, pickup.id));
            expect(createdItems).toHaveLength(2);
            expect(createdItems.find(i => i.category === 'Laptop')).toBeDefined();
            expect(createdItems.find(i => i.category === 'Phone')).toBeDefined();

            // Verify Total Price
            // itemPriceUsd (500) + itemsClientShipping (50 + 20) + pickupFeeUsd (0)
            expect(pickup.totalPriceUsd).toBe('570.00');

            // Verify Total Weight
            // 5 + 1 = 6
            expect(pickup.totalWeightLb).toBe('6.00');
        });

        it('should create a pickup from a source request and update status', async () => {
            // Seed request
            const [request] = await db.insert(pickupRequests).values({
                shipperUserId: shipperAuth.user.id,
                clientUserId: clientAuth.user.id,
                clientName: 'Test Client',
                numberOfItems: 1,
                meetupLocation: 'Lagos',
                pickupTime: new Date(),
                agreedPrice: '200',
                status: PickupRequestStatus.PENDING,
            }).returning();

            const payload = {
                sourceRequestId: request.id,
                // Client ID implied from request
            };

            const response = await app.request('/v1/pickups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.CREATED);
            const pickup = await response.json();
            expect(pickup.sourceRequestId).toBe(request.id);
            expect(pickup.itemPriceUsd).toBe('200.00'); // Inherited

            // Verify request status
            const [updatedRequest] = await db.select().from(pickupRequests).where(eq(pickupRequests.id, request.id));
            expect(updatedRequest.status).toBe(PickupRequestStatus.CONVERTED);
            expect(updatedRequest.convertedPickupId).toBe(pickup.id);
        });
    });

    describe('GET /v1/pickups/:id', () => {
        it('should get pickup details', async () => {
            const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                clientUserId: clientAuth.user.id,
                status: PickupStatus.DRAFT,
            }).returning();

            const response = await app.request(`/v1/pickups/${pickup.id}`, {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.id).toBe(pickup.id);
        });

        it('should return 404 for non-existent pickup', async () => {
            const response = await app.request('/v1/pickups/999999', {
                method: 'GET',
                headers: shipperAuth.headers,
            });
            expect(response.status).toBe(HttpStatusCodes.NOT_FOUND);
        });
    });

    describe('PATCH /v1/pickups/:id', () => {
        it('should update pickup fields', async () => {
            const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                clientUserId: clientAuth.user.id,
                itemPriceUsd: '100',
                status: PickupStatus.DRAFT,
            }).returning();

            const updatePayload = {
                itemPriceUsd: 200,
                notes: 'Updated notes',
            };

            const response = await app.request(`/v1/pickups/${pickup.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(updatePayload),
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.itemPriceUsd).toBe('200.00');
            expect(body.notes).toBe('Updated notes');
        });

        it('should add and update items', async () => {
            // 1. Create pickup with 1 item
            const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                clientUserId: clientAuth.user.id,
                status: PickupStatus.DRAFT,
            }).returning();
            
            const [item] = await db.insert(items).values({
                pickupId: pickup.id,
                category: 'Phone',
                clientShippingUsd: '20',
                estimatedWeightLb: '1.5',
            }).returning();

            // 2. Add new item and update existing
            const updatePayload = {
                items: [
                    { id: item.id, category: 'Updated Phone', clientShippingUsd: 30, estimatedWeightLb: 2 }, // Update
                    { category: 'Laptop', clientShippingUsd: 50, estimatedWeightLb: 5.5 } // Create
                ]
            };

            const response = await app.request(`/v1/pickups/${pickup.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(updatePayload),
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            
            expect(body.items).toHaveLength(2);
            const updatedItem = body.items.find((i: any) => i.id === item.id);
            const newItem = body.items.find((i: any) => i.id !== item.id);

            expect(updatedItem.category).toBe('Updated Phone');
            expect(updatedItem.clientShippingUsd).toBe('30.00');
            expect(updatedItem.estimatedWeightLb).toBe('2.00');
            
            expect(newItem.category).toBe('Laptop');
            expect(newItem.clientShippingUsd).toBe('50.00');
            expect(newItem.estimatedWeightLb).toBe('5.50');

            // Verify Total Price: PickupFee(0) + ItemPrice(0) + Shipping(30+50) = 80
            expect(body.totalPriceUsd).toBe('80.00');

            // Verify Total Weight: 2 + 5.5 = 7.5
            expect(body.totalWeightLb).toBe('7.50');
        });
    });

    describe('DELETE /v1/pickups/:id', () => {
        it('should delete a draft pickup', async () => {
             const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                clientUserId: clientAuth.user.id,
                status: PickupStatus.DRAFT,
            }).returning();

            const response = await app.request(`/v1/pickups/${pickup.id}`, {
                method: 'DELETE',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);

            const check = await db.select().from(pickups).where(eq(pickups.id, pickup.id));
            expect(check).toHaveLength(0);
        });

        it('should not delete a confirmed pickup', async () => {
             const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                clientUserId: clientAuth.user.id,
                status: PickupStatus.CONFIRMED,
            }).returning();

            const response = await app.request(`/v1/pickups/${pickup.id}`, {
                method: 'DELETE',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.BAD_REQUEST);
        });
    });
});

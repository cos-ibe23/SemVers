import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { boxes } from '../../../db/schema/boxes';
import { items } from '../../../db/schema/items';
import { pickups } from '../../../db/schema/pickups';
import { user } from '../../../db/schema/auth';
import { eq } from 'drizzle-orm';
import { BoxStatus, PickupStatus, ItemStatus } from '../../../constants/enums';

describe('Shipments API (Integration)', () => {
    const db = getTestDb();
    const app = createIntegrationTestApp();

    let shipperAuth: { headers: Record<string, string>, user: any };

    beforeEach(async () => {
        await cleanTestDb();
        const uniqueId = Math.random().toString(36).substring(7);

        // Create Shipper
        shipperAuth = await signupAndLogin(`shipper-${uniqueId}@test.com`, 'Shipper');
        await db.update(user).set({ role: 'SHIPPER' }).where(eq(user.id, shipperAuth.user.id));
        shipperAuth.user.role = 'SHIPPER';
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('POST /v1/shipments', () => {
        it('should create a shipment from an open box', async () => {
            // 1. Create an OPEN box with items
            const [box] = await db.insert(boxes).values({
                ownerUserId: shipperAuth.user.id,
                createdByUserId: shipperAuth.user.id,
                label: 'Box to Ship',
                status: BoxStatus.OPEN,
            }).returning();

            const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                status: PickupStatus.DRAFT,
            }).returning();

            await db.insert(items).values({
                pickupId: pickup.id,
                boxId: box.id,
                category: 'Item',
                status: ItemStatus.IN_BOX,
            });

            // 2. Create Shipment (Mark as SHIPPED)
            const response = await app.request('/v1/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify({ boxId: box.id }),
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.id).toBe(box.id);
            expect(body.status).toBe(BoxStatus.SHIPPED);

            // 3. Verify DB state (Box and Items)
            const [updatedBox] = await db.select().from(boxes).where(eq(boxes.id, box.id));
            expect(updatedBox.status).toBe(BoxStatus.SHIPPED);

            const boxItems = await db.select().from(items).where(eq(items.boxId, box.id));
            expect(boxItems[0].status).toBe(ItemStatus.IN_TRANSIT);
        });

         it('should return 400 or 404 if box does not exist', async () => {
            const response = await app.request('/v1/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify({ boxId: 99999 }),
            });

            // Currently our service might return 500 or 404 depending on implementation of `update`.
            // BoxService.update checks for existence? 
            // If API Error handling is robust, it should be 404.
            // Based on previous refactor, update throws if not found? 
            // Let's check expectation. Ideally 404.
            expect(response.status).toBe(HttpStatusCodes.NOT_FOUND); 
        });
    });

    describe('GET /v1/shipments', () => {
        it('should list only SHIPPED and DELIVERED boxes', async () => {
            // Seed boxes with different statuses
            await db.insert(boxes).values([
                { ownerUserId: shipperAuth.user.id, createdByUserId: shipperAuth.user.id, label: 'Open Box', status: BoxStatus.OPEN },
                { ownerUserId: shipperAuth.user.id, createdByUserId: shipperAuth.user.id, label: 'Sealed Box', status: BoxStatus.SEALED },
                { ownerUserId: shipperAuth.user.id, createdByUserId: shipperAuth.user.id, label: 'Shipped Box', status: BoxStatus.SHIPPED },
                { ownerUserId: shipperAuth.user.id, createdByUserId: shipperAuth.user.id, label: 'Delivered Box', status: BoxStatus.DELIVERED },
            ]);

            const response = await app.request('/v1/shipments', {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body).toHaveLength(2);
            expect(body.map((b: any) => b.label)).toContain('Shipped Box');
            expect(body.map((b: any) => b.label)).toContain('Delivered Box');
            expect(body.map((b: any) => b.label)).not.toContain('Open Box');
        });
    });

    describe('GET /v1/shipments/:id', () => {
        it('should retrieve a shipment by ID', async () => {
            const [box] = await db.insert(boxes).values({
                ownerUserId: shipperAuth.user.id,
                createdByUserId: shipperAuth.user.id,
                label: 'My Shipment',
                status: BoxStatus.SHIPPED,
            }).returning();

            const response = await app.request(`/v1/shipments/${box.id}`, {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.id).toBe(box.id);
            expect(body.label).toBe('My Shipment');
        });
    });

    describe('POST /v1/shipments/:id/deliver', () => {
        it('should mark a shipment as DELIVERED', async () => {
            // Setup SHIPPED box
            const [box] = await db.insert(boxes).values({
                ownerUserId: shipperAuth.user.id,
                createdByUserId: shipperAuth.user.id,
                status: BoxStatus.SHIPPED,
            }).returning();

             // Setup Items
             const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                status: PickupStatus.DRAFT,
            }).returning();

            await db.insert(items).values({
                pickupId: pickup.id,
                boxId: box.id,
                category: 'Test Item',
                status: ItemStatus.IN_TRANSIT,
            });

            const response = await app.request(`/v1/shipments/${box.id}/deliver`, {
                method: 'POST',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.status).toBe(BoxStatus.DELIVERED);

            // Verify DB Side Effects
            const [updatedBox] = await db.select().from(boxes).where(eq(boxes.id, box.id));
            expect(updatedBox.status).toBe(BoxStatus.DELIVERED);
            expect(updatedBox.deliveredAt).not.toBeNull();

            const boxItems = await db.select().from(items).where(eq(items.boxId, box.id));
            expect(boxItems[0].status).toBe(ItemStatus.DELIVERED);
        });
    });
});

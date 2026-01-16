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

describe('Boxes API (Integration)', () => {
    const db = getTestDb();
    const app = createIntegrationTestApp();

    let shipperAuth: { headers: Record<string, string>, user: any };
    let otherShipperAuth: { headers: Record<string, string>, user: any };
    let clientAuth: { headers: Record<string, string>, user: any };

    beforeEach(async () => {
        await cleanTestDb();
        const uniqueId = Math.random().toString(36).substring(7);

        // 1. Create Shipper A
        shipperAuth = await signupAndLogin(`shipper-a-${uniqueId}@test.com`, 'Shipper A');
        await db.update(user).set({ role: 'SHIPPER' }).where(eq(user.id, shipperAuth.user.id));
        shipperAuth.user.role = 'SHIPPER';

        // 2. Create Shipper B
        otherShipperAuth = await signupAndLogin(`shipper-b-${uniqueId}@test.com`, 'Shipper B');
        await db.update(user).set({ role: 'SHIPPER' }).where(eq(user.id, otherShipperAuth.user.id));
        otherShipperAuth.user.role = 'SHIPPER';

        // 3. Create Client
        clientAuth = await signupAndLogin(`client-${uniqueId}@test.com`, 'Client');
        await db.update(user).set({ role: 'CLIENT' }).where(eq(user.id, clientAuth.user.id));
        clientAuth.user.role = 'CLIENT';
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('POST /v1/boxes', () => {
        it('should create a box successfully', async () => {
            const payload = {
                label: 'Test Box 1',
                shipperRatePerLb: 5.5,
                insuranceUsd: 100,
            };

            const response = await app.request('/v1/boxes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.CREATED);
            const body = await response.json();
            expect(body.label).toBe('Test Box 1');
            expect(body.ownerUserId).toBe(shipperAuth.user.id);
            expect(body.createdByUserId).toBe(shipperAuth.user.id);
            expect(body.status).toBe(BoxStatus.OPEN);
        });

        it('should create a box with initial pickups', async () => {
            // Seed a pickup
            const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                clientUserId: clientAuth.user.id,
                status: PickupStatus.DRAFT,
            }).returning();
            
            // Seed items for the pickup
            await db.insert(items).values([
                { pickupId: pickup.id, category: 'Phone', status: ItemStatus.PENDING },
                { pickupId: pickup.id, category: 'Laptop', status: ItemStatus.PENDING },
            ]);

            const payload = {
                label: 'Box with Items',
                pickupIds: [pickup.id],
            };

            const response = await app.request('/v1/boxes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.CREATED);
            const body = await response.json();
            
            // Verify items are in the box
            const boxItems = await db.select().from(items).where(eq(items.boxId, body.id));
            expect(boxItems).toHaveLength(2);
        });
    });

    describe('Box Transfer & Visibility', () => {
        let boxId: number;

        beforeEach(async () => {
            // Create a box owned by Shipper A
            const [box] = await db.insert(boxes).values({
                ownerUserId: shipperAuth.user.id,
                createdByUserId: shipperAuth.user.id,
                label: 'Transferrable Box',
                status: BoxStatus.OPEN,
            }).returning();
            boxId = box.id;
        });

        it('should allow transfer to another shipper via email', async () => {
            const payload = {
                newOwnerEmail: otherShipperAuth.user.email,
            };

            const response = await app.request(`/v1/boxes/${boxId}/transfer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            
            // Verify DB update
            const [updatedBox] = await db.select().from(boxes).where(eq(boxes.id, boxId));
            expect(updatedBox.ownerUserId).toBe(otherShipperAuth.user.id);
            expect(updatedBox.createdByUserId).toBe(shipperAuth.user.id); // Creator remains same
        });

        it('should allow both creator and new owner to view the box', async () => {
            // Transfer first
            await db.update(boxes).set({ ownerUserId: otherShipperAuth.user.id }).where(eq(boxes.id, boxId));

            // Creator (Shipper A) checks
            const respA = await app.request(`/v1/boxes/${boxId}`, {
                method: 'GET',
                headers: shipperAuth.headers,
            });
            expect(respA.status).toBe(HttpStatusCodes.OK);
            const bodyA = await respA.json();
            expect(bodyA.isTransferred).toBe(true);

            // New Owner (Shipper B) checks
            const respB = await app.request(`/v1/boxes/${boxId}`, {
                method: 'GET',
                headers: otherShipperAuth.headers,
            });
            expect(respB.status).toBe(HttpStatusCodes.OK);
        });

        it('should list boxes for both creator and owner', async () => {
             // Transfer first
            await db.update(boxes).set({ ownerUserId: otherShipperAuth.user.id }).where(eq(boxes.id, boxId));

            // Shipper A lists all
            const listA = await app.request('/v1/boxes?filter=all', { headers: shipperAuth.headers });
            const dataA = await listA.json();
            expect(dataA.find((b: any) => b.id === boxId)).toBeDefined();
            expect(dataA.find((b: any) => b.id === boxId).type).toBe('CREATED');

             // Shipper B lists all
            const listB = await app.request('/v1/boxes?filter=all', { headers: otherShipperAuth.headers });
            const dataB = await listB.json();
            expect(dataB.find((b: any) => b.id === boxId)).toBeDefined();
            expect(dataB.find((b: any) => b.id === boxId).type).toBe('TRANSFERRED_IN');
        });
    });

    describe('Status Propagation', () => {
        it('should update item status when box is shipped', async () => {
             const [box] = await db.insert(boxes).values({
                ownerUserId: shipperAuth.user.id,
                createdByUserId: shipperAuth.user.id,
                label: 'Shipping Box',
                status: BoxStatus.OPEN,
            }).returning();

             const [pickup] = await db.insert(pickups).values({
                ownerUserId: shipperAuth.user.id,
                status: PickupStatus.DRAFT,
            }).returning();

            const [item] = await db.insert(items).values({
                pickupId: pickup.id,
                boxId: box.id,
                category: 'Item',
                status: ItemStatus.IN_BOX,
            }).returning();

            // Update box to SHIPPED
            await app.request(`/v1/boxes/${box.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', ...shipperAuth.headers },
                body: JSON.stringify({ status: BoxStatus.SHIPPED }),
            });

            // Check item status
            const [updatedItem] = await db.select().from(items).where(eq(items.id, item.id));
            expect(updatedItem.status).toBe(ItemStatus.IN_TRANSIT);
        });
    });
});


import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestApp, mockAuthMiddleware, getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createUserFactory, UserFactory, type User } from '@test/factories';
import { ITEM_TEMPLATES } from '../../../constants/item-templates';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { pickups } from '../../../db/schema/pickups';
import { items } from '../../../db/schema/items';
import v1ItemsRouter from './items.index';
import { eq } from 'drizzle-orm';

describe('Items API', () => {
    const db = getTestDb();
    let app: ReturnType<typeof createTestApp>;
    let userFactory: UserFactory;
    
    let shipper: User;
    let client: User;
    let pickupId: number;

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);
        app = createTestApp();
        
        shipper = await userFactory.create({ role: 'SHIPPER' });
        client = await userFactory.create({ role: 'CLIENT' });
        
        // Mount router
        app.use('*', mockAuthMiddleware(shipper));
        app.route('/', v1ItemsRouter);

        // Create a pickup
        const [pickup] = await db.insert(pickups).values({
            ownerUserId: shipper.id,
            clientUserId: client.id,
            status: 'DRAFT',
        }).returning();
        pickupId = pickup.id;
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('GET /items/templates', () => {
        it('should return item templates', async () => {
            const response = await app.request('/items/templates', {
                method: 'GET',
            });
    
            expect(response.status).toBe(HttpStatusCodes.OK);
            
            const body = await response.json();
            expect(Array.isArray(body)).toBe(true);
            expect(body).toHaveLength(ITEM_TEMPLATES.length);
            
            expect(body[0]).toMatchObject({
                id: ITEM_TEMPLATES[0].id,
                category: ITEM_TEMPLATES[0].category,
            });
        });
    });

    describe('Item CRUD', () => {
        it('should create an item successfully', async () => {
            const payload = {
                category: 'Phone',
                model: 'iPhone 15',
                imei: '123456789012345',
                // imeiSource removed/optional
                estimatedWeightLb: 0.6,
                clientShippingUsd: 30,
            };

            const response = await app.request(`/pickups/${pickupId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.CREATED);
            const body = await response.json();
            expect(body.category).toBe(payload.category);
            expect(body.model).toBe(payload.model);
            expect(body.pickupId).toBe(pickupId);
            // Status field removed
        });

        it('should create an item with minimal fields (category only)', async () => {
            const payload = {
                category: 'Unknown Thing',
            };

            const response = await app.request(`/pickups/${pickupId}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            expect(response.status).toBe(HttpStatusCodes.CREATED);
            const body = await response.json();
            expect(body.category).toBe(payload.category);
        });

        it('should list items for a pickup', async () => {
            // Create 2 items
            await db.insert(items).values([
                { pickupId, category: 'Item 1' },
                { pickupId, category: 'Item 2' },
            ]);

            const response = await app.request(`/pickups/${pickupId}/items`, {
                method: 'GET',
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body).toHaveLength(2);
        });

        it('should get a single item', async () => {
            const [item] = await db.insert(items).values({
                pickupId,
                category: 'Single Item',
            }).returning();

            const response = await app.request(`/items/${item.id}`, {
                method: 'GET',
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.id).toBe(item.id);
            expect(body.category).toBe('Single Item');
        });

        it('should update an item', async () => {
            const [item] = await db.insert(items).values({
                pickupId,
                category: 'Old Category',
            }).returning();

            const response = await app.request(`/items/${item.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: 'New Category',
                }),
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            const body = await response.json();
            expect(body.category).toBe('New Category');
        });

        it('should delete an item', async () => {
            const [item] = await db.insert(items).values({
                pickupId,
                category: 'To Delete',
            }).returning();

            const response = await app.request(`/items/${item.id}`, {
                method: 'DELETE',
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            
            // Verify DB
            const result = await db.select().from(items).where(eq(items.id, item.id));
            expect(result).toHaveLength(0);
        });
    });
});

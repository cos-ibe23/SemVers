
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import { createUserFactory, UserFactory, type User } from '@test/factories';
import { ITEM_TEMPLATES } from '../../../constants/item-templates';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { pickups } from '../../../db/schema/pickups';
import { items } from '../../../db/schema/items';
import { eq } from 'drizzle-orm';

describe('Items API (Integration)', () => {
    const db = getTestDb();
    const app = createIntegrationTestApp();
    let userFactory: UserFactory;
    
    let shipperAuth: { headers: Record<string, string>, user: any };
    let client: User;
    let pickupId: number;

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);
        
        // 1. Shipper (Logged In)
        shipperAuth = await signupAndLogin('shipper@example.com', 'Test Shipper');
        
        // 2. Client (Target for pickup)
        // Use factory as we don't need to login as client
        client = await userFactory.createClient();
        
        // 3. Create a pickup (Draft)
        const [pickup] = await db.insert(pickups).values({
            ownerUserId: shipperAuth.user.id,
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
            const response = await app.request('/v1/items/templates', {
                method: 'GET',
                headers: shipperAuth.headers,
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

            const response = await app.request(`/v1/pickups/${pickupId}/items`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
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

            const response = await app.request(`/v1/pickups/${pickupId}/items`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
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

            const response = await app.request(`/v1/pickups/${pickupId}/items`, {
                method: 'GET',
                headers: shipperAuth.headers,
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

            const response = await app.request(`/v1/items/${item.id}`, {
                method: 'GET',
                headers: shipperAuth.headers,
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

            const response = await app.request(`/v1/items/${item.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
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

            const response = await app.request(`/v1/items/${item.id}`, {
                method: 'DELETE',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(HttpStatusCodes.OK);
            
            // Verify DB
            const result = await db.select().from(items).where(eq(items.id, item.id));
            expect(result).toHaveLength(0);
        });
    });
});


import { describe, it, expect, beforeEach } from 'vitest';
import { createTestApp, mockAuthMiddleware } from '@test/helpers';
import { ITEM_TEMPLATES } from '../../../constants/item-templates';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import v1ItemsRouter from './items.index';

const mockUser = {
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    role: 'SHIPPER',
    emailVerified: true,
    isSystemUser: false,
    createdAt: new Date(),
    updatedAt: new Date(),
} as any; // Casting to avoid full User type requirement for mock

describe('Items API', () => {
    let app: ReturnType<typeof createTestApp>;

    beforeEach(() => {
        app = createTestApp();
        app.use('*', mockAuthMiddleware(mockUser));
        app.route('/', v1ItemsRouter);
    });

    it('should return item templates', async () => {
        const response = await app.request('/items/templates', {
            method: 'GET',
        });

        expect(response.status).toBe(HttpStatusCodes.OK);
        
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
        expect(body).toHaveLength(ITEM_TEMPLATES.length);
        
        // precise match check for first item
        // Note: JSON response might serialize numbers slightly differently if not careful, but usually matches
        expect(body[0]).toMatchObject({
            id: ITEM_TEMPLATES[0].id,
            category: ITEM_TEMPLATES[0].category,
            estimatedWeightLb: ITEM_TEMPLATES[0].estimatedWeightLb,
            shippingCostUsd: ITEM_TEMPLATES[0].shippingCostUsd,
        });
    });
});

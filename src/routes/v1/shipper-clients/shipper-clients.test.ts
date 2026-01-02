import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestApp, mockAuthMiddleware } from '@test/helpers';
import { userFactory } from '@test/factories';
import * as routes from './shipper-clients.routes';
import * as handlers from './shipper-clients.handlers';

describe('Shipper Clients Routes', () => {
    beforeEach(() => {
        userFactory.clear();
        vi.clearAllMocks();
    });

    describe('GET /clients', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.listClients, handlers.listClients);

            const response = await app.request('/clients', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });
    });

    describe('POST /clients', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.addClient, handlers.addClient);

            const response = await app.request('/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientUserId: 'some-user-id',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should validate request body - requires clientUserId or name+email', async () => {
            const user = userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.addClient, handlers.addClient);

            const response = await app.request('/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            expect(response.status).toBe(422);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        it('should accept valid request with clientUserId', async () => {
            const user = userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.addClient, handlers.addClient);

            const response = await app.request('/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientUserId: 'client-user-123',
                    nickname: 'Test Client',
                }),
            });

            // Will fail at service level (no DB), but validates the route accepts the payload
            // Status will be 404 (client user not found) or 500 (DB error) - not 401 or 422
            expect(response.status).not.toBe(401);
            expect(response.status).not.toBe(422);
        });

        it('should accept valid request with name and email', async () => {
            const user = userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.addClient, handlers.addClient);

            const response = await app.request('/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'New Client',
                    email: 'newclient@example.com',
                }),
            });

            // Will fail at service level (no DB), but validates the route accepts the payload
            expect(response.status).not.toBe(401);
            expect(response.status).not.toBe(422);
        });
    });

    describe('GET /clients/:clientId', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.getClient, handlers.getClient);

            const response = await app.request('/clients/client-123', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
        });
    });

    describe('PATCH /clients/:clientId', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.updateClient, handlers.updateClient);

            const response = await app.request('/clients/client-123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: 'Updated Nickname',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should accept valid update request', async () => {
            const user = userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.updateClient, handlers.updateClient);

            const response = await app.request('/clients/client-123', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: 'Updated Nickname',
                    phone: '+1234567890',
                }),
            });

            // Will fail at service level (no DB), but validates the route accepts the payload
            expect(response.status).not.toBe(401);
            expect(response.status).not.toBe(422);
        });
    });

    describe('DELETE /clients/:clientId', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.removeClient, handlers.removeClient);

            const response = await app.request('/clients/client-123', {
                method: 'DELETE',
            });

            expect(response.status).toBe(401);
        });
    });
});

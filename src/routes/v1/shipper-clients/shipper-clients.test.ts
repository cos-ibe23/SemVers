import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestApp, mockAuthMiddleware, getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createUserFactory, createClientFactory, UserFactory, ClientFactory } from '@test/factories';
import * as routes from './shipper-clients.routes';
import * as handlers from './shipper-clients.handlers';

describe('Shipper Clients Routes', () => {
    const db = getTestDb();
    let userFactory: UserFactory;
    let clientFactory: ClientFactory;

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);
        clientFactory = createClientFactory(db);
        UserFactory.resetCounter();
        ClientFactory.resetCounter();
    });

    afterAll(async () => {
        await closeTestDb();
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

        it('should return empty list when shipper has no clients', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.listClients, handlers.listClients);

            const response = await app.request('/clients', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.data).toEqual([]);
            expect(body.total).toBe(0);
        });

        it('should return clients for shipper', async () => {
            const shipper = await userFactory.createShipper();
            await clientFactory.createForShipper(shipper.id, { name: 'Client A' });
            await clientFactory.createForShipper(shipper.id, { name: 'Client B' });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.listClients, handlers.listClients);

            const response = await app.request('/clients', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.data).toHaveLength(2);
            expect(body.total).toBe(2);
        });

        it('should not return other shippers clients', async () => {
            const shipper1 = await userFactory.createShipper({ email: 'shipper1@test.com' });
            const shipper2 = await userFactory.createShipper({ email: 'shipper2@test.com' });

            await clientFactory.createForShipper(shipper1.id, { name: 'Shipper 1 Client' });
            await clientFactory.createForShipper(shipper2.id, { name: 'Shipper 2 Client' });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper1));
            app.openapi(routes.listClients, handlers.listClients);

            const response = await app.request('/clients', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.data).toHaveLength(1);
            expect(body.data[0].client.name).toBe('Shipper 1 Client');
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
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
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

        it('should add existing client user to shipper', async () => {
            const shipper = await userFactory.createShipper();
            const clientUser = await clientFactory.createUser({ name: 'Existing Client' });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.addClient, handlers.addClient);

            const response = await app.request('/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientUserId: clientUser.id,
                    nickname: 'My Nickname',
                }),
            });

            expect(response.status).toBe(201);
            const body = await response.json();
            expect(body.clientId).toBe(clientUser.id);
            expect(body.nickname).toBe('My Nickname');
            expect(body.client.name).toBe('Existing Client');
        });

        it('should create new client user and add to shipper', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.addClient, handlers.addClient);

            const response = await app.request('/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'New Client',
                    email: 'newclient@example.com',
                    nickname: 'NC',
                }),
            });

            expect(response.status).toBe(201);
            const body = await response.json();
            expect(body.client.name).toBe('New Client');
            expect(body.client.email).toBe('newclient@example.com');
            expect(body.nickname).toBe('NC');
        });

        it('should return 400 if client already added', async () => {
            const shipper = await userFactory.createShipper();
            const { user: clientUser } = await clientFactory.createForShipper(shipper.id);

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.addClient, handlers.addClient);

            const response = await app.request('/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clientUserId: clientUser.id,
                }),
            });

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain('already added');
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

        it('should return 404 for non-existent client', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.getClient, handlers.getClient);

            const response = await app.request('/clients/non-existent-id', {
                method: 'GET',
            });

            expect(response.status).toBe(404);
        });

        it('should return client details', async () => {
            const shipper = await userFactory.createShipper();
            const { user: clientUser } = await clientFactory.createForShipper(shipper.id, {
                name: 'My Client',
                nickname: 'MC',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.getClient, handlers.getClient);

            const response = await app.request(`/clients/${clientUser.id}`, {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.clientId).toBe(clientUser.id);
            expect(body.nickname).toBe('MC');
            expect(body.client.name).toBe('My Client');
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

        it('should update client nickname and phone', async () => {
            const shipper = await userFactory.createShipper();
            const { user: clientUser } = await clientFactory.createForShipper(shipper.id, {
                nickname: 'Old Nickname',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.updateClient, handlers.updateClient);

            const response = await app.request(`/clients/${clientUser.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nickname: 'New Nickname',
                    phone: '+1234567890',
                }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.nickname).toBe('New Nickname');
            expect(body.phone).toBe('+1234567890');
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

        it('should soft delete client relationship', async () => {
            const shipper = await userFactory.createShipper();
            const { user: clientUser } = await clientFactory.createForShipper(shipper.id);

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.removeClient, handlers.removeClient);
            app.openapi(routes.listClients, handlers.listClients);

            // Delete the client
            const deleteResponse = await app.request(`/clients/${clientUser.id}`, {
                method: 'DELETE',
            });
            expect(deleteResponse.status).toBe(200);

            // Verify client no longer appears in list
            const listResponse = await app.request('/clients', {
                method: 'GET',
            });
            const body = await listResponse.json();
            expect(body.data).toHaveLength(0);
        });
    });
});

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestApp, mockAuthMiddleware, getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createUserFactory, UserFactory } from '@test/factories';
import { UserRoles } from '../../../permissions/types';
import * as routes from './auth.routes';
import * as handlers from './auth.handlers';

describe('Auth Routes', () => {
    const db = getTestDb();
    let userFactory: UserFactory;

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);
        UserFactory.resetCounter();
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('GET /auth/me', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.getMe, handlers.getMe);

            const response = await app.request('/auth/me', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        it('should return user without business fields when not onboarded', async () => {
            const user = await userFactory.createShipper({
                name: 'Test User',
                email: 'test@example.com',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.getMe, handlers.getMe);

            const response = await app.request('/auth/me', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();

            expect(body).toHaveProperty('user');
            expect(body.user).toHaveProperty('id', user.id);
            expect(body.user).toHaveProperty('name', 'Test User');
            expect(body.user).toHaveProperty('email', 'test@example.com');
            expect(body.user).toHaveProperty('role', 'SHIPPER');
            expect(body.user).toHaveProperty('businessName', null);
            expect(body.user).toHaveProperty('onboardedAt', null);

            expect(body).toHaveProperty('session');
            expect(body.session).toHaveProperty('userId', user.id);
        });

        it('should return user with business fields when onboarded', async () => {
            const user = await userFactory.createOnboardedShipper({
                name: 'Test User',
                email: 'test@example.com',
                businessName: 'Test Business',
                city: 'Lagos',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.getMe, handlers.getMe);

            const response = await app.request('/auth/me', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();

            expect(body.user.id).toBe(user.id);
            expect(body.user.businessName).toBe('Test Business');
            expect(body.user.city).toBe('Lagos');
            expect(body.user.onboardedAt).not.toBeNull();
        });
    });

    describe('POST /auth/onboard', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.onboard, handlers.onboard);

            const response = await app.request('/auth/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'Test Business',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const user = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.onboard, handlers.onboard);

            const response = await app.request('/auth/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            expect(response.status).toBe(422);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        it('should onboard shipper successfully', async () => {
            const user = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.onboard, handlers.onboard);

            const response = await app.request('/auth/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'New Business',
                    city: 'Lagos',
                    country: 'Nigeria',
                }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.businessName).toBe('New Business');
            expect(body.city).toBe('Lagos');
            expect(body.country).toBe('Nigeria');
            expect(body.requestSlug).toBe('new-business');
            expect(body.onboardedAt).toBeDefined();
        });

        it('should return 400 if already onboarded', async () => {
            const user = await userFactory.createOnboardedShipper({
                businessName: 'Existing Business',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.onboard, handlers.onboard);

            const response = await app.request('/auth/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'New Business',
                }),
            });

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain('already onboarded');
        });

        it('should return 400 if user is not a shipper', async () => {
            const user = await userFactory.createClient();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.onboard, handlers.onboard);

            const response = await app.request('/auth/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'New Business',
                }),
            });

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain('Only shippers');
        });
    });

    describe('PATCH /auth/profile', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.updateProfile, handlers.updateProfile);

            const response = await app.request('/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'Updated Business',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should update user profile successfully', async () => {
            const user = await userFactory.createShipper({
                businessName: 'Old Business',
                city: 'Old City',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.updateProfile, handlers.updateProfile);

            const response = await app.request('/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'Updated Business',
                    city: 'New City',
                }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.businessName).toBe('Updated Business');
            expect(body.city).toBe('New City');
        });

        it('should allow clients to update business fields', async () => {
            const user = await userFactory.createClient({
                name: 'Test Client',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.updateProfile, handlers.updateProfile);

            const response = await app.request('/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'Client Business',
                    city: 'Client City',
                }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.businessName).toBe('Client Business');
            expect(body.city).toBe('Client City');
            expect(body.role).toBe(UserRoles.CLIENT);
        });
    });
});

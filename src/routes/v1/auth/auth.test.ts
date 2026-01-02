import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestApp, mockAuthMiddleware } from '@test/helpers';
import { userFactory } from '@test/factories';
import * as routes from './auth.routes';
import * as handlers from './auth.handlers';

describe('Auth Routes', () => {
    beforeEach(() => {
        userFactory.clear();
        vi.clearAllMocks();
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

        it('should return user and session when authenticated', async () => {
            const user = userFactory.createShipper({
                id: 'test-user-id',
                name: 'Test User',
                email: 'test@example.com',
            });

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));

            // Mock the AuthService to return null profile for unonboarded user
            vi.mock('../../../services', async (importOriginal) => {
                const original = await importOriginal<typeof import('../../../services')>();
                return {
                    ...original,
                    AuthService: class MockAuthService {
                        async getProfile() {
                            return null;
                        }
                    },
                };
            });

            app.openapi(routes.getMe, handlers.getMe);

            const response = await app.request('/auth/me', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();

            expect(body).toHaveProperty('user');
            expect(body.user).toHaveProperty('id', 'test-user-id');
            expect(body.user).toHaveProperty('name', 'Test User');
            expect(body.user).toHaveProperty('email', 'test@example.com');
            expect(body.user).toHaveProperty('role', 'SHIPPER');

            expect(body).toHaveProperty('session');
            expect(body.session).toHaveProperty('userId', 'test-user-id');

            expect(body).toHaveProperty('profile');
        });
    });

    describe('GET /auth/profile', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.getProfile, handlers.getProfile);

            const response = await app.request('/auth/profile', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
        });
    });

    describe('POST /auth/profile/onboard', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.onboardProfile, handlers.onboardProfile);

            const response = await app.request('/auth/profile/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'Test Business',
                    role: 'SHIPPER',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const user = userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(user));
            app.openapi(routes.onboardProfile, handlers.onboardProfile);

            const response = await app.request('/auth/profile/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });

            expect(response.status).toBe(422);
            const body = await response.json();
            expect(body).toHaveProperty('error');
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
    });
});

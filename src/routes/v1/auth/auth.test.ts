import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import { UserRoles } from '../../../permissions/types';

describe('Auth Routes (Integration)', () => {
    const app = createIntegrationTestApp();
    let auth: { headers: Record<string, string>, user: any };

    beforeEach(async () => {
        await cleanTestDb();
        // Create a fresh user for each test
        auth = await signupAndLogin('test@example.com', 'Test User');
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('GET /auth/me', () => {
        it('should return 401 without authentication', async () => {
            const response = await app.request('/v1/auth/me', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        it('should return user without business fields when not onboarded', async () => {
            const response = await app.request('/v1/auth/me', {
                method: 'GET',
                headers: auth.headers,
            });

            expect(response.status).toBe(200);
            const body = await response.json();

            expect(body).toHaveProperty('user');
            expect(body.user).toHaveProperty('id', auth.user.id);
            expect(body.user).toHaveProperty('name', 'Test User');
            expect(body.user).toHaveProperty('email', 'test@example.com');
            // Default role is SHIPPER usually, or whatever default is
            expect(body.user).toHaveProperty('role', 'SHIPPER'); 
            expect(body.user).toHaveProperty('businessName', null);
            expect(body.user).toHaveProperty('onboardedAt', null);

            expect(body).toHaveProperty('session');
            expect(body.session).toHaveProperty('userId', auth.user.id);
        });

        it('should return user with business fields when onboarded', async () => {
            // First onboard via API
            await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...auth.headers 
                },
                body: JSON.stringify({
                    businessName: 'Test Business',
                    city: 'Lagos',
                    country: 'Nigeria'
                }),
            });

            const response = await app.request('/v1/auth/me', {
                method: 'GET',
                headers: auth.headers,
            });

            expect(response.status).toBe(200);
            const body = await response.json();

            expect(body.user.id).toBe(auth.user.id);
            expect(body.user.businessName).toBe('Test Business');
            expect(body.user.city).toBe('Lagos');
            expect(body.user.onboardedAt).not.toBeNull();
        });
    });

    describe('POST /auth/onboard', () => {
        it('should return 401 without authentication', async () => {
            const response = await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'Test Business',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const response = await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...auth.headers 
                },
                body: JSON.stringify({}),
            });

            expect(response.status).toBe(422);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        it('should onboard shipper successfully', async () => {
            const response = await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...auth.headers 
                },
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
            // slug generation logic test
            expect(body.requestSlug).toBe('new-business');
            expect(body.onboardedAt).toBeDefined();
        });

        it('should return 400 if already onboarded', async () => {
            // First onboard
            await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...auth.headers 
                },
                body: JSON.stringify({
                    businessName: 'Existing Business',
                    city: 'Lagos',
                    country: 'Nigeria'
                }),
            });

            // Try again
            const response = await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...auth.headers 
                },
                body: JSON.stringify({
                    businessName: 'New Business',
                }),
            });

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain('already onboarded');
        });

        it('should onboard client successfully', async () => {
            // New user for client test
            const clientAuth = await signupAndLogin('client@example.com', 'Client User');

            const response = await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...clientAuth.headers 
                },
                body: JSON.stringify({
                    businessName: 'Client Business',
                    role: 'CLIENT',
                }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.role).toBe('CLIENT');
            expect(body.onboardedAt).toBeDefined();
            expect(body.requestSlug).toBeNull();
        });
    });

    describe('PATCH /auth/profile', () => {
        it('should return 401 without authentication', async () => {
            const response = await app.request('/v1/auth/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName: 'Updated Business',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should update user profile successfully', async () => {
            // First onboard
            await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...auth.headers 
                },
                body: JSON.stringify({
                    businessName: 'Old Business',
                    city: 'Old City',
                    country: 'Nigeria'
                }),
            });

            const response = await app.request('/v1/auth/profile', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...auth.headers 
                },
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
             // New user for client test
             const clientAuth = await signupAndLogin('client2@example.com', 'Client User 2');

             // Onboard as client
             const onboardRes = await app.request('/v1/auth/onboard', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...clientAuth.headers 
                },
                body: JSON.stringify({
                    role: 'CLIENT',
                    businessName: 'Client Business Initial', // Required field
                }),
            });
            expect(onboardRes.status).toBe(200);

            const response = await app.request('/v1/auth/profile', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...clientAuth.headers 
                },
                body: JSON.stringify({
                    businessName: 'Client Business Updated',
                    city: 'Client City',
                }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.businessName).toBe('Client Business Updated');
            expect(body.city).toBe('Client City');
            expect(body.role).toBe(UserRoles.CLIENT);
        });
    });
});

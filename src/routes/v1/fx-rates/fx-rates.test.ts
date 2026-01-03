import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { createTestApp, mockAuthMiddleware, getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createUserFactory, UserFactory } from '@test/factories';
import { fxRates } from '../../../db/schema';
import { Currency } from '../../../constants/enums';
import * as routes from './fx-rates.routes';
import * as handlers from './fx-rates.handlers';

describe('FX Rates Routes', () => {
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

    describe('GET /fx-rates', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.listFxRates, handlers.listFxRates);

            const response = await app.request('/fx-rates', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        it('should return empty array for shipper with no rates', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.listFxRates, handlers.listFxRates);

            const response = await app.request('/fx-rates', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toEqual([]);
        });

        it('should return only shipper own rates', async () => {
            const shipper1 = await userFactory.createShipper({ email: 'shipper1@test.com' });
            const shipper2 = await userFactory.createShipper({ email: 'shipper2@test.com' });

            // Create rates for both shippers
            await db.insert(fxRates).values([
                { ownerUserId: shipper1.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1500.00', clientRate: '1600.00' },
                { ownerUserId: shipper2.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1480.00', clientRate: '1580.00' },
            ]);

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper1));
            app.openapi(routes.listFxRates, handlers.listFxRates);

            const response = await app.request('/fx-rates', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toHaveLength(1);
            expect(body[0].ownerUserId).toBe(shipper1.id);
            expect(body[0].costRate).toBe('1500.000000');
            expect(body[0].clientRate).toBe('1600.000000');
        });

        it('should filter by fromCurrency', async () => {
            const shipper = await userFactory.createShipper();

            await db.insert(fxRates).values([
                { ownerUserId: shipper.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1500.00', clientRate: '1600.00' },
                { ownerUserId: shipper.id, fromCurrency: Currency.GBP, toCurrency: Currency.NGN, costRate: '1900.00', clientRate: '2000.00' },
            ]);

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.listFxRates, handlers.listFxRates);

            const response = await app.request('/fx-rates?fromCurrency=USD', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toHaveLength(1);
            expect(body[0].fromCurrency).toBe('USD');
        });
    });

    describe('GET /fx-rates/current', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.getCurrentFxRate, handlers.getCurrentFxRate);

            const response = await app.request('/fx-rates/current', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
        });

        it('should return null when no active rate exists', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.getCurrentFxRate, handlers.getCurrentFxRate);

            const response = await app.request('/fx-rates/current', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toBeNull();
        });

        it('should return current active rate for currency pair', async () => {
            const shipper = await userFactory.createShipper();

            await db.insert(fxRates).values([
                { ownerUserId: shipper.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1500.00', clientRate: '1600.00', isActive: true },
            ]);

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.getCurrentFxRate, handlers.getCurrentFxRate);

            const response = await app.request('/fx-rates/current?fromCurrency=USD&toCurrency=NGN', {
                method: 'GET',
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).not.toBeNull();
            expect(body.costRate).toBe('1500.000000');
            expect(body.clientRate).toBe('1600.000000');
            expect(body.isActive).toBe(true);
        });
    });

    describe('POST /fx-rates', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.createFxRate, handlers.createFxRate);

            const response = await app.request('/fx-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromCurrency: 'USD',
                    toCurrency: 'NGN',
                    costRate: '1500.00',
                    clientRate: '1600.00',
                }),
            });

            expect(response.status).toBe(401);
        });

        it('should create a new FX rate', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.createFxRate, handlers.createFxRate);

            const response = await app.request('/fx-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromCurrency: 'USD',
                    toCurrency: 'NGN',
                    costRate: '1500.00',
                    clientRate: '1600.00',
                }),
            });

            expect(response.status).toBe(201);
            const body = await response.json();
            expect(body.ownerUserId).toBe(shipper.id);
            expect(body.fromCurrency).toBe('USD');
            expect(body.toCurrency).toBe('NGN');
            expect(body.costRate).toBe('1500.000000');
            expect(body.clientRate).toBe('1600.000000');
            expect(body.isActive).toBe(true);
        });

        it('should deactivate previous rate for same currency pair', async () => {
            const shipper = await userFactory.createShipper();

            // Create initial rate
            const [oldRate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipper.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1400.00',
                    clientRate: '1500.00',
                    isActive: true,
                })
                .returning();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.createFxRate, handlers.createFxRate);
            app.openapi(routes.getFxRate, handlers.getFxRate);

            // Create new rate
            const createResponse = await app.request('/fx-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromCurrency: 'USD',
                    toCurrency: 'NGN',
                    costRate: '1500.00',
                    clientRate: '1600.00',
                }),
            });

            expect(createResponse.status).toBe(201);

            // Check old rate is now inactive
            const getOldResponse = await app.request(`/fx-rates/${oldRate.id}`, {
                method: 'GET',
            });

            expect(getOldResponse.status).toBe(200);
            const oldBody = await getOldResponse.json();
            expect(oldBody.isActive).toBe(false);
        });

        it('should reject same from and to currency', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.createFxRate, handlers.createFxRate);

            const response = await app.request('/fx-rates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fromCurrency: 'USD',
                    toCurrency: 'USD',
                    costRate: '1.00',
                    clientRate: '1.00',
                }),
            });

            expect(response.status).toBe(400);
            const body = await response.json();
            expect(body.error).toContain('different');
        });
    });

    describe('PATCH /fx-rates/:id', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.updateFxRate, handlers.updateFxRate);

            const response = await app.request('/fx-rates/1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientRate: '1700.00' }),
            });

            expect(response.status).toBe(401);
        });

        it('should update rates', async () => {
            const shipper = await userFactory.createShipper();

            const [rate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipper.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1500.00',
                    clientRate: '1600.00',
                })
                .returning();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.updateFxRate, handlers.updateFxRate);

            const response = await app.request(`/fx-rates/${rate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ costRate: '1550.00', clientRate: '1700.00' }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.costRate).toBe('1550.000000');
            expect(body.clientRate).toBe('1700.000000');
        });

        it('should return 404 for non-existent rate', async () => {
            const shipper = await userFactory.createShipper();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.updateFxRate, handlers.updateFxRate);

            const response = await app.request('/fx-rates/99999', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientRate: '1700.00' }),
            });

            expect(response.status).toBe(404);
        });

        it('should return 404 for other shipper rate', async () => {
            const shipper1 = await userFactory.createShipper({ email: 'shipper1@test.com' });
            const shipper2 = await userFactory.createShipper({ email: 'shipper2@test.com' });

            const [rate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipper1.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1500.00',
                    clientRate: '1600.00',
                })
                .returning();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper2));
            app.openapi(routes.updateFxRate, handlers.updateFxRate);

            const response = await app.request(`/fx-rates/${rate.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientRate: '1700.00' }),
            });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /fx-rates/:id', () => {
        it('should return 401 without authentication', async () => {
            const app = createTestApp();
            app.use('*', mockAuthMiddleware(null));
            app.openapi(routes.deleteFxRate, handlers.deleteFxRate);

            const response = await app.request('/fx-rates/1', {
                method: 'DELETE',
            });

            expect(response.status).toBe(401);
        });

        it('should delete rate', async () => {
            const shipper = await userFactory.createShipper();

            const [rate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipper.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1500.00',
                    clientRate: '1600.00',
                })
                .returning();

            const app = createTestApp();
            app.use('*', mockAuthMiddleware(shipper));
            app.openapi(routes.deleteFxRate, handlers.deleteFxRate);
            app.openapi(routes.getFxRate, handlers.getFxRate);

            const deleteResponse = await app.request(`/fx-rates/${rate.id}`, {
                method: 'DELETE',
            });

            expect(deleteResponse.status).toBe(200);
            const body = await deleteResponse.json();
            expect(body.success).toBe(true);

            // Verify rate is gone
            const getResponse = await app.request(`/fx-rates/${rate.id}`, {
                method: 'GET',
            });
            expect(getResponse.status).toBe(404);
        });
    });
});

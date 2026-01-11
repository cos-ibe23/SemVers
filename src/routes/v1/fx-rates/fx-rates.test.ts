import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';
import { createUserFactory, UserFactory } from '@test/factories';
import { fxRates } from '../../../db/schema';
import { Currency } from '../../../constants/enums';

describe('FX Rates Routes (Integration)', () => {
    const db = getTestDb();
    const app = createIntegrationTestApp();
    let userFactory: UserFactory;
    
    let shipperAuth: { headers: Record<string, string>, user: any };

    beforeEach(async () => {
        await cleanTestDb();
        userFactory = createUserFactory(db);
        UserFactory.resetCounter();
        
        // Setup authenticated shipper
        shipperAuth = await signupAndLogin('shipper@example.com', 'Test Shipper');
    });

    afterAll(async () => {
        await closeTestDb();
    });

    describe('GET /fx-rates', () => {
        it('should return 401 without authentication', async () => {
            const response = await app.request('/v1/fx-rates', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
            const body = await response.json();
            expect(body).toHaveProperty('error');
        });

        it('should return empty array for shipper with no rates', async () => {
            const response = await app.request('/v1/fx-rates', {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toEqual([]);
        });

        it('should return only shipper own rates', async () => {
            const shipper2 = await userFactory.createShipper({ email: 'shipper2@test.com' });

            // Create rates for both shippers
            await db.insert(fxRates).values([
                { ownerUserId: shipperAuth.user.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1500.00', clientRate: '1600.00' },
                { ownerUserId: shipper2.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1480.00', clientRate: '1580.00' },
            ]);

            const response = await app.request('/v1/fx-rates', {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toHaveLength(1);
            expect(body[0].ownerUserId).toBe(shipperAuth.user.id);
            expect(body[0].costRate).toBe('1500.000000');
            expect(body[0].clientRate).toBe('1600.000000');
        });

        it('should filter by fromCurrency', async () => {
            await db.insert(fxRates).values([
                { ownerUserId: shipperAuth.user.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1500.00', clientRate: '1600.00' },
                { ownerUserId: shipperAuth.user.id, fromCurrency: Currency.GBP, toCurrency: Currency.NGN, costRate: '1900.00', clientRate: '2000.00' },
            ]);

            const response = await app.request('/v1/fx-rates?fromCurrency=USD', {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toHaveLength(1);
            expect(body[0].fromCurrency).toBe('USD');
        });
    });

    describe('GET /fx-rates/current', () => {
        it('should return 401 without authentication', async () => {
            const response = await app.request('/v1/fx-rates/current', {
                method: 'GET',
            });

            expect(response.status).toBe(401);
        });

        it('should return null when no active rate exists', async () => {
            const response = await app.request('/v1/fx-rates/current', {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body).toBeNull();
        });

        it('should return current active rate for currency pair', async () => {
            await db.insert(fxRates).values([
                { ownerUserId: shipperAuth.user.id, fromCurrency: Currency.USD, toCurrency: Currency.NGN, costRate: '1500.00', clientRate: '1600.00', isActive: true },
            ]);

            const response = await app.request('/v1/fx-rates/current?fromCurrency=USD&toCurrency=NGN', {
                method: 'GET',
                headers: shipperAuth.headers,
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
            const response = await app.request('/v1/fx-rates', {
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
            const response = await app.request('/v1/fx-rates', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
                body: JSON.stringify({
                    fromCurrency: 'USD',
                    toCurrency: 'NGN',
                    costRate: '1500.00',
                    clientRate: '1600.00',
                }),
            });

            expect(response.status).toBe(201);
            const body = await response.json();
            expect(body.ownerUserId).toBe(shipperAuth.user.id);
            expect(body.fromCurrency).toBe('USD');
            expect(body.toCurrency).toBe('NGN');
            expect(body.costRate).toBe('1500.000000');
            expect(body.clientRate).toBe('1600.000000');
            expect(body.isActive).toBe(true);
        });

        it('should deactivate previous rate for same currency pair', async () => {
            // Create initial rate
            const [oldRate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipperAuth.user.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1400.00',
                    clientRate: '1500.00',
                    isActive: true,
                })
                .returning();

            // Create new rate
            const createResponse = await app.request('/v1/fx-rates', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
                body: JSON.stringify({
                    fromCurrency: 'USD',
                    toCurrency: 'NGN',
                    costRate: '1500.00',
                    clientRate: '1600.00',
                }),
            });

            expect(createResponse.status).toBe(201);

            // Check old rate is now inactive
            const getOldResponse = await app.request(`/v1/fx-rates/${oldRate.id}`, {
                method: 'GET',
                headers: shipperAuth.headers,
            });

            expect(getOldResponse.status).toBe(200);
            const oldBody = await getOldResponse.json();
            expect(oldBody.isActive).toBe(false);
        });

        it('should reject same from and to currency', async () => {
            const response = await app.request('/v1/fx-rates', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
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
            const response = await app.request('/v1/fx-rates/1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ clientRate: '1700.00' }),
            });

            expect(response.status).toBe(401);
        });

        it('should update rates', async () => {
            const [rate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipperAuth.user.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1500.00',
                    clientRate: '1600.00',
                })
                .returning();

            const response = await app.request(`/v1/fx-rates/${rate.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
                body: JSON.stringify({ costRate: '1550.00', clientRate: '1700.00' }),
            });

            expect(response.status).toBe(200);
            const body = await response.json();
            expect(body.costRate).toBe('1550.000000');
            expect(body.clientRate).toBe('1700.000000');
        });

        it('should return 404 for non-existent rate', async () => {
            const response = await app.request('/v1/fx-rates/99999', {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
                body: JSON.stringify({ clientRate: '1700.00' }),
            });

            expect(response.status).toBe(404);
        });

        it('should return 404 for other shipper rate', async () => {
            const shipper2 = await userFactory.createShipper({ email: 'shipper2@test.com' });

            const [rate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipper2.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1500.00',
                    clientRate: '1600.00',
                })
                .returning();

            const response = await app.request(`/v1/fx-rates/${rate.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    ...shipperAuth.headers
                },
                body: JSON.stringify({ clientRate: '1700.00' }),
            });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /fx-rates/:id', () => {
        it('should return 401 without authentication', async () => {
            const response = await app.request('/v1/fx-rates/1', {
                method: 'DELETE',
            });

            expect(response.status).toBe(401);
        });

        it('should delete rate', async () => {
            const [rate] = await db
                .insert(fxRates)
                .values({
                    ownerUserId: shipperAuth.user.id,
                    fromCurrency: Currency.USD,
                    toCurrency: Currency.NGN,
                    costRate: '1500.00',
                    clientRate: '1600.00',
                })
                .returning();

            const deleteResponse = await app.request(`/v1/fx-rates/${rate.id}`, {
                method: 'DELETE',
                headers: shipperAuth.headers,
            });

            expect(deleteResponse.status).toBe(200);
            const body = await deleteResponse.json();
            expect(body.success).toBe(true);

            // Verify rate is gone
            const getResponse = await app.request(`/v1/fx-rates/${rate.id}`, {
                method: 'GET',
                headers: shipperAuth.headers,
            });
            expect(getResponse.status).toBe(404);
        });
    });
});

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getTestDb, cleanTestDb, closeTestDb } from '@test/helpers';
import { createIntegrationTestApp, signupAndLogin } from '@test/helpers/integration';

describe('Vouching System Flow (Integration)', () => {
    const app = createIntegrationTestApp();
    
    // Store auth headers for each user
    let requesterAuth: { headers: Record<string, string>, user: any };
    let voucher1Auth: { headers: Record<string, string>, user: any };
    let voucher2Auth: { headers: Record<string, string>, user: any };
    
    let vouchId1: number;
    let vouchId2: number;

    beforeAll(async () => {
        await cleanTestDb();

        // 1. Setup Voucher 1 (Signup + Onboard)
        voucher1Auth = await signupAndLogin('voucher1@test.com', 'Voucher One');
        const v1Onboard = await app.request('/v1/auth/onboard', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...voucher1Auth.headers 
            },
            body: JSON.stringify({
                businessName: 'Voucher One Biz',
                city: 'Lagos',
                country: 'Nigeria'
            })
        });
        expect(v1Onboard.status).toBe(200);

        // 2. Setup Voucher 2 (Signup + Onboard)
        voucher2Auth = await signupAndLogin('voucher2@test.com', 'Voucher Two');
        const v2Onboard = await app.request('/v1/auth/onboard', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...voucher2Auth.headers 
            },
            body: JSON.stringify({
                businessName: 'Voucher Two Biz',
                city: 'Abuja',
                country: 'Nigeria'
            })
        });
        expect(v2Onboard.status).toBe(200);

        // 3. Setup Requester (Signup only, not onboarded yet)
        requesterAuth = await signupAndLogin('requester@test.com', 'Requester User');
    });

    afterAll(async () => {
        await closeTestDb();
    });

    it('should onboard requester and create vouch requests', async () => {
        const res = await app.request('/v1/auth/onboard', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                ...requesterAuth.headers
            },
            body: JSON.stringify({
                businessName: 'Requester Biz',
                role: 'CLIENT',
                voucherEmails: [voucher1Auth.user.email, voucher2Auth.user.email]
            }),
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.verificationStatus).toBe('PENDING_VOUCH');
    });

    it('Voucher 1 should see pending request', async () => {
        const res = await app.request('/v1/vouchers/pending', {
            method: 'GET',
            headers: voucher1Auth.headers,
        });
        
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
        
        const myRequest = data.find((r: any) => r.requesterId === requesterAuth.user.id);
        expect(myRequest).toBeDefined();
        vouchId1 = myRequest.id;
    });

    it('Voucher 1 should approve request', async () => {
        const res = await app.request(`/v1/vouchers/${vouchId1}/approve`, {
            method: 'POST',
            headers: voucher1Auth.headers,
        });
        
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
    });

    it('Voucher 1 should see request in history', async () => {
        const res = await app.request('/v1/vouchers/history', {
            method: 'GET',
            headers: voucher1Auth.headers,
        });
        
        const data = await res.json();
        const myRequest = data.find((r: any) => r.requesterId === requesterAuth.user.id);
        expect(myRequest).toBeDefined();
        expect(myRequest.status).toBe('APPROVED');
    });

    it('Voucher 2 should see pending request', async () => {
        const res = await app.request('/v1/vouchers/pending', {
            method: 'GET',
            headers: voucher2Auth.headers,
        });

        const data = await res.json();
        const myRequest = data.find((r: any) => r.requesterId === requesterAuth.user.id);
        expect(myRequest).toBeDefined();
        vouchId2 = myRequest.id;
    });

    it('Voucher 2 should approve request', async () => {
        const res = await app.request(`/v1/vouchers/${vouchId2}/approve`, {
            method: 'POST',
            headers: voucher2Auth.headers,
        });
        expect(res.status).toBe(200);
    });

    it('Requester status should now be VERIFIED', async () => {
        const res = await app.request('/v1/auth/me', {
            method: 'GET',
            headers: requesterAuth.headers,
        });
        
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.user.verificationStatus).toBe('VERIFIED');
    });
});

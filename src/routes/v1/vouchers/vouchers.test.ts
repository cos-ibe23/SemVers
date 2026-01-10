import { describe, it, expect, beforeAll } from 'vitest';

const API_URL = 'http://localhost:4000/v1';

// Helpers to generate unique emails
const r = () => Math.floor(Math.random() * 100000);
const email = (prefix: string) => `${prefix}-${r()}@test.com`;

let requesterToken: string;
let voucher1Token: string;
let voucher2Token: string;
let requesterId: string;
let vouchId1: number;
let vouchId2: number;

const requesterEmail = email('requester');
const voucher1Email = email('voucher1');
const voucher2Email = email('voucher2');
const password = 'password123';

async function signupAndLogin(userEmail: string, name: string) {
    // Signup
    await fetch(`${API_URL}/auth/sign-up/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password, name }),
    });

    // Login
    const res = await fetch(`${API_URL}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail, password }),
    });
    const data = await res.json();
    return { token: data.token, id: data.user.id };
}

describe('Vouching System Flow', () => {
    beforeAll(async () => {
        // Create 3 users
        const v1 = await signupAndLogin(voucher1Email, 'Voucher One');
        voucher1Token = v1.token;

        const v2 = await signupAndLogin(voucher2Email, 'Voucher Two');
        voucher2Token = v2.token;

        const req = await signupAndLogin(requesterEmail, 'Requester User');
        requesterToken = req.token;
        requesterId = req.id;
    });

    it('should onboard requester and create vouch requests', async () => {
        const res = await fetch(`${API_URL}/auth/onboard`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${requesterToken}` 
            },
            body: JSON.stringify({
                businessName: 'Requester Biz',
                role: 'CLIENT',
                voucherEmails: [voucher1Email, voucher2Email]
            }),
        });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.verificationStatus).toBe('PENDING_VOUCH');
    });

    it('Voucher 1 should see pending request', async () => {
        const res = await fetch(`${API_URL}/vouchers/pending`, {
            headers: { 'Authorization': `Bearer ${voucher1Token}` } 
        });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        
        const myRequest = data.find((r: any) => r.requesterId === requesterId);
        expect(myRequest).toBeDefined();
        vouchId1 = myRequest.id;
    });

    it('Voucher 1 should approve request', async () => {
        const res = await fetch(`${API_URL}/vouchers/${vouchId1}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${voucher1Token}` } 
        });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('Voucher 1 should see request in history', async () => {
        const res = await fetch(`${API_URL}/vouchers/history`, {
            headers: { 'Authorization': `Bearer ${voucher1Token}` } 
        });
        const data = await res.json();
        const myRequest = data.find((r: any) => r.requesterId === requesterId);
        expect(myRequest).toBeDefined();
        expect(myRequest.status).toBe('APPROVED');
    });

    it('Voucher 2 should see pending request', async () => {
        const res = await fetch(`${API_URL}/vouchers/pending`, {
            headers: { 'Authorization': `Bearer ${voucher2Token}` } 
        });
        const data = await res.json();
        const myRequest = data.find((r: any) => r.requesterId === requesterId);
        expect(myRequest).toBeDefined();
        vouchId2 = myRequest.id;
    });

    it('Voucher 2 should approve request', async () => {
        const res = await fetch(`${API_URL}/vouchers/${vouchId2}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${voucher2Token}` } 
        });
        expect(res.status).toBe(200);
    });

    it('Requester status should now be VERIFIED', async () => {
        const res = await fetch(`${API_URL}/auth/me`, {
            headers: { 'Authorization': `Bearer ${requesterToken}` } 
        });
        const data = await res.json();
        expect(res.status).toBe(200);
        expect(data.user.verificationStatus).toBe('VERIFIED');
    });
});

import { describe, it, expect } from 'vitest';
import { createIntegrationTestApp } from '@test/helpers/integration';

describe('Health endpoint (Integration)', () => {
    const app = createIntegrationTestApp();

    describe('GET /health', () => {
        it('should return 200 with ok status', async () => {
            const response = await app.request('/health', {
                method: 'GET',
            });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body).toHaveProperty('status', 'ok');
            expect(body).toHaveProperty('timestamp');
        });

        it('should return a valid ISO timestamp', async () => {
            const response = await app.request('/health', {
                method: 'GET',
            });

            const body = await response.json();
            const timestamp = new Date(body.timestamp);

            expect(timestamp).toBeInstanceOf(Date);
            expect(isNaN(timestamp.getTime())).toBe(false);
        });
    });
});

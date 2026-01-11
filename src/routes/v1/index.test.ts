import { describe, it, expect } from 'vitest';
import { createIntegrationTestApp } from '@test/helpers/integration';

describe('V1 Index endpoint (Integration)', () => {
    const app = createIntegrationTestApp();

    describe('GET /v1/', () => {
        it('should return 200 with version info', async () => {
            const response = await app.request('/v1/', {
                method: 'GET',
            });

            expect(response.status).toBe(200);

            const body = await response.json();
            expect(body).toHaveProperty('version', '1.0.0');
            expect(body).toHaveProperty('name', 'Imbod API');
        });
    });
});

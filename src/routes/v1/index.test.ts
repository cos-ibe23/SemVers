import { describe, it, expect } from 'vitest';
import { createRouter } from '../../lib/create-app';
import v1IndexRouter from './index.route';

const app = createRouter();
app.route('/v1', v1IndexRouter);

describe('V1 Index endpoint', () => {
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

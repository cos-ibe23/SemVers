import { createRoute, z } from '@hono/zod-openapi';
import { createRouter } from '../lib/create-app';
import * as HttpStatusCodes from '../lib/http-status-codes';
import { jsonContent } from '../lib/openapi/helpers';

const router = createRouter();

// Root redirect to API docs
router.get('/', (c) => {
    return c.redirect('/reference');
});

// Health check endpoint
const healthRoute = createRoute({
    tags: ['health'],
    method: 'get',
    path: '/health',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({
                status: z.string(),
                timestamp: z.string(),
            }),
            'Health check response'
        ),
    },
});

router.openapi(healthRoute, (c) => {
    return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
    });
});

// Metrics endpoint (placeholder for Prometheus)
router.get('/metrics', (c) => {
    return c.text('OK');
});

export default router;

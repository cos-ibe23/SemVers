import { createRoute, z } from '@hono/zod-openapi';
import { createRouter } from '../../lib/create-app';
import { jsonContent } from '../../lib/openapi/helpers';

const router = createRouter();

// Version info endpoint
const versionRoute = createRoute({
    tags: ['v1'],
    method: 'get',
    path: '/',
    responses: {
        200: jsonContent(
            z.object({
                version: z.string(),
                name: z.string(),
            }),
            'API version info'
        ),
    },
});

router.openapi(versionRoute, (c) => {
    return c.json({
        version: '1.0.0',
        name: 'Imbod API',
    });
});

export default router;

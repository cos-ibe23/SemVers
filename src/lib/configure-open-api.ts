import { apiReference } from '@scalar/hono-api-reference';
import type { AppOpenAPI } from './types';

export function configureOpenAPI(app: AppOpenAPI) {
    // OpenAPI JSON endpoint
    app.doc('/doc', {
        openapi: '3.0.0',
        info: {
            title: 'Imbod API',
            version: '1.0.0',
            description: 'Imbod Shipping & Logistics Platform API',
        },
    });

    // Scalar API Reference UI
    app.get(
        '/reference',
        apiReference({
            pageTitle: 'Imbod API Reference',
            spec: {
                url: '/doc',
            },
            theme: 'kepler',
        })
    );
}

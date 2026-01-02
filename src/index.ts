import { serve } from '@hono/node-server';
import app from './app';
import { env } from './env';
import { closeDatabase } from './db';
import { logger } from './lib/logger';

const server = serve(
    {
        fetch: app.fetch,
        port: env.PORT,
    },
    (info) => {
        logger.info(`Server running at http://localhost:${info.port}`);
        logger.info(`API Reference: http://localhost:${info.port}/reference`);
        logger.info(`OpenAPI JSON: http://localhost:${info.port}/doc`);
    }
);

// Graceful shutdown
const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        logger.info('HTTP server closed.');

        try {
            await closeDatabase();
            logger.info('Database connection closed.');
        } catch (error) {
            logger.error({ error }, 'Error closing database');
        }

        process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
        logger.error('Forced exit after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    logger.error({ error }, 'Uncaught Exception');
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled Rejection');
    process.exit(1);
});

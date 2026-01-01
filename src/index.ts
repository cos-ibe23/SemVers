import { serve } from '@hono/node-server';
import app from './app';
import { env } from './env';
import { closeDatabase } from './db';

const server = serve(
    {
        fetch: app.fetch,
        port: env.PORT,
    },
    (info) => {
        console.log(`🚀 Server running at http://localhost:${info.port}`);
        console.log(`📚 API Reference: http://localhost:${info.port}/reference`);
        console.log(`📄 OpenAPI JSON: http://localhost:${info.port}/doc`);
    }
);

// Graceful shutdown
const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Shutting down gracefully...`);

    server.close(async () => {
        console.log('HTTP server closed.');

        try {
            await closeDatabase();
            console.log('Database connection closed.');
        } catch (error) {
            console.error('Error closing database:', error);
        }

        process.exit(0);
    });

    // Force exit after timeout
    setTimeout(() => {
        console.error('Forced exit after timeout.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection:', reason);
    process.exit(1);
});

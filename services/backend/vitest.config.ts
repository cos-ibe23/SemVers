import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
            '@test': path.resolve(__dirname, 'test'),
        },
    },
    test: {
        globals: true,
        environment: 'node',
        setupFiles: ['./test/setup.ts'],
        include: ['src/**/*.test.ts', 'test/**/*.test.ts'],
        // Use 'forks' pool to prevent hanging processes
        pool: 'forks',
        // Run test files sequentially to avoid DB conflicts in integration tests
        fileParallelism: false,
        // Set a teardown timeout to force exit if cleanup takes too long
        teardownTimeout: 10000,
        // Retry failed tests
        retry: 1,
        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'test/',
                '**/*.test.ts',
                'src/db/migrations/',
            ],
        },
    },
});

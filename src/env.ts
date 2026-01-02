import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { z } from 'zod';

// Load environment variables from .env file
if (process.env.NODE_ENV !== 'production') {
    expand(
        config({
            path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
        })
    );
}

const EnvSchema = z.object({
    // Database
    DATABASE_URL: z.string().url(),

    // Better Auth
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),

    // Google OAuth
    GOOGLE_CLIENT_ID: z.string().min(1),
    GOOGLE_CLIENT_SECRET: z.string().min(1),

    // Server
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(4000),

    // Redis
    REDIS_URL: z.string().url().default('redis://localhost:6379'),

    // S3-Compatible Storage (MinIO)
    S3_ENDPOINT: z.string().url(),
    S3_ACCESS_KEY: z.string().min(1),
    S3_SECRET_KEY: z.string().min(1),
    S3_BUCKET: z.string().min(1),
    S3_REGION: z.string().default('us-east-1'),
});

export type Env = z.infer<typeof EnvSchema>;

let env: Env;

try {
    env = EnvSchema.parse(process.env);
} catch (e) {
    if (e instanceof z.ZodError) {
        // Use console here since logger depends on env
        console.error('❌ Invalid environment variables:');
        console.error(JSON.stringify(e.flatten().fieldErrors, null, 2));
        process.exit(1);
    }
    throw e;
}

export { env };

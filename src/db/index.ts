import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { env } from '../env';
import * as schema from './schema';

// Create postgres client
const client = postgres(env.DATABASE_URL);

// Create drizzle instance with schema
export const db = drizzle(client, { schema });

// Export for use in auth and other places
export { client };

// Graceful shutdown helper
export async function closeDatabase() {
    await client.end();
}

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db, client } from './index';

async function main() {
  try {
    console.log('⏳ Running migrations...');
    
    // Note: In production (Docker), migrations are copied to ./src/db/migrations relative to WORKDIR /app
    // In development (tsx), it works relative to project root as well.
    await migrate(db, { migrationsFolder: './src/db/migrations' });
    
    console.log('✅ Migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

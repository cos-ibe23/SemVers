import { pgTable, serial, text, varchar, timestamp } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';

export const clients = pgTable('clients', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }),
    phone: varchar('phone', { length: 50 }),
    avatarUrl: varchar('avatar_url', { length: 512 }),
    deletedAt: timestamp('deleted_at'), // soft delete
    createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Zod schemas
export const selectClientSchema = createSelectSchema(clients);
export const insertClientSchema = createInsertSchema(clients);
export const patchClientSchema = insertClientSchema.partial();

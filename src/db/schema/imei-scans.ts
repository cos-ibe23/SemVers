import { pgTable, serial, varchar, decimal, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { timestamps } from './helpers';

export const imeiScans = pgTable('imei_scans', {
    id: serial('id').primaryKey(),
    imei: varchar('imei', { length: 50 }).notNull(),
    provider: varchar('provider', { length: 50 }), // third-party API provider name
    result: jsonb('result'), // cached API response
    costUsd: decimal('cost_usd', { precision: 8, scale: 4 }), // cost of API call
    ...timestamps(),
});

// Zod schemas
export const selectImeiScanSchema = createSelectSchema(imeiScans);
export const insertImeiScanSchema = createInsertSchema(imeiScans);

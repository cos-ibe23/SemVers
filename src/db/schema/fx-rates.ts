import { pgTable, serial, decimal } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { timestamps } from './helpers';

export const fxRates = pgTable('fx_rates', {
    id: serial('id').primaryKey(),
    buyRateUsdNgn: decimal('buy_rate_usd_ngn', { precision: 12, scale: 4 }).notNull(),
    clientRateUsdNgn: decimal('client_rate_usd_ngn', { precision: 12, scale: 4 }).notNull(),
    atmFeePer990Usd: decimal('atm_fee_per_990_usd', { precision: 10, scale: 2 }).default('0'),
    ...timestamps(),
});

// Zod schemas
export const selectFxRateSchema = createSelectSchema(fxRates);
export const insertFxRateSchema = createInsertSchema(fxRates);

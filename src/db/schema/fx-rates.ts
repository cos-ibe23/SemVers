import { pgTable, serial, decimal, text, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { z } from 'zod';
import { user } from './auth';
import { timestamps } from './helpers';
import { CURRENCIES } from '../../constants/enums';

// Currency enum - extensible for future currencies
export const currencyEnum = pgEnum('currency', CURRENCIES);

export const fxRates = pgTable('fx_rates', {
    id: serial('id').primaryKey(),

    // Owner (shipper)
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),

    // Currency pair
    fromCurrency: currencyEnum('from_currency').notNull(), // e.g., 'USD'
    toCurrency: currencyEnum('to_currency').notNull(), // e.g., 'NGN'

    // Cost rate: What the shipper pays to acquire the currency (internal)
    // e.g., 1 USD = 1500 NGN (shipper's cost)
    costRate: decimal('cost_rate', { precision: 15, scale: 6 }).notNull(),

    // Client rate: What the shipper charges clients (public)
    // e.g., 1 USD = 1550 NGN (what client pays)
    clientRate: decimal('client_rate', { precision: 15, scale: 6 }).notNull(),

    // Is this the shipper's current active rate for this currency pair?
    isActive: boolean('is_active').default(true),

    ...timestamps(),
});

// Zod schemas
export const selectFxRateSchema = createSelectSchema(fxRates);
export const insertFxRateSchema = createInsertSchema(fxRates);

// Custom response schema for API (shipper sees both rates)
export const fxRateResponseSchema = z.object({
    id: z.number(),
    ownerUserId: z.string(),
    fromCurrency: z.enum(CURRENCIES),
    toCurrency: z.enum(CURRENCIES),
    costRate: z.string(), // Decimal comes as string
    clientRate: z.string(), // Decimal comes as string
    isActive: z.boolean().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
});

export type FxRate = typeof fxRates.$inferSelect;
export type FxRateResponse = z.infer<typeof fxRateResponseSchema>;

// Request schemas
export const createFxRateRequestSchema = z.object({
    fromCurrency: z.enum(CURRENCIES).default('USD'),
    toCurrency: z.enum(CURRENCIES).default('NGN'),
    costRate: z.string().or(z.number()).transform((val) => String(val)),
    clientRate: z.string().or(z.number()).transform((val) => String(val)),
});

export const updateFxRateRequestSchema = z.object({
    costRate: z.string().or(z.number()).transform((val) => String(val)).optional(),
    clientRate: z.string().or(z.number()).transform((val) => String(val)).optional(),
    isActive: z.boolean().optional(),
});

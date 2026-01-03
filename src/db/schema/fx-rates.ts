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

    // Rate: 1 fromCurrency = rate toCurrency (e.g., 1 USD = 1600 NGN)
    rate: decimal('rate', { precision: 15, scale: 6 }).notNull(),

    // Is this the shipper's current active rate for this currency pair?
    isActive: boolean('is_active').default(true),

    ...timestamps(),
});

// Zod schemas
export const selectFxRateSchema = createSelectSchema(fxRates);
export const insertFxRateSchema = createInsertSchema(fxRates);

// Custom response schema for API
export const fxRateResponseSchema = z.object({
    id: z.number(),
    ownerUserId: z.string(),
    fromCurrency: z.enum(CURRENCIES),
    toCurrency: z.enum(CURRENCIES),
    rate: z.string(), // Decimal comes as string
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
    rate: z.string().or(z.number()).transform((val) => String(val)),
});

export const updateFxRateRequestSchema = z.object({
    rate: z.string().or(z.number()).transform((val) => String(val)).optional(),
    isActive: z.boolean().optional(),
});

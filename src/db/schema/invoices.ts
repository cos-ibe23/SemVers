import { pgTable, serial, text, integer, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { pickups } from './pickups';
import { boxes } from './boxes';
import { timestamps } from './helpers';

export const invoiceTypeEnum = pgEnum('invoice_type', ['QUOTE', 'FINAL']);

export const invoices = pgTable('invoices', {
    id: serial('id').primaryKey(),
    ownerUserId: text('owner_user_id')
        .notNull()
        .references(() => user.id, { onDelete: 'cascade' }),
    clientUserId: text('client_user_id')
        .references(() => user.id, { onDelete: 'set null' }),
    pickupId: integer('pickup_id')
        .references(() => pickups.id, { onDelete: 'set null' }),
    boxId: integer('box_id')
        .references(() => boxes.id, { onDelete: 'set null' }),
    type: invoiceTypeEnum('type').notNull(),
    totalUsd: decimal('total_usd', { precision: 12, scale: 2 }),
    totalNgn: decimal('total_ngn', { precision: 15, scale: 2 }),
    pdfUrl: varchar('pdf_url', { length: 512 }),
    sentAt: timestamp('sent_at'),
    ...timestamps(),
});

// Zod schemas
export const selectInvoiceSchema = createSelectSchema(invoices);
export const insertInvoiceSchema = createInsertSchema(invoices);
export const patchInvoiceSchema = insertInvoiceSchema.partial();

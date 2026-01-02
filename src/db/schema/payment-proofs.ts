import { pgTable, serial, integer, text, varchar, decimal, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { createSelectSchema, createInsertSchema } from 'drizzle-zod';
import { user } from './auth';
import { pickupRequests } from './pickup-requests';
import { timestamps } from './helpers';

export const paymentMethodEnum = pgEnum('payment_method', [
    'ZELLE',
    'CASHAPP',
    'VENMO',
    'BANK_TRANSFER',
    'PAYPAL',
    'OTHER',
]);

export const paymentProofStatusEnum = pgEnum('payment_proof_status', [
    'PENDING',
    'VERIFIED',
    'REJECTED',
]);

export const paymentProofs = pgTable('payment_proofs', {
    id: serial('id').primaryKey(),
    requestId: integer('request_id')
        .notNull()
        .references(() => pickupRequests.id, { onDelete: 'cascade' }),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    transactionReference: varchar('transaction_reference', { length: 255 }), // confirmation number
    screenshotUrl: varchar('screenshot_url', { length: 512 }), // S3 URL
    amountPaid: decimal('amount_paid', { precision: 10, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 10 }).default('USD'),
    notes: text('notes'),
    status: paymentProofStatusEnum('status').default('PENDING'),
    verifiedByUserId: text('verified_by_user_id')
        .references(() => user.id, { onDelete: 'set null' }),
    verifiedAt: timestamp('verified_at'),
    rejectionReason: text('rejection_reason'),
    ...timestamps(),
});

// Zod schemas
export const selectPaymentProofSchema = createSelectSchema(paymentProofs);
export const insertPaymentProofSchema = createInsertSchema(paymentProofs);
export const patchPaymentProofSchema = insertPaymentProofSchema.partial();

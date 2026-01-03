/**
 * Centralized Enum Constants
 *
 * Single source of truth for all status enums used across the application.
 * Use these constants in:
 * - Database schema (pgEnum values)
 * - Zod schemas (enum validators)
 * - Service layer (status comparisons)
 * - Route handlers (response filtering)
 */

// ============================================
// Pickup Request Status
// ============================================
// Flow: PENDING → QUOTED → PAYMENT_SUBMITTED → PAYMENT_VERIFIED → ACCEPTED → CONVERTED
//       (or REJECTED at any point)
export const PickupRequestStatus = {
    PENDING: 'PENDING', // Client submitted, shipper hasn't reviewed
    QUOTED: 'QUOTED', // Shipper provided estimate
    PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED', // Client uploaded payment proof
    PAYMENT_VERIFIED: 'PAYMENT_VERIFIED', // Admin verified payment
    ACCEPTED: 'ACCEPTED', // Ready to convert to pickup
    REJECTED: 'REJECTED', // Request declined
    CONVERTED: 'CONVERTED', // Converted to a Pickup (immutable)
} as const;

export type PickupRequestStatusType = (typeof PickupRequestStatus)[keyof typeof PickupRequestStatus];
export const PICKUP_REQUEST_STATUSES = Object.values(PickupRequestStatus) as [
    PickupRequestStatusType,
    ...PickupRequestStatusType[],
];

// ============================================
// Payment Status
// ============================================
// Flow: UNPAID → PENDING_VERIFICATION → VERIFIED (or REJECTED)
export const PaymentStatus = {
    UNPAID: 'UNPAID', // No payment submitted yet
    PENDING_VERIFICATION: 'PENDING_VERIFICATION', // Proof uploaded, awaiting admin review
    VERIFIED: 'VERIFIED', // Admin confirmed payment is valid
    REJECTED: 'REJECTED', // Payment proof rejected
} as const;

export type PaymentStatusType = (typeof PaymentStatus)[keyof typeof PaymentStatus];
export const PAYMENT_STATUSES = Object.values(PaymentStatus) as [PaymentStatusType, ...PaymentStatusType[]];

// ============================================
// Pickup Status
// ============================================
// Flow: DRAFT → CONFIRMED (or CANCELLED at any point)
export const PickupStatus = {
    DRAFT: 'DRAFT', // Pickup created, not finalized
    CONFIRMED: 'CONFIRMED', // Pickup confirmed, ready for processing
    CANCELLED: 'CANCELLED', // Pickup cancelled
} as const;

export type PickupStatusType = (typeof PickupStatus)[keyof typeof PickupStatus];
export const PICKUP_STATUSES = Object.values(PickupStatus) as [PickupStatusType, ...PickupStatusType[]];

// ============================================
// Item Status
// ============================================
// Flow: PENDING → IN_BOX → IN_TRANSIT → DELIVERED → HANDED_OFF → SOLD
//       (or RETURNED at any point after IN_TRANSIT)
export const ItemStatus = {
    PENDING: 'PENDING', // Item picked up, in shipper's warehouse
    IN_BOX: 'IN_BOX', // Assigned to shipping box, ready to ship
    IN_TRANSIT: 'IN_TRANSIT', // Box shipped, item on the way
    DELIVERED: 'DELIVERED', // Box arrived, awaiting client pickup
    HANDED_OFF: 'HANDED_OFF', // Client received item (pickup code used)
    SOLD: 'SOLD', // Client sold the item (optional tracking)
    RETURNED: 'RETURNED', // Item was returned
} as const;

export type ItemStatusType = (typeof ItemStatus)[keyof typeof ItemStatus];
export const ITEM_STATUSES = Object.values(ItemStatus) as [ItemStatusType, ...ItemStatusType[]];

// ============================================
// Currency
// ============================================
export const Currency = {
    USD: 'USD',
    NGN: 'NGN',
    GBP: 'GBP',
    EUR: 'EUR',
} as const;

export type CurrencyType = (typeof Currency)[keyof typeof Currency];
export const CURRENCIES = Object.values(Currency) as [CurrencyType, ...CurrencyType[]];

// ============================================
// IMEI Source
// ============================================
export const ImeiSource = {
    MANUAL: 'manual', // User typed it in
    SCANNED: 'scanned', // Barcode/QR scanner
    API: 'api', // External API lookup
} as const;

export type ImeiSourceType = (typeof ImeiSource)[keyof typeof ImeiSource];
export const IMEI_SOURCES = Object.values(ImeiSource) as [ImeiSourceType, ...ImeiSourceType[]];

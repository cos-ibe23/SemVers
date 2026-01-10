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
// Simplified flow: PENDING → CONVERTED (or REJECTED)
// - Request is the "intent" from client
// - Pickup is the "reality" after shipper proceeds
export const PickupRequestStatus = {
    PENDING: 'PENDING', // Client submitted, awaiting shipper review
    REJECTED: 'REJECTED', // Shipper declined the request
    CONVERTED: 'CONVERTED', // Converted to a Pickup (immutable)
} as const;

export type PickupRequestStatusType = (typeof PickupRequestStatus)[keyof typeof PickupRequestStatus];
export const PICKUP_REQUEST_STATUSES = Object.values(PickupRequestStatus) as [
    PickupRequestStatusType,
    ...PickupRequestStatusType[],
];

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
// Box Status
// ============================================
// Flow: OPEN → SEALED → SHIPPED → DELIVERED
export const BoxStatus = {
    OPEN: 'OPEN', // Box is open, items can be added
    SEALED: 'SEALED', // Box is sealed, ready for shipment
    SHIPPED: 'SHIPPED', // Box has been shipped
    DELIVERED: 'DELIVERED', // Box has been delivered
} as const;

export type BoxStatusType = (typeof BoxStatus)[keyof typeof BoxStatus];
export const BOX_STATUSES = Object.values(BoxStatus) as [BoxStatusType, ...BoxStatusType[]];

// ============================================
// Shipment Status
// ============================================
// Flow: PENDING → IN_TRANSIT → DELIVERED
export const ShipmentStatus = {
    PENDING: 'PENDING', // Shipment created, not yet in transit
    IN_TRANSIT: 'IN_TRANSIT', // Shipment is on the way
    DELIVERED: 'DELIVERED', // Shipment has arrived
} as const;

export type ShipmentStatusType = (typeof ShipmentStatus)[keyof typeof ShipmentStatus];
export const SHIPMENT_STATUSES = Object.values(ShipmentStatus) as [ShipmentStatusType, ...ShipmentStatusType[]];

// ============================================
// Invoice Type
// ============================================
export const InvoiceType = {
    QUOTE: 'QUOTE', // Proforma/estimate invoice
    FINAL: 'FINAL', // Final invoice after confirmation
} as const;

export type InvoiceTypeType = (typeof InvoiceType)[keyof typeof InvoiceType];
export const INVOICE_TYPES = Object.values(InvoiceType) as [InvoiceTypeType, ...InvoiceTypeType[]];

// ============================================
// Payment Method
// ============================================
export const PaymentMethod = {
    ZELLE: 'ZELLE',
    CASHAPP: 'CASHAPP',
    VENMO: 'VENMO',
    BANK_TRANSFER: 'BANK_TRANSFER',
    PAYPAL: 'PAYPAL',
    OTHER: 'OTHER',
} as const;

export type PaymentMethodType = (typeof PaymentMethod)[keyof typeof PaymentMethod];
export const PAYMENT_METHODS = Object.values(PaymentMethod) as [PaymentMethodType, ...PaymentMethodType[]];

// ============================================
// Payment Proof Status
// ============================================
export const PaymentProofStatus = {
    PENDING: 'PENDING', // Waiting for verification
    VERIFIED: 'VERIFIED', // Payment confirmed by shipper
    REJECTED: 'REJECTED', // Payment rejected by shipper
} as const;

export type PaymentProofStatusType = (typeof PaymentProofStatus)[keyof typeof PaymentProofStatus];
export const PAYMENT_PROOF_STATUSES = Object.values(PaymentProofStatus) as [
    PaymentProofStatusType,
    ...PaymentProofStatusType[],
];

// ============================================
// Notification Type
// ============================================
export const NotificationType = {
    NEW_REQUEST: 'NEW_REQUEST', // New pickup request submitted
    PAYMENT_SUBMITTED: 'PAYMENT_SUBMITTED', // Client submitted payment proof
    PAYMENT_VERIFIED: 'PAYMENT_VERIFIED', // Payment was verified
    BOX_SHIPPED: 'BOX_SHIPPED', // Box was shipped
    BOX_DELIVERED: 'BOX_DELIVERED', // Box was delivered
} as const;

export type NotificationTypeType = (typeof NotificationType)[keyof typeof NotificationType];
export const NOTIFICATION_TYPES = Object.values(NotificationType) as [
    NotificationTypeType,
    ...NotificationTypeType[],
];

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

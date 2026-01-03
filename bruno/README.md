# Imbod API - Bruno Collection

This folder contains a [Bruno](https://www.usebruno.com/) collection for testing the Imbod API endpoints.

## Getting Started

1. Install Bruno from https://www.usebruno.com/
2. Open Bruno and select "Open Collection"
3. Navigate to this `bruno` folder
4. Select the "local" environment

## Environment Variables

The `local` environment provides these variables:
- `baseUrl`: http://localhost:8080
- `adminToken`: test-admin-token-123
- `shipperToken`: test-shipper-token-123
- `shipper2Token`: test-shipper2-token-123
- `clientToken`: test-client-token-123

## Test Data Setup

Before testing, set up the database and seed test data:

```bash
# Generate migrations (if not done)
npm run db:generate

# Push schema to database
npm run db:push

# Seed test data
npm run db:seed
```

## Test Users

After running the seed script, you'll have these test users:

| Role | Email | Session Token | User ID |
|------|-------|---------------|---------|
| Admin | admin@imbod.test | test-admin-token-123 | admin-001 |
| Shipper | shipper@imbod.test | test-shipper-token-123 | shipper-001 |
| Shipper 2 | jane@imbod.test | test-shipper2-token-123 | shipper-002 |
| Client | john@example.com | test-client-token-123 | client-001 |

### Test Shipper-Client Relationships

Shipper 1 (shipper-001) has these clients:
- client-001 (John Doe) - nickname: "Johnny"
- client-002 (Jane Smith)
- client-003 (Bob Wilson) - nickname: "Bob W"
- client-004 (Alice Brown)
- client-005 (Charlie Davis) - nickname: "Charlie D"

Shipper 2 (shipper-002) has these clients:
- client-006 (Michael Johnson) - nickname: "Mike"
- client-007 (Sarah Lee)

## Collections

### Health
- **Health Check** - Check API status

### Auth (`/auth`)
- **Sign Up** - Create account with email
- **Sign In** - Login with email
- **Sign Out** - Logout
- **Get Me** - Get current user + profile
- **Get Session** - Get session info
- **Onboard Profile** - Complete onboarding (create profile)
- **Update Profile** - Update shipper profile

### Shipper Clients (`/shipper-clients`)
- **List Shipper Clients** - Get paginated list of clients linked to current shipper
- **Create and Add Client** - Create a new user (CLIENT role) and link to shipper
- **Add Existing Client** - Link an existing CLIENT user to shipper
- **Get Shipper Client** - Get client by user ID
- **Update Shipper Client** - Update shipper-client relationship (nickname, phone)
- **Remove Shipper Client** - Soft delete shipper-client relationship

### FX Rates (`/fx-rates`)
Each shipper manages their own exchange rates for currency conversion.
- **List FX Rates** - Get all FX rates for the shipper (filterable)
- **Get Current FX Rate** - Get active rate for a currency pair
- **Get FX Rate** - Get specific rate by ID
- **Create FX Rate** - Create new rate (auto-deactivates previous for same pair)
- **Update FX Rate** - Update rate or active status
- **Delete FX Rate** - Delete a rate

### Public Request (`/request`) - NO AUTH REQUIRED
Public endpoints for clients to submit pickup requests.
- **Get Shipper By Slug** - Get shipper's public info for the form
- **Submit Pickup Request** - Submit a pickup request (auto-creates client user)

### Pickup Requests (`/pickup-requests`)
Shipper manages incoming pickup requests (created via public `/request/:slug` endpoint).
- **List Pickup Requests** - Get paginated list (filterable by status, client, search)
- **Get Pickup Request** - Get request by ID
- **Update Pickup Request** - Update request status/details (quote, accept, etc.)
- **Delete Pickup Request** - Cancel/delete request
- **Convert to Pickup** - Convert request to actual pickup

> **Note:** Pickup requests are created by clients via the public endpoint. Shippers who want to create a pickup directly (walk-in, phone call) should use `POST /v1/pickups` instead.

### Pickups (`/pickups`)
Manage actual pickups (from conversion or direct creation).
- **List Pickups** - Get paginated list (filterable by status, client)
- **Get Pickup** - Get pickup by ID
- **Create Pickup** - Create pickup directly (for walk-in clients)
- **Update Pickup** - Update pickup details/status
- **Delete Pickup** - Cancel/delete pickup

### Items (`/items`)
Manage individual items within pickups.
- **List Pickup Items** - Get all items in a pickup
- **Add Item to Pickup** - Add item with category, model, IMEI, etc.
- **Get Item** - Get item by ID
- **Update Item** - Update item details/status
- **Delete Item** - Remove item from pickup

## Authentication

All authenticated endpoints use Bearer token authentication. The token is set via the environment variable (e.g., `{{shipperToken}}`).

To switch users:
1. Edit the request's Auth section
2. Change `{{shipperToken}}` to `{{adminToken}}`, `{{shipper2Token}}`, or `{{clientToken}}`

## User Roles

The system has three roles:
- **ADMIN** - Full system access
- **SHIPPER** - Can manage their clients, pickups, boxes, shipments
- **CLIENT** - Can view their own pickups and shipments

## Tips

- Use the "local" environment when testing locally
- The seed script creates test sessions that expire in 7 days
- Run `npm run db:seed` again to refresh expired sessions
- Client IDs are now string user IDs (UUIDs), not numeric IDs

## Complete Pickup Flow

Here's the typical flow for a pickup request:

```
1. CLIENT visits imbod.com/request/{shipper-slug}
   └─> GET /v1/request/test-shipping-co (public)
       Returns shipper's business info for the form

2. CLIENT submits pickup request
   └─> POST /v1/request/test-shipping-co (public)
       - Creates pickup_request (status: PENDING)
       - Auto-creates client user if needed
       - Links client to shipper

3. SHIPPER reviews requests
   └─> GET /v1/pickup-requests
       Filter by status=PENDING

4. SHIPPER provides quote
   └─> PATCH /v1/pickup-requests/{id}
       { "status": "QUOTED", "estimatedQuoteUsd": 850 }

5. CLIENT pays (out-of-band) and proof is submitted
   └─> PATCH /v1/pickup-requests/{id}
       { "status": "PAYMENT_SUBMITTED" }

6. ADMIN verifies payment
   └─> PATCH /v1/pickup-requests/{id}
       { "status": "PAYMENT_VERIFIED" }

7. SHIPPER converts to pickup
   └─> POST /v1/pickup-requests/{id}/convert
       { "fxRateId": 1, "pickupFeeUsd": 25 }
       - Creates pickup record
       - Sets request status to CONVERTED

8. SHIPPER picks up items from seller
   └─> POST /v1/pickups/{id}/items
       { "category": "Phone", "model": "iPhone 15 Pro", "imei": "..." }

9. Track item through shipping
   └─> PATCH /v1/items/{id}
       { "status": "IN_BOX" }     -> Packed
       { "status": "IN_TRANSIT" } -> Shipped
       { "status": "DELIVERED" }  -> Arrived
       { "status": "HANDED_OFF" } -> Client received
```

## Status Reference

### Pickup Request Status
| Status | Description |
|--------|-------------|
| PENDING | Client submitted, shipper hasn't reviewed |
| QUOTED | Shipper provided estimate |
| PAYMENT_SUBMITTED | Client uploaded payment proof |
| PAYMENT_VERIFIED | Admin verified payment |
| ACCEPTED | Ready to convert to pickup |
| REJECTED | Request declined |
| CONVERTED | Converted to a Pickup (immutable) |

### Pickup Status
| Status | Description |
|--------|-------------|
| DRAFT | Pickup created, not finalized |
| CONFIRMED | Pickup confirmed, ready for processing |
| CANCELLED | Pickup cancelled |

### Item Status
| Status | Description |
|--------|-------------|
| PENDING | Item picked up, in shipper's warehouse |
| IN_BOX | Assigned to shipping box |
| IN_TRANSIT | Box shipped, on the way |
| DELIVERED | Arrived, awaiting client pickup |
| HANDED_OFF | Client received item |
| SOLD | Client sold the item (optional) |
| RETURNED | Item was returned |

## Currency Support

The system supports multi-currency FX rates:
- **USD** - US Dollar
- **NGN** - Nigerian Naira
- **GBP** - British Pound
- **EUR** - Euro

Each shipper sets their own rates. When a pickup is created/converted, the FX rate is snapshotted.

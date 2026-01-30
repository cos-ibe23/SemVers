# Listing App Feature Roadmap & Ideas

## Understanding: Box vs Shipment

- **Box** = Physical container (the actual package being shipped)
- **Shipment** = Logistics/tracking wrapper (shipping transaction, carrier info, tracking)
- Current code uses "Shipment" for what should be "Box" - needs terminology cleanup

---

## Feature Ideas (Organized by Priority)

### 🔴 HIGH PRIORITY - Reduce Clicks & Automate

#### 1. Consumer Pickup Request Link (not Publicly accessible, user requires initial vouch)

**Problem:** Shippers manually create pickups from WhatsApp messages
**Solution:** Shareable link where consumers submit pickup requests

- Shipper gets unique link: `app.com/request/[shipper-slug]`
- Consumer sign in or creates account
- Account can only be created if they have 2 vouches ( they need to include emails of who is vouching for them)
- Vouchers get a notification to approve or decline to vouch
- Consumer fills form: item type, OfferUp/marketplace link, budget, contact info
- Can add single or multiple items
- Shipper gets notification, reviews, and converts to Pickup with one click
- Auto-populate item details from from pickiup request details.


#### 2. Smart Pickup Updates (Post-Purchase Reconciliation)

**Problem:** Shipper needs to update pickup after actually buying items
**Solution:** Streamlined "Reconcile Pickup" flow

- After pickup created, shipper visits seller
- Quick update screen:
  - ✅ Bought / ❌ Didn't buy (per item)
  - Actual price paid (vs quoted)
  - Add/remove items from original request
  - Scan IMEI/barcode to auto-populate details ( for now we can use https://ifreeicloud.co.uk/client-area/ api to get the details)
- Calculate variance from original quote

#### 3. View All Pickup Request Page

**Problem:** Home only shows last 5 pickups
**Solution:** Full pickup request list with filters

- Filter by: status, client, date range, box assignment
- Search by IMEI, client name, item model
- Bulk actions: assign to box, mark as cancelled
- Export to CSV
- Pickup request clear after 7 days ( on the admin side make it editble)

#### 4. View All Pickups Page

**Problem:** Home only shows last 5 pickups
**Solution:** Full pickups list with filters

- Filter by: status, client, date range, box assignment
- Search by IMEI, client name, item model
- Bulk actions: assign to box, mark as cancelled
- Export to CSV

#### 5. Vouch

**Problem:** User needs to feel like the platform is for them only (gate keeping)
**Solution:** Introduce Vouches

- Approve or Decline Vouch

#### 6. Box Creation
- **Box**: Container with items (current "Shipment" model)
  - two types of box, box containing pickups and box assigned to another shipper 
  - Pickups
  - Dimension of the box (LxWxH)
  - Box tied to another user cannot contain pickups and user cannot be a business owner
  - box assigned to another shipper  comes from a sync from shipper A (client of Shipper B)
    - add, ship with *insert shipper*
    - Shipper B after receiving the box physically, has to approve pick up at point of recieve
    - after approval, box now appears on thier list of shippment, she can edit the box weight and dimension
    - shipper A gets a notification of the change
    - generates invoice after weight and dimensions are finalised
    - item list cannot be edited by shipper B
    - BoX and its contents can no longer be edited by shipper A
    - Shipper A uploads a screenshot of Zelle payment, Shipper B approves it as paid
    - CAN Formally Pickup Box before sync with shipper B 
    
#### 7. Shipment Separation
- **Shipment**: Actual shipping event
  - list the boxes
  - Ship date, estimated arrival


#### 9. Invoice Generation
**Timing:** Quote on pickup creation, Final invoice on delivery

Quote/Proforma (on pickup):
- Estimated costs breakdown
- FX rate snapshot
- Payment instructions
- Validity period

Final Invoice (on confirmed box details eg dimensions and weight):
- Actual costs in USD (reconciled)
- Box fees allocated
- Payment status
- PDF download, email to client
---

### 🟡 MEDIUM PRIORITY - Better Visibility & Tracking

#### 3. IMEI/Barcode Scanner
**Problem:** Manual IMEI entry is error-prone
**Solution:** Camera-based scanning

- Scan IMEI barcode or type manually
- Call IMEI API to get: brand, model, storage, color, blacklist status
- Auto-fill item details
- Flag blacklisted devices before shipping

#### 13. Notifications
- Email/SMS when box ships
- Pickup code delivery
- Payment reminders
- Low inventory alerts (for resellers)


#### 6. Item Status Tracking (Sold/Delivered/In-Transit)
**Problem:** Can't track item lifecycle after delivery
**Solution:** Item-level status field

States:
- `PENDING` - In pickup, not yet in box
- `IN_BOX` - Assigned to box, not shipped
- `IN_TRANSIT` - Box shipped
- `DELIVERED` - Box delivered, awaiting client pickup
- `HANDED_OFF` - Client received item (pickup code used)
- `SOLD` - Item sold by client (optional tracking)
- `RETURNED` - Item returned

Only allow "SOLD" marking after HANDED_OFF state.

#### 7. Home Page Improvements
- Add "Recent Shipments" section (actual shipping events with tracking)
- Quick stats: items in transit, pending pickups, revenue this week
- Action buttons: "New Pickup Request", "Create Box", "View All"



---

### 🟢 LOWER PRIORITY - Invoicing, Taxes, Admin



#### 10. Tax Reporting
**Export Reports:**
- Income by period (monthly, quarterly, yearly)
- Expenses by category (pickup costs, shipping, fees)
- Client payment summary
- CSV/PDF export for accountant

**Auto-Calculate:**
- Estimated quarterly taxes (configurable rate)
- Profit margin analysis
- FX gain/loss tracking

#### 11. Super Admin Dashboard
- View all users/shippers
- User verification/approval
- Global stats (total volume, revenue)
- Feature flags per user
- Support ticket view

---

## Additional Ideas

#### 12. Client Portal
- Clients log in to see their orders
- Track shipment status
- View/pay invoices
- Request new pickups


#### 14. Marketplace Integration
- OfferUp link paste → auto-extract item details
- Facebook Marketplace scraping
- Price comparison across marketplaces

#### 15. Repeating Pickups
- For regular clients, create recurring pickup templates
- "John orders iPhone 15 Pro Max every week" → one-click create

#### 16. Mobile App / PWA
- Quick IMEI scanning
- Photo capture of items
- Offline pickup creation (sync later)


#### 17. Virtual reality app.
---

## Recommended Implementation Order

### Phase 1: Core Automation (Weeks 1-2)
1. View All Pickups page
2. Bulk pickup creation / templates
3. IMEI scanner integration
4. Smart pickup reconciliation flow

### Phase 2: Consumer Experience (Weeks 3-4)
5. Consumer pickup request link
6. Item status tracking
7. Basic invoice generation (PDF)

### Phase 3: Business Intelligence (Weeks 5-6)
8. Box vs Shipment separation
9. Tax export reports
10. Home page improvements

### Phase 4: Scale & Admin (Weeks 7-8)
11. Super admin dashboard
12. Client portal
13. Notifications system

---

## Confirmed Decisions

1. **Payment Flow:** Request only - consumer submits, shipper quotes, payment happens offline
2. **IMEI API:** Research needed - will evaluate imei.info, imeicheck.com, etc.
3. **MVP Features (All 4 selected):**
   - View All Pickups
   - Consumer Request Link
   - IMEI Scanner
   - Bulk Pickup Creation

---

## Complete API Specification (Hono + Zod)

### Tech Stack
- **Runtime:** Node.js / Bun
- **Framework:** Hono
- **Validation:** Zod
- **ORM:** Drizzle
- **Database:** PostgreSQL
- **Auth:** Better Auth (handles users, sessions, accounts, verification tokens)

### User Types & Authentication Methods
| User Type | Description |
|-----------|-------------|
| **Admin** | Platform administrators, can view/manage all users and impersonate shippers/clients |
| **Shipper** | Business owners who pick up and ship items |
| **Client** | End customers who request pickups from shippers |

**Authentication:** All users can sign in via **Email/Password** OR **Google OAuth**. The `role` field determines what they can access, not how they authenticate.

All users share the same Better Auth `user` table with a `role` field to distinguish types.

### Functionality by User Type

#### Admin Capabilities
- **Admin Dashboard** (`/admin/dashboard`): See all shippers, all clients, platform stats
- **View as Shipper** (`/admin/shipper/:id/*`): Click any shipper → see their exact dashboard/pickups/boxes/etc
- **View as Client** (`/admin/client/:id/*`): Click any client → see their exact portal view
- Create/manage other admin users
- Verify/suspend any shipper or client
- Access platform-wide statistics and analytics
- Configure platform settings
- View audit logs of all admin actions
- Admin bar always visible showing "Viewing as: [Name]" with back button

#### Shipper Capabilities
- Complete onboarding (business profile, logo)
- Manage their own clients
- Create/manage pickups, items, boxes, shipments
- Configure FX rates and payment methods
- Generate invoices and reports
- View financial dashboards (their own data)
- Share public pickup request link with consumers

#### Client Capabilities
- Self-register via shipper's public link
- Submit pickup requests
- View their orders and item status
- Track shipments
- View and download invoices
- Submit payment proofs
- Update their profile
- Receive notifications

---

## Authentication APIs (Better Auth)

Better Auth handles authentication out of the box. All auth endpoints are mounted at `/api/auth/*`.

### Better Auth Configuration

```typescript
// auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin } from "better-auth/plugins";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  // Email/Password - available to ALL users
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      // Send password reset email via Resend/SendGrid/etc
    },
    sendVerificationEmail: async ({ user, url }) => {
      // Send email verification
    },
  },

  // Google OAuth - available to ALL users
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },

  // Admin plugin for role-based access
  plugins: [
    admin({
      defaultRole: "CLIENT",  // New signups default to CLIENT
      adminRole: "ADMIN",
    }),
  ],

  // Custom user fields
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "CLIENT",
        input: false,  // Cannot be set by user during signup
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24,     // 1 day
  },
});
```

### Role Assignment Logic
- **New signup (email/password)**: Defaults to `CLIENT`, linked to shipper via `shipperSlug` in signup
- **New signup (Google OAuth)**: Defaults to `SHIPPER` (business owners typically use Google)
- **Admin creation**: Only existing admins can create new admins via `/admin/users/create`
- **Role changes**: Only admins can change roles via `/admin/users/:id`

### Better Auth Tables (Auto-managed)
Better Auth automatically creates and manages these tables:
- `user` - Core user data (id, name, email, emailVerified, image, role, createdAt, updatedAt)
- `session` - Active sessions (id, userId, token, expiresAt, ipAddress, userAgent)
- `account` - OAuth accounts (id, userId, provider, providerAccountId, accessToken, refreshToken)
- `verification` - Email/password verification tokens

### Universal Auth Endpoints (All Users)
```
POST /api/auth/signup
     → Email/password signup
     Body: { email, password, name, shipperSlug? }
     → If shipperSlug provided: creates CLIENT linked to that shipper
     → If no shipperSlug: creates SHIPPER (new business)
     Response: { user, session }

POST /api/auth/signin/email
     → Email/password login (any role)
     Body: { email, password }
     Response: { user, session }

GET  /api/auth/signin/google
     → Redirects to Google OAuth consent screen

GET  /api/auth/callback/google
     → Google OAuth callback
     → New users default to SHIPPER role
     → Existing users: just creates session
     Response: redirects with session cookie

POST /api/auth/signout
     → Sign out (any role)
     Response: { success: true }

GET  /api/auth/session
     → Get current session + user
     Response: { session, user: { id, email, name, role, ... } }

POST /api/auth/forgot-password
     → Request password reset email
     Body: { email }
     Response: { success: true }

POST /api/auth/reset-password
     → Reset password with token
     Body: { token, newPassword }
     Response: { success: true }

POST /api/auth/verify-email
     → Verify email with token
     Body: { token }
     Response: { success: true }
```

### Role-Specific Session Endpoint
```
GET  /api/auth/me
     → Get current user with role-specific data
     Response (ADMIN):   { user, role: 'ADMIN' }
     Response (SHIPPER): { user, profile, role: 'SHIPPER' }
     Response (CLIENT):  { user, client, shipper: { name, logo }, role: 'CLIENT' }
```

### Frontend Role-Based Routing
After login, frontend checks `user.role` and redirects:
- `ADMIN` → `/admin/dashboard` (can switch to shipper/client view)
- `SHIPPER` → `/dashboard` (shipper dashboard)
- `CLIENT` → `/portal` (client portal)

**MVP Priority:**
1. **Shipper flows** - Full implementation
2. **Client flows** - Full implementation
3. **Admin flows** - Can wait, but schema should support it

---

## Admin APIs

### Admin Dashboard & Navigation Flow

**Admin lands on `/admin/dashboard`** which shows:
- Platform overview (total users, shippers, clients, revenue)
- List of all shippers (with search/filter)
- List of all clients (with search/filter)
- Pending verifications
- Recent activity

**When admin clicks on a shipper** → `/admin/shipper/:id/dashboard`
- Admin sees the SAME dashboard UI as the shipper would see
- But URL is prefixed with `/admin/shipper/:id/`
- Admin bar at top shows "Viewing as: [Shipper Name]" with back button
- All shipper routes become `/admin/shipper/:id/pickups`, `/admin/shipper/:id/boxes`, etc.

**When admin clicks on a client** → `/admin/client/:id/portal`
- Admin sees the SAME portal UI as the client would see
- URL is prefixed with `/admin/client/:id/`
- Admin bar shows "Viewing as: [Client Name] (Shipper: [Shipper Name])"

### Admin Context API Pattern
All shipper/client APIs work with admin context:
```
GET /pickups                           → Returns current user's pickups
GET /admin/shipper/:userId/pickups     → Returns that shipper's pickups (admin only)

GET /client/dashboard                  → Returns current client's dashboard
GET /admin/client/:userId/dashboard    → Returns that client's dashboard (admin only)
```

Backend checks: if route starts with `/admin/shipper/:id` or `/admin/client/:id`, verify caller is ADMIN, then return data for that user.

### Admin Dashboard
```
GET  /admin/dashboard
     → Admin home - platform overview
     Response: {
       stats: { totalShippers, totalClients, totalPickups, totalBoxes, totalRevenue },
       pendingVerifications: number,
       recentShippers: Shipper[],       // Last 10 signups
       recentClients: Client[],         // Last 10 signups
       recentActivity: ActivityLog[]    // Last 20 actions
     }
```

### Admin User Management
```
POST /admin/users/create
     → Create new admin user (super admin only)
     Body: { email, password, name }
     → Sets role='ADMIN' on creation
     Response: { user }

GET  /admin/users
     Query: ?page=1&limit=20&search=&role=SHIPPER|CLIENT|ADMIN
     → List all users (filterable by role)
     Response: { data: User[], total }

GET  /admin/users/:id
     → Get user details + stats
     Response: { user, profile?, stats }

PATCH /admin/users/:id
     Body: { verified?, suspended?, role? }
     → Update user status or role
     Response: { user }

DELETE /admin/users/:id
     → Suspend/deactivate user
     Response: { success: true }
```

### Admin Shipper Management
```
GET  /admin/shippers
     Query: ?page=1&limit=20&search=&verified=
     → List all shippers with their profiles
     Response: { data: Shipper[], total }

GET  /admin/shippers/:id
     → Get shipper details with full business info
     Response: { user, profile, stats }

PATCH /admin/shippers/:id/verify
     → Verify/approve shipper
     Body: { verified: boolean, note? }
     Response: { success: true }
```

### Admin Client Management
```
GET  /admin/clients
     Query: ?page=1&limit=20&search=&shipperId=
     → List all clients (optionally filter by shipper)
     Response: { data: Client[], total }

GET  /admin/clients/:id
     → Get client details with their shipper info
     Response: { user, client, shipper, stats }
```

### Admin Viewing As Shipper (Context Routes)
When admin views a shipper's data, all shipper routes are prefixed:
```
GET  /admin/shipper/:userId/dashboard    → Shipper's dashboard
GET  /admin/shipper/:userId/pickups      → Shipper's pickups
GET  /admin/shipper/:userId/boxes        → Shipper's boxes
GET  /admin/shipper/:userId/clients      → Shipper's clients
GET  /admin/shipper/:userId/invoices     → Shipper's invoices
... (all shipper routes available under this prefix)
```

### Admin Viewing As Client (Context Routes)
When admin views a client's data:
```
GET  /admin/client/:userId/dashboard     → Client's portal dashboard
GET  /admin/client/:userId/pickups       → Client's pickups
GET  /admin/client/:userId/items         → Client's items
GET  /admin/client/:userId/invoices      → Client's invoices
... (all client routes available under this prefix)
```

### Admin Platform Stats
```
GET  /admin/stats
     → Platform-wide statistics
     Response: {
       totalUsers, totalShippers, totalClients,
       totalPickups, totalBoxes, totalRevenue,
       activeShippers, pendingVerifications
     }

GET  /admin/stats/revenue
     Query: ?period=daily|weekly|monthly&start=&end=
     → Revenue analytics
     Response: { data: [{ date, revenue, pickups, boxes }] }

GET  /admin/audit-log
     Query: ?userId=&action=&page=1&limit=50
     → Audit trail of all admin actions
     Response: { data: AuditLog[], total }
```

### Admin Settings
```
GET  /admin/settings
     → Get platform settings
     Response: { settings }

PATCH /admin/settings
     Body: { settingKey: value, ... }
     → Update platform settings
     Response: { settings }
```

---

## Shipper APIs

### Shipper Profile & Onboarding

```
GET  /users/me
     → Current user info
     Response: { id, email, name, createdAt }

PATCH /users/me
     Body: { name }
     → Update user name

GET  /profile
     → Get shipper profile
     Response: { role, businessName, logoUrl, address, phone, onboardedAt }

POST /profile/onboard
     Body: { role, businessName, logoUrl?, street?, city?, state?, country?, phone? }
     → Complete onboarding

PATCH /profile
     Body: { businessName?, logoUrl?, ... }
     → Update profile

POST /uploads/logo/presign
     Body: { filename, contentType }
     → Get S3 presigned upload URL
     Response: { uploadUrl, publicUrl }
```

---

## Client APIs

```
GET  /clients
     Query: ?search=&page=1&limit=20
     → List shipper's clients
     Response: { data: Client[], total, page, limit }

POST /clients
     Body: { name, email?, phone? }
     → Create client

GET  /clients/:id
     → Get client details

PATCH /clients/:id
     Body: { name?, email?, phone? }
     → Update client

DELETE /clients/:id
     → Soft delete client

GET  /clients/:id/pickups
     Query: ?page=1&limit=20
     → Client's pickup history

GET  /clients/:id/pnl
     Query: ?start=&end=
     → Client P&L report
```

---

## Pickup Request APIs (Consumer-facing, PUBLIC)

```
GET  /request/:slug
     → Get shipper info for public form (no auth)
     Response: { shipperName, logoUrl, categories, paymentMethods }

POST /request/:slug
     Body: {
       consumerName, consumerEmail, consumerPhone,
       items: [{ category, description, marketplaceUrl?, budgetUsd? }]
     }
     → Submit pickup request (no auth)
     Response: { requestId, status: 'PENDING' }

GET  /request/:slug/status/:requestId
     → Check request status (no auth)
     Response: {
       status, estimatedQuote?, message?,
       paymentStatus, paymentInstructions?
     }

POST /request/:slug/payment/:requestId
     → Consumer submits payment proof (no auth)
     Body: {
       paymentMethod: 'ZELLE' | 'CASHAPP' | 'VENMO' | 'BANK_TRANSFER' | 'OTHER',
       transactionReference?: string,  // e.g., Zelle confirmation number
       screenshotUrl?: string,         // uploaded payment screenshot
       amountPaid: number,
       notes?: string
     }
     Response: { success: true, paymentId }

POST /request/:slug/payment/:requestId/upload
     → Upload payment screenshot (no auth, returns URL)
     Body: FormData with image file
     Response: { screenshotUrl }
```

### Payment Confirmation Flow
1. Consumer submits pickup request
2. Shipper sends quote with payment instructions (Zelle to xyz@email.com, CashApp $handle, etc.)
3. Consumer pays offline (Zelle, CashApp, etc.)
4. Consumer returns to same link, submits payment proof:
   - Transaction reference/confirmation number
   - Screenshot of payment confirmation
   - Amount paid
5. Shipper sees payment proof in dashboard, verifies, marks as paid
6. Shipper converts to pickup once confirmed

---

## Pickup Request APIs (Shipper-facing, AUTH REQUIRED)

```
GET  /pickup-requests
     Query: ?status=PENDING&page=1&limit=20
     → List incoming requests
     Response: { data: PickupRequest[], total }

GET  /pickup-requests/:id
     → Get request details

PATCH /pickup-requests/:id
     Body: { status: 'ACCEPTED'|'REJECTED', message? }
     → Accept/reject request

POST /pickup-requests/:id/quote
     Body: { estimatedTotalUsd, breakdown, validUntil }
     → Send quote to consumer

POST /pickup-requests/:id/convert
     Body: { clientId?, pickupFeeUsd, itemPriceUsd, fxRateId }
     → Convert to actual pickup
     Response: { pickupId }

GET  /pickup-requests/:id/payments
     → View payment proofs submitted by consumer
     Response: { payments: [{ id, method, reference, screenshotUrl, amount, status, submittedAt }] }

PATCH /pickup-requests/:id/payments/:paymentId
     Body: { status: 'VERIFIED' | 'REJECTED', note? }
     → Verify or reject payment proof

GET  /shipper/payment-methods
     → Get shipper's configured payment methods
     Response: { methods: [{ type, handle, instructions }] }

POST /shipper/payment-methods
     Body: { type: 'ZELLE'|'CASHAPP'|..., handle, instructions? }
     → Add payment method

DELETE /shipper/payment-methods/:id
     → Remove payment method

GET  /shipper/request-link
     → Get shipper's public request link
     Response: { slug, url }

POST /shipper/request-link/regenerate
     → Generate new slug
```

---

## Pickup APIs

```
GET  /pickups
     Query: ?page=1&limit=20&clientId=&status=&boxId=&search=&startDate=&endDate=
     → List pickups with filters
     Response: { data: Pickup[], total, page }

POST /pickups
     Body: { clientId, pickupFeeUsd, itemPriceUsd?, notes?, pickupDate? }
     → Create pickup

POST /pickups/bulk
     Body: { pickups: [{ clientId, pickupFeeUsd, ... }] }
     → Bulk create pickups
     Response: { created: Pickup[], errors: [] }

GET  /pickups/:id
     → Get pickup with items
     Response: { pickup, items, fxRate, assignedBox }

PATCH /pickups/:id
     Body: { pickupFeeUsd?, itemPriceUsd?, notes?, status? }
     → Update pickup

DELETE /pickups/:id
     → Delete pickup (and items)

POST /pickups/:id/clone
     → Clone pickup
     Response: { pickupId }

GET  /pickups/export
     Query: ?format=csv&startDate=&endDate=
     → Export pickups to CSV
```

---

## Item APIs

```
GET  /items
     Query: ?page=1&limit=20&unassigned=&boxId=&status=&search=
     → List items with filters

POST /pickups/:pickupId/items
     Body: { category, model?, imei?, estimatedWeightLb?, clientShippingUsd?, serviceFeeUsd?, fxRateId? }
     → Add item to pickup

POST /pickups/:pickupId/items/bulk
     Body: { items: [...] }
     → Bulk add items

GET  /items/:id
     → Get item details

PATCH /items/:id
     Body: { category?, model?, imei?, status?, ... }
     → Update item

DELETE /items/:id
     → Delete item

PATCH /items/:id/status
     Body: { status: 'SOLD'|'RETURNED'|... }
     → Update item lifecycle status
     (Validates allowed transitions)
```

---

## IMEI/Device APIs

```
POST /imei/lookup
     Body: { imei }
     → Lookup device info from IMEI API
     Response: { brand, model, storage?, color?, blacklisted, carrier? }

POST /imei/scan
     Body: { imageBase64 }
     → Extract IMEI from barcode image
     Response: { imei, confidence }

GET  /imei/history
     Query: ?page=1&limit=20
     → Past IMEI lookups (for caching/audit)
```

---

## FX Rate APIs

```
GET  /fx-rates
     Query: ?active=true
     → List FX rates

POST /fx-rates
     Body: { buyRateUsdNgn, clientRateUsdNgn, atmFeePer990Usd? }
     → Create FX rate snapshot

GET  /fx-rates/:id
     → Get rate details

GET  /fx-rates/current
     → Get most recent active rate
```

---

## Box APIs (Physical Container)

```
GET  /boxes
     Query: ?status=OPEN|DELIVERED&page=1&limit=20
     → List boxes

POST /boxes
     Body: { label?, estimatedWeightLb? }
     → Create box (auto-generates week label if empty)

GET  /boxes/:id
     → Get box with items
     Response: { box, items, shipment? }

PATCH /boxes/:id
     Body: { label?, actualWeightLb?, shipperRatePerLb?, insuranceUsd? }
     → Update box

DELETE /boxes/:id
     → Delete box (unassigns items)

POST /boxes/:id/items
     Body: { itemIds: [] }
     → Add items to box

DELETE /boxes/:id/items
     Body: { itemIds: [] }
     → Remove items from box

POST /boxes/:id/deliver
     → Mark box delivered, generate pickup codes
     Response: { codes: [{ clientId, code }] }

POST /boxes/:id/reconcile
     → Reconcile costs, allocate to items
     Response: { allocations }

GET  /boxes/:id/manifest
     → Get delivery manifest (no pricing)
     Response: { clients: [{ name, items, pickupCode }] }

GET  /boxes/:id/pnl
     → Box profit/loss report

GET  /boxes/:id/summary
     → Box summary stats
```

---

## Shipment APIs (Logistics/Tracking)

```
GET  /shipments
     Query: ?page=1&limit=20
     → List shipments

POST /shipments
     Body: { boxIds: [], carrier, trackingNumber?, shipDate? }
     → Create shipment for boxes

GET  /shipments/:id
     → Get shipment details with boxes

PATCH /shipments/:id
     Body: { trackingNumber?, carrier?, estimatedArrival?, status? }
     → Update shipment

POST /shipments/:id/track
     → Fetch latest tracking info from carrier API
     Response: { status, location, events }
```

---

## Invoice APIs

```
GET  /invoices
     Query: ?type=QUOTE|FINAL&clientId=&page=1&limit=20
     → List invoices

POST /pickups/:id/invoice/quote
     → Generate quote/proforma invoice
     Response: { invoiceId, pdfUrl }

POST /boxes/:id/invoice/final
     → Generate final invoice for delivered box
     Response: { invoiceId, pdfUrl }

GET  /invoices/:id
     → Get invoice details

GET  /invoices/:id/pdf
     → Download invoice PDF

POST /invoices/:id/send
     Body: { email }
     → Email invoice to client
```

---

## Dashboard & Reports APIs

```
GET  /dashboard
     → Home dashboard stats
     Response: {
       pickupsThisWeek, openBoxes, itemsInTransit,
       recentPickups, recentBoxes, pendingRequests
     }

GET  /dashboard/finance
     Query: ?year=&month=
     → Finance dashboard
     Response: { grossUsd, grossNgn, boxFeeUsd, netProfitUsd, boxes, pickups }

GET  /reports/weekly
     Query: ?start=&weeks=4
     → Weekly aggregate report

GET  /reports/tax
     Query: ?year=&quarter=
     → Tax report
     Response: { income, expenses, estimatedTax, transactions }

GET  /reports/tax/export
     Query: ?year=&format=csv|pdf
     → Export tax report
```

---

## Webhook APIs (Future)

```
POST /webhooks/carrier
     → Carrier tracking updates

POST /webhooks/payment
     → Payment provider callbacks
```

---

## Client Portal APIs

Clients are stored in Better Auth's `user` table with `role='CLIENT'`, plus a separate `clients` table that links them to their shipper and stores client-specific data.

**Note:** Auth endpoints are shared (see Universal Auth Endpoints above). Clients sign up via shipper's public link with `shipperSlug` parameter.

### Client Dashboard
```
GET  /client/dashboard
     → Client home stats
     Response: {
       activeOrders, itemsInTransit, totalSpent,
       recentPickups, pendingPayments
     }

GET  /client/pickups
     Query: ?status=&page=1&limit=20
     → Client's pickup history
     Response: { data: Pickup[], total }

GET  /client/pickups/:id
     → Pickup details with items, status, tracking

GET  /client/items
     Query: ?status=&page=1&limit=20
     → All client's items across pickups

GET  /client/items/:id
     → Item details with tracking history
```

### Client Requests & Orders
```
POST /client/requests
     → Submit new pickup request (logged in)
     Body: {
       items: [{ category, description, marketplaceUrl?, budgetUsd? }],
       notes?
     }
     Response: { requestId }

GET  /client/requests
     Query: ?status=&page=1&limit=20
     → Client's pickup requests

GET  /client/requests/:id
     → Request details with quote, payment status

POST /client/requests/:id/payment
     → Submit payment proof
     Body: { paymentMethod, transactionReference?, screenshotUrl?, amountPaid }
```

### Client Invoices & Payments
```
GET  /client/invoices
     Query: ?status=PAID|UNPAID&page=1&limit=20
     → Client's invoices

GET  /client/invoices/:id
     → Invoice details

GET  /client/invoices/:id/pdf
     → Download invoice PDF

GET  /client/payments
     → Payment history
```

### Client Profile
```
GET  /client/profile
     → Client profile info

PATCH /client/profile
     Body: { name?, phone?, address? }
     → Update profile

PATCH /client/profile/password
     Body: { currentPassword, newPassword }
```

### Client Notifications
```
GET  /client/notifications
     → Notification history (shipment updates, payment confirmations, etc.)
     Response: { data: Notification[], unreadCount }

PATCH /client/notifications/:id/read
     → Mark notification as read

POST /client/notifications/mark-all-read
     → Mark all notifications as read
```

---

## Category Configuration APIs (For Scaling to Other Businesses)

### Shipper Categories
```
GET  /categories
     → List shipper's item categories
     Response: { categories: [{ id, name, fields, defaults, requiresImei }] }

POST /categories
     → Create custom category
     Body: {
       name: string,              // "Phones", "Shoes", "Documents"
       fields: [{                 // Custom fields for this category
         name: string,            // "imei", "size", "color", "condition"
         type: 'text'|'number'|'select'|'boolean',
         required: boolean,
         options?: string[]       // For select type
       }],
       defaults: {
         estimatedWeightLb?: number,
         clientShippingUsd?: number,
         serviceFeeUsd?: number
       },
       requiresImei: boolean      // true for electronics
     }

GET  /categories/:id
     → Get category details

PATCH /categories/:id
     → Update category

DELETE /categories/:id
     → Delete category (soft delete if items exist)
```

### System Category Templates
```
GET  /categories/templates
     → Get system category templates for quick-start
     Response: {
       templates: [
         {
           name: "Phones",
           fields: [
             { name: "imei", type: "text", required: true },
             { name: "storage", type: "select", options: ["64GB", "128GB", "256GB", "512GB", "1TB"] },
             { name: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] }
           ],
           defaults: { estimatedWeightLb: 1.2, clientShippingUsd: 30 },
           requiresImei: true
         },
         {
           name: "Laptops",
           fields: [
             { name: "imei", type: "text", required: false },
             { name: "specs", type: "text" },
             { name: "condition", type: "select", options: ["New", "Like New", "Good", "Fair"] }
           ],
           defaults: { estimatedWeightLb: 4.0, clientShippingUsd: 25 },
           requiresImei: false
         },
         {
           name: "Shoes",
           fields: [
             { name: "size", type: "text", required: true },
             { name: "brand", type: "text" },
             { name: "condition", type: "select", options: ["New", "Used"] }
           ],
           defaults: { estimatedWeightLb: 2.0, clientShippingUsd: 20 },
           requiresImei: false
         },
         {
           name: "Documents",
           fields: [
             { name: "type", type: "select", options: ["Passport", "ID", "Certificate", "Other"] },
             { name: "urgent", type: "boolean" }
           ],
           defaults: { estimatedWeightLb: 0.5, clientShippingUsd: 15 },
           requiresImei: false
         },
         {
           name: "Car Parts",
           fields: [
             { name: "partNumber", type: "text" },
             { name: "vehicle", type: "text" },
             { name: "condition", type: "select", options: ["New", "Used", "Refurbished"] }
           ],
           defaults: { estimatedWeightLb: 5.0, clientShippingUsd: 40 },
           requiresImei: false
         }
       ]
     }

POST /categories/from-template
     Body: { templateName }
     → Create category from system template
```

---

## Database Schema (Drizzle)

### Better Auth Tables (Auto-generated)
Better Auth automatically creates and manages these tables - do NOT modify directly:

```typescript
// user (Better Auth managed)
user: {
  id: text primaryKey,                    // cuid or uuid
  name: text,
  email: text unique notNull,
  emailVerified: boolean default false,
  image: text,
  role: enum('ADMIN', 'SHIPPER', 'CLIENT') default 'CLIENT',  // User type
  suspended: boolean default false,       // Admin can suspend users
  createdAt: timestamp defaultNow,
  updatedAt: timestamp
}

// session (Better Auth managed)
session: {
  id: text primaryKey,
  userId: text references user,
  token: text unique notNull,
  expiresAt: timestamp notNull,
  ipAddress: text,
  userAgent: text,
  createdAt: timestamp defaultNow,
  updatedAt: timestamp
}

// account (Better Auth managed - for OAuth)
account: {
  id: text primaryKey,
  userId: text references user,
  accountId: text notNull,                // provider's account ID
  providerId: text notNull,               // 'google', 'github', etc.
  accessToken: text,
  refreshToken: text,
  accessTokenExpiresAt: timestamp,
  refreshTokenExpiresAt: timestamp,
  scope: text,
  idToken: text,
  createdAt: timestamp defaultNow,
  updatedAt: timestamp
}

// verification (Better Auth managed - for email verification, password reset)
verification: {
  id: text primaryKey,
  identifier: text notNull,               // email address
  value: text notNull,                    // verification token
  expiresAt: timestamp notNull,
  createdAt: timestamp defaultNow,
  updatedAt: timestamp
}
```

### Application Tables (Custom)

```typescript
// shipper_profiles (extends Better Auth user for shippers)
shipperProfiles: {
  id: serial primaryKey,
  userId: text references user unique,    // Better Auth user ID
  role: enum('SHIPPER', 'BUSINESS_OWNER'),
  businessName: varchar,
  logoUrl: varchar,
  street, city, state, country: varchar,
  phoneCountryCode, phoneNumber: varchar,
  requestSlug: varchar unique,            // for public pickup request link
  onboardedAt: timestamp,
  createdAt: timestamp defaultNow
}

// clients (links Better Auth user to shipper)
clients: {
  id: serial primaryKey,
  userId: text references user unique,    // Better Auth user ID (for client login)
  shipperUserId: text references user,    // The shipper who owns this client
  name: varchar notNull,
  phone: varchar,
  address: text,
  createdAt: timestamp defaultNow
}

// client_notifications
clientNotifications: {
  id: serial primaryKey,
  clientId: integer references clients,
  type: enum('SHIPMENT_UPDATE', 'PAYMENT_RECEIVED', 'PICKUP_READY', 'INVOICE'),
  title: varchar notNull,
  message: text,
  relatedPickupId: integer references pickups,
  relatedBoxId: integer references boxes,
  isRead: boolean default false,
  createdAt: timestamp defaultNow
}

// pickup_requests (consumer submissions)
pickupRequests: {
  id: serial primaryKey,
  shipperUserId: text references user,    // Better Auth user ID
  clientId: integer references clients,   // Link to client if logged in
  consumerName, consumerEmail, consumerPhone: varchar,
  status: enum('PENDING', 'QUOTED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'ACCEPTED', 'REJECTED', 'CONVERTED'),
  estimatedQuoteUsd: decimal,
  paymentStatus: enum('UNPAID', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'),
  convertedPickupId: integer references pickups,
  createdAt: timestamp defaultNow
}

// payment_proofs (consumer payment submissions)
paymentProofs: {
  id: serial primaryKey,
  requestId: integer references pickupRequests,
  paymentMethod: enum('ZELLE', 'CASHAPP', 'VENMO', 'BANK_TRANSFER', 'OTHER'),
  transactionReference: varchar,  // confirmation number
  screenshotUrl: varchar,         // S3 URL to screenshot
  amountPaid: decimal notNull,
  currency: varchar default 'USD',
  notes: text,
  status: enum('PENDING', 'VERIFIED', 'REJECTED') default 'PENDING',
  verifiedByUserId: text references user,  // Better Auth user ID
  verifiedAt: timestamp,
  rejectionReason: text,
  createdAt: timestamp defaultNow
}

// shipper_payment_methods (shipper's payment info for consumers)
shipperPaymentMethods: {
  id: serial primaryKey,
  userId: text references user,           // Better Auth user ID
  type: enum('ZELLE', 'CASHAPP', 'VENMO', 'BANK_TRANSFER', 'PAYPAL', 'OTHER'),
  handle: varchar notNull,  // email, $cashtag, phone, etc.
  instructions: text,       // "Send to xyz@email.com with your name in memo"
  isActive: boolean default true,
  createdAt: timestamp defaultNow
}

// pickup_request_items
pickupRequestItems: {
  id: serial primaryKey,
  requestId: integer references pickupRequests,
  category: varchar,
  description: text,
  marketplaceUrl: varchar,
  budgetUsd: decimal
}

// fx_rates
fxRates: {
  id: serial primaryKey,
  buyRateUsdNgn: decimal notNull,
  clientRateUsdNgn: decimal notNull,
  atmFeePer990Usd: decimal default 0,
  createdAt: timestamp defaultNow
}

// pickups
pickups: {
  id: serial primaryKey,
  ownerUserId: text references user,      // Better Auth user ID (shipper)
  clientId: integer references clients,
  pickupFeeUsd: decimal default 0,
  itemPriceUsd: decimal default 0,
  notes: text,
  pickupDate: date,
  status: enum('DRAFT', 'CONFIRMED', 'CANCELLED'),
  sourceRequestId: integer references pickupRequests, // if converted from request
  createdAt: timestamp defaultNow
}

// items
items: {
  id: serial primaryKey,
  pickupId: integer references pickups,
  boxId: integer references boxes,
  category: varchar notNull,
  model: varchar,
  imei: varchar,
  imeiSource: varchar,
  estimatedWeightLb: decimal default 0,
  clientShippingUsd: decimal default 0,
  serviceFeeUsd: decimal default 0,
  clientPaidNgn: decimal,
  fxRateId: integer references fxRates,
  allocatedShipperUsd: decimal,
  status: enum('PENDING', 'IN_BOX', 'IN_TRANSIT', 'DELIVERED', 'HANDED_OFF', 'SOLD', 'RETURNED'),
  createdAt: timestamp defaultNow
}

// boxes (physical containers)
boxes: {
  id: serial primaryKey,
  ownerUserId: text references user,      // Better Auth user ID (shipper)
  label: varchar,
  estimatedWeightLb: decimal,
  actualWeightLb: decimal,
  shipperRatePerLb: decimal,
  insuranceUsd: decimal default 0,
  status: enum('OPEN', 'SEALED', 'SHIPPED', 'DELIVERED'),
  deliveredAt: timestamp,
  createdAt: timestamp defaultNow
}

// shipments (logistics)
shipments: {
  id: serial primaryKey,
  ownerUserId: text references user,      // Better Auth user ID (shipper)
  carrier: varchar, // DHL, FedEx, etc
  trackingNumber: varchar,
  shipDate: date,
  estimatedArrival: date,
  actualArrival: date,
  status: enum('PENDING', 'IN_TRANSIT', 'DELIVERED'),
  createdAt: timestamp defaultNow
}

// box_shipments (many-to-many)
boxShipments: {
  boxId: integer references boxes,
  shipmentId: integer references shipments,
  primaryKey: [boxId, shipmentId]
}

// pickup_codes
pickupCodes: {
  id: serial primaryKey,
  boxId: integer references boxes,
  clientId: integer references clients,
  code: varchar notNull,
  usedAt: timestamp,
  createdAt: timestamp defaultNow
}

// imei_scans
imeiScans: {
  id: serial primaryKey,
  imei: varchar notNull,
  provider: varchar,
  result: jsonb, // cached API response
  costUsd: decimal,
  createdAt: timestamp defaultNow
}

// invoices
invoices: {
  id: serial primaryKey,
  ownerUserId: text references user,      // Better Auth user ID (shipper)
  clientId: integer references clients,
  pickupId: integer references pickups,
  boxId: integer references boxes,
  type: enum('QUOTE', 'FINAL'),
  totalUsd: decimal,
  totalNgn: decimal,
  pdfUrl: varchar,
  sentAt: timestamp,
  createdAt: timestamp defaultNow
}

// templates (for bulk pickup creation)
pickupTemplates: {
  id: serial primaryKey,
  ownerUserId: text references user,      // Better Auth user ID (shipper)
  name: varchar,
  categoryId: integer references categories,  // link to category
  defaultPickupFeeUsd: decimal,
  defaultClientShippingUsd: decimal,
  createdAt: timestamp defaultNow
}

// categories (flexible item categories for scaling)
categories: {
  id: serial primaryKey,
  ownerUserId: text references user,          // Better Auth user ID (shipper)
  name: varchar notNull,                      // "Phones", "Shoes", etc.
  fields: jsonb notNull,                      // custom field definitions
  /*
    fields example:
    [
      { "name": "imei", "type": "text", "required": true },
      { "name": "storage", "type": "select", "options": ["64GB", "128GB"], "required": false },
      { "name": "condition", "type": "select", "options": ["New", "Used"], "required": true }
    ]
  */
  defaults: jsonb,                            // default values
  /*
    defaults example:
    { "estimatedWeightLb": 1.2, "clientShippingUsd": 30, "serviceFeeUsd": 5 }
  */
  requiresImei: boolean default false,        // for electronics
  isActive: boolean default true,
  sortOrder: integer default 0,               // for UI ordering
  createdAt: timestamp defaultNow
}

// item_custom_fields (stores custom field values per item)
itemCustomFields: {
  id: serial primaryKey,
  itemId: integer references items,
  fieldName: varchar notNull,                 // e.g., "storage", "size", "condition"
  fieldValue: varchar,                        // e.g., "128GB", "10.5", "New"
  createdAt: timestamp defaultNow
}

// audit_log (admin action tracking)
auditLog: {
  id: serial primaryKey,
  adminUserId: text references user,          // Admin who performed action
  action: varchar notNull,                    // 'USER_SUSPENDED', 'SHIPPER_VERIFIED', etc.
  targetType: varchar,                        // 'USER', 'SHIPPER', 'CLIENT', 'SETTINGS'
  targetId: text,                             // ID of affected record
  oldValue: jsonb,                            // Previous state (for changes)
  newValue: jsonb,                            // New state (for changes)
  ipAddress: varchar,
  userAgent: text,
  createdAt: timestamp defaultNow
}

// platform_settings (admin-configurable settings)
platformSettings: {
  id: serial primaryKey,
  key: varchar unique notNull,                // 'default_fx_rate', 'require_shipper_verification', etc.
  value: jsonb notNull,
  description: text,
  updatedBy: text references user,
  updatedAt: timestamp defaultNow
}
```

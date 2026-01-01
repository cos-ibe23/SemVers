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

### Auth (`/auth`)
- **Get Me** - Get current user + profile
- **Get Profile** - Get shipper profile only
- **Onboard Profile** - Complete onboarding (create profile)
- **Update Profile** - Update shipper profile

### Shipper Clients (`/shipper-clients`)
- **List Shipper Clients** - Get paginated list of clients linked to current shipper
- **Create and Add Client** - Create a new user (CLIENT role) and link to shipper
- **Add Existing Client** - Link an existing CLIENT user to shipper
- **Get Shipper Client** - Get client by user ID
- **Update Shipper Client** - Update shipper-client relationship (nickname, phone)
- **Remove Shipper Client** - Soft delete shipper-client relationship

### Health
- **Health Check** - Check API status

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
- Client IDs are now string user IDs (e.g., "client-001"), not numeric IDs

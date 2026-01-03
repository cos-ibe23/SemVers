import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import {
    user,
    pickupRequests,
    shipperClients,
    pickupRequestResponseSchema,
    type PickupRequestResponse,
    type SellerMetadata,
} from '../db/schema';
import { ApiError, NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { UserRoles } from '../permissions/types';
import { PickupRequestStatus, PaymentStatus, Currency } from '../constants/enums';

export interface ShipperPublicInfo {
    id: string;
    name: string;
    businessName: string | null;
    logoUrl: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
}

export interface CreatePublicRequestInput {
    // Client info
    name: string;
    email: string;
    phoneCountryCode?: string;
    phoneNumber?: string;

    // Pickup details
    numberOfItems: number;
    meetupLocation: string;
    pickupTime: string; // ISO datetime string

    // Seller info (optional - stored as metadata)
    sellerMetadata?: SellerMetadata;

    // Item details (optional)
    agreedPrice?: number;
    itemDescription?: string;
    links?: string;
    imeis?: string;
}

/**
 * PublicRequestService - Handles public (unauthenticated) pickup request submissions.
 *
 * This service does NOT use the base Service class because:
 * 1. It handles public (unauthenticated) requests
 * 2. It creates users and relationships on behalf of clients
 * 3. It uses its own database connection without user context
 */
export class PublicRequestService {
    /**
     * Get shipper info by their request slug.
     * This is used to display the shipper's info on the public request form.
     */
    public async getShipperBySlug(slug: string): Promise<ShipperPublicInfo> {
        try {
            const [shipper] = await db
                .select({
                    id: user.id,
                    name: user.name,
                    businessName: user.businessName,
                    logoUrl: user.logoUrl,
                    city: user.city,
                    state: user.state,
                    country: user.country,
                    role: user.role,
                    onboardedAt: user.onboardedAt,
                    deletedAt: user.deletedAt,
                })
                .from(user)
                .where(eq(user.requestSlug, slug))
                .limit(1);

            if (!shipper) {
                throw new NotFoundError('Shipper not found');
            }

            if (shipper.deletedAt) {
                throw new NotFoundError('Shipper not found');
            }

            if (shipper.role !== UserRoles.SHIPPER) {
                throw new NotFoundError('Shipper not found');
            }

            if (!shipper.onboardedAt) {
                throw new BadRequestError('This shipper has not completed onboarding');
            }

            return {
                id: shipper.id,
                name: shipper.name,
                businessName: shipper.businessName,
                logoUrl: shipper.logoUrl,
                city: shipper.city,
                state: shipper.state,
                country: shipper.country,
            };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PublicRequestService.getShipperBySlug' });
            throw apiError;
        }
    }

    /**
     * Submit a pickup request from a public form.
     *
     * Flow:
     * 1. Lookup shipper by slug
     * 2. Find or create client user by email
     * 3. Link client to shipper if not already linked
     * 4. Create pickup request
     */
    public async submitRequest(
        slug: string,
        input: CreatePublicRequestInput
    ): Promise<PickupRequestResponse> {
        try {
            // 1. Get shipper
            const shipper = await this.getShipperBySlug(slug);

            // 2. Find or create client
            const client = await this.findOrCreateClient({
                name: input.name,
                email: input.email,
                phoneCountryCode: input.phoneCountryCode,
                phoneNumber: input.phoneNumber,
            });

            // 3. Link client to shipper
            await this.linkClientToShipper(shipper.id, client.id);

            // 4. Create pickup request
            const consumerPhone =
                input.phoneCountryCode && input.phoneNumber
                    ? `${input.phoneCountryCode}${input.phoneNumber}`
                    : input.phoneNumber || null;

            const [request] = await db
                .insert(pickupRequests)
                .values({
                    shipperUserId: shipper.id,
                    clientUserId: client.id,
                    consumerName: input.name,
                    consumerEmail: input.email,
                    consumerPhone,
                    numberOfItems: input.numberOfItems,
                    meetupLocation: input.meetupLocation,
                    pickupTime: new Date(input.pickupTime),
                    sellerMetadata: input.sellerMetadata || null,
                    agreedPrice: input.agreedPrice?.toString() || null,
                    agreedPriceCurrency: Currency.USD,
                    itemDescription: input.itemDescription || null,
                    links: input.links || null,
                    imeis: input.imeis || null,
                    status: PickupRequestStatus.PENDING,
                    paymentStatus: PaymentStatus.UNPAID,
                })
                .returning();

            logger.info(
                {
                    requestId: request.id,
                    shipperId: shipper.id,
                    clientId: client.id,
                },
                'Public pickup request submitted'
            );

            return pickupRequestResponseSchema.parse(request);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PublicRequestService.submitRequest' });
            throw apiError;
        }
    }

    /**
     * Find or create a client user by email.
     */
    private async findOrCreateClient(input: {
        name: string;
        email: string;
        phoneCountryCode?: string;
        phoneNumber?: string;
    }): Promise<{ id: string; email: string }> {
        // Check if user exists
        const [existingUser] = await db
            .select({ id: user.id, email: user.email })
            .from(user)
            .where(eq(user.email, input.email))
            .limit(1);

        if (existingUser) {
            return existingUser;
        }

        // Create new client user
        const clientId = crypto.randomUUID();
        const [newUser] = await db
            .insert(user)
            .values({
                id: clientId,
                name: input.name,
                email: input.email,
                emailVerified: false,
                role: UserRoles.CLIENT,
                phoneCountryCode: input.phoneCountryCode || null,
                phoneNumber: input.phoneNumber || null,
            })
            .returning({ id: user.id, email: user.email });

        logger.info(
            { clientId: newUser.id, email: newUser.email },
            'Client user auto-created from public request'
        );

        return newUser;
    }

    /**
     * Link a client to a shipper if not already linked.
     */
    private async linkClientToShipper(shipperId: string, clientId: string): Promise<void> {
        // Check if relationship exists (including soft-deleted)
        const [existing] = await db
            .select()
            .from(shipperClients)
            .where(
                and(
                    eq(shipperClients.shipperId, shipperId),
                    eq(shipperClients.clientId, clientId)
                )
            )
            .limit(1);

        if (existing) {
            // If soft-deleted, restore it
            if (existing.deletedAt) {
                await db
                    .update(shipperClients)
                    .set({ deletedAt: null })
                    .where(
                        and(
                            eq(shipperClients.shipperId, shipperId),
                            eq(shipperClients.clientId, clientId)
                        )
                    );
            }
            return;
        }

        // Create new relationship
        await db.insert(shipperClients).values({
            shipperId,
            clientId,
        });

        logger.info(
            { shipperId, clientId },
            'Client linked to shipper from public request'
        );
    }
}

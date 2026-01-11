import { eq, and } from 'drizzle-orm';
import { db } from '../db';
import {
    user,
    pickupRequests,
    shipperClients,
    fxRates,
    pickupRequestResponseSchema,
    type PickupRequestResponse,
    type SellerMetadata,
} from '../db/schema';
import { ApiError, NotFoundError, BadRequestError } from '../lib/errors';
import { logger } from '../lib/logger';
import { UserRoles } from '../permissions/types';
import { PickupRequestStatus, Currency, type CurrencyType } from '../constants/enums';
import { Service, type ServiceOptions } from './service';

export interface PublicFxRate {
    fromCurrency: CurrencyType;
    toCurrency: CurrencyType;
    rate: string;
}

export interface ShipperPublicInfo {
    id: string;
    name: string;
    businessName: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    fxRates: PublicFxRate[];
}

export interface CreatePublicRequestInput {
    // Client info (Optional/Ignored if authenticated, but kept for schema compatibility or if passed)
    name?: string;
    email?: string;
    phone?: string; // Full phone number (e.g., "+1-555-123-4567")

    // Pickup details
    numberOfItems: number;
    meetupLocation: string;
    pickupTime: string; // ISO datetime string

    // Seller info (optional - stored as metadata)
    sellerMetadata?: SellerMetadata;

    // Item details (optional)
    agreedPrice?: number; // Always in USD for MVP
    itemDescription?: string;
    links?: string;
    imeis?: string;
}

/**
 * PublicRequestService - Handles pickup request submissions (now authenticated).
 */
export class PublicRequestService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

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

            // Fetch shipper's active FX rates (only client rate - not cost rate)
            const activeFxRates = await db
                .select({
                    fromCurrency: fxRates.fromCurrency,
                    toCurrency: fxRates.toCurrency,
                    clientRate: fxRates.clientRate,
                })
                .from(fxRates)
                .where(
                    and(
                        eq(fxRates.ownerUserId, shipper.id),
                        eq(fxRates.isActive, true)
                    )
                );

            return {
                id: shipper.id,
                name: shipper.name,
                businessName: shipper.businessName,

                city: shipper.city,
                state: shipper.state,
                country: shipper.country,
                fxRates: activeFxRates.map((rate) => ({
                    fromCurrency: rate.fromCurrency as CurrencyType,
                    toCurrency: rate.toCurrency as CurrencyType,
                    rate: rate.clientRate,
                })),
            };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PublicRequestService.getShipperBySlug' });
            throw apiError;
        }
    }

    /**
     * Submit a pickup request (Authenticated).
     *
     * Flow:
     * 1. Lookup shipper by slug
     * 2. Get authenticated client user
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

            // 2. Get authenticated client
            const client = this.requireUser();

            // 3. Link client to shipper
            await this.linkClientToShipper(shipper.id, client.id);

            // 4. Create pickup request
            const [request] = await db
                .insert(pickupRequests)
                .values({
                    shipperUserId: shipper.id,
                    clientUserId: client.id,
                    clientName: client.name, // Use profile name
                    clientEmail: client.email, // Use profile email
                    clientPhone: input.phone || client.phoneNumber || null, // Prefer input phone, fallback to profile
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
                })
                .returning();

            logger.info(
                {
                    requestId: request.id,
                    shipperId: shipper.id,
                    clientId: client.id,
                },
                'Pickup request submitted (authenticated)'
            );

            return pickupRequestResponseSchema.parse(request);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PublicRequestService.submitRequest' });
            throw apiError;
        }
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

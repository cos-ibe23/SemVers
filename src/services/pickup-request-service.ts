import { eq, and, desc, ilike, or, count } from 'drizzle-orm';
import {
    pickupRequests,
    pickups,
    fxRates,
    pickupRequestResponseSchema,
    type PickupRequestResponse,
    type SellerMetadata,
} from '../db/schema';
import { ApiError, ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
import { Resources } from '../lib/user-can';
import { Service, type ServiceOptions } from './service';
import { PickupRequestStatus, PaymentStatus, type CurrencyType } from '../constants/enums';

export interface CreatePickupRequestInput {
    clientUserId?: string;
    consumerName: string;
    consumerEmail?: string;
    consumerPhone?: string;
    numberOfItems: number;
    meetupLocation: string;
    pickupTime: string;
    sellerMetadata?: SellerMetadata;
    agreedPrice?: number;
    agreedPriceCurrency?: CurrencyType;
    itemDescription?: string;
    links?: string;
    imeis?: string;
}

export interface UpdatePickupRequestInput {
    consumerName?: string;
    consumerEmail?: string;
    consumerPhone?: string;
    numberOfItems?: number;
    meetupLocation?: string;
    pickupTime?: string;
    sellerMetadata?: SellerMetadata | null;
    agreedPrice?: number | null;
    itemDescription?: string | null;
    links?: string | null;
    imeis?: string | null;
    status?: 'PENDING' | 'QUOTED' | 'PAYMENT_SUBMITTED' | 'PAYMENT_VERIFIED' | 'ACCEPTED' | 'REJECTED' | 'CONVERTED';
    estimatedQuoteUsd?: number | null;
}

export interface ListPickupRequestsOptions {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    clientId?: string;
}

export interface PaginatedPickupRequests {
    data: PickupRequestResponse[];
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
}

export interface ConvertToPickupInput {
    fxRateId?: number;
    pickupFeeUsd?: number;
}

export class PickupRequestService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Create a pickup request (shipper-initiated).
     */
    public async create(input: CreatePickupRequestInput): Promise<PickupRequestResponse> {
        try {
            const shipperUserId = this.requireUserId();

            if (!this.userCan.canCreate(Resources.PICKUP_REQUESTS)) {
                throw new ForbiddenError('You are not authorized to create pickup requests');
            }

            const [request] = await this.db
                .insert(pickupRequests)
                .values({
                    shipperUserId,
                    clientUserId: input.clientUserId || null,
                    consumerName: input.consumerName,
                    consumerEmail: input.consumerEmail || null,
                    consumerPhone: input.consumerPhone || null,
                    numberOfItems: input.numberOfItems,
                    meetupLocation: input.meetupLocation,
                    pickupTime: new Date(input.pickupTime),
                    sellerMetadata: input.sellerMetadata || null,
                    agreedPrice: input.agreedPrice?.toString() || null,
                    agreedPriceCurrency: input.agreedPriceCurrency || 'USD',
                    itemDescription: input.itemDescription || null,
                    links: input.links || null,
                    imeis: input.imeis || null,
                    status: PickupRequestStatus.PENDING,
                    paymentStatus: PaymentStatus.UNPAID,
                })
                .returning();

            this.log('pickup_request_create', { requestId: request.id });

            return pickupRequestResponseSchema.parse(request);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupRequestService.create' });
            throw apiError;
        }
    }

    /**
     * Get a pickup request by ID.
     */
    public async getById(id: number): Promise<PickupRequestResponse> {
        try {
            const shipperUserId = this.requireUserId();

            const [request] = await this.db
                .select()
                .from(pickupRequests)
                .where(eq(pickupRequests.id, id))
                .limit(1);

            if (!request) {
                throw new NotFoundError('Pickup request not found');
            }

            // Check ownership - shipper can only see their own requests
            if (!this.userCan.isAdmin() && request.shipperUserId !== shipperUserId) {
                throw new ForbiddenError('You are not authorized to view this pickup request');
            }

            return pickupRequestResponseSchema.parse(request);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupRequestService.getById' });
            throw apiError;
        }
    }

    /**
     * List pickup requests for the shipper.
     */
    public async list(options: ListPickupRequestsOptions = {}): Promise<PaginatedPickupRequests> {
        try {
            const shipperUserId = this.requireUserId();
            const { page = 1, limit = 20, search, status, clientId } = options;
            const offset = (page - 1) * limit;

            if (!this.userCan.canList(Resources.PICKUP_REQUESTS)) {
                throw new ForbiddenError('You are not authorized to list pickup requests');
            }

            // Base conditions - shipper sees only their own requests
            const conditions = this.userCan.isAdmin()
                ? []
                : [eq(pickupRequests.shipperUserId, shipperUserId)];

            // Status filter
            if (status) {
                conditions.push(eq(pickupRequests.status, status as typeof pickupRequests.status.enumValues[number]));
            }

            // Client filter
            if (clientId) {
                conditions.push(eq(pickupRequests.clientUserId, clientId));
            }

            // Build where clause
            let whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            // Search filter (name, email)
            // Note: sellerMetadata is JSON, so we search only consumer fields here
            if (search) {
                const searchCondition = or(
                    ilike(pickupRequests.consumerName, `%${search}%`),
                    ilike(pickupRequests.consumerEmail, `%${search}%`)
                );
                whereClause = whereClause ? and(whereClause, searchCondition) : searchCondition;
            }

            // Get total count
            const [{ total }] = await this.db
                .select({ total: count() })
                .from(pickupRequests)
                .where(whereClause);

            // Get paginated results
            const results = await this.db
                .select()
                .from(pickupRequests)
                .where(whereClause)
                .orderBy(desc(pickupRequests.createdAt))
                .limit(limit)
                .offset(offset);

            return {
                data: results.map((r) => pickupRequestResponseSchema.parse(r)),
                total,
                page,
                limit,
                hasMore: offset + results.length < total,
            };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupRequestService.list' });
            throw apiError;
        }
    }

    /**
     * Update a pickup request.
     */
    public async update(id: number, input: UpdatePickupRequestInput): Promise<PickupRequestResponse> {
        try {
            const shipperUserId = this.requireUserId();

            // Get existing request
            const existing = await this.getById(id);

            if (!this.userCan.canUpdate(Resources.PICKUP_REQUESTS, { ownerUserId: existing.shipperUserId })) {
                throw new ForbiddenError('You are not authorized to update this pickup request');
            }

            // Don't allow updates to converted requests
            if (existing.status === 'CONVERTED') {
                throw new BadRequestError('Cannot update a converted pickup request');
            }

            const updateData: Record<string, unknown> = {};

            if (input.consumerName !== undefined) updateData.consumerName = input.consumerName;
            if (input.consumerEmail !== undefined) updateData.consumerEmail = input.consumerEmail;
            if (input.consumerPhone !== undefined) updateData.consumerPhone = input.consumerPhone;
            if (input.numberOfItems !== undefined) updateData.numberOfItems = input.numberOfItems;
            if (input.meetupLocation !== undefined) updateData.meetupLocation = input.meetupLocation;
            if (input.pickupTime !== undefined) updateData.pickupTime = new Date(input.pickupTime);
            if (input.sellerMetadata !== undefined) updateData.sellerMetadata = input.sellerMetadata;
            if (input.agreedPrice !== undefined) updateData.agreedPrice = input.agreedPrice?.toString() || null;
            if (input.itemDescription !== undefined) updateData.itemDescription = input.itemDescription;
            if (input.links !== undefined) updateData.links = input.links;
            if (input.imeis !== undefined) updateData.imeis = input.imeis;
            if (input.status !== undefined) updateData.status = input.status;
            if (input.estimatedQuoteUsd !== undefined) updateData.estimatedQuoteUsd = input.estimatedQuoteUsd?.toString() || null;

            const [updated] = await this.db
                .update(pickupRequests)
                .set(updateData)
                .where(eq(pickupRequests.id, id))
                .returning();

            this.log('pickup_request_update', { requestId: id, updates: Object.keys(input) });

            return pickupRequestResponseSchema.parse(updated);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupRequestService.update' });
            throw apiError;
        }
    }

    /**
     * Delete a pickup request.
     */
    public async delete(id: number): Promise<void> {
        try {
            const existing = await this.getById(id);

            if (!this.userCan.canDelete(Resources.PICKUP_REQUESTS, { ownerUserId: existing.shipperUserId })) {
                throw new ForbiddenError('You are not authorized to delete this pickup request');
            }

            // Don't allow deletion of converted requests
            if (existing.status === 'CONVERTED') {
                throw new BadRequestError('Cannot delete a converted pickup request');
            }

            await this.db.delete(pickupRequests).where(eq(pickupRequests.id, id));

            this.log('pickup_request_delete', { requestId: id });
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupRequestService.delete' });
            throw apiError;
        }
    }

    /**
     * Convert a pickup request to a pickup.
     */
    public async convertToPickup(id: number, input: ConvertToPickupInput = {}): Promise<{ pickup: typeof pickups.$inferSelect; request: PickupRequestResponse }> {
        try {
            const shipperUserId = this.requireUserId();

            // Get existing request
            const existing = await this.getById(id);

            if (!this.userCan.canUpdate(Resources.PICKUP_REQUESTS, { ownerUserId: existing.shipperUserId })) {
                throw new ForbiddenError('You are not authorized to convert this pickup request');
            }

            if (existing.status === PickupRequestStatus.CONVERTED) {
                throw new BadRequestError('This pickup request has already been converted');
            }

            if (!existing.clientUserId) {
                throw new BadRequestError('Cannot convert a request without a client');
            }

            // Validate FX rate if provided
            if (input.fxRateId) {
                const [fxRate] = await this.db
                    .select()
                    .from(fxRates)
                    .where(
                        and(
                            eq(fxRates.id, input.fxRateId),
                            eq(fxRates.ownerUserId, shipperUserId)
                        )
                    )
                    .limit(1);

                if (!fxRate) {
                    throw new BadRequestError('Invalid FX rate');
                }
            }

            // Create pickup
            const [pickup] = await this.db
                .insert(pickups)
                .values({
                    ownerUserId: shipperUserId,
                    clientUserId: existing.clientUserId,
                    pickupFeeUsd: input.pickupFeeUsd?.toString() || '0',
                    itemPriceUsd: existing.agreedPrice || '0',
                    pickupDate: existing.pickupTime.toISOString().split('T')[0],
                    sourceRequestId: id,
                    fxRateId: input.fxRateId || null,
                    status: 'DRAFT',
                })
                .returning();

            // Update request status
            const [updatedRequest] = await this.db
                .update(pickupRequests)
                .set({
                    status: PickupRequestStatus.CONVERTED,
                    convertedPickupId: pickup.id,
                })
                .where(eq(pickupRequests.id, id))
                .returning();

            this.log('pickup_request_convert', { requestId: id, pickupId: pickup.id });

            return {
                pickup,
                request: pickupRequestResponseSchema.parse(updatedRequest),
            };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'PickupRequestService.convertToPickup' });
            throw apiError;
        }
    }
}

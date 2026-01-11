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
import { PickupRequestStatus } from '../constants/enums';

export interface UpdatePickupRequestInput {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    numberOfItems?: number;
    meetupLocation?: string;
    pickupTime?: string;
    sellerMetadata?: SellerMetadata | null;
    agreedPrice?: number | null;
    itemDescription?: string | null;
    links?: string | string[] | null;
    imeis?: string | string[] | null;
    status?: typeof PickupRequestStatus.REJECTED;
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

            const conditions = this.userCan.isAdmin()
                ? []
                : [eq(pickupRequests.shipperUserId, shipperUserId)];

            if (status) {
                conditions.push(eq(pickupRequests.status, status as typeof pickupRequests.status.enumValues[number]));
            }

            if (clientId) {
                conditions.push(eq(pickupRequests.clientUserId, clientId));
            }

            let whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            if (search) {
                const searchCondition = or(
                    ilike(pickupRequests.clientName, `%${search}%`),
                    ilike(pickupRequests.clientEmail, `%${search}%`)
                );
                whereClause = whereClause ? and(whereClause, searchCondition) : searchCondition;
            }

            const [{ total }] = await this.db
                .select({ total: count() })
                .from(pickupRequests)
                .where(whereClause);

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
    /**
     * Update a pickup request.
     */
    public async update(id: number, input: UpdatePickupRequestInput): Promise<PickupRequestResponse> {
        try {
            this.requireUserId();

            const existing = await this.getById(id);

            // Re-check permissions using canUpdate (though getById effectively checks read access,
            // update might have stricter rules, so we keep this)
            if (!this.userCan.canUpdate(Resources.PICKUP_REQUESTS, { ownerUserId: existing.shipperUserId })) {
                throw new ForbiddenError('You are not authorized to update this pickup request');
            }

            if (existing.status === PickupRequestStatus.CONVERTED) {
                throw new BadRequestError('Cannot update a converted pickup request');
            }

            const updateData: Record<string, unknown> = {};

            // Helper to conditionally add fields
            const addIfDefined = (key: string, value: any) => {
                if (value !== undefined) updateData[key] = value;
            };

            addIfDefined('clientName', input.clientName);
            addIfDefined('clientEmail', input.clientEmail);
            addIfDefined('clientPhone', input.clientPhone);
            addIfDefined('numberOfItems', input.numberOfItems);
            addIfDefined('meetupLocation', input.meetupLocation);
            addIfDefined('sellerMetadata', input.sellerMetadata);
            addIfDefined('itemDescription', input.itemDescription);
            addIfDefined('status', input.status);

            if (input.pickupTime !== undefined) {
                updateData.pickupTime = new Date(input.pickupTime);
            }

            if (input.agreedPrice !== undefined) {
                updateData.agreedPrice = input.agreedPrice?.toString() || null;
            }

            if (input.links !== undefined) {
                updateData.links = Array.isArray(input.links)
                    ? input.links
                    : input.links
                      ? input.links.split(',').map(s => s.trim())
                      : null;
            }

            if (input.imeis !== undefined) {
                updateData.imeis = Array.isArray(input.imeis)
                    ? input.imeis
                    : input.imeis
                      ? input.imeis.split(',').map(s => s.trim())
                      : null;
            }

            // If no updates, return existing
            if (Object.keys(updateData).length === 0) {
                return existing;
            }

            const [updated] = await this.db
                .update(pickupRequests)
                .set({ ...updateData, updatedAt: new Date() })
                .where(eq(pickupRequests.id, id))
                .returning();

            this.log('pickup_request_update', { requestId: id, updates: Object.keys(updateData) });

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
            
            if (existing.status === PickupRequestStatus.CONVERTED) {
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
}

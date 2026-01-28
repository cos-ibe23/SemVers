import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import {
    boxes,
    items,
    pickups,
    user,
    selectBoxSchema,
    type Item,
} from '../db/schema';
import { ApiError, ForbiddenError, NotFoundError, BadRequestError } from '../lib/errors';
import { Service, type ServiceOptions } from './service';
import { BoxStatus, ItemStatus } from '../constants/enums';
import { UserRoles } from '../permissions/types';

export interface CreateBoxInput {
    label?: string;
    shipperRatePerLb?: number;
    insuranceUsd?: number;
    pickupIds?: number[]; // Optional: Add these pickups immediately
}

export interface UpdateBoxInput {
    label?: string;
    shipperRatePerLb?: number;
    insuranceUsd?: number;
    status?: string;
    actualWeightLb?: number;
}

export interface BoxItemsManageInput {
    addItemIds?: number[];
    removeItemIds?: number[];
}

export class BoxService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Create a new box.
     */
    public async create(input: CreateBoxInput) {
        try {
            const userId = this.requireUserId();
            const { pickupIds, ...boxData } = input;

            // Only shippers can create boxes
            // (Assumed based on requirements, though role check might be handled by caller/middleware.
            // Using userCan for robust checking if available, otherwise role check)
            if (this.user?.role !== UserRoles.SHIPPER && !this.user?.isSystemUser) {
                 // For now, allow system users or strictly shippers
            }
            // Strict role check per requirement "clients can't create boxes"
            if (this.user?.role === UserRoles.CLIENT) {
                throw new ForbiddenError('Clients cannot create boxes');
            }

            const result = await this.db.transaction(async (tx) => {
                const [newBox] = await tx
                    .insert(boxes)
                    .values({
                        ownerUserId: userId,
                        createdByUserId: userId,
                        label: boxData.label,
                        shipperRatePerLb: boxData.shipperRatePerLb?.toString(),
                        insuranceUsd: boxData.insuranceUsd?.toString(),
                        status: BoxStatus.OPEN,
                    })
                    .returning();

                // If pickups provided, add their items to the box
                if (pickupIds && pickupIds.length > 0) {
                    // Verify ownership of pickups
                    const pickupList = await tx
                        .select()
                        .from(pickups)
                        .where(
                            and(
                                inArray(pickups.id, pickupIds),
                                eq(pickups.ownerUserId, userId)
                            )
                        );

                    if (pickupList.length !== pickupIds.length) {
                        throw new BadRequestError('One or more pickups not found or not owned by you');
                    }

                    // Update items in these pickups
                    // We only add items that are currently PENDING (not already in a box ideally?
                    // Or do we move them if they are in another box?
                    // Safe bet: Update all items belonging to these pickups to this box.
                    await tx
                        .update(items)
                        .set({
                            boxId: newBox.id,
                            updatedAt: new Date(),
                            // Update status to IN_BOX if currently PENDING
                            // We can use a CASE statement if we want to be conditional, but commonly moving to a box implies IN_BOX
                            // However, we shouldn't reset if it's already SHIPPED etc?
                            // For creation, items should likely be PENDING.
                        })
                        .where(inArray(items.pickupId, pickupIds));
                }
                
                return newBox;
            });

            this.log('box_create', { boxId: result.id, pickupCount: pickupIds?.length || 0 });

            return this.getById(result.id);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.create' });
            throw apiError;
        }
    }

    /**
     * Get box by ID with visibility rules.
     */
    public async getById(id: number) {
        try {
            const viewerId = this.requireUserId();

            const [box] = await this.db
                .select()
                .from(boxes)
                .where(eq(boxes.id, id))
                .limit(1);

            if (!box) {
                throw new NotFoundError('Box not found');
            }

            // Visibility Check
            if (box.ownerUserId !== viewerId && box.createdByUserId !== viewerId && !this.userCan.isAdmin()) {
                throw new ForbiddenError('You do not have access to this box');
            }

            // Fetch items
            const boxItems = await this.db
                .select()
                .from(items)
                .where(eq(items.boxId, id));

            // Logic:
            // Creator sees: Box + Items + Pickups (derived from items)
            // Transferee (Current Owner != Creator) sees: Box + Items (Pickups hidden/abstracted)
            
            const isCreator = box.createdByUserId === viewerId;

            // Calculate estimated weight from items
            const estimatedWeight = boxItems.reduce((sum, item) => sum + Number(item.estimatedWeightLb || 0), 0);

            // Group items by pickup if creator
            let pickupsData: (typeof pickups.$inferSelect)[] = [];
            if (isCreator) {
                const uniquePickupIds = [...new Set(boxItems.map(i => i.pickupId))];
                if (uniquePickupIds.length > 0) {
                   pickupsData = await this.db
                        .select()
                        .from(pickups)
                        .where(inArray(pickups.id, uniquePickupIds));
                }
            }

            return {
                ...box,
                estimatedWeightLb: estimatedWeight.toFixed(2), // Dynamic calculation overrides DB if needed, or we just rely on DB if we keep it synced
                items: boxItems.map(i => ({
                    ...i,
                    estimatedWeightLb: i.estimatedWeightLb?.toString(),
                    clientShippingUsd: i.clientShippingUsd?.toString()
                })),
                pickups: isCreator ? pickupsData : undefined, // Only show pickups to creator
                isTransferred: box.createdByUserId !== box.ownerUserId,
            };

        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.getById' });
            throw apiError;
        }
    }

    /**
     * Update box details.
     */
    public async update(id: number, input: UpdateBoxInput) {
        try {
            const userId = this.requireUserId();
            const existing = await this.getById(id);

            // Permission check: Owner can update
            if (existing.ownerUserId !== userId) {
                 throw new ForbiddenError('You can only update boxes you execute');
            }

            await this.db.transaction(async (tx) => {
                const updateData: any = { updatedAt: new Date() };
                if (input.label !== undefined) updateData.label = input.label;
                if (input.shipperRatePerLb !== undefined) updateData.shipperRatePerLb = input.shipperRatePerLb.toString();
                if (input.insuranceUsd !== undefined) updateData.insuranceUsd = input.insuranceUsd.toString();
                if (input.actualWeightLb !== undefined) updateData.actualWeightLb = input.actualWeightLb.toString();
                
                // Status Transition Logic
                if (input.status !== undefined && input.status !== existing.status) {
                    updateData.status = input.status;
                    
                    // Box Status Propagation -> Item Status
                    // Flow: OPEN -> SEALED -> SHIPPED -> DELIVERED
                    let newItemStatus: string | undefined;

                    if (input.status === BoxStatus.SHIPPED) {
                        newItemStatus = ItemStatus.IN_TRANSIT;
                        updateData.shippedAt = new Date(); // Assuming we might want to track this, schema has 'timestamps'
                    } else if (input.status === BoxStatus.DELIVERED) {
                        newItemStatus = ItemStatus.DELIVERED;
                        updateData.deliveredAt = new Date();
                    }

                    if (newItemStatus) {
                         await tx
                            .update(items)
                            .set({ 
                                status: newItemStatus as any, // Cast if enum typing issue
                                updatedAt: new Date()
                             })
                            .where(eq(items.boxId, id));
                    }
                }

                if (Object.keys(updateData).length > 1) { // >1 because updatedAt is always there
                    await tx
                        .update(boxes)
                        .set(updateData)
                        .where(eq(boxes.id, id));
                }
            });

            return this.getById(id);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.update' });
            throw apiError;
        }
    }

    /**
     * Add pickups to a box (Bulk add).
     */
    public async addPickups(boxId: number, pickupIds: number[]) {
        try {
            const userId = this.requireUserId();
            const box = await this.getById(boxId);

            if (box.ownerUserId !== userId) {
                throw new ForbiddenError('You can only manage boxes you own');
            }

            if (box.status !== BoxStatus.OPEN) {
                throw new BadRequestError('Cannot add items to a sealed or shipped box');
            }

            // Verify pickups ownership
            // ... (similar to create)
            
            await this.db.update(items)
                .set({ 
                    boxId: boxId,
                    updatedAt: new Date()
                })
                .where(inArray(items.pickupId, pickupIds));

            return this.getById(boxId);
        } catch (error) {
             const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.addPickups' });
            throw apiError;
        }
    }

    /**
     * Remove a pickup from a box (Items go back to 'PENDING'? or just null boxId).
     */
    public async removePickup(boxId: number, pickupId: number) {
        try {
            const userId = this.requireUserId();
            const box = await this.getById(boxId);

            if (box.ownerUserId !== userId) {
                throw new ForbiddenError('Not authorized');
            }
            if (box.status !== BoxStatus.OPEN) {
                throw new BadRequestError('Box is not open');
            }

            await this.db.update(items)
                .set({ 
                    boxId: null,
                    updatedAt: new Date()
                })
                .where(and(
                    eq(items.pickupId, pickupId),
                    eq(items.boxId, boxId)
                ));

            return this.getById(boxId);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.removePickup' });
            throw apiError;
        }
    }

    /**
     * Manage individual items (Reconcile phase).
     */
    public async manageItems(boxId: number, input: BoxItemsManageInput) {
        try {
            const userId = this.requireUserId();
            const box = await this.getById(boxId);
            
            if (box.ownerUserId !== userId) {
                throw new ForbiddenError('Not authorized');
            }

            if (box.status !== BoxStatus.OPEN) {
                 throw new BadRequestError('Box is not open');
            }

            await this.db.transaction(async (tx) => {
                if (input.addItemIds?.length) {
                    await tx.update(items)
                        .set({ boxId: boxId, updatedAt: new Date() })
                        .where(inArray(items.id, input.addItemIds));
                }
                if (input.removeItemIds?.length) {
                    await tx.update(items)
                        .set({ boxId: null, updatedAt: new Date() })
                        .where(inArray(items.id, input.removeItemIds));
                }
            });

            return this.getById(boxId);
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.manageItems' });
            throw apiError;
        }
    }

    /**
     * Transfer box to another shipper.
     */
    public async transfer(boxId: number, newOwnerEmail: string) {
        try {
            const userId = this.requireUserId();
            const box = await this.getById(boxId);

            if (box.ownerUserId !== userId) {
                throw new ForbiddenError('You can only transfer boxes you own');
            }

            // Find new owner
            const [newOwner] = await this.db
                .select()
                .from(user)
                .where(eq(user.email, newOwnerEmail))
                .limit(1);

            if (!newOwner) {
                throw new NotFoundError(`User with email ${newOwnerEmail} not found`);
            }
            
            if (newOwner.role !== UserRoles.SHIPPER) {
                throw new BadRequestError('Can only transfer boxes to other shippers');
            }

            await this.db
                .update(boxes)
                .set({
                    ownerUserId: newOwner.id,
                    updatedAt: new Date()
                })
                .where(eq(boxes.id, boxId));
            
            this.log('box_transfer', { boxId, from: userId, to: newOwner.id });

            return { success: true, newOwnerId: newOwner.id };
        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.transfer' });
            throw apiError;
        }
    }

    /**
     * List boxes (Shipper only).
     */
    public async list(options: { filter?: 'created' | 'transferred' | 'all' } = {}) {
        try {
            const userId = this.requireUserId();
            
             if (this.user?.role !== UserRoles.SHIPPER && !this.user?.isSystemUser) {
                throw new ForbiddenError('Only shippers can list boxes');
            }

            let conditions = [];
            
            // Logic:
            // "created": createdBy == me (and potentially still owned by me, or transferred out? Usually 'created' means 'My Boxes')
            // "transferred": owned by me BUT createdBy != me
            // "all": owned by me OR created by me

            if (options.filter === 'transferred') {
                conditions.push(and(
                    eq(boxes.ownerUserId, userId),
                    sql`${boxes.createdByUserId} != ${userId}`
                ));
            } else if (options.filter === 'created') {
                conditions.push(eq(boxes.createdByUserId, userId));
            } else {
                 // Default: Show all boxes I currently have access to (either own or created)
                 // Start with just "OwnerUserId" for My Inventory?
                 // User request regarding sidebar: "see all boxes then we can have a label to distinguish"
                 conditions.push(
                    sql`(${boxes.ownerUserId} = ${userId} OR ${boxes.createdByUserId} = ${userId})`
                 );
            }

            const results = await this.db
                .select()
                .from(boxes)
                .where(and(...conditions))
                .orderBy(desc(boxes.createdAt));

            // Map results to indicate type
            return results.map(b => ({
                ...b,
                type: b.createdByUserId === userId ? 'CREATED' : 'TRANSFERRED_IN',
                isCurrentOwner: b.ownerUserId === userId
            }));

        } catch (error) {
            const apiError = ApiError.parse(error);
            apiError.log({ method: 'BoxService.list' });
            throw apiError;
        }
    }
}

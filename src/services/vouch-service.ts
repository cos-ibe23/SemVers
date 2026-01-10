import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { user, userVouches } from '../db/schema';
import { ApiError, NotFoundError, BadRequestError } from '../lib/errors';
import { Service, type ServiceOptions } from './service';

export class VouchService extends Service {
    constructor(options: ServiceOptions = {}) {
        super(options);
    }

    /**
     * Get pending vouch requests for the current user (based on their email)
     */
    public async getPendingRequests() {
        const currentUser = await this.requireUser(); // Ensure we have the full user object with email
        
        return this.db
            .select({
                id: userVouches.id,
                requesterId: userVouches.requesterUserId,
                requesterName: sql<string>`"user"."name"`, // Join to get name
                requesterImage: sql<string>`"user"."image"`, // Join to get image
                requestedAt: userVouches.createdAt,
                status: userVouches.status
            })
            .from(userVouches)
            .innerJoin(user, eq(userVouches.requesterUserId, user.id)) // Join requester info
            .where(
                and(
                    eq(userVouches.voucherEmail, currentUser.email), // Use currentUser
                    eq(userVouches.status, 'PENDING')
                )
            );
    }

    /**
     * Get history of vouches performed by the current user
     */
    public async getHistory() {
        const currentUser = await this.requireUser();

        return this.db
            .select({
                id: userVouches.id,
                requesterId: userVouches.requesterUserId,
                requesterName: sql<string>`"user"."name"`,
                status: userVouches.status,
                updatedAt: userVouches.updatedAt
            })
            .from(userVouches)
            .innerJoin(user, eq(userVouches.requesterUserId, user.id))
            .where(
                and(
                    eq(userVouches.voucherEmail, currentUser.email), // Use currentUser
                    sql`${userVouches.status} != 'PENDING'`
                )
            );
    }

    /**
     * Approve a vouch request
     */
    public async approveVouch(vouchId: number) {
        const currentUser = await this.requireUser();

        // 1. Verify the vouch belongs to this user
        const [vouch] = await this.db
            .select()
            .from(userVouches)
            .where(
                and(
                    eq(userVouches.id, vouchId),
                    eq(userVouches.voucherEmail, currentUser.email)
                )
            )
            .limit(1);

        if (!vouch) {
            throw new NotFoundError('Vouch request not found');
        }

        if (vouch.status !== 'PENDING') {
            throw new BadRequestError('Vouch request already processed');
        }

        // 2. Update status to APPROVED
        await this.db
            .update(userVouches)
            .set({ 
                status: 'APPROVED', 
                voucherUserId: currentUser.id, // Link the user ID now
                updatedAt: new Date() 
            })
            .where(eq(userVouches.id, vouchId));

        // 3. Check if requester now has 2 approvals
        await this.checkAndVerifyUser(vouch.requesterUserId);

        return { success: true };
    }

    /**
     * Decline a vouch request
     */
    public async declineVouch(vouchId: number) {
        const currentUser = await this.requireUser();

        const [vouch] = await this.db
            .select()
            .from(userVouches)
            .where(
                and(
                    eq(userVouches.id, vouchId),
                    eq(userVouches.voucherEmail, currentUser.email)
                )
            )
            .limit(1);

        if (!vouch) {
            throw new NotFoundError('Vouch request not found');
        }

        if (vouch.status !== 'PENDING') {
            throw new BadRequestError('Vouch request already processed');
        }

        // Update status to DECLINED
        await this.db
            .update(userVouches)
            .set({ 
                status: 'DECLINED', 
                voucherUserId: currentUser.id,
                updatedAt: new Date() 
            })
            .where(eq(userVouches.id, vouchId));

        // If declined, do we reject the user? 
        // Logic: if they need 2, and 1 declines, maybe they can replace it? 
        // For MVP, likely we just leave the user in PENDING_VOUCH until they get 2 approvals. 
        // (Or we could mark REJECTED if we want to be strict). 
        // Let's leave them as PENDING_VOUCH unless specific business logic says otherwise.
        
        return { success: true };
    }

    private async checkAndVerifyUser(userId: string) {
        // Count approvals
        const [result] = await this.db
            .select({ count: sql<number>`count(*)` })
            .from(userVouches)
            .where(
                and(
                    eq(userVouches.requesterUserId, userId),
                    eq(userVouches.status, 'APPROVED')
                )
            );

        const approvalCount = Number(result.count);

        if (approvalCount >= 2) {
            // Verify the user!
            await this.db
                .update(user)
                .set({ 
                    verificationStatus: 'VERIFIED',
                    updatedAt: new Date()
                })
                .where(eq(user.id, userId));
                
            // TODO: Send notification to user
        }
    }
}

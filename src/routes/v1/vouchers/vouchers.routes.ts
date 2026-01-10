import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { jsonContent, jsonApiErrorContent } from '../../../lib/openapi/helpers';
import { vouchStatusEnum } from '../../../db/schema/vouchers';

const TAGS = ['v1-vouchers'] as const;

// Schema for vouch list item
const vouchListItemSchema = z.object({
    id: z.number(),
    requesterId: z.string(),
    requesterName: z.string(),
    requesterImage: z.string().nullable(),
    requestedAt: z.coerce.date().transform((d) => d.toISOString()),
    status: z.enum(['PENDING', 'APPROVED', 'DECLINED']),
});

// GET /vouchers/pending
export const getPendingVouches = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/vouchers/pending',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.array(vouchListItemSchema),
            'List of pending vouch requests'
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
    },
});

// GET /vouchers/history
export const getVouchHistory = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/vouchers/history',
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
             z.array(z.object({
                 id: z.number(),
                 requesterId: z.string(),
                 requesterName: z.string(),
                 status: z.enum(['PENDING', 'APPROVED', 'DECLINED']),
                 updatedAt: z.coerce.date().transform((d) => d.toISOString()),
             })),
            'History of handled vouches'
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
    },
});

// POST /vouchers/:id/approve
export const approveVouch = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/vouchers/{id}/approve',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ success: z.boolean() }),
            'Vouch approved successfully'
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Vouch request not found'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Already processed'),
    },
});

// POST /vouchers/:id/decline
export const declineVouch = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/vouchers/{id}/decline',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            z.object({ success: z.boolean() }),
            'Vouch declined successfully'
        ),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Vouch request not found'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Already processed'),
    },
});

export type GetPendingVouchesRoute = typeof getPendingVouches;
export type GetVouchHistoryRoute = typeof getVouchHistory;
export type ApproveVouchRoute = typeof approveVouch;
export type DeclineVouchRoute = typeof declineVouch;

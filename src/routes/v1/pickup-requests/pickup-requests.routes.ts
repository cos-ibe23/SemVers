import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
    paginatedSchema,
} from '../../../lib/openapi/helpers';
import {
    pickupRequestResponseSchema,
    createPickupRequestShipperSchema,
    updatePickupRequestSchema,
} from '../../../db/schema/pickup-requests';
import { pickupResponseSchema } from '../../../db/schema/pickups';

const TAGS = ['v1-pickup-requests'] as const;

const pickupRequestStatusEnum = z.enum([
    'PENDING',
    'QUOTED',
    'PAYMENT_SUBMITTED',
    'PAYMENT_VERIFIED',
    'ACCEPTED',
    'REJECTED',
    'CONVERTED',
]);

export const listPickupRequests = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/pickup-requests',
    request: {
        query: z.object({
            page: z.coerce.number().min(1).default(1),
            limit: z.coerce.number().min(1).max(100).default(20),
            search: z.string().optional(),
            status: pickupRequestStatusEnum.optional(),
            clientId: z.string().optional(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(
            paginatedSchema(pickupRequestResponseSchema),
            'List of pickup requests'
        ),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const getPickupRequest = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/pickup-requests/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(pickupRequestResponseSchema, 'Pickup request details'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup request not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const createPickupRequest = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/pickup-requests',
    request: {
        body: jsonContentRequired(createPickupRequestShipperSchema, 'Create pickup request'),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(pickupRequestResponseSchema, 'Pickup request created'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const updatePickupRequest = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'patch',
    path: '/pickup-requests/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(updatePickupRequestSchema, 'Update pickup request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(pickupRequestResponseSchema, 'Pickup request updated'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup request not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const deletePickupRequest = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'delete',
    path: '/pickup-requests/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'Pickup request deleted'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup request not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

const convertToPickupRequestSchema = z.object({
    fxRateId: z.number().optional(),
    pickupFeeUsd: z.number().nonnegative().optional(),
});

const convertToPickupResponseSchema = z.object({
    pickup: pickupResponseSchema,
    request: pickupRequestResponseSchema,
});

export const convertToPickup = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/pickup-requests/{id}/convert',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(convertToPickupRequestSchema, 'Convert to pickup options'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(convertToPickupResponseSchema, 'Pickup created from request'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Pickup request not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export type ListPickupRequestsRoute = typeof listPickupRequests;
export type GetPickupRequestRoute = typeof getPickupRequest;
export type CreatePickupRequestRoute = typeof createPickupRequest;
export type UpdatePickupRequestRoute = typeof updatePickupRequest;
export type DeletePickupRequestRoute = typeof deletePickupRequest;
export type ConvertToPickupRoute = typeof convertToPickup;

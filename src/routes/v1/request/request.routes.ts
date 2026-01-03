import { createRoute, z } from '@hono/zod-openapi';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
} from '../../../lib/openapi/helpers';
import {
    pickupRequestResponseSchema,
    createPickupRequestPublicSchema,
} from '../../../db/schema/pickup-requests';
import { CURRENCIES } from '../../../constants/enums';

const TAGS = ['v1-public-request'] as const;

// Public FX rate schema (minimal info for clients)
const publicFxRateSchema = z.object({
    fromCurrency: z.enum(CURRENCIES),
    toCurrency: z.enum(CURRENCIES),
    rate: z.string(),
});

// Public shipper info for the form
const shipperPublicInfoSchema = z.object({
    id: z.string(),
    name: z.string(),
    businessName: z.string().nullable(),
    logoUrl: z.string().nullable(),
    city: z.string().nullable(),
    state: z.string().nullable(),
    country: z.string().nullable(),
    fxRates: z.array(publicFxRateSchema),
});

export const getShipperBySlug = createRoute({
    // No authentication middleware - this is a public route
    tags: [...TAGS],
    method: 'get',
    path: '/request/{slug}',
    request: {
        params: z.object({
            slug: z.string().min(1),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(shipperPublicInfoSchema, 'Shipper info for request form'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Shipper has not completed onboarding'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Shipper not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const submitPublicRequest = createRoute({
    // No authentication middleware - this is a public route
    tags: [...TAGS],
    method: 'post',
    path: '/request/{slug}',
    request: {
        params: z.object({
            slug: z.string().min(1),
        }),
        body: jsonContentRequired(createPickupRequestPublicSchema, 'Pickup request submission'),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(pickupRequestResponseSchema, 'Pickup request created'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Invalid request data'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('Shipper not found'),
        [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonApiErrorContent('Validation error'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export type GetShipperBySlugRoute = typeof getShipperBySlug;
export type SubmitPublicRequestRoute = typeof submitPublicRequest;

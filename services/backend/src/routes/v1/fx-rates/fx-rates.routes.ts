import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
} from '../../../lib/openapi/helpers';
import {
    fxRateResponseSchema,
    createFxRateRequestSchema,
    updateFxRateRequestSchema,
} from '../../../db/schema/fx-rates';
import { CURRENCIES } from '../../../constants/enums';

const TAGS = ['v1-fx-rates'] as const;

const currencyEnum = z.enum(CURRENCIES);

export const listFxRates = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/fx-rates',
    request: {
        query: z.object({
            fromCurrency: currencyEnum.optional(),
            toCurrency: currencyEnum.optional(),
            activeOnly: z.coerce.boolean().optional(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.array(fxRateResponseSchema), 'List of FX rates'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const getCurrentFxRate = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/fx-rates/current',
    request: {
        query: z.object({
            fromCurrency: currencyEnum.default('USD'),
            toCurrency: currencyEnum.default('NGN'),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(fxRateResponseSchema.nullable(), 'Current active FX rate'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const getFxRate = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'get',
    path: '/fx-rates/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(fxRateResponseSchema, 'FX rate details'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('FX rate not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const createFxRate = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'post',
    path: '/fx-rates',
    request: {
        body: jsonContentRequired(createFxRateRequestSchema, 'Create FX rate request'),
    },
    responses: {
        [HttpStatusCodes.CREATED]: jsonContent(fxRateResponseSchema, 'FX rate created'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const updateFxRate = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'patch',
    path: '/fx-rates/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
        body: jsonContentRequired(updateFxRateRequestSchema, 'Update FX rate request'),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(fxRateResponseSchema, 'FX rate updated'),
        [HttpStatusCodes.BAD_REQUEST]: jsonApiErrorContent('Bad request'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('FX rate not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export const deleteFxRate = createRoute({
    middleware: [authenticated],
    tags: [...TAGS],
    method: 'delete',
    path: '/fx-rates/{id}',
    request: {
        params: z.object({
            id: z.coerce.number(),
        }),
    },
    responses: {
        [HttpStatusCodes.OK]: jsonContent(z.object({ success: z.boolean() }), 'FX rate deleted'),
        [HttpStatusCodes.UNAUTHORIZED]: jsonApiErrorContent('Unauthorized'),
        [HttpStatusCodes.FORBIDDEN]: jsonApiErrorContent('Forbidden'),
        [HttpStatusCodes.NOT_FOUND]: jsonApiErrorContent('FX rate not found'),
        [HttpStatusCodes.INTERNAL_SERVER_ERROR]: jsonApiErrorContent('Internal server error'),
    },
});

export type ListFxRatesRoute = typeof listFxRates;
export type GetCurrentFxRateRoute = typeof getCurrentFxRate;
export type GetFxRateRoute = typeof getFxRate;
export type CreateFxRateRoute = typeof createFxRate;
export type UpdateFxRateRoute = typeof updateFxRate;
export type DeleteFxRateRoute = typeof deleteFxRate;

import { createRoute, z } from '@hono/zod-openapi';
import { authenticated } from '../../../middlewares';
import {
    jsonContent,
    jsonContentRequired,
    jsonApiErrorContent,
    paginatedSchema,
    searchPaginationQuerySchema,
} from '../../../lib/openapi/helpers';

const clientUserSchema = z.object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    image: z.string().nullable(),
});

const shipperClientSchema = z.object({
    shipperId: z.string(),
    clientId: z.string(),
    nickname: z.string().nullable(),
    phone: z.string().nullable(),
    createdAt: z.string(),
    client: clientUserSchema,
});

export const listClients = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'get',
    path: '/clients',
    request: {
        query: searchPaginationQuerySchema,
    },
    responses: {
        200: jsonContent(paginatedSchema(shipperClientSchema), 'List of clients'),
        401: jsonApiErrorContent('Not authenticated'),
    },
});

export const addClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'post',
    path: '/clients',
    request: {
        body: jsonContentRequired(
            z.object({
                clientUserId: z.string().optional(),
                name: z.string().min(1).max(255).optional(),
                email: z.string().email().optional(),
                nickname: z.string().max(255).optional(),
                phone: z.string().max(50).optional(),
            }).refine(
                (data) => data.clientUserId || (data.name && data.email),
                { message: 'Either clientUserId or both name and email are required' }
            ),
            'Add client request'
        ),
    },
    responses: {
        201: jsonContent(shipperClientSchema, 'Client added'),
        400: jsonApiErrorContent('Bad request'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Client user not found'),
        422: jsonApiErrorContent('Validation error'),
    },
});

export const getClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'get',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
    },
    responses: {
        200: jsonContent(shipperClientSchema, 'Client details'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Client not found'),
    },
});

export const updateClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'patch',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
        body: jsonContentRequired(
            z.object({
                nickname: z.string().max(255).nullable().optional(),
                phone: z.string().max(50).nullable().optional(),
            }),
            'Update client request'
        ),
    },
    responses: {
        200: jsonContent(shipperClientSchema, 'Client updated'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Client not found'),
        422: jsonApiErrorContent('Validation error'),
    },
});

export const removeClient = createRoute({
    middleware: [authenticated],
    tags: ['v1-clients'],
    method: 'delete',
    path: '/clients/{clientId}',
    request: {
        params: z.object({
            clientId: z.string(),
        }),
    },
    responses: {
        200: jsonContent(z.object({ success: z.boolean() }), 'Client removed'),
        401: jsonApiErrorContent('Not authenticated'),
        404: jsonApiErrorContent('Client not found'),
    },
});

export type ListClientsRoute = typeof listClients;
export type AddClientRoute = typeof addClient;
export type GetClientRoute = typeof getClient;
export type UpdateClientRoute = typeof updateClient;
export type RemoveClientRoute = typeof removeClient;

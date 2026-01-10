import { AuthService } from '../../../services';
import { ApiError, BadRequestError } from '../../../lib/errors';
import * as HttpStatusCodes from '../../../lib/http-status-codes';
import { handleLogoUpload } from '../../../lib/upload-helper';
import type { AppRouteHandler } from '../../../lib/types';
import type { GetMeRoute, OnboardRoute, UpdateProfileRoute } from './auth.routes';

export const getMe: AppRouteHandler<GetMeRoute> = async (c) => {
    try {
        const user = c.get('authenticatedUser')!;
        const session = c.get('session')!;

        const service = new AuthService({ context: c });
        const fullUser = await service.getUser();

        return c.json({
            user: fullUser,
            session: {
                id: session.id,
                userId: session.userId,
                expiresAt: session.expiresAt.toISOString(),
            },
        }, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'getMe' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const onboard: AppRouteHandler<OnboardRoute> = async (c) => {
    try {
        const contentType = c.req.header('content-type') || '';
        let onboardData: {
            businessName: string;
            logoUrl?: string | null;
            street?: string | null;
            city?: string | null;
            state?: string | null;
            country?: string | null;
            phoneCountryCode?: string | null;
            phoneNumber?: string | null;
            role?: 'SHIPPER' | 'CLIENT';
            voucherEmails?: string[];
        };

        // Handle multipart form data (file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await c.req.formData();
            const logoFile = formData.get('logoFile') as File | null;
            const businessName = formData.get('businessName') as string;
            const logoUrl = formData.get('logoUrl') as string | null;

            if (!businessName) {
                throw new BadRequestError('businessName is required');
            }

            // File upload is optional - use handleLogoUpload which handles both file and URL
            // If file provided and S3 configured, it will upload
            // If no file or S3 not configured, falls back to logoUrl
            const finalLogoUrl = await handleLogoUpload(logoFile, logoUrl, c);

            onboardData = {
                businessName,
                logoUrl: finalLogoUrl,
                street: (formData.get('street') as string) || null,
                city: (formData.get('city') as string) || null,
                state: (formData.get('state') as string) || null,
                country: (formData.get('country') as string) || null,
                phoneCountryCode: (formData.get('phoneCountryCode') as string) || null,
                phoneNumber: (formData.get('phoneNumber') as string) || null,
            };
        } else {
            // Handle JSON (existing behavior)
            const jsonData = c.req.valid('json');

            // Validate that JSON doesn't contain file-like data
            if (jsonData && typeof jsonData === 'object' && 'logoFile' in jsonData) {
                throw new BadRequestError(
                    'Cannot send logoFile in JSON. Use multipart/form-data for file uploads, or use logoUrl (string) instead.'
                );
            }

            onboardData = jsonData;
        }

        const service = new AuthService({ context: c });
        const user = await service.onboard(onboardData);

        return c.json(user, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'onboard' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            case HttpStatusCodes.UNPROCESSABLE_ENTITY:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNPROCESSABLE_ENTITY);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

export const updateProfile: AppRouteHandler<UpdateProfileRoute> = async (c) => {
    try {
        const body = c.req.valid('json');
        const service = new AuthService({ context: c });
        const user = await service.updateProfile(body);

        return c.json(user, HttpStatusCodes.OK);
    } catch (error: unknown) {
        const apiError = ApiError.parse(error);
        apiError.log({ handler: 'updateProfile' });

        switch (apiError.statusCode) {
            case HttpStatusCodes.BAD_REQUEST:
                return c.json(apiError.toResponseError(), HttpStatusCodes.BAD_REQUEST);
            case HttpStatusCodes.UNAUTHORIZED:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNAUTHORIZED);
            case HttpStatusCodes.NOT_FOUND:
                return c.json(apiError.toResponseError(), HttpStatusCodes.NOT_FOUND);
            case HttpStatusCodes.UNPROCESSABLE_ENTITY:
                return c.json(apiError.toResponseError(), HttpStatusCodes.UNPROCESSABLE_ENTITY);
            default:
                return c.json(apiError.toResponseError(), HttpStatusCodes.INTERNAL_SERVER_ERROR);
        }
    }
};

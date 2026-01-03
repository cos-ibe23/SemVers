import { AuthService } from '../../../services';
import { ApiError } from '../../../lib/errors';
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
        };

        // Handle multipart form data (file upload)
        if (contentType.includes('multipart/form-data')) {
            const formData = await c.req.formData();
            const logoFile = formData.get('logoFile') as File | null;
            const businessName = formData.get('businessName') as string;
            const logoUrl = formData.get('logoUrl') as string | null;

            if (!businessName) {
                throw new ApiError('businessName is required', {
                    statusCode: HttpStatusCodes.BAD_REQUEST,
                    statusPhrase: 'Bad Request',
                });
            }

            // Enforce: multipart/form-data must include a file
            if (!logoFile || logoFile.size === 0) {
                throw new ApiError(
                    'When using multipart/form-data, logoFile must be provided. Use application/json with logoUrl instead if you only want to provide a URL.',
                    {
                        statusCode: HttpStatusCodes.BAD_REQUEST,
                        statusPhrase: 'Bad Request',
                    }
                );
            }

            // Use decoupled upload helper
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
            // Enforce: JSON should not contain file references
            const jsonData = c.req.valid('json');
            
            // Validate that JSON doesn't contain file-like data
            if (jsonData && typeof jsonData === 'object' && 'logoFile' in jsonData) {
                throw new ApiError(
                    'Cannot send logoFile in JSON. Use multipart/form-data for file uploads, or use logoUrl (string) instead.',
                    {
                        statusCode: HttpStatusCodes.BAD_REQUEST,
                        statusPhrase: 'Bad Request',
                    }
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

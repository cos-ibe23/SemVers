import { authClient, serverFetchOptions } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to, from) => {
    let retries = 3;
    let lastError;

    while (retries > 0) {
        try {
            const { data } = await authClient.getSession({
                fetchOptions: {
                    ...serverFetchOptions,
                    headers: {
                        ...serverFetchOptions.headers,
                        ...useRequestHeaders(['cookie']) as HeadersInit,
                    }
                }
            })
            
            if (!data) {
                return navigateTo('/login')
            }
            return; // Success
        } catch (error: any) {
            lastError = error;
            console.warn(`[Auth Middleware] Failed to fetch session (retries left: ${retries - 1}):`, error.message);
            retries--;
            if (retries === 0) break;
            // Configurable delay
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    console.error('[Auth Middleware] Failed to fetch session after retries:', lastError);
    // Fail safe to login if auth check errors out
    return navigateTo('/login')
})

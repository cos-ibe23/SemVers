import { authClient, serverFetchOptions } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to, from) => {
    // Skip auth check during SSR - only run client-side
    // This prevents issues where client-side login sets cookies that aren't available in SSR context
    if (import.meta.server) {
        return;
    }
    
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
            
            console.log('[Auth Middleware] Session data:', data);
            
            if (!data) {
                console.warn('[Auth Middleware] No session data, redirecting to login');
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

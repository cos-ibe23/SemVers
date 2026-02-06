import { createAuthClient } from "better-auth/vue"
import { Agent } from "undici"

// Use runtime config to get the API URL (set in .env)
const getBaseUrl = (): string => {
    let url: string | undefined;

    // Detect Server Environment - Robust Check
    const isServer = import.meta.server || typeof window === 'undefined';

    // 1. Try Nuxt Runtime Config (Preferred)
    try {
        const config = useRuntimeConfig();
        // Check for apiProxyTarget (private key, server only)
        if (isServer && config.apiProxyTarget) {
             return config.apiProxyTarget as string;
        }
        if (config.public?.apiBase) {
            url = config.public.apiBase;
        }
    } catch (e) {
        // useRuntimeConfig not available (e.g. called outside of context)
    }

    // 2. Try process.env for Server Side (Fallback)
    if (isServer && typeof process !== 'undefined' && process.env) {
        if (process.env.NUXT_API_PROXY_TARGET) {
            return process.env.NUXT_API_PROXY_TARGET;
        }
        // If we only found a relative URL so far, try to construct absolute
        // But better to just default to the known internal service if variable is missing
        if (!url || url.startsWith('/')) {
             console.warn('[useAuth] SSR Environment detected but NUXT_API_PROXY_TARGET is missing. Defaulting to internal service.');
             return 'http://imbod-api-dev:80'; 
        }
    }

    // 3. Client-side or Fallback
    // If we are on server and still have a relative URL, we MUST fix it.
    if (isServer && (!url || url.startsWith('/'))) {
         // This block shouldn't be reached if step 2 worked, but as safety net:
         return 'http://imbod-api-dev:80'; 
    }

    // 4. Client-side: Resolve relative URL to absolute
    if (!isServer && url && url.startsWith('/')) {
        return window.location.origin;
    }

    return url || "https://api.imbod.com";
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  basePath: "/v1/auth",
  fetchOptions: {
      headers: import.meta.server ? {
          'Origin': 'https://imbod.com' // Spoof Origin for SSR backend checks
      } : undefined,
      dispatcher: import.meta.server ? new Agent({
        keepAliveTimeout: 10,
        keepAliveMaxTimeout: 10,
      }) : undefined
  }
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient

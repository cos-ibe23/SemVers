import { createAuthClient } from "better-auth/vue"

// Use runtime config to get the API URL (set in .env)
const getBaseUrl = (): string => {
    let url: string | undefined;

    // Detect Server Environment
    const isServer = import.meta.server || typeof window === 'undefined';

    // 1. Try Nuxt Runtime Config (Preferred)
    try {
        const config = useRuntimeConfig()
        if (isServer && config.apiProxyTarget) {
            return config.apiProxyTarget as string

        }
        if (config.public?.apiBase) {
            url = config.public.apiBase
        }
    } catch (e) {
        // useRuntimeConfig not available
    }

    // 2. Try process.env / import.meta.env
    if (!url) {
        // @ts-ignore
        const env = import.meta.env || (typeof process !== 'undefined' ? process.env : {});
        url = env.NUXT_PUBLIC_API_BASE || env.NUXT_API_PROXY_TARGET;
    }

    // 3. Server-side Safety Check: Enforce Absolute URL
    if (isServer) {
        // If we have a proxy target in env, use it (Higher priority than relative apiBase)
        // @ts-ignore
        const envProxy = (import.meta.env || (typeof process !== 'undefined' ? process.env : {})).NUXT_API_PROXY_TARGET;
        if (envProxy) {
            return envProxy;
        }

        // If URL is relative or missing, we MUST providing a fallback to prevent 500 error
        if (!url || url.startsWith('/')) {
            console.warn('SSR API URL is relative but no proxy target found. Defaulting to internal service http://imbod-api:80/v1');
            return 'http://imbod-api:80/v1'; // Default to prod service name as last resort
        }
    }

    // 4. Client-side Fallback
    return url || "https://api.imbod.com";
}

export const authClient = createAuthClient({
  baseURL: getBaseUrl(),
  basePath: "/v1/auth",
  fetchOptions: {
      headers: import.meta.server ? {
          'Origin': 'https://imbod.com' // Spoof Origin for SSR backend checks
      } : undefined
  }
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient

import { authClient } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to, from) => {
    try {
        const { data } = await authClient.getSession()
        
        if (!data) {
            return navigateTo('/login')
        }
    } catch (error) {
        console.error('[Auth Middleware] Failed to fetch session:', error)
        // Fail safe to login if auth check errors out
        return navigateTo('/login')
    }
})

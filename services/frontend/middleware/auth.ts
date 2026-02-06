import { authClient } from "~/composables/useAuth"

export default defineNuxtRouteMiddleware(async (to, from) => {
    const { data } = await authClient.getSession()
    
    if (!data) {
        return navigateTo('/login')
    }
})

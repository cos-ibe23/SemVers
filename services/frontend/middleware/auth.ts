export default defineNuxtRouteMiddleware(async (to, from) => {
    const session = useSession()
    
    if (!session.value?.data) {
        return navigateTo('/login')
    }
})

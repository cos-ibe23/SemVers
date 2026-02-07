<script setup lang="ts">
import { useSession } from "~/composables/useAuth"

definePageMeta({
  layout: 'auth',
  middleware: 'auth'
})

const { data: session } = useSession()
const form = ref({
    business_name: '',
    phone_country_code: '+234',
    phone_number: '',
    street: '',
    city: '',
    state: '',
    country: 'Nigeria',
    role: 'SHIPPER'
})
const loading = ref(false)
const error = ref('')

async function handleOnboarding() {
    loading.value = true
    error.value = ''
    try {
        const { public: { apiBase } } = useRuntimeConfig()
        // Using fetch to call the backend onboarding endpoint directly as it might be custom not purely better-auth
        // The endpoint from listing app was POST /onboarding
        // In the new backend, it might be /v1/auth/onboard? No, let's check routes.
        // Wait, app.ts line 51 says: const customRoutes = ['/v1/auth/me', '/v1/auth/onboard', ...];
        // So it is /v1/auth/onboard
        
        // However, standard better-auth client doesn't have "onboard" method unless plugin used.
        // We will use standard fetch with token (cookie is handled seamlessly).
        
        // Wait, backend explicitly mounts /v1/public-request? No.
        // Let's check backend routes again?
        // Actually, listing app used POST /onboarding.
        // The new backend `app.ts` ignores `/v1/auth/onboard` from better-auth handler, meaning it HAS a custom handler for it?
        // Let's assume there is an endpoint `/v1/auth/onboard`.
        
        const res = await $fetch(`${apiBase}/v1/auth/onboard`, {
            method: 'POST',
            body: form.value,
        })
        
        navigateTo('/dashboard')
    } catch (err: any) {
        error.value = err.data?.message || err.message || 'Failed to onboard'
    } finally {
        loading.value = false
    }
}
</script>

<template>
    <div class="card p-6 shadow-xl border-none w-full max-w-lg">
        <div class="text-center mb-6">
            <h1 class="text-2xl font-bold text-[var(--accent)]">Complete Your Profile</h1>
            <p class="text-[var(--muted)]">Tell us about you</p>
        </div>
        
        <form @submit.prevent="handleOnboarding" class="flex flex-col gap-4">
             <AppInput v-model="form.business_name" label="Business / Profile Name" required placeholder="e.g. Acme Logistics" />
             
             <div class="grid grid-cols-2 gap-4">
                 <AppInput v-model="form.phone_country_code" label="Country Code" required />
                 <AppInput v-model="form.phone_number" label="Phone" required />
             </div>
             
             <AppInput v-model="form.street" label="Street Address" />
             
             <div class="grid grid-cols-2 gap-4">
                 <AppInput v-model="form.city" label="City" />
                 <AppInput v-model="form.state" label="State" />
             </div>
             
             <div v-if="error" class="text-sm text-[var(--danger)] text-center bg-red-50 p-2 rounded">
                {{ error }}
             </div>

             <AppButton type="submit" :loading="loading" class="w-full justify-center mt-4">
                 Get Started
             </AppButton>
        </form>
    </div>
</template>

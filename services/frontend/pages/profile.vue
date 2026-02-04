<script setup lang="ts">
import { useSession, signOut } from "~/composables/useAuth"

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { data: session } = useSession()
const { public: { apiBase } } = useRuntimeConfig()
const profile = ref<any>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    // Fetch extended profile data if not in session
    // Using BetterAuth customSession, session.user should have extended fields
    // But for full details like address, we might need a separate endpoint if not all are in session
    // Our session config in backend (db/auth.ts) includes: businessName, street, city, etc.
    // So session.user is enough!
  } finally {
    loading.value = false
  }
})

async function handleLogout() {
  await signOut({
    callbackURL: '/login'
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">My Profile</h1>
        <p class="text-[var(--muted)]">Manage your account settings</p>
      </div>
      <AppButton variant="secondary" @click="handleLogout">
        Sign Out
      </AppButton>
    </div>

    <div v-if="session?.user" class="grid md:grid-cols-2 gap-6">
      <AppCard title="Personal Information">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-[var(--muted)] uppercase">Full Name</span>
            <span class="text-lg">{{ session.user.name }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-[var(--muted)] uppercase">Email</span>
            <span class="text-lg">{{ session.user.email }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-[var(--muted)] uppercase">Role</span>
            <span class="text-lg">{{ (session.user as any).role || 'User' }}</span>
          </div>
        </div>
      </AppCard>

      <AppCard title="Business Details">
        <div class="flex flex-col gap-4">
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-[var(--muted)] uppercase">Business Name</span>
            <span class="text-lg">{{ (session.user as any).businessName || 'N/A' }}</span>
          </div>
           <div class="flex flex-col">
            <span class="text-sm font-semibold text-[var(--muted)] uppercase">Address</span>
            <span class="text-lg">
                {{ [ (session.user as any).street, (session.user as any).city, (session.user as any).state, (session.user as any).country].filter(Boolean).join(', ') || 'N/A' }}
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-sm font-semibold text-[var(--muted)] uppercase">Phone</span>
            <span class="text-lg">{{ (session.user as any).phone || 'N/A' }}</span>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useSession } from "~/composables/useAuth"

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { data: session } = useSession()
const { public: { apiBase } } = useRuntimeConfig()

// Use fetch directly for now as we don't have a typed API client generated yet
const { data: boxes, pending, error } = await useFetch(`${apiBase}/boxes`, {
  headers: {
      // BetterAuth handles cookies, but if we need bearer:
      // headers: { Authorization: `Bearer ${token}` }
      // We rely on cookies for now.
  }
})

const recentBoxes = computed(() => {
  if (!boxes.value || !Array.isArray(boxes.value)) return []
  // Sort by created at desc if not already
  return boxes.value.slice(0, 5)
})
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">Dashboard</h1>
        <p class="text-[var(--muted)]">Welcome back, {{ session?.user?.name }}</p>
      </div>
      <div class="flex gap-3">
        <AppButton to="/box/create">Create Box</AppButton>
        <AppButton to="/pickup/create" variant="secondary">Request Pickup</AppButton>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="kpi-grid">
      <div class="kpi">
        <span class="label">Total Shipments</span>
        <span class="value">{{ boxes?.length || 0 }}</span>
        <span class="hint">All time</span>
      </div>
      <div class="kpi">
        <span class="label">Pending Delivery</span>
        <span class="value">{{ (boxes || []).filter((b: any) => b.status !== 'DELIVERED').length }}</span>
        <span class="hint">Active shipments</span>
      </div>
      <div class="kpi">
        <span class="label">Last Pickup</span>
        <span class="value">-</span>
        <span class="hint">No recent activity</span>
      </div>
    </div>

    <AppCard title="Recent Shipments">
       <template v-if="pending">
         <div class="p-4 text-center text-[var(--muted)]">Loading...</div>
       </template>
       <template v-else-if="error">
         <div class="p-4 text-center text-[var(--danger)]">Failed to load shipments</div>
       </template>
       <template v-else-if="recentBoxes.length === 0">
         <div class="p-8 text-center flex flex-col items-center gap-3">
            <div class="text-[var(--muted)]">No shipments found. start by creating one.</div>
            <AppButton to="/box/create" variant="ghost">Create specific Box</AppButton>
         </div>
       </template>
       <AppTable v-else>
         <thead>
           <tr>
             <th>Label</th>
             <th>Status</th>
             <th>Weight (lb)</th>
             <th>Created</th>
           </tr>
         </thead>
         <tbody>
           <tr v-for="box in recentBoxes" :key="box.id">
             <td>
               <NuxtLink :to="`/shipments/${box.id}`" class="link-clickable font-medium">
                 {{ box.label || 'Untitled' }}
               </NuxtLink>
             </td>
             <td>
               <AppBadge :variant="box.status === 'DELIVERED' ? 'success' : 'info'">
                 {{ box.status }}
               </AppBadge>
             </td>
             <td>{{ box.actualWeightLb || box.estimatedWeightLb || '-' }}</td>
             <td>{{ box.createdAt ? new Date(box.createdAt).toLocaleDateString() : '-' }}</td>
           </tr>
         </tbody>
       </AppTable>
    </AppCard>
  </div>
</template>

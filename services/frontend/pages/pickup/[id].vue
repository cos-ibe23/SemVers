<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const route = useRoute()
const { public: { apiBase } } = useRuntimeConfig()

const { data: pickup, pending, error } = await useFetch(`${apiBase}/v1/pickups/${route.params.id}`)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex items-center gap-4 mb-2">
      <AppButton variant="ghost" @click="$router.back()" class="px-0">← Back</AppButton>
      <h1 class="text-3xl font-bold tracking-tight">Pickup #{{ route.params.id }}</h1>
    </div>

    <div v-if="pending" class="p-8 text-center text-[var(--muted)]">Loading details...</div>
    <div v-else-if="error || !pickup" class="p-8 text-center text-[var(--danger)]">Pickup not found</div>
    
    <template v-else>
      <div class="grid md:grid-cols-3 gap-6">
        <div class="md:col-span-2 flex flex-col gap-6">
           <AppCard title="Items">
             <AppTable>
               <thead>
                 <tr>
                   <th>Category</th>
                   <th>Model</th>
                   <th>Weight</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 <tr v-for="item in pickup.items" :key="item.id">
                   <td>{{ item.category }}</td>
                   <td>{{ item.model || '-' }}</td>
                   <td>{{ item.estimatedWeightLb ? item.estimatedWeightLb + ' lb' : '-' }}</td>
                   <td>
                     <AppBadge>{{ pickup.status }}</AppBadge>
                   </td>
                 </tr>
               </tbody>
             </AppTable>
           </AppCard>
        </div>

        <div class="flex flex-col gap-6">
          <AppCard title="Pickup Info">
            <div class="flex flex-col gap-3">
              <div class="flex justify-between">
                <span class="text-[var(--muted)]">Status</span>
                <AppBadge :variant="pickup.status === 'COMPLETED' ? 'success' : 'info'">{{ pickup.status }}</AppBadge>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--muted)]">Date</span>
                <span>{{ pickup.pickupDate ? new Date(pickup.pickupDate).toLocaleDateString() : 'Not scheduled' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-[var(--muted)]">Fee</span>
                <span>{{ pickup.pickupFeeUsd ? '$' + pickup.pickupFeeUsd : '-' }}</span>
              </div>
                <div class="flex justify-between">
                <span class="text-[var(--muted)]">Items</span>
                <span>{{ pickup.items?.length || 0 }}</span>
              </div>
            </div>
          </AppCard>
          
          <AppCard v-if="pickup.notes" title="Notes">
             <p class="text-sm text-[var(--muted)]">{{ pickup.notes }}</p>
          </AppCard>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { public: { apiBase } } = useRuntimeConfig()

// Fetch pickups to derive items list (since there is no /items endpoint)
const { data: pickups, pending, error } = await useFetch<any[]>(`${apiBase}/v1/pickups`)

const items = computed(() => {
  if (!pickups.value) return []
  
  // Flatten items from all pickups
  return pickups.value.flatMap(pickup => {
    if (!pickup.items) return []
    return pickup.items.map((item: any) => ({
      ...item,
      pickupId: pickup.id, // Ensure pickupId is available
      // Map status from pickup if needed, or item status
    }))
  })
})
</script>

<template>
  <div class="flex flex-col gap-6">
     <div>
       <h1 class="text-3xl font-bold tracking-tight mb-2">Inventory</h1>
       <p class="text-[var(--muted)]">All items in your account</p>
     </div>

     <AppCard>
       <div v-if="pending" class="p-8 text-center text-[var(--muted)]">Loading items...</div>
       <div v-else-if="error" class="p-8 text-center text-[var(--danger)]">Failed to load items</div>
       <div v-else-if="items.length === 0" class="p-12 text-center text-[var(--muted)]">
          No items found.
       </div>
       <AppTable v-else>
         <thead>
           <tr>
             <th>Category</th>
             <th>Model</th>
             <th>Serial / IMEI</th>
             <th>Weight</th>
             <th>Pickup ID</th>
           </tr>
         </thead>
         <tbody>
           <tr v-for="item in items" :key="item.id">
             <td>{{ item.category }}</td>
             <td>{{ item.model || '-' }}</td>
             <td>{{ item.serialOrImei || item.imei || '-' }}</td>
             <td>{{ item.estimatedWeightLb || '-' }} lb</td>
             <td>
               <NuxtLink v-if="item.pickupId" :to="`/pickup/${item.pickupId}`" class="link-clickable">
                 #{{ item.pickupId }}
               </NuxtLink>
               <span v-else>-</span>
             </td>
           </tr>
         </tbody>
       </AppTable>
    </AppCard>
  </div>
</template>

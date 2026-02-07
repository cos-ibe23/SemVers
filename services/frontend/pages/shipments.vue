<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { public: { apiBase } } = useRuntimeConfig()

const { data: boxes, pending, error } = await useFetch(`${apiBase}/boxes`)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold tracking-tight mb-2">Shipments</h1>
        <p class="text-[var(--muted)]">Manage your boxes and shipments</p>
      </div>
      <AppButton to="/box/create">New Shipment</AppButton>
    </div>

    <AppCard>
       <div v-if="pending" class="p-8 text-center text-[var(--muted)]">Loading shipments...</div>
       <div v-else-if="error" class="p-8 text-center text-[var(--danger)]">Failed to load shipments</div>
       <div v-else-if="!boxes || boxes.length === 0" class="p-12 text-center text-[var(--muted)]">
          No shipments found.
       </div>
       <AppTable v-else>
         <thead>
           <tr>
             <th class="w-16">#</th>
             <th>Label</th>
             <th>Status</th>
             <th>Est. Weight</th>
             <th>Actual Weight</th>
             <th>Created</th>
             <th class="text-right">Actions</th>
           </tr>
         </thead>
         <tbody>
           <tr v-for="box in boxes" :key="box.id">
             <td class="text-[var(--muted)]">{{ box.id }}</td>
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
             <td>{{ box.estimatedWeightLb || '-' }} lb</td>
             <td>{{ box.actualWeightLb || '-' }} lb</td>
             <td>{{ new Date(box.createdAt).toLocaleDateString() }}</td>
             <td class="text-right">
                <AppButton :to="`/shipments/${box.id}`" variant="ghost" class="py-1 px-2 text-sm">
                  View
                </AppButton>
             </td>
           </tr>
         </tbody>
       </AppTable>
    </AppCard>
  </div>
</template>

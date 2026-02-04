<script setup lang="ts">
import { useSession } from "~/composables/useAuth"

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { public: { apiBase } } = useRuntimeConfig()
const router = useRouter()

const form = ref({
  pickupDate: '',
  notes: '',
  pickupFeeUsd: null as number | null,
  items: [
    { category: '', model: '', estimatedWeightLb: null as number | null, clientShippingUsd: null as number | null }
  ]
})
const loading = ref(false)
const error = ref('')

function addItem() {
  form.value.items.push({ category: '', model: '', estimatedWeightLb: null, clientShippingUsd: null })
}

function removeItem(index: number) {
  form.value.items.splice(index, 1)
}

async function handleSubmit() {
  loading.value = true
  error.value = ''
  
  try {
    // Basic validation
    if (form.value.items.length === 0) {
      throw new Error("Add at least one item")
    }

    const payload = {
      pickupDate: form.value.pickupDate ? new Date(form.value.pickupDate).toISOString() : undefined,
      notes: form.value.notes,
      pickupFeeUsd: form.value.pickupFeeUsd ? Number(form.value.pickupFeeUsd) : undefined,
      items: form.value.items.map(item => ({
        category: item.category,
        model: item.model,
        estimatedWeightLb: item.estimatedWeightLb ? Number(item.estimatedWeightLb) : undefined,
        clientShippingUsd: item.clientShippingUsd ? Number(item.clientShippingUsd) : undefined,
      }))
    }

    await $fetch(`${apiBase}/v1/pickups`, {
      method: 'POST',
      body: payload
    })
    
    // Redirect to pickups list (which we might need to create, or back to dashboard)
    // We haven't created a pickups list page yet, let's redirect to dashboard or make one? 
    // Plan didn't explicitly ask for "Pickups List", but dashboard links to "Create Pickup".
    // I'll redirect to Dashboard for now as "Pickups" tab wasn't in list, but "Shipments" was.
    // Actually, maybe I should create a Pickups List page too if I have time, but sticking to plan:
    // Plan has: Pickup Detail.
    router.push('/')
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to create pickup'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-4xl mx-auto w-full">
     <div>
       <h1 class="text-3xl font-bold tracking-tight mb-2">Request Pickup</h1>
       <p class="text-[var(--muted)]">Schedule a pickup for your items</p>
     </div>

     <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
       <AppCard title="Pickup Details">
         <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
           <AppInput
             v-model="form.pickupDate"
             label="Preferred Date"
             type="date"
           />
           <AppInput
             v-model="form.notes"
             label="Notes / Instructions"
             placeholder="Gate code, specific time, etc."
           />
         </div>
       </AppCard>

       <AppCard title="Items to Pickup">
         <div class="flex flex-col gap-4">
           <div v-for="(item, index) in form.items" :key="index" class="p-4 border rounded-lg bg-gray-50 relative">
             <button 
               v-if="form.items.length > 1"
               type="button" 
               class="absolute top-2 right-2 text-red-500 hover:text-red-700"
               @click="removeItem(index)"
             >
               <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
             </button>
             
             <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
               <AppInput
                 v-model="item.category"
                 label="Category"
                 placeholder="e.g. Laptop, Phone..."
                 required
                 class="lg:col-span-1"
               />
               <AppInput
                 v-model="item.model"
                 label="Model / Description"
                 placeholder="iPhone 13 Pro..."
                 class="lg:col-span-2"
               />
               <AppInput
                 v-model="item.estimatedWeightLb"
                 label="Est. Weight (lb)"
                 type="number"
                 step="0.1"
               />
             </div>
           </div>
           
           <AppButton type="button" variant="secondary" @click="addItem" class="self-start">
             + Add Another Item
           </AppButton>
         </div>
       </AppCard>

       <div v-if="error" class="text-sm text-[var(--danger)] bg-red-50 p-3 rounded">
         {{ error }}
       </div>

       <div class="flex justify-end gap-3 pb-8">
         <AppButton variant="secondary" type="button" @click="router.back()">Cancel</AppButton>
         <AppButton type="submit" :loading="loading">Submit Request</AppButton>
       </div>
     </form>
  </div>
</template>

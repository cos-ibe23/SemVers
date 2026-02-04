<script setup lang="ts">
import { useSession } from "~/composables/useAuth"

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

const { public: { apiBase } } = useRuntimeConfig()
const router = useRouter()

const form = ref({
  label: '',
  shipperRatePerLb: null as number | null,
  insuranceUsd: null as number | null
})
const loading = ref(false)
const error = ref('')

async function handleSubmit() {
  loading.value = true
  error.value = ''
  
  try {
    await $fetch(`${apiBase}/v1/boxes`, {
      method: 'POST',
      body: {
          ...form.value,
          shipperRatePerLb: form.value.shipperRatePerLb ? Number(form.value.shipperRatePerLb) : undefined,
          insuranceUsd: form.value.insuranceUsd ? Number(form.value.insuranceUsd) : undefined,
      }
    })
    
    router.push('/shipments')
  } catch (err: any) {
    error.value = err.data?.message || err.message || 'Failed to create box'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-2xl mx-auto w-full">
     <div>
       <h1 class="text-3xl font-bold tracking-tight mb-2">Create Box</h1>
       <p class="text-[var(--muted)]">Generate a new shipment label</p>
     </div>

     <div class="card p-6">
       <form @submit.prevent="handleSubmit" class="flex flex-col gap-6">
         <AppInput
           v-model="form.label"
           label="Label / Tracking ID"
           placeholder="e.g. BOX-2024-001"
           required
           hint="Enter a unique identifier for this box"
         />

         <div class="grid grid-cols-2 gap-4">
           <AppInput
             v-model="form.shipperRatePerLb"
             label="Rate per Lb ($)"
             type="number"
             placeholder="0.00"
             step="0.01"
           />
           <AppInput
             v-model="form.insuranceUsd"
             label="Insurance ($)"
             type="number"
             placeholder="0.00"
             step="0.01"
           />
         </div>

         <div v-if="error" class="text-sm text-[var(--danger)] bg-red-50 p-3 rounded">
           {{ error }}
         </div>

         <div class="flex justify-end gap-3 mt-2">
           <AppButton variant="secondary" type="button" @click="router.back()">Cancel</AppButton>
           <AppButton type="submit" :loading="loading">Create Box</AppButton>
         </div>
       </form>
     </div>
  </div>
</template>

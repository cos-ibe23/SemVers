<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})
</script>

<template>
  <div class="flex flex-col gap-6">
     <div>
       <h1 class="text-3xl font-bold tracking-tight mb-2">Reconcile</h1>
       <p class="text-[var(--muted)]">Financial reconciliation (Coming Soon)</p>
     </div>

     <AppCard>
       <div class="p-12 text-center text-[var(--muted)]">
          This feature is currently under development.
       </div>
     </AppCard>
  </div>
</template>

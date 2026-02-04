<script setup lang="ts">
interface Props {
  isOpen: boolean
}

defineProps<Props>()
const emit = defineEmits(['close'])

const links = [
  { label: 'Dashboard', to: '/', icon: 'home' },
  { label: 'Create Box', to: '/box/create', icon: 'box' },
  { label: 'Create Pickup', to: '/pickup/create', icon: 'truck' },
  { label: 'Shipments', to: '/shipments', icon: 'ship' },
  { label: 'Reconcile', to: '/reconcile', icon: 'dollar-sign' },
  { label: 'Profile', to: '/profile', icon: 'user' },
]
</script>

<template>
  <>
    <!-- Overlay for mobile -->
    <div 
      class="sidebar-overlay" 
      :class="{ 'block': isOpen }" 
      @click="$emit('close')"
    ></div>

    <aside class="app-sidebar" :class="{ 'sidebar-open': isOpen }">
      <nav class="flex flex-col gap-1">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors"
          active-class="bg-blue-50 text-blue-600"
          @click="$emit('close')"
        >
          <!-- Icons (using simple SVGs for now, can replace with library later) -->
          <span class="w-5 h-5 flex items-center justify-center">
             <!-- Placeholder icons based on name -->
             <svg v-if="link.icon === 'home'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
             <svg v-if="link.icon === 'box'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
             <svg v-if="link.icon === 'truck'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
             <svg v-if="link.icon === 'ship'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 21c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1 .6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M19.38 20A11.6 11.6 0 0 0 21 14l-9-4-9 4c0 2.9.9 5.8 2.38 8"/><path d="M12 10V4"/><path d="M8 8v1"/><path d="M16 8v1"/></svg>
             <svg v-if="link.icon === 'dollar-sign'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
             <svg v-if="link.icon === 'user'" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </span>
          {{ link.label }}
        </NuxtLink>
      </nav>
    </aside>
  </>
</template>

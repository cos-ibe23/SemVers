<script setup lang="ts">
import AppSidebar from '~/components/ui/AppSidebar.vue'

const isSidebarOpen = ref(false)
</script>

<template>
  <div class="app-shell flex flex-col min-h-screen">
    <header class="app-header">
      <div class="app-header-inner">
        <div class="flex items-center gap-4 w-full">
           <!-- Mobile Hamburger -->
          <button class="hamburger-btn md:hidden" @click="isSidebarOpen = true">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          
          <div class="text-xl font-bold tracking-tight text-[var(--accent)]">
            IMBOD
          </div>
          
          <div class="ml-auto flex items-center gap-4">
             <!-- User dropdown or info could go here -->
             <div class="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
               JS
             </div>
          </div>
        </div>
      </div>
    </header>

    <div class="app-container app-grid flex-1">
      <AppSidebar :is-open="isSidebarOpen" @close="isSidebarOpen = false" />
      
      <main class="app-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  subtitle?: string
}

defineProps<Props>()
</script>

<template>
  <div class="card h-full flex flex-col">
    <div v-if="title || $slots.header || $slots.actions" class="card-header">
      <div v-if="title" class="flex flex-col">
          <h3 class="card-title">{{ title }}</h3>
          <p v-if="subtitle" class="text-xs text-[var(--muted)] mt-1">{{ subtitle }}</p>
      </div>
      <slot name="header" />
      <div v-if="$slots.actions" class="ml-auto flex items-center gap-2">
          <slot name="actions" />
      </div>
    </div>
    <div class="card-body flex-1">
      <slot />
    </div>
    <div v-if="$slots.footer" class="p-4 border-t border-[var(--border)] bg-gray-50 rounded-b-[var(--radius)]">
        <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'success' | 'info' | 'warn' | 'danger'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const badgeClass = computed(() => {
  return [
    'chip',
    props.variant !== 'default' ? props.variant : ''
  ]
})
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>

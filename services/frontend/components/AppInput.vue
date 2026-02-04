<script setup lang="ts">
interface Props {
  modelValue?: string | number | null
  label?: string
  type?: string
  placeholder?: string
  id?: string
  required?: boolean
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

const inputId = computed(() => props.id || useId())

function updateValue(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="label" :for="inputId" class="text-sm font-semibold text-[var(--muted)] uppercase tracking-wide">
      {{ label }} <span v-if="required" class="text-red-500">*</span>
    </label>
    <div class="relative">
      <input
        :id="inputId"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        class="input"
        :class="{ 'border-red-500 box-shadow-none': error }"
        @input="updateValue"
      >
      <!-- Optional slot for icons or trailing elements, though not strictly in CSS yet -->
      <slot name="suffix" />
    </div>
    <span v-if="error" class="text-xs text-[var(--danger)]">{{ error }}</span>
  </div>
</template>

<style scoped>
/* Scoped overrides if needed, mostly relying on global .input */
</style>

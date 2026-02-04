<template>
  <div class="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 relative overflow-hidden">
    <!-- Decorative background elements if needed, but body bg already has gradient -->
    <div class="w-full max-w-md relative z-10">
      <slot />
    </div>
  </div>
</template>

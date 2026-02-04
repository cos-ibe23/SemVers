<template>
  <div class="min-h-screen flex flex-col bg-[var(--bg)]">
    <header class="bg-white border-b border-[var(--border)] py-4">
      <div class="container mx-auto px-4 flex justify-between items-center">
        <div class="font-bold text-xl text-[var(--accent)]">IMBOD</div>
        <nav>
           <NuxtLink to="/login" class="text-sm font-semibold hover:text-[var(--accent)]">Login</NuxtLink>
        </nav>
      </div>
    </header>
    <main class="flex-1">
      <slot />
    </main>
  </div>
</template>

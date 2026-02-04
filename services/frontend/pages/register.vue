<script setup lang="ts">
import { signUp } from "~/composables/useAuth"

definePageMeta({
  layout: 'auth'
})

const name = ref('')
const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleRegister() {
  loading.value = true
  error.value = ''
  
  try {
    const { data, error: authError } = await signUp.email({
      email: email.value,
      password: password.value,
      name: name.value,
      callbackURL: '/onboarding'
    })
    
    if (authError) {
      error.value = authError.message || 'Failed to register'
    } else {
        // BetterAuth usually logs in after signup, so redirect
        navigateTo('/onboarding')
    }
  } catch (err: any) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card p-6 shadow-xl border-none">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-[var(--accent)] mb-2">Create Account</h1>
      <p class="text-[var(--muted)]">Get started with Imbod</p>
    </div>

    <form @submit.prevent="handleRegister" class="flex flex-col gap-4">
      <AppInput
        v-model="name"
        label="Full Name"
        type="text"
        placeholder="John Doe"
        required
      />

      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        required
      />
      
      <AppInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
      />
      
      <div v-if="error" class="text-sm text-[var(--danger)] text-center bg-red-50 p-2 rounded">
        {{ error }}
      </div>

      <AppButton
        type="submit"
        :loading="loading"
        class="w-full justify-center mt-2"
      >
        Sign Up
      </AppButton>
      
      <div class="text-center mt-4 text-sm text-[var(--muted)]">
        Already have an account? 
        <NuxtLink to="/login" class="text-[var(--accent)] font-semibold hover:underline">
          Sign in
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

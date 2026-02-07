<script setup lang="ts">
import { signIn } from "~/composables/useAuth"

definePageMeta({
  layout: 'auth'
})

const email = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''
  
  try {
    console.log('Attempting login with:', email.value)
    const { data, error: authError } = await signIn.email({
      email: email.value,
      password: password.value,
      callbackURL: '/dashboard'
    })
    
    if (authError) {
      console.error('Auth Error:', authError)
      error.value = authError.message || 'Failed to login'
    } else {
      console.log('Login successful, navigating to /dashboard')
      navigateTo('/dashboard')
    }
  } catch (err: any) {
    console.error('Unexpected Login Error:', err)
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="card p-6 shadow-xl border-none">
    <div class="text-center mb-8">
      <h1 class="text-2xl font-bold text-[var(--accent)] mb-2">Welcome Back</h1>
      <p class="text-[var(--muted)]">Sign in to your account</p>
    </div>

    <form @submit.prevent="handleLogin" class="flex flex-col gap-4">
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
        Sign In
      </AppButton>
      
      <div class="text-center mt-4 text-sm text-[var(--muted)]">
        Don't have an account? 
        <NuxtLink to="/register" class="text-[var(--accent)] font-semibold hover:underline">
          Sign up
        </NuxtLink>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
// Public landing page - no auth required
</script>

<template>
  <div class="landing-page">
    <header class="hero">
      <div class="container">
        <h1>Welcome to Imbod</h1>
        <p class="tagline">Modern shipping and logistics management</p>
        <div class="cta-buttons">
          <AppButton to="/login" size="lg">Sign In</AppButton>
          <AppButton to="/signup" variant="secondary" size="lg">Get Started</AppButton>
        </div>
      </div>
    </header>

    <section class="features">
      <div class="container">
        <h2>Why Choose Imbod?</h2>
        <div class="feature-grid">
          <div class="feature">
            <h3>📦 Smart Shipping</h3>
            <p>Manage all your shipments in one place</p>
          </div>
          <div class="feature">
            <h3>🚚 Easy Tracking</h3>
            <p>Real-time updates on all your packages</p>
          </div>
          <div class="feature">
            <h3>💰 Cost Effective</h3>
            <p>Get the best rates for your shipments</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
}

.hero {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark, #2563eb) 100%);
  color: white;
  padding: 8rem 2rem;
  text-align: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.hero h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin-bottom: 1rem;
}

.tagline {
  font-size: 1.5rem;
  opacity: 0.9;
  margin-bottom: 2rem;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.features {
  padding: 4rem 2rem;
  background: var(--background);
}

.features h2 {
  text-align: center;
  font-size: 2.5rem;
  margin-bottom: 3rem;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature {
  padding: 2rem;
  background: var(--surface);
  border-radius: 12px;
  border: 1px solid var(--border);
  text-align: center;
}

.feature h3 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.feature p {
  color: var(--muted);
}
</style>

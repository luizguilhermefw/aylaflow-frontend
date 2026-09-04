<template>
  <section class="activation-gate" aria-labelledby="company-activation-gate-title">
    <div class="gate-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
    </div>
    <h2 id="company-activation-gate-title">{{ COMPANY_PENDING_GATE_COPY.title }}</h2>
    <p>{{ COMPANY_PENDING_GATE_COPY.description }}</p>
    <div class="gate-actions">
      <ActivationContactCta />
      <RouterLink to="/dashboard" class="dashboard-link">Voltar ao Dashboard</RouterLink>
    </div>
  </section>
</template>

<script setup lang="ts">
import ActivationContactCta from './ActivationContactCta.vue'
import { COMPANY_PENDING_GATE_COPY } from '@/features/company-access/company-access.logic'
</script>

<style scoped>
.activation-gate {
  min-height: 320px;
  padding: 3rem 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  background: var(--card-bg);
  border: 1px dashed var(--brand-border);
  border-radius: 20px;
}

.gate-icon {
  width: 58px;
  height: 58px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-radius: 16px;
}

h2 {
  color: var(--text-primary);
  font-size: 1.2rem;
}

p {
  max-width: 440px;
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.gate-actions {
  margin-top: 1.5rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.dashboard-link {
  padding: 0.65rem 1rem;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  color: var(--text-secondary);
  background: var(--nav-hover);
  font-size: 0.85rem;
  font-weight: 600;
  text-decoration: none;
}

.dashboard-link:hover {
  color: var(--text-primary);
  background: var(--brand-subtle);
}
</style>

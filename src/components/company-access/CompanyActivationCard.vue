<template>
  <section class="activation-card" aria-labelledby="company-activation-card-title">
    <div class="activation-icon" aria-hidden="true">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4"/><path d="m16.2 7.8 2.9-2.9"/><path d="M18 12h4"/><path d="m16.2 16.2 2.9 2.9"/><path d="M12 18v4"/><path d="m4.9 19.1 2.9-2.9"/><path d="M2 12h4"/><path d="m4.9 4.9 2.9 2.9"/><circle cx="12" cy="12" r="3"/></svg>
    </div>
    <div class="activation-content">
      <span class="activation-eyebrow">Próximo passo</span>
      <h2 id="company-activation-card-title">{{ COMPANY_PENDING_ONBOARDING_COPY.title }}</h2>
      <p>{{ COMPANY_PENDING_ONBOARDING_COPY.description }}</p>
      <ActivationContactCta />
    </div>
  </section>
</template>

<script setup lang="ts">
import ActivationContactCta from './ActivationContactCta.vue'
import { COMPANY_PENDING_ONBOARDING_COPY } from '@/features/company-access/company-access.logic'
</script>

<style scoped>
.activation-card {
  padding: 1.5rem;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  background: linear-gradient(135deg, var(--brand-subtle), transparent);
  border: 1px solid var(--brand-border);
  border-radius: 16px;
}

.activation-icon {
  width: 46px;
  height: 46px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-radius: 12px;
}

.activation-content {
  min-width: 0;
}

.activation-eyebrow {
  color: var(--brand-light);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

h2 {
  margin-top: 0.3rem;
  color: var(--text-primary);
  font-size: 1.15rem;
}

p {
  max-width: 720px;
  margin: 0.5rem 0 1rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  line-height: 1.6;
}

@media (max-width: 560px) {
  .activation-card {
    flex-direction: column;
  }
}
</style>

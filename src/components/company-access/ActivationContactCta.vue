<template>
  <div class="activation-cta">
    <a
      v-if="activationContactUrl"
      class="activation-button"
      :href="activationContactUrl"
      target="_blank"
      rel="noopener noreferrer"
    >
      Solicitar ativação
    </a>
    <button
      v-else
      type="button"
      class="activation-button"
      aria-describedby="activation-contact-feedback"
      @click="showMissingContactFeedback = true"
    >
      Solicitar ativação
    </button>
    <p
      v-if="showMissingContactFeedback"
      id="activation-contact-feedback"
      class="activation-feedback"
      role="status"
    >
      O canal de ativação ainda não está configurado.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { getActivationContactUrl } from '@/features/company-access/company-access.logic'

const activationContactUrl = getActivationContactUrl()
const showMissingContactFeedback = ref(false)
</script>

<style scoped>
.activation-cta {
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 0.625rem;
}

.activation-button {
  padding: 0.7rem 1.1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 10px;
  color: #fff;
  background: var(--gradient-brand);
  box-shadow: 0 4px 16px var(--brand-glow);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}

.activation-button:hover {
  opacity: 0.92;
}

.activation-feedback {
  color: #fbbf24;
  font-size: 0.78rem;
}
</style>

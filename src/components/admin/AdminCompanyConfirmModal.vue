<template>
  <div v-if="company && action" class="modal-backdrop" @click.self="requestClose">
    <section
      class="confirmation-modal"
      :class="{ 'destructive-modal': action.tone === 'destructive' }"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-company-confirmation-title"
      aria-describedby="admin-company-confirmation-description"
    >
      <div class="modal-heading">
        <span class="modal-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M3.34 17a2 2 0 0 0 1.73 3h13.86a2 2 0 0 0 1.73-3L13.73 5a2 2 0 0 0-3.46 0Z"/></svg>
        </span>
        <div>
          <h2 id="admin-company-confirmation-title">{{ action.confirmationTitle }}</h2>
          <p id="admin-company-confirmation-description">{{ action.confirmationDescription }}</p>
        </div>
      </div>

      <div class="company-summary">
        <span>Empresa</span>
        <strong>{{ company.displayName }}</strong>
      </div>

      <p v-if="error" class="action-error" role="alert">{{ error }}</p>

      <div class="modal-actions">
        <button type="button" class="btn-secondary" :disabled="loading" @click="requestClose">
          Voltar
        </button>
        <button
          ref="confirmButton"
          type="button"
          :class="confirmationButtonClass"
          :disabled="loading"
          @click="$emit('confirm')"
        >
          {{ loading ? 'Processando...' : action.label }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onUnmounted, ref, watch } from 'vue'
import type { AdminCompany } from '@/services/admin.service'
import type { AdminCompanyAction } from '@/features/admin/admin-companies.logic'

const props = defineProps<{
  company: AdminCompany | null
  action: AdminCompanyAction | null
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const confirmButton = ref<HTMLButtonElement | null>(null)
const confirmationButtonClass = computed(() => (
  props.action?.tone === 'destructive' ? 'btn-danger' : 'btn-primary'
))

function requestClose() {
  if (!props.loading) emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') requestClose()
}

watch(() => props.company, async (company, previousCompany) => {
  if (company && !previousCompany) {
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    confirmButton.value?.focus()
  } else if (!company && previousCompany) {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
}

.confirmation-modal {
  width: min(100%, 480px);
  padding: 1.5rem;
  background: var(--sidebar-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  box-shadow: var(--card-shadow);
}

.destructive-modal {
  border-color: rgba(248, 113, 113, 0.35);
}

.modal-heading {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.modal-icon {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  border-radius: 12px;
}

.destructive-modal .modal-icon {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
}

.modal-heading h2 {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.modal-heading p {
  margin-top: 0.4rem;
  color: var(--text-muted);
  font-size: 0.85rem;
  line-height: 1.55;
}

.company-summary {
  margin-top: 1.25rem;
  padding: 0.9rem 1rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
  border-radius: 10px;
}

.company-summary span {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.company-summary strong {
  color: var(--text-primary);
  font-size: 0.85rem;
  text-align: right;
}

.action-error {
  margin-top: 1rem;
  color: var(--error);
  font-size: 0.82rem;
}

.modal-actions {
  margin-top: 1.5rem;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.65rem 1rem;
  border-radius: 10px;
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  border: none;
  color: var(--text-on-brand);
  background: var(--gradient-brand);
}

.btn-secondary {
  color: var(--text-secondary);
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
}

.btn-danger {
  color: #fff;
  background: rgba(239, 68, 68, 0.75);
  border: 1px solid rgba(248, 113, 113, 0.4);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

button:focus-visible {
  outline: 2px solid var(--brand-light);
  outline-offset: 2px;
}

@media (max-width: 520px) {
  .modal-backdrop { padding: 0.75rem; }
  .confirmation-modal { padding: 1.25rem; }
  .modal-actions { flex-direction: column-reverse; }
}
</style>

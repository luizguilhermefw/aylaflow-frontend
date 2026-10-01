<template>
  <div v-if="open" class="modal-backdrop" @click.self="requestClose">
    <section
      class="confirmation-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="registration-link-rotation-title"
      aria-describedby="registration-link-rotation-description"
    >
      <div class="modal-heading">
        <span class="modal-icon" aria-hidden="true">
          <AppIcon name="warning" :size="24" />
        </span>
        <div>
          <h2 id="registration-link-rotation-title">Gerar um novo link?</h2>
          <p id="registration-link-rotation-description">
            O link e o QR Code atuais deixarão de funcionar. Materiais impressos ou links já
            compartilhados precisarão ser atualizados.
          </p>
        </div>
      </div>

      <p v-if="error" class="modal-error" role="alert">{{ error }}</p>

      <div class="modal-actions">
        <button ref="cancelButton" type="button" class="btn-secondary" :disabled="loading" @click="requestClose">
          Cancelar
        </button>
        <button type="button" class="btn-danger" :disabled="loading" @click="$emit('confirm')">
          {{ loading ? 'Gerando...' : 'Gerar novo link' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  open: boolean
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const cancelButton = ref<HTMLButtonElement | null>(null)

function requestClose() {
  if (!props.loading) emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') requestClose()
}

watch(() => props.open, async (open) => {
  if (open) {
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    cancelButton.value?.focus()
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 100; padding: 1.5rem; display: flex; align-items: center; justify-content: center; background: var(--overlay-bg); backdrop-filter: blur(4px); }
.confirmation-modal { width: min(100%, 540px); padding: 1.5rem; background: var(--sidebar-bg); border: 1px solid rgba(248,113,113,.3); border-radius: 18px; box-shadow: var(--card-shadow); }
.modal-heading { display: flex; align-items: flex-start; gap: 1rem; }
.modal-icon { width: 44px; height: 44px; flex-shrink: 0; display: grid; place-items: center; color: #f87171; background: rgba(239,68,68,.1); border-radius: 12px; }
.modal-heading h2 { color: var(--text-primary); font-size: 1.15rem; }
.modal-heading p { margin-top: .4rem; color: var(--text-muted); font-size: .85rem; line-height: 1.55; }
.modal-error { margin-top: 1rem; color: var(--error); font-size: .82rem; }
.modal-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; }
.btn-secondary, .btn-danger { padding: .65rem 1rem; border-radius: 10px; font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; }
.btn-secondary { color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--card-border); }
.btn-danger { color: #fff; background: rgba(239,68,68,.75); border: 1px solid rgba(248,113,113,.4); }
button:disabled { cursor: not-allowed; opacity: .55; }
@media (max-width: 520px) { .modal-backdrop { padding: .75rem; } .confirmation-modal { padding: 1.25rem; } .modal-actions { flex-direction: column-reverse; } }
</style>

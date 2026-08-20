<template>
  <div v-if="open" class="modal-backdrop" @click.self="requestClose">
    <section
      class="confirmation-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="opt-out-modal-title"
      aria-describedby="opt-out-modal-introduction opt-out-declaration"
    >
      <div class="modal-heading">
        <span class="modal-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 9v4"/><path d="M12 17h.01"/><path d="M3.34 17a2 2 0 0 0 1.73 3h13.86a2 2 0 0 0 1.73-3L13.73 5a2 2 0 0 0-3.46 0Z"/></svg>
        </span>
        <div>
          <h2 id="opt-out-modal-title">Desativar instrução de cancelamento</h2>
          <p id="opt-out-modal-introduction">
            Ao desativar esta opção, as mensagens poderão ser enviadas sem a instrução automática de cancelamento.
          </p>
        </div>
      </div>

      <div v-if="declaration" id="opt-out-declaration" class="declaration-card">
        <div class="declaration-meta">
          <span v-if="declaration.required">Declaração obrigatória</span>
          <span>Versão {{ declaration.version }}</span>
        </div>
        <p>{{ declaration.text }}</p>
      </div>
      <p v-else id="opt-out-declaration" class="declaration-unavailable" role="alert">
        A declaração de responsabilidade não está disponível. Recarregue a página antes de desativar esta opção.
      </p>

      <label class="acknowledgement">
        <input
          ref="acknowledgementInput"
          type="checkbox"
          :checked="acknowledged"
          :disabled="loading"
          @change="handleAcknowledgement"
        >
        <span>Li e estou ciente das condições acima.</span>
      </label>

      <p v-if="error" class="action-error" role="alert">{{ error }}</p>

      <div class="modal-actions">
        <button type="button" class="btn-secondary" :disabled="loading" @click="requestClose">
          Cancelar
        </button>
        <button
          type="button"
          class="btn-danger"
          :disabled="!canConfirm || loading"
          @click="$emit('confirm')"
        >
          {{ loading ? 'Salvando...' : 'Confirmar e desativar' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import type { OptOutInstructionsDeclaration } from '@/services/messaging-policy.service'

const props = defineProps<{
  open: boolean
  declaration: OptOutInstructionsDeclaration | null
  acknowledged: boolean
  canConfirm: boolean
  loading: boolean
  error: string
}>()

const emit = defineEmits<{
  close: []
  confirm: []
  acknowledge: [value: boolean]
}>()

const acknowledgementInput = ref<HTMLInputElement | null>(null)

function requestClose() {
  if (!props.loading) emit('close')
}

function handleAcknowledgement(event: Event) {
  emit('acknowledge', (event.target as HTMLInputElement).checked)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') requestClose()
}

watch(() => props.open, async (open) => {
  if (open) {
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    acknowledgementInput.value?.focus()
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 100; padding: 1.5rem; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.72); backdrop-filter: blur(4px); }
.confirmation-modal { width: min(100%, 560px); max-height: calc(100vh - 3rem); padding: 1.5rem; overflow-y: auto; background: var(--sidebar-bg); border: 1px solid rgba(248,113,113,.3); border-radius: 18px; box-shadow: var(--card-shadow); }
.modal-heading { display: flex; gap: 1rem; align-items: flex-start; }
.modal-icon { width: 44px; height: 44px; flex-shrink: 0; display: grid; place-items: center; color: #f87171; background: rgba(239,68,68,.1); border-radius: 12px; }
.modal-heading h2 { color: var(--text-primary); font-size: 1.15rem; }
.modal-heading p { margin-top: .4rem; color: var(--text-muted); font-size: .85rem; line-height: 1.55; }
.declaration-card { margin-top: 1.25rem; padding: 1rem; background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: 12px; }
.declaration-meta { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem; color: var(--brand-light); font-size: .68rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.declaration-card p { margin-top: .75rem; color: var(--text-secondary); font-size: .82rem; line-height: 1.6; }
.declaration-unavailable { margin-top: 1.25rem; padding: 1rem; color: var(--error); background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 12px; font-size: .82rem; line-height: 1.55; }
.acknowledgement { margin-top: 1.15rem; display: flex; align-items: flex-start; gap: .7rem; color: var(--text-secondary); font-size: .82rem; cursor: pointer; }
.acknowledgement input { width: 17px; height: 17px; margin-top: .1rem; flex-shrink: 0; accent-color: var(--brand); }
.action-error { margin-top: 1rem; color: var(--error); font-size: .82rem; }
.modal-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; }
.btn-secondary, .btn-danger { padding: .65rem 1rem; border-radius: 10px; font: inherit; font-size: .85rem; font-weight: 600; cursor: pointer; }
.btn-secondary { color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--card-border); }
.btn-danger { color: #fff; background: rgba(239,68,68,.75); border: 1px solid rgba(248,113,113,.4); }
button:disabled, input:disabled { cursor: not-allowed; opacity: .55; }
@media (max-width: 520px) { .modal-backdrop { padding: .75rem; } .confirmation-modal { max-height: calc(100vh - 1.5rem); padding: 1.25rem; } .modal-actions { flex-direction: column-reverse; } }
</style>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="requestClose">
    <section
      class="connection-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="whatsapp-connection-title"
      aria-describedby="whatsapp-connection-description"
    >
      <div class="modal-heading">
        <span class="modal-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
        </span>
        <div>
          <h2 id="whatsapp-connection-title">Reconectar WhatsApp</h2>
          <p id="whatsapp-connection-description">{{ channelLabel }}</p>
        </div>
      </div>

      <div
        v-if="!connected"
        class="connection-modes"
        role="tablist"
        aria-label="Forma de conexão"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'qr'"
          :class="{ active: mode === 'qr' }"
          :disabled="methodLocked"
          @click="$emit('change-mode', 'qr')"
        >
          QR Code
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="mode === 'pairing'"
          :class="{ active: mode === 'pairing' }"
          :disabled="methodLocked"
          @click="$emit('change-mode', 'pairing')"
        >
          Código de pareamento
        </button>
      </div>

      <div v-if="connected" class="modal-state connected-state" role="status" aria-live="polite">
        <span class="connected-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <h3>WhatsApp conectado</h3>
        <p>A conexão foi confirmada. O routing permanece inalterado.</p>
      </div>

      <template v-else-if="mode === 'qr'">
        <div v-if="qrLoading" class="modal-state" role="status" aria-live="polite">
          <span class="spinner" aria-hidden="true" />
          <p>Gerando QR Code...</p>
        </div>

        <div v-else-if="imageSource" class="qr-content">
          <img :src="imageSource" alt="QR Code para conectar o WhatsApp">
          <p>Abra o WhatsApp no aparelho que será conectado e leia este QR Code.</p>
          <span v-if="checkingConnection" class="checking-status" role="status">
            Aguardando confirmação da conexão...
          </span>
        </div>

        <div v-else class="qr-start">
          <p>Gere um QR Code quando estiver pronto para iniciar a conexão com o WhatsApp.</p>
          <p v-if="qrError" class="modal-error" role="alert">{{ qrError }}</p>
          <button type="button" class="btn-primary" @click="$emit('generate-qr')">
            Gerar QR Code
          </button>
        </div>
      </template>

      <template v-else>
        <div class="pairing-content">
          <p class="pairing-intro">
            Use esta opção se não puder ler o QR Code com a câmera.
          </p>

          <template v-if="pairingCode">
            <div class="pairing-code-card">
              <span>Código de pareamento</span>
              <code>{{ pairingCode }}</code>
              <button type="button" class="copy-button" @click="$emit('copy-code')">
                Copiar código
              </button>
            </div>

            <p v-if="copyMessage" class="copy-success" role="status">{{ copyMessage }}</p>
            <p v-if="copyError" class="modal-error" role="alert">{{ copyError }}</p>
            <p v-if="pairingError" class="modal-error" role="alert">{{ pairingError }}</p>

            <ol class="pairing-instructions">
              <li>Abra o WhatsApp no celular.</li>
              <li>Acesse <strong>Aparelhos conectados</strong>.</li>
              <li>Toque em <strong>Conectar um aparelho</strong>.</li>
              <li>Escolha <strong>Conectar com número de telefone</strong>.</li>
              <li>Digite o código exibido acima.</li>
            </ol>

            <span v-if="checkingConnection" class="checking-status pairing-checking" role="status">
              Aguardando confirmação da conexão...
            </span>
          </template>

          <form v-else class="pairing-form" @submit.prevent="$emit('generate-pairing')">
            <label for="whatsapp-pairing-phone">Número do WhatsApp</label>
            <input
              id="whatsapp-pairing-phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="(45) 99133-5359"
              :value="pairingPhone"
              :disabled="pairingLoading"
              :aria-invalid="Boolean(pairingError)"
              :aria-describedby="pairingError ? 'whatsapp-pairing-error' : undefined"
              @input="$emit('update:pairing-phone', ($event.target as HTMLInputElement).value)"
            >
            <p
              v-if="pairingError"
              id="whatsapp-pairing-error"
              class="modal-error"
              role="alert"
            >
              {{ pairingError }}
            </p>
            <button type="submit" class="btn-primary generate-button" :disabled="pairingLoading">
              <span v-if="pairingLoading" class="button-spinner" aria-hidden="true" />
              {{ pairingLoading ? 'Gerando código...' : 'Gerar código' }}
            </button>
          </form>
        </div>
      </template>

      <div class="modal-actions">
        <button ref="closeButton" type="button" class="btn-secondary" @click="requestClose">
          Fechar
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import type { WhatsappConnectionMode } from '@/features/whatsapp-channels/whatsapp-channel.logic'

const props = defineProps<{
  open: boolean
  channelLabel: string
  mode: WhatsappConnectionMode
  imageSource: string | null
  qrLoading: boolean
  qrError: string
  connected: boolean
  checkingConnection: boolean
  methodLocked: boolean
  pairingPhone: string
  pairingCode: string
  pairingLoading: boolean
  pairingError: string
  copyMessage: string
  copyError: string
}>()

const emit = defineEmits<{
  close: []
  'generate-qr': []
  'change-mode': [mode: WhatsappConnectionMode]
  'update:pairing-phone': [value: string]
  'generate-pairing': []
  'copy-code': []
}>()

const closeButton = ref<HTMLButtonElement | null>(null)

function requestClose() {
  emit('close')
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') requestClose()
}

watch(() => props.open, async (open) => {
  if (open) {
    window.addEventListener('keydown', handleKeydown)
    await nextTick()
    closeButton.value?.focus()
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 100; padding: 1.5rem; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.72); backdrop-filter: blur(4px); }
.connection-modal { width: min(100%, 560px); max-height: calc(100vh - 3rem); padding: 1.5rem; overflow-y: auto; background: var(--sidebar-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.modal-heading { display: flex; align-items: flex-start; gap: 1rem; }
.modal-icon { width: 44px; height: 44px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 12px; }
.modal-heading h2 { color: var(--text-primary); font-size: 1.15rem; }
.modal-heading p { margin-top: .35rem; color: var(--text-muted); font-size: .8rem; }
.connection-modes { margin-top: 1.25rem; padding: .25rem; display: grid; grid-template-columns: 1fr 1fr; background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: 11px; }
.connection-modes button { padding: .6rem .75rem; color: var(--text-muted); background: transparent; border: 0; border-radius: 8px; font: inherit; font-size: .76rem; font-weight: 600; cursor: pointer; }
.connection-modes button.active { color: var(--brand-light); background: var(--brand-subtle); box-shadow: inset 0 0 0 1px rgba(139,92,246,.25); }
.connection-modes button:disabled { cursor: not-allowed; opacity: .65; }
.modal-state { min-height: 240px; margin-top: 1.25rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.modal-state p { margin-top: .55rem; color: var(--text-muted); font-size: .8rem; }
.modal-state h3 { margin-top: .75rem; color: var(--text-primary); font-size: 1rem; }
.spinner { width: 30px; height: 30px; border: 3px solid var(--card-border); border-top-color: var(--brand); border-radius: 50%; animation: spin .75s linear infinite; }
.connected-icon { width: 54px; height: 54px; display: grid; place-items: center; color: var(--success); background: rgba(34,197,94,.1); border-radius: 15px; }
.qr-content { margin-top: 1.25rem; display: flex; flex-direction: column; align-items: center; text-align: center; }
.qr-content img { width: min(100%, 300px); aspect-ratio: 1; padding: .75rem; object-fit: contain; background: #fff; border-radius: 14px; }
.qr-content p { max-width: 390px; margin-top: 1rem; color: var(--text-secondary); font-size: .82rem; line-height: 1.55; }
.qr-start { min-height: 210px; margin-top: 1.25rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.qr-start > p:first-child { max-width: 390px; color: var(--text-secondary); font-size: .82rem; line-height: 1.55; }
.qr-start .btn-primary { margin-top: 1rem; }
.checking-status { margin-top: .75rem; color: var(--text-muted); font-size: .72rem; }
.pairing-content { margin-top: 1.25rem; }
.pairing-intro { color: var(--text-secondary); font-size: .8rem; line-height: 1.55; }
.pairing-form { margin-top: 1rem; display: grid; gap: .55rem; }
.pairing-form label { color: var(--text-secondary); font-size: .76rem; font-weight: 600; }
.pairing-form input { width: 100%; padding: .72rem .8rem; color: var(--text-primary); background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 10px; font: inherit; font-size: .84rem; outline: none; }
.pairing-form input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
.pairing-form input[aria-invalid='true'] { border-color: var(--error); }
.generate-button { margin-top: .35rem; justify-self: start; display: inline-flex; align-items: center; }
.pairing-code-card { margin-top: 1rem; padding: 1rem; display: grid; justify-items: center; gap: .75rem; background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: 13px; text-align: center; }
.pairing-code-card span { color: var(--text-muted); font-size: .7rem; font-weight: 600; text-transform: uppercase; letter-spacing: .05em; }
.pairing-code-card code { color: var(--text-primary); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: clamp(1.25rem, 5vw, 1.75rem); font-weight: 700; letter-spacing: .12em; overflow-wrap: anywhere; }
.copy-button { padding: .55rem .8rem; color: var(--brand-light); background: var(--brand-subtle); border: 1px solid rgba(139,92,246,.3); border-radius: 9px; font: inherit; font-size: .74rem; font-weight: 600; cursor: pointer; }
.copy-success { margin-top: .65rem; color: var(--success); font-size: .72rem; text-align: center; }
.pairing-instructions { margin: 1rem 0 0 1.25rem; color: var(--text-secondary); font-size: .77rem; line-height: 1.75; }
.pairing-checking { display: block; text-align: center; }
.modal-error { margin-top: .75rem; padding: .75rem .9rem; color: var(--error); background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 10px; font-size: .8rem; }
.modal-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; }
.btn-primary, .btn-secondary { padding: .65rem 1rem; border-radius: 10px; font: inherit; font-size: .82rem; font-weight: 600; cursor: pointer; }
.btn-primary { color: #fff; background: var(--gradient-brand); border: none; }
.btn-secondary { color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--card-border); }
.button-spinner { width: 14px; height: 14px; margin-right: .45rem; border: 2px solid rgba(255,255,255,.4); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
button:disabled, input:disabled { cursor: not-allowed; opacity: .55; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 520px) { .modal-backdrop { padding: .75rem; } .connection-modal { max-height: calc(100vh - 1.5rem); padding: 1.25rem; } .connection-modes { grid-template-columns: 1fr; } .modal-actions { flex-direction: column-reverse; } }
</style>

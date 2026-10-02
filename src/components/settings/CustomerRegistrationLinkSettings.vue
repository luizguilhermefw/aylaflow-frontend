<template>
  <section class="registration-link-section" aria-labelledby="registration-link-title">
    <div class="section-heading">
      <span class="section-icon" aria-hidden="true">
        <AppIcon name="qrCode" :size="24" />
      </span>
      <div>
        <h2 id="registration-link-title">Cadastro público</h2>
        <p>Gerencie o link usado por seus clientes para realizar o próprio cadastro.</p>
      </div>
    </div>

    <div v-if="state.successMessage" class="success-feedback" role="status" aria-live="polite">
      <AppIcon name="confirm" :size="18" />
      {{ state.successMessage }}
    </div>

    <div v-if="state.view === 'loading' || state.view === 'idle'" class="module-state" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando cadastro público...</p>
    </div>

    <div v-else-if="state.view === 'error'" class="module-state" role="alert">
      <AppIcon name="alert" :size="24" />
      <h3>Não foi possível carregar o cadastro público.</h3>
      <p>{{ state.loadError }}</p>
      <button type="button" class="btn-primary" @click="load">Tentar novamente</button>
    </div>

    <div v-else-if="state.view === 'not-created'" class="module-state empty-state">
      <AppIcon name="qrCode" :size="28" />
      <h3>Cadastro público</h3>
      <p>Crie um link para permitir que seus clientes façam o próprio cadastro.</p>
      <p v-if="state.actionError" class="action-error" role="alert">{{ state.actionError }}</p>
      <button
        type="button"
        class="btn-primary"
        :disabled="state.creating"
        @click="createLink"
      >
        <AppIcon v-if="!state.creating" name="add" :size="18" />
        {{ state.creating ? 'Criando link...' : 'Criar link de cadastro' }}
      </button>
    </div>

    <div v-else-if="state.link" class="link-management">
      <div class="status-row">
        <div>
          <span class="field-label">Status</span>
          <span class="status-badge" :class="state.link.active ? 'active' : 'inactive'">
            {{ state.link.active ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
        <button
          type="button"
          class="btn-secondary"
          :disabled="state.updatingStatus || state.rotating"
          @click="updateStatus(!state.link.active)"
        >
          {{ state.updatingStatus
            ? 'Salvando...'
            : state.link.active ? 'Desativar cadastro' : 'Ativar cadastro' }}
        </button>
      </div>

      <p v-if="!state.link.active" class="inactive-notice">
        O link continua existindo, mas novos cadastros estão temporariamente desabilitados.
      </p>

      <div v-if="state.loadingQr" class="qr-state" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true" />
        <p>Carregando link e QR Code...</p>
      </div>

      <div v-else-if="state.qrError" class="qr-state qr-error" role="alert">
        <AppIcon name="alert" :size="22" />
        <p>{{ state.qrError }}</p>
        <button type="button" class="btn-secondary" @click="loadQrCode">Tentar novamente</button>
      </div>

      <div v-else-if="state.qrCode" class="qr-content">
        <div class="public-link-block">
          <span class="field-label">Link público</span>
          <a
            class="public-url"
            :href="state.qrCode.publicUrl"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ state.qrCode.publicUrl }}
          </a>
          <div class="link-actions">
            <button
              type="button"
              class="btn-secondary"
              :disabled="state.rotating"
              @click="copyLink"
            >
              Copiar link
            </button>
            <a
              class="btn-secondary semantic-link"
              :href="state.qrCode.publicUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir cadastro
            </a>
            <button
              type="button"
              class="btn-secondary"
              :disabled="state.rotating"
              @click="downloadQrCode"
            >
              Baixar QR Code
            </button>
            <button
              type="button"
              class="btn-secondary"
              :disabled="state.rotating"
              @click="printQrCode"
            >
              Imprimir
            </button>
          </div>
          <p class="print-hint">Na janela de impressão você também pode salvar como PDF.</p>
          <p v-if="state.copyMessage" class="copy-feedback" role="status" aria-live="polite">
            {{ state.copyMessage }}
          </p>
        </div>

        <figure class="qr-figure">
          <span class="field-label">QR Code</span>
          <img :src="state.qrCode.qrCodeDataUrl" alt="QR Code para cadastro de clientes">
        </figure>
      </div>

      <p v-if="state.actionError" class="action-error" role="alert">{{ state.actionError }}</p>

      <div class="sensitive-actions">
        <div>
          <strong>Gerar novo link</strong>
          <p>O link e o QR Code atuais serão substituídos.</p>
        </div>
        <button
          type="button"
          class="btn-danger-outline"
          :disabled="state.rotating || state.updatingStatus"
          @click="requestRotation"
        >
          Gerar novo link
        </button>
      </div>
    </div>
  </section>

  <CustomerRegistrationLinkRotateModal
    :open="state.rotationModalOpen"
    :loading="state.rotating"
    :error="state.actionError"
    @close="controller.cancelRotation"
    @confirm="confirmRotation"
  />
</template>

<script setup lang="ts">
import { onMounted, reactive } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CustomerRegistrationLinkRotateModal from './CustomerRegistrationLinkRotateModal.vue'
import { customerRegistrationLinkService } from '@/services/customer-registration-link.service'
import {
  createCustomerRegistrationLinkController,
  emptyCustomerRegistrationLinkState,
} from '@/features/customer-registration-link/customer-registration-link.logic'

const props = defineProps<{
  role: string
}>()

const state = reactive(emptyCustomerRegistrationLinkState())
const controller = createCustomerRegistrationLinkController(
  customerRegistrationLinkService,
  state,
)

function load() {
  void controller.load(props.role)
}

function loadQrCode() {
  void controller.loadQrCode()
}

function createLink() {
  void controller.createLink(props.role)
}

function updateStatus(active: boolean) {
  void controller.updateStatus(active, props.role)
}

function requestRotation() {
  controller.requestRotation(props.role)
}

function confirmRotation() {
  void controller.confirmRotation(props.role)
}

function copyLink() {
  void controller.copyLink()
}

function downloadQrCode() {
  void controller.downloadQrCode()
}

function printQrCode() {
  void controller.printQrCode()
}

onMounted(load)
</script>

<style scoped>
.registration-link-section { padding: 1.5rem; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.section-heading { display: flex; align-items: flex-start; gap: 1rem; }
.section-icon { width: 48px; height: 48px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 13px; }
.section-heading h2 { color: var(--text-primary); font-size: 1.05rem; }
.section-heading p { margin-top: .35rem; color: var(--text-muted); font-size: .82rem; line-height: 1.55; }
.success-feedback { margin-top: 1rem; padding: .8rem 1rem; display: flex; align-items: center; gap: .6rem; color: var(--success); background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 11px; font-size: .82rem; }
.module-state, .qr-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.module-state { min-height: 210px; padding: 2rem 1rem; }
.module-state h3 { margin-top: .8rem; color: var(--text-primary); font-size: 1rem; }
.module-state p, .qr-state p { max-width: 480px; margin-top: .4rem; color: var(--text-muted); font-size: .8rem; line-height: 1.5; }
.module-state .btn-primary, .qr-state .btn-secondary { margin-top: 1rem; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--card-border); border-top-color: var(--brand); border-radius: 50%; animation: spin .75s linear infinite; }
.link-management { margin-top: 1.4rem; }
.status-row { padding: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; background: var(--bg-surface-secondary); border: 1px solid var(--card-border); border-radius: 12px; }
.status-row > div { display: flex; align-items: center; gap: .75rem; }
.field-label { display: block; color: var(--text-muted); font-size: .7rem; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
.status-badge { padding: .28rem .6rem; border-radius: 999px; font-size: .72rem; font-weight: 700; }
.status-badge.active { color: var(--success); background: rgba(34,197,94,.1); }
.status-badge.inactive { color: var(--warning); background: rgba(245,158,11,.1); }
.inactive-notice { margin-top: .75rem; padding: .75rem .9rem; color: var(--warning); background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.2); border-radius: 10px; font-size: .78rem; }
.qr-state { min-height: 240px; margin-top: 1rem; border: 1px dashed var(--card-border); border-radius: 12px; }
.qr-error { color: var(--error); }
.qr-content { margin-top: 1rem; display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, 230px); gap: 1rem; }
.public-link-block, .qr-figure { min-width: 0; padding: 1rem; background: var(--bg-surface-secondary); border: 1px solid var(--card-border); border-radius: 12px; }
.public-url { margin-top: .7rem; display: block; color: var(--brand-light); font-size: .82rem; overflow-wrap: anywhere; }
.link-actions { margin-top: 1rem; display: flex; flex-wrap: wrap; gap: .6rem; }
.copy-feedback { margin-top: .65rem; color: var(--success); font-size: .76rem; }
.print-hint { margin-top: .65rem; color: var(--text-muted); font-size: .73rem; }
.qr-figure img { width: 100%; max-width: 200px; height: auto; margin: .75rem auto 0; display: block; border-radius: 8px; }
.sensitive-actions { margin-top: 1rem; padding-top: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border-top: 1px solid var(--card-border); }
.sensitive-actions strong { color: var(--text-primary); font-size: .82rem; }
.sensitive-actions p { margin-top: .2rem; color: var(--text-muted); font-size: .75rem; }
.action-error { margin-top: 1rem; color: var(--error); font-size: .8rem; }
.btn-primary, .btn-secondary, .btn-danger-outline { min-height: 40px; padding: .6rem .9rem; display: inline-flex; align-items: center; justify-content: center; gap: .45rem; border-radius: 9px; font: inherit; font-size: .8rem; font-weight: 650; cursor: pointer; }
.btn-primary { color: var(--text-on-brand); background: var(--gradient-brand); border: 0; }
.btn-secondary { color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--card-border); }
.semantic-link { text-decoration: none; }
.btn-danger-outline { color: var(--error); background: transparent; border: 1px solid color-mix(in srgb, var(--error) 35%, transparent); }
button:disabled { cursor: not-allowed; opacity: .55; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 680px) { .registration-link-section { padding: 1.15rem; } .status-row, .sensitive-actions { align-items: stretch; flex-direction: column; } .qr-content { grid-template-columns: 1fr; } .link-actions { flex-direction: column; } .link-actions > * { width: 100%; } }
</style>

<template>
  <div v-if="customer" class="modal-backdrop" @click.self="requestClose">
    <article class="profile-modal" role="dialog" aria-modal="true" aria-labelledby="contact-profile-title">
      <div class="profile-header">
        <div class="profile-identity">
          <span class="avatar" aria-hidden="true">{{ initials }}</span>
          <div>
            <h2 id="contact-profile-title">{{ customer.name }}</h2>
            <p>{{ customer.phone }}</p>
          </div>
        </div>
        <button type="button" class="icon-button" aria-label="Fechar perfil" :disabled="actionLoading" @click="requestClose">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <section class="management-card" :class="`consent-${customer.contactConsentStatus.toLowerCase()}`" aria-label="Consentimento de contato">
        <div class="management-details">
          <div>
            <span class="detail-label">Consentimento</span>
            <strong>{{ CONSENT_LABELS[customer.contactConsentStatus] }}</strong>
          </div>
          <p v-if="customer.contactConsentStatus === 'GRANTED' && customer.consentGrantedAt">
            Concedido em {{ formatDate(customer.consentGrantedAt) }}
          </p>
          <p v-if="customer.optedOutAt">Bloqueado em {{ formatDate(customer.optedOutAt) }}</p>
        </div>
        <button type="button" class="management-button" :disabled="actionLoading" @click="requestConsentAction">
          {{ consentAction.label }}
        </button>
      </section>

      <section class="management-card" aria-label="Participação em automações e campanhas">
        <div class="management-details">
          <div>
            <span class="detail-label">Automações e campanhas</span>
            <strong :class="customer.isActiveForAutomation ? 'active-text' : 'inactive-text'">
              {{ customer.isActiveForAutomation ? 'Ativo' : 'Inativo' }}
            </strong>
          </div>
          <p>Esta configuração não altera o consentimento do contato.</p>
        </div>
        <button type="button" class="management-button" :disabled="actionLoading" @click="requestAutomationAction">
          {{ automationAction.label }}
        </button>
      </section>

      <p v-if="actionSuccess" class="action-success" role="status" aria-live="polite">
        {{ actionSuccess }}
      </p>

      <dl class="profile-grid">
        <div><dt>Gênero</dt><dd>{{ GENDER_LABELS[customer.gender] }}</dd></div>
        <div><dt>Cidade/UF</dt><dd>{{ formatLocation(customer) }}</dd></div>
        <div><dt>Data de nascimento</dt><dd>{{ formatDate(customer.birthDate) }}</dd></div>
        <div><dt>Última compra</dt><dd>{{ formatDate(customer.lastPurchaseDate) }}</dd></div>
        <div><dt>Cadastro</dt><dd>{{ formatDate(customer.createdAt) }}</dd></div>
      </dl>

      <section v-if="pendingAction" class="confirmation-card" aria-labelledby="contact-action-title">
        <h3 id="contact-action-title">Confirme esta alteração</h3>
        <p>{{ confirmationMessage }}</p>
        <p v-if="actionError" class="action-error" role="alert">{{ actionError }}</p>
        <div class="confirmation-actions">
          <button type="button" class="btn-secondary" :disabled="actionLoading" @click="cancelAction">Cancelar</button>
          <button
            type="button"
            :class="confirmationButtonClass"
            :disabled="actionLoading"
            @click="confirmAction"
          >
            <span v-if="actionLoading" class="button-spinner" aria-hidden="true" />
            {{ actionLoading ? 'Salvando...' : 'Confirmar alteração' }}
          </button>
        </div>
      </section>

      <div class="profile-actions">
        <button type="button" class="btn-secondary" :disabled="actionLoading" @click="requestClose">Fechar</button>
        <button type="button" class="btn-primary" :disabled="actionLoading" @click="$emit('edit', customer)">Editar contato</button>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import {
  automationActionFor,
  CONSENT_LABELS,
  consentActionFor,
  formatDate,
  formatLocation,
  GENDER_LABELS,
} from '@/features/contacts/contact.logic'
import type { Customer, ManagedContactConsentStatus } from '@/features/contacts/contact.types'

const props = defineProps<{
  customer: Customer | null
  actionLoading: boolean
  actionError: string
  actionSuccess: string
}>()

const emit = defineEmits<{
  close: []
  edit: [customer: Customer]
  'clear-action-error': []
  'update-consent': [status: ManagedContactConsentStatus]
  'toggle-automation': []
}>()

const pendingAction = ref<'consent' | 'automation' | null>(null)

const consentAction = computed(() => props.customer
  ? consentActionFor(props.customer)
  : consentActionFor({ contactConsentStatus: 'UNKNOWN' }))

const automationAction = computed(() => props.customer
  ? automationActionFor(props.customer)
  : automationActionFor({ isActiveForAutomation: true }))

const confirmationMessage = computed(() => pendingAction.value === 'consent'
  ? consentAction.value.confirmation
  : automationAction.value.confirmation)

const confirmationButtonClass = computed(() => {
  const tone = pendingAction.value === 'consent'
    ? consentAction.value.tone
    : automationAction.value.tone
  return tone === 'destructive' ? 'btn-danger' : 'btn-primary'
})

const initials = computed(() => props.customer?.name
  .split(/\s+/)
  .slice(0, 2)
  .map((part) => part.charAt(0).toUpperCase())
  .join('') ?? '')

watch(
  () => [props.customer?.contactConsentStatus, props.customer?.isActiveForAutomation],
  () => { pendingAction.value = null },
)

function requestClose() {
  if (!props.actionLoading) emit('close')
}

function requestConsentAction() {
  emit('clear-action-error')
  pendingAction.value = 'consent'
}

function requestAutomationAction() {
  emit('clear-action-error')
  pendingAction.value = 'automation'
}

function cancelAction() {
  if (props.actionLoading) return
  emit('clear-action-error')
  pendingAction.value = null
}

function confirmAction() {
  if (props.actionLoading) return
  if (pendingAction.value === 'consent') {
    emit('update-consent', consentAction.value.status)
    return
  }
  emit('toggle-automation')
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 100; padding: 1.5rem; display: flex; align-items: center; justify-content: center; overflow-y: auto; background: rgba(0,0,0,.72); backdrop-filter: blur(4px); }
.profile-modal { width: 100%; max-width: 620px; padding: 1.5rem; background: var(--sidebar-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.profile-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.profile-identity { display: flex; align-items: center; gap: 0.875rem; }
.avatar { width: 48px; height: 48px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 14px; font-weight: 800; }
.profile-identity h2 { color: var(--text-primary); font-size: 1.2rem; overflow-wrap: anywhere; }
.profile-identity p { margin-top: 0.2rem; color: var(--text-muted); font-size: 0.82rem; }
.icon-button { width: 36px; height: 36px; flex-shrink: 0; display: grid; place-items: center; border: none; border-radius: 9px; color: var(--text-muted); background: transparent; cursor: pointer; }
.icon-button:hover:not(:disabled) { color: var(--text-primary); background: var(--nav-hover); }
.icon-button:disabled { cursor: not-allowed; opacity: .55; }
.management-card { margin-top: 1rem; padding: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px solid var(--card-border); border-radius: 12px; background: var(--card-bg); }
.management-card:first-of-type { margin-top: 1.5rem; }
.management-details { min-width: 0; display: flex; flex-direction: column; gap: .25rem; }
.management-details > div { display: flex; flex-direction: column; }
.detail-label { color: var(--text-muted); font-size: 0.72rem; }
.management-card strong { margin-top: 0.15rem; font-size: 0.9rem; }
.management-card p { color: var(--text-muted); font-size: 0.75rem; }
.consent-granted strong { color: var(--success); }
.consent-unknown strong { color: #fbbf24; }
.consent-opted_out strong { color: var(--error); }
.active-text { color: var(--success); }
.inactive-text { color: var(--text-muted); }
.management-button { flex-shrink: 0; padding: .55rem .75rem; border: 1px solid var(--card-border); border-radius: 9px; color: var(--brand-light); background: var(--brand-subtle); font-size: .75rem; font-weight: 650; cursor: pointer; }
.management-button:hover:not(:disabled) { border-color: rgba(167,139,250,.35); background: rgba(124,58,237,.2); }
.management-button:disabled { cursor: not-allowed; opacity: .55; }
.action-success { margin-top: 1rem; padding: .75rem .875rem; color: var(--success); background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 10px; font-size: .78rem; }
.profile-grid { margin-top: 1.25rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem; }
.profile-grid div { min-width: 0; padding: 0.875rem; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; }
.profile-grid dt { color: var(--text-muted); font-size: 0.72rem; }
.profile-grid dd { margin-top: 0.25rem; color: var(--text-secondary); font-size: 0.85rem; overflow-wrap: anywhere; }
.confirmation-card { margin-top: 1.25rem; padding: 1rem; border: 1px solid rgba(248,113,113,.25); border-radius: 12px; background: rgba(239,68,68,.08); }
.confirmation-card h3 { color: var(--text-primary); font-size: .9rem; }
.confirmation-card > p { margin-top: .35rem; color: var(--text-secondary); font-size: .8rem; line-height: 1.5; }
.confirmation-card .action-error { color: var(--error); }
.confirmation-actions { margin-top: 1rem; display: flex; justify-content: flex-end; gap: .65rem; }
.profile-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-primary, .btn-secondary, .btn-danger { padding: 0.65rem 1rem; border-radius: 10px; font-size: 0.85rem; font-weight: 600; cursor: pointer; }
.btn-primary, .btn-danger { display: inline-flex; align-items: center; justify-content: center; }
.btn-primary { border: none; color: #fff; background: var(--gradient-brand); }
.btn-secondary { border: 1px solid var(--card-border); color: var(--text-secondary); background: transparent; }
.btn-danger { border: 1px solid rgba(248,113,113,.35); color: #fff; background: rgba(239,68,68,.7); }
.btn-primary:disabled, .btn-secondary:disabled, .btn-danger:disabled { cursor: not-allowed; opacity: .55; }
.button-spinner { width: 15px; height: 15px; margin-right: .45rem; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .modal-backdrop { padding: 0.75rem; align-items: flex-start; }
  .management-card { align-items: stretch; flex-direction: column; }
  .profile-grid { grid-template-columns: 1fr; }
  .confirmation-actions,
  .profile-actions { align-items: stretch; flex-direction: column-reverse; }
}
</style>

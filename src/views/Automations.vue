<template>
  <AppLayout
    title="Automações"
    subtitle="Gerencie os fluxos automáticos de relacionamento com seus clientes."
  >
    <template #actions>
      <button type="button" class="btn-primary topbar-action" @click="openCreateForm">
        <span aria-hidden="true">+</span>
        Nova automação
      </button>
    </template>

    <div v-if="state.successMessage" class="success-feedback" role="status" aria-live="polite">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      {{ state.successMessage }}
    </div>

    <section v-if="state.loading" class="state-card" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando suas automações...</p>
    </section>

    <section v-else-if="state.loadError" class="state-card error-state" role="alert">
      <span class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </span>
      <h2>Não foi possível carregar suas automações.</h2>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn-primary" @click="loadAutomations">Tentar novamente</button>
    </section>

    <section v-else-if="state.automations.length === 0" class="state-card">
      <span class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
      </span>
      <h2>Nenhuma automação recorrente disponível.</h2>
      <p>Crie uma automação para iniciar um fluxo recorrente de relacionamento.</p>
      <button type="button" class="btn-primary empty-action" @click="openCreateForm">Criar automação</button>
    </section>

    <section v-else class="automations-section" aria-labelledby="automations-heading">
      <div class="section-heading">
        <div>
          <h2 id="automations-heading">Automações recorrentes</h2>
          <p>{{ automationCountLabel }}</p>
        </div>
      </div>

      <div class="automation-grid">
        <article v-for="automation in state.automations" :key="automation.id" class="automation-card">
          <div class="card-heading">
            <span class="automation-icon" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            </span>
            <span class="status-badge" :class="automation.isActive ? 'active' : 'inactive'">
              <span class="status-dot" aria-hidden="true" />
              {{ automation.isActive ? 'Ativa' : 'Inativa' }}
            </span>
          </div>

          <div class="type-row">
            <span class="automation-type">{{ automationTypeLabel(automation) }}</span>
            <span v-if="automation.isSystem" class="system-badge">Padrão do sistema</span>
          </div>
          <h3>{{ automation.name }}</h3>
          <p class="automation-message">{{ automation.message || 'Mensagem não configurada.' }}</p>

          <dl class="automation-details">
            <div v-if="automation.daysAfter !== null">
              <dt>Execução após</dt>
              <dd>{{ automation.daysAfter }} {{ automation.daysAfter === 1 ? 'dia' : 'dias' }}</dd>
            </div>
            <div>
              <dt>Intervalo mínimo</dt>
              <dd>{{ automation.cooldownHours }} h</dd>
            </div>
            <div>
              <dt>Criada em</dt>
              <dd>{{ formatDate(automation.createdAt) }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <button
              v-if="canEditAutomation(automation)"
              type="button"
              class="card-button edit"
              :disabled="operationInProgress"
              @click="openEditForm(automation)"
            >
              Editar
            </button>
            <button
              type="button"
              class="card-button"
              :class="automation.isActive ? 'deactivate' : 'activate'"
              :disabled="operationInProgress"
              @click="openToggleAction(automation)"
            >
              {{ automation.isActive ? 'Desativar' : 'Ativar' }}
            </button>
            <button
              v-if="canDeleteAutomation(automation)"
              type="button"
              class="card-button delete"
              :disabled="operationInProgress"
              @click="openDeleteAction(automation)"
            >
              Excluir
            </button>
          </div>
        </article>
      </div>
    </section>
  </AppLayout>

  <AutomationFormModal
    :open="formOpen"
    :mode="formMode"
    :automation="editingAutomation"
    :saving="state.formSaving"
    :server-error="state.formError"
    @close="closeForm"
    @submit="saveAutomation"
  />

  <div v-if="state.actionAutomation" class="modal-backdrop" @click.self="controller.closeAction">
    <section class="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="toggle-title" aria-describedby="toggle-description">
      <h2 id="toggle-title">{{ toggleTitle }}</h2>
      <p id="toggle-description">{{ toggleDescription }}</p>
      <p v-if="state.actionError" class="action-error" role="alert">{{ state.actionError }}</p>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" :disabled="state.actionLoading" @click="controller.closeAction">Cancelar</button>
        <button ref="confirmButton" type="button" class="btn-primary" :disabled="state.actionLoading" @click="controller.confirmAction">
          <span v-if="state.actionLoading" class="button-spinner" aria-hidden="true" />
          {{ state.actionLoading ? 'Processando...' : toggleLabel }}
        </button>
      </div>
    </section>
  </div>

  <div v-if="state.deleteAutomation" class="modal-backdrop" @click.self="controller.closeDeleteAction">
    <section class="confirmation-modal" role="dialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-description">
      <h2 id="delete-title">Excluir automação?</h2>
      <p id="delete-description">
        A automação “{{ state.deleteAutomation.name }}” será excluída. Esta ação não pode ser desfeita.
      </p>
      <p v-if="state.deleteError" class="action-error" role="alert">{{ state.deleteError }}</p>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" :disabled="state.deleteLoading" @click="controller.closeDeleteAction">Cancelar</button>
        <button ref="deleteButton" type="button" class="btn-danger" :disabled="state.deleteLoading" @click="controller.confirmDelete">
          <span v-if="state.deleteLoading" class="button-spinner" aria-hidden="true" />
          {{ state.deleteLoading ? 'Excluindo...' : 'Excluir' }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import AutomationFormModal from '@/features/automations/AutomationFormModal.vue'
import { automationService, type Automation } from '@/services/automation.service'
import {
  automationTypeLabel,
  buildCreateAutomationPayload,
  canDeleteAutomation,
  canEditAutomation,
  createAutomationManagementController,
  emptyAutomationManagementState,
  type AutomationFormMode,
  type AutomationFormValues,
} from '@/features/automations/automation-management.logic'

const state = reactive(emptyAutomationManagementState())
const controller = createAutomationManagementController(automationService, state)
const confirmButton = ref<HTMLButtonElement | null>(null)
const deleteButton = ref<HTMLButtonElement | null>(null)
const formOpen = ref(false)
const formMode = ref<AutomationFormMode>('create')
const editingAutomation = ref<Automation | null>(null)

const automationCountLabel = computed(() => {
  const count = state.automations.length
  return `${count} ${count === 1 ? 'automação encontrada' : 'automações encontradas'}`
})
const operationInProgress = computed(() => (
  state.actionLoading || state.formSaving || state.deleteLoading
))
const toggleTitle = computed(() => (
  state.actionAutomation?.isActive ? 'Desativar automação?' : 'Ativar automação?'
))
const toggleDescription = computed(() => (
  state.actionAutomation?.isActive
    ? 'Esta automação deixará de executar até ser ativada novamente.'
    : 'Esta automação voltará a executar conforme sua configuração atual.'
))
const toggleLabel = computed(() => state.actionAutomation?.isActive ? 'Desativar' : 'Ativar')

function loadAutomations() {
  void controller.load()
}

function openCreateForm() {
  if (operationInProgress.value) return
  state.formError = ''
  editingAutomation.value = null
  formMode.value = 'create'
  formOpen.value = true
}

function openEditForm(automation: Automation) {
  if (operationInProgress.value || !canEditAutomation(automation)) return
  state.formError = ''
  editingAutomation.value = automation
  formMode.value = 'edit'
  formOpen.value = true
}

function closeForm() {
  if (state.formSaving) return
  formOpen.value = false
  editingAutomation.value = null
  state.formError = ''
}

async function saveAutomation(form: AutomationFormValues) {
  let saved = false
  if (formMode.value === 'create') {
    const payload = buildCreateAutomationPayload(form)
    if (!payload) return
    saved = await controller.createAutomation(payload)
  } else if (editingAutomation.value) {
    saved = await controller.updateAutomation(editingAutomation.value, form)
  }
  if (saved) closeForm()
}

async function openToggleAction(automation: Automation) {
  if (!controller.openToggleAction(automation)) return
  await nextTick()
  confirmButton.value?.focus()
}

async function openDeleteAction(automation: Automation) {
  if (!controller.openDeleteAction(automation)) return
  await nextTick()
  deleteButton.value?.focus()
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

onMounted(loadAutomations)
</script>

<style scoped>
.success-feedback { padding: .875rem 1rem; display: flex; align-items: center; gap: .625rem; color: var(--success); background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 12px; font-size: .875rem; font-weight: 500; }
.topbar-action { gap: .45rem; }
.state-card { min-height: 320px; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: 20px; }
.state-card h2 { margin-top: 1rem; color: var(--text-primary); font-size: 1.15rem; }
.state-card p { max-width: 420px; margin-top: .45rem; color: var(--text-muted); font-size: .84rem; line-height: 1.5; }
.state-icon { width: 58px; height: 58px; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 16px; }
.error-state .state-icon { color: var(--error); background: rgba(239,68,68,.1); }
.error-state .btn-primary, .empty-action { margin-top: 1.25rem; }
.spinner { width: 30px; height: 30px; border: 3px solid var(--card-border); border-top-color: var(--brand); border-radius: 50%; animation: spin .75s linear infinite; }
.section-heading { margin-bottom: 1rem; }
.section-heading h2 { color: var(--text-primary); font-size: 1.05rem; }
.section-heading p { margin-top: .25rem; color: var(--text-muted); font-size: .78rem; }
.automation-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 1rem; }
.automation-card { padding: 1.25rem; display: flex; flex-direction: column; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; box-shadow: var(--card-shadow); }
.card-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.automation-icon { width: 42px; height: 42px; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 12px; }
.status-badge { display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .55rem; border-radius: 999px; font-size: .68rem; font-weight: 700; }
.status-badge.active { color: #6ee7b7; background: rgba(16,185,129,.1); }
.status-badge.inactive { color: var(--text-muted); background: rgba(148,163,184,.1); }
.status-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }
.type-row { margin-top: 1rem; display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.automation-type { color: var(--brand-light); font-size: .68rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.system-badge { color: var(--text-muted); font-size: .65rem; }
.automation-card h3 { margin-top: .3rem; color: var(--text-primary); font-size: 1rem; }
.automation-message { min-height: 2.6rem; margin-top: .65rem; color: var(--text-secondary); font-size: .8rem; line-height: 1.55; }
.automation-details { margin-top: 1rem; display: grid; gap: .55rem; }
.automation-details div { padding-top: .55rem; display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid var(--card-border); }
.automation-details dt { color: var(--text-muted); font-size: .72rem; }
.automation-details dd { color: var(--text-secondary); font-size: .72rem; font-weight: 600; }
.card-actions { margin-top: 1.15rem; display: flex; flex-wrap: wrap; gap: .5rem; }
.card-button { flex: 1 1 auto; padding: .62rem .7rem; border-radius: 9px; font: inherit; font-size: .75rem; font-weight: 600; cursor: pointer; }
.card-button.edit { color: var(--text-secondary); background: transparent; border: 1px solid var(--card-border); }
.card-button.activate { color: var(--brand-light); background: var(--brand-subtle); border: 1px solid rgba(139,92,246,.3); }
.card-button.deactivate { color: #fdba74; background: rgba(249,115,22,.08); border: 1px solid rgba(251,146,60,.25); }
.card-button.delete { color: #fca5a5; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.24); }
.modal-backdrop { position: fixed; inset: 0; z-index: 100; padding: 1.5rem; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.72); backdrop-filter: blur(4px); }
.confirmation-modal { width: min(100%, 450px); padding: 1.5rem; background: var(--sidebar-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.confirmation-modal h2 { color: var(--text-primary); font-size: 1.15rem; }
.confirmation-modal > p { margin-top: .55rem; color: var(--text-muted); font-size: .84rem; line-height: 1.55; }
.confirmation-modal .action-error { color: var(--error); }
.modal-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; }
.btn-primary, .btn-secondary, .btn-danger { padding: .65rem 1rem; border-radius: 10px; font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer; }
.btn-primary, .btn-danger { display: inline-flex; align-items: center; justify-content: center; border: none; color: #fff; }
.btn-primary { background: var(--gradient-brand); }
.btn-danger { background: var(--error); }
.btn-secondary { color: var(--text-secondary); background: transparent; border: 1px solid var(--card-border); }
button:disabled { cursor: not-allowed; opacity: .55; }
button:focus-visible { outline: 2px solid var(--brand-light); outline-offset: 2px; }
.button-spinner { width: 15px; height: 15px; margin-right: .5rem; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 520px) { .modal-backdrop { padding: .75rem; } .modal-actions { flex-direction: column-reverse; } .topbar-action { width: 100%; } }
</style>

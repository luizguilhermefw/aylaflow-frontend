<template>
  <AppLayout title="Contatos" subtitle="Gerencie perfis, segmentação e consentimento dos seus clientes">
    <template #actions>
      <button type="button" class="btn-primary" @click="openCreateModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Novo contato
      </button>
      <button type="button" class="btn-secondary" @click="openImportModal">
        <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        Importar contatos
      </button>
      <button type="button" class="btn-secondary" :disabled="templateState.downloading" @click="downloadImportTemplate">
        <span v-if="templateState.downloading" class="button-spinner dark-spinner" aria-hidden="true" />
        <svg v-else xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        {{ templateState.downloading ? 'Baixando...' : 'Baixar modelo' }}
      </button>
    </template>

    <div v-if="successMessage" class="success-feedback" role="status" aria-live="polite">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      {{ successMessage }}
    </div>

    <div v-if="templateState.error" class="error-feedback" role="alert">
      {{ templateState.error }}
    </div>

    <ContactFilters
      :key="filtersResetKey"
      :loading="state.loading"
      @apply="applyFilters"
      @clear="clearFilters"
    />

    <section v-if="state.loading" class="state-card" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando contatos...</p>
    </section>

    <section v-else-if="state.loadError" class="state-card error-state" role="alert">
      <span class="state-icon error-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </span>
      <h2>Não foi possível carregar os contatos.</h2>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn-primary" @click="reloadCurrent()">Tentar novamente</button>
    </section>

    <section v-else-if="state.contacts.length === 0" class="state-card empty-state">
      <span class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      </span>
      <h2>{{ filtersApplied ? 'Nenhum contato encontrado.' : 'Você ainda não cadastrou contatos.' }}</h2>
      <p>{{ filtersApplied ? 'Ajuste ou limpe os filtros para ampliar os resultados.' : 'Cadastre seu primeiro contato para começar.' }}</p>
      <button v-if="filtersApplied" type="button" class="btn-secondary" @click="clearFilters">Limpar filtros</button>
      <button v-else type="button" class="btn-primary" @click="openCreateModal">Novo contato</button>
    </section>

    <section v-else class="contacts-section" aria-labelledby="contacts-list-title">
      <div class="list-heading">
        <div>
          <h2 id="contacts-list-title">Lista de contatos</h2>
          <p>{{ resultCountLabel }}</p>
        </div>
      </div>

      <div class="table-card">
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">Contato</th>
                <th scope="col">Cidade/UF</th>
                <th scope="col">Gênero</th>
                <th scope="col">Última compra</th>
                <th scope="col">Consentimento</th>
                <th scope="col">Status</th>
                <th scope="col"><span class="sr-only">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="customer in state.contacts" :key="customer.id">
                <td>
                  <button type="button" class="contact-link" @click="openProfile(customer)">
                    <strong>{{ customer.name }}</strong>
                    <span>{{ customer.phone }}</span>
                  </button>
                </td>
                <td>{{ formatLocation(customer) }}</td>
                <td>{{ GENDER_LABELS[customer.gender] }}</td>
                <td>{{ formatDate(customer.lastPurchaseDate) }}</td>
                <td>
                  <span class="badge consent-badge" :class="`consent-${customer.contactConsentStatus.toLowerCase()}`">
                    {{ CONSENT_LABELS[customer.contactConsentStatus] }}
                  </span>
                  <span v-if="customer.optedOutAt" class="opted-out-date">desde {{ formatDate(customer.optedOutAt) }}</span>
                </td>
                <td>
                  <span class="badge automation-badge" :class="customer.isActiveForAutomation ? 'active' : 'inactive'">
                    <span class="status-dot" aria-hidden="true" />
                    {{ customer.isActiveForAutomation ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td>
                  <div class="row-actions">
                    <button type="button" class="action-button" :aria-label="`Ver perfil de ${customer.name}`" @click="openProfile(customer)">Ver perfil</button>
                    <button type="button" class="action-button" :aria-label="`Editar ${customer.name}`" @click="openEditModal(customer)">Editar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <nav v-if="state.pagination && state.pagination.totalPages > 1" class="pagination" aria-label="Paginação de contatos">
          <button type="button" :disabled="state.pagination.page <= 1 || state.loading" @click="changePage(state.pagination.page - 1)">Anterior</button>
          <span>Página {{ state.pagination.page }} de {{ state.pagination.totalPages }}</span>
          <button type="button" :disabled="state.pagination.page >= state.pagination.totalPages || state.loading" @click="changePage(state.pagination.page + 1)">Próxima</button>
        </nav>
      </div>
    </section>
  </AppLayout>

  <ContactFormModal
    :open="formModalOpen"
    :mode="formMode"
    :customer="editingCustomer"
    :saving="state.saving"
    :server-error="state.saveError"
    @close="closeFormModal"
    @clear-error="state.saveError = ''"
    @submit="saveContact"
  />

  <ContactProfileModal
    :customer="selectedCustomer"
    :action-loading="state.actionLoading"
    :action-error="state.actionError"
    :action-success="actionSuccessMessage"
    @close="closeProfile"
    @edit="openEditFromProfile"
    @clear-action-error="clearActionFeedback"
    @update-consent="updateConsent"
    @toggle-automation="toggleAutomation"
  />

  <div v-if="importState.open" class="import-backdrop" @click.self="closeImportModal">
    <section class="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-modal-title">
      <header class="import-header">
        <div>
          <h2 id="import-modal-title">Importar contatos</h2>
          <p>Envie uma planilha para validação antes de confirmar a importação.</p>
        </div>
        <button type="button" class="modal-close" aria-label="Fechar importação" :disabled="importBusy" @click="closeImportModal">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </header>

      <input
        ref="importFileInput"
        class="sr-only"
        type="file"
        accept=".xlsx,.csv"
        :disabled="importState.stage === 'executing'"
        @change="selectImportFile"
      />

      <div class="import-consent-notice" role="note">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>
        <p>Ao importar contatos como consentidos, confirme que sua empresa possui autorização válida desses clientes para receber comunicações.</p>
      </div>

      <div v-if="!importState.file" class="file-drop-card">
        <span class="upload-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/></svg>
        </span>
        <h3>Selecione sua planilha</h3>
        <p>Arquivos XLSX ou CSV, com até 5 MB. Nenhum contato será criado antes da confirmação.</p>
        <button type="button" class="btn-primary" @click="chooseImportFile">Escolher arquivo</button>
      </div>

      <div v-else class="selected-file-card">
        <div class="file-details">
          <span class="file-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <div>
            <strong>{{ importState.file.name }}</strong>
            <span>{{ customerImportFileSize(importState.file) }}</span>
          </div>
        </div>
        <div class="file-actions">
          <button type="button" :disabled="importState.stage === 'executing'" @click="chooseImportFile">Trocar</button>
          <button type="button" :disabled="importState.stage === 'executing'" @click="removeImportFile">Remover</button>
        </div>
      </div>

      <p v-if="importState.error" class="import-error" role="alert">{{ importState.error }}</p>

      <div v-if="importState.stage === 'previewing'" class="import-loading" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true" />
        <p>Validando a planilha...</p>
      </div>

      <template v-if="importState.preview">
        <section class="import-summary" aria-labelledby="preview-summary-title">
          <h3 id="preview-summary-title">Resumo da validação</h3>
          <dl>
            <div><dt>Total</dt><dd>{{ importState.preview.summary.totalRows }}</dd></div>
            <div class="summary-new"><dt>Novos</dt><dd>{{ importState.preview.summary.new }}</dd></div>
            <div class="summary-existing"><dt>Já existentes</dt><dd>{{ importState.preview.summary.existing }}</dd></div>
            <div class="summary-invalid"><dt>Inválidos</dt><dd>{{ importState.preview.summary.invalid }}</dd></div>
            <div class="summary-duplicate"><dt>Duplicados</dt><dd>{{ importState.preview.summary.duplicateInFile }}</dd></div>
          </dl>
        </section>

        <section class="preview-section" aria-labelledby="preview-rows-title">
          <div class="preview-heading">
            <h3 id="preview-rows-title">Detalhamento das linhas</h3>
            <span>{{ importState.preview.rows.length }} linhas</span>
          </div>
          <div class="preview-table-scroll">
            <table class="preview-table">
              <thead>
                <tr>
                  <th scope="col">Linha</th>
                  <th scope="col">Nome</th>
                  <th scope="col">Telefone</th>
                  <th scope="col">Consentimento</th>
                  <th scope="col">Status</th>
                  <th scope="col">Detalhe</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in importState.preview.rows" :key="row.rowNumber">
                  <td>{{ row.rowNumber }}</td>
                  <td>{{ row.data.name || 'Não informado' }}</td>
                  <td>{{ row.data.phone || 'Não informado' }}</td>
                  <td>
                    <span class="badge consent-badge" :class="`consent-${row.data.contactConsentStatus.toLowerCase()}`">
                      {{ customerImportConsentLabel(row.data.contactConsentStatus) }}
                    </span>
                  </td>
                  <td>
                    <span class="import-status" :class="`import-${row.status.toLowerCase()}`">
                      {{ CUSTOMER_IMPORT_STATUS_LABELS[row.status] }}
                    </span>
                  </td>
                  <td class="row-message">{{ customerImportRowMessage(row) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </template>

      <section v-if="importState.result" class="import-result" role="status" aria-live="polite">
        <div class="result-heading">
          <span aria-hidden="true">✓</span>
          <div><h3>Importação concluída</h3><p>A lista de contatos foi atualizada.</p></div>
        </div>
        <dl>
          <div><dt>Importados</dt><dd>{{ importState.result.summary.imported }}</dd></div>
          <div><dt>Já existentes</dt><dd>{{ importState.result.summary.existing }}</dd></div>
          <div><dt>Inválidos</dt><dd>{{ importState.result.summary.invalid }}</dd></div>
          <div><dt>Duplicados</dt><dd>{{ importState.result.summary.duplicateInFile }}</dd></div>
        </dl>
      </section>

      <footer class="import-actions">
        <button type="button" class="btn-secondary" :disabled="importBusy" @click="closeImportModal">
          {{ importState.stage === 'success' ? 'Fechar' : 'Cancelar' }}
        </button>
        <button
          v-if="importState.stage !== 'success' && !importState.preview"
          type="button"
          class="btn-primary"
          :disabled="!importState.file || importState.stage === 'previewing'"
          @click="previewImport"
        >
          <span v-if="importState.stage === 'previewing'" class="button-spinner" aria-hidden="true" />
          {{ importState.stage === 'previewing' ? 'Validando...' : 'Validar arquivo' }}
        </button>
        <button
          v-else-if="importState.stage !== 'success'"
          type="button"
          class="btn-primary"
          :disabled="!canExecuteImport"
          @click="executeImport"
        >
          <span v-if="importState.stage === 'executing'" class="button-spinner" aria-hidden="true" />
          {{ importState.stage === 'executing' ? 'Importando...' : 'Confirmar importação' }}
        </button>
      </footer>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import ContactFilters from '@/components/contacts/ContactFilters.vue'
import ContactFormModal from '@/components/contacts/ContactFormModal.vue'
import ContactProfileModal from '@/components/contacts/ContactProfileModal.vue'
import {
  buildCustomerPayload,
  buildSearchFilters,
  canExecuteCustomerImport,
  CONSENT_LABELS,
  createCustomerImportController,
  createCustomerImportTemplateController,
  createContactsController,
  CUSTOMER_IMPORT_STATUS_LABELS,
  customerImportConsentLabel,
  customerImportFileSize,
  customerImportRowMessage,
  emptyCustomerImportState,
  emptyCustomerImportTemplateState,
  emptyContactsState,
  formatDate,
  formatLocation,
  GENDER_LABELS,
} from '@/features/contacts/contact.logic'
import type {
  ContactFilterValues,
  ContactFormValues,
  Customer,
  ManagedContactConsentStatus,
} from '@/features/contacts/contact.types'
import { customerService } from '@/services/customer.service'

const state = reactive({ ...emptyContactsState(), loading: true })
const contactsController = createContactsController(customerService, state)
const filtersApplied = ref(false)
const appliedFilters = ref<ContactFilterValues | null>(null)
const filtersResetKey = ref(0)
const formModalOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const editingCustomer = ref<Customer | null>(null)
const selectedCustomer = ref<Customer | null>(null)
const successMessage = ref('')
const actionSuccessMessage = ref('')
const importFileInput = ref<HTMLInputElement | null>(null)
const importState = reactive(emptyCustomerImportState())
const importController = createCustomerImportController(customerService, importState)
const templateState = reactive(emptyCustomerImportTemplateState())
const templateController = createCustomerImportTemplateController(customerService, templateState)

const resultCountLabel = computed(() => {
  const count = state.pagination?.total ?? state.contacts.length
  return `${count} ${count === 1 ? 'contato encontrado' : 'contatos encontrados'}`
})

const importBusy = computed(() => importState.stage === 'previewing' || importState.stage === 'executing')
const canExecuteImport = computed(() => canExecuteCustomerImport(importState))

async function reloadCurrent(page = state.pagination?.page ?? 1) {
  if (filtersApplied.value && appliedFilters.value) {
    await contactsController.load(buildSearchFilters(appliedFilters.value, page))
    return
  }
  await contactsController.load()
}

async function applyFilters(filters: ContactFilterValues) {
  successMessage.value = ''
  filtersApplied.value = true
  appliedFilters.value = { ...filters }
  await contactsController.load(buildSearchFilters(filters))
}

async function clearFilters() {
  successMessage.value = ''
  filtersApplied.value = false
  appliedFilters.value = null
  filtersResetKey.value += 1
  await contactsController.load()
}

async function changePage(page: number) {
  if (!appliedFilters.value) return
  await contactsController.load(buildSearchFilters(appliedFilters.value, page))
}

function openCreateModal() {
  successMessage.value = ''
  state.saveError = ''
  editingCustomer.value = null
  formMode.value = 'create'
  formModalOpen.value = true
}

function openEditModal(customer: Customer) {
  successMessage.value = ''
  state.saveError = ''
  editingCustomer.value = customer
  formMode.value = 'edit'
  formModalOpen.value = true
}

function openProfile(customer: Customer) {
  state.actionError = ''
  actionSuccessMessage.value = ''
  selectedCustomer.value = customer
}

function openEditFromProfile(customer: Customer) {
  selectedCustomer.value = null
  openEditModal(customer)
}

function closeProfile() {
  if (state.actionLoading) return
  selectedCustomer.value = null
  state.actionError = ''
  actionSuccessMessage.value = ''
}

function clearActionFeedback() {
  state.actionError = ''
  actionSuccessMessage.value = ''
}

function closeFormModal() {
  if (state.saving) return
  formModalOpen.value = false
  editingCustomer.value = null
  state.saveError = ''
}

async function saveContact(values: ContactFormValues) {
  const payload = buildCustomerPayload(values)
  const currentCustomer = editingCustomer.value
  const savedCustomer = currentCustomer
    ? await contactsController.update(currentCustomer.id, payload)
    : await contactsController.create(payload)

  if (!savedCustomer) return

  formModalOpen.value = false
  editingCustomer.value = null
  successMessage.value = currentCustomer
    ? `Contato “${savedCustomer.name}” atualizado com sucesso.`
    : `Contato “${savedCustomer.name}” criado com sucesso.`
  await reloadCurrent()
}

async function updateConsent(status: ManagedContactConsentStatus) {
  if (!selectedCustomer.value) return

  successMessage.value = ''
  const updatedCustomer = await contactsController.updateConsent(selectedCustomer.value.id, status)
  if (!updatedCustomer) return

  selectedCustomer.value = updatedCustomer
  actionSuccessMessage.value = status === 'GRANTED'
    ? `Consentimento de “${updatedCustomer.name}” registrado com sucesso.`
    : `Opt-out de “${updatedCustomer.name}” registrado com sucesso.`
  successMessage.value = actionSuccessMessage.value
}

async function toggleAutomation() {
  if (!selectedCustomer.value) return

  successMessage.value = ''
  const updatedCustomer = await contactsController.toggleAutomation(selectedCustomer.value.id)
  if (!updatedCustomer) return

  selectedCustomer.value = updatedCustomer
  actionSuccessMessage.value = updatedCustomer.isActiveForAutomation
    ? `Contato “${updatedCustomer.name}” ativado com sucesso.`
    : `Contato “${updatedCustomer.name}” desativado com sucesso.`
  successMessage.value = actionSuccessMessage.value
}

function openImportModal() {
  successMessage.value = ''
  importController.open()
}

function closeImportModal() {
  importController.close()
}

function chooseImportFile() {
  if (importState.stage === 'executing') return
  if (importFileInput.value) importFileInput.value.value = ''
  importFileInput.value?.click()
}

function selectImportFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) importController.selectFile(file)
}

function removeImportFile() {
  if (!importController.removeFile()) return
  if (importFileInput.value) importFileInput.value.value = ''
}

async function previewImport() {
  await importController.preview()
}

async function executeImport() {
  const result = await importController.execute(async () => {
    await reloadCurrent()
  })
  if (!result) return

  successMessage.value = `${result.summary.imported} ${result.summary.imported === 1 ? 'contato importado' : 'contatos importados'} com sucesso.`
}

async function downloadImportTemplate() {
  const template = await templateController.download()
  if (!template) return

  const objectUrl = URL.createObjectURL(template.blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = template.fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}

onMounted(() => reloadCurrent())
</script>

<style scoped>
.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.7rem 1rem;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary { border: none; color: #fff; background: var(--gradient-brand); box-shadow: 0 4px 16px var(--brand-glow); }
.btn-secondary { border: 1px solid var(--card-border); color: var(--text-secondary); background: transparent; }
.btn-primary:hover, .btn-secondary:hover { transform: translateY(-1px); }
.btn-secondary:hover { color: var(--text-primary); background: var(--nav-hover); }
.btn-primary:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: .55; transform: none; }

.success-feedback { padding: 0.875rem 1rem; display: flex; align-items: center; gap: 0.625rem; color: var(--success); background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 12px; font-size: 0.875rem; font-weight: 500; }
.error-feedback { padding: .875rem 1rem; color: var(--error); background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); border-radius: 12px; font-size: .85rem; }
.state-card { min-height: 300px; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: 20px; }
.state-card h2 { margin-top: 1rem; color: var(--text-primary); font-size: 1.1rem; }
.state-card p { max-width: 420px; margin: 0.5rem 0 1.5rem; color: var(--text-muted); font-size: 0.85rem; }
.state-icon { width: 60px; height: 60px; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 16px; }
.error-icon { color: var(--error); background: rgba(239,68,68,.1); }
.spinner { width: 30px; height: 30px; border: 3px solid rgba(167,139,250,.2); border-top-color: var(--brand-light); border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.contacts-section { display: flex; flex-direction: column; gap: 1rem; }
.list-heading h2 { color: var(--text-primary); font-size: 1.05rem; }
.list-heading p { margin-top: 0.25rem; color: var(--text-muted); font-size: 0.78rem; }
.table-card { overflow: hidden; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; }
.table-scroll { overflow-x: auto; }
table { width: 100%; min-width: 1020px; border-collapse: collapse; }
th { padding: 0.85rem 1rem; color: var(--text-muted); background: rgba(255,255,255,.025); border-bottom: 1px solid var(--card-border); font-size: 0.7rem; font-weight: 700; letter-spacing: .04em; text-align: left; text-transform: uppercase; }
td { padding: 0.95rem 1rem; color: var(--text-secondary); border-bottom: 1px solid var(--card-border); font-size: 0.8rem; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: rgba(255,255,255,.02); }
.contact-link { display: flex; flex-direction: column; align-items: flex-start; border: none; color: inherit; background: transparent; text-align: left; cursor: pointer; }
.contact-link strong { max-width: 220px; color: var(--text-primary); font-size: 0.85rem; overflow-wrap: anywhere; }
.contact-link span { margin-top: 0.15rem; color: var(--text-muted); font-size: 0.75rem; }
.badge { display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.28rem 0.58rem; border-radius: 999px; font-size: 0.7rem; font-weight: 650; white-space: nowrap; }
.consent-granted { color: var(--success); background: rgba(34,197,94,.12); }
.consent-unknown { color: #fbbf24; background: rgba(251,191,36,.1); }
.consent-opted_out { color: var(--error); background: rgba(239,68,68,.1); }
.automation-badge.active { color: var(--success); background: rgba(34,197,94,.1); }
.automation-badge.inactive { color: var(--text-muted); background: rgba(255,255,255,.06); }
.status-dot { width: 6px; height: 6px; background: currentColor; border-radius: 50%; }
.opted-out-date { margin-top: 0.3rem; display: block; color: var(--text-muted); font-size: 0.68rem; }
.row-actions { display: flex; gap: 0.4rem; }
.action-button { padding: 0.4rem 0.55rem; border: 1px solid var(--card-border); border-radius: 7px; color: var(--text-secondary); background: transparent; font-size: 0.72rem; font-weight: 600; cursor: pointer; white-space: nowrap; }
.action-button:hover { color: var(--brand-light); background: var(--brand-subtle); }
.pagination { padding: 0.85rem 1rem; display: flex; align-items: center; justify-content: flex-end; gap: 1rem; border-top: 1px solid var(--card-border); }
.pagination span { color: var(--text-muted); font-size: 0.75rem; }
.pagination button { padding: 0.45rem 0.65rem; border: 1px solid var(--card-border); border-radius: 8px; color: var(--text-secondary); background: transparent; font-size: 0.75rem; cursor: pointer; }
.pagination button:disabled { cursor: not-allowed; opacity: .45; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
.button-spinner { width: 15px; height: 15px; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
.dark-spinner { border-color: rgba(167,139,250,.25); border-top-color: var(--brand-light); }

.import-backdrop { position: fixed; inset: 0; z-index: 110; padding: 1.5rem; display: flex; align-items: center; justify-content: center; overflow-y: auto; background: rgba(0,0,0,.76); backdrop-filter: blur(4px); }
.import-modal { width: 100%; max-width: 920px; max-height: calc(100vh - 3rem); padding: 1.5rem; overflow-y: auto; background: var(--sidebar-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.import-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.import-header h2 { color: var(--text-primary); font-size: 1.2rem; }
.import-header p { margin-top: .35rem; color: var(--text-muted); font-size: .82rem; }
.modal-close { width: 36px; height: 36px; flex-shrink: 0; display: grid; place-items: center; border: none; border-radius: 9px; color: var(--text-muted); background: transparent; cursor: pointer; }
.modal-close:hover:not(:disabled) { color: var(--text-primary); background: var(--nav-hover); }
.modal-close:disabled { cursor: not-allowed; opacity: .5; }
.file-drop-card { margin-top: 1.5rem; padding: 2rem; display: flex; flex-direction: column; align-items: center; text-align: center; border: 1px dashed rgba(167,139,250,.35); border-radius: 14px; background: var(--brand-subtle); }
.import-consent-notice { margin-top: 1.25rem; padding: .8rem .9rem; display: flex; align-items: flex-start; gap: .65rem; color: var(--brand-light); background: var(--brand-subtle); border: 1px solid rgba(167,139,250,.2); border-radius: 10px; }
.import-consent-notice svg { flex-shrink: 0; margin-top: .05rem; }
.import-consent-notice p { color: var(--text-secondary); font-size: .76rem; line-height: 1.5; }
.upload-icon { width: 54px; height: 54px; display: grid; place-items: center; color: var(--brand-light); background: rgba(124,58,237,.18); border-radius: 14px; }
.file-drop-card h3 { margin-top: .9rem; color: var(--text-primary); font-size: 1rem; }
.file-drop-card p { max-width: 470px; margin: .4rem 0 1.15rem; color: var(--text-muted); font-size: .78rem; }
.selected-file-card { margin-top: 1.5rem; padding: 1rem; display: flex; align-items: center; justify-content: space-between; gap: 1rem; border: 1px solid var(--card-border); border-radius: 12px; background: var(--card-bg); }
.file-details { min-width: 0; display: flex; align-items: center; gap: .75rem; }
.file-icon { width: 42px; height: 42px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 10px; }
.file-details div { min-width: 0; display: flex; flex-direction: column; }
.file-details strong { color: var(--text-primary); font-size: .85rem; overflow-wrap: anywhere; }
.file-details span { margin-top: .15rem; color: var(--text-muted); font-size: .72rem; }
.file-actions { flex-shrink: 0; display: flex; gap: .4rem; }
.file-actions button { padding: .45rem .6rem; border: 1px solid var(--card-border); border-radius: 8px; color: var(--text-secondary); background: transparent; font-size: .72rem; font-weight: 600; cursor: pointer; }
.file-actions button:hover:not(:disabled) { color: var(--brand-light); background: var(--brand-subtle); }
.file-actions button:disabled { cursor: not-allowed; opacity: .5; }
.import-error { margin-top: 1rem; padding: .75rem .875rem; color: var(--error); background: rgba(239,68,68,.1); border: 1px solid rgba(239,68,68,.25); border-radius: 10px; font-size: .78rem; }
.import-loading { min-height: 130px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.import-loading p { margin-top: .75rem; color: var(--text-muted); font-size: .8rem; }
.import-summary { margin-top: 1.25rem; }
.import-summary h3, .preview-heading h3 { color: var(--text-primary); font-size: .9rem; }
.import-summary dl { margin-top: .75rem; display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: .65rem; }
.import-summary dl div { padding: .75rem; border: 1px solid var(--card-border); border-radius: 10px; background: var(--card-bg); }
.import-summary dt { color: var(--text-muted); font-size: .68rem; }
.import-summary dd { margin-top: .15rem; color: var(--text-primary); font-size: 1.1rem; font-weight: 800; }
.import-summary .summary-new dd { color: var(--success); }
.import-summary .summary-existing dd { color: #60a5fa; }
.import-summary .summary-invalid dd { color: var(--error); }
.import-summary .summary-duplicate dd { color: #fbbf24; }
.preview-section { margin-top: 1.25rem; }
.preview-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.preview-heading span { color: var(--text-muted); font-size: .72rem; }
.preview-table-scroll { max-height: 310px; margin-top: .65rem; overflow: auto; border: 1px solid var(--card-border); border-radius: 11px; }
table.preview-table { min-width: 780px; }
.preview-table th { position: sticky; top: 0; z-index: 1; background: #181820; }
.preview-table td { padding: .75rem; font-size: .74rem; }
.preview-table .row-message { min-width: 220px; color: var(--text-muted); }
.import-status { display: inline-flex; padding: .26rem .55rem; border-radius: 999px; font-size: .67rem; font-weight: 700; white-space: nowrap; }
.import-new { color: var(--success); background: rgba(34,197,94,.1); }
.import-existing { color: #60a5fa; background: rgba(96,165,250,.1); }
.import-invalid { color: var(--error); background: rgba(239,68,68,.1); }
.import-duplicate_in_file { color: #fbbf24; background: rgba(251,191,36,.1); }
.import-result { margin-top: 1.25rem; padding: 1rem; border: 1px solid rgba(34,197,94,.25); border-radius: 12px; background: rgba(34,197,94,.08); }
.result-heading { display: flex; align-items: center; gap: .7rem; }
.result-heading > span { width: 36px; height: 36px; flex-shrink: 0; display: grid; place-items: center; color: var(--success); background: rgba(34,197,94,.12); border-radius: 10px; font-weight: 800; }
.result-heading h3 { color: var(--success); font-size: .9rem; }
.result-heading p { color: var(--text-muted); font-size: .72rem; }
.import-result dl { margin-top: .85rem; display: grid; grid-template-columns: repeat(4,minmax(0,1fr)); gap: .6rem; }
.import-result dl div { padding: .6rem; border-radius: 8px; background: rgba(255,255,255,.035); }
.import-result dt { color: var(--text-muted); font-size: .65rem; }
.import-result dd { margin-top: .15rem; color: var(--text-primary); font-size: 1rem; font-weight: 800; }
.import-actions { margin-top: 1.5rem; display: flex; justify-content: flex-end; gap: .75rem; }

@media (max-width: 720px) {
  .pagination { justify-content: space-between; }
  .import-backdrop { padding: .75rem; align-items: flex-start; }
  .import-modal { max-height: calc(100vh - 1.5rem); padding: 1.15rem; }
  .selected-file-card { align-items: stretch; flex-direction: column; }
  .file-actions button { flex: 1; }
  .import-summary dl { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .import-result dl { grid-template-columns: repeat(2,minmax(0,1fr)); }
  .import-actions { align-items: stretch; flex-direction: column-reverse; }
}
</style>

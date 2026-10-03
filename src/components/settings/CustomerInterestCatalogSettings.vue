<template>
  <section class="catalog-section" aria-labelledby="interest-catalog-title">
    <header class="section-heading">
      <span class="section-icon" aria-hidden="true"><AppIcon name="settings" :size="24" /></span>
      <div>
        <h2 id="interest-catalog-title">Interesses dos clientes</h2>
        <p>Configure as categorias e marcas que podem ser selecionadas no cadastro público.</p>
      </div>
    </header>

    <div v-if="state.successMessage" class="success-feedback" role="status" aria-live="polite">
      <AppIcon name="confirm" :size="18" />
      {{ state.successMessage }}
    </div>

    <div v-if="state.view === 'idle' || state.view === 'loading'" class="module-state" role="status">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando interesses...</p>
    </div>

    <div v-else-if="state.view === 'error'" class="module-state" role="alert">
      <AppIcon name="alert" :size="24" />
      <h3>Não foi possível carregar os interesses.</h3>
      <p>{{ state.loadError }}</p>
      <button type="button" class="btn-primary" @click="load">Tentar novamente</button>
    </div>

    <div v-else class="catalog-groups">
      <section
        v-for="group in groups"
        :key="group.type"
        class="catalog-group"
        :aria-labelledby="`interest-group-${group.type.toLowerCase()}`"
      >
        <div class="group-heading">
          <div>
            <h3 :id="`interest-group-${group.type.toLowerCase()}`">{{ group.title }}</h3>
            <p>{{ group.description }}</p>
          </div>
          <button type="button" class="btn-primary" @click="openCreate(group.type)">
            <AppIcon name="add" :size="17" />
            {{ group.createLabel }}
          </button>
        </div>

        <p v-if="!group.options.length" class="empty-group">{{ group.emptyLabel }}</p>
        <ul v-else class="option-list">
          <li v-for="option in group.options" :key="option.id" :class="{ inactive: !option.active }">
            <div class="option-identity">
              <strong>{{ option.name }}</strong>
              <span class="status-badge" :class="option.active ? 'active' : 'inactive'">
                {{ option.active ? 'Ativo' : 'Inativo' }}
              </span>
            </div>
            <div class="option-actions">
              <button type="button" class="btn-secondary" @click="openEdit(option)">
                <AppIcon name="edit" :size="16" /> Editar
              </button>
              <button
                type="button"
                class="btn-secondary"
                :class="{ danger: option.active }"
                :disabled="state.pendingOptionId !== null"
                @click="requestStatusChange(option)"
              >
                {{ state.pendingOptionId === option.id
                  ? 'Salvando...'
                  : option.active ? 'Desativar' : 'Ativar' }}
              </button>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <p v-if="state.actionError && !modalOpen" class="action-error" role="alert">
      {{ state.actionError }}
    </p>
  </section>

  <div v-if="modalOpen" class="modal-backdrop" @click.self="closeModal">
    <section
      class="catalog-modal"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="statusTarget ? 'catalog-status-modal-title' : 'catalog-form-modal-title'"
    >
      <template v-if="statusTarget">
        <h2 id="catalog-status-modal-title">
          {{ statusTarget.active ? 'Desativar opção?' : 'Ativar opção?' }}
        </h2>
        <p>
          {{ statusTarget.active
            ? 'A opção deixará de aparecer em novos cadastros públicos.'
            : 'A opção voltará a ficar disponível em novos cadastros públicos.' }}
        </p>
      </template>

      <template v-else>
        <h2 id="catalog-form-modal-title">{{ formTitle }}</h2>
        <label for="interest-option-name">Nome</label>
        <input
          id="interest-option-name"
          ref="nameInput"
          v-model="formName"
          type="text"
          autocomplete="off"
          :disabled="state.saving"
          :aria-invalid="state.actionError ? 'true' : undefined"
          :aria-describedby="state.actionError ? 'catalog-modal-error' : undefined"
          @keydown.enter.prevent="submitForm"
        >
      </template>

      <p v-if="state.actionError" id="catalog-modal-error" class="action-error" role="alert">
        {{ state.actionError }}
      </p>

      <div class="modal-actions">
        <button type="button" class="btn-secondary" :disabled="modalBusy" @click="closeModal">
          Cancelar
        </button>
        <button
          type="button"
          :class="statusTarget?.active ? 'btn-danger' : 'btn-primary'"
          :disabled="modalBusy"
          @click="statusTarget ? confirmStatusChange() : submitForm()"
        >
          {{ modalBusy ? 'Salvando...' : modalActionLabel }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { customerInterestCatalogService } from '@/services/customer-interest-catalog.service'
import {
  createCustomerInterestCatalogController,
  customerInterestOptionsByType,
  emptyCustomerInterestCatalogState,
} from '@/features/customer-interest-catalog/customer-interest-catalog.logic'
import type {
  CustomerInterestOption,
  CustomerInterestType,
} from '@/features/customer-interest-catalog/customer-interest-catalog.repository'

const props = defineProps<{ role: string }>()
const state = reactive(emptyCustomerInterestCatalogState())
const controller = createCustomerInterestCatalogController(customerInterestCatalogService, state)
const formMode = ref<'create' | 'edit'>('create')
const formType = ref<CustomerInterestType>('CATEGORY')
const formName = ref('')
const editingOption = ref<CustomerInterestOption | null>(null)
const statusTarget = ref<CustomerInterestOption | null>(null)
const modalOpen = ref(false)
const nameInput = ref<HTMLInputElement | null>(null)

const groups = computed(() => [
  {
    type: 'CATEGORY' as const,
    title: 'Categorias',
    description: 'Tipos de produtos ou serviços de interesse.',
    createLabel: 'Nova categoria',
    emptyLabel: 'Nenhuma categoria cadastrada.',
    options: customerInterestOptionsByType(state.options, 'CATEGORY'),
  },
  {
    type: 'BRAND' as const,
    title: 'Marcas',
    description: 'Marcas que seus clientes podem selecionar.',
    createLabel: 'Nova marca',
    emptyLabel: 'Nenhuma marca cadastrada.',
    options: customerInterestOptionsByType(state.options, 'BRAND'),
  },
])

const modalBusy = computed(() => state.saving || state.pendingOptionId !== null)
const formTitle = computed(() => {
  if (formMode.value === 'edit') return formType.value === 'CATEGORY' ? 'Editar categoria' : 'Editar marca'
  return formType.value === 'CATEGORY' ? 'Nova categoria' : 'Nova marca'
})
const modalActionLabel = computed(() => {
  if (statusTarget.value) return statusTarget.value.active ? 'Desativar' : 'Ativar'
  return formMode.value === 'edit' ? 'Salvar alterações' : 'Criar'
})

function load() {
  void controller.load(props.role)
}

async function showModal() {
  modalOpen.value = true
  await nextTick()
  nameInput.value?.focus()
}

function openCreate(type: CustomerInterestType) {
  state.actionError = ''
  formMode.value = 'create'
  formType.value = type
  formName.value = ''
  editingOption.value = null
  statusTarget.value = null
  void showModal()
}

function openEdit(option: CustomerInterestOption) {
  state.actionError = ''
  formMode.value = 'edit'
  formType.value = option.type
  formName.value = option.name
  editingOption.value = option
  statusTarget.value = null
  void showModal()
}

function requestStatusChange(option: CustomerInterestOption) {
  state.actionError = ''
  statusTarget.value = option
  editingOption.value = null
  modalOpen.value = true
}

function closeModal() {
  if (modalBusy.value) return
  modalOpen.value = false
  statusTarget.value = null
  editingOption.value = null
  state.actionError = ''
}

async function submitForm() {
  const saved = editingOption.value
    ? await controller.update(editingOption.value, formName.value, props.role)
    : await controller.create(formType.value, formName.value, props.role)
  if (saved) closeModal()
}

async function confirmStatusChange() {
  const option = statusTarget.value
  if (!option) return
  const saved = await controller.updateStatus(option, !option.active, props.role)
  if (saved) closeModal()
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && modalOpen.value) closeModal()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  load()
})
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<style scoped>
.catalog-section { padding: 1.5rem; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.section-heading { display: flex; align-items: flex-start; gap: 1rem; }
.section-icon { width: 48px; height: 48px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 13px; }
.section-heading h2, .group-heading h3, .catalog-modal h2 { color: var(--text-primary); }
.section-heading h2 { font-size: 1.05rem; }
.section-heading p, .group-heading p, .catalog-modal p { margin-top: .35rem; color: var(--text-muted); font-size: .82rem; line-height: 1.55; }
.success-feedback { margin-top: 1rem; padding: .8rem 1rem; display: flex; align-items: center; gap: .6rem; color: var(--success); background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 11px; font-size: .82rem; }
.module-state { min-height: 180px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; }
.module-state h3 { margin-top: .7rem; color: var(--text-primary); font-size: 1rem; }
.module-state p { margin-top: .4rem; color: var(--text-muted); font-size: .8rem; }
.module-state .btn-primary { margin-top: 1rem; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--card-border); border-top-color: var(--brand); border-radius: 50%; animation: spin .75s linear infinite; }
.catalog-groups { margin-top: 1.4rem; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.catalog-group { min-width: 0; padding: 1rem; background: var(--bg-surface-secondary); border: 1px solid var(--card-border); border-radius: 13px; }
.group-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.group-heading h3 { font-size: .95rem; }
.option-list { margin: 1rem 0 0; padding: 0; display: grid; gap: .6rem; list-style: none; }
.option-list li { padding: .8rem; display: flex; align-items: center; justify-content: space-between; gap: .75rem; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 10px; }
.option-list li.inactive strong { color: var(--text-muted); }
.option-identity { min-width: 0; display: flex; align-items: center; gap: .6rem; }
.option-identity strong { color: var(--text-primary); font-size: .82rem; overflow-wrap: anywhere; }
.status-badge { padding: .25rem .55rem; border-radius: 999px; font-size: .68rem; font-weight: 700; }
.status-badge.active { color: var(--success); background: rgba(34,197,94,.1); }
.status-badge.inactive { color: var(--warning); background: rgba(245,158,11,.1); }
.option-actions { display: flex; gap: .45rem; }
.empty-group { margin-top: 1rem; padding: 1.25rem; color: var(--text-muted); text-align: center; border: 1px dashed var(--card-border); border-radius: 10px; font-size: .8rem; }
.btn-primary, .btn-secondary, .btn-danger { min-height: 38px; padding: .55rem .8rem; display: inline-flex; align-items: center; justify-content: center; gap: .4rem; border-radius: 9px; font: inherit; font-size: .78rem; font-weight: 650; cursor: pointer; }
.btn-primary { color: var(--text-on-brand); background: var(--gradient-brand); border: 0; }
.btn-secondary { color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--card-border); }
.btn-secondary.danger, .btn-danger { color: #fff; background: rgba(239,68,68,.78); border: 1px solid rgba(248,113,113,.35); }
button:disabled { cursor: not-allowed; opacity: .55; }
.action-error { margin-top: 1rem; color: var(--error); font-size: .8rem; }
.modal-backdrop { position: fixed; inset: 0; z-index: 100; padding: 1rem; display: flex; align-items: center; justify-content: center; background: var(--overlay-bg); backdrop-filter: blur(4px); }
.catalog-modal { width: min(100%, 480px); padding: 1.5rem; background: var(--sidebar-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.catalog-modal h2 { font-size: 1.1rem; }
.catalog-modal label { margin-top: 1.2rem; display: block; color: var(--text-secondary); font-size: .78rem; font-weight: 700; }
.catalog-modal input { width: 100%; margin-top: .45rem; padding: .72rem .8rem; color: var(--text-primary); background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 9px; font: inherit; }
.catalog-modal input:focus { outline: 2px solid var(--brand-light); outline-offset: 1px; }
.catalog-modal input[aria-invalid='true'] { border-color: var(--error); }
.modal-actions { margin-top: 1.4rem; display: flex; justify-content: flex-end; gap: .65rem; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 900px) { .catalog-groups { grid-template-columns: 1fr; } }
@media (max-width: 600px) { .catalog-section { padding: 1.15rem; } .group-heading, .option-list li { align-items: stretch; flex-direction: column; } .group-heading .btn-primary, .option-actions > * { flex: 1; } .option-actions { flex-wrap: wrap; } .modal-actions { flex-direction: column-reverse; } }
</style>

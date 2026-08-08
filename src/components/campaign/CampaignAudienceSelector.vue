<template>
  <div class="audience-selector">
    <div class="audience-options" role="radiogroup" aria-label="Tipo de público">
      <button
        type="button"
        class="audience-option"
        :class="{ selected: audienceType === 'ALL_ELIGIBLE' }"
        role="radio"
        :aria-checked="audienceType === 'ALL_ELIGIBLE'"
        :disabled="disabled"
        @click="selectAudienceType('ALL_ELIGIBLE')"
      >
        <span class="option-indicator" aria-hidden="true">
          <svg v-if="audienceType === 'ALL_ELIGIBLE'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <span>
          <strong>Todos os clientes elegíveis</strong>
          <small>O backend aplicará as regras finais de elegibilidade.</small>
        </span>
      </button>

      <button
        type="button"
        class="audience-option"
        :class="{ selected: audienceType === 'CUSTOMER_IDS' }"
        role="radio"
        :aria-checked="audienceType === 'CUSTOMER_IDS'"
        :disabled="disabled"
        @click="selectAudienceType('CUSTOMER_IDS')"
      >
        <span class="option-indicator" aria-hidden="true">
          <svg v-if="audienceType === 'CUSTOMER_IDS'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <span>
          <strong>Selecionar clientes</strong>
          <small>Escolha individualmente quem será incluído.</small>
        </span>
      </button>
    </div>

    <div v-if="audienceType === 'CUSTOMER_IDS'" class="customer-selector">
      <div v-if="loading" class="selector-state" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true" />
        <p>Carregando clientes...</p>
      </div>

      <div v-else-if="error" class="selector-state error-state" role="alert">
        <p>Não foi possível carregar os clientes.</p>
        <button type="button" class="retry-button" :disabled="disabled" @click="$emit('retry')">
          Tentar novamente
        </button>
      </div>

      <template v-else>
        <div v-if="eligibleCustomers.length > 0" class="customer-toolbar">
          <div class="search-field">
            <label for="customer-search">Buscar clientes</label>
            <div class="search-input-wrapper">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
              <input
                id="customer-search"
                v-model="search"
                type="search"
                placeholder="Nome ou telefone"
                autocomplete="off"
                :disabled="disabled"
              />
            </div>
          </div>

          <div class="selection-actions">
            <button
              type="button"
              :disabled="disabled || filteredCustomers.length === 0"
              @click="selectAllVisible"
            >
              Selecionar todos visíveis
            </button>
            <button
              type="button"
              :disabled="disabled || selectedCustomerIds.length === 0"
              @click="clearSelection"
            >
              Limpar seleção
            </button>
          </div>
        </div>

        <div v-if="eligibleCustomers.length === 0" class="selector-state empty-state">
          <p>Não há clientes elegíveis para seleção.</p>
        </div>

        <div v-else-if="filteredCustomers.length === 0" class="selector-state empty-state">
          <p>Nenhum cliente encontrado.</p>
        </div>

        <ul v-else class="customer-list" aria-label="Clientes elegíveis">
          <li v-for="(customer, index) in filteredCustomers" :key="customer.id">
            <input
              :id="`customer-option-${index}`"
              type="checkbox"
              :checked="selectedCustomerIds.includes(customer.id)"
              :disabled="disabled"
              @change="toggleCustomer(customer.id)"
            />
            <label :for="`customer-option-${index}`">
              <strong>{{ customer.name }}</strong>
              <span>{{ customer.phone }}</span>
            </label>
          </li>
        </ul>

        <div class="selection-summary">
          <span>{{ selectedCustomerIds.length }} {{ selectedCustomerIds.length === 1 ? 'cliente selecionado' : 'clientes selecionados' }}</span>
          <span v-if="validationError" class="selection-error" role="alert">{{ validationError }}</span>
        </div>
      </template>
    </div>

    <p v-else class="audience-help">Clientes inelegíveis não serão processados.</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Customer } from '@/services/customer.service'
import type { CampaignAudience } from '@/services/automation.service'

type AudienceType = CampaignAudience['type']

const props = defineProps<{
  audienceType: AudienceType
  customers: Customer[]
  selectedCustomerIds: string[]
  loading: boolean
  error: boolean
  validationError: string
  disabled: boolean
}>()

const emit = defineEmits<{
  'update:audienceType': [type: AudienceType]
  'update:selectedCustomerIds': [ids: string[]]
  retry: []
}>()

const search = ref('')

const eligibleCustomers = computed(() => (
  props.customers.filter((customer) => customer.isActiveForAutomation)
))

const filteredCustomers = computed(() => {
  const query = search.value.trim().toLocaleLowerCase('pt-BR')
  if (!query) return eligibleCustomers.value

  const phoneQuery = query.replace(/\D/g, '')
  return eligibleCustomers.value.filter((customer) => {
    const matchesName = customer.name.toLocaleLowerCase('pt-BR').includes(query)
    const matchesPhone = phoneQuery.length > 0
      && customer.phone.replace(/\D/g, '').includes(phoneQuery)

    return matchesName || matchesPhone
  })
})

function selectAudienceType(type: AudienceType) {
  if (props.disabled) return
  emit('update:audienceType', type)
}

function toggleCustomer(customerId: string) {
  if (props.disabled) return

  const selectedIds = new Set(props.selectedCustomerIds)
  if (selectedIds.has(customerId)) {
    selectedIds.delete(customerId)
  } else {
    selectedIds.add(customerId)
  }

  emit('update:selectedCustomerIds', [...selectedIds])
}

function selectAllVisible() {
  if (props.disabled) return

  const selectedIds = new Set(props.selectedCustomerIds)
  filteredCustomers.value.forEach((customer) => selectedIds.add(customer.id))
  emit('update:selectedCustomerIds', [...selectedIds])
}

function clearSelection() {
  if (props.disabled) return
  emit('update:selectedCustomerIds', [])
}
</script>

<style scoped>
.audience-selector {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.audience-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.audience-option {
  min-width: 0;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: 12px;
  color: var(--text-muted);
  background: var(--input-bg);
  text-align: left;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.audience-option:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--nav-hover);
  border-color: var(--input-border);
}

.audience-option.selected {
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-color: rgba(124, 58, 237, 0.45);
}

.audience-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.option-indicator {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid var(--input-border);
  border-radius: 50%;
}

.audience-option.selected .option-indicator {
  background: var(--brand);
  border-color: var(--brand);
}

.audience-option > span:last-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.audience-option strong {
  color: currentColor;
  font-size: 0.875rem;
}

.audience-option small {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.customer-selector {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--card-border);
  border-radius: 12px;
}

.customer-toolbar {
  padding: 1rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  border-bottom: 1px solid var(--card-border);
}

.search-field {
  width: min(100%, 340px);
}

.search-field label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.search-input-wrapper {
  position: relative;
}

.search-input-wrapper svg {
  position: absolute;
  top: 50%;
  left: 0.75rem;
  color: var(--text-muted);
  transform: translateY(-50%);
  pointer-events: none;
}

.search-input-wrapper input {
  width: 100%;
  padding: 0.65rem 0.75rem 0.65rem 2.25rem;
  border: 1px solid var(--input-border);
  border-radius: 9px;
  outline: none;
  color: var(--text-primary);
  background: var(--input-bg);
  font: inherit;
  font-size: 0.82rem;
}

.search-input-wrapper input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.search-input-wrapper input::placeholder {
  color: var(--text-muted);
}

.selection-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
}

.selection-actions button,
.retry-button {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: 8px;
  color: var(--text-secondary);
  background: var(--nav-hover);
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.selection-actions button:hover:not(:disabled),
.retry-button:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--brand-subtle);
}

.selection-actions button:disabled,
.retry-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.selector-state {
  min-height: 130px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: var(--text-muted);
  text-align: center;
  font-size: 0.82rem;
}

.error-state {
  color: var(--error);
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid rgba(167, 139, 250, 0.2);
  border-top-color: var(--brand-light);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.customer-list {
  max-height: 330px;
  overflow-y: auto;
  list-style: none;
}

.customer-list li {
  position: relative;
  border-bottom: 1px solid var(--card-border);
}

.customer-list li:last-child {
  border-bottom: none;
}

.customer-list input {
  position: absolute;
  top: 50%;
  left: 1rem;
  width: 16px;
  height: 16px;
  accent-color: var(--brand);
  transform: translateY(-50%);
}

.customer-list label {
  min-height: 64px;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
}

.customer-list label:hover {
  background: var(--nav-hover);
}

.customer-list strong {
  color: var(--text-primary);
  font-size: 0.85rem;
}

.customer-list span {
  margin-top: 0.15rem;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.selection-summary {
  min-height: 42px;
  padding: 0.65rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--text-muted);
  background: rgba(0, 0, 0, 0.12);
  border-top: 1px solid var(--card-border);
  font-size: 0.75rem;
}

.selection-error {
  color: var(--error);
}

.audience-help {
  color: var(--text-muted);
  font-size: 0.78rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 720px) {
  .audience-options {
    grid-template-columns: 1fr;
  }

  .customer-toolbar {
    align-items: stretch;
    flex-direction: column;
  }

  .search-field {
    width: 100%;
  }

  .selection-actions {
    justify-content: flex-start;
  }

  .selection-summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

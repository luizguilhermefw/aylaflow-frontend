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

      <button
        type="button"
        class="audience-option"
        :class="{ selected: audienceType === 'SEGMENTED' }"
        role="radio"
        :aria-checked="audienceType === 'SEGMENTED'"
        :disabled="disabled"
        @click="selectAudienceType('SEGMENTED')"
      >
        <span class="option-indicator" aria-hidden="true">
          <svg v-if="audienceType === 'SEGMENTED'" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
        </span>
        <span>
          <strong>Segmentar clientes</strong>
          <small>Filtre clientes por perfil e histórico de compra.</small>
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

    <div v-else-if="audienceType === 'SEGMENTED'" class="segmentation-panel">
      <div class="segmentation-grid">
        <div class="segment-field">
          <label for="segment-gender">Gênero</label>
          <select
            id="segment-gender"
            :value="segmentFilters.segmentGender"
            :disabled="disabled"
            @change="updateSegmentFilter('segmentGender', inputValue($event))"
          >
            <option value="">Todos / nenhum filtro</option>
            <option value="FEMALE">Feminino</option>
            <option value="MALE">Masculino</option>
            <option value="OTHER">Outro</option>
            <option value="UNSPECIFIED">Não informado</option>
          </select>
        </div>

        <div class="segment-field">
          <label for="segment-city">Cidade</label>
          <input
            id="segment-city"
            type="text"
            :value="segmentFilters.segmentCity"
            :disabled="disabled"
            autocomplete="address-level2"
            placeholder="Ex.: Cascavel"
            @input="updateSegmentFilter('segmentCity', inputValue($event))"
          />
        </div>

        <div class="segment-field">
          <label for="segment-state">UF</label>
          <select
            id="segment-state"
            :value="segmentFilters.segmentState"
            :disabled="disabled"
            autocomplete="address-level1"
            @change="updateSegmentFilter('segmentState', inputValue($event))"
          >
            <option value="">Todas</option>
            <option v-for="state in BRAZILIAN_STATES" :key="state" :value="state">{{ state }}</option>
          </select>
        </div>

        <div class="segment-field">
          <label for="segment-min-age">Idade mínima</label>
          <input
            id="segment-min-age"
            type="number"
            min="0"
            max="120"
            step="1"
            :value="segmentFilters.segmentMinAge"
            :disabled="disabled"
            placeholder="0"
            @input="updateSegmentFilter('segmentMinAge', inputValue($event))"
          />
        </div>

        <div class="segment-field">
          <label for="segment-max-age">Idade máxima</label>
          <input
            id="segment-max-age"
            type="number"
            min="0"
            max="120"
            step="1"
            :value="segmentFilters.segmentMaxAge"
            :disabled="disabled"
            placeholder="120"
            @input="updateSegmentFilter('segmentMaxAge', inputValue($event))"
          />
        </div>

        <div class="segment-field">
          <label for="segment-last-purchase-after">Última compra após</label>
          <input
            id="segment-last-purchase-after"
            type="date"
            :value="segmentFilters.segmentLastPurchaseAfter"
            :disabled="disabled"
            @input="updateSegmentFilter('segmentLastPurchaseAfter', inputValue($event))"
          />
        </div>

        <div class="segment-field">
          <label for="segment-last-purchase-before">Última compra antes de</label>
          <input
            id="segment-last-purchase-before"
            type="date"
            :value="segmentFilters.segmentLastPurchaseBefore"
            :disabled="disabled"
            @input="updateSegmentFilter('segmentLastPurchaseBefore', inputValue($event))"
          />
        </div>
      </div>
      <p v-if="validationError" class="selection-error" role="alert">{{ validationError }}</p>
    </div>

    <p v-else class="audience-help">Clientes inelegíveis não serão processados.</p>

    <div class="preview-actions">
      <button
        type="button"
        class="preview-button"
        :disabled="disabled || previewDisabled || previewing"
        @click="$emit('preview')"
      >
        <span v-if="previewing" class="spinner preview-spinner" aria-hidden="true" />
        {{ preview ? 'Atualizar prévia' : 'Pré-visualizar público' }}
      </button>
      <p v-if="previewError" class="preview-error" role="alert">{{ previewError }}</p>
    </div>

    <section v-if="preview" class="preview-card" aria-label="Prévia do público" aria-live="polite">
      <dl>
        <div>
          <dt>Encontrados</dt>
          <dd>{{ preview.matched }}</dd>
        </div>
        <div>
          <dt>Elegíveis para envio</dt>
          <dd>{{ preview.eligible }}</dd>
        </div>
        <div>
          <dt>Bloqueados</dt>
          <dd>{{ preview.blocked }}</dd>
        </div>
      </dl>
      <p>Clientes bloqueados não serão enviados pelo AylaFlow.</p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Customer } from '@/services/customer.service'
import { BRAZILIAN_STATES } from '@/features/contacts/contact.logic'
import type {
  CampaignAudiencePreviewResponse,
  CampaignAudienceType,
  CampaignSegmentForm,
} from '@/features/campaigns/campaign.types'

const props = defineProps<{
  audienceType: CampaignAudienceType
  customers: Customer[]
  selectedCustomerIds: string[]
  segmentFilters: CampaignSegmentForm
  preview: CampaignAudiencePreviewResponse | null
  previewing: boolean
  previewError: string
  previewDisabled: boolean
  loading: boolean
  error: boolean
  validationError: string
  disabled: boolean
}>()

const emit = defineEmits<{
  'update:audienceType': [type: CampaignAudienceType]
  'update:selectedCustomerIds': [ids: string[]]
  'update:segmentFilters': [filters: CampaignSegmentForm]
  preview: []
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

function selectAudienceType(type: CampaignAudienceType) {
  if (props.disabled) return
  emit('update:audienceType', type)
}

function inputValue(event: Event): string {
  return (event.target as HTMLInputElement | HTMLSelectElement).value
}

function updateSegmentFilter(field: keyof CampaignSegmentForm, value: string) {
  if (props.disabled) return
  emit('update:segmentFilters', { ...props.segmentFilters, [field]: value })
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
  grid-template-columns: repeat(3, minmax(0, 1fr));
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
  border-color: var(--brand-border);
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
  color: var(--text-on-brand);
  background: var(--surface-active);
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
  background: var(--surface-hover);
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
  border: 2.5px solid var(--brand-spinner-track);
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

.segmentation-panel {
  padding: 1rem;
  background: var(--surface-hover);
  border: 1px solid var(--card-border);
  border-radius: 12px;
}

.segmentation-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.875rem;
}

.segment-field {
  min-width: 0;
}

.segment-field label {
  display: block;
  margin-bottom: 0.4rem;
  color: var(--text-secondary);
  font-size: 0.78rem;
  font-weight: 600;
}

.segment-field input,
.segment-field select {
  width: 100%;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--input-border);
  border-radius: 9px;
  outline: none;
  color: var(--text-primary);
  background: var(--input-bg);
  color-scheme: var(--native-control-color-scheme);
  font: inherit;
  font-size: 0.82rem;
}

.segment-field input:focus,
.segment-field select:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.segment-field input:disabled,
.segment-field select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.segmentation-panel > .selection-error {
  display: block;
  margin-top: 0.75rem;
  font-size: 0.78rem;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.preview-button {
  padding: 0.65rem 1rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid var(--brand-border);
  border-radius: 9px;
  color: var(--brand-light);
  background: var(--brand-subtle);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.preview-button:hover:not(:disabled) {
  border-color: var(--brand-light);
}

.preview-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.preview-spinner {
  width: 16px;
  height: 16px;
}

.preview-error {
  color: var(--error);
  font-size: 0.78rem;
}

.preview-card {
  padding: 1rem;
  background: var(--brand-subtle);
  border: 1px solid var(--brand-border);
  border-radius: 12px;
}

.preview-card dl {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
}

.preview-card dl > div {
  padding: 0.75rem;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 9px;
}

.preview-card dt {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.preview-card dd {
  margin-top: 0.25rem;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 700;
}

.preview-card p {
  margin-top: 0.75rem;
  color: var(--text-muted);
  font-size: 0.75rem;
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

  .segmentation-grid,
  .preview-card dl {
    grid-template-columns: 1fr;
  }

  .preview-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>

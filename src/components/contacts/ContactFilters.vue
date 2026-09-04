<template>
  <section class="filters-card" aria-labelledby="contact-filters-title">
    <div class="filters-heading">
      <div>
        <h2 id="contact-filters-title">Filtros de segmentação</h2>
        <p>Refine a lista usando os critérios disponíveis.</p>
      </div>
      <button type="button" class="toggle-button" :aria-expanded="expanded" @click="expanded = !expanded">
        {{ expanded ? 'Ocultar filtros' : 'Mostrar filtros' }}
      </button>
    </div>

    <form v-if="expanded" class="filters-form" @submit.prevent="applyFilters">
      <div class="filter-field">
        <label for="filter-gender">Gênero</label>
        <select id="filter-gender" v-model="filters.gender" :disabled="loading">
          <option value="">Todos</option>
          <option value="FEMALE">Feminino</option>
          <option value="MALE">Masculino</option>
          <option value="UNSPECIFIED">Não informado</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="filter-city">Cidade</label>
        <input id="filter-city" v-model="filters.city" type="text" autocomplete="address-level2" :disabled="loading" />
      </div>

      <div class="filter-field">
        <label for="filter-state">UF</label>
        <select id="filter-state" v-model="filters.state" :disabled="loading">
          <option value="">Todas</option>
          <option v-for="state in BRAZILIAN_STATES" :key="state" :value="state">{{ state }}</option>
        </select>
      </div>

      <div class="filter-field">
        <label for="filter-min-age">Idade mínima</label>
        <input id="filter-min-age" v-model="filters.minAge" type="number" min="0" max="120" inputmode="numeric" :disabled="loading" />
      </div>

      <div class="filter-field">
        <label for="filter-max-age">Idade máxima</label>
        <input id="filter-max-age" v-model="filters.maxAge" type="number" min="0" max="120" inputmode="numeric" :disabled="loading" />
      </div>

      <div class="filter-field">
        <label for="filter-purchase-after">Última compra após</label>
        <input id="filter-purchase-after" v-model="filters.lastPurchaseAfter" type="date" :disabled="loading" />
      </div>

      <div class="filter-field">
        <label for="filter-purchase-before">Última compra antes de</label>
        <input id="filter-purchase-before" v-model="filters.lastPurchaseBefore" type="date" :disabled="loading" />
      </div>

      <div class="filter-field">
        <label for="filter-page-size">Itens por página</label>
        <select id="filter-page-size" v-model="filters.pageSize" :disabled="loading">
          <option :value="10">10</option>
          <option :value="20">20</option>
          <option :value="50">50</option>
          <option :value="100">100</option>
        </select>
      </div>

      <p v-if="validationError" class="filter-error" role="alert">{{ validationError }}</p>

      <div class="filter-actions">
        <button type="button" class="btn-secondary" :disabled="loading" @click="clearFilters">Limpar filtros</button>
        <button type="submit" class="btn-primary" :disabled="loading">Aplicar filtros</button>
      </div>
    </form>
  </section>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import {
  BRAZILIAN_STATES,
  emptyContactFilters,
  validateContactFilters,
} from '@/features/contacts/contact.logic'
import type { ContactFilterValues } from '@/features/contacts/contact.types'

defineProps<{ loading: boolean }>()

const emit = defineEmits<{
  apply: [filters: ContactFilterValues]
  clear: []
}>()

const expanded = ref(false)
const filters = reactive<ContactFilterValues>(emptyContactFilters())
const validationError = ref('')

function applyFilters() {
  validationError.value = validateContactFilters(filters)
  if (validationError.value) return
  emit('apply', { ...filters })
}

function clearFilters() {
  Object.assign(filters, emptyContactFilters())
  validationError.value = ''
  emit('clear')
}
</script>

<style scoped>
.filters-card {
  padding: 1.25rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
}

.filters-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.filters-heading h2 { color: var(--text-primary); font-size: 1rem; }
.filters-heading p { margin-top: 0.2rem; color: var(--text-muted); font-size: 0.78rem; }
.toggle-button { padding: 0.5rem 0.75rem; border: 1px solid var(--card-border); border-radius: 9px; color: var(--brand-light); background: var(--brand-subtle); font-size: 0.78rem; font-weight: 600; cursor: pointer; }
.filters-form { margin-top: 1.25rem; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1rem; }
.filter-field { min-width: 0; display: flex; flex-direction: column; gap: 0.4rem; }
.filter-field label { color: var(--text-secondary); font-size: 0.78rem; font-weight: 600; }
.filter-field input, .filter-field select { width: 100%; min-height: 42px; padding: 0.62rem 0.7rem; border: 1px solid var(--input-border); border-radius: 9px; outline: none; color: var(--text-primary); background: var(--input-bg); color-scheme: var(--native-control-color-scheme); font: inherit; font-size: 0.82rem; }
.filter-field input:focus, .filter-field select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }
.filter-field select option { color: var(--text-primary); background: var(--sidebar-bg); }
.filter-field select option:checked { color: var(--text-on-brand); background: var(--brand); }
.filter-field select option:hover { color: var(--text-on-brand); background: var(--brand); }
.filter-field input[type='date']::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(78%) sepia(8%) saturate(691%) hue-rotate(211deg) brightness(90%); }
.filter-error { grid-column: 1 / -1; color: var(--error); font-size: 0.8rem; }
.filter-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-primary, .btn-secondary { padding: 0.62rem 0.9rem; border-radius: 9px; font-size: 0.82rem; font-weight: 600; cursor: pointer; }
.btn-primary { border: none; color: var(--text-on-brand); background: var(--gradient-brand); }
.btn-secondary { border: 1px solid var(--card-border); color: var(--text-secondary); background: transparent; }
.btn-primary:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.55; }

@media (max-width: 1000px) { .filters-form { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .filters-heading { align-items: flex-start; flex-direction: column; }
  .filters-form { grid-template-columns: 1fr; }
  .filter-actions { align-items: stretch; flex-direction: column-reverse; }
}
</style>

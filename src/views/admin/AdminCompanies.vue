<template>
  <AppLayout title="Empresas" subtitle="Gerencie as empresas cadastradas no AylaFlow.">
    <section class="summary-grid" aria-label="Resumo de empresas por status">
      <button
        v-for="option in filterOptions"
        :key="option.value"
        type="button"
        class="summary-card"
        :class="[`status-${option.value.toLowerCase()}`, { active: activeFilter === option.value }]"
        :aria-pressed="activeFilter === option.value"
        @click="activeFilter = option.value"
      >
        <span>{{ option.label }}</span>
        <strong>{{ counts[option.value] }}</strong>
      </button>
    </section>

    <section class="companies-panel">
      <div class="panel-toolbar">
        <div>
          <h2>Empresas cadastradas</h2>
          <p>{{ filteredCompanies.length }} resultado(s) nesta visualização.</p>
        </div>
        <label class="search-field">
          <span class="sr-only">Buscar empresa por nome ou CNPJ</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input v-model="search" type="search" placeholder="Buscar por empresa ou CNPJ" autocomplete="off" />
        </label>
      </div>

      <p v-if="state.successMessage" class="success-message" role="status">
        {{ state.successMessage }}
      </p>

      <div v-if="state.loading" class="state-card" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true" />
        <p>Carregando empresas...</p>
      </div>

      <div v-else-if="state.loadError" class="state-card error-state" role="alert">
        <p>{{ state.loadError }}</p>
        <button type="button" class="btn-secondary" @click="loadCompanies">Tentar novamente</button>
      </div>

      <div v-else-if="filteredCompanies.length === 0" class="state-card">
        <p>Nenhuma empresa encontrada para os filtros selecionados.</p>
      </div>

      <div v-else class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>CNPJ</th>
              <th>Data de cadastro</th>
              <th>Data de aprovação</th>
              <th>Status</th>
              <th class="actions-heading">Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="company in filteredCompanies" :key="company.id">
              <td><strong class="company-name">{{ company.displayName }}</strong></td>
              <td>{{ formatAdminCompanyCnpj(company.cnpj) }}</td>
              <td>{{ formatAdminCompanyDate(company.createdAt) }}</td>
              <td>{{ formatAdminCompanyDate(company.approvedAt) }}</td>
              <td>
                <span class="status-badge" :class="`status-${company.status.toLowerCase()}`">
                  {{ ADMIN_COMPANY_STATUS_LABELS[company.status] }}
                </span>
              </td>
              <td>
                <div v-if="getAdminCompanyActions(company).length" class="row-actions">
                  <button
                    v-for="action in getAdminCompanyActions(company)"
                    :key="action.type"
                    type="button"
                    class="action-button"
                    :class="`action-${action.tone}`"
                    :disabled="state.actionLoading"
                    @click="controller.openAction(company, action.type)"
                  >
                    {{ action.label }}
                  </button>
                </div>
                <span v-else class="read-only-label">Somente leitura</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <AdminCompanyConfirmModal
      :company="pendingCompany"
      :action="pendingActionDefinition"
      :loading="state.actionLoading"
      :error="state.actionError"
      @close="controller.closeAction"
      @confirm="controller.confirmAction"
    />
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import AdminCompanyConfirmModal from '@/components/admin/AdminCompanyConfirmModal.vue'
import { adminService } from '@/services/admin.service'
import {
  ADMIN_COMPANY_STATUS_LABELS,
  countAdminCompaniesByStatus,
  createAdminCompaniesController,
  emptyAdminCompaniesState,
  filterAdminCompanies,
  findAdminCompanyAction,
  formatAdminCompanyCnpj,
  formatAdminCompanyDate,
  getAdminCompanyActions,
  type AdminCompanyFilter,
} from '@/features/admin/admin-companies.logic'

const filterOptions: Array<{ value: AdminCompanyFilter, label: string }> = [
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'ACTIVE', label: 'Ativas' },
  { value: 'SUSPENDED', label: 'Suspensas' },
  { value: 'CANCELLED', label: 'Canceladas' },
  { value: 'ALL', label: 'Todas' },
]

const state = reactive(emptyAdminCompaniesState())
const controller = createAdminCompaniesController(adminService, state)
const activeFilter = ref<AdminCompanyFilter>('ALL')
const search = ref('')

const counts = computed(() => countAdminCompaniesByStatus(state.companies))
const filteredCompanies = computed(() => filterAdminCompanies(
  state.companies,
  activeFilter.value,
  search.value,
))
const pendingCompany = computed(() => state.pendingAction
  ? state.companies.find((company) => company.id === state.pendingAction?.companyId) ?? null
  : null)
const pendingActionDefinition = computed(() => (
  pendingCompany.value && state.pendingAction
    ? findAdminCompanyAction(pendingCompany.value, state.pendingAction.type)
    : null
))

function loadCompanies() {
  void controller.loadCompanies()
}

onMounted(loadCompanies)
</script>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(130px, 1fr));
  gap: 0.75rem;
}

.summary-card {
  min-height: 90px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  color: var(--text-muted);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 14px;
  font: inherit;
  cursor: pointer;
  transition: border-color 0.15s, transform 0.15s, background 0.15s;
}

.summary-card:hover,
.summary-card.active {
  transform: translateY(-1px);
  border-color: var(--brand);
  background: var(--brand-subtle);
}

.summary-card span { font-size: 0.78rem; font-weight: 600; }
.summary-card strong { color: var(--text-primary); font-size: 1.55rem; }
.summary-card.status-pending strong { color: #fbbf24; }
.summary-card.status-active strong { color: #34d399; }
.summary-card.status-suspended strong { color: #fb923c; }
.summary-card.status-cancelled strong { color: #f87171; }

.companies-panel {
  overflow: hidden;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  box-shadow: var(--card-shadow);
}

.panel-toolbar {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border-bottom: 1px solid var(--card-border);
}

.panel-toolbar h2 { color: var(--text-primary); font-size: 1rem; }
.panel-toolbar p { margin-top: 0.25rem; color: var(--text-muted); font-size: 0.76rem; }

.search-field {
  width: min(100%, 320px);
  padding: 0 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  color: var(--text-muted);
  background: var(--bg-primary);
  border: 1px solid var(--card-border);
  border-radius: 10px;
}

.search-field:focus-within { border-color: var(--brand); }

.search-field input {
  width: 100%;
  padding: 0.68rem 0;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  font: inherit;
  font-size: 0.82rem;
}

.success-message {
  margin: 1rem 1.25rem 0;
  padding: 0.75rem 0.9rem;
  color: #6ee7b7;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(52, 211, 153, 0.22);
  border-radius: 10px;
  font-size: 0.8rem;
}

.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; min-width: 930px; }
th, td { padding: 0.95rem 1rem; text-align: left; border-bottom: 1px solid var(--card-border); }
th { color: var(--text-muted); font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
td { color: var(--text-secondary); font-size: 0.8rem; }
tbody tr:last-child td { border-bottom: none; }
tbody tr:hover { background: rgba(124, 58, 237, 0.025); }
.company-name { color: var(--text-primary); font-weight: 600; }
.actions-heading { min-width: 190px; }

.status-badge {
  display: inline-flex;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
}

.status-badge.status-pending { color: #fbbf24; background: rgba(245, 158, 11, 0.1); }
.status-badge.status-active { color: #6ee7b7; background: rgba(16, 185, 129, 0.1); }
.status-badge.status-suspended { color: #fdba74; background: rgba(249, 115, 22, 0.1); }
.status-badge.status-cancelled { color: #fca5a5; background: rgba(239, 68, 68, 0.1); }

.row-actions { display: flex; gap: 0.45rem; }
.action-button { padding: 0.42rem 0.62rem; border-radius: 8px; font: inherit; font-size: 0.72rem; font-weight: 600; cursor: pointer; }
.action-primary { color: var(--brand-light); background: var(--brand-subtle); border: 1px solid rgba(139, 92, 246, 0.3); }
.action-warning { color: #fdba74; background: rgba(249, 115, 22, 0.08); border: 1px solid rgba(251, 146, 60, 0.25); }
.action-destructive { color: #fca5a5; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(248, 113, 113, 0.25); }
.action-button:disabled { cursor: not-allowed; opacity: 0.5; }
.read-only-label { color: var(--text-muted); font-size: 0.72rem; }

.state-card {
  min-height: 220px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-muted);
  text-align: center;
  font-size: 0.85rem;
}

.spinner { width: 26px; height: 26px; border: 3px solid var(--card-border); border-top-color: var(--brand); border-radius: 50%; animation: spin 0.8s linear infinite; }
.error-state { color: var(--error); }
.btn-secondary { padding: 0.6rem 0.9rem; color: var(--text-secondary); background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: 9px; font: inherit; cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }

button:focus-visible, input:focus-visible { outline: 2px solid var(--brand-light); outline-offset: 2px; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 1100px) {
  .summary-grid { grid-template-columns: repeat(3, minmax(130px, 1fr)); }
}

@media (max-width: 720px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(120px, 1fr)); }
  .panel-toolbar { align-items: stretch; flex-direction: column; }
  .search-field { width: 100%; }
}
</style>

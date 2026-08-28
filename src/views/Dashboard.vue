<template>
  <AppLayout title="Dashboard" subtitle="Visão geral das suas automações">
    <template #actions>
      <RouterLink id="btn-new-automation" class="btn-action" to="/automations">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
        Nova Automação
      </RouterLink>
    </template>

      <CompanyActivationCard v-if="isPending" />

      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-content">
          <div class="welcome-badge">✨ Bem-vindo ao AylaFlow</div>
          <h2 class="welcome-title">Reative seus clientes com automações inteligentes</h2>
          <p class="welcome-desc">Configure fluxos automáticos no WhatsApp e recupere clientes inativos com mensagens personalizadas no momento certo.</p>
          <RouterLink id="btn-start-automation" class="btn-start" to="/automations">
            Criar primeira automação
          </RouterLink>
        </div>
        <div class="welcome-illustration" aria-hidden="true">
          <div class="float-card fc1">
            <span>📲</span>
            <span>WhatsApp</span>
          </div>
          <div class="float-card fc2">
            <span>🤖</span>
            <span>Automação</span>
          </div>
          <div class="float-card fc3">
            <span>📈</span>
            <span>Resultados</span>
          </div>
        </div>
      </div>

      <section v-if="loadError && !isPending" class="dashboard-error" role="alert">
        <div>
          <strong>Não foi possível carregar os indicadores do Dashboard.</strong>
          <p>Verifique sua conexão e tente novamente.</p>
        </div>
        <button type="button" class="btn-retry" :disabled="loading" @click="loadDashboard">
          Tentar novamente
        </button>
      </section>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card" id="stat-active">
          <div class="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">{{ displayMetric(summary?.activeAutomations) }}</span>
            <span class="stat-label">Automações ativas</span>
          </div>
        </div>

        <div class="stat-card" id="stat-contacts">
          <div class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">{{ displayMetric(summary?.contacts) }}</span>
            <span class="stat-label">Contatos</span>
          </div>
        </div>

        <div class="stat-card" id="stat-messages">
          <div class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">{{ displayMetric(summary?.messagesSent) }}</span>
            <span class="stat-label">Mensagens enviadas</span>
          </div>
        </div>

        <div class="stat-card" id="stat-campaigns">
          <div class="stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">{{ displayMetric(summary?.campaigns) }}</span>
            <span class="stat-label">Campanhas</span>
          </div>
        </div>
      </div>

      <section v-if="loading" class="summary-loading" role="status" aria-live="polite">
        <span class="spinner" aria-hidden="true" />
        <p>Carregando indicadores e últimas automações...</p>
      </section>

      <div
        v-else-if="summary && summary.recentAutomations.length === 0"
        class="empty-state"
        id="empty-automations"
      >
        <div class="empty-icon">🚀</div>
        <h3>Nenhuma automação criada ainda</h3>
        <p>Crie sua primeira automação e comece a recuperar clientes inativos automaticamente.</p>
        <RouterLink id="btn-create-first" class="btn-action" to="/automations">
          Criar automação
        </RouterLink>
      </div>

      <section
        v-else-if="summary && summary.recentAutomations.length > 0"
        class="recent-section"
        aria-labelledby="recent-automations-heading"
      >
        <div class="recent-heading">
          <div>
            <h2 id="recent-automations-heading">Últimas automações</h2>
            <p>Automações adicionadas recentemente.</p>
          </div>
          <RouterLink class="recent-link" to="/automations">Ver todas</RouterLink>
        </div>

        <div class="recent-list">
          <article
            v-for="automation in summary.recentAutomations"
            :key="automation.id"
            class="recent-item"
          >
            <div class="recent-automation">
              <strong>{{ automation.name }}</strong>
              <span>{{ dashboardAutomationTypeLabel(automation.type) }}</span>
            </div>
            <span class="automation-status" :class="automation.isActive ? 'active' : 'inactive'">
              {{ automation.isActive ? 'Ativa' : 'Inativa' }}
            </span>
            <time :datetime="automation.createdAt">
              Criada em {{ formatDashboardDate(automation.createdAt) }}
            </time>
          </article>
        </div>
      </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, toRef } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import CompanyActivationCard from '@/components/company-access/CompanyActivationCard.vue'
import { isPendingCompany } from '@/features/company-access/company-access.logic'
import { companyAccessIssue } from '@/features/company-access/company-access.state'
import { dashboardService } from '@/services/dashboard.service'
import {
  createDashboardController,
  dashboardAutomationTypeLabel,
  emptyDashboardState,
  formatDashboardDate,
  formatDashboardNumber,
  type DashboardState,
} from '@/features/dashboard/dashboard.logic'

const dashboardState = reactive(emptyDashboardState()) as DashboardState
const dashboardController = createDashboardController(dashboardService, dashboardState)
const summary = toRef(dashboardState, 'summary')
const loading = toRef(dashboardState, 'loading')
const loadError = toRef(dashboardState, 'loadError')

const isPending = computed(() => isPendingCompany(companyAccessIssue.value))

function displayMetric(value: number | undefined): string {
  return loading.value || value === undefined ? '—' : formatDashboardNumber(value)
}

function loadDashboard() {
  void dashboardController.load()
}

onMounted(loadDashboard)
</script>

<style scoped>
.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: var(--gradient-brand);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--brand-glow);
  transition: opacity 0.2s, transform 0.1s;
  text-decoration: none;
}

.btn-action:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Welcome Banner ── */
.welcome-banner {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.5s ease both;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, #7c3aed22, transparent 70%);
  pointer-events: none;
}

.welcome-badge {
  display: inline-block;
  padding: 0.3rem 0.875rem;
  background: var(--brand-subtle);
  color: var(--brand-light);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.875rem;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0 0 0.75rem;
  max-width: 440px;
}

.welcome-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
  max-width: 420px;
  margin-bottom: 1.5rem;
}

.btn-start {
  padding: 0.75rem 1.5rem;
  background: var(--gradient-brand);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 20px var(--brand-glow);
  transition: opacity 0.2s, transform 0.1s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.btn-start:hover { opacity: 0.9; transform: translateY(-1px); }

.welcome-illustration {
  position: relative;
  width: 200px;
  height: 130px;
  flex-shrink: 0;
}

.float-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--float-card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 0.5rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  white-space: nowrap;
}

.fc1 { top: 0; left: 0; animation: floatA 4s ease-in-out infinite; }
.fc2 { top: 50px; right: 0; animation: floatB 4s ease-in-out infinite 0.7s; }
.fc3 { bottom: 0; left: 20px; animation: floatA 4s ease-in-out infinite 1.4s; }

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  animation: fadeInUp 0.5s ease 0.1s both;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.purple { background: rgba(124, 58, 237, 0.15); color: #a78bfa; }
.stat-icon.green  { background: rgba(34, 197, 94, 0.15);  color: #4ade80; }
.stat-icon.blue   { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.stat-icon.orange { background: rgba(251, 146, 60, 0.15); color: #fb923c; }

.stat-data { display: flex; flex-direction: column; gap: 0.2rem; }
.stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.stat-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

.dashboard-error {
  padding: 1rem 1.125rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: var(--error);
  background: rgba(239, 68, 68, 0.08);
  border: 1px solid rgba(239, 68, 68, 0.24);
  border-radius: 14px;
}

.dashboard-error strong {
  font-size: 0.9rem;
}

.dashboard-error p {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.btn-retry {
  flex-shrink: 0;
  padding: 0.6rem 0.9rem;
  color: var(--text-primary);
  background: var(--nav-hover);
  border: 1px solid var(--card-border);
  border-radius: 9px;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-retry:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.summary-loading {
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  color: var(--text-muted);
  background: var(--card-bg);
  border: 1px dashed var(--card-border);
  border-radius: 20px;
  font-size: 0.85rem;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid rgba(167, 139, 250, 0.2);
  border-top-color: var(--brand-light);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.recent-section {
  padding: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  animation: fadeInUp 0.5s ease 0.2s both;
}

.recent-heading {
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.recent-heading h2 {
  color: var(--text-primary);
  font-size: 1.05rem;
}

.recent-heading p {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.recent-link {
  flex-shrink: 0;
  color: var(--brand-light);
  font-size: 0.8rem;
  font-weight: 600;
  text-decoration: none;
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  padding: 0.875rem 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(130px, auto);
  align-items: center;
  gap: 1rem;
  border-top: 1px solid var(--card-border);
}

.recent-item:first-child {
  border-top: 0;
}

.recent-automation {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.recent-automation strong {
  color: var(--text-primary);
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.recent-automation span,
.recent-item time {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.recent-item time {
  text-align: right;
}

.automation-status {
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 600;
}

.automation-status.active {
  color: var(--success);
  background: rgba(34, 197, 94, 0.12);
}

.automation-status.inactive {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.06);
}

/* ── Empty State ── */
.empty-state {
  background: var(--card-bg);
  border: 1px dashed var(--card-border);
  border-radius: 20px;
  padding: 3.5rem 2rem;
  text-align: center;
  animation: fadeInUp 0.5s ease 0.2s both;
}

.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-state h3 { color: var(--text-primary); font-size: 1.1rem; margin-bottom: 0.5rem; }
.empty-state p { color: var(--text-muted); font-size: 0.875rem; max-width: 380px; margin: 0 auto 1.5rem; line-height: 1.6; }
.empty-state .btn-action { display: inline-flex; }

@media (max-width: 720px) {
  .dashboard-error,
  .recent-heading {
    align-items: flex-start;
    flex-direction: column;
  }

  .recent-item {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .recent-item time {
    grid-column: 1 / -1;
    text-align: left;
  }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes floatA {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes floatB {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>

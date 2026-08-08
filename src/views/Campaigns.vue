<template>
  <AppLayout title="Campanhas" subtitle="Crie e envie campanhas para seus clientes">
    <section v-if="loading" class="state-card loading-state" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando suas campanhas...</p>
    </section>

    <section v-else-if="loadError" class="state-card error-state" role="alert">
      <div class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </div>
      <h2>Não foi possível carregar suas campanhas.</h2>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn-primary" @click="loadCampaigns">Tentar novamente</button>
    </section>

    <section v-else-if="campaigns.length === 0" class="state-card empty-state">
      <div class="state-icon empty-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3Z"/><path d="M11.6 16.8 13 21H7l-1.8-6.2"/><path d="M8 9v6"/></svg>
      </div>
      <h2>Você ainda não criou nenhuma campanha.</h2>
      <p>Quando suas campanhas forem criadas, elas aparecerão aqui.</p>
      <button type="button" class="btn-primary">Nova campanha</button>
    </section>

    <section v-else class="campaigns-section" aria-labelledby="campaigns-heading">
      <div class="section-heading">
        <div>
          <h2 id="campaigns-heading">Suas campanhas</h2>
          <p>{{ campaigns.length }} {{ campaigns.length === 1 ? 'campanha encontrada' : 'campanhas encontradas' }}</p>
        </div>
        <button type="button" class="btn-primary">Nova campanha</button>
      </div>

      <div class="campaign-grid">
        <article v-for="campaign in campaigns" :key="campaign.id" class="campaign-card">
          <div class="campaign-card-header">
            <h3>{{ campaign.name }}</h3>
            <span class="status" :class="campaign.isActive ? 'active' : 'inactive'">
              <span class="status-dot" aria-hidden="true" />
              {{ campaign.isActive ? 'Ativa' : 'Inativa' }}
            </span>
          </div>

          <p class="campaign-message">{{ campaign.message }}</p>

          <div class="campaign-card-footer">
            <time :datetime="campaign.createdAt">Criada em {{ formatDate(campaign.createdAt) }}</time>
            <button type="button" class="btn-secondary" aria-disabled="true">Abrir</button>
          </div>
        </article>
      </div>
    </section>
  </AppLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { automationService, type Automation } from '@/services/automation.service'

const campaigns = ref<Automation[]>([])
const loading = ref(true)
const loadError = ref(false)

async function loadCampaigns() {
  loading.value = true
  loadError.value = false

  try {
    const automations = await automationService.list()
    campaigns.value = automations.filter((automation) => automation.type === 'CAMPAIGN')
  } catch {
    campaigns.value = []
    loadError.value = true
  } finally {
    loading.value = false
  }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(value))
}

onMounted(loadCampaigns)
</script>

<style scoped>
.state-card {
  min-height: 320px;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--card-bg);
  border: 1px dashed var(--card-border);
  border-radius: 20px;
  animation: fadeInUp 0.4s ease both;
}

.state-card h2 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1.15rem;
}

.state-card p {
  max-width: 420px;
  margin-bottom: 1.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.state-icon {
  width: 60px;
  height: 60px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border-radius: 16px;
}

.empty-icon {
  color: var(--brand-light);
  background: var(--brand-subtle);
}

.loading-state {
  min-height: 240px;
}

.loading-state p {
  margin: 1rem 0 0;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid rgba(167, 139, 250, 0.2);
  border-top-color: var(--brand-light);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.btn-primary,
.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s, background 0.2s;
}

.btn-primary {
  padding: 0.7rem 1.25rem;
  border: none;
  color: #fff;
  background: var(--gradient-brand);
  box-shadow: 0 4px 16px var(--brand-glow);
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.campaigns-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.section-heading h2 {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.section-heading p {
  margin-top: 0.25rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.campaign-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.25rem;
}

.campaign-card {
  min-width: 0;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  animation: fadeInUp 0.4s ease both;
}

.campaign-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
}

.campaign-card-header,
.campaign-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.campaign-card-header h3 {
  min-width: 0;
  color: var(--text-primary);
  font-size: 1rem;
  overflow-wrap: anywhere;
}

.status {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.65rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status.active {
  color: var(--success);
  background: rgba(34, 197, 94, 0.12);
}

.status.inactive {
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.06);
}

.status-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  border-radius: 50%;
}

.campaign-message {
  min-height: 3.2em;
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-muted);
  font-size: 0.875rem;
  line-height: 1.6;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.campaign-card-footer {
  padding-top: 1rem;
  border-top: 1px solid var(--card-border);
}

.campaign-card-footer time {
  color: var(--text-muted);
  font-size: 0.75rem;
}

.btn-secondary {
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--card-border);
  color: var(--text-secondary);
  background: var(--nav-hover);
  cursor: default;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 720px) {
  .section-heading,
  .campaign-card-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

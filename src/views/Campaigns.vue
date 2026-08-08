<template>
  <AppLayout title="Campanhas" subtitle="Crie e envie campanhas para seus clientes">
    <div v-if="successMessage" class="success-feedback" role="status" aria-live="polite">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      {{ successMessage }}
    </div>

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
      <button type="button" class="btn-primary" @click="openCreateModal">Nova campanha</button>
    </section>

    <section v-else class="campaigns-section" aria-labelledby="campaigns-heading">
      <div class="section-heading">
        <div>
          <h2 id="campaigns-heading">Suas campanhas</h2>
          <p>{{ campaigns.length }} {{ campaigns.length === 1 ? 'campanha encontrada' : 'campanhas encontradas' }}</p>
        </div>
        <button type="button" class="btn-primary" @click="openCreateModal">Nova campanha</button>
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

          <p class="campaign-message">{{ campaign.message || 'Conteúdo definido no envio' }}</p>

          <div class="campaign-card-footer">
            <time :datetime="campaign.createdAt">Criada em {{ formatDate(campaign.createdAt) }}</time>
            <RouterLink
              class="btn-secondary"
              :to="{ name: 'campaign-detail', params: { id: campaign.id } }"
            >
              Abrir
            </RouterLink>
          </div>
        </article>
      </div>
    </section>
  </AppLayout>

  <div
    v-if="createModalOpen"
    class="modal-backdrop"
    @click.self="closeCreateModal"
  >
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-campaign-title"
    >
      <div class="modal-header">
        <div>
          <h2 id="create-campaign-title">Nova campanha</h2>
          <p>Crie uma campanha para preparar seu próximo envio.</p>
        </div>
        <button
          type="button"
          class="modal-close"
          aria-label="Fechar"
          :disabled="creating"
          @click="closeCreateModal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <form class="modal-form" novalidate @submit.prevent="createCampaign">
        <div class="form-field">
          <label for="campaign-name">Nome da campanha</label>
          <input
            id="campaign-name"
            ref="campaignNameInput"
            v-model="campaignName"
            type="text"
            placeholder="Promoção de Inverno"
            maxlength="120"
            autocomplete="off"
            :disabled="creating"
            :aria-invalid="campaignNameTouched && Boolean(campaignNameValidationError)"
            aria-describedby="campaign-name-help"
            @blur="campaignNameTouched = true"
            @input="createError = ''"
          />
          <span id="campaign-name-help" class="field-error" aria-live="polite">
            {{ campaignNameTouched ? campaignNameValidationError : '' }}
          </span>
        </div>

        <p v-if="createError" class="create-error" role="alert">{{ createError }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-cancel" :disabled="creating" @click="closeCreateModal">
            Cancelar
          </button>
          <button
            type="submit"
            class="btn-primary"
            :disabled="creating || Boolean(campaignNameValidationError)"
          >
            <span v-if="creating" class="button-spinner" aria-hidden="true" />
            {{ creating ? 'Criando...' : 'Criar campanha' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import AppLayout from '@/layouts/AppLayout.vue'
import { automationService, type Automation } from '@/services/automation.service'

const campaigns = ref<Automation[]>([])
const loading = ref(true)
const loadError = ref(false)
const createModalOpen = ref(false)
const campaignName = ref('')
const campaignNameTouched = ref(false)
const campaignNameInput = ref<HTMLInputElement | null>(null)
const creating = ref(false)
const createError = ref('')
const successMessage = ref('')

const campaignNameValidationError = computed(() => {
  const name = campaignName.value.trim()

  if (!name) return 'O nome da campanha é obrigatório.'
  if (name.length > 120) return 'O nome da campanha deve ter no máximo 120 caracteres.'

  return ''
})

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

function resetCreateForm() {
  campaignName.value = ''
  campaignNameTouched.value = false
  createError.value = ''
}

async function openCreateModal() {
  successMessage.value = ''
  resetCreateForm()
  createModalOpen.value = true
  await nextTick()
  campaignNameInput.value?.focus()
}

function closeCreateModal() {
  if (creating.value) return

  createModalOpen.value = false
  resetCreateForm()
}

async function createCampaign() {
  if (creating.value) return

  campaignNameTouched.value = true
  if (campaignNameValidationError.value) return

  creating.value = true
  createError.value = ''

  try {
    const campaign = await automationService.createCampaign({
      name: campaignName.value.trim(),
    })

    campaigns.value = [campaign, ...campaigns.value]
    createModalOpen.value = false
    resetCreateForm()
    successMessage.value = `Campanha “${campaign.name}” criada com sucesso.`
  } catch (error) {
    createError.value = isAxiosError(error) && error.response?.status === 409
      ? 'Já existe uma campanha com esse nome.'
      : 'Não foi possível criar a campanha. Tente novamente.'
  } finally {
    creating.value = false
  }
}

onMounted(loadCampaigns)
</script>

<style scoped>
.success-feedback {
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.625rem;
  color: var(--success);
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.25);
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

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

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled,
.btn-cancel:disabled,
.modal-close:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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
  text-decoration: none;
}

.btn-secondary:hover {
  color: var(--text-primary);
  background: var(--brand-subtle);
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 480px;
  padding: 1.5rem;
  background: var(--sidebar-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  box-shadow: var(--card-shadow);
  animation: modalIn 0.2s ease both;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.modal-header h2 {
  color: var(--text-primary);
  font-size: 1.2rem;
}

.modal-header p {
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 0.85rem;
}

.modal-close {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 9px;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.modal-close:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--nav-hover);
}

.modal-form {
  margin-top: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-field label {
  margin-bottom: 0.45rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
}

.form-field input {
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1.5px solid var(--input-border);
  border-radius: 10px;
  outline: none;
  color: var(--text-primary);
  background: var(--input-bg);
  font: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-field input:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.form-field input[aria-invalid='true'] {
  border-color: var(--error);
}

.form-field input::placeholder {
  color: var(--text-muted);
}

.form-field input:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.field-error {
  min-height: 1.25rem;
  margin-top: 0.35rem;
  color: var(--error);
  font-size: 0.78rem;
}

.create-error {
  margin-top: 0.75rem;
  padding: 0.7rem 0.8rem;
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 9px;
  font-size: 0.8rem;
}

.modal-actions {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  padding: 0.65rem 1rem;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  color: var(--text-secondary);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.btn-cancel:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--nav-hover);
}

.button-spinner {
  width: 15px;
  height: 15px;
  margin-right: 0.5rem;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 720px) {
  .section-heading,
  .campaign-card-footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>

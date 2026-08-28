<template>
  <AppLayout
    title="Configurações"
    subtitle="Gerencie as preferências de comunicação da sua empresa."
  >
    <div v-if="state.successMessage" class="success-feedback" role="status" aria-live="polite">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      {{ state.successMessage }}
    </div>

    <section v-if="state.loading" class="state-card" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando configurações...</p>
    </section>

    <section v-else-if="state.loadError" class="state-card error-state" role="alert">
      <span class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </span>
      <h2>Não foi possível carregar as configurações.</h2>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn-primary" @click="loadPolicy">Tentar novamente</button>
    </section>

    <section v-else-if="state.policy" class="settings-card" aria-labelledby="opt-out-setting-title">
      <div class="setting-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M8 10h8"/><path d="M8 14h5"/></svg>
      </div>

      <div class="setting-content">
        <div class="setting-heading">
          <div>
            <h2 id="opt-out-setting-title">Instrução de cancelamento</h2>
            <p id="opt-out-setting-description">
              Adiciona automaticamente ao final das mensagens: “Para não receber mais mensagens, responda PARAR.”
            </p>
          </div>

          <label class="switch-control" for="include-opt-out-instructions">
            <input
              id="include-opt-out-instructions"
              type="checkbox"
              role="switch"
              :checked="state.policy.includeOptOutInstructions"
              :disabled="toggleDisabled"
              aria-describedby="opt-out-setting-description opt-out-setting-status"
              @click.prevent="handleToggle"
            >
            <span class="switch-track" aria-hidden="true"><span class="switch-thumb" /></span>
            <span class="switch-label">Incluir instrução de cancelamento</span>
          </label>
        </div>

        <div
          id="opt-out-setting-status"
          class="policy-status"
          :class="state.policy.includeOptOutInstructions ? 'enabled' : 'disabled'"
        >
          <strong>{{ state.policy.includeOptOutInstructions ? 'Instrução automática habilitada' : 'Instrução automática desabilitada' }}</strong>
          <span>
            {{ state.policy.includeOptOutInstructions
              ? 'A instrução será incluída automaticamente nas mensagens.'
              : 'A empresa optou por não adicionar automaticamente a instrução.' }}
          </span>
        </div>

        <p v-if="profileLoading" class="permission-note">Verificando permissões...</p>
        <p v-else-if="!canEdit" class="permission-note readonly-note">
          Somente proprietários e gestores podem alterar esta configuração. Seu acesso é somente leitura.
        </p>
        <p v-if="state.actionError && !state.disableModalOpen" class="action-error" role="alert">
          {{ state.actionError }}
        </p>
      </div>
    </section>

    <WhatsappChannelsSettings
      :role="currentRole"
      :profile-loading="profileLoading"
    />
  </AppLayout>

  <OptOutInstructionsConfirmModal
    :open="state.disableModalOpen"
    :declaration="state.policy?.optOutInstructionsDeclaration ?? null"
    :acknowledged="state.responsibilityAcknowledged"
    :can-confirm="controller.canConfirmDisable()"
    :loading="state.saving"
    :error="state.actionError"
    @acknowledge="controller.setResponsibilityAcknowledged"
    @close="controller.cancelDisable"
    @confirm="confirmDisable"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import OptOutInstructionsConfirmModal from '@/components/settings/OptOutInstructionsConfirmModal.vue'
import WhatsappChannelsSettings from '@/components/settings/WhatsappChannelsSettings.vue'
import { useAuthStore } from '@/store/auth.store'
import { messagingPolicyService } from '@/services/messaging-policy.service'
import {
  canManageMessagingPolicy,
  createMessagingPolicyController,
  emptyMessagingPolicyState,
} from '@/features/messaging-policy/messaging-policy.logic'

const authStore = useAuthStore()
const state = reactive(emptyMessagingPolicyState())
const controller = createMessagingPolicyController(messagingPolicyService, state)
const profileLoading = ref(true)

const currentRole = computed(() => authStore.profile?.role)
const canEdit = computed(() => canManageMessagingPolicy(currentRole.value))
const toggleDisabled = computed(() => state.saving || profileLoading.value || !canEdit.value)

function loadPolicy() {
  void controller.load()
}

function handleToggle() {
  if (!state.policy || toggleDisabled.value) return
  void controller.requestChange(!state.policy.includeOptOutInstructions, currentRole.value)
}

function confirmDisable() {
  void controller.confirmDisable(currentRole.value)
}

onMounted(() => {
  loadPolicy()
  void authStore.ensureProfile()
    .catch(() => null)
    .finally(() => {
      profileLoading.value = false
    })
})
</script>

<style scoped>
.success-feedback { padding: .875rem 1rem; display: flex; align-items: center; gap: .625rem; color: var(--success); background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 12px; font-size: .875rem; font-weight: 500; }
.state-card { min-height: 300px; padding: 3rem 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--card-bg); border: 1px dashed var(--card-border); border-radius: 20px; }
.state-card h2 { margin-top: 1rem; color: var(--text-primary); font-size: 1.15rem; }
.state-card p { max-width: 420px; margin-top: .45rem; color: var(--text-muted); font-size: .84rem; line-height: 1.5; }
.state-icon { width: 58px; height: 58px; display: grid; place-items: center; color: var(--error); background: rgba(239,68,68,.1); border-radius: 16px; }
.state-card .btn-primary { margin-top: 1.25rem; }
.spinner { width: 30px; height: 30px; border: 3px solid var(--card-border); border-top-color: var(--brand); border-radius: 50%; animation: spin .75s linear infinite; }
.settings-card { padding: 1.5rem; display: flex; align-items: flex-start; gap: 1rem; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.setting-icon { width: 48px; height: 48px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 13px; }
.setting-content { min-width: 0; flex: 1; }
.setting-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; }
.setting-heading h2 { color: var(--text-primary); font-size: 1.05rem; }
.setting-heading p { max-width: 620px; margin-top: .35rem; color: var(--text-muted); font-size: .82rem; line-height: 1.55; }
.switch-control { min-width: 210px; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .65rem; color: var(--text-secondary); font-size: .78rem; font-weight: 600; cursor: pointer; }
.switch-control input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.switch-track { width: 42px; height: 24px; padding: 3px; display: block; background: rgba(148,163,184,.25); border: 1px solid var(--card-border); border-radius: 999px; transition: background .2s; }
.switch-thumb { width: 16px; height: 16px; display: block; background: var(--text-muted); border-radius: 50%; transition: transform .2s, background .2s; }
.switch-control input:checked + .switch-track { background: rgba(124,58,237,.55); }
.switch-control input:checked + .switch-track .switch-thumb { transform: translateX(18px); background: #fff; }
.switch-control input:focus-visible + .switch-track { outline: 2px solid var(--brand-light); outline-offset: 2px; }
.switch-control input:disabled + .switch-track, .switch-control input:disabled ~ .switch-label { cursor: not-allowed; opacity: .55; }
.policy-status { margin-top: 1.25rem; padding: .9rem 1rem; display: grid; gap: .2rem; border-radius: 11px; }
.policy-status strong { font-size: .8rem; }
.policy-status span { color: var(--text-muted); font-size: .76rem; }
.policy-status.enabled { color: var(--success); background: rgba(34,197,94,.08); border: 1px solid rgba(34,197,94,.2); }
.policy-status.disabled { color: #fbbf24; background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.2); }
.permission-note { margin-top: 1rem; color: var(--text-muted); font-size: .76rem; }
.readonly-note { padding-left: .7rem; border-left: 2px solid var(--card-border); }
.action-error { margin-top: 1rem; color: var(--error); font-size: .82rem; }
.btn-primary { padding: .65rem 1rem; color: #fff; background: var(--gradient-brand); border: none; border-radius: 10px; font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .settings-card { flex-direction: column; } .setting-heading { width: 100%; flex-direction: column; gap: 1.25rem; } .switch-control { min-width: 0; } }
</style>

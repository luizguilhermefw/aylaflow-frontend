<template>
  <AppLayout
    title="Configurações"
    subtitle="Gerencie a aparência e as preferências de comunicação da sua empresa."
  >
    <section class="settings-card appearance-card" aria-labelledby="appearance-setting-title">
      <div class="setting-icon" aria-hidden="true">
        <AppIcon name="appearance" :size="24" />
      </div>

      <div class="setting-content">
        <div class="setting-heading">
          <div>
            <h2 id="appearance-setting-title">Aparência</h2>
            <p id="appearance-setting-description">
              Personalize como o AylaFlow é exibido para você.
            </p>
          </div>
        </div>

        <fieldset class="theme-options" aria-describedby="appearance-setting-description">
          <legend>Tema</legend>
          <label class="theme-option" :class="{ selected: themePreference === 'light' }">
            <input
              type="radio"
              name="theme-preference"
              value="light"
              :checked="themePreference === 'light'"
              @change="chooseTheme('light')"
            >
            <span>
              <strong>Claro</strong>
              <small>Superfícies claras e contraste suave.</small>
            </span>
          </label>
          <label class="theme-option" :class="{ selected: themePreference === 'dark' }">
            <input
              type="radio"
              name="theme-preference"
              value="dark"
              :checked="themePreference === 'dark'"
              @change="chooseTheme('dark')"
            >
            <span>
              <strong>Escuro</strong>
              <small>Superfícies escuras com destaque turquesa.</small>
            </span>
          </label>
        </fieldset>
      </div>
    </section>

    <div v-if="state.successMessage" class="success-feedback" role="status" aria-live="polite">
      <AppIcon name="confirm" :size="18" />
      {{ state.successMessage }}
    </div>

    <section v-if="state.loading" class="state-card" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando configurações...</p>
    </section>

    <section v-else-if="state.loadError" class="state-card error-state" role="alert">
      <span class="state-icon" aria-hidden="true">
        <AppIcon name="alert" :size="24" />
      </span>
      <h2>Não foi possível carregar as configurações.</h2>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn-primary" @click="loadPolicy">Tentar novamente</button>
    </section>

    <section v-else-if="state.policy" class="settings-card" aria-labelledby="opt-out-setting-title">
      <div class="setting-icon" aria-hidden="true">
        <AppIcon name="optOut" :size="24" />
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
import AppIcon from '@/components/ui/AppIcon.vue'
import OptOutInstructionsConfirmModal from '@/components/settings/OptOutInstructionsConfirmModal.vue'
import WhatsappChannelsSettings from '@/components/settings/WhatsappChannelsSettings.vue'
import { useAuthStore } from '@/store/auth.store'
import { messagingPolicyService } from '@/services/messaging-policy.service'
import {
  canManageMessagingPolicy,
  createMessagingPolicyController,
  emptyMessagingPolicyState,
} from '@/features/messaging-policy/messaging-policy.logic'
import {
  setThemePreference,
  themePreference,
  type ThemePreference,
} from '@/features/theme/theme.logic'

const authStore = useAuthStore()
const state = reactive(emptyMessagingPolicyState())
const controller = createMessagingPolicyController(messagingPolicyService, state)
const profileLoading = ref(true)

const currentRole = computed(() => authStore.profile?.role)
const canEdit = computed(() => canManageMessagingPolicy(currentRole.value))
const toggleDisabled = computed(() => state.saving || profileLoading.value || !canEdit.value)

function chooseTheme(theme: ThemePreference) {
  setThemePreference(theme)
}

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
.appearance-card { border-color: var(--brand-border); }
.setting-icon { width: 48px; height: 48px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 13px; }
.setting-content { min-width: 0; flex: 1; }
.setting-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 2rem; }
.setting-heading h2 { color: var(--text-primary); font-size: 1.05rem; }
.setting-heading p { max-width: 620px; margin-top: .35rem; color: var(--text-muted); font-size: .82rem; line-height: 1.55; }
.theme-options { margin-top: 1.25rem; display: grid; grid-template-columns: repeat(2, minmax(0, 220px)); gap: .75rem; border: 0; }
.theme-options legend { margin-bottom: .55rem; color: var(--text-secondary); font-size: .75rem; font-weight: 700; }
.theme-option { min-height: 76px; padding: .85rem; display: flex; align-items: flex-start; gap: .7rem; color: var(--text-secondary); background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 12px; cursor: pointer; transition: border-color .15s, background .15s, box-shadow .15s; }
.theme-option:hover { border-color: var(--brand-border); background: var(--surface-hover); }
.theme-option.selected { color: var(--text-primary); background: var(--brand-subtle); border-color: var(--brand); box-shadow: 0 0 0 1px var(--brand-border); }
.theme-option input { margin-top: .15rem; accent-color: var(--brand); }
.theme-option span { display: grid; gap: .2rem; }
.theme-option strong { font-size: .84rem; }
.theme-option small { color: var(--text-muted); font-size: .73rem; line-height: 1.4; }
.switch-control { min-width: 210px; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: .65rem; color: var(--text-secondary); font-size: .78rem; font-weight: 600; cursor: pointer; }
.switch-control input { position: absolute; width: 1px; height: 1px; opacity: 0; }
.switch-track { width: 42px; height: 24px; padding: 3px; display: block; background: rgba(148,163,184,.25); border: 1px solid var(--card-border); border-radius: 999px; transition: background .2s; }
.switch-thumb { width: 16px; height: 16px; display: block; background: var(--text-muted); border-radius: 50%; transition: transform .2s, background .2s; }
.switch-control input:checked + .switch-track { background: var(--brand); }
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
.btn-primary { padding: .65rem 1rem; color: var(--text-on-brand); background: var(--gradient-brand); border: none; border-radius: 10px; font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 760px) { .settings-card { flex-direction: column; } .setting-heading { width: 100%; flex-direction: column; gap: 1.25rem; } .switch-control { min-width: 0; } .theme-options { width: 100%; grid-template-columns: 1fr; } }
</style>

<template>
  <div v-if="open" class="modal-backdrop" @click.self="close">
    <section
      class="form-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="automation-form-title"
    >
      <div class="modal-heading">
        <div>
          <h2 id="automation-form-title">
            {{ mode === 'create' ? 'Nova automação' : 'Editar automação' }}
          </h2>
          <p>Configure somente os campos suportados para esta automação.</p>
        </div>
        <button type="button" class="close-button" aria-label="Fechar" :disabled="saving" @click="close">
          ×
        </button>
      </div>

      <form novalidate @submit.prevent="submit">
        <div v-if="mode === 'create' || capabilities.name" class="form-group">
          <label for="automation-name">Nome</label>
          <input
            id="automation-name"
            v-model="form.name"
            type="text"
            autocomplete="off"
            :disabled="saving"
            :aria-invalid="Boolean(errors.name)"
            :aria-describedby="errors.name ? 'automation-name-error' : undefined"
          >
          <span v-if="errors.name" id="automation-name-error" class="field-error">{{ errors.name }}</span>
        </div>

        <div v-if="mode === 'create'" class="form-group">
          <label for="automation-type">Tipo</label>
          <select
            id="automation-type"
            v-model="form.type"
            :disabled="saving"
            :aria-invalid="Boolean(errors.type)"
            :aria-describedby="errors.type ? 'automation-type-error' : undefined"
          >
            <option value="" disabled>Selecione um tipo</option>
            <option value="REACTIVATION">Reativação</option>
            <option value="BIRTHDAY">Aniversário</option>
            <option value="MAINTENANCE">Manutenção</option>
          </select>
          <span v-if="errors.type" id="automation-type-error" class="field-error">{{ errors.type }}</span>
        </div>

        <div v-if="mode === 'create' || capabilities.messagingChannelId" class="form-group">
          <label for="automation-whatsapp-channel">Canal WhatsApp</label>
          <select
            id="automation-whatsapp-channel"
            v-model="form.messagingChannelId"
            :disabled="channelSelectionDisabled"
            :aria-invalid="Boolean(errors.messagingChannelId)"
            :aria-describedby="errors.messagingChannelId
              ? 'automation-whatsapp-channel-error'
              : 'automation-whatsapp-channel-hint'"
          >
            <option value="" disabled>Selecione um canal</option>
            <option
              v-for="option in channelOptions"
              :key="option.id"
              :value="option.id"
              :disabled="option.disabled"
            >
              {{ option.label }}
            </option>
          </select>
          <span
            v-if="errors.messagingChannelId"
            id="automation-whatsapp-channel-error"
            class="field-error"
          >
            {{ errors.messagingChannelId }}
          </span>
          <span
            v-else
            id="automation-whatsapp-channel-hint"
            class="field-hint"
            :class="{ 'hint-error': channelsError }"
          >
            {{ channelHint }}
          </span>
          <button
            v-if="channelsError"
            type="button"
            class="retry-channels-button"
            :disabled="saving || channelsLoading"
            @click="$emit('retry-channels')"
          >
            Tentar carregar canais novamente
          </button>
        </div>

        <div v-if="mode === 'create' || capabilities.daysAfter" class="form-group">
          <label for="automation-days">Dias após</label>
          <input
            id="automation-days"
            v-model="form.daysAfter"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            :disabled="saving"
            :aria-invalid="Boolean(errors.daysAfter)"
            :aria-describedby="errors.daysAfter ? 'automation-days-error' : undefined"
          >
          <span v-if="errors.daysAfter" id="automation-days-error" class="field-error">{{ errors.daysAfter }}</span>
        </div>

        <div v-if="mode === 'create' || capabilities.message" class="form-group">
          <label for="automation-message">Mensagem</label>
          <textarea
            id="automation-message"
            v-model="form.message"
            rows="5"
            :disabled="saving"
            :aria-invalid="Boolean(errors.message)"
            :aria-describedby="errors.message ? 'automation-message-error' : undefined"
          />
          <span v-if="errors.message" id="automation-message-error" class="field-error">{{ errors.message }}</span>
        </div>

        <div v-if="mode === 'create' || capabilities.cooldownHours" class="form-group">
          <label for="automation-cooldown">Intervalo mínimo em horas</label>
          <input
            id="automation-cooldown"
            v-model="form.cooldownHours"
            type="number"
            min="1"
            step="1"
            inputmode="numeric"
            :disabled="saving"
            :aria-invalid="Boolean(errors.cooldownHours)"
            :aria-describedby="errors.cooldownHours ? 'automation-cooldown-error' : undefined"
          >
          <span v-if="errors.cooldownHours" id="automation-cooldown-error" class="field-error">{{ errors.cooldownHours }}</span>
        </div>

        <p v-if="serverError" class="form-error" role="alert">{{ serverError }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" :disabled="saving" @click="close">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="button-spinner" aria-hidden="true" />
            {{ saving ? 'Salvando...' : mode === 'create' ? 'Criar automação' : 'Salvar alterações' }}
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import type { Automation } from '@/services/automation.service'
import type { WhatsappChannel } from '@/services/whatsapp-channel.service'
import {
  automationChannelOptions,
  automationEditCapabilities,
  automationFormFromAutomation,
  emptyAutomationForm,
  eligibleWhatsappChannels,
  initialWhatsappChannelIdForCreate,
  validateAutomationForm,
  type AutomationFormErrors,
  type AutomationFormMode,
  type AutomationFormValues,
} from './automation-management.logic'

const props = defineProps<{
  open: boolean
  mode: AutomationFormMode
  automation: Automation | null
  saving: boolean
  serverError: string
  channels: WhatsappChannel[]
  channelsLoading: boolean
  channelsError: boolean
}>()

const emit = defineEmits<{
  close: []
  'retry-channels': []
  submit: [form: AutomationFormValues]
}>()

const form = reactive<AutomationFormValues>(emptyAutomationForm())
const errors = reactive<AutomationFormErrors>({})
const capabilities = computed(() => (
  props.automation
    ? automationEditCapabilities(props.automation)
    : {
        name: true,
        message: true,
        daysAfter: true,
        cooldownHours: true,
        messagingChannelId: true,
      }
))
const eligibleChannels = computed(() => eligibleWhatsappChannels(props.channels))
const channelOptions = computed(() => automationChannelOptions(
  props.channels,
  props.mode === 'edit' ? form.messagingChannelId || null : null,
))
const channelSelectionDisabled = computed(() => (
  props.saving
  || props.channelsLoading
  || props.channelsError
  || eligibleChannels.value.length === 0
))
const channelHint = computed(() => {
  if (props.channelsLoading) return 'Carregando canais WhatsApp...'
  if (props.channelsError) return 'Não foi possível carregar os canais WhatsApp. Tente novamente.'
  if (eligibleChannels.value.length === 0) return 'Não há canal habilitado para envios.'
  if (
    props.mode === 'edit'
    && form.messagingChannelId
    && !eligibleChannels.value.some((channel) => channel.id === form.messagingChannelId)
  ) {
    return 'O canal atual está indisponível para novos envios. Escolha outro canal habilitado.'
  }
  return 'Somente canais com routing ativo estão disponíveis para nova seleção.'
})

watch(
  () => [props.open, props.automation] as const,
  ([open]) => {
    if (!open) return
    Object.assign(form, props.automation
      ? automationFormFromAutomation(props.automation)
      : emptyAutomationForm())
    clearErrors()
  },
  { immediate: true },
)

watch(
  () => [props.open, props.mode, props.channels] as const,
  ([open, mode]) => {
    if (!open || mode !== 'create' || form.messagingChannelId) return
    form.messagingChannelId = initialWhatsappChannelIdForCreate(props.channels)
  },
  { immediate: true },
)

function clearErrors() {
  for (const key of Object.keys(errors) as Array<keyof AutomationFormErrors>) delete errors[key]
}

function close() {
  if (!props.saving) emit('close')
}

function submit() {
  if (props.saving) return
  clearErrors()
  Object.assign(errors, validateAutomationForm(form, props.mode, props.automation))
  if (Object.keys(errors).length > 0) return
  emit('submit', { ...form })
}
</script>

<style scoped>
.modal-backdrop { position: fixed; inset: 0; z-index: 100; padding: 1.5rem; display: flex; align-items: center; justify-content: center; overflow-y: auto; background: rgba(0,0,0,.72); backdrop-filter: blur(4px); }
.form-modal { width: min(100%, 560px); max-height: calc(100vh - 3rem); padding: 1.5rem; overflow-y: auto; background: var(--sidebar-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.modal-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.modal-heading h2 { color: var(--text-primary); font-size: 1.15rem; }
.modal-heading p { margin-top: .35rem; color: var(--text-muted); font-size: .78rem; }
.close-button { width: 32px; height: 32px; flex: 0 0 auto; color: var(--text-muted); background: transparent; border: 1px solid var(--card-border); border-radius: 8px; font: inherit; font-size: 1.25rem; cursor: pointer; }
form { margin-top: 1.25rem; display: grid; gap: 1rem; }
.form-group { display: grid; gap: .42rem; }
label { color: var(--text-secondary); font-size: .78rem; font-weight: 600; }
input, select, textarea { width: 100%; padding: .72rem .8rem; color: var(--text-primary); background: var(--input-bg); border: 1px solid var(--input-border); border-radius: 10px; font: inherit; font-size: .84rem; }
select { color-scheme: dark; }
select option { color: #f1f0f5; background-color: #13131a; }
select option:checked { color: #fff; background-color: #4c1d95; }
select option:disabled { color: #a49db8; background-color: #13131a; }
textarea { resize: vertical; line-height: 1.5; }
input:focus, select:focus, textarea:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-subtle); }
[aria-invalid="true"] { border-color: var(--error); }
.field-error, .field-hint, .form-error { font-size: .74rem; }
.field-error, .hint-error, .form-error { color: var(--error); }
.field-hint { color: var(--text-muted); line-height: 1.45; }
.retry-channels-button { justify-self: start; padding: 0; color: var(--brand-light); background: transparent; border: 0; font: inherit; font-size: .74rem; font-weight: 600; cursor: pointer; }
.form-error { padding: .75rem; background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 9px; }
.modal-actions { margin-top: .5rem; display: flex; justify-content: flex-end; gap: .75rem; }
.btn-primary, .btn-secondary { padding: .65rem 1rem; border-radius: 10px; font: inherit; font-size: .84rem; font-weight: 600; cursor: pointer; }
.btn-primary { display: inline-flex; align-items: center; justify-content: center; border: none; color: #fff; background: var(--gradient-brand); }
.btn-secondary { color: var(--text-secondary); background: transparent; border: 1px solid var(--card-border); }
button:disabled, input:disabled, select:disabled, textarea:disabled { cursor: not-allowed; opacity: .55; }
button:focus-visible { outline: 2px solid var(--brand-light); outline-offset: 2px; }
.button-spinner { width: 15px; height: 15px; margin-right: .5rem; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 520px) { .modal-backdrop { padding: .75rem; } .form-modal { max-height: calc(100vh - 1.5rem); } .modal-actions { flex-direction: column-reverse; } }
</style>

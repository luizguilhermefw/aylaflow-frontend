<template>
  <div v-if="open" class="modal-backdrop" @click.self="requestClose">
    <div class="modal" role="dialog" aria-modal="true" :aria-labelledby="titleId">
      <div class="modal-header">
        <div>
          <h2 :id="titleId">{{ mode === 'create' ? 'Novo contato' : 'Editar contato' }}</h2>
          <p>Informe os dados de perfil usados nas automações e segmentações.</p>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Fechar"
          :disabled="saving"
          @click="requestClose"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/></svg>
        </button>
      </div>

      <form class="contact-form" novalidate @submit.prevent="submitForm">
        <div class="form-grid">
          <div class="form-field form-field-wide">
            <label for="contact-name">Nome <span aria-hidden="true">*</span></label>
            <input
              id="contact-name"
              ref="nameInput"
              v-model="form.name"
              type="text"
              autocomplete="name"
              maxlength="160"
              :disabled="saving"
              :aria-invalid="Boolean(errors.name)"
              :aria-describedby="errors.name ? 'contact-name-error' : undefined"
              @input="clearFieldError('name')"
            />
            <span id="contact-name-error" class="field-error" aria-live="polite">{{ errors.name }}</span>
          </div>

          <div class="form-field form-field-wide">
            <label for="contact-phone">Telefone <span aria-hidden="true">*</span></label>
            <input
              id="contact-phone"
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              autocomplete="tel"
              placeholder="(11) 99999-9999"
              :disabled="saving"
              :aria-invalid="Boolean(errors.phone)"
              :aria-describedby="errors.phone ? 'contact-phone-error' : undefined"
              @input="clearFieldError('phone')"
            />
            <span id="contact-phone-error" class="field-error" aria-live="polite">{{ errors.phone }}</span>
          </div>

          <div class="form-field">
            <label for="contact-gender">Gênero</label>
            <select id="contact-gender" v-model="form.gender" :disabled="saving">
              <option value="UNSPECIFIED">Não informado</option>
              <option value="FEMALE">Feminino</option>
              <option value="MALE">Masculino</option>
            </select>
          </div>

          <div class="form-field">
            <label for="contact-state">UF</label>
            <select
              id="contact-state"
              v-model="form.state"
              :disabled="saving"
              :aria-invalid="Boolean(errors.state)"
              :aria-describedby="errors.state ? 'contact-state-error' : undefined"
              @change="clearFieldError('state')"
            >
              <option value="">Não informada</option>
              <option v-for="state in BRAZILIAN_STATES" :key="state" :value="state">{{ state }}</option>
            </select>
            <span id="contact-state-error" class="field-error" aria-live="polite">{{ errors.state }}</span>
          </div>

          <div class="form-field form-field-wide">
            <label for="contact-city">Cidade</label>
            <input
              id="contact-city"
              v-model="form.city"
              type="text"
              autocomplete="address-level2"
              maxlength="120"
              :disabled="saving"
            />
            <span class="field-error" aria-hidden="true" />
          </div>

          <div class="form-field">
            <label for="contact-birth-date">Data de nascimento</label>
            <input
              id="contact-birth-date"
              v-model="form.birthDate"
              type="date"
              :disabled="saving"
              :aria-invalid="Boolean(errors.birthDate)"
              :aria-describedby="errors.birthDate ? 'contact-birth-date-error' : undefined"
              @input="clearFieldError('birthDate')"
            />
            <span id="contact-birth-date-error" class="field-error" aria-live="polite">{{ errors.birthDate }}</span>
          </div>

          <div class="form-field">
            <label for="contact-last-purchase">Data da última compra</label>
            <input id="contact-last-purchase" v-model="form.lastPurchaseDate" type="date" :disabled="saving" />
            <span class="field-error" aria-hidden="true" />
          </div>
        </div>

        <p v-if="serverError" class="form-error" role="alert">{{ serverError }}</p>

        <div class="modal-actions">
          <button type="button" class="btn-secondary" :disabled="saving" @click="requestClose">Cancelar</button>
          <button type="submit" class="btn-primary" :disabled="saving">
            <span v-if="saving" class="button-spinner" aria-hidden="true" />
            {{ saving ? 'Salvando...' : mode === 'create' ? 'Criar contato' : 'Salvar alterações' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue'
import {
  BRAZILIAN_STATES,
  contactToForm,
  emptyContactForm,
  validateContactForm,
} from '@/features/contacts/contact.logic'
import type {
  ContactFormErrors,
  ContactFormValues,
  Customer,
} from '@/features/contacts/contact.types'

const props = defineProps<{
  open: boolean
  mode: 'create' | 'edit'
  customer: Customer | null
  saving: boolean
  serverError: string
  serverFieldErrors: ContactFormErrors
}>()

const emit = defineEmits<{
  close: []
  submit: [values: ContactFormValues]
  'clear-error': []
}>()

const titleId = 'contact-form-title'
const nameInput = ref<HTMLInputElement | null>(null)
const form = reactive<ContactFormValues>(emptyContactForm())
const errors = reactive<ContactFormErrors>({})

function clearFormErrors() {
  for (const key of Object.keys(errors) as Array<keyof ContactFormValues>) {
    delete errors[key]
  }
}

function resetForm() {
  Object.assign(form, props.customer ? contactToForm(props.customer) : emptyContactForm())
  clearFormErrors()
}

watch(
  () => [props.open, props.customer] as const,
  async ([open]) => {
    if (!open) return
    resetForm()
    await nextTick()
    nameInput.value?.focus()
  },
)

watch(
  () => props.serverFieldErrors,
  (serverFieldErrors) => {
    Object.assign(errors, serverFieldErrors)
  },
  { deep: true },
)

function clearFieldError(field: keyof ContactFormValues) {
  delete errors[field]
  emit('clear-error')
}

function requestClose() {
  if (!props.saving) emit('close')
}

function submitForm() {
  clearFormErrors()
  Object.assign(errors, validateContactForm(form, {
    originalBirthDate: props.mode === 'edit' ? props.customer?.birthDate : null,
  }))
  if (Object.keys(errors).length > 0) return
  emit('submit', { ...form })
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  background: var(--overlay-bg);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 680px;
  max-height: calc(100vh - 3rem);
  padding: 1.5rem;
  overflow-y: auto;
  background: var(--sidebar-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  box-shadow: var(--card-shadow);
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.modal-header h2 { color: var(--text-primary); font-size: 1.2rem; }
.modal-header p { margin-top: 0.35rem; color: var(--text-muted); font-size: 0.85rem; }

.icon-button {
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 9px;
  color: var(--text-muted);
  background: transparent;
  cursor: pointer;
}

.icon-button:hover:not(:disabled) { color: var(--text-primary); background: var(--nav-hover); }
.icon-button:disabled, .btn-primary:disabled, .btn-secondary:disabled { cursor: not-allowed; opacity: 0.55; }

.contact-form { margin-top: 1.5rem; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 1rem; }
.form-field { display: flex; flex-direction: column; }
.form-field-wide { grid-column: span 2; }

.form-field label {
  margin-bottom: 0.45rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 600;
}

.form-field input,
.form-field select {
  width: 100%;
  min-height: 44px;
  padding: 0.7rem 0.8rem;
  border: 1.5px solid var(--input-border);
  border-radius: 10px;
  outline: none;
  color: var(--text-primary);
  background: var(--input-bg);
  color-scheme: var(--native-control-color-scheme);
  font: inherit;
}

.form-field input:focus,
.form-field select:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--brand-glow); }
.form-field select option {
  color: var(--text-primary);
  background: var(--sidebar-bg);
}
.form-field select option:checked { color: var(--text-on-brand); background: var(--brand); }
.form-field select option:hover { color: var(--text-on-brand); background: var(--brand); }
.form-field input[type='date']::-webkit-calendar-picker-indicator {
  cursor: pointer;
  filter: invert(78%) sepia(8%) saturate(691%) hue-rotate(211deg) brightness(90%);
}
.form-field input[aria-invalid='true'], .form-field select[aria-invalid='true'] { border-color: var(--error); }
.form-field input:disabled, .form-field select:disabled { cursor: not-allowed; opacity: 0.6; }
.field-error { min-height: 1.25rem; margin-top: 0.3rem; color: var(--error); font-size: 0.76rem; }

.form-error {
  padding: 0.75rem 0.875rem;
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 9px;
  font-size: 0.8rem;
}

.modal-actions { margin-top: 1.25rem; display: flex; justify-content: flex-end; gap: 0.75rem; }
.btn-primary, .btn-secondary { padding: 0.68rem 1rem; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
.btn-primary { display: inline-flex; align-items: center; border: none; color: var(--text-on-brand); background: var(--gradient-brand); }
.btn-secondary { border: 1px solid var(--card-border); color: var(--text-secondary); background: transparent; }
.btn-secondary:hover:not(:disabled) { color: var(--text-primary); background: var(--nav-hover); }
.button-spinner { width: 15px; height: 15px; margin-right: 0.5rem; border: 2px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 50%; animation: spin .7s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .modal-backdrop { padding: 0.75rem; align-items: flex-start; }
  .modal { max-height: calc(100vh - 1.5rem); padding: 1.25rem; }
  .form-grid { grid-template-columns: 1fr; }
  .form-field-wide { grid-column: span 1; }
  .modal-actions { align-items: stretch; flex-direction: column-reverse; }
}
</style>

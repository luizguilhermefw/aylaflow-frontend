<template>
  <main class="public-registration-page">
    <section class="registration-card" aria-labelledby="registration-title">
      <AylaFlowLogo class="public-logo" />

      <div v-if="pageState === 'loading'" class="status-state" aria-live="polite">
        <span class="spinner" aria-hidden="true" />
        <p>Carregando cadastro...</p>
      </div>

      <div v-else-if="pageState === 'unavailable'" class="status-state" role="alert">
        <h1 id="registration-title">Cadastro indisponível</h1>
        <p>Este link não está disponível no momento.</p>
      </div>

      <div v-else-if="pageState === 'error'" class="status-state" role="alert">
        <h1 id="registration-title">Não foi possível carregar o cadastro</h1>
        <p>Verifique sua conexão e tente novamente.</p>
        <button class="secondary-button" type="button" @click="loadBootstrap">
          Tentar novamente
        </button>
      </div>

      <div v-else-if="pageState === 'success'" class="status-state success-state" aria-live="polite">
        <span class="success-mark" aria-hidden="true">✓</span>
        <h1 id="registration-title">Cadastro realizado!</h1>
        <p>{{ successMessage }}</p>
      </div>

      <template v-else-if="bootstrap">
        <header class="registration-header">
          <p class="eyebrow">Cadastre-se</p>
          <h1 id="registration-title">{{ bootstrap.company.displayName }}</h1>
          <p>Preencha seus dados para manter seu cadastro atualizado.</p>
        </header>

        <form class="registration-form" novalidate @submit.prevent="submitRegistration">
          <div class="field">
            <label for="public-name">Nome completo <span aria-hidden="true">*</span></label>
            <input
              id="public-name"
              ref="nameInput"
              v-model="form.name"
              type="text"
              maxlength="120"
              autocomplete="name"
              :aria-invalid="Boolean(fieldErrors.name)"
              :aria-describedby="fieldErrors.name ? 'public-name-error' : undefined"
              :disabled="submitting"
            >
            <span v-if="fieldErrors.name" id="public-name-error" class="field-error">
              {{ fieldErrors.name }}
            </span>
          </div>

          <div class="field">
            <label for="public-preferred-name">Como prefere ser chamado</label>
            <input
              id="public-preferred-name"
              v-model="form.preferredName"
              type="text"
              maxlength="120"
              autocomplete="nickname"
              :disabled="submitting"
            >
          </div>

          <div class="field">
            <label for="public-phone">Telefone <span aria-hidden="true">*</span></label>
            <input
              id="public-phone"
              v-model="form.phone"
              type="tel"
              inputmode="tel"
              maxlength="30"
              autocomplete="tel"
              :aria-invalid="Boolean(fieldErrors.phone)"
              :aria-describedby="fieldErrors.phone ? 'public-phone-error' : undefined"
              :disabled="submitting"
            >
            <span v-if="fieldErrors.phone" id="public-phone-error" class="field-error">
              {{ fieldErrors.phone }}
            </span>
          </div>

          <div class="field">
            <label for="public-cpf">CPF <span aria-hidden="true">*</span></label>
            <input
              id="public-cpf"
              v-model="form.cpf"
              type="text"
              inputmode="numeric"
              maxlength="20"
              autocomplete="off"
              :aria-invalid="Boolean(fieldErrors.cpf)"
              :aria-describedby="fieldErrors.cpf ? 'public-cpf-error' : undefined"
              :disabled="submitting"
            >
            <span v-if="fieldErrors.cpf" id="public-cpf-error" class="field-error">
              {{ fieldErrors.cpf }}
            </span>
          </div>

          <div class="field">
            <label for="public-birth-date">Data de nascimento</label>
            <input
              id="public-birth-date"
              v-model="form.birthDate"
              type="date"
              autocomplete="bday"
              :disabled="submitting"
            >
          </div>

          <div class="field">
            <label for="public-gender">Gênero</label>
            <select id="public-gender" v-model="form.gender" :disabled="submitting">
              <option value="">Selecione</option>
              <option value="FEMALE">Feminino</option>
              <option value="MALE">Masculino</option>
              <option value="OTHER">Outro</option>
              <option value="UNSPECIFIED">Prefiro não informar</option>
            </select>
          </div>

          <div class="field">
            <label for="public-city">Cidade</label>
            <input
              id="public-city"
              v-model="form.city"
              type="text"
              maxlength="100"
              autocomplete="address-level2"
              :disabled="submitting"
            >
          </div>

          <div class="field">
            <label for="public-state">Estado</label>
            <select
              id="public-state"
              v-model="form.state"
              autocomplete="address-level1"
              :disabled="submitting"
            >
              <option value="">Selecione a UF</option>
              <option v-for="state in BRAZILIAN_STATES" :key="state" :value="state">
                {{ state }}
              </option>
            </select>
          </div>

          <fieldset v-if="bootstrap.interests.categories.length" class="interest-group">
            <legend>Categorias de interesse</legend>
            <div class="interest-options">
              <label
                v-for="option in bootstrap.interests.categories"
                :key="option.id"
                class="interest-option"
              >
                <input
                  type="checkbox"
                  :checked="selectedInterestIds.includes(option.id)"
                  :disabled="submitting || interestDisabled(option.id)"
                  @change="updateInterest(option.id, $event)"
                >
                <span>{{ option.name }}</span>
              </label>
            </div>
          </fieldset>

          <fieldset v-if="bootstrap.interests.brands.length" class="interest-group">
            <legend>Marcas de interesse</legend>
            <div class="interest-options">
              <label
                v-for="option in bootstrap.interests.brands"
                :key="option.id"
                class="interest-option"
              >
                <input
                  type="checkbox"
                  :checked="selectedInterestIds.includes(option.id)"
                  :disabled="submitting || interestDisabled(option.id)"
                  @change="updateInterest(option.id, $event)"
                >
                <span>{{ option.name }}</span>
              </label>
            </div>
          </fieldset>

          <p v-if="interestLimitReached" class="interest-limit" aria-live="polite">
            Você pode selecionar até 100 interesses.
          </p>

          <div class="consent-block">
            <label class="consent-option">
              <input v-model="form.contactConsent" type="checkbox" :disabled="submitting">
              <span>Aceito receber comunicações e ofertas desta empresa.</span>
            </label>
            <p>
              Seus dados serão utilizados pela empresa responsável por este cadastro para
              identificação, relacionamento e comunicações conforme sua autorização.
            </p>
          </div>

          <p v-if="submitError" class="submit-error" role="alert">{{ submitError }}</p>

          <button class="primary-button" type="submit" :disabled="submitting">
            <span v-if="submitting">Enviando...</span>
            <span v-else>Enviar cadastro</span>
          </button>
        </form>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import axios from 'axios'
import { computed, nextTick, onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import AylaFlowLogo from '@/components/ui/AylaFlowLogo.vue'
import {
  BRAZILIAN_STATES,
  MAX_PUBLIC_INTERESTS,
  buildPublicRegistrationPayload,
  publicRegistrationErrorMessage,
  togglePublicInterest,
  validPublicId,
  validatePublicRegistrationForm,
} from '@/features/public-registration/public-registration.logic'
import type {
  PublicRegistrationBootstrap,
  PublicRegistrationForm,
} from '@/features/public-registration/public-registration.types'
import { publicRegistrationService } from '@/services/public-registration.service'

type PageState = 'loading' | 'ready' | 'submitting' | 'success' | 'unavailable' | 'error'

const route = useRoute()
const pageState = ref<PageState>('loading')
const bootstrap = ref<PublicRegistrationBootstrap | null>(null)
const selectedInterestIds = ref<string[]>([])
const fieldErrors = ref(validatePublicRegistrationForm({
  name: 'valid',
  preferredName: '',
  phone: 'valid',
  cpf: 'valid',
  birthDate: '',
  gender: '',
  city: '',
  state: '',
  contactConsent: false,
}))
const submitError = ref('')
const successMessage = ref('Seus dados foram enviados com sucesso.')
const nameInput = ref<HTMLInputElement | null>(null)

const form = reactive<PublicRegistrationForm>({
  name: '',
  preferredName: '',
  phone: '',
  cpf: '',
  birthDate: '',
  gender: '',
  city: '',
  state: '',
  contactConsent: false,
})

const submitting = computed(() => pageState.value === 'submitting')
const interestLimitReached = computed(
  () => selectedInterestIds.value.length >= MAX_PUBLIC_INTERESTS,
)
const allowedInterestIds = computed(() => new Set([
  ...(bootstrap.value?.interests.categories ?? []).map((option) => option.id),
  ...(bootstrap.value?.interests.brands ?? []).map((option) => option.id),
]))

function currentPublicId(): string | null {
  const value = route.params.publicId
  return validPublicId(value) ? value : null
}

async function loadBootstrap() {
  const publicId = currentPublicId()
  if (!publicId) {
    pageState.value = 'unavailable'
    return
  }

  pageState.value = 'loading'
  try {
    bootstrap.value = await publicRegistrationService.getBootstrap(publicId)
    pageState.value = 'ready'
  } catch (error: unknown) {
    pageState.value = axios.isAxiosError(error) && error.response?.status === 404
      ? 'unavailable'
      : 'error'
  }
}

function interestDisabled(id: string): boolean {
  return interestLimitReached.value && !selectedInterestIds.value.includes(id)
}

function updateInterest(id: string, event: Event) {
  const input = event.target as HTMLInputElement
  selectedInterestIds.value = togglePublicInterest(
    selectedInterestIds.value,
    id,
    input.checked,
    allowedInterestIds.value,
  )
}

function clearSensitiveFormData() {
  form.name = ''
  form.preferredName = ''
  form.phone = ''
  form.cpf = ''
  form.birthDate = ''
  form.gender = ''
  form.city = ''
  form.state = ''
  form.contactConsent = false
  selectedInterestIds.value = []
}

async function submitRegistration() {
  if (submitting.value || !bootstrap.value) return

  fieldErrors.value = validatePublicRegistrationForm(form)
  submitError.value = ''
  if (Object.keys(fieldErrors.value).length) {
    await nextTick()
    nameInput.value?.focus()
    return
  }

  const publicId = currentPublicId()
  if (!publicId) {
    pageState.value = 'unavailable'
    return
  }

  pageState.value = 'submitting'
  try {
    const payload = buildPublicRegistrationPayload(
      form,
      selectedInterestIds.value,
      allowedInterestIds.value,
    )
    const result = await publicRegistrationService.submit(publicId, payload)
    successMessage.value = result.message.trim() || 'Seus dados foram enviados com sucesso.'
    clearSensitiveFormData()
    pageState.value = 'success'
  } catch (error: unknown) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined
    submitError.value = publicRegistrationErrorMessage(status)
    pageState.value = 'ready'
  }
}

onMounted(loadBootstrap)
</script>

<style scoped>
.public-registration-page {
  min-height: 100vh;
  padding: 1rem;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--bg-gradient);
}

.registration-card {
  width: 100%;
  max-width: 680px;
  margin: 1rem auto;
  padding: 1.5rem 1rem;
  border: 1px solid var(--card-border);
  border-radius: 18px;
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

.public-logo {
  --aylaflow-logo-width: 150px;
  display: block;
  margin: 0 auto 1.25rem;
}

.registration-header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.eyebrow {
  color: var(--brand-light);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.registration-header h1,
.status-state h1 {
  margin-top: 0.35rem;
  color: var(--text-primary);
  font-size: clamp(1.5rem, 6vw, 2rem);
  overflow-wrap: anywhere;
}

.registration-header p:last-child,
.status-state p {
  margin-top: 0.5rem;
  color: var(--text-secondary);
}

.registration-form,
.field {
  display: flex;
  flex-direction: column;
}

.registration-form {
  gap: 1rem;
}

.field {
  gap: 0.4rem;
}

label,
legend {
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 650;
}

input:not([type='checkbox']),
select {
  width: 100%;
  min-height: 46px;
  padding: 0.7rem 0.8rem;
  border: 1px solid var(--input-border);
  border-radius: 10px;
  background: var(--input-bg);
  color: var(--text-primary);
  font: inherit;
}

input[aria-invalid='true'] {
  border-color: var(--error);
}

input:disabled,
select:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.field-error,
.submit-error {
  color: var(--error);
  font-size: 0.82rem;
}

.submit-error {
  padding: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--error) 35%, transparent);
  border-radius: 10px;
  background: color-mix(in srgb, var(--error) 10%, transparent);
}

.interest-group {
  border: 0;
}

.interest-group legend {
  margin-bottom: 0.6rem;
}

.interest-options {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}

.interest-option {
  position: relative;
  cursor: pointer;
}

.interest-option input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  opacity: 0;
}

.interest-option span {
  display: block;
  padding: 0.55rem 0.75rem;
  border: 1px solid var(--border-default);
  border-radius: 999px;
  background: var(--bg-surface-secondary);
  color: var(--text-secondary);
  font-size: 0.84rem;
}

.interest-option input:checked + span {
  border-color: var(--brand-primary);
  background: var(--brand-subtle);
  color: var(--brand-light);
}

.interest-option input:focus-visible + span {
  outline: 2px solid var(--brand-light);
  outline-offset: 2px;
}

.interest-option input:disabled + span {
  cursor: not-allowed;
  opacity: 0.55;
}

.interest-limit {
  color: var(--text-muted);
  font-size: 0.8rem;
}

.consent-block {
  padding: 1rem;
  border-radius: 12px;
  background: var(--bg-surface-secondary);
}

.consent-option {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
  cursor: pointer;
}

.consent-option input {
  width: 18px;
  height: 18px;
  margin-top: 0.1rem;
  accent-color: var(--brand-primary);
  flex: 0 0 auto;
}

.consent-block p {
  margin: 0.7rem 0 0 1.65rem;
  color: var(--text-muted);
  font-size: 0.76rem;
}

.primary-button,
.secondary-button {
  min-height: 48px;
  border-radius: 10px;
  font: inherit;
  font-weight: 750;
  cursor: pointer;
}

.primary-button {
  width: 100%;
  border: 0;
  background: var(--gradient-brand);
  color: var(--text-on-brand);
}

.primary-button:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.secondary-button {
  margin-top: 1rem;
  padding: 0.7rem 1rem;
  border: 1px solid var(--border-default);
  background: var(--bg-surface-secondary);
  color: var(--text-primary);
}

.status-state {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.spinner {
  width: 28px;
  height: 28px;
  border: 3px solid var(--brand-spinner-track);
  border-top-color: var(--brand-primary);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.success-mark {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  background: var(--brand-subtle);
  color: var(--success);
  font-size: 1.7rem;
  font-weight: 800;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (min-width: 560px) {
  .public-registration-page {
    padding: 2rem;
  }

  .registration-card {
    margin: 2rem auto;
    padding: 2.25rem;
  }
}
</style>

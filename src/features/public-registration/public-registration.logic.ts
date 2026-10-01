import type {
  PublicRegistrationForm,
  PublicRegistrationPayload,
} from './public-registration.types'

export const MAX_PUBLIC_INTERESTS = 100

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
] as const

export type PublicRegistrationFieldErrors = Partial<Record<'name' | 'phone' | 'cpf', string>>

export function validPublicId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{43}$/.test(value)
}

export function validatePublicRegistrationForm(
  form: PublicRegistrationForm,
): PublicRegistrationFieldErrors {
  const errors: PublicRegistrationFieldErrors = {}

  if (!form.name.trim()) errors.name = 'Informe seu nome completo.'
  if (!form.phone.trim()) errors.phone = 'Informe seu telefone.'
  if (!form.cpf.trim()) errors.cpf = 'Informe seu CPF.'

  return errors
}

export function buildPublicRegistrationPayload(
  form: PublicRegistrationForm,
  selectedInterestIds: readonly string[],
  allowedInterestIds: ReadonlySet<string>,
): PublicRegistrationPayload {
  const interestOptionIds = [...new Set(selectedInterestIds)]
    .filter((id) => allowedInterestIds.has(id))
    .slice(0, MAX_PUBLIC_INTERESTS)

  const payload: PublicRegistrationPayload = {
    name: form.name.trim(),
    phone: form.phone.trim(),
    cpf: form.cpf.trim(),
    contactConsent: form.contactConsent,
    interestOptionIds,
  }

  const preferredName = form.preferredName.trim()
  const city = form.city.trim()
  if (preferredName) payload.preferredName = preferredName
  if (form.birthDate) payload.birthDate = form.birthDate
  if (form.gender) payload.gender = form.gender
  if (city) payload.city = city
  if (form.state) payload.state = form.state

  return payload
}

export function togglePublicInterest(
  selectedIds: readonly string[],
  interestId: string,
  checked: boolean,
  allowedIds: ReadonlySet<string>,
): string[] {
  if (!checked) return selectedIds.filter((id) => id !== interestId)
  if (!allowedIds.has(interestId) || selectedIds.includes(interestId)) return [...selectedIds]
  if (selectedIds.length >= MAX_PUBLIC_INTERESTS) return [...selectedIds]
  return [...selectedIds, interestId]
}

export function publicRegistrationErrorMessage(status?: number): string {
  if (status === 400) return 'Revise os dados informados e tente novamente.'
  if (status === 404) return 'Este cadastro não está mais disponível.'
  if (status === 409) return 'Não foi possível concluir o cadastro com os dados informados.'
  if (status === 429) {
    return 'Muitas tentativas foram realizadas. Aguarde alguns minutos e tente novamente.'
  }
  return 'Não foi possível concluir o cadastro agora. Tente novamente mais tarde.'
}

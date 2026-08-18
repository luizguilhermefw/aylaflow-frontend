import type { Automation, AutomationType } from '@/services/automation.service'
import type {
  CreateRecurringAutomationPayload,
  RecurringAutomationType,
  UpdateRecurringAutomationPayload,
} from './automation.repository'

export type ManagedAutomationType = RecurringAutomationType
export type AutomationFormMode = 'create' | 'edit'

export interface AutomationFormValues {
  name: string
  type: ManagedAutomationType | ''
  daysAfter: string | number
  message: string
  cooldownHours: string | number
}

export type AutomationFormErrors = Partial<Record<keyof AutomationFormValues, string>>

export interface AutomationEditCapabilities {
  name: boolean
  message: boolean
  daysAfter: boolean
  cooldownHours: boolean
}

export interface AutomationManagementRepository {
  list(): Promise<Automation[]>
  createAutomation(payload: CreateRecurringAutomationPayload): Promise<Automation>
  updateAutomation(id: string, payload: UpdateRecurringAutomationPayload): Promise<Automation>
  deleteAutomation(id: string): Promise<unknown>
}

export interface AutomationManagementState {
  automations: Automation[]
  loading: boolean
  loadError: boolean
  actionAutomation: Automation | null
  actionLoading: boolean
  actionError: string
  formSaving: boolean
  formError: string
  deleteAutomation: Automation | null
  deleteLoading: boolean
  deleteError: string
  successMessage: string
}

export const AUTOMATION_TYPE_LABELS: Record<ManagedAutomationType, string> = {
  REACTIVATION: 'Reativação',
  BIRTHDAY: 'Aniversário',
  MAINTENANCE: 'Manutenção',
}

export const EMPTY_EDIT_CAPABILITIES: AutomationEditCapabilities = {
  name: false,
  message: false,
  daysAfter: false,
  cooldownHours: false,
}

export function isManagedAutomation(
  automation: Automation,
): automation is Automation & { type: ManagedAutomationType } {
  return automation.type !== 'CAMPAIGN'
}

export function isManagedAutomationType(type: AutomationType | ''): type is ManagedAutomationType {
  return type === 'REACTIVATION' || type === 'BIRTHDAY' || type === 'MAINTENANCE'
}

export function filterManagedAutomations(automations: Automation[]): Automation[] {
  return automations.filter(isManagedAutomation)
}

export function automationTypeLabel(automation: Automation): string {
  return automation.type === 'CAMPAIGN' ? 'Campanha' : AUTOMATION_TYPE_LABELS[automation.type]
}

export function automationEditCapabilities(automation: Automation): AutomationEditCapabilities {
  if (!automation.isSystem) {
    return { name: true, message: true, daysAfter: true, cooldownHours: true }
  }
  if (automation.systemKey === 'BIRTHDAY_DEFAULT') {
    return { ...EMPTY_EDIT_CAPABILITIES, message: true }
  }
  if (automation.systemKey === 'REACTIVATION_30_DAYS') {
    return { ...EMPTY_EDIT_CAPABILITIES, message: true, daysAfter: true }
  }
  return { ...EMPTY_EDIT_CAPABILITIES }
}

export function canEditAutomation(automation: Automation): boolean {
  return Object.values(automationEditCapabilities(automation)).some(Boolean)
}

export function canDeleteAutomation(automation: Automation): boolean {
  return isManagedAutomation(automation) && !automation.isSystem
}

export function emptyAutomationForm(): AutomationFormValues {
  return { name: '', type: '', daysAfter: '', message: '', cooldownHours: '24' }
}

export function automationFormFromAutomation(automation: Automation): AutomationFormValues {
  return {
    name: automation.name,
    type: isManagedAutomation(automation) ? automation.type : '',
    daysAfter: automation.daysAfter?.toString() ?? '',
    message: automation.message ?? '',
    cooldownHours: automation.cooldownHours.toString(),
  }
}

export function positiveInteger(value: unknown): number | null {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value >= 1 ? value : null
  }
  if (typeof value !== 'string') return null
  const normalized = value.trim()
  if (!/^\d+$/.test(normalized)) return null
  const parsed = Number(normalized)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed : null
}

export function validateAutomationForm(
  form: AutomationFormValues,
  mode: AutomationFormMode,
  automation: Automation | null = null,
): AutomationFormErrors {
  const capabilities = mode === 'create'
    ? { name: true, message: true, daysAfter: true, cooldownHours: true }
    : automation ? automationEditCapabilities(automation) : EMPTY_EDIT_CAPABILITIES
  const errors: AutomationFormErrors = {}

  if (capabilities.name && !form.name.trim()) errors.name = 'Informe o nome da automação.'
  if (mode === 'create' && !isManagedAutomationType(form.type)) {
    errors.type = 'Selecione um tipo de automação válido.'
  }
  if (capabilities.daysAfter && positiveInteger(form.daysAfter) === null) {
    errors.daysAfter = 'Informe um número inteiro maior ou igual a 1.'
  }
  if (capabilities.message && !form.message.trim()) errors.message = 'Informe a mensagem da automação.'
  if (capabilities.cooldownHours && positiveInteger(form.cooldownHours) === null) {
    errors.cooldownHours = 'Informe um número inteiro maior ou igual a 1.'
  }

  return errors
}

export function buildCreateAutomationPayload(
  form: AutomationFormValues,
): CreateRecurringAutomationPayload | null {
  if (Object.keys(validateAutomationForm(form, 'create')).length > 0) return null
  if (!isManagedAutomationType(form.type)) return null
  const daysAfter = positiveInteger(form.daysAfter)
  const cooldownHours = positiveInteger(form.cooldownHours)
  if (daysAfter === null || cooldownHours === null) return null

  return {
    name: form.name.trim(),
    type: form.type,
    daysAfter,
    message: form.message.trim(),
    cooldownHours,
  }
}

export function buildUpdateAutomationPayload(
  automation: Automation,
  form: AutomationFormValues,
): UpdateRecurringAutomationPayload | null {
  if (!canEditAutomation(automation)) return null
  if (Object.keys(validateAutomationForm(form, 'edit', automation)).length > 0) return null

  const capabilities = automationEditCapabilities(automation)
  const payload: UpdateRecurringAutomationPayload = {}
  if (capabilities.name) payload.name = form.name.trim()
  if (capabilities.message) payload.message = form.message.trim()
  if (capabilities.daysAfter) {
    const daysAfter = positiveInteger(form.daysAfter)
    if (daysAfter === null) return null
    payload.daysAfter = daysAfter
  }
  if (capabilities.cooldownHours) {
    const cooldownHours = positiveInteger(form.cooldownHours)
    if (cooldownHours === null) return null
    payload.cooldownHours = cooldownHours
  }
  return payload
}

export function emptyAutomationManagementState(): AutomationManagementState {
  return {
    automations: [],
    loading: false,
    loadError: false,
    actionAutomation: null,
    actionLoading: false,
    actionError: '',
    formSaving: false,
    formError: '',
    deleteAutomation: null,
    deleteLoading: false,
    deleteError: '',
    successMessage: '',
  }
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) return undefined
  return typeof response.status === 'number' ? response.status : undefined
}

export function automationManagementError(error: unknown): string {
  const status = errorStatus(error)
  if (status === 400) return 'Não foi possível validar esta alteração.'
  if (status === 403) return 'Esta automação não pode ser alterada.'
  if (status === 404) return 'Automação não encontrada ou não está mais disponível.'
  if (status === 409) return 'Não foi possível alterar esta automação no estado atual.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function automationFormError(error: unknown): string {
  const status = errorStatus(error)
  if (status === 400) return 'Revise os dados informados e tente novamente.'
  if (status === 409) {
    return 'Já existe uma automação com esses dados ou o limite de automações foi atingido.'
  }
  return automationManagementError(error)
}

function replaceAutomation(items: Automation[], updated: Automation): Automation[] {
  return items.map((item) => item.id === updated.id ? updated : item)
}

export function createAutomationManagementController(
  repository: AutomationManagementRepository,
  state: AutomationManagementState = emptyAutomationManagementState(),
) {
  async function load(): Promise<boolean> {
    if (state.loading) return false
    state.loading = true
    state.loadError = false
    try {
      state.automations = filterManagedAutomations(await repository.list())
      return true
    } catch {
      state.automations = []
      state.loadError = true
      return false
    } finally {
      state.loading = false
    }
  }

  function openToggleAction(automation: Automation): boolean {
    if (state.actionLoading || !isManagedAutomation(automation)) return false
    state.actionAutomation = automation
    state.actionError = ''
    state.successMessage = ''
    return true
  }

  function closeAction(): boolean {
    if (state.actionLoading) return false
    state.actionAutomation = null
    state.actionError = ''
    return true
  }

  async function confirmAction(): Promise<boolean> {
    if (state.actionLoading || !state.actionAutomation) return false
    const automation = state.actionAutomation
    const isActive = !automation.isActive
    state.actionLoading = true
    state.actionError = ''
    try {
      const updated = await repository.updateAutomation(automation.id, { isActive })
      state.automations = replaceAutomation(state.automations, updated)
      state.successMessage = isActive
        ? `Automação “${automation.name}” ativada com sucesso.`
        : `Automação “${automation.name}” desativada com sucesso.`
      state.actionAutomation = null
      return true
    } catch (error) {
      state.actionError = automationManagementError(error)
      return false
    } finally {
      state.actionLoading = false
    }
  }

  async function createAutomation(payload: CreateRecurringAutomationPayload): Promise<boolean> {
    if (state.formSaving || !isManagedAutomationType(payload.type)) return false
    state.formSaving = true
    state.formError = ''
    state.successMessage = ''
    try {
      const created = await repository.createAutomation(payload)
      if (!isManagedAutomation(created)) throw new Error('Unexpected automation type')
      state.automations = state.automations.some((item) => item.id === created.id)
        ? replaceAutomation(state.automations, created)
        : [created, ...state.automations]
      state.successMessage = `Automação “${created.name}” criada com sucesso.`
      return true
    } catch (error) {
      state.formError = automationFormError(error)
      return false
    } finally {
      state.formSaving = false
    }
  }

  async function updateAutomation(
    automation: Automation,
    form: AutomationFormValues,
  ): Promise<boolean> {
    if (state.formSaving || !canEditAutomation(automation)) return false
    const payload = buildUpdateAutomationPayload(automation, form)
    if (!payload) return false
    state.formSaving = true
    state.formError = ''
    state.successMessage = ''
    try {
      const updated = await repository.updateAutomation(automation.id, payload)
      state.automations = replaceAutomation(state.automations, updated)
      state.successMessage = `Automação “${updated.name}” atualizada com sucesso.`
      return true
    } catch (error) {
      state.formError = automationFormError(error)
      return false
    } finally {
      state.formSaving = false
    }
  }

  function openDeleteAction(automation: Automation): boolean {
    if (state.deleteLoading || !canDeleteAutomation(automation)) return false
    state.deleteAutomation = automation
    state.deleteError = ''
    state.successMessage = ''
    return true
  }

  function closeDeleteAction(): boolean {
    if (state.deleteLoading) return false
    state.deleteAutomation = null
    state.deleteError = ''
    return true
  }

  async function confirmDelete(): Promise<boolean> {
    const automation = state.deleteAutomation
    if (state.deleteLoading || !automation || !canDeleteAutomation(automation)) return false
    state.deleteLoading = true
    state.deleteError = ''
    try {
      await repository.deleteAutomation(automation.id)
      state.automations = state.automations.filter((item) => item.id !== automation.id)
      state.successMessage = `Automação “${automation.name}” excluída com sucesso.`
      state.deleteAutomation = null
      return true
    } catch (error) {
      state.deleteError = automationManagementError(error)
      return false
    } finally {
      state.deleteLoading = false
    }
  }

  return {
    state,
    load,
    openToggleAction,
    closeAction,
    confirmAction,
    createAutomation,
    updateAutomation,
    openDeleteAction,
    closeDeleteAction,
    confirmDelete,
  }
}

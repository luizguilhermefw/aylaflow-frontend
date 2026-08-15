import type {
  ContactConsentStatus,
  ContactFilterValues,
  ContactFormValues,
  Customer,
  CustomerAutomationUpdate,
  CustomerConsentPayload,
  CustomerConsentUpdate,
  CustomerImportExecuteResult,
  CustomerImportPreview,
  CustomerImportRow,
  CustomerImportRowStatus,
  CustomerImportTemplate,
  CustomerMutationPayload,
  CustomerSearchFilters,
  CustomerSearchResult,
  ManagedContactConsentStatus,
} from './contact.types'

export const BRAZILIAN_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const

export const GENDER_LABELS = {
  FEMALE: 'Feminino',
  MALE: 'Masculino',
  UNSPECIFIED: 'Não informado',
} as const

export const CONSENT_LABELS: Record<ContactConsentStatus, string> = {
  GRANTED: 'Consentido',
  UNKNOWN: 'Não definido',
  OPTED_OUT: 'Bloqueado',
}

export const CUSTOMER_IMPORT_STATUS_LABELS: Record<CustomerImportRowStatus, string> = {
  NEW: 'Novo',
  EXISTING: 'Já cadastrado',
  INVALID: 'Inválido',
  DUPLICATE_IN_FILE: 'Duplicado na planilha',
}

export function customerImportConsentLabel(status: ContactConsentStatus): string {
  return CONSENT_LABELS[status]
}

export const MAX_CUSTOMER_IMPORT_BYTES = 5 * 1024 * 1024

export function customerImportRowMessage(row: CustomerImportRow): string {
  if (row.status === 'INVALID') {
    return row.errors.map(({ message }) => message).join(' • ') || 'Revise os dados desta linha.'
  }
  if (row.status === 'DUPLICATE_IN_FILE') return 'Esta linha não será importada.'
  if (row.status === 'EXISTING') return 'O contato já existe e não será sobrescrito.'
  return 'Pronto para importar.'
}

export function validateCustomerImportFile(file: File): string {
  const extension = file.name.toLowerCase().split('.').pop()
  if (extension !== 'xlsx' && extension !== 'csv') {
    return 'Selecione um arquivo .xlsx ou .csv.'
  }
  if (file.size > MAX_CUSTOMER_IMPORT_BYTES) {
    return 'O arquivo deve ter no máximo 5 MB.'
  }
  return ''
}

export function customerImportFileSize(file: File): string {
  if (file.size < 1024) return `${file.size} bytes`
  return `${(file.size / (1024 * 1024)).toFixed(2)} MB`
}

export function importTemplateFileName(contentDisposition: unknown): string {
  if (typeof contentDisposition !== 'string') return 'aylaflow-customer-import.xlsx'
  const match = contentDisposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)
  if (!match?.[1]) return 'aylaflow-customer-import.xlsx'

  try {
    return decodeURIComponent(match[1].trim())
  } catch {
    return match[1].trim()
  }
}

export interface ContactConfirmationAction {
  label: string
  confirmation: string
  tone: 'positive' | 'destructive'
}

export interface ConsentConfirmationAction extends ContactConfirmationAction {
  status: ManagedContactConsentStatus
}

export function consentActionFor(customer: Pick<Customer, 'contactConsentStatus'>): ConsentConfirmationAction {
  if (customer.contactConsentStatus === 'GRANTED') {
    return {
      status: 'OPTED_OUT',
      label: 'Registrar opt-out',
      confirmation: 'Confirma que o cliente solicitou não receber mais mensagens?',
      tone: 'destructive',
    }
  }

  if (customer.contactConsentStatus === 'OPTED_OUT') {
    return {
      status: 'GRANTED',
      label: 'Registrar novo consentimento',
      confirmation: 'O cliente confirmou novamente que deseja receber mensagens promocionais?',
      tone: 'positive',
    }
  }

  return {
    status: 'GRANTED',
    label: 'Registrar consentimento',
    confirmation: 'O cliente confirmou que autoriza receber mensagens promocionais?',
    tone: 'positive',
  }
}

export function automationActionFor(customer: Pick<Customer, 'isActiveForAutomation'>): ContactConfirmationAction {
  return customer.isActiveForAutomation
    ? {
        label: 'Desativar contato',
        confirmation: 'Este contato deixará de participar de automações e campanhas. Deseja continuar?',
        tone: 'destructive',
      }
    : {
        label: 'Ativar contato',
        confirmation: 'Este contato voltará a ficar elegível para automações e campanhas, respeitando as regras de consentimento. Deseja continuar?',
        tone: 'positive',
      }
}

export function emptyContactForm(): ContactFormValues {
  return {
    name: '',
    phone: '',
    gender: 'UNSPECIFIED',
    city: '',
    state: '',
    birthDate: '',
    lastPurchaseDate: '',
  }
}

export function contactToForm(customer: Customer): ContactFormValues {
  return {
    name: customer.name,
    phone: customer.phone,
    gender: customer.gender,
    city: customer.city ?? '',
    state: customer.state ?? '',
    birthDate: dateInputValue(customer.birthDate),
    lastPurchaseDate: dateInputValue(customer.lastPurchaseDate),
  }
}

export function emptyContactFilters(): ContactFilterValues {
  return {
    gender: '',
    city: '',
    state: '',
    minAge: '',
    maxAge: '',
    lastPurchaseBefore: '',
    lastPurchaseAfter: '',
    pageSize: 20,
  }
}

export interface ContactValidationContext {
  originalBirthDate?: string | null
}

export function validateContactForm(
  form: ContactFormValues,
  context: ContactValidationContext = {},
): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!form.name.trim()) errors.name = 'O nome é obrigatório.'
  if (!form.phone.trim()) errors.phone = 'O telefone é obrigatório.'
  if (context.originalBirthDate && !form.birthDate) {
    errors.birthDate = 'A data de nascimento não pode ser removida neste momento.'
  }
  if (form.state && !BRAZILIAN_STATES.includes(form.state.toUpperCase() as typeof BRAZILIAN_STATES[number])) {
    errors.state = 'Selecione uma UF válida.'
  }

  return errors
}

export function buildCustomerPayload(form: ContactFormValues): CustomerMutationPayload {
  return {
    name: form.name.trim(),
    phone: form.phone.trim(),
    gender: form.gender,
    city: form.city.trim() || null,
    state: form.state || null,
    ...(form.birthDate ? { birthDate: form.birthDate } : {}),
    lastPurchaseDate: form.lastPurchaseDate || null,
  }
}

export function validateContactFilters(filters: ContactFilterValues): string {
  const minAge = filters.minAge === '' ? undefined : Number(filters.minAge)
  const maxAge = filters.maxAge === '' ? undefined : Number(filters.maxAge)

  if (minAge !== undefined && (!Number.isInteger(minAge) || minAge < 0 || minAge > 120)) {
    return 'A idade mínima deve ser um número entre 0 e 120.'
  }
  if (maxAge !== undefined && (!Number.isInteger(maxAge) || maxAge < 0 || maxAge > 120)) {
    return 'A idade máxima deve ser um número entre 0 e 120.'
  }
  if (minAge !== undefined && maxAge !== undefined && minAge > maxAge) {
    return 'A idade máxima deve ser maior ou igual à idade mínima.'
  }

  return ''
}

export function buildSearchFilters(filters: ContactFilterValues, page = 1): CustomerSearchFilters {
  return {
    ...(filters.gender ? { gender: filters.gender } : {}),
    ...(filters.city.trim() ? { city: filters.city.trim() } : {}),
    ...(filters.state ? { state: filters.state } : {}),
    ...(filters.minAge !== '' ? { minAge: Number(filters.minAge) } : {}),
    ...(filters.maxAge !== '' ? { maxAge: Number(filters.maxAge) } : {}),
    ...(filters.lastPurchaseBefore ? { lastPurchaseBefore: filters.lastPurchaseBefore } : {}),
    ...(filters.lastPurchaseAfter ? { lastPurchaseAfter: filters.lastPurchaseAfter } : {}),
    page,
    pageSize: filters.pageSize,
  }
}

export function dateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

export function formatDate(value: string | null): string {
  if (!value) return 'Não informado'
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(value))
}

export function formatLocation(customer: Pick<Customer, 'city' | 'state'>): string {
  if (customer.city && customer.state) return `${customer.city}/${customer.state}`
  return customer.city ?? customer.state ?? 'Não informado'
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) return undefined
  return typeof response.status === 'number' ? response.status : undefined
}

function backendErrorMessage(error: unknown): string | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('data' in response)) return undefined
  const data = response.data
  if (typeof data !== 'object' || data === null || !('message' in data)) return undefined
  if (typeof data.message === 'string') return data.message
  if (Array.isArray(data.message)) return data.message.find((message): message is string => typeof message === 'string')
  return undefined
}

export function customerImportError(error: unknown, operation: 'template' | 'preview' | 'execute'): string {
  if (errorStatus(error) === 413) return 'O arquivo excede o limite permitido de 5 MB.'

  const message = backendErrorMessage(error)
  const knownMessages: Record<string, string> = {
    'Only XLSX and CSV files are allowed': 'Selecione um arquivo .xlsx ou .csv.',
    'Customer import file is required': 'Selecione um arquivo para continuar.',
    'Customer import file is empty or invalid': 'A planilha está vazia ou é inválida.',
    'Customer import file exceeds 5 MB': 'O arquivo deve ter no máximo 5 MB.',
    'Customer import file could not be parsed': 'Não foi possível ler o arquivo. Verifique o formato e tente novamente.',
    'Customer import header is required': 'A planilha precisa ter uma linha de cabeçalho.',
    'Customer import header is ambiguous': 'A planilha possui cabeçalhos duplicados ou ambíguos.',
    'Customer import requires name and phone': 'A planilha precisa conter as colunas nome e telefone.',
    'Customer import exceeds 5000 data rows': 'A planilha deve conter no máximo 5.000 linhas de dados.',
  }
  if (message && knownMessages[message]) return knownMessages[message]
  if (message && !/stack|exception|internal/i.test(message)) return message

  if (operation === 'template') return 'Não foi possível baixar o modelo. Tente novamente.'
  if (operation === 'preview') return 'Não foi possível validar o arquivo. Tente novamente.'
  return 'Não foi possível concluir a importação. Tente novamente.'
}

export function customerSaveError(error: unknown): string {
  const status = errorStatus(error)
  if (status === 409) return 'Já existe um contato com esse telefone.'
  if (status === 400) return 'Revise os dados informados e tente novamente.'
  return 'Não foi possível salvar o contato. Tente novamente.'
}

export interface CustomerRepository {
  list(): Promise<Customer[]>
  search(filters: CustomerSearchFilters): Promise<CustomerSearchResult>
  create(payload: CustomerMutationPayload): Promise<Customer>
  update(id: string, payload: CustomerMutationPayload): Promise<Customer>
  updateConsent(id: string, payload: CustomerConsentPayload): Promise<CustomerConsentUpdate>
  toggleAutomation(id: string): Promise<CustomerAutomationUpdate>
  downloadImportTemplate(): Promise<CustomerImportTemplate>
  previewImport(file: File): Promise<CustomerImportPreview>
  executeImport(file: File): Promise<CustomerImportExecuteResult>
}

export interface CustomerHttpRequestConfig {
  params?: CustomerSearchFilters
  responseType?: 'blob'
}

export interface CustomerHttpClient {
  get<T>(url: string, config?: CustomerHttpRequestConfig): Promise<{
    data: T
    headers?: Record<string, unknown>
  }>
  post<T>(url: string, payload: CustomerMutationPayload | FormData): Promise<{ data: T }>
  put<T>(url: string, payload: CustomerMutationPayload): Promise<{ data: T }>
  patch<T>(url: string, payload?: CustomerConsentPayload): Promise<{ data: T }>
}

export function createCustomerRepository(http: CustomerHttpClient): CustomerRepository {
  return {
    async list() {
      const { data } = await http.get<Customer[]>('/customer')
      return data
    },
    async search(filters) {
      const { data } = await http.get<CustomerSearchResult>('/customer/search', { params: filters })
      return data
    },
    async create(payload) {
      const { data } = await http.post<Customer>('/customer', payload)
      return data
    },
    async update(id, payload) {
      const { data } = await http.put<Customer>(`/customer/${id}`, payload)
      return data
    },
    async updateConsent(id, payload) {
      const { data } = await http.patch<CustomerConsentUpdate>(`/customer/${id}/contact-consent`, payload)
      return data
    },
    async toggleAutomation(id) {
      const { data } = await http.patch<CustomerAutomationUpdate>(`/customer/${id}/toggle-automation`)
      return data
    },
    async downloadImportTemplate() {
      const { data, headers } = await http.get<Blob>('/customer/import/template', {
        responseType: 'blob',
      })
      return {
        blob: data,
        fileName: importTemplateFileName(headers?.['content-disposition']),
      }
    },
    async previewImport(file) {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await http.post<CustomerImportPreview>('/customer/import/preview', formData)
      return data
    },
    async executeImport(file) {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await http.post<CustomerImportExecuteResult>('/customer/import/execute', formData)
      return data
    },
  }
}

export interface ContactsState {
  contacts: Customer[]
  pagination: CustomerSearchResult['pagination'] | null
  loading: boolean
  loadError: boolean
  saving: boolean
  saveError: string
  actionLoading: boolean
  actionError: string
}

export function emptyContactsState(): ContactsState {
  return {
    contacts: [],
    pagination: null,
    loading: false,
    loadError: false,
    saving: false,
    saveError: '',
    actionLoading: false,
    actionError: '',
  }
}

export function createContactsController(
  repository: CustomerRepository,
  state: ContactsState = emptyContactsState(),
) {

  async function load(filters?: CustomerSearchFilters): Promise<void> {
    state.loading = true
    state.loadError = false

    try {
      if (filters) {
        const result = await repository.search(filters)
        state.contacts = result.items
        state.pagination = result.pagination
      } else {
        state.contacts = await repository.list()
        state.pagination = null
      }
    } catch {
      state.contacts = []
      state.pagination = null
      state.loadError = true
    } finally {
      state.loading = false
    }
  }

  async function create(payload: CustomerMutationPayload): Promise<Customer | null> {
    state.saving = true
    state.saveError = ''

    try {
      const customer = await repository.create(payload)
      state.contacts = [customer, ...state.contacts]
      return customer
    } catch (error) {
      state.saveError = customerSaveError(error)
      return null
    } finally {
      state.saving = false
    }
  }

  async function update(id: string, payload: CustomerMutationPayload): Promise<Customer | null> {
    state.saving = true
    state.saveError = ''

    try {
      const customer = await repository.update(id, payload)
      state.contacts = state.contacts.map((item) => item.id === id ? customer : item)
      return customer
    } catch (error) {
      state.saveError = customerSaveError(error)
      return null
    } finally {
      state.saving = false
    }
  }

  function mergeCustomerUpdate(
    id: string,
    update: CustomerConsentUpdate | CustomerAutomationUpdate,
  ): Customer | null {
    const current = state.contacts.find((customer) => customer.id === id)
    if (!current) return null

    const merged = { ...current, ...update }
    state.contacts = state.contacts.map((customer) => customer.id === id ? merged : customer)
    return merged
  }

  async function updateConsent(
    id: string,
    status: ManagedContactConsentStatus,
  ): Promise<Customer | null> {
    state.actionLoading = true
    state.actionError = ''

    try {
      const update = await repository.updateConsent(id, { status })
      return mergeCustomerUpdate(id, update)
    } catch {
      state.actionError = 'Não foi possível atualizar o consentimento. Tente novamente.'
      return null
    } finally {
      state.actionLoading = false
    }
  }

  async function toggleAutomation(id: string): Promise<Customer | null> {
    state.actionLoading = true
    state.actionError = ''

    try {
      const update = await repository.toggleAutomation(id)
      return mergeCustomerUpdate(id, update)
    } catch {
      state.actionError = 'Não foi possível alterar a participação do contato. Tente novamente.'
      return null
    } finally {
      state.actionLoading = false
    }
  }

  return { state, load, create, update, updateConsent, toggleAutomation }
}

export type CustomerImportStage =
  | 'idle'
  | 'previewing'
  | 'ready'
  | 'executing'
  | 'success'
  | 'error'

export interface CustomerImportState {
  open: boolean
  stage: CustomerImportStage
  file: File | null
  preview: CustomerImportPreview | null
  result: CustomerImportExecuteResult | null
  error: string
}

export function emptyCustomerImportState(): CustomerImportState {
  return {
    open: false,
    stage: 'idle',
    file: null,
    preview: null,
    result: null,
    error: '',
  }
}

export function canExecuteCustomerImport(state: CustomerImportState): boolean {
  return Boolean(
    state.file &&
    state.preview &&
    state.stage !== 'previewing' &&
    state.stage !== 'executing' &&
    state.stage !== 'success',
  )
}

export function createCustomerImportController(
  repository: CustomerRepository,
  state: CustomerImportState = emptyCustomerImportState(),
) {
  let fileRevision = 0

  function resetWorkflow() {
    fileRevision += 1
    state.stage = 'idle'
    state.file = null
    state.preview = null
    state.result = null
    state.error = ''
  }

  function open() {
    resetWorkflow()
    state.open = true
  }

  function close(): boolean {
    if (state.stage === 'previewing' || state.stage === 'executing') return false
    state.open = false
    resetWorkflow()
    return true
  }

  function selectFile(file: File): boolean {
    if (state.stage === 'executing') return false
    fileRevision += 1
    state.preview = null
    state.result = null
    state.error = ''

    const validationError = validateCustomerImportFile(file)
    if (validationError) {
      state.file = null
      state.stage = 'error'
      state.error = validationError
      return false
    }

    state.file = file
    state.stage = 'idle'
    return true
  }

  function removeFile(): boolean {
    if (state.stage === 'executing') return false
    fileRevision += 1
    state.file = null
    state.preview = null
    state.result = null
    state.error = ''
    state.stage = 'idle'
    return true
  }

  async function preview(): Promise<CustomerImportPreview | null> {
    if (state.stage === 'previewing' || state.stage === 'executing') return null
    if (!state.file) {
      state.stage = 'error'
      state.error = 'Selecione um arquivo para continuar.'
      return null
    }

    const file = state.file
    const revision = fileRevision
    state.stage = 'previewing'
    state.preview = null
    state.result = null
    state.error = ''

    try {
      const result = await repository.previewImport(file)
      if (revision !== fileRevision || state.file !== file) return null
      state.preview = result
      state.stage = 'ready'
      return result
    } catch (error) {
      if (revision !== fileRevision || state.file !== file) return null
      state.stage = 'error'
      state.error = customerImportError(error, 'preview')
      return null
    }
  }

  async function execute(
    onSuccess?: (result: CustomerImportExecuteResult) => Promise<void> | void,
  ): Promise<CustomerImportExecuteResult | null> {
    if (!canExecuteCustomerImport(state) || !state.file) return null

    const file = state.file
    state.stage = 'executing'
    state.result = null
    state.error = ''

    try {
      const result = await repository.executeImport(file)
      state.result = result
      state.stage = 'success'
      await onSuccess?.(result)
      return result
    } catch (error) {
      state.stage = 'error'
      state.error = customerImportError(error, 'execute')
      return null
    }
  }

  return { state, open, close, selectFile, removeFile, preview, execute }
}

export interface CustomerImportTemplateState {
  downloading: boolean
  error: string
}

export function emptyCustomerImportTemplateState(): CustomerImportTemplateState {
  return { downloading: false, error: '' }
}

export function createCustomerImportTemplateController(
  repository: CustomerRepository,
  state: CustomerImportTemplateState = emptyCustomerImportTemplateState(),
) {
  async function download(): Promise<CustomerImportTemplate | null> {
    if (state.downloading) return null
    state.downloading = true
    state.error = ''

    try {
      return await repository.downloadImportTemplate()
    } catch (error) {
      state.error = customerImportError(error, 'template')
      return null
    } finally {
      state.downloading = false
    }
  }

  return { state, download }
}

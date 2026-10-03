import type {
  CustomerInterestOption,
  CustomerInterestType,
} from './customer-interest-catalog.repository'

export interface CustomerInterestCatalogRepository {
  list(): Promise<CustomerInterestOption[]>
  create(type: CustomerInterestType, name: string): Promise<CustomerInterestOption>
  update(id: string, name: string): Promise<CustomerInterestOption>
  updateStatus(id: string, active: boolean): Promise<CustomerInterestOption>
}

export interface CustomerInterestCatalogState {
  view: 'idle' | 'loading' | 'ready' | 'error'
  options: CustomerInterestOption[]
  saving: boolean
  pendingOptionId: string | null
  loadError: string
  actionError: string
  successMessage: string
}

export function emptyCustomerInterestCatalogState(): CustomerInterestCatalogState {
  return {
    view: 'idle',
    options: [],
    saving: false,
    pendingOptionId: null,
    loadError: '',
    actionError: '',
    successMessage: '',
  }
}

export function canManageCustomerInterestCatalog(role: string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function customerInterestOptionsByType(
  options: readonly CustomerInterestOption[],
  type: CustomerInterestType,
): CustomerInterestOption[] {
  return options.filter((option) => option.type === type)
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) return undefined
  return typeof response.status === 'number' ? response.status : undefined
}

export function customerInterestCatalogError(
  error: unknown,
  type?: CustomerInterestType,
): string {
  const status = errorStatus(error)
  if (status === 400) return 'Informe um nome válido.'
  if (status === 403) return 'Você não tem permissão para gerenciar os interesses.'
  if (status === 404) return 'Esta opção não foi encontrada.'
  if (status === 409) {
    return type === 'BRAND'
      ? 'Já existe uma marca com esse nome.'
      : 'Já existe uma categoria com esse nome.'
  }
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function createCustomerInterestCatalogController(
  repository: CustomerInterestCatalogRepository,
  state: CustomerInterestCatalogState = emptyCustomerInterestCatalogState(),
) {
  function clearFeedback() {
    state.actionError = ''
    state.successMessage = ''
  }

  function replaceOption(option: CustomerInterestOption) {
    const index = state.options.findIndex((current) => current.id === option.id)
    if (index === -1) state.options.push(option)
    else state.options.splice(index, 1, option)
  }

  async function load(role: string | null | undefined): Promise<boolean> {
    if (state.view === 'loading' || !canManageCustomerInterestCatalog(role)) return false
    state.view = 'loading'
    state.loadError = ''
    clearFeedback()
    try {
      state.options = await repository.list()
      state.view = 'ready'
      return true
    } catch (error) {
      state.view = 'error'
      state.loadError = customerInterestCatalogError(error)
      return false
    }
  }

  async function create(
    type: CustomerInterestType,
    name: string,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (state.saving || !canManageCustomerInterestCatalog(role)) return false
    const normalizedName = name.trim()
    if (!normalizedName) {
      state.actionError = 'Informe um nome válido.'
      return false
    }
    state.saving = true
    clearFeedback()
    try {
      replaceOption(await repository.create(type, normalizedName))
      state.successMessage = type === 'CATEGORY' ? 'Categoria criada.' : 'Marca criada.'
      return true
    } catch (error) {
      state.actionError = customerInterestCatalogError(error, type)
      return false
    } finally {
      state.saving = false
    }
  }

  async function update(
    option: CustomerInterestOption,
    name: string,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (state.saving || !canManageCustomerInterestCatalog(role)) return false
    const normalizedName = name.trim()
    if (!normalizedName) {
      state.actionError = 'Informe um nome válido.'
      return false
    }
    state.saving = true
    clearFeedback()
    try {
      replaceOption(await repository.update(option.id, normalizedName))
      state.successMessage = 'Opção atualizada.'
      return true
    } catch (error) {
      state.actionError = customerInterestCatalogError(error, option.type)
      return false
    } finally {
      state.saving = false
    }
  }

  async function updateStatus(
    option: CustomerInterestOption,
    active: boolean,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (
      state.saving
      || state.pendingOptionId !== null
      || option.active === active
      || !canManageCustomerInterestCatalog(role)
    ) return false
    state.pendingOptionId = option.id
    clearFeedback()
    try {
      replaceOption(await repository.updateStatus(option.id, active))
      state.successMessage = active ? 'Opção ativada.' : 'Opção desativada.'
      return true
    } catch (error) {
      state.actionError = customerInterestCatalogError(error, option.type)
      return false
    } finally {
      state.pendingOptionId = null
    }
  }

  return { state, load, create, update, updateStatus }
}

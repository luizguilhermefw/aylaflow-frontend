import type {
  AdminCompany,
  AdminCompanyStatus,
} from './admin-repository.logic'

export type AdminCompanyFilter = 'ALL' | AdminCompanyStatus
export type AdminCompanyActionType = 'ACTIVATE' | 'SUSPEND' | 'CANCEL'
export type AdminCompanyActionTone = 'primary' | 'warning' | 'destructive'

export interface AdminCompanyAction {
  type: AdminCompanyActionType
  label: string
  confirmationTitle: string
  confirmationDescription: string
  tone: AdminCompanyActionTone
}

export interface AdminCompaniesRepository {
  listCompanies(): Promise<AdminCompany[]>
  activateCompany(id: string): Promise<AdminCompany>
  suspendCompany(id: string): Promise<AdminCompany>
  cancelCompany(id: string): Promise<AdminCompany>
}

export interface PendingAdminCompanyAction {
  companyId: string
  type: AdminCompanyActionType
}

export interface AdminCompaniesState {
  companies: AdminCompany[]
  loading: boolean
  loadError: string
  pendingAction: PendingAdminCompanyAction | null
  actionLoading: boolean
  actionError: string
  successMessage: string
}

export const ADMIN_COMPANY_STATUS_LABELS: Record<AdminCompanyStatus, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Ativa',
  SUSPENDED: 'Suspensa',
  CANCELLED: 'Cancelada',
}

const ACTIONS_BY_STATUS: Record<AdminCompanyStatus, AdminCompanyAction[]> = {
  PENDING: [{
    type: 'ACTIVATE',
    label: 'Aprovar',
    confirmationTitle: 'Aprovar empresa?',
    confirmationDescription: 'A empresa terá acesso aos recursos do AylaFlow após a aprovação.',
    tone: 'primary',
  }],
  ACTIVE: [
    {
      type: 'SUSPEND',
      label: 'Suspender',
      confirmationTitle: 'Suspender empresa?',
      confirmationDescription: 'O acesso da empresa aos recursos do AylaFlow será suspenso.',
      tone: 'warning',
    },
    {
      type: 'CANCEL',
      label: 'Cancelar',
      confirmationTitle: 'Cancelar empresa?',
      confirmationDescription: 'A conta será cancelada e não poderá ser reativada por este console.',
      tone: 'destructive',
    },
  ],
  SUSPENDED: [{
    type: 'ACTIVATE',
    label: 'Reativar',
    confirmationTitle: 'Reativar empresa?',
    confirmationDescription: 'O acesso da empresa aos recursos do AylaFlow será restabelecido.',
    tone: 'primary',
  }],
  CANCELLED: [],
}

export function getAdminCompanyActions(company: AdminCompany): AdminCompanyAction[] {
  return ACTIONS_BY_STATUS[company.status]
}

export function findAdminCompanyAction(
  company: AdminCompany,
  type: AdminCompanyActionType,
): AdminCompanyAction | null {
  return getAdminCompanyActions(company).find((action) => action.type === type) ?? null
}

export function filterAdminCompanies(
  companies: AdminCompany[],
  filter: AdminCompanyFilter,
  search: string,
): AdminCompany[] {
  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR')
  const searchDigits = normalizedSearch.replace(/\D/g, '')

  return companies
    .filter((company) => filter === 'ALL' || company.status === filter)
    .filter((company) => {
      if (!normalizedSearch) return true

      const normalizedName = company.displayName.toLocaleLowerCase('pt-BR')
      const cnpjDigits = company.cnpj.replace(/\D/g, '')
      return normalizedName.includes(normalizedSearch)
        || company.cnpj.toLocaleLowerCase('pt-BR').includes(normalizedSearch)
        || Boolean(searchDigits && cnpjDigits.includes(searchDigits))
    })
    .sort((first, second) => {
      if (first.status === 'PENDING' && second.status !== 'PENDING') return -1
      if (first.status !== 'PENDING' && second.status === 'PENDING') return 1
      return Date.parse(second.createdAt) - Date.parse(first.createdAt)
    })
}

export function countAdminCompaniesByStatus(
  companies: AdminCompany[],
): Record<AdminCompanyFilter, number> {
  return companies.reduce<Record<AdminCompanyFilter, number>>((counts, company) => {
    counts.ALL += 1
    counts[company.status] += 1
    return counts
  }, { ALL: 0, PENDING: 0, ACTIVE: 0, SUSPENDED: 0, CANCELLED: 0 })
}

export function formatAdminCompanyCnpj(cnpj: string): string {
  const digits = cnpj.replace(/\D/g, '')
  if (digits.length !== 14) return cnpj
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
}

export function formatAdminCompanyDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function emptyAdminCompaniesState(): AdminCompaniesState {
  return {
    companies: [],
    loading: false,
    loadError: '',
    pendingAction: null,
    actionLoading: false,
    actionError: '',
    successMessage: '',
  }
}

export function adminCompanyActionError(error: unknown): string {
  const status = typeof error === 'object' && error !== null && 'response' in error
    ? (error as { response?: { status?: number } }).response?.status
    : undefined

  if (status === 403) return 'Você não tem permissão para realizar esta ação.'
  if (status === 404) return 'Empresa não encontrada ou não está mais disponível.'
  if (status === 409) return 'A empresa não pode ser alterada no estado atual.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function createAdminCompaniesController(
  repository: AdminCompaniesRepository,
  state: AdminCompaniesState = emptyAdminCompaniesState(),
) {
  async function loadCompanies(): Promise<boolean> {
    if (state.loading) return false
    state.loading = true
    state.loadError = ''

    try {
      state.companies = await repository.listCompanies()
      return true
    } catch {
      state.loadError = 'Não foi possível carregar as empresas. Tente novamente.'
      return false
    } finally {
      state.loading = false
    }
  }

  function openAction(company: AdminCompany, type: AdminCompanyActionType): boolean {
    if (state.actionLoading || !findAdminCompanyAction(company, type)) return false
    state.pendingAction = { companyId: company.id, type }
    state.actionError = ''
    state.successMessage = ''
    return true
  }

  function closeAction(): void {
    if (state.actionLoading) return
    state.pendingAction = null
    state.actionError = ''
  }

  async function confirmAction(): Promise<boolean> {
    if (state.actionLoading || !state.pendingAction) return false

    const pendingAction = state.pendingAction
    const company = state.companies.find((item) => item.id === pendingAction.companyId)
    if (!company || !findAdminCompanyAction(company, pendingAction.type)) return false

    state.actionLoading = true
    state.actionError = ''

    try {
      const updatedCompany = pendingAction.type === 'ACTIVATE'
        ? await repository.activateCompany(company.id)
        : pendingAction.type === 'SUSPEND'
          ? await repository.suspendCompany(company.id)
          : await repository.cancelCompany(company.id)

      state.companies = state.companies.map((item) => (
        item.id === company.id ? updatedCompany : item
      ))
      state.successMessage = `Empresa “${company.displayName}” atualizada com sucesso.`
      state.pendingAction = null
      return true
    } catch (error) {
      state.actionError = adminCompanyActionError(error)
      return false
    } finally {
      state.actionLoading = false
    }
  }

  return { loadCompanies, openAction, closeAction, confirmAction }
}

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  canAccessPlatformAdminArea,
  isPlatformAdminProfile,
} from '../src/features/auth/auth.logic.ts'
import {
  countAdminCompaniesByStatus,
  createAdminCompaniesController,
  emptyAdminCompaniesState,
  filterAdminCompanies,
  formatAdminCompanyCnpj,
  getAdminCompanyActions,
} from '../src/features/admin/admin-companies.logic.ts'
import type { AdminCompaniesRepository } from '../src/features/admin/admin-companies.logic.ts'
import {
  adminCompanyActionEndpoint,
  createAdminRepository,
} from '../src/features/admin/admin-repository.logic.ts'
import type {
  AdminCompany,
  AdminCompanyStatus,
  AdminHttpClient,
} from '../src/features/admin/admin-repository.logic.ts'
import { createAuthRepository } from '../src/features/auth/auth-repository.logic.ts'
import type {
  AuthHttpClient,
  AuthenticatedUser,
} from '../src/features/auth/auth-repository.logic.ts'

function profile(role: string): AuthenticatedUser {
  return {
    userId: 'user-1',
    name: 'Admin AylaFlow',
    email: 'admin@example.com',
    companyId: null,
    role,
  }
}

function company(
  status: AdminCompanyStatus = 'PENDING',
  overrides: Partial<AdminCompany> = {},
): AdminCompany {
  return {
    id: `company-${status.toLowerCase()}`,
    displayName: `Empresa ${status}`,
    cnpj: '12345678000190',
    status,
    createdAt: '2026-08-10T12:00:00.000Z',
    approvedAt: status === 'PENDING' ? null : '2026-08-11T12:00:00.000Z',
    ...overrides,
  }
}

function mutationResponse(updatedCompany: AdminCompany) {
  return {
    message: 'Empresa atualizada com sucesso.',
    company: updatedCompany,
  }
}

function repository(
  overrides: Partial<AdminCompaniesRepository> = {},
): AdminCompaniesRepository {
  return {
    async listCompanies() { return [] },
    async activateCompany(id) { return company('ACTIVE', { id }) },
    async suspendCompany(id) { return company('SUSPENDED', { id }) },
    async cancelCompany(id) { return company('CANCELLED', { id }) },
    ...overrides,
  }
}

test('GET /auth/me é usado para obter o perfil e a role', async () => {
  const calls: string[] = []
  const http: AuthHttpClient = {
    async get<T>(url: string) {
      calls.push(url)
      return { data: profile('PLATFORM_ADMIN') as T }
    },
    async post<T>() { return { data: {} as T } },
  }

  const result = await createAuthRepository(http).getProfile()

  assert.deepEqual(calls, ['/auth/me'])
  assert.equal(result.role, 'PLATFORM_ADMIN')
})

test('PLATFORM_ADMIN é reconhecido corretamente', () => {
  assert.equal(isPlatformAdminProfile(profile('PLATFORM_ADMIN')), true)
  assert.equal(canAccessPlatformAdminArea(profile('PLATFORM_ADMIN')), true)
})

test('OWNER e perfil ausente não recebem acesso administrativo na UX', () => {
  assert.equal(isPlatformAdminProfile(profile('OWNER')), false)
  assert.equal(canAccessPlatformAdminArea(profile('OWNER')), false)
  assert.equal(canAccessPlatformAdminArea(null), false)
})

test('repositório administrativo usa GET /admin/companies', async () => {
  const calls: string[] = []
  const http: AdminHttpClient = {
    async get<T>(url) {
      calls.push(url)
      return { data: [company()] as T }
    },
    async patch<T>() {
      return { data: mutationResponse(company('ACTIVE')) as T }
    },
  }

  const result = await createAdminRepository(http).listCompanies()

  assert.deepEqual(calls, ['/admin/companies'])
  assert.equal(result.length, 1)
})

test('activate usa PATCH /admin/company/:id/activate sem body', async () => {
  const calls: Array<{ method: string, url: string }> = []
  const updated = company('ACTIVE', { id: 'company-1' })
  const http: AdminHttpClient = {
    async get<T>() { return { data: [] as T } },
    async patch<T>(url) {
      calls.push({ method: 'PATCH', url })
      return { data: mutationResponse(updated) as T }
    },
  }

  const result = await createAdminRepository(http).activateCompany('company-1')

  assert.deepEqual(calls, [{ method: 'PATCH', url: '/admin/company/company-1/activate' }])
  assert.equal(result, updated)
})

test('suspend usa PATCH /admin/company/:id/suspend sem body', async () => {
  const calls: string[] = []
  const updated = company('SUSPENDED', { id: 'company-1' })
  const http: AdminHttpClient = {
    async get<T>() { return { data: [] as T } },
    async patch<T>(url) {
      calls.push(url)
      return { data: mutationResponse(updated) as T }
    },
  }

  const result = await createAdminRepository(http).suspendCompany('company-1')
  assert.deepEqual(calls, ['/admin/company/company-1/suspend'])
  assert.equal(result, updated)
})

test('cancel usa PATCH /admin/company/:id/cancel sem body', async () => {
  const calls: string[] = []
  const updated = company('CANCELLED', { id: 'company-1' })
  const http: AdminHttpClient = {
    async get<T>() { return { data: [] as T } },
    async patch<T>(url) {
      calls.push(url)
      return { data: mutationResponse(updated) as T }
    },
  }

  const result = await createAdminRepository(http).cancelCompany('company-1')
  assert.deepEqual(calls, ['/admin/company/company-1/cancel'])
  assert.equal(result, updated)
})

test('endpoints administrativos usam somente id e ação na URL', () => {
  assert.equal(adminCompanyActionEndpoint('company 1', 'activate'), '/admin/company/company%201/activate')
  assert.equal(adminCompanyActionEndpoint('company-1', 'suspend'), '/admin/company/company-1/suspend')
  assert.equal(adminCompanyActionEndpoint('company-1', 'cancel'), '/admin/company/company-1/cancel')
})

test('filtra empresas pelos quatro status reais', () => {
  const companies = [company('PENDING'), company('ACTIVE'), company('SUSPENDED'), company('CANCELLED')]

  for (const status of ['PENDING', 'ACTIVE', 'SUSPENDED', 'CANCELLED'] as const) {
    assert.deepEqual(filterAdminCompanies(companies, status, '').map((item) => item.status), [status])
  }
  assert.equal(countAdminCompaniesByStatus(companies).ALL, 4)
})

test('busca local por displayName ignora caixa', () => {
  const companies = [
    company('ACTIVE', { displayName: 'Clínica Aurora' }),
    company('ACTIVE', { id: 'company-2', displayName: 'Mercado Solar' }),
  ]

  assert.deepEqual(filterAdminCompanies(companies, 'ALL', 'aurora').map((item) => item.id), ['company-active'])
})

test('busca local por CNPJ aceita valor formatado ou somente dígitos', () => {
  const target = company('ACTIVE', { cnpj: '12.345.678/0001-90' })

  assert.equal(filterAdminCompanies([target], 'ALL', '12.345.678/0001-90').length, 1)
  assert.equal(filterAdminCompanies([target], 'ALL', '12345678').length, 1)
  assert.equal(formatAdminCompanyCnpj('12345678000190'), '12.345.678/0001-90')
})

test('empresas PENDING são priorizadas na visualização Todas', () => {
  const companies = [company('ACTIVE'), company('PENDING')]
  assert.equal(filterAdminCompanies(companies, 'ALL', '')[0]?.status, 'PENDING')
})

test('PENDING oferece somente Aprovar', () => {
  assert.deepEqual(getAdminCompanyActions(company('PENDING')).map((action) => action.label), ['Aprovar'])
})

test('ACTIVE oferece Suspender e Cancelar com cancelamento destrutivo', () => {
  const actions = getAdminCompanyActions(company('ACTIVE'))
  assert.deepEqual(actions.map((action) => action.label), ['Suspender', 'Cancelar'])
  assert.equal(actions[1]?.tone, 'destructive')
})

test('SUSPENDED oferece Reativar usando a ação ACTIVATE', () => {
  const actions = getAdminCompanyActions(company('SUSPENDED'))
  assert.equal(actions[0]?.label, 'Reativar')
  assert.equal(actions[0]?.type, 'ACTIVATE')
})

test('CANCELLED é somente leitura e não oferece reativação', () => {
  assert.deepEqual(getAdminCompanyActions(company('CANCELLED')), [])
})

test('sucesso atualiza somente a empresa correspondente com a resposta real', async () => {
  const original = company('PENDING')
  const untouched = company('ACTIVE', { id: 'company-2' })
  const updated = company('ACTIVE', { id: original.id, displayName: original.displayName })
  const state = emptyAdminCompaniesState()
  state.companies = [original, untouched]
  const controller = createAdminCompaniesController(repository({
    async activateCompany() { return updated },
  }), state)

  controller.openAction(original, 'ACTIVATE')
  assert.equal(await controller.confirmAction(), true)
  assert.equal(state.companies[0], updated)
  assert.equal(state.companies[1], untouched)
})

test('controller nunca insere o wrapper de mutação em state.companies', async () => {
  const original = company('PENDING')
  const untouched = company('ACTIVE', { id: 'company-2' })
  const updated = company('ACTIVE', {
    id: original.id,
    displayName: original.displayName,
    cnpj: original.cnpj,
  })
  const wrapper = mutationResponse(updated)
  const http: AdminHttpClient = {
    async get<T>() { return { data: [] as T } },
    async patch<T>() { return { data: wrapper as T } },
  }
  const state = emptyAdminCompaniesState()
  state.companies = [original, untouched]
  const controller = createAdminCompaniesController(createAdminRepository(http), state)

  controller.openAction(original, 'ACTIVATE')
  assert.equal(await controller.confirmAction(), true)

  assert.equal(state.companies[0], updated)
  assert.equal(state.companies[1], untouched)
  assert.deepEqual(Object.keys(state.companies[0]!).sort(), [
    'approvedAt',
    'cnpj',
    'createdAt',
    'displayName',
    'id',
    'status',
  ])
  assert.equal('message' in state.companies[0]!, false)
  assert.equal('company' in state.companies[0]!, false)
})

test('loading impede duplo submit da ação administrativa', async () => {
  let resolveAction: ((value: AdminCompany) => void) | undefined
  let calls = 0
  const pending = new Promise<AdminCompany>((resolve) => { resolveAction = resolve })
  const original = company('PENDING')
  const state = emptyAdminCompaniesState()
  state.companies = [original]
  const controller = createAdminCompaniesController(repository({
    async activateCompany() {
      calls += 1
      return pending
    },
  }), state)

  controller.openAction(original, 'ACTIVATE')
  const firstSubmit = controller.confirmAction()
  const secondSubmit = controller.confirmAction()
  assert.equal(state.actionLoading, true)
  assert.equal(await secondSubmit, false)
  assert.equal(calls, 1)
  resolveAction?.(company('ACTIVE', { id: original.id }))
  assert.equal(await firstSubmit, true)
})

test('erro de ação preserva integralmente as empresas anteriores', async () => {
  const original = company('ACTIVE')
  const state = emptyAdminCompaniesState()
  state.companies = [original]
  const controller = createAdminCompaniesController(repository({
    async suspendCompany() { throw new Error('network') },
  }), state)

  controller.openAction(original, 'SUSPEND')
  assert.equal(await controller.confirmAction(), false)
  assert.deepEqual(state.companies, [original])
  assert.equal(state.actionError, 'Não foi possível concluir a operação. Tente novamente.')
})

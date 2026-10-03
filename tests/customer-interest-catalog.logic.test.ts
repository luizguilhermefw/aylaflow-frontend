import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  createCustomerInterestCatalogController,
  canManageCustomerInterestCatalog,
  customerInterestCatalogError,
  customerInterestOptionsByType,
  emptyCustomerInterestCatalogState,
} from '../src/features/customer-interest-catalog/customer-interest-catalog.logic.ts'
import type { CustomerInterestCatalogRepository } from '../src/features/customer-interest-catalog/customer-interest-catalog.logic.ts'
import {
  createCustomerInterestCatalogRepository,
  CUSTOMER_INTEREST_OPTIONS_ENDPOINT,
} from '../src/features/customer-interest-catalog/customer-interest-catalog.repository.ts'
import type {
  CustomerInterestCatalogHttpClient,
  CustomerInterestOption,
  CustomerInterestType,
} from '../src/features/customer-interest-catalog/customer-interest-catalog.repository.ts'

const serviceSource = readFileSync(new URL('../src/services/customer-interest-catalog.service.ts', import.meta.url), 'utf8')
const componentSource = readFileSync(new URL('../src/components/settings/CustomerInterestCatalogSettings.vue', import.meta.url), 'utf8')
const settingsSource = readFileSync(new URL('../src/views/Settings.vue', import.meta.url), 'utf8')
const publicViewSource = readFileSync(new URL('../src/views/PublicRegistrationView.vue', import.meta.url), 'utf8')
const routerSource = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')

function option(overrides: Partial<CustomerInterestOption> = {}): CustomerInterestOption {
  return { id: 'option-1', type: 'CATEGORY', name: 'Calçados', active: true, ...overrides }
}

function repository(overrides: Partial<CustomerInterestCatalogRepository> = {}): CustomerInterestCatalogRepository {
  return {
    async list() { return [] },
    async create(type, name) { return option({ id: 'created', type, name }) },
    async update(id, name) { return option({ id, name }) },
    async updateStatus(id, active) { return option({ id, active }) },
    ...overrides,
  }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

function httpError(status: number, technical = 'internal DTO failure') {
  return { response: { status, data: { message: technical } } }
}

test('service reutiliza api.ts e não cria cliente Axios paralelo', () => {
  assert.match(serviceSource, /import api from ['"]\.\/api['"]/)
  assert.doesNotMatch(serviceSource, /axios|axios\.create|baseURL/)
})

test('GET usa endpoint real sem query ou companyId', async () => {
  const calls: string[] = []
  const http = { async get<T>(url: string) { calls.push(url); return { data: [] as T } } } as CustomerInterestCatalogHttpClient
  await createCustomerInterestCatalogRepository(http).list()
  assert.deepEqual(calls, ['/customer-interests/options'])
  assert.equal(CUSTOMER_INTEREST_OPTIONS_ENDPOINT, '/customer-interests/options')
})

for (const role of ['OWNER', 'MANAGER']) {
  test(`${role} pode visualizar e gerenciar o catálogo`, async () => {
    let calls = 0
    const controller = createCustomerInterestCatalogController(repository({ async list() { calls += 1; return [] } }))
    assert.equal(canManageCustomerInterestCatalog(role), true)
    assert.equal(await controller.load(role), true)
    assert.equal(calls, 1)
  })
}

for (const role of ['OPERATOR', 'VIEWER', 'PLATFORM_ADMIN', 'SUPPORT']) {
  test(`${role} não visualiza nem dispara request do catálogo`, async () => {
    let calls = 0
    const controller = createCustomerInterestCatalogController(repository({ async list() { calls += 1; return [] } }))
    assert.equal(canManageCustomerInterestCatalog(role), false)
    assert.equal(await controller.load(role), false)
    assert.equal(calls, 0)
  })
}

test('Settings reutiliza profile/role e só monta catálogo autorizado', () => {
  assert.match(settingsSource, /canManageCustomerInterestCatalog\(currentRole\.value\)/)
  assert.match(settingsSource, /v-if="!profileLoading && canManageInterestCatalog && currentRole"/)
})

for (const type of ['CATEGORY', 'BRAND'] as CustomerInterestType[]) {
  test(`criação ${type} envia exatamente type e name`, async () => {
    const calls: unknown[] = []
    const http = {
      async post<T>(url: string, payload: unknown) { calls.push({ url, payload }); return { data: option({ type }) as T } },
    } as CustomerInterestCatalogHttpClient
    await createCustomerInterestCatalogRepository(http).create(type, type === 'CATEGORY' ? 'Calçados' : 'Nike')
    assert.deepEqual(calls, [{
      url: '/customer-interests/options',
      payload: { type, name: type === 'CATEGORY' ? 'Calçados' : 'Nike' },
    }])
    assert.doesNotMatch(JSON.stringify(calls), /companyId|tenantId|userId|role/)
  })
}

test('edição usa PUT e envia somente name, sem type', async () => {
  const calls: unknown[] = []
  const http = {
    async put<T>(url: string, payload: unknown) { calls.push({ url, payload }); return { data: option({ name: 'Novo nome' }) as T } },
  } as CustomerInterestCatalogHttpClient
  await createCustomerInterestCatalogRepository(http).update('option-1', 'Novo nome')
  assert.deepEqual(calls, [{ url: '/customer-interests/options/option-1', payload: { name: 'Novo nome' } }])
  assert.doesNotMatch(JSON.stringify(calls), /type|companyId|tenantId|userId|role/)
})

test('status usa PATCH e envia somente active', async () => {
  const calls: unknown[] = []
  const http = {
    async patch<T>(url: string, payload: unknown) { calls.push({ url, payload }); return { data: option({ active: false }) as T } },
  } as CustomerInterestCatalogHttpClient
  await createCustomerInterestCatalogRepository(http).updateStatus('option-1', false)
  assert.deepEqual(calls, [{ url: '/customer-interests/options/option-1/status', payload: { active: false } }])
})

test('repository não oferece DELETE', () => {
  const catalog = createCustomerInterestCatalogRepository({} as CustomerInterestCatalogHttpClient)
  assert.equal('delete' in catalog, false)
  assert.doesNotMatch(serviceSource + componentSource, /\.delete\s*\(/)
})

test('categorias e marcas são derivadas separadamente preservando ordem e inativos', () => {
  const inactive = option({ id: 'category-inactive', name: 'Feminino', active: false })
  const brand = option({ id: 'brand', type: 'BRAND', name: 'Nike' })
  const category = option({ id: 'category-active' })
  const source = [inactive, brand, category]
  assert.deepEqual(customerInterestOptionsByType(source, 'CATEGORY'), [inactive, category])
  assert.deepEqual(customerInterestOptionsByType(source, 'BRAND'), [brand])
  assert.equal(source.length, 3)
})

test('opção inativa pode ser reativada usando resposta real', async () => {
  const inactive = option({ active: false })
  const returned = option({ active: true, name: 'Nome do backend' })
  const state = emptyCustomerInterestCatalogState()
  state.options = [inactive]
  const controller = createCustomerInterestCatalogController(repository({ async updateStatus() { return returned } }), state)
  assert.equal(await controller.updateStatus(inactive, true, 'OWNER'), true)
  assert.deepEqual(state.options, [returned])
})

test('status não faz update otimista e bloqueia double-submit', async () => {
  const pending = deferred<CustomerInterestOption>()
  const current = option({ active: true })
  const state = emptyCustomerInterestCatalogState()
  state.options = [current]
  let calls = 0
  const controller = createCustomerInterestCatalogController(repository({
    async updateStatus() { calls += 1; return pending.promise },
  }), state)
  const first = controller.updateStatus(current, false, 'MANAGER')
  assert.equal(state.options[0]?.active, true)
  assert.equal(await controller.updateStatus(current, false, 'MANAGER'), false)
  assert.equal(calls, 1)
  pending.resolve(option({ active: false }))
  assert.equal(await first, true)
  assert.equal(state.options[0]?.active, false)
})

test('create insere resposta real sem duplicar ID existente', async () => {
  const state = emptyCustomerInterestCatalogState()
  state.options = [option({ name: 'Anterior' })]
  const returned = option({ name: 'Normalizado pelo backend' })
  const controller = createCustomerInterestCatalogController(repository({ async create() { return returned } }), state)
  assert.equal(await controller.create('CATEGORY', ' digitado ', 'OWNER'), true)
  assert.deepEqual(state.options, [returned])
})

test('update substitui somente item correspondente com resposta real', async () => {
  const first = option({ id: 'first' })
  const second = option({ id: 'second', type: 'BRAND', name: 'Nike' })
  const returned = option({ id: 'second', type: 'BRAND', name: 'Nike Brasil' })
  const state = emptyCustomerInterestCatalogState()
  state.options = [first, second]
  const controller = createCustomerInterestCatalogController(repository({ async update() { return returned } }), state)
  await controller.update(second, 'Nike Brasil', 'OWNER')
  assert.deepEqual(state.options, [first, returned])
})

test('status substitui somente item correspondente', async () => {
  const first = option({ id: 'first' })
  const second = option({ id: 'second', type: 'BRAND' })
  const returned = option({ id: 'second', type: 'BRAND', active: false })
  const state = emptyCustomerInterestCatalogState()
  state.options = [first, second]
  const controller = createCustomerInterestCatalogController(repository({ async updateStatus() { return returned } }), state)
  await controller.updateStatus(second, false, 'OWNER')
  assert.deepEqual(state.options, [first, returned])
})

test('salvamento de formulário bloqueia double-submit', async () => {
  const pending = deferred<CustomerInterestOption>()
  let calls = 0
  const controller = createCustomerInterestCatalogController(repository({ async create() { calls += 1; return pending.promise } }))
  const first = controller.create('BRAND', 'Nike', 'OWNER')
  assert.equal(await controller.create('BRAND', 'Nike', 'OWNER'), false)
  assert.equal(calls, 1)
  pending.resolve(option({ type: 'BRAND', name: 'Nike' }))
  assert.equal(await first, true)
})

const errorCases: Array<[number, string]> = [
  [400, 'Informe um nome válido.'],
  [403, 'Você não tem permissão para gerenciar os interesses.'],
  [404, 'Esta opção não foi encontrada.'],
]
for (const [status, message] of errorCases) {
  test(`erro ${status} recebe feedback amigável`, () => {
    assert.equal(customerInterestCatalogError(httpError(status)), message)
  })
}

test('409 distingue categoria e marca sem expor resposta técnica', () => {
  assert.equal(customerInterestCatalogError(httpError(409), 'CATEGORY'), 'Já existe uma categoria com esse nome.')
  assert.equal(customerInterestCatalogError(httpError(409), 'BRAND'), 'Já existe uma marca com esse nome.')
})

test('erro genérico não expõe detalhe técnico', () => {
  const message = customerInterestCatalogError(httpError(500, 'SQL stack and internal DTO'))
  assert.equal(message, 'Não foi possível concluir a operação. Tente novamente.')
  assert.doesNotMatch(message, /SQL|DTO|stack/i)
})

test('template separa grupos, vazios, badges e ações por status', () => {
  assert.match(componentSource, /Categorias/)
  assert.match(componentSource, /Marcas/)
  assert.match(componentSource, /Nenhuma categoria cadastrada\./)
  assert.match(componentSource, /Nenhuma marca cadastrada\./)
  assert.match(componentSource, /option\.active \? 'Ativo' : 'Inativo'/)
  assert.match(componentSource, /option\.active \? 'Desativar' : 'Ativar'/)
})

test('feature não usa storage, polling, prompt, confirm nativo ou dados de tenant', () => {
  const source = serviceSource + componentSource
  assert.doesNotMatch(source, /localStorage|sessionStorage|setInterval|setTimeout|window\.prompt|window\.confirm/)
  assert.doesNotMatch(source, /companyId|tenantId|userId|provisioningKey|apiKey/)
})

test('cadastro público permanece usando bootstrap e não duplica catálogo administrativo', () => {
  assert.match(publicViewSource, /bootstrap\.interests\.categories/)
  assert.match(publicViewSource, /bootstrap\.interests\.brands/)
  assert.doesNotMatch(publicViewSource, /customer-interests\/options/)
})

test('não cria nova rota nem altera rota pública para o catálogo', () => {
  assert.doesNotMatch(routerSource, /customer-interest-catalog/)
  assert.match(routerSource, /PublicRegistrationView\.vue/)
})

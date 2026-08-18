import assert from 'node:assert/strict'
import test from 'node:test'
import {
  automationActionFor,
  BRAZILIAN_STATES,
  buildCustomerPayload,
  buildSearchFilters,
  canExecuteCustomerImport,
  CONSENT_LABELS,
  consentActionFor,
  contactToForm,
  createContactsController,
  createCustomerImportController,
  createCustomerImportTemplateController,
  createCustomerRepository,
  CUSTOMER_IMPORT_STATUS_LABELS,
  customerImportConsentLabel,
  customerImportError,
  customerImportRowMessage,
  emptyCustomerImportState,
  emptyCustomerImportTemplateState,
  emptyContactFilters,
  emptyContactForm,
  formatDate,
  GENDER_LABELS,
  validateContactForm,
  validateCustomerImportFile,
} from '../src/features/contacts/contact.logic.ts'
import type {
  CustomerHttpClient,
  CustomerRepository,
} from '../src/features/contacts/contact.logic.ts'
import type {
  ContactConsentStatus,
  ContactFilterValues,
  Customer,
  CustomerImportExecuteResult,
  CustomerImportPreview,
  CustomerMutationPayload,
} from '../src/features/contacts/contact.types.ts'

function customer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 'customer-1',
    name: 'Maria Silva',
    phone: '11999999999',
    gender: 'FEMALE',
    city: 'São Paulo',
    state: 'SP',
    birthDate: '1990-02-10T00:00:00.000Z',
    lastPurchaseDate: '2026-07-20T00:00:00.000Z',
    isActiveForAutomation: true,
    contactConsentStatus: 'GRANTED',
    consentGrantedAt: '2026-07-01T00:00:00.000Z',
    optedOutAt: null,
    companyId: 'company-1',
    createdAt: '2026-07-01T00:00:00.000Z',
    ...overrides,
  }
}

function importFile(name = 'contacts.csv'): File {
  const type = name.endsWith('.xlsx')
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'text/csv'
  return new File(['nome,telefone\nAna,21999999999'], name, { type })
}

function importPreview(): CustomerImportPreview {
  return {
    summary: { totalRows: 4, new: 1, existing: 1, invalid: 1, duplicateInFile: 1 },
    ignoredHeaders: [],
    rows: [
      {
        rowNumber: 2,
        data: { name: 'Novo', phone: '5521999999999', birthDate: null, lastPurchaseDate: null, gender: 'UNSPECIFIED', city: null, state: null, contactConsentStatus: 'GRANTED' },
        errors: [],
        status: 'NEW',
      },
      {
        rowNumber: 3,
        data: { name: 'Existente', phone: '5521988888888', birthDate: null, lastPurchaseDate: null, gender: 'UNSPECIFIED', city: null, state: null, contactConsentStatus: 'UNKNOWN' },
        errors: [],
        status: 'EXISTING',
      },
      {
        rowNumber: 4,
        data: { name: '', phone: '', birthDate: null, lastPurchaseDate: null, gender: 'UNSPECIFIED', city: null, state: null, contactConsentStatus: 'UNKNOWN' },
        errors: [{ field: 'name', code: 'REQUIRED', message: 'Nome obrigatório' }],
        status: 'INVALID',
      },
      {
        rowNumber: 5,
        data: { name: 'Duplicado', phone: '5521999999999', birthDate: null, lastPurchaseDate: null, gender: 'UNSPECIFIED', city: null, state: null, contactConsentStatus: 'OPTED_OUT' },
        errors: [],
        status: 'DUPLICATE_IN_FILE',
      },
    ],
  }
}

function importResult(): CustomerImportExecuteResult {
  const preview = importPreview()
  return {
    summary: { totalRows: 4, imported: 1, existing: 1, invalid: 1, duplicateInFile: 1 },
    rows: preview.rows,
  }
}

function repository(overrides: Partial<CustomerRepository> = {}): CustomerRepository {
  return {
    list: async () => [customer()],
    search: async () => ({
      items: [customer()],
      pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
    }),
    create: async () => customer(),
    update: async () => customer(),
    updateConsent: async (_id, payload) => ({
      id: 'customer-1',
      contactConsentStatus: payload.status,
      consentGrantedAt: payload.status === 'GRANTED' ? '2026-08-14T12:00:00.000Z' : null,
      optedOutAt: payload.status === 'OPTED_OUT' ? '2026-08-14T12:00:00.000Z' : null,
    }),
    toggleAutomation: async () => ({
      id: 'customer-1',
      name: 'Maria Silva',
      phone: '11999999999',
      birthDate: '1990-02-10T00:00:00.000Z',
      lastPurchaseDate: '2026-07-20T00:00:00.000Z',
      isActiveForAutomation: false,
      companyId: 'company-1',
      createdAt: '2026-07-01T00:00:00.000Z',
    }),
    downloadImportTemplate: async () => ({
      blob: new Blob(['template']),
      fileName: 'aylaflow-customer-import.xlsx',
    }),
    previewImport: async () => importPreview(),
    executeImport: async () => importResult(),
    ...overrides,
  }
}

test('usa os nove endpoints reais com chamadas HTTP mockadas', async () => {
  const calls: Array<{ method: string; url: string; payload?: unknown }> = []
  const record = customer()
  const http: CustomerHttpClient = {
    async get<T>(url, config) {
      calls.push({ method: 'GET', url, payload: config?.params })
      if (url.endsWith('/template')) {
        return {
          data: new Blob(['template']) as T,
          headers: { 'content-disposition': 'attachment; filename="aylaflow-customer-import.xlsx"' },
        }
      }
      const data = url.endsWith('/search')
        ? { items: [record], pagination: { page: 1, pageSize: 20, total: 1, totalPages: 1 } }
        : [record]
      return { data: data as T }
    },
    async post<T>(url, payload) {
      calls.push({ method: 'POST', url, payload })
      if (url.endsWith('/preview')) return { data: importPreview() as T }
      if (url.endsWith('/execute')) return { data: importResult() as T }
      return { data: record as T }
    },
    async put<T>(url, payload) {
      calls.push({ method: 'PUT', url, payload })
      return { data: record as T }
    },
    async patch<T>(url, payload) {
      calls.push({ method: 'PATCH', url, payload })
      const data = url.endsWith('/contact-consent')
        ? {
            id: record.id,
            contactConsentStatus: 'GRANTED',
            consentGrantedAt: '2026-08-14T12:00:00.000Z',
            optedOutAt: null,
          }
        : {
            id: record.id,
            name: record.name,
            phone: record.phone,
            birthDate: record.birthDate,
            lastPurchaseDate: record.lastPurchaseDate,
            isActiveForAutomation: false,
            companyId: record.companyId,
            createdAt: record.createdAt,
          }
      return { data: data as T }
    },
  }
  const service = createCustomerRepository(http)
  const payload = buildCustomerPayload({ ...emptyContactForm(), name: 'Maria', phone: '11999999999' })
  const filters = buildSearchFilters(emptyContactFilters())

  await service.list()
  await service.search(filters)
  await service.create(payload)
  await service.update('customer-1', payload)
  await service.updateConsent('customer-1', { status: 'GRANTED' })
  await service.toggleAutomation('customer-1')
  await service.downloadImportTemplate()
  await service.previewImport(importFile())
  await service.executeImport(importFile())

  assert.deepEqual(calls.map(({ method, url }) => `${method} ${url}`), [
    'GET /customer',
    'GET /customer/search',
    'POST /customer',
    'PUT /customer/customer-1',
    'PATCH /customer/customer-1/contact-consent',
    'PATCH /customer/customer-1/toggle-automation',
    'GET /customer/import/template',
    'POST /customer/import/preview',
    'POST /customer/import/execute',
  ])
})

test('download do modelo solicita blob e preserva o nome retornado pelo backend', async () => {
  let requestedUrl = ''
  let requestedResponseType = ''
  const templateBlob = new Blob(['xlsx'], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const http: CustomerHttpClient = {
    async get<T>(url, config) {
      requestedUrl = url
      requestedResponseType = config?.responseType ?? ''
      return {
        data: templateBlob as T,
        headers: { 'content-disposition': 'attachment; filename="modelo-clientes.xlsx"' },
      }
    },
    async post<T>() { return { data: customer() as T } },
    async put<T>() { return { data: customer() as T } },
    async patch<T>() { return { data: customer() as T } },
  }

  const template = await createCustomerRepository(http).downloadImportTemplate()

  assert.equal(requestedUrl, '/customer/import/template')
  assert.equal(requestedResponseType, 'blob')
  assert.equal(template.blob, templateBlob)
  assert.equal(template.fileName, 'modelo-clientes.xlsx')
})

test('erro no download do modelo produz feedback amigável e libera nova tentativa', async () => {
  const state = emptyCustomerImportTemplateState()
  const controller = createCustomerImportTemplateController(repository({
    downloadImportTemplate: async () => { throw new Error('network') },
  }), state)

  const result = await controller.download()

  assert.equal(result, null)
  assert.equal(state.downloading, false)
  assert.equal(state.error, 'Não foi possível baixar o modelo. Tente novamente.')
})

test('fluxo abre o modal no estado idle', () => {
  const state = emptyCustomerImportState()
  const controller = createCustomerImportController(repository(), state)

  controller.open()

  assert.equal(state.open, true)
  assert.equal(state.stage, 'idle')
  assert.equal(state.file, null)
})

test('aceita arquivo .xlsx', () => {
  assert.equal(validateCustomerImportFile(importFile('clientes.xlsx')), '')
})

test('aceita arquivo .csv', () => {
  assert.equal(validateCustomerImportFile(importFile('clientes.csv')), '')
})

test('bloqueia extensão de arquivo não suportada', () => {
  assert.equal(
    validateCustomerImportFile(importFile('clientes.txt')),
    'Selecione um arquivo .xlsx ou .csv.',
  )
})

test('preview envia multipart com somente o File no campo file', async () => {
  const selectedFile = importFile('clientes.csv')
  let postedUrl = ''
  let postedBody: FormData | null = null
  const http: CustomerHttpClient = {
    async get<T>() { return { data: [] as T } },
    async post<T>(url, payload) {
      postedUrl = url
      postedBody = payload as FormData
      return { data: importPreview() as T }
    },
    async put<T>() { return { data: customer() as T } },
    async patch<T>() { return { data: customer() as T } },
  }

  await createCustomerRepository(http).previewImport(selectedFile)

  assert.equal(postedUrl, '/customer/import/preview')
  assert.equal(postedBody instanceof FormData, true)
  assert.equal(postedBody?.get('file'), selectedFile)
  assert.deepEqual([...postedBody!.keys()], ['file'])
})

test('preview valida sem executar importação', async () => {
  let previewCalls = 0
  let executeCalls = 0
  const controller = createCustomerImportController(repository({
    previewImport: async () => {
      previewCalls += 1
      return importPreview()
    },
    executeImport: async () => {
      executeCalls += 1
      return importResult()
    },
  }))
  controller.open()
  controller.selectFile(importFile())

  await controller.preview()

  assert.equal(previewCalls, 1)
  assert.equal(executeCalls, 0)
  assert.equal(controller.state.stage, 'ready')
})

test('traduz os quatro status do preview', () => {
  assert.deepEqual(CUSTOMER_IMPORT_STATUS_LABELS, {
    NEW: 'Novo',
    EXISTING: 'Já cadastrado',
    INVALID: 'Inválido',
    DUPLICATE_IN_FILE: 'Duplicado na planilha',
  })
})

test('linha do preview contém contactConsentStatus normalizado', () => {
  const row = importPreview().rows[0]!
  assert.equal(row.data.contactConsentStatus, 'GRANTED')
})

test('consentimento GRANTED do preview é apresentado como Consentido', () => {
  assert.equal(customerImportConsentLabel('GRANTED'), 'Consentido')
})

test('consentimento UNKNOWN do preview é apresentado como Não definido', () => {
  assert.equal(customerImportConsentLabel('UNKNOWN'), 'Não definido')
})

test('consentimento OPTED_OUT do preview é apresentado como Bloqueado', () => {
  assert.equal(customerImportConsentLabel('OPTED_OUT'), 'Bloqueado')
})

test('frontend não interpreta valores brutos de consentimento da planilha', () => {
  for (const rawValue of ['SIM', 'X', 'TRUE']) {
    assert.equal(customerImportConsentLabel(rawValue as ContactConsentStatus), undefined)
  }
})

test('detalha INVALID, EXISTING e DUPLICATE_IN_FILE sem dados internos', () => {
  const rows = importPreview().rows
  assert.equal(customerImportRowMessage(rows[2]!), 'Nome obrigatório')
  assert.equal(customerImportRowMessage(rows[1]!), 'O contato já existe e não será sobrescrito.')
  assert.equal(customerImportRowMessage(rows[3]!), 'Esta linha não será importada.')
  assert.equal('companyId' in rows[0]!.data, false)
})

test('execute só fica disponível depois de preview concluído', async () => {
  const state = emptyCustomerImportState()
  const controller = createCustomerImportController(repository(), state)
  controller.open()
  controller.selectFile(importFile())

  assert.equal(canExecuteCustomerImport(state), false)
  await controller.preview()
  assert.equal(canExecuteCustomerImport(state), true)
})

test('execute envia novamente exatamente o mesmo File selecionado', async () => {
  const selectedFile = importFile()
  let previewFile: File | null = null
  let executeFile: File | null = null
  const controller = createCustomerImportController(repository({
    previewImport: async (file) => {
      previewFile = file
      return importPreview()
    },
    executeImport: async (file) => {
      executeFile = file
      return importResult()
    },
  }))
  controller.open()
  controller.selectFile(selectedFile)

  await controller.preview()
  await controller.execute()

  assert.equal(previewFile, selectedFile)
  assert.equal(executeFile, selectedFile)
})

test('trocar arquivo invalida imediatamente o preview anterior', async () => {
  const firstFile = importFile('primeiro.csv')
  const secondFile = importFile('segundo.csv')
  const controller = createCustomerImportController(repository())
  controller.open()
  controller.selectFile(firstFile)
  await controller.preview()
  assert.notEqual(controller.state.preview, null)

  controller.selectFile(secondFile)

  assert.equal(controller.state.file, secondFile)
  assert.equal(controller.state.preview, null)
  assert.equal(canExecuteCustomerImport(controller.state), false)
})

test('trocar arquivo durante preview descarta resposta obsoleta', async () => {
  let resolvePreview: ((preview: CustomerImportPreview) => void) | undefined
  const pendingPreview = new Promise<CustomerImportPreview>((resolve) => { resolvePreview = resolve })
  const controller = createCustomerImportController(repository({
    previewImport: () => pendingPreview,
  }))
  controller.open()
  controller.selectFile(importFile('primeiro.csv'))
  const request = controller.preview()

  controller.selectFile(importFile('segundo.csv'))
  resolvePreview?.(importPreview())
  await request

  assert.equal(controller.state.preview, null)
  assert.equal(controller.state.stage, 'idle')
})

test('remover arquivo invalida preview e bloqueia execute', async () => {
  const controller = createCustomerImportController(repository())
  controller.open()
  controller.selectFile(importFile())
  await controller.preview()

  controller.removeFile()

  assert.equal(controller.state.file, null)
  assert.equal(controller.state.preview, null)
  assert.equal(canExecuteCustomerImport(controller.state), false)
})

test('duplo clique no execute dispara apenas uma requisição', async () => {
  let executeCalls = 0
  let resolveExecute: ((result: CustomerImportExecuteResult) => void) | undefined
  const pendingExecute = new Promise<CustomerImportExecuteResult>((resolve) => { resolveExecute = resolve })
  const controller = createCustomerImportController(repository({
    executeImport: () => {
      executeCalls += 1
      return pendingExecute
    },
  }))
  controller.open()
  controller.selectFile(importFile())
  await controller.preview()

  const first = controller.execute()
  const second = controller.execute()
  assert.equal(executeCalls, 1)
  assert.equal(await second, null)
  resolveExecute?.(importResult())
  await first
})

test('sucesso do execute recarrega a listagem por callback', async () => {
  let reloadCalls = 0
  const controller = createCustomerImportController(repository())
  controller.open()
  controller.selectFile(importFile())
  await controller.preview()

  const result = await controller.execute(() => { reloadCalls += 1 })

  assert.equal(result?.summary.imported, 1)
  assert.equal(controller.state.stage, 'success')
  assert.equal(reloadCalls, 1)
})

test('erro no execute mantém arquivo e preview seguros para nova tentativa', async () => {
  const selectedFile = importFile()
  const preview = importPreview()
  const controller = createCustomerImportController(repository({
    previewImport: async () => preview,
    executeImport: async () => { throw { response: { status: 413, data: {} } } },
  }))
  controller.open()
  controller.selectFile(selectedFile)
  await controller.preview()

  const result = await controller.execute()

  assert.equal(result, null)
  assert.equal(controller.state.file, selectedFile)
  assert.equal(controller.state.preview, preview)
  assert.equal(controller.state.stage, 'error')
  assert.equal(controller.state.error, 'O arquivo excede o limite permitido de 5 MB.')
  assert.equal(canExecuteCustomerImport(controller.state), true)
})

test('frontend não canonicaliza telefone nem envia companyId no multipart', async () => {
  const rawContents = 'nome,telefone\nAna,(21) 99999-9999'
  const selectedFile = new File([rawContents], 'clientes.csv', { type: 'text/csv' })
  let uploadedFile: File | null = null
  const controller = createCustomerImportController(repository({
    previewImport: async (file) => {
      uploadedFile = file
      return importPreview()
    },
  }))
  controller.open()
  controller.selectFile(selectedFile)

  await controller.preview()

  assert.equal(uploadedFile, selectedFile)
  assert.equal(await uploadedFile!.text(), rawContents)
  assert.equal('companyId' in controller.state, false)
})

test('mapeia erros conhecidos de arquivo sem expor detalhes internos', () => {
  const error = {
    response: {
      status: 400,
      data: { message: 'Customer import requires name and phone' },
    },
  }
  assert.equal(
    customerImportError(error, 'preview'),
    'A planilha precisa conter as colunas nome e telefone.',
  )
})

test('carrega e lista os contatos retornados', async () => {
  const controller = createContactsController(repository())
  await controller.load()
  assert.equal(controller.state.contacts.length, 1)
  assert.equal(controller.state.contacts[0]?.name, 'Maria Silva')
  assert.equal(controller.state.loadError, false)
})

test('mantém estado de loading enquanto a listagem está pendente', async () => {
  let resolveList: ((items: Customer[]) => void) | undefined
  const pending = new Promise<Customer[]>((resolve) => { resolveList = resolve })
  const controller = createContactsController(repository({ list: () => pending }))

  const request = controller.load()
  assert.equal(controller.state.loading, true)
  resolveList?.([])
  await request
  assert.equal(controller.state.loading, false)
})

test('representa corretamente uma listagem vazia', async () => {
  const controller = createContactsController(repository({ list: async () => [] }))
  await controller.load()
  assert.deepEqual(controller.state.contacts, [])
  assert.equal(controller.state.loadError, false)
})

test('limpa a lista e sinaliza erro quando a listagem falha', async () => {
  const controller = createContactsController(repository({
    list: async () => { throw new Error('network') },
  }))
  await controller.load()
  assert.deepEqual(controller.state.contacts, [])
  assert.equal(controller.state.loadError, true)
})

test('cria contato e o adiciona ao início da lista', async () => {
  const created = customer({ id: 'customer-2', name: 'João Souza', gender: 'MALE' })
  let receivedPayload: CustomerMutationPayload | undefined
  const controller = createContactsController(repository({
    create: async (payload) => {
      receivedPayload = payload
      return created
    },
  }))
  const payload = buildCustomerPayload({ ...emptyContactForm(), name: 'João Souza', phone: '21999999999', gender: 'MALE' })

  const result = await controller.create(payload)

  assert.equal(result?.id, 'customer-2')
  assert.deepEqual(receivedPayload, payload)
  assert.equal(controller.state.contacts[0]?.id, 'customer-2')
})

test('associa conflito 409 ao campo phone', async () => {
  const controller = createContactsController(repository({
    create: async () => { throw { response: { status: 409 } } },
  }))
  const result = await controller.create({ name: 'Maria', phone: '11999999999' })
  assert.equal(result, null)
  assert.equal(controller.state.saveFieldErrors.phone, 'Já existe um contato cadastrado com este telefone.')
  assert.equal(controller.state.saveError, 'Revise os campos destacados.')
})

test('associa telefone inválido rejeitado pelo backend ao campo phone', async () => {
  const controller = createContactsController(repository({
    create: async () => {
      throw { response: { status: 400, data: { message: ['phone must be a valid phone number'] } } }
    },
  }))
  await controller.create({ name: 'Maria', phone: 'inválido' })
  assert.equal(controller.state.saveFieldErrors.phone, 'Informe um telefone válido com DDD.')
  assert.equal(controller.state.saveError, 'Revise os campos destacados.')
})

test('edição também associa telefone inválido ao campo phone', async () => {
  const original = customer()
  const controller = createContactsController(repository({
    update: async () => {
      throw { response: { status: 400, data: { message: 'telefone inválido' } } }
    },
  }))

  await controller.update(original.id, { name: original.name, phone: 'inválido' })

  assert.equal(controller.state.saveFieldErrors.phone, 'Informe um telefone válido com DDD.')
  assert.equal(controller.state.saveError, 'Revise os campos destacados.')
})

test('erro de campo não altera os demais valores informados no formulário', async () => {
  const form = {
    ...emptyContactForm(),
    name: 'Maria Oliveira',
    phone: 'inválido',
    gender: 'FEMALE' as const,
    city: 'Campinas',
    state: 'SP',
    birthDate: '1990-05-10',
    lastPurchaseDate: '2026-08-01',
  }
  const originalValues = { ...form }
  const controller = createContactsController(repository({
    create: async () => {
      throw { response: { status: 400, data: { message: 'phone is invalid' } } }
    },
  }))

  await controller.create(buildCustomerPayload(form))

  assert.deepEqual(form, originalValues)
  assert.equal(controller.state.saveFieldErrors.phone, 'Informe um telefone válido com DDD.')
})

test('erro desconhecido usa feedback genérico seguro', async () => {
  const controller = createContactsController(repository({
    create: async () => { throw new Error('SQL connection failed') },
  }))

  await controller.create({ name: 'Maria', phone: '11999999999' })

  assert.deepEqual(controller.state.saveFieldErrors, {})
  assert.equal(controller.state.saveError, 'Não foi possível salvar o contato. Tente novamente.')
})

test('edita um contato sem duplicá-lo na lista', async () => {
  const original = customer()
  const updated = customer({ name: 'Maria Oliveira', city: 'Campinas' })
  const controller = createContactsController(repository({
    list: async () => [original],
    update: async () => updated,
  }))
  await controller.load()
  await controller.update(original.id, { name: updated.name, phone: updated.phone })
  assert.equal(controller.state.contacts.length, 1)
  assert.equal(controller.state.contacts[0]?.name, 'Maria Oliveira')
})

test('monta filtros suportados com paginação e sem inventar telefone', () => {
  const values: ContactFilterValues = {
    gender: 'FEMALE',
    city: ' Recife ',
    state: 'PE',
    minAge: '25',
    maxAge: '45',
    lastPurchaseBefore: '2026-08-01',
    lastPurchaseAfter: '2026-01-01',
    pageSize: 50,
  }
  const filters = buildSearchFilters(values, 3)
  assert.deepEqual(filters, {
    gender: 'FEMALE',
    city: 'Recife',
    state: 'PE',
    minAge: 25,
    maxAge: 45,
    lastPurchaseBefore: '2026-08-01',
    lastPurchaseAfter: '2026-01-01',
    page: 3,
    pageSize: 50,
  })
  assert.equal('phone' in filters, false)
})

test('usa busca paginada e preserva o envelope retornado', async () => {
  const controller = createContactsController(repository({
    search: async () => ({
      items: [customer()],
      pagination: { page: 2, pageSize: 10, total: 12, totalPages: 2 },
    }),
  }))
  await controller.load({ page: 2, pageSize: 10 })
  assert.deepEqual(controller.state.pagination, { page: 2, pageSize: 10, total: 12, totalPages: 2 })
})

test('limpar filtros restaura todos os valores iniciais', () => {
  const cleared = emptyContactFilters()
  assert.deepEqual(cleared, {
    gender: '', city: '', state: '', minAge: '', maxAge: '',
    lastPurchaseBefore: '', lastPurchaseAfter: '', pageSize: 20,
  })
})

test('traduz os três badges de consentimento', () => {
  assert.deepEqual(CONSENT_LABELS, {
    GRANTED: 'Consentido', UNKNOWN: 'Não definido', OPTED_OUT: 'Bloqueado',
  })
})

test('expõe o bloqueio e a data de opt-out no perfil', () => {
  const optedOut = customer({
    contactConsentStatus: 'OPTED_OUT',
    consentGrantedAt: null,
    optedOutAt: '2026-08-10T13:00:00.000Z',
  })
  assert.equal(CONSENT_LABELS[optedOut.contactConsentStatus], 'Bloqueado')
  assert.equal(formatDate(optedOut.optedOutAt), '10/08/2026')
})

test('atualiza consentimento de UNKNOWN para GRANTED', async () => {
  const original = customer({
    contactConsentStatus: 'UNKNOWN',
    consentGrantedAt: null,
    optedOutAt: null,
  })
  const controller = createContactsController(repository({ list: async () => [original] }))
  await controller.load()

  const updated = await controller.updateConsent(original.id, 'GRANTED')

  assert.equal(updated?.contactConsentStatus, 'GRANTED')
  assert.equal(updated?.isActiveForAutomation, true)
})

test('GRANTED preserva e exibe consentGrantedAt retornado pela API', async () => {
  const original = customer({ contactConsentStatus: 'UNKNOWN', consentGrantedAt: null })
  const grantedAt = '2026-08-14T15:30:00.000Z'
  const controller = createContactsController(repository({
    list: async () => [original],
    updateConsent: async () => ({
      id: original.id,
      contactConsentStatus: 'GRANTED',
      consentGrantedAt: grantedAt,
      optedOutAt: null,
    }),
  }))
  await controller.load()

  const updated = await controller.updateConsent(original.id, 'GRANTED')

  assert.equal(updated?.consentGrantedAt, grantedAt)
  assert.equal(formatDate(updated?.consentGrantedAt ?? null), '14/08/2026')
})

test('atualiza consentimento de GRANTED para OPTED_OUT', async () => {
  const original = customer()
  const controller = createContactsController(repository({ list: async () => [original] }))
  await controller.load()

  const updated = await controller.updateConsent(original.id, 'OPTED_OUT')

  assert.equal(updated?.contactConsentStatus, 'OPTED_OUT')
  assert.equal(updated?.isActiveForAutomation, true)
})

test('OPTED_OUT preserva e exibe optedOutAt retornado pela API', async () => {
  const original = customer()
  const optedOutAt = '2026-08-14T16:00:00.000Z'
  const controller = createContactsController(repository({
    list: async () => [original],
    updateConsent: async () => ({
      id: original.id,
      contactConsentStatus: 'OPTED_OUT',
      consentGrantedAt: original.consentGrantedAt,
      optedOutAt,
    }),
  }))
  await controller.load()

  const updated = await controller.updateConsent(original.id, 'OPTED_OUT')

  assert.equal(updated?.optedOutAt, optedOutAt)
  assert.equal(formatDate(updated?.optedOutAt ?? null), '14/08/2026')
})

test('reativação após OPTED_OUT exige confirmação explícita específica', () => {
  const action = consentActionFor(customer({ contactConsentStatus: 'OPTED_OUT' }))

  assert.equal(action.status, 'GRANTED')
  assert.equal(action.label, 'Registrar novo consentimento')
  assert.equal(action.confirmation, 'O cliente confirmou novamente que deseja receber mensagens promocionais?')
})

test('erro de consentimento preserva integralmente o estado anterior', async () => {
  const original = customer({ contactConsentStatus: 'UNKNOWN', consentGrantedAt: null })
  const controller = createContactsController(repository({
    list: async () => [original],
    updateConsent: async () => { throw new Error('network') },
  }))
  await controller.load()

  const result = await controller.updateConsent(original.id, 'GRANTED')

  assert.equal(result, null)
  assert.deepEqual(controller.state.contacts[0], original)
  assert.equal(controller.state.actionError, 'Não foi possível atualizar o consentimento. Tente novamente.')
})

test('payload de consentimento contém somente status', async () => {
  const payloads: unknown[] = []
  const record = customer({ contactConsentStatus: 'UNKNOWN', consentGrantedAt: null })
  const http: CustomerHttpClient = {
    async get<T>() { return { data: [record] as T } },
    async post<T>() { return { data: record as T } },
    async put<T>() { return { data: record as T } },
    async patch<T>(_url, payload) {
      payloads.push(payload)
      return {
        data: {
          id: record.id,
          contactConsentStatus: 'GRANTED',
          consentGrantedAt: '2026-08-14T12:00:00.000Z',
          optedOutAt: null,
        } as T,
      }
    },
  }

  await createCustomerRepository(http).updateConsent(record.id, { status: 'GRANTED' })

  assert.deepEqual(payloads[0], { status: 'GRANTED' })
  assert.equal('companyId' in (payloads[0] as Record<string, unknown>), false)
  assert.equal('consentGrantedAt' in (payloads[0] as Record<string, unknown>), false)
  assert.equal('optedOutAt' in (payloads[0] as Record<string, unknown>), false)
})

test('toggle altera contato ativo para inativo', async () => {
  const original = customer({ isActiveForAutomation: true })
  const controller = createContactsController(repository({ list: async () => [original] }))
  await controller.load()

  const updated = await controller.toggleAutomation(original.id)

  assert.equal(updated?.isActiveForAutomation, false)
})

test('toggle altera contato inativo para ativo', async () => {
  const original = customer({ isActiveForAutomation: false })
  const controller = createContactsController(repository({
    list: async () => [original],
    toggleAutomation: async () => ({
      id: original.id,
      name: original.name,
      phone: original.phone,
      birthDate: original.birthDate,
      lastPurchaseDate: original.lastPurchaseDate,
      isActiveForAutomation: true,
      companyId: original.companyId,
      createdAt: original.createdAt,
    }),
  }))
  await controller.load()

  const updated = await controller.toggleAutomation(original.id)

  assert.equal(updated?.isActiveForAutomation, true)
})

test('toggle não altera o consentimento existente', async () => {
  const original = customer({ contactConsentStatus: 'GRANTED', isActiveForAutomation: true })
  const controller = createContactsController(repository({ list: async () => [original] }))
  await controller.load()

  const updated = await controller.toggleAutomation(original.id)

  assert.equal(updated?.contactConsentStatus, 'GRANTED')
  assert.equal(updated?.consentGrantedAt, original.consentGrantedAt)
})

test('OPTED_OUT permanece bloqueado ao ativar o contato', async () => {
  const original = customer({
    contactConsentStatus: 'OPTED_OUT',
    consentGrantedAt: null,
    optedOutAt: '2026-08-10T13:00:00.000Z',
    isActiveForAutomation: false,
  })
  const controller = createContactsController(repository({
    list: async () => [original],
    toggleAutomation: async () => ({
      id: original.id,
      name: original.name,
      phone: original.phone,
      birthDate: original.birthDate,
      lastPurchaseDate: original.lastPurchaseDate,
      isActiveForAutomation: true,
      companyId: original.companyId,
      createdAt: original.createdAt,
    }),
  }))
  await controller.load()

  const updated = await controller.toggleAutomation(original.id)

  assert.equal(updated?.isActiveForAutomation, true)
  assert.equal(updated?.contactConsentStatus, 'OPTED_OUT')
  assert.equal(updated?.optedOutAt, original.optedOutAt)
})

test('erro no toggle preserva integralmente o estado anterior', async () => {
  const original = customer({ isActiveForAutomation: true })
  const controller = createContactsController(repository({
    list: async () => [original],
    toggleAutomation: async () => { throw new Error('network') },
  }))
  await controller.load()

  const result = await controller.toggleAutomation(original.id)

  assert.equal(result, null)
  assert.deepEqual(controller.state.contacts[0], original)
  assert.equal(controller.state.actionError, 'Não foi possível alterar a participação do contato. Tente novamente.')
})

test('ações de ativação apresentam confirmação coerente com o estado', () => {
  assert.equal(
    automationActionFor(customer({ isActiveForAutomation: true })).label,
    'Desativar contato',
  )
  assert.equal(
    automationActionFor(customer({ isActiveForAutomation: false })).confirmation,
    'Este contato voltará a ficar elegível para automações e campanhas, respeitando as regras de consentimento. Deseja continuar?',
  )
})

test('classifica corretamente ações positivas e destrutivas', () => {
  assert.equal(
    consentActionFor(customer({ contactConsentStatus: 'GRANTED' })).tone,
    'destructive',
  )
  assert.equal(
    consentActionFor(customer({ contactConsentStatus: 'OPTED_OUT' })).tone,
    'positive',
  )
  assert.equal(
    consentActionFor(customer({ contactConsentStatus: 'UNKNOWN' })).tone,
    'positive',
  )
  assert.equal(
    automationActionFor(customer({ isActiveForAutomation: true })).tone,
    'destructive',
  )
  assert.equal(
    automationActionFor(customer({ isActiveForAutomation: false })).tone,
    'positive',
  )
})

test('mantém datas opcionais fora do formulário e envia última compra como null', () => {
  const withoutDates = customer({ birthDate: null, lastPurchaseDate: null })
  const form = contactToForm(withoutDates)
  const payload = buildCustomerPayload(form)
  assert.equal(form.birthDate, '')
  assert.equal(form.lastPurchaseDate, '')
  assert.equal('birthDate' in payload, false)
  assert.equal(payload.lastPurchaseDate, null)
})

test('telefone é obrigatório sem reproduzir validação completa no frontend', () => {
  const errors = validateContactForm({
    ...emptyContactForm(),
    name: 'Contato novo',
    phone: '   ',
  })

  assert.equal(errors.phone, 'Informe o telefone do contato.')
})

test('payload preserva o telefone informado sem canonicalização local', () => {
  const phone = '+55 (11) 99999-9999'
  const payload = buildCustomerPayload({
    ...emptyContactForm(),
    name: 'Contato novo',
    phone,
  })

  assert.equal(payload.phone, phone)
})

test('cadastro sem birthDate continua válido', () => {
  const form = { ...emptyContactForm(), name: 'Contato novo', phone: '11988887777' }
  const errors = validateContactForm(form)
  const payload = buildCustomerPayload(form)

  assert.equal(errors.birthDate, undefined)
  assert.equal('birthDate' in payload, false)
})

test('edição mantendo birthDate existente continua válida', () => {
  const originalBirthDate = '1990-02-10T00:00:00.000Z'
  const form = contactToForm(customer({ birthDate: originalBirthDate }))
  const errors = validateContactForm(form, { originalBirthDate })
  const payload = buildCustomerPayload(form)

  assert.equal(errors.birthDate, undefined)
  assert.equal(payload.birthDate, '1990-02-10')
})

test('edição alterando birthDate existente continua válida', () => {
  const originalBirthDate = '1990-02-10T00:00:00.000Z'
  const form = { ...contactToForm(customer({ birthDate: originalBirthDate })), birthDate: '1991-03-11' }
  const errors = validateContactForm(form, { originalBirthDate })
  const payload = buildCustomerPayload(form)

  assert.equal(errors.birthDate, undefined)
  assert.equal(payload.birthDate, '1991-03-11')
})

test('edição bloqueia remoção de birthDate existente', () => {
  const originalBirthDate = '1990-02-10T00:00:00.000Z'
  const form = { ...contactToForm(customer({ birthDate: originalBirthDate })), birthDate: '' }
  const errors = validateContactForm(form, { originalBirthDate })

  assert.equal(errors.birthDate, 'A data de nascimento não pode ser removida neste momento.')
})

test('edição permite apagar lastPurchaseDate e a envia como null', () => {
  const form = { ...contactToForm(customer()), lastPurchaseDate: '' }
  const payload = buildCustomerPayload(form)

  assert.equal(payload.lastPurchaseDate, null)
})

test('aceita todas as UFs oficiais e rejeita valor fora da lista', () => {
  assert.equal(BRAZILIAN_STATES.length, 27)
  for (const state of BRAZILIAN_STATES) {
    const errors = validateContactForm({ ...emptyContactForm(), name: 'Teste', phone: '11999999999', state })
    assert.equal(errors.state, undefined)
  }
  const errors = validateContactForm({ ...emptyContactForm(), name: 'Teste', phone: '11999999999', state: 'XX' })
  assert.equal(errors.state, 'Selecione uma UF válida.')
})

test('suporta os três valores reais de gender', () => {
  assert.deepEqual(GENDER_LABELS, {
    FEMALE: 'Feminino', MALE: 'Masculino', UNSPECIFIED: 'Não informado',
  })
  const payload = buildCustomerPayload({ ...emptyContactForm(), name: 'Alex', phone: '11999999999', gender: 'UNSPECIFIED' })
  assert.equal(payload.gender, 'UNSPECIFIED')
})

test('envia UF, gênero e datas válidas sem incluir campos internos', () => {
  const payload = buildCustomerPayload({
    ...emptyContactForm(),
    name: 'Ana Costa',
    phone: '21988887777',
    gender: 'FEMALE',
    city: 'Niterói',
    state: 'RJ',
    birthDate: '1992-04-15',
    lastPurchaseDate: '2026-08-12',
  })

  assert.deepEqual(payload, {
    name: 'Ana Costa',
    phone: '21988887777',
    gender: 'FEMALE',
    city: 'Niterói',
    state: 'RJ',
    birthDate: '1992-04-15',
    lastPurchaseDate: '2026-08-12',
  })
  assert.equal('companyId' in payload, false)
  assert.equal('contactConsentStatus' in payload, false)
})

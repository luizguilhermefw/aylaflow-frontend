import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  canManageCustomerRegistrationLink,
  createCustomerRegistrationLinkController,
  customerRegistrationLinkActionError,
  customerRegistrationLinkQrError,
  emptyCustomerRegistrationLinkState,
} from '../src/features/customer-registration-link/customer-registration-link.logic.ts'
import type {
  CustomerRegistrationLinkClipboard,
  CustomerRegistrationLinkRepository,
} from '../src/features/customer-registration-link/customer-registration-link.logic.ts'
import {
  CUSTOMER_REGISTRATION_LINK_ENDPOINT,
  CUSTOMER_REGISTRATION_LINK_QR_ENDPOINT,
  CUSTOMER_REGISTRATION_LINK_ROTATE_ENDPOINT,
  CUSTOMER_REGISTRATION_LINK_STATUS_ENDPOINT,
  createCustomerRegistrationLinkRepository,
} from '../src/features/customer-registration-link/customer-registration-link.repository.ts'
import type {
  CustomerRegistrationLink,
  CustomerRegistrationLinkHttpClient,
  CustomerRegistrationQrCode,
} from '../src/features/customer-registration-link/customer-registration-link.repository.ts'
import {
  CUSTOMER_REGISTRATION_QR_FILENAME,
  createBrowserCustomerRegistrationQrExporter,
  waitForQrImageAndPrint,
} from '../src/features/customer-registration-link/customer-registration-link-export.logic.ts'
import type {
  CustomerRegistrationQrDownloadRuntime,
  CustomerRegistrationQrExporter,
} from '../src/features/customer-registration-link/customer-registration-link-export.logic.ts'

const serviceSource = readFileSync(
  new URL('../src/services/customer-registration-link.service.ts', import.meta.url),
  'utf8',
)
const componentSource = readFileSync(
  new URL('../src/components/settings/CustomerRegistrationLinkSettings.vue', import.meta.url),
  'utf8',
)
const settingsSource = readFileSync(new URL('../src/views/Settings.vue', import.meta.url), 'utf8')
const modalSource = readFileSync(
  new URL('../src/components/settings/CustomerRegistrationLinkRotateModal.vue', import.meta.url),
  'utf8',
)
const exportSource = readFileSync(
  new URL('../src/features/customer-registration-link/customer-registration-link-export.logic.ts', import.meta.url),
  'utf8',
)
const packageSource = readFileSync(new URL('../package.json', import.meta.url), 'utf8')

function link(overrides: Partial<CustomerRegistrationLink> = {}): CustomerRegistrationLink {
  return {
    publicId: 'A'.repeat(43),
    active: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    publicPath: `/register/${'A'.repeat(43)}`,
    ...overrides,
  }
}

function qr(overrides: Partial<CustomerRegistrationQrCode> = {}): CustomerRegistrationQrCode {
  return {
    publicUrl: `https://app.example.com/register/${'A'.repeat(43)}`,
    qrCodeDataUrl: 'data:image/png;base64,QUJDRA==',
    ...overrides,
  }
}

function repository(
  overrides: Partial<CustomerRegistrationLinkRepository> = {},
): CustomerRegistrationLinkRepository {
  return {
    async getLink() { return link() },
    async createLink() { return link() },
    async rotateLink() { return link({ publicId: 'B'.repeat(43), publicPath: `/register/${'B'.repeat(43)}` }) },
    async updateStatus(active) { return link({ active }) },
    async getQrCode() { return qr() },
    ...overrides,
  }
}

function responseError(status: number): { response: { status: number } } {
  return { response: { status } }
}

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((done) => { resolve = done })
  return { promise, resolve }
}

class FakePrintableImage {
  complete: boolean
  naturalWidth: number
  private listeners = new Map<string, Set<EventListener>>()

  constructor(complete: boolean, naturalWidth: number) {
    this.complete = complete
    this.naturalWidth = naturalWidth
  }

  addEventListener(type: string, listener: EventListener): void {
    const listeners = this.listeners.get(type) ?? new Set<EventListener>()
    listeners.add(listener)
    this.listeners.set(type, listeners)
  }

  removeEventListener(type: string, listener: EventListener): void {
    this.listeners.get(type)?.delete(listener)
  }

  emit(type: 'load' | 'error'): void {
    for (const listener of [...(this.listeners.get(type) ?? [])]) {
      listener({ type } as Event)
    }
  }

  listenerCount(type: 'load' | 'error'): number {
    return this.listeners.get(type)?.size ?? 0
  }
}

function printableWindow(calls: string[]): Window {
  return {
    focus() { calls.push('focus') },
    print() { calls.push('print') },
  } as unknown as Window
}

test('service autenticado reutiliza api.ts e não cria Axios paralelo', () => {
  assert.match(serviceSource, /import api from ['"]\.\/api['"]/)
  assert.doesNotMatch(serviceSource, /axios|axios\.create|baseURL/)
})

test('GET usa /customer-registration-link e preserva publicPath', async () => {
  const expected = link()
  const calls: string[] = []
  const http: CustomerRegistrationLinkHttpClient = {
    async get<T>(url) { calls.push(url); return { data: expected as T } },
    async post<T>() { throw new Error('not expected') as T },
    async patch<T>() { throw new Error('not expected') as T },
  }
  const result = await createCustomerRegistrationLinkRepository(http).getLink()
  assert.deepEqual(calls, [CUSTOMER_REGISTRATION_LINK_ENDPOINT])
  assert.equal(result.publicPath, expected.publicPath)
})

test('POST create usa endpoint real com body vazio', async () => {
  const calls: Array<{ url: string; payload: unknown }> = []
  const http: CustomerRegistrationLinkHttpClient = {
    async get<T>() { throw new Error('not expected') as T },
    async post<T>(url, payload) { calls.push({ url, payload }); return { data: link() as T } },
    async patch<T>() { throw new Error('not expected') as T },
  }
  await createCustomerRegistrationLinkRepository(http).createLink()
  assert.deepEqual(calls, [{ url: CUSTOMER_REGISTRATION_LINK_ENDPOINT, payload: {} }])
})

test('POST rotate usa endpoint real com body vazio', async () => {
  const calls: Array<{ url: string; payload: unknown }> = []
  const http: CustomerRegistrationLinkHttpClient = {
    async get<T>() { throw new Error('not expected') as T },
    async post<T>(url, payload) { calls.push({ url, payload }); return { data: link() as T } },
    async patch<T>() { throw new Error('not expected') as T },
  }
  await createCustomerRegistrationLinkRepository(http).rotateLink()
  assert.deepEqual(calls, [{ url: CUSTOMER_REGISTRATION_LINK_ROTATE_ENDPOINT, payload: {} }])
})

test('PATCH status envia somente active', async () => {
  const calls: Array<{ url: string; payload: unknown }> = []
  const http: CustomerRegistrationLinkHttpClient = {
    async get<T>() { throw new Error('not expected') as T },
    async post<T>() { throw new Error('not expected') as T },
    async patch<T>(url, payload) { calls.push({ url, payload }); return { data: link({ active: false }) as T } },
  }
  await createCustomerRegistrationLinkRepository(http).updateStatus(false)
  assert.deepEqual(calls, [{ url: CUSTOMER_REGISTRATION_LINK_STATUS_ENDPOINT, payload: { active: false } }])
})

test('QR usa GET /customer-registration-link/qr-code e preserva publicUrl', async () => {
  const expected = qr()
  const calls: string[] = []
  const http: CustomerRegistrationLinkHttpClient = {
    async get<T>(url) { calls.push(url); return { data: expected as T } },
    async post<T>() { throw new Error('not expected') as T },
    async patch<T>() { throw new Error('not expected') as T },
  }
  const result = await createCustomerRegistrationLinkRepository(http).getQrCode()
  assert.deepEqual(calls, [CUSTOMER_REGISTRATION_LINK_QR_ENDPOINT])
  assert.equal(result.publicUrl, expected.publicUrl)
})

test('frontend não monta URL absoluta usando origin, publicPath ou env', () => {
  assert.doesNotMatch(componentSource, /window\.location|location\.origin|VITE_FRONTEND_URL/)
  assert.doesNotMatch(componentSource, /publicPath/)
  assert.match(componentSource, /state\.qrCode\.publicUrl/)
})

for (const role of ['OWNER', 'MANAGER']) {
  test(`${role} pode gerenciar o cadastro público`, () => {
    assert.equal(canManageCustomerRegistrationLink(role), true)
  })
}

for (const role of ['OPERATOR', 'VIEWER', 'PLATFORM_ADMIN', 'SUPPORT', undefined]) {
  test(`${String(role)} não recebe permissão de gerenciamento`, () => {
    assert.equal(canManageCustomerRegistrationLink(role), false)
  })
}

test('Settings aguarda perfil e não renderiza módulo para role não autorizada', () => {
  assert.match(settingsSource, /v-if="!profileLoading && canManageRegistrationLink && currentRole"/)
  assert.match(settingsSource, /canManageCustomerRegistrationLink\(currentRole\.value\)/)
})

test('GET 404 vira estado not-created, sem erro técnico', async () => {
  const state = emptyCustomerRegistrationLinkState()
  const controller = createCustomerRegistrationLinkController(repository({
    async getLink() { throw responseError(404) },
  }), state)
  assert.equal(await controller.load('OWNER'), true)
  assert.equal(state.view, 'not-created')
  assert.equal(state.loadError, '')
})

test('role não autorizada não dispara GET', async () => {
  let calls = 0
  const controller = createCustomerRegistrationLinkController(repository({
    async getLink() { calls += 1; return link() },
  }))
  assert.equal(await controller.load('VIEWER'), false)
  assert.equal(calls, 0)
})

test('link existente carrega QR automaticamente sem destruir estado se QR falhar', async () => {
  const state = emptyCustomerRegistrationLinkState()
  const expectedLink = link()
  const controller = createCustomerRegistrationLinkController(repository({
    async getLink() { return expectedLink },
    async getQrCode() { throw responseError(503) },
  }), state)
  assert.equal(await controller.load('MANAGER'), true)
  assert.equal(state.view, 'ready')
  assert.equal(state.link, expectedLink)
  assert.equal(state.qrCode, null)
  assert.match(state.qrError, /QR Code não pôde ser gerado/)
})

test('create 409 usa mensagem amigável e preserva estado vazio', async () => {
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'not-created'
  const controller = createCustomerRegistrationLinkController(repository({
    async createLink() { throw responseError(409) },
  }), state)
  assert.equal(await controller.createLink('OWNER'), false)
  assert.equal(state.view, 'not-created')
  assert.equal(state.actionError, 'Já existe um link de cadastro para esta empresa.')
})

test('403 usa mensagem de permissão segura', () => {
  assert.equal(
    customerRegistrationLinkActionError(responseError(403)),
    'Você não possui permissão para gerenciar o cadastro público.',
  )
})

test('QR 503 usa mensagem específica e erro genérico não expõe API', () => {
  assert.match(customerRegistrationLinkQrError(responseError(503)), /não pôde ser gerado/)
  assert.equal(
    customerRegistrationLinkActionError(new Error('Prisma SQL failed')),
    'Não foi possível concluir a operação. Tente novamente.',
  )
})

test('create salva resposta real, busca QR e não duplica item ou GET do link', async () => {
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'not-created'
  const created = link()
  const calls: string[] = []
  const controller = createCustomerRegistrationLinkController(repository({
    async createLink() { calls.push('create'); return created },
    async getQrCode() { calls.push('qr'); return qr() },
  }), state)
  assert.equal(await controller.createLink('OWNER'), true)
  assert.deepEqual(calls, ['create', 'qr'])
  assert.equal(state.link, created)
  assert.equal(state.qrCode?.publicUrl, qr().publicUrl)
  assert.equal(state.successMessage, 'Link criado.')
})

test('duplo create é bloqueado durante requisição pendente', async () => {
  const pending = deferred<CustomerRegistrationLink>()
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'not-created'
  let calls = 0
  const controller = createCustomerRegistrationLinkController(repository({
    async createLink() { calls += 1; return pending.promise },
  }), state)
  const first = controller.createLink('OWNER')
  assert.equal(await controller.createLink('OWNER'), false)
  assert.equal(calls, 1)
  pending.resolve(link())
  await first
})

test('status não faz update otimista e usa integralmente a resposta real', async () => {
  const pending = deferred<CustomerRegistrationLink>()
  const original = link({ active: true })
  const returned = link({ active: false, updatedAt: '2026-02-02T00:00:00.000Z' })
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = original
  const controller = createCustomerRegistrationLinkController(repository({
    async updateStatus() { return pending.promise },
  }), state)
  const request = controller.updateStatus(false, 'OWNER')
  assert.equal(state.link, original)
  assert.equal(state.link.active, true)
  pending.resolve(returned)
  assert.equal(await request, true)
  assert.equal(state.link, returned)
})

test('duplo status PATCH é bloqueado', async () => {
  const pending = deferred<CustomerRegistrationLink>()
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = link()
  let calls = 0
  const controller = createCustomerRegistrationLinkController(repository({
    async updateStatus() { calls += 1; return pending.promise },
  }), state)
  const first = controller.updateStatus(false, 'MANAGER')
  assert.equal(await controller.updateStatus(false, 'MANAGER'), false)
  assert.equal(calls, 1)
  pending.resolve(link({ active: false }))
  await first
})

test('primeiro clique em rotação apenas abre confirmação explícita', () => {
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = link()
  const controller = createCustomerRegistrationLinkController(repository(), state)
  assert.equal(controller.requestRotation('OWNER'), true)
  assert.equal(state.rotationModalOpen, true)
  assert.match(modalSource, /O link e o QR Code atuais deixarão de funcionar/)
  assert.doesNotMatch(modalSource, /window\.confirm/)
})

test('rotate invalida QR antigo antes de aguardar resposta', async () => {
  const pending = deferred<CustomerRegistrationLink>()
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = link()
  state.qrCode = qr()
  state.rotationModalOpen = true
  const controller = createCustomerRegistrationLinkController(repository({
    async rotateLink() { return pending.promise },
  }), state)
  const rotation = controller.confirmRotation('OWNER')
  assert.equal(state.qrCode, null)
  pending.resolve(link({ publicId: 'B'.repeat(43) }))
  await rotation
})

test('rotate aplica resposta real e carrega o novo QR na ordem correta', async () => {
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = link()
  state.qrCode = qr()
  state.rotationModalOpen = true
  const rotated = link({ publicId: 'B'.repeat(43), publicPath: `/register/${'B'.repeat(43)}` })
  const freshQr = qr({ publicUrl: `https://app.example.com/register/${'B'.repeat(43)}` })
  const calls: string[] = []
  const controller = createCustomerRegistrationLinkController(repository({
    async rotateLink() { calls.push('rotate'); return rotated },
    async getQrCode() { calls.push('qr'); return freshQr },
  }), state)
  assert.equal(await controller.confirmRotation('MANAGER'), true)
  assert.deepEqual(calls, ['rotate', 'qr'])
  assert.equal(state.link, rotated)
  assert.equal(state.qrCode, freshQr)
  assert.equal(state.rotationModalOpen, false)
})

test('duplo rotate é bloqueado e cópia antiga permanece bloqueada', async () => {
  const pending = deferred<CustomerRegistrationLink>()
  const copied: string[] = []
  const clipboard: CustomerRegistrationLinkClipboard = {
    async writeText(value) { copied.push(value) },
  }
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = link()
  state.qrCode = qr()
  state.rotationModalOpen = true
  let calls = 0
  const controller = createCustomerRegistrationLinkController(repository({
    async rotateLink() { calls += 1; return pending.promise },
  }), state, clipboard)
  const first = controller.confirmRotation('OWNER')
  assert.equal(await controller.confirmRotation('OWNER'), false)
  assert.equal(await controller.copyLink(), false)
  assert.deepEqual(copied, [])
  assert.equal(calls, 1)
  pending.resolve(link({ publicId: 'B'.repeat(43) }))
  await first
})

test('copy usa exatamente publicUrl retornada pelo QR', async () => {
  const copied: string[] = []
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = link()
  state.qrCode = qr()
  const controller = createCustomerRegistrationLinkController(repository(), state, {
    async writeText(value) { copied.push(value) },
  })
  assert.equal(await controller.copyLink(), true)
  assert.deepEqual(copied, [qr().publicUrl])
  assert.equal(state.copyMessage, 'Link copiado.')
})

test('componente mantém QR visível no estado inativo e abre URL semanticamente', () => {
  assert.match(componentSource, /v-else-if="state\.qrCode"/)
  assert.match(componentSource, /<img :src="state\.qrCode\.qrCodeDataUrl"/)
  assert.match(componentSource, /alt="QR Code para cadastro de clientes"/)
  assert.match(componentSource, /target="_blank"/)
  assert.match(componentSource, /rel="noopener noreferrer"/)
})

test('repository não modela identificadores de tenant nos bodies', () => {
  const repositorySource = readFileSync(
    new URL('../src/features/customer-registration-link/customer-registration-link.repository.ts', import.meta.url),
    'utf8',
  )
  assert.doesNotMatch(repositorySource, /companyId|tenantId|userId/)
})

test('módulo não persiste nem registra dados do link ou QR', () => {
  const source = `${componentSource}\n${serviceSource}`
  assert.doesNotMatch(source, /localStorage|sessionStorage|console\.log/)
  assert.doesNotMatch(source, /v-html|canvas/)
})

test('download usa exatamente qrCodeDataUrl sem realizar request HTTP', async () => {
  const downloadValues: string[] = []
  let repositoryCalls = 0
  const qrExporter: CustomerRegistrationQrExporter = {
    async download(value) { downloadValues.push(value) },
    async print() { throw new Error('not expected') },
  }
  const state = emptyCustomerRegistrationLinkState()
  state.view = 'ready'
  state.link = link()
  state.qrCode = qr()
  const controller = createCustomerRegistrationLinkController(repository({
    async getQrCode() { repositoryCalls += 1; return qr() },
  }), state, { async writeText() {} }, qrExporter)

  assert.equal(await controller.downloadQrCode(), true)
  assert.deepEqual(downloadValues, [qr().qrCodeDataUrl])
  assert.equal(repositoryCalls, 0)
  assert.equal(state.successMessage, 'QR Code baixado.')
})

test('download não acontece sem QR ou durante rotação', async () => {
  let calls = 0
  const exporter: CustomerRegistrationQrExporter = {
    async download() { calls += 1 },
    async print() { throw new Error('not expected') },
  }
  const state = emptyCustomerRegistrationLinkState()
  const controller = createCustomerRegistrationLinkController(
    repository(), state, { async writeText() {} }, exporter,
  )
  assert.equal(await controller.downloadQrCode(), false)
  state.qrCode = qr()
  state.rotating = true
  assert.equal(await controller.downloadQrCode(), false)
  assert.equal(calls, 0)
})

test('download converte PNG, usa nome estável e sempre revoga object URL', async () => {
  const revoked: string[] = []
  const appended: HTMLAnchorElement[] = []
  const linkElement = {
    href: '',
    download: '',
    click() {},
    remove() {},
  } as unknown as HTMLAnchorElement
  const runtime: CustomerRegistrationQrDownloadRuntime = {
    decodeBase64() { return 'ABC' },
    createBlob() { return {} as Blob },
    createObjectUrl() { return 'blob:qr-code' },
    revokeObjectUrl(value) { revoked.push(value) },
    createDownloadLink() { return linkElement },
    appendDownloadLink(value) { appended.push(value) },
  }

  await createBrowserCustomerRegistrationQrExporter(runtime, {
    openWindow() { throw new Error('not expected') },
  }).download(qr().qrCodeDataUrl)

  assert.deepEqual(appended, [linkElement])
  assert.equal(linkElement.href, 'blob:qr-code')
  assert.equal(linkElement.download, CUSTOMER_REGISTRATION_QR_FILENAME)
  assert.equal(CUSTOMER_REGISTRATION_QR_FILENAME.includes(link().publicId), false)
  assert.deepEqual(revoked, ['blob:qr-code'])
})

test('object URL também é revogado quando o clique falha', async () => {
  const revoked: string[] = []
  const runtime: CustomerRegistrationQrDownloadRuntime = {
    decodeBase64() { return 'ABC' },
    createBlob() { return {} as Blob },
    createObjectUrl() { return 'blob:failed-download' },
    revokeObjectUrl(value) { revoked.push(value) },
    createDownloadLink() {
      return {
        href: '', download: '', click() { throw new Error('blocked') }, remove() {},
      } as unknown as HTMLAnchorElement
    },
    appendDownloadLink() {},
  }
  const exporter = createBrowserCustomerRegistrationQrExporter(runtime, {
    openWindow() { throw new Error('not expected') },
  })

  await assert.rejects(exporter.download(qr().qrCodeDataUrl))
  assert.deepEqual(revoked, ['blob:failed-download'])
})

test('falha de download gera feedback amigável', async () => {
  const state = emptyCustomerRegistrationLinkState()
  state.qrCode = qr()
  const controller = createCustomerRegistrationLinkController(repository(), state, {
    async writeText() {},
  }, {
    async download() { throw new Error('browser internals') },
    async print() {},
  })
  assert.equal(await controller.downloadQrCode(), false)
  assert.equal(state.actionError, 'Não foi possível baixar o QR Code.')
  assert.doesNotMatch(state.actionError, /browser internals/)
})

test('impressão usa exatamente publicUrl e qrCodeDataUrl sem publicPath', async () => {
  const printValues: Array<{ publicUrl: string; qrCodeDataUrl: string }> = []
  const state = emptyCustomerRegistrationLinkState()
  state.link = link({ publicPath: '/must-not-be-used' })
  state.qrCode = qr()
  const controller = createCustomerRegistrationLinkController(repository(), state, {
    async writeText() {},
  }, {
    async download() { throw new Error('not expected') },
    async print(publicUrl, qrCodeDataUrl) { printValues.push({ publicUrl, qrCodeDataUrl }) },
  })

  assert.equal(await controller.printQrCode(), true)
  assert.deepEqual(printValues, [{
    publicUrl: qr().publicUrl,
    qrCodeDataUrl: qr().qrCodeDataUrl,
  }])
  assert.equal(JSON.stringify(printValues).includes('/must-not-be-used'), false)
  assert.equal(state.successMessage, 'Impressão aberta.')
})

test('impressão não acontece sem QR ou durante rotação', async () => {
  let calls = 0
  const state = emptyCustomerRegistrationLinkState()
  const controller = createCustomerRegistrationLinkController(repository(), state, {
    async writeText() {},
  }, {
    async download() {},
    async print() { calls += 1 },
  })
  assert.equal(await controller.printQrCode(), false)
  state.qrCode = qr()
  state.rotating = true
  assert.equal(await controller.printQrCode(), false)
  assert.equal(calls, 0)
})

test('link inativo continua permitindo download e impressão', async () => {
  const operations: string[] = []
  const state = emptyCustomerRegistrationLinkState()
  state.link = link({ active: false })
  state.qrCode = qr()
  const controller = createCustomerRegistrationLinkController(repository(), state, {
    async writeText() {},
  }, {
    async download() { operations.push('download') },
    async print() { operations.push('print') },
  })
  assert.equal(await controller.downloadQrCode(), true)
  assert.equal(await controller.printQrCode(), true)
  assert.deepEqual(operations, ['download', 'print'])
})

test('falha de impressão gera feedback amigável', async () => {
  const state = emptyCustomerRegistrationLinkState()
  state.qrCode = qr()
  const controller = createCustomerRegistrationLinkController(repository(), state, {
    async writeText() {},
  }, {
    async download() {},
    async print() { throw new Error('popup details') },
  })
  assert.equal(await controller.printQrCode(), false)
  assert.equal(state.actionError, 'Não foi possível abrir a impressão.')
  assert.doesNotMatch(state.actionError, /popup details/)
})

test('material de impressão é construído com DOM seguro e sem dashboard', () => {
  assert.match(exportSource, /\.textContent = text/)
  assert.match(exportSource, /image\.src = qrCodeDataUrl/)
  assert.doesNotMatch(exportSource, /document\.write|innerHTML|v-html/)
  assert.doesNotMatch(exportSource, /sidebar|Settings|status-row/)
  assert.match(exportSource, /Cadastro de clientes/)
  assert.match(exportSource, /AylaFlow/)
})

test('ações de exportação aparecem somente dentro do estado com QR', () => {
  const qrBlock = componentSource.match(/<div v-else-if="state\.qrCode"[\s\S]*?<\/div>\s*<\/div>/)?.[0]
  assert.ok(qrBlock)
  assert.match(qrBlock, /Baixar QR Code/)
  assert.match(qrBlock, /Imprimir/)
  assert.match(componentSource, /Na janela de impressão você também pode salvar como PDF\./)
})

test('exportação não usa storage, HTTP, biblioteca QR ou biblioteca PDF', () => {
  assert.doesNotMatch(exportSource, /localStorage|sessionStorage|axios|fetch\(|XMLHttpRequest/)
  assert.doesNotMatch(
    exportSource,
    /from ['"](?:qrcode|qr-code-styling|jspdf|pdfkit|pdfmake)['"]/i,
  )
  assert.doesNotMatch(packageSource, /"jspdf"|"pdfkit"|"pdfmake"|"qrcode"/i)
})

test('impressão permanece pendente enquanto a imagem ainda não carregou', async () => {
  const image = new FakePrintableImage(false, 0)
  const calls: string[] = []
  let settled = false

  const printing = waitForQrImageAndPrint(
    image as unknown as HTMLImageElement,
    printableWindow(calls),
  ).finally(() => { settled = true })

  await Promise.resolve()
  assert.equal(settled, false)
  assert.deepEqual(calls, [])
  assert.equal(image.listenerCount('load'), 1)
  assert.equal(image.listenerCount('error'), 1)

  image.naturalWidth = 320
  image.emit('load')
  await printing
})

test('evento load executa focus e print antes de resolver e limpa listeners', async () => {
  const image = new FakePrintableImage(false, 0)
  const calls: string[] = []
  const printing = waitForQrImageAndPrint(
    image as unknown as HTMLImageElement,
    printableWindow(calls),
  )

  image.naturalWidth = 320
  image.emit('load')
  await printing

  assert.deepEqual(calls, ['focus', 'print'])
  assert.equal(image.listenerCount('load'), 0)
  assert.equal(image.listenerCount('error'), 0)
})

test('evento error rejeita a impressão e limpa o listener oposto', async () => {
  const image = new FakePrintableImage(false, 0)
  const calls: string[] = []
  const printing = waitForQrImageAndPrint(
    image as unknown as HTMLImageElement,
    printableWindow(calls),
  )

  image.emit('error')
  await assert.rejects(printing)

  assert.deepEqual(calls, [])
  assert.equal(image.listenerCount('load'), 0)
  assert.equal(image.listenerCount('error'), 0)
})

test('imagem já carregada abre impressão imediatamente', async () => {
  const image = new FakePrintableImage(true, 320)
  const calls: string[] = []

  await waitForQrImageAndPrint(
    image as unknown as HTMLImageElement,
    printableWindow(calls),
  )

  assert.deepEqual(calls, ['focus', 'print'])
  assert.equal(image.listenerCount('load'), 0)
  assert.equal(image.listenerCount('error'), 0)
})

test('imagem completa porém quebrada rejeita sem abrir impressão', async () => {
  const image = new FakePrintableImage(true, 0)
  const calls: string[] = []

  await assert.rejects(waitForQrImageAndPrint(
    image as unknown as HTMLImageElement,
    printableWindow(calls),
  ))

  assert.deepEqual(calls, [])
})

test('controller só confirma impressão depois que exporter resolve', async () => {
  const pending = deferred<void>()
  const state = emptyCustomerRegistrationLinkState()
  state.qrCode = qr()
  const controller = createCustomerRegistrationLinkController(repository(), state, {
    async writeText() {},
  }, {
    async download() {},
    async print() { return pending.promise },
  })

  const printing = controller.printQrCode()
  await Promise.resolve()
  assert.equal(state.successMessage, '')

  pending.resolve(undefined)
  assert.equal(await printing, true)
  assert.equal(state.successMessage, 'Impressão aberta.')
})

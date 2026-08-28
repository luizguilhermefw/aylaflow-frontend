import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  canChangeWhatsappChannelRouting,
  canManageWhatsappChannels,
  canReconnectWhatsapp,
  createWhatsappChannelController,
  emptyWhatsappChannelState,
  formatConnectedPhoneForDisplay,
  QR_CONNECTION_MAX_CHECKS,
  isWhatsappChannelOverLimit,
  shouldShowUnconfirmedConnectionNotice,
  whatsappChannelEntitlementNotice,
  whatsappConnectionStatusLabel,
  whatsappChannelUsageLabel,
  whatsappQrImageSource,
  whatsappRoutingDescription,
  whatsappRoutingLabel,
} from '../src/features/whatsapp-channels/whatsapp-channel.logic.ts'
import type {
  WhatsappChannelRepository,
  WhatsappClipboard,
  WhatsappQrPollingScheduler,
} from '../src/features/whatsapp-channels/whatsapp-channel.logic.ts'
import {
  createWhatsappChannelRepository,
  WHATSAPP_CHANNELS_ENDPOINT,
  whatsappChannelConnectionEndpoint,
  whatsappChannelPairingCodeEndpoint,
  whatsappChannelQrEndpoint,
  whatsappChannelRoutingEndpoint,
} from '../src/features/whatsapp-channels/whatsapp-channel.repository.ts'
import type {
  WhatsappChannel,
  WhatsappChannelConnectionResponse,
  WhatsappChannelHttpClient,
  WhatsappChannelListResponse,
  WhatsappChannelPairingCodeResponse,
  WhatsappChannelQrResponse,
  WhatsappChannelRoutingResponse,
  WhatsappConnectionStatus,
} from '../src/features/whatsapp-channels/whatsapp-channel.repository.ts'

function channel(overrides: Partial<WhatsappChannel> = {}): WhatsappChannel {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    connectionStatus: 'CONNECTED',
    connectedPhone: '5511999999999',
    isActive: false,
    ...overrides,
  }
}

function list(channels: WhatsappChannel[] = [channel()]): WhatsappChannelListResponse {
  return {
    limit: 3,
    used: channels.length,
    available: 3 - channels.length,
    channels,
  }
}

function repository(
  overrides: Partial<WhatsappChannelRepository> = {},
): WhatsappChannelRepository {
  return {
    async listWhatsappChannels() { return list() },
    async getWhatsappChannelConnection(channelId) {
      const current = list().channels.find((item) => item.id === channelId) ?? channel({ id: channelId })
      return {
        channelId,
        connectionStatus: current.connectionStatus,
        connectedPhone: current.connectedPhone,
        isActive: current.isActive,
      }
    },
    async getWhatsappChannelQrCode(channelId) {
      return {
        channelId,
        connectionStatus: 'WAITING_QR',
        qrCode: 'data:image/png;base64,VEVTVEVTVEVTVEVTVEVTVEVTVEVTVEVU',
      }
    },
    async requestWhatsappChannelPairingCode(channelId) {
      return {
        channelId,
        connectionStatus: 'WAITING_QR',
        pairingCode: '2PNQT5TS',
      }
    },
    async updateWhatsappChannelRouting(channelId, isActive) {
      return { channelId, isActive, connectionStatus: 'CONNECTED' }
    },
    ...overrides,
  }
}

class FakeQrScheduler implements WhatsappQrPollingScheduler {
  private nextId = 1
  private tasks = new Map<number, () => void>()

  setTimeout(callback: () => void): ReturnType<typeof setTimeout> {
    const id = this.nextId
    this.nextId += 1
    this.tasks.set(id, callback)
    return id as unknown as ReturnType<typeof setTimeout>
  }

  clearTimeout(handle: ReturnType<typeof setTimeout>): void {
    this.tasks.delete(handle as unknown as number)
  }

  get pendingCount(): number {
    return this.tasks.size
  }

  runNext(): boolean {
    const next = this.tasks.entries().next().value as [number, () => void] | undefined
    if (!next) return false
    this.tasks.delete(next[0])
    next[1]()
    return true
  }
}

class FakeClipboard implements WhatsappClipboard {
  copiedValues: string[] = []

  async writeText(value: string): Promise<void> {
    this.copiedValues.push(value)
  }
}

function flushAsyncWork(): Promise<void> {
  return new Promise((resolve) => setImmediate(resolve))
}

test('lista canais usando o endpoint real e preserva o wrapper de limites', async () => {
  const expected = list([channel({ isActive: true }), channel({ id: 'channel-2' })])
  const calls: string[] = []
  const http: WhatsappChannelHttpClient = {
    async get<T>(url) {
      calls.push(url)
      return { data: expected as T }
    },
    async post<T>() { throw new Error('not expected') },
    async patch<T>() {
      throw new Error('not expected')
    },
  }

  const result = await createWhatsappChannelRepository(http).listWhatsappChannels()

  assert.deepEqual(calls, [WHATSAPP_CHANNELS_ENDPOINT])
  assert.deepEqual(result, expected)
  assert.equal(result.channels.length, 2)
})

test('repositório sincroniza conexão usando GET /:id/connection', async () => {
  const current = channel()
  const expected: WhatsappChannelConnectionResponse = {
    channelId: current.id,
    connectionStatus: 'CONNECTED',
    connectedPhone: '5545999999999',
    isActive: true,
  }
  const calls: string[] = []
  const http: WhatsappChannelHttpClient = {
    async get<T>(url) {
      calls.push(url)
      return { data: expected as T }
    },
    async post<T>() { throw new Error('not expected') },
    async patch<T>() { throw new Error('not expected') },
  }

  const result = await createWhatsappChannelRepository(http)
    .getWhatsappChannelConnection(current.id)

  assert.deepEqual(calls, [whatsappChannelConnectionEndpoint(current.id)])
  assert.deepEqual(result, expected)
})

test('repositório solicita QR com POST no endpoint real', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const expected: WhatsappChannelQrResponse = {
    channelId: current.id,
    connectionStatus: 'WAITING_QR',
    qrCode: 'data:image/png;base64,VEVTVEVTVEVTVEVTVEVTVEVTVEVTVEVU',
  }
  const calls: string[] = []
  const http: WhatsappChannelHttpClient = {
    async get<T>() { throw new Error('not expected') },
    async post<T>(url) {
      calls.push(url)
      return { data: expected as T }
    },
    async patch<T>() { throw new Error('not expected') },
  }

  const result = await createWhatsappChannelRepository(http).getWhatsappChannelQrCode(current.id)

  assert.deepEqual(calls, [whatsappChannelQrEndpoint(current.id)])
  assert.deepEqual(result, expected)
})

test('repositório solicita código de pareamento com POST e somente phone', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const phone = '(45) 99133-5359'
  const expected: WhatsappChannelPairingCodeResponse = {
    channelId: current.id,
    connectionStatus: 'WAITING_QR',
    pairingCode: '2PNQT5TS',
  }
  const calls: Array<{ url: string, payload: unknown }> = []
  const http: WhatsappChannelHttpClient = {
    async get<T>() { throw new Error('not expected') },
    async post<T>(url, payload) {
      calls.push({ url, payload })
      return { data: expected as T }
    },
    async patch<T>() { throw new Error('not expected') },
  }

  const result = await createWhatsappChannelRepository(http)
    .requestWhatsappChannelPairingCode(current.id, phone)

  assert.deepEqual(calls, [{
    url: whatsappChannelPairingCodeEndpoint(current.id),
    payload: { phone },
  }])
  assert.deepEqual(Object.keys(calls[0]!.payload as object), ['phone'])
  assert.deepEqual(result, expected)
})

test('após a listagem cada canal é sincronizado individualmente', async () => {
  const channels = [channel({ id: 'channel-1' }), channel({ id: 'channel-2' })]
  const synchronizedIds: string[] = []
  const state = emptyWhatsappChannelState()
  const controller = createWhatsappChannelController(repository({
    async listWhatsappChannels() { return list(channels) },
    async getWhatsappChannelConnection(channelId) {
      synchronizedIds.push(channelId)
      const current = channels.find((item) => item.id === channelId)!
      return { channelId, connectionStatus: 'CONNECTED', connectedPhone: null, isActive: current.isActive }
    },
  }), state)

  assert.equal(await controller.load(), true)
  assert.deepEqual(synchronizedIds.sort(), ['channel-1', 'channel-2'])
  assert.equal(state.loading, false)
})

test('resposta CONNECTED atualiza connectionStatus e connectedPhone reais', async () => {
  const current = channel({ connectionStatus: 'UNKNOWN', connectedPhone: null })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection(channelId) {
      return {
        channelId,
        connectionStatus: 'CONNECTED',
        connectedPhone: '5545999999999',
        isActive: true,
      }
    },
  }), state)

  assert.equal(await controller.syncChannelConnection(current.id), true)
  assert.equal(state.data.channels[0]?.connectionStatus, 'CONNECTED')
  assert.equal(state.data.channels[0]?.connectedPhone, '5545999999999')
  assert.equal(state.data.channels[0]?.isActive, true)
  assert.equal(shouldShowUnconfirmedConnectionNotice(state.data.channels[0]!), false)
})

test('sincronização atualiza somente o canal correspondente', async () => {
  const first = channel({ id: 'channel-1', connectionStatus: 'UNKNOWN', connectedPhone: null })
  const second = channel({ id: 'channel-2', connectionStatus: 'DISCONNECTED', isActive: true })
  const state = emptyWhatsappChannelState()
  state.data = list([first, second])
  const secondBefore = { ...second }
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection(channelId) {
      return { channelId, connectionStatus: 'CONNECTED', connectedPhone: '5545999999999', isActive: false }
    },
  }), state)

  assert.equal(await controller.syncChannelConnection(first.id), true)
  assert.equal(state.data.channels[0]?.connectionStatus, 'CONNECTED')
  assert.deepEqual(state.data.channels[1], secondBefore)
})

test('erro de sincronização mantém todos os dados e o routing anteriores', async () => {
  const current = channel({ connectionStatus: 'UNKNOWN', connectedPhone: null, isActive: true })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection() {
      throw { response: { status: 503, data: { message: 'Evolution unavailable' } } }
    },
  }), state)

  assert.equal(await controller.syncChannelConnection(current.id), false)
  assert.deepEqual(state.data.channels[0], current)
  assert.equal(state.data.channels[0]?.isActive, true)
  assert.equal(
    state.connectionSyncErrors[current.id],
    'Não foi possível atualizar a conexão. Os dados anteriores foram mantidos.',
  )
  assert.doesNotMatch(state.connectionSyncErrors[current.id]!, /Evolution|503/)
})

test('erro em um canal não impede a sincronização dos demais', async () => {
  const first = channel({ id: 'channel-1', connectionStatus: 'UNKNOWN' })
  const second = channel({ id: 'channel-2', connectionStatus: 'UNKNOWN', connectedPhone: null })
  const state = emptyWhatsappChannelState()
  const controller = createWhatsappChannelController(repository({
    async listWhatsappChannels() { return list([first, second]) },
    async getWhatsappChannelConnection(channelId) {
      if (channelId === first.id) throw new Error('provider detail')
      return { channelId, connectionStatus: 'CONNECTED', connectedPhone: '5545999999999', isActive: false }
    },
  }), state)

  assert.equal(await controller.load(), true)
  assert.deepEqual(state.data?.channels[0], first)
  assert.equal(state.connectionSyncErrors[first.id]?.length! > 0, true)
  assert.equal(state.data?.channels[1]?.connectionStatus, 'CONNECTED')
  assert.equal(state.connectionSyncErrors[second.id], undefined)
})

test('estado de sincronização é individual e não bloqueia a listagem', async () => {
  const first = channel({ id: 'channel-1' })
  const second = channel({ id: 'channel-2' })
  let resolveFirst: ((value: WhatsappChannelConnectionResponse) => void) | undefined
  let resolveSecond: ((value: WhatsappChannelConnectionResponse) => void) | undefined
  const firstPending = new Promise<WhatsappChannelConnectionResponse>((resolve) => { resolveFirst = resolve })
  const secondPending = new Promise<WhatsappChannelConnectionResponse>((resolve) => { resolveSecond = resolve })
  const state = emptyWhatsappChannelState()
  state.data = list([first, second])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection(channelId) {
      return channelId === first.id ? firstPending : secondPending
    },
  }), state)

  const firstSync = controller.syncChannelConnection(first.id)
  const secondSync = controller.syncChannelConnection(second.id)
  assert.deepEqual(state.syncingChannelIds.sort(), [first.id, second.id])
  assert.equal(state.loading, false)
  assert.equal(state.data.channels.length, 2)

  resolveFirst?.({ channelId: first.id, connectionStatus: 'CONNECTED', connectedPhone: null, isActive: false })
  assert.equal(await firstSync, true)
  assert.deepEqual(state.syncingChannelIds, [second.id])

  resolveSecond?.({ channelId: second.id, connectionStatus: 'CONNECTED', connectedPhone: null, isActive: false })
  assert.equal(await secondSync, true)
  assert.deepEqual(state.syncingChannelIds, [])
})

test('listagem inicial fica disponível enquanto a conexão ainda sincroniza', async () => {
  const current = channel({ connectionStatus: 'UNKNOWN' })
  let resolveConnection: ((value: WhatsappChannelConnectionResponse) => void) | undefined
  let announceSyncStarted: (() => void) | undefined
  const connectionPending = new Promise<WhatsappChannelConnectionResponse>((resolve) => {
    resolveConnection = resolve
  })
  const syncStarted = new Promise<void>((resolve) => { announceSyncStarted = resolve })
  const state = emptyWhatsappChannelState()
  const controller = createWhatsappChannelController(repository({
    async listWhatsappChannels() { return list([current]) },
    async getWhatsappChannelConnection() {
      announceSyncStarted?.()
      return connectionPending
    },
  }), state)

  const loadPromise = controller.load()
  await syncStarted
  assert.equal(state.loading, false)
  assert.deepEqual(state.data?.channels, [current])
  assert.deepEqual(state.syncingChannelIds, [current.id])

  resolveConnection?.({
    channelId: current.id,
    connectionStatus: 'CONNECTED',
    connectedPhone: '5545999999999',
    isActive: false,
  })
  assert.equal(await loadPromise, true)
})

test('atualização manual reutiliza a sincronização individual existente', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const synchronizedIds: string[] = []
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection(channelId) {
      synchronizedIds.push(channelId)
      return { channelId, connectionStatus: 'CONNECTED', connectedPhone: null, isActive: false }
    },
  }), state)

  assert.equal(await controller.syncChannelConnection(current.id), true)
  assert.deepEqual(synchronizedIds, [current.id])

  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )
  assert.match(componentSource, /Atualizar status/)
  assert.match(componentSource, /controller\.syncChannelConnection\(channel\.id\)/)
})

test('DISCONNECTED oferece reconexão e CONNECTED não oferece', () => {
  assert.equal(canReconnectWhatsapp(channel({ connectionStatus: 'DISCONNECTED' })), true)
  assert.equal(canReconnectWhatsapp(channel({ connectionStatus: 'WAITING_QR' })), true)
  assert.equal(canReconnectWhatsapp(channel({ connectionStatus: 'UNKNOWN' })), true)
  assert.equal(canReconnectWhatsapp(channel({ connectionStatus: 'ERROR' })), true)
  assert.equal(canReconnectWhatsapp(channel({ connectionStatus: 'CONNECTED' })), false)

  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )
  assert.match(componentSource, /v-if="canReconnectWhatsapp\(channel\)"/)
  assert.match(componentSource, /Reconectar WhatsApp/)
})

test('QR é apresentado como imagem segura sem dados técnicos', () => {
  const qrCode = 'data:image/png;base64,VEVTVEVTVEVTVEVTVEVTVEVTVEVTVEVU'
  assert.equal(whatsappQrImageSource(qrCode), qrCode)
  assert.equal(
    whatsappQrImageSource('VEVTVEVTVEVTVEVTVEVTVEVTVEVTVEVU'),
    qrCode,
  )
  assert.equal(whatsappQrImageSource('internal-provider-value'), null)

  const modalSource = readFileSync(
    new URL('../src/components/settings/WhatsappQrModal.vue', import.meta.url),
    'utf8',
  )
  assert.match(modalSource, /<img :src="imageSource"/)
  assert.match(modalSource, /leia este QR Code/)
  assert.doesNotMatch(modalSource, /instanceName|provisioningKey|apiKey|webhookSecret/i)
})

test('abrir modal é passivo, mantém QR visual e não altera canal nem inicia polling', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let qrRequests = 0
  let pairingRequests = 0
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const beforeOpen = { ...state.data.channels[0]! }
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelQrCode(channelId) {
      qrRequests += 1
      return {
        channelId,
        connectionStatus: 'WAITING_QR',
        qrCode: 'data:image/png;base64,VEVTVEVTVEVTVEVTVEVTVEVTVEVTVEVU',
      }
    },
    async requestWhatsappChannelPairingCode(channelId) {
      pairingRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', pairingCode: '2PNQT5TS' }
    },
  }), state, scheduler)

  assert.equal(state.connectionMode, 'qr')
  assert.equal(await controller.openReconnectModal(current, 'OWNER'), true)
  assert.equal(state.connectionMode, 'qr')
  assert.equal(qrRequests, 0)
  assert.equal(pairingRequests, 0)
  assert.equal(scheduler.pendingCount, 0)
  assert.deepEqual(state.data.channels[0], beforeOpen)
  assert.equal(controller.closeReconnectModal(), true)
  assert.equal(scheduler.pendingCount, 0)
  assert.deepEqual(state.data.channels[0], beforeOpen)

  const modalSource = readFileSync(
    new URL('../src/components/settings/WhatsappQrModal.vue', import.meta.url),
    'utf8',
  )
  assert.match(modalSource, /QR Code/)
  assert.match(modalSource, /Código de pareamento/)
  assert.match(modalSource, /Gerar QR Code/)
  assert.match(modalSource, /Gerando QR Code.../)
  assert.match(modalSource, /role="tablist"/)
})

test('modo pareamento exibe telefone amigável sem solicitar código antes do submit', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let qrRequests = 0
  let pairingRequests = 0
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelQrCode(channelId) {
      qrRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', qrCode: 'unused' }
    },
    async requestWhatsappChannelPairingCode(channelId) {
      pairingRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', pairingCode: '2PNQT5TS' }
    },
  }), state, new FakeQrScheduler())

  await controller.openReconnectModal(current, 'MANAGER')
  assert.equal(await controller.switchConnectionMode('pairing'), true)
  assert.equal(state.connectionMode, 'pairing')
  assert.equal(qrRequests, 0)
  assert.equal(pairingRequests, 0)

  const modalSource = readFileSync(
    new URL('../src/components/settings/WhatsappQrModal.vue', import.meta.url),
    'utf8',
  )
  assert.match(modalSource, /type="tel"/)
  assert.match(modalSource, /placeholder="\(45\) 99133-5359"/)
  assert.match(modalSource, /Use esta opção se não puder ler o QR Code com a câmera./)
  assert.doesNotMatch(modalSource, /mask|canonical/i)
})

test('pareamento valida somente telefone obrigatório e preserva o valor informado', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED', isActive: true })
  const calls: Array<{ channelId: string, phone: string }> = []
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async requestWhatsappChannelPairingCode(channelId, phone) {
      calls.push({ channelId, phone })
      return { channelId, connectionStatus: 'WAITING_QR', pairingCode: ' 2PN-QT5TS ' }
    },
  }), state, scheduler)

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  assert.equal(await controller.requestPairingCode(), false)
  assert.equal(state.pairingError, 'Informe o número do WhatsApp.')
  assert.deepEqual(calls, [])

  const friendlyPhone = ' (45) 99133-5359 '
  controller.setPairingPhone(friendlyPhone)
  assert.equal(await controller.requestPairingCode(), true)
  assert.deepEqual(calls, [{ channelId: current.id, phone: friendlyPhone }])
  assert.equal(state.pairingCode, ' 2PN-QT5TS ')
  assert.equal(state.data.channels[0]?.connectionStatus, 'WAITING_QR')
  assert.equal(state.data.channels[0]?.isActive, true)
  assert.equal(scheduler.pendingCount, 1)
})

test('pareamento bloqueia duplo submit enquanto a requisição está pendente', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let resolvePairing: ((value: WhatsappChannelPairingCodeResponse) => void) | undefined
  let calls = 0
  const pending = new Promise<WhatsappChannelPairingCodeResponse>((resolve) => {
    resolvePairing = resolve
  })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async requestWhatsappChannelPairingCode() {
      calls += 1
      return pending
    },
  }), state, new FakeQrScheduler())

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')
  const first = controller.requestPairingCode()
  assert.equal(await controller.requestPairingCode(), false)
  assert.equal(calls, 1)

  resolvePairing?.({
    channelId: current.id,
    connectionStatus: 'WAITING_QR',
    pairingCode: '2PNQT5TS',
  })
  assert.equal(await first, true)
})

test('resposta CONNECTED sem pairingCode conclui o fluxo com sucesso', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED', connectedPhone: null, isActive: false })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async requestWhatsappChannelPairingCode(channelId) {
      return { channelId, connectionStatus: 'CONNECTED' }
    },
    async getWhatsappChannelConnection(channelId) {
      return {
        channelId,
        connectionStatus: 'CONNECTED',
        connectedPhone: '5545991335359',
        isActive: false,
      }
    },
  }), state, scheduler)

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')

  assert.equal(await controller.requestPairingCode(), true)
  assert.equal(state.qrConnected, true)
  assert.equal(state.pairingCode, '')
  assert.equal(state.data.channels[0]?.connectedPhone, '5545991335359')
  assert.equal(state.data.channels[0]?.isActive, false)
  assert.equal(scheduler.pendingCount, 0)
})

test('código retornado permanece visível e instruções orientam o pareamento', () => {
  const modalSource = readFileSync(
    new URL('../src/components/settings/WhatsappQrModal.vue', import.meta.url),
    'utf8',
  )

  assert.match(modalSource, /<code>\{\{ pairingCode \}\}<\/code>/)
  assert.match(modalSource, /Copiar código/)
  assert.match(modalSource, /Aparelhos conectados/)
  assert.match(modalSource, /Conectar um aparelho/)
  assert.match(modalSource, /Conectar com número de telefone/)
  assert.match(modalSource, /Digite o código exibido acima/)
})

test('cópia usa exatamente o código retornado e informa sucesso', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const scheduler = new FakeQrScheduler()
  const clipboard = new FakeClipboard()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async requestWhatsappChannelPairingCode(channelId) {
      return { channelId, connectionStatus: 'WAITING_QR', pairingCode: ' 2PN-QT5TS ' }
    },
  }), state, scheduler, clipboard)

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')
  await controller.requestPairingCode()

  assert.equal(await controller.copyPairingCode(), true)
  assert.deepEqual(clipboard.copiedValues, [' 2PN-QT5TS '])
  assert.equal(state.pairingCopyMessage, 'Código copiado.')
})

test('falha do clipboard mantém o código e oferece cópia manual segura', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const clipboard: WhatsappClipboard = {
    async writeText() { throw new Error('clipboard denied') },
  }
  const controller = createWhatsappChannelController(repository(), state, new FakeQrScheduler(), clipboard)

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')
  await controller.requestPairingCode()
  const originalCode = state.pairingCode

  assert.equal(await controller.copyPairingCode(), false)
  assert.equal(state.pairingCode, originalCode)
  assert.match(state.pairingCopyError, /copie manualmente/i)
  assert.doesNotMatch(state.pairingCopyError, /clipboard denied/)
})

test('troca QR para pareamento antes da geração não chama provider', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let qrRequests = 0
  let pairingRequests = 0
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelQrCode(channelId) {
      qrRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', qrCode: 'unused' }
    },
    async requestWhatsappChannelPairingCode(channelId) {
      pairingRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', pairingCode: 'unused' }
    },
  }), state, new FakeQrScheduler())

  await controller.openReconnectModal(current, 'OWNER')
  assert.equal(await controller.switchConnectionMode('pairing'), true)

  assert.equal(state.connectionMode, 'pairing')
  assert.equal(qrRequests, 0)
  assert.equal(pairingRequests, 0)
  assert.equal(state.qrCode, '')
})

test('troca pareamento para QR antes da geração não chama provider', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let qrRequests = 0
  let pairingRequests = 0
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelQrCode(channelId) {
      qrRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', qrCode: 'unused' }
    },
    async requestWhatsappChannelPairingCode(channelId) {
      pairingRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', pairingCode: 'unused' }
    },
  }), state, new FakeQrScheduler())

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  assert.equal(await controller.switchConnectionMode('qr'), true)

  assert.equal(state.connectionMode, 'qr')
  assert.equal(qrRequests, 0)
  assert.equal(pairingRequests, 0)
  assert.equal(state.pairingCode, '')
})

test('tentativa QR iniciada bloqueia troca de método e segunda geração concorrente', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let resolveQr: ((value: WhatsappChannelQrResponse) => void) | undefined
  let qrRequests = 0
  let pairingRequests = 0
  const pendingQr = new Promise<WhatsappChannelQrResponse>((resolve) => { resolveQr = resolve })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelQrCode() {
      qrRequests += 1
      return pendingQr
    },
    async requestWhatsappChannelPairingCode(channelId) {
      pairingRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', pairingCode: 'unused' }
    },
  }), state, scheduler)

  await controller.openReconnectModal(current, 'OWNER')
  const firstRequest = controller.requestQrCode(current.id)
  assert.equal(state.qrLoading, true)
  assert.equal(await controller.requestQrCode(current.id), false)
  assert.equal(await controller.switchConnectionMode('pairing'), false)
  assert.equal(qrRequests, 1)
  assert.equal(pairingRequests, 0)

  resolveQr?.({
    channelId: current.id,
    connectionStatus: 'WAITING_QR',
    qrCode: 'data:image/png;base64,VEVTVEVTVEVTVEVTVEVTVEVTVEVTVEVU',
  })
  assert.equal(await firstRequest, true)
  assert.equal(scheduler.pendingCount, 1)
  assert.equal(await controller.switchConnectionMode('pairing'), false)
  assert.equal(state.connectionMode, 'qr')
})

test('tentativa pairing iniciada bloqueia troca para QR e resposta permanece no método atual', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let resolvePairing: ((value: WhatsappChannelPairingCodeResponse) => void) | undefined
  let qrRequests = 0
  const pendingPairing = new Promise<WhatsappChannelPairingCodeResponse>((resolve) => {
    resolvePairing = resolve
  })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelQrCode(channelId) {
      qrRequests += 1
      return { channelId, connectionStatus: 'WAITING_QR', qrCode: 'unused' }
    },
    async requestWhatsappChannelPairingCode() { return pendingPairing },
  }), state, new FakeQrScheduler())

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')
  const pairingRequest = controller.requestPairingCode()
  assert.equal(state.pairingLoading, true)
  assert.equal(await controller.switchConnectionMode('qr'), false)
  assert.equal(qrRequests, 0)

  resolvePairing?.({
    channelId: current.id,
    connectionStatus: 'WAITING_QR',
    pairingCode: 'CURRENT-CODE',
  })
  assert.equal(await pairingRequest, true)
  assert.equal(state.connectionMode, 'pairing')
  assert.equal(state.pairingCode, 'CURRENT-CODE')
  assert.equal(await controller.switchConnectionMode('qr'), false)
})

test('fechar modal invalida requisição de pareamento pendente', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  let resolvePairing: ((value: WhatsappChannelPairingCodeResponse) => void) | undefined
  const pendingPairing = new Promise<WhatsappChannelPairingCodeResponse>((resolve) => {
    resolvePairing = resolve
  })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async requestWhatsappChannelPairingCode() { return pendingPairing },
  }), state, new FakeQrScheduler())

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')
  const request = controller.requestPairingCode()
  assert.equal(controller.closeReconnectModal(), true)
  resolvePairing?.({
    channelId: current.id,
    connectionStatus: 'WAITING_QR',
    pairingCode: 'STALE-CODE',
  })

  assert.equal(await request, false)
  assert.equal(state.qrChannelId, null)
  assert.equal(state.pairingCode, '')
})

test('erros 400 e desconhecido no pareamento são amigáveis e preservam o formulário', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })

  for (const testCase of [
    { error: { response: { status: 400, data: { message: 'DTO detail' } } }, expected: /válido com DDD/i },
    { error: new Error('Evolution API detail'), expected: /Tente novamente/i },
  ]) {
    const state = emptyWhatsappChannelState()
    state.data = list([current])
    const controller = createWhatsappChannelController(repository({
      async requestWhatsappChannelPairingCode() { throw testCase.error },
    }), state, new FakeQrScheduler())
    await controller.openReconnectModal(current, 'OWNER')
    await controller.switchConnectionMode('pairing')
    controller.setPairingPhone('(45) 99133-5359')

    assert.equal(await controller.requestPairingCode(), false)
    assert.equal(state.pairingPhone, '(45) 99133-5359')
    assert.match(state.pairingError, testCase.expected)
    assert.doesNotMatch(state.pairingError, /DTO|Evolution/)
  }
})

test('polling do QR é temporário e termina no limite configurado', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED', isActive: false })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection(channelId) {
      return { channelId, connectionStatus: 'DISCONNECTED', connectedPhone: null, isActive: false }
    },
  }), state, scheduler)

  assert.equal(await controller.openReconnectModal(current, 'OWNER'), true)
  assert.equal(scheduler.pendingCount, 0)
  assert.equal(await controller.requestQrCode(current.id), true)
  assert.equal(scheduler.pendingCount, 1)
  for (let attempt = 0; attempt < QR_CONNECTION_MAX_CHECKS; attempt += 1) {
    assert.equal(scheduler.runNext(), true)
    await flushAsyncWork()
  }

  assert.equal(state.qrConnectionChecks, QR_CONNECTION_MAX_CHECKS)
  assert.equal(scheduler.pendingCount, 0)
  assert.match(state.qrError, /conexão ainda não foi confirmada/i)
  controller.dispose()
})

test('polling para ao conectar e mantém routing inativo', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED', connectedPhone: null, isActive: false })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection(channelId) {
      return {
        channelId,
        connectionStatus: 'CONNECTED',
        connectedPhone: '5545999999999',
        isActive: false,
      }
    },
  }), state, scheduler)

  assert.equal(await controller.openReconnectModal(current, 'OWNER'), true)
  assert.equal(await controller.requestQrCode(current.id), true)
  assert.equal(scheduler.runNext(), true)
  await flushAsyncWork()

  assert.equal(scheduler.pendingCount, 0)
  assert.equal(state.qrConnected, true)
  assert.equal(state.data.channels[0]?.connectionStatus, 'CONNECTED')
  assert.equal(state.data.channels[0]?.connectedPhone, '5545999999999')
  assert.equal(state.data.channels[0]?.isActive, false)
  assert.equal(canChangeWhatsappChannelRouting(state.data.channels[0]!, 'OWNER'), true)
})

test('pareamento reutiliza polling limitado e reflete CONNECTED sem ativar routing', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED', connectedPhone: null, isActive: false })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async getWhatsappChannelConnection(channelId) {
      return {
        channelId,
        connectionStatus: 'CONNECTED',
        connectedPhone: '5545991335359',
        isActive: false,
      }
    },
  }), state, scheduler)

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')
  assert.equal(await controller.requestPairingCode(), true)
  assert.equal(scheduler.pendingCount, 1)
  assert.equal(scheduler.runNext(), true)
  await flushAsyncWork()

  assert.equal(scheduler.pendingCount, 0)
  assert.equal(state.qrConnected, true)
  assert.equal(state.data.channels[0]?.connectionStatus, 'CONNECTED')
  assert.equal(state.data.channels[0]?.connectedPhone, '5545991335359')
  assert.equal(state.data.channels[0]?.isActive, false)
  assert.equal(canChangeWhatsappChannelRouting(state.data.channels[0]!, 'OWNER'), true)
})

test('dispose durante pareamento cancela polling e limpa qualquer tentativa ativa', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository(), state, scheduler)

  await controller.openReconnectModal(current, 'OWNER')
  await controller.switchConnectionMode('pairing')
  controller.setPairingPhone('(45) 99133-5359')
  await controller.requestPairingCode()
  assert.equal(scheduler.pendingCount, 1)

  controller.dispose()
  assert.equal(scheduler.pendingCount, 0)
  assert.equal(scheduler.runNext(), false)
})

test('polling para ao fechar o modal', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository(), state, scheduler)

  assert.equal(await controller.openReconnectModal(current, 'OWNER'), true)
  assert.equal(await controller.requestQrCode(current.id), true)
  assert.equal(scheduler.pendingCount, 1)
  assert.equal(controller.closeReconnectModal(), true)
  assert.equal(scheduler.pendingCount, 0)
  assert.equal(state.qrChannelId, null)
  assert.equal(scheduler.runNext(), false)
})

test('polling para ao desmontar o componente', async () => {
  const current = channel({ connectionStatus: 'DISCONNECTED' })
  const scheduler = new FakeQrScheduler()
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository(), state, scheduler)

  assert.equal(await controller.openReconnectModal(current, 'MANAGER'), true)
  assert.equal(await controller.requestQrCode(current.id), true)
  assert.equal(scheduler.pendingCount, 1)
  controller.dispose()
  assert.equal(scheduler.pendingCount, 0)

  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )
  assert.match(componentSource, /onUnmounted\(controller\.dispose\)/)
})

test('página não cria polling permanente fora do modal de QR', () => {
  const logicSource = readFileSync(
    new URL('../src/features/whatsapp-channels/whatsapp-channel.logic.ts', import.meta.url),
    'utf8',
  )
  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(`${logicSource}\n${componentSource}`, /setInterval/)
  assert.match(logicSource, /QR_CONNECTION_MAX_CHECKS/)
  assert.match(logicSource, /state\.qrChannelId/)
  assert.match(componentSource, /Atualizando conexão\.\.\./)
  assert.match(componentSource, /state\.connectionSyncErrors\[channel\.id\]/)
})

test('used=0 e limit=2 mantém apresentação normal', () => {
  assert.equal(whatsappChannelUsageLabel({ used: 0, limit: 2 }), '0 de 2 configurados')
  assert.equal(isWhatsappChannelOverLimit({ used: 0, limit: 2 }), false)
})

test('used=1 e limit=2 mantém apresentação normal', () => {
  assert.equal(whatsappChannelUsageLabel({ used: 1, limit: 2 }), '1 de 2 configurados')
  assert.equal(isWhatsappChannelOverLimit({ used: 1, limit: 2 }), false)
})

test('used=2 e limit=2 mantém apresentação normal', () => {
  assert.equal(whatsappChannelUsageLabel({ used: 2, limit: 2 }), '2 de 2 configurados')
  assert.equal(isWhatsappChannelOverLimit({ used: 2, limit: 2 }), false)
})

test('used=1 e limit=0 não gera apresentação contraditória', () => {
  const label = whatsappChannelUsageLabel({ used: 1, limit: 0 })

  assert.doesNotMatch(label, /1 de 0 configurados/)
})

test('used=1 e limit=0 informa canal existente e limite atual', () => {
  assert.equal(
    whatsappChannelUsageLabel({ used: 1, limit: 0 }),
    '1 canal configurado • limite atual: 0 canais permitidos',
  )
})

test('used=3 e limit=2 informa corretamente o excesso', () => {
  const usage = { used: 3, limit: 2 }

  assert.equal(isWhatsappChannelOverLimit(usage), true)
  assert.equal(
    whatsappChannelUsageLabel(usage),
    '3 canais configurados • limite atual: 2 canais permitidos',
  )
})

test('rótulo over-limit respeita singular e plural', () => {
  assert.match(
    whatsappChannelUsageLabel({ used: 1, limit: 0 }),
    /^1 canal configurado/,
  )
  assert.equal(
    whatsappChannelUsageLabel({ used: 2, limit: 1 }),
    '2 canais configurados • limite atual: 1 canal permitido',
  )
  assert.match(
    whatsappChannelUsageLabel({ used: 3, limit: 2 }),
    /2 canais permitidos$/,
  )
})

test('situação over-limit fornece aviso informativo não alarmista', () => {
  assert.equal(
    whatsappChannelEntitlementNotice({ used: 1, limit: 0 }),
    'A quantidade de canais configurados está acima do limite atual do plano. Os canais existentes permanecem disponíveis, mas novos canais não podem ser adicionados.',
  )
})

test('situação dentro do limite não fornece aviso de excesso', () => {
  assert.equal(whatsappChannelEntitlementNotice({ used: 0, limit: 2 }), null)
  assert.equal(whatsappChannelEntitlementNotice({ used: 2, limit: 2 }), null)
})

test('helpers de entitlement não alteram o objeto recebido', () => {
  const usage = { used: 3, limit: 2, available: 0 }
  const before = { ...usage }

  isWhatsappChannelOverLimit(usage)
  whatsappChannelUsageLabel(usage)
  whatsappChannelEntitlementNotice(usage)

  assert.deepEqual(usage, before)
})

test('apresentação de entitlement não realiza chamadas HTTP adicionais', () => {
  let calls = 0
  const http: WhatsappChannelHttpClient = {
    async get<T>() { calls += 1; throw new Error('not expected') },
    async post<T>() { calls += 1; throw new Error('not expected') },
    async patch<T>() { calls += 1; throw new Error('not expected') },
  }
  createWhatsappChannelRepository(http)

  whatsappChannelUsageLabel({ used: 1, limit: 0 })
  whatsappChannelEntitlementNotice({ used: 1, limit: 0 })

  assert.equal(calls, 0)
})

test('canais continuam renderizados quando a empresa está over-limit', () => {
  const response = list([channel()])
  response.limit = 0
  response.available = 0
  const before = structuredClone(response)
  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )

  assert.equal(isWhatsappChannelOverLimit(response), true)
  assert.match(componentSource, /v-for="\(channel, index\) in state\.data\.channels"/)
  assert.match(componentSource, /channelEntitlementNotice/)
  assert.deepEqual(response, before)
  assert.equal(response.channels.length, 1)
})

test('ACTIVE e INACTIVE possuem rótulos e descrições próprios de routing', () => {
  assert.equal(whatsappRoutingLabel(true), 'Routing ativo')
  assert.equal(whatsappRoutingDescription(true), 'Este canal pode participar dos envios.')
  assert.equal(whatsappRoutingLabel(false), 'Routing inativo')
  assert.equal(whatsappRoutingDescription(false), 'Este canal não participa dos envios.')
})

test('número conectado é exibido junto à identificação visual do canal', () => {
  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )

  assert.match(
    componentSource,
    /<h3>\{\{ whatsappChannelLabel\(index\) \}\}<\/h3>[\s\S]*formatConnectedPhoneForDisplay\(channel\.connectedPhone\)/,
  )
  assert.equal(formatConnectedPhoneForDisplay('+1 202 555 0123'), '+1 202 555 0123')
})

test('número brasileiro é formatado somente para apresentação', () => {
  assert.equal(formatConnectedPhoneForDisplay('5545999999999'), '(45) 99999-9999')
  assert.equal(formatConnectedPhoneForDisplay('554532109876'), '(45) 3210-9876')
})

test('telefone null ou vazio usa fallback sem quebrar a apresentação', () => {
  assert.equal(formatConnectedPhoneForDisplay(null), 'Número não identificado')
  assert.equal(formatConnectedPhoneForDisplay(''), 'Número não identificado')
  assert.equal(formatConnectedPhoneForDisplay('   '), 'Número não identificado')
})

test('formatação de apresentação não altera o valor original do canal', () => {
  const current = channel({ connectedPhone: '5545999999999' })

  assert.equal(formatConnectedPhoneForDisplay(current.connectedPhone), '(45) 99999-9999')
  assert.equal(current.connectedPhone, '5545999999999')
})

test('estado técnico é representado separadamente do routing', () => {
  const labels: Record<WhatsappConnectionStatus, string> = {
    UNKNOWN: 'Estado desconhecido',
    PROVISIONING: 'Configurando',
    WAITING_QR: 'Aguardando QR Code',
    CONNECTED: 'Conectado',
    DISCONNECTED: 'Desconectado',
    ERROR: 'Erro de conexão',
  }

  for (const [status, label] of Object.entries(labels)) {
    assert.equal(whatsappConnectionStatusLabel(status as WhatsappConnectionStatus), label)
  }
  assert.notEqual(whatsappConnectionStatusLabel('CONNECTED'), whatsappRoutingLabel(true))
})

test('ACTIVE + CONNECTED não apresenta alerta de conexão não confirmada', () => {
  assert.equal(shouldShowUnconfirmedConnectionNotice(channel({
    isActive: true,
    connectionStatus: 'CONNECTED',
  })), false)
})

test('ACTIVE + UNKNOWN apresenta alerta de conexão não confirmada', () => {
  assert.equal(shouldShowUnconfirmedConnectionNotice(channel({
    isActive: true,
    connectionStatus: 'UNKNOWN',
  })), true)
})

test('ACTIVE + DISCONNECTED apresenta alerta de conexão não confirmada', () => {
  assert.equal(shouldShowUnconfirmedConnectionNotice(channel({
    isActive: true,
    connectionStatus: 'DISCONNECTED',
  })), true)
})

test('ACTIVE + WAITING_QR apresenta alerta de conexão não confirmada', () => {
  assert.equal(shouldShowUnconfirmedConnectionNotice(channel({
    isActive: true,
    connectionStatus: 'WAITING_QR',
  })), true)
})

test('INACTIVE preserva a comunicação atual sem alerta de canal habilitado', () => {
  assert.equal(shouldShowUnconfirmedConnectionNotice(channel({
    isActive: false,
    connectionStatus: 'UNKNOWN',
  })), false)
})

test('componente vincula o alerta à combinação de routing e conexão', () => {
  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )

  assert.match(componentSource, /v-if="shouldShowUnconfirmedConnectionNotice\(channel\)"/)
  assert.match(
    componentSource,
    /O canal está habilitado para envios, mas a conexão com o WhatsApp não está confirmada\./,
  )
  assert.match(componentSource, /repeat\(auto-fit, minmax\(min\(100%, 340px\), 520px\)\)/)
})

test('ativação envia PATCH real com somente isActive=true', async () => {
  const calls: Array<{ url: string, payload: unknown }> = []
  const current = channel()
  const http: WhatsappChannelHttpClient = {
    async get<T>() { throw new Error('not expected') },
    async patch<T>(url, payload) {
      calls.push({ url, payload })
      return {
        data: {
          channelId: current.id,
          isActive: true,
          connectionStatus: 'CONNECTED',
        } as T,
      }
    },
  }

  await createWhatsappChannelRepository(http).updateWhatsappChannelRouting(current.id, true)

  assert.deepEqual(calls, [{
    url: whatsappChannelRoutingEndpoint(current.id),
    payload: { isActive: true },
  }])
  assert.deepEqual(Object.keys(calls[0]!.payload as object), ['isActive'])
})

test('desativação envia PATCH real com isActive=false', async () => {
  const calls: Array<{ url: string, payload: unknown }> = []
  const current = channel({ isActive: true })
  const http: WhatsappChannelHttpClient = {
    async get<T>() { throw new Error('not expected') },
    async patch<T>(url, payload) {
      calls.push({ url, payload })
      return {
        data: {
          channelId: current.id,
          isActive: false,
          connectionStatus: 'CONNECTED',
        } as T,
      }
    },
  }

  await createWhatsappChannelRepository(http).updateWhatsappChannelRouting(current.id, false)

  assert.deepEqual(calls, [{
    url: whatsappChannelRoutingEndpoint(current.id),
    payload: { isActive: false },
  }])
})

test('ativação indisponível quando o canal não está CONNECTED', async () => {
  let calls = 0
  const current = channel({ connectionStatus: 'WAITING_QR' })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async updateWhatsappChannelRouting() {
      calls += 1
      return { channelId: current.id, isActive: true, connectionStatus: 'WAITING_QR' }
    },
  }), state)

  assert.equal(canChangeWhatsappChannelRouting(current, 'OWNER'), false)
  assert.equal(await controller.updateRouting(current, true, 'OWNER'), false)
  assert.equal(calls, 0)
  assert.equal(state.data.channels[0]?.isActive, false)
})

test('canal não conectado ainda pode ter o routing desativado', async () => {
  const current = channel({ connectionStatus: 'ERROR', isActive: true })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async updateWhatsappChannelRouting(): Promise<WhatsappChannelRoutingResponse> {
      return { channelId: current.id, isActive: false, connectionStatus: 'ERROR' }
    },
  }), state)

  assert.equal(canChangeWhatsappChannelRouting(current, 'MANAGER'), true)
  assert.equal(await controller.updateRouting(current, false, 'MANAGER'), true)
  assert.equal(state.data.channels[0]?.isActive, false)
  assert.equal(state.data.channels[0]?.connectionStatus, 'ERROR')
})

test('erro do PATCH preserva routing e estado técnico anteriores', async () => {
  const current = channel({ isActive: false, connectionStatus: 'CONNECTED' })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async updateWhatsappChannelRouting() {
      throw { response: { status: 409, data: { message: 'technical detail' } } }
    },
  }), state)

  assert.equal(await controller.updateRouting(current, true, 'OWNER'), false)
  assert.equal(state.data.channels[0]?.isActive, false)
  assert.equal(state.data.channels[0]?.connectionStatus, 'CONNECTED')
  assert.equal(state.actionError, 'Conecte o canal ao WhatsApp antes de ativar o routing.')
  assert.doesNotMatch(state.actionError, /technical detail/)
})

test('sucesso altera somente routing e não presume mudança de connectionStatus', async () => {
  const current = channel({ connectionStatus: 'CONNECTED' })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async updateWhatsappChannelRouting() {
      return { channelId: current.id, isActive: true, connectionStatus: 'ERROR' }
    },
  }), state)

  assert.equal(await controller.updateRouting(current, true, 'OWNER'), true)
  assert.equal(state.data.channels[0]?.isActive, true)
  assert.equal(state.data.channels[0]?.connectionStatus, 'CONNECTED')
})

test('múltiplos canais podem permanecer ACTIVE simultaneamente', async () => {
  const first = channel({ id: 'channel-1', isActive: true })
  const second = channel({ id: 'channel-2', isActive: false })
  const state = emptyWhatsappChannelState()
  state.data = list([first, second])
  const controller = createWhatsappChannelController(repository(), state)

  assert.equal(await controller.updateRouting(second, true, 'OWNER'), true)
  assert.equal(state.data.channels.filter((item) => item.isActive).length, 2)
})

test('somente OWNER e MANAGER podem alterar routing', () => {
  const current = channel()
  assert.equal(canManageWhatsappChannels('OWNER'), true)
  assert.equal(canManageWhatsappChannels('MANAGER'), true)
  assert.equal(canManageWhatsappChannels('OPERATOR'), false)
  assert.equal(canManageWhatsappChannels('VIEWER'), false)
  assert.equal(canChangeWhatsappChannelRouting(current, 'OPERATOR'), false)
})

test('resposta segura e UI não modelam nem renderizam segredos técnicos', () => {
  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )
  const repositorySource = readFileSync(
    new URL('../src/features/whatsapp-channels/whatsapp-channel.repository.ts', import.meta.url),
    'utf8',
  )
  const forbidden = /instanceName|provisioningKey|apiKey|webhookSecret/i

  assert.doesNotMatch(componentSource, forbidden)
  assert.doesNotMatch(repositorySource, forbidden)
  assert.match(componentSource, /whatsappChannelLabel\(index\)/)
  assert.match(componentSource, /channel\.connectedPhone/)
})

test('loading, erro e vazio possuem estados explícitos e seguros', async () => {
  let resolveList: ((value: WhatsappChannelListResponse) => void) | undefined
  const pending = new Promise<WhatsappChannelListResponse>((resolve) => { resolveList = resolve })
  const loadingState = emptyWhatsappChannelState()
  const loadingController = createWhatsappChannelController(repository({
    async listWhatsappChannels() { return pending },
  }), loadingState)
  const loadPromise = loadingController.load()

  assert.equal(loadingState.loading, true)
  resolveList?.(list([]))
  assert.equal(await loadPromise, true)
  assert.equal(loadingState.loading, false)
  assert.deepEqual(loadingState.data?.channels, [])

  const errorState = emptyWhatsappChannelState()
  const errorController = createWhatsappChannelController(repository({
    async listWhatsappChannels() { throw new Error('database detail') },
  }), errorState)
  assert.equal(await errorController.load(), false)
  assert.equal(errorState.loadError, true)
  assert.equal(errorState.data, null)

  const componentSource = readFileSync(
    new URL('../src/components/settings/WhatsappChannelsSettings.vue', import.meta.url),
    'utf8',
  )
  assert.match(componentSource, /Carregando canais WhatsApp/)
  assert.match(componentSource, /Não foi possível carregar os canais WhatsApp/)
  assert.match(componentSource, /Nenhum canal WhatsApp configurado/)
})

test('requisição pendente bloqueia duplo acionamento sem atualização otimista', async () => {
  let resolveUpdate: ((value: WhatsappChannelRoutingResponse) => void) | undefined
  let calls = 0
  const current = channel()
  const pending = new Promise<WhatsappChannelRoutingResponse>((resolve) => { resolveUpdate = resolve })
  const state = emptyWhatsappChannelState()
  state.data = list([current])
  const controller = createWhatsappChannelController(repository({
    async updateWhatsappChannelRouting() {
      calls += 1
      return pending
    },
  }), state)

  const first = controller.updateRouting(current, true, 'OWNER')
  const second = controller.updateRouting(current, true, 'OWNER')
  assert.equal(await second, false)
  assert.equal(calls, 1)
  assert.equal(state.data.channels[0]?.isActive, false)
  resolveUpdate?.({ channelId: current.id, isActive: true, connectionStatus: 'CONNECTED' })
  assert.equal(await first, true)
  assert.equal(state.data.channels[0]?.isActive, true)
})

test('Settings incorpora a gestão sem criar rota ou configuração HTTP paralela', () => {
  const settingsSource = readFileSync(new URL('../src/views/Settings.vue', import.meta.url), 'utf8')
  const serviceSource = readFileSync(
    new URL('../src/services/whatsapp-channel.service.ts', import.meta.url),
    'utf8',
  )

  assert.match(settingsSource, /<WhatsappChannelsSettings/)
  assert.match(serviceSource, /import api from '\.\/api'/)
  assert.doesNotMatch(serviceSource, /axios\.create|companyId/)
})

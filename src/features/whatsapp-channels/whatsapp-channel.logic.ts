import type {
  WhatsappChannel,
  WhatsappChannelConnectionResponse,
  WhatsappChannelListResponse,
  WhatsappChannelPairingCodeResponse,
  WhatsappChannelQrResponse,
  WhatsappChannelRoutingResponse,
  WhatsappConnectionStatus,
} from './whatsapp-channel.repository'

export interface WhatsappChannelRepository {
  listWhatsappChannels(): Promise<WhatsappChannelListResponse>
  getWhatsappChannelConnection(channelId: string): Promise<WhatsappChannelConnectionResponse>
  getWhatsappChannelQrCode(channelId: string): Promise<WhatsappChannelQrResponse>
  requestWhatsappChannelPairingCode(
    channelId: string,
    phone: string,
  ): Promise<WhatsappChannelPairingCodeResponse>
  updateWhatsappChannelRouting(
    channelId: string,
    isActive: boolean,
  ): Promise<WhatsappChannelRoutingResponse>
}

export interface WhatsappChannelState {
  data: WhatsappChannelListResponse | null
  loading: boolean
  loadError: boolean
  syncingChannelIds: string[]
  connectionSyncErrors: Record<string, string>
  updatingChannelId: string | null
  actionError: string
  successMessage: string
  qrChannelId: string | null
  qrCode: string
  qrLoading: boolean
  qrError: string
  qrConnected: boolean
  qrConnectionChecks: number
  connectionMode: WhatsappConnectionMode
  pairingPhone: string
  pairingCode: string
  pairingLoading: boolean
  pairingError: string
  pairingCopyMessage: string
  pairingCopyError: string
}

export type WhatsappConnectionMode = 'qr' | 'pairing'

export interface WhatsappQrPollingScheduler {
  setTimeout(callback: () => void, delay: number): ReturnType<typeof setTimeout>
  clearTimeout(handle: ReturnType<typeof setTimeout>): void
}

export interface WhatsappClipboard {
  writeText(value: string): Promise<void>
}

export const QR_CONNECTION_CHECK_INTERVAL_MS = 5000
export const QR_CONNECTION_MAX_CHECKS = 24

const defaultQrPollingScheduler: WhatsappQrPollingScheduler = {
  setTimeout: (callback, delay) => setTimeout(callback, delay),
  clearTimeout: (handle) => clearTimeout(handle),
}

const defaultWhatsappClipboard: WhatsappClipboard = {
  async writeText(value) {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('Clipboard unavailable')
    }
    await navigator.clipboard.writeText(value)
  },
}

export const WHATSAPP_CONNECTION_STATUS_LABELS: Record<WhatsappConnectionStatus, string> = {
  UNKNOWN: 'Estado desconhecido',
  PROVISIONING: 'Configurando',
  WAITING_QR: 'Aguardando QR Code',
  CONNECTED: 'Conectado',
  DISCONNECTED: 'Desconectado',
  ERROR: 'Erro de conexão',
}

export function emptyWhatsappChannelState(): WhatsappChannelState {
  return {
    data: null,
    loading: false,
    loadError: false,
    syncingChannelIds: [],
    connectionSyncErrors: {},
    updatingChannelId: null,
    actionError: '',
    successMessage: '',
    qrChannelId: null,
    qrCode: '',
    qrLoading: false,
    qrError: '',
    qrConnected: false,
    qrConnectionChecks: 0,
    connectionMode: 'qr',
    pairingPhone: '',
    pairingCode: '',
    pairingLoading: false,
    pairingError: '',
    pairingCopyMessage: '',
    pairingCopyError: '',
  }
}

export function canManageWhatsappChannels(role: string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

export function whatsappConnectionStatusLabel(status: WhatsappConnectionStatus): string {
  return WHATSAPP_CONNECTION_STATUS_LABELS[status]
}

export function whatsappChannelLabel(index: number): string {
  return `WhatsApp ${index + 1}`
}

type WhatsappChannelUsage = Pick<WhatsappChannelListResponse, 'used' | 'limit'>

function quantityLabel(
  quantity: number,
  singular: string,
  plural: string,
): string {
  return `${quantity} ${quantity === 1 ? singular : plural}`
}

export function isWhatsappChannelOverLimit(usage: WhatsappChannelUsage): boolean {
  return usage.used > usage.limit
}

export function whatsappChannelUsageLabel(usage: WhatsappChannelUsage): string {
  if (!isWhatsappChannelOverLimit(usage)) {
    return `${usage.used} de ${usage.limit} configurados`
  }

  const configured = quantityLabel(
    usage.used,
    'canal configurado',
    'canais configurados',
  )
  const allowed = quantityLabel(
    usage.limit,
    'canal permitido',
    'canais permitidos',
  )
  return `${configured} • limite atual: ${allowed}`
}

export function whatsappChannelEntitlementNotice(
  usage: WhatsappChannelUsage,
): string | null {
  if (!isWhatsappChannelOverLimit(usage)) return null
  return 'A quantidade de canais configurados está acima do limite atual do plano. Os canais existentes permanecem disponíveis, mas novos canais não podem ser adicionados.'
}

export function formatConnectedPhoneForDisplay(connectedPhone: string | null): string {
  const value = connectedPhone?.trim()
  if (!value) return 'Número não identificado'

  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    const areaCode = digits.slice(2, 4)
    const localNumber = digits.slice(4)
    const prefixLength = localNumber.length === 9 ? 5 : 4
    return `(${areaCode}) ${localNumber.slice(0, prefixLength)}-${localNumber.slice(prefixLength)}`
  }

  return value
}

export function whatsappRoutingLabel(isActive: boolean): string {
  return isActive ? 'Routing ativo' : 'Routing inativo'
}

export function whatsappRoutingDescription(isActive: boolean): string {
  return isActive
    ? 'Este canal pode participar dos envios.'
    : 'Este canal não participa dos envios.'
}

export function shouldShowUnconfirmedConnectionNotice(channel: WhatsappChannel): boolean {
  return channel.isActive && channel.connectionStatus !== 'CONNECTED'
}

export function canReconnectWhatsapp(channel: WhatsappChannel): boolean {
  return channel.connectionStatus !== 'CONNECTED'
}

export function whatsappQrImageSource(qrCode: string): string | null {
  const value = qrCode.trim()
  if (/^data:image\/png;base64,[a-z0-9+/]+={0,2}$/i.test(value)) return value
  if (/^[a-z0-9+/]+={0,2}$/i.test(value) && value.length >= 32) {
    return `data:image/png;base64,${value}`
  }
  return null
}

export function canChangeWhatsappChannelRouting(
  channel: WhatsappChannel,
  role: string | null | undefined,
): boolean {
  if (!canManageWhatsappChannels(role)) return false
  return channel.isActive || channel.connectionStatus === 'CONNECTED'
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) return undefined
  return typeof response.status === 'number' ? response.status : undefined
}

export function whatsappChannelActionError(error: unknown): string {
  const status = errorStatus(error)
  if (status === 403) return 'Você não tem permissão para alterar este canal.'
  if (status === 404) return 'Este canal não está mais disponível.'
  if (status === 409) return 'Conecte o canal ao WhatsApp antes de ativar o routing.'
  return 'Não foi possível alterar o routing deste canal. Tente novamente.'
}

export function whatsappConnectionSyncError(): string {
  return 'Não foi possível atualizar a conexão. Os dados anteriores foram mantidos.'
}

export function whatsappQrRequestError(): string {
  return 'Não foi possível obter o QR Code. Tente novamente.'
}

export function whatsappPairingCodeRequestError(status?: number): string {
  if (status === 400) return 'Informe um número de WhatsApp válido com DDD.'
  return 'Não foi possível gerar o código de pareamento. Tente novamente.'
}

export function createWhatsappChannelController(
  repository: WhatsappChannelRepository,
  state: WhatsappChannelState = emptyWhatsappChannelState(),
  qrScheduler: WhatsappQrPollingScheduler = defaultQrPollingScheduler,
  clipboard: WhatsappClipboard = defaultWhatsappClipboard,
) {
  let loadGeneration = 0
  const syncTokens = new Map<string, symbol>()
  const routingRevisions = new Map<string, number>()
  let qrPollingHandle: ReturnType<typeof setTimeout> | null = null
  let qrPollingGeneration = 0
  let connectionAttemptGeneration = 0

  function setChannelSyncing(channelId: string, syncing: boolean) {
    state.syncingChannelIds = syncing
      ? [...state.syncingChannelIds.filter((id) => id !== channelId), channelId]
      : state.syncingChannelIds.filter((id) => id !== channelId)
  }

  function setConnectionSyncError(channelId: string, message?: string) {
    const nextErrors = { ...state.connectionSyncErrors }
    if (message) nextErrors[channelId] = message
    else delete nextErrors[channelId]
    state.connectionSyncErrors = nextErrors
  }

  async function syncChannelConnection(
    channelId: string,
    generation: number = loadGeneration,
  ): Promise<boolean> {
    if (
      generation !== loadGeneration
      || !state.data?.channels.some((channel) => channel.id === channelId)
      || state.syncingChannelIds.includes(channelId)
    ) {
      return false
    }

    const token = Symbol(channelId)
    const routingRevision = routingRevisions.get(channelId) ?? 0
    syncTokens.set(channelId, token)
    setChannelSyncing(channelId, true)
    setConnectionSyncError(channelId)

    try {
      const result = await repository.getWhatsappChannelConnection(channelId)
      if (
        generation !== loadGeneration
        || syncTokens.get(channelId) !== token
      ) {
        return false
      }
      if (result.channelId !== channelId) throw new Error('Unexpected connection response')

      const routingUnchanged = (routingRevisions.get(channelId) ?? 0) === routingRevision
      if (state.data) {
        state.data = {
          ...state.data,
          channels: state.data.channels.map((channel) => channel.id === channelId
            ? {
                ...channel,
                connectionStatus: result.connectionStatus,
                connectedPhone: result.connectedPhone,
                isActive: routingUnchanged ? result.isActive : channel.isActive,
              }
            : channel),
        }
      }
      return true
    } catch {
      if (generation === loadGeneration && syncTokens.get(channelId) === token) {
        setConnectionSyncError(channelId, whatsappConnectionSyncError())
      }
      return false
    } finally {
      if (syncTokens.get(channelId) === token) {
        syncTokens.delete(channelId)
        setChannelSyncing(channelId, false)
      }
    }
  }

  async function syncAllConnections(generation: number = loadGeneration): Promise<void> {
    const channelIds = state.data?.channels.map((channel) => channel.id) ?? []
    await Promise.all(channelIds.map((channelId) => (
      syncChannelConnection(channelId, generation)
    )))
  }

  function stopQrPolling() {
    qrPollingGeneration += 1
    if (qrPollingHandle !== null) {
      qrScheduler.clearTimeout(qrPollingHandle)
      qrPollingHandle = null
    }
  }

  function clearConnectionAttemptFeedback() {
    state.qrError = ''
    state.pairingError = ''
    state.pairingCopyMessage = ''
    state.pairingCopyError = ''
  }

  function invalidateConnectionAttempt() {
    connectionAttemptGeneration += 1
    stopQrPolling()
    state.qrLoading = false
    state.pairingLoading = false
  }

  function markConnectionConnected(channelId: string) {
    stopQrPolling()
    state.qrConnected = true
    state.qrCode = ''
    state.pairingCode = ''
    clearConnectionAttemptFeedback()
    const channelIndex = state.data?.channels.findIndex((channel) => channel.id === channelId) ?? -1
    const channelName = channelIndex >= 0 ? whatsappChannelLabel(channelIndex) : 'Canal WhatsApp'
    state.successMessage = `${channelName} conectado ao WhatsApp. Ative o routing quando desejar.`
  }

  function scheduleQrConnectionCheck(generation: number) {
    if (
      generation !== qrPollingGeneration
      || !state.qrChannelId
      || state.qrConnected
      || state.qrConnectionChecks >= QR_CONNECTION_MAX_CHECKS
    ) {
      return
    }

    qrPollingHandle = qrScheduler.setTimeout(() => {
      qrPollingHandle = null
      void checkQrConnection(generation)
    }, QR_CONNECTION_CHECK_INTERVAL_MS)
  }

  async function checkQrConnection(generation: number): Promise<void> {
    const channelId = state.qrChannelId
    if (generation !== qrPollingGeneration || !channelId || state.qrConnected) return

    state.qrConnectionChecks += 1
    await syncChannelConnection(channelId)
    if (generation !== qrPollingGeneration || state.qrChannelId !== channelId) return

    const channel = state.data?.channels.find((item) => item.id === channelId)
    if (channel?.connectionStatus === 'CONNECTED') {
      markConnectionConnected(channelId)
      return
    }
    if (state.qrConnectionChecks >= QR_CONNECTION_MAX_CHECKS) {
      stopQrPolling()
      const message = 'A conexão ainda não foi confirmada. Tente gerar uma nova opção de conexão.'
      if (state.connectionMode === 'pairing') state.pairingError = message
      else state.qrError = message
      return
    }
    scheduleQrConnectionCheck(generation)
  }

  function startQrPolling() {
    stopQrPolling()
    state.qrConnectionChecks = 0
    const generation = qrPollingGeneration
    scheduleQrConnectionCheck(generation)
  }

  async function requestQrCode(channelId: string): Promise<boolean> {
    if (
      state.qrLoading
      || state.pairingLoading
      || state.qrCode
      || state.pairingCode
      || state.connectionMode !== 'qr'
      || state.qrChannelId !== channelId
    ) return false
    invalidateConnectionAttempt()
    const attempt = connectionAttemptGeneration
    state.qrLoading = true
    clearConnectionAttemptFeedback()
    state.qrConnected = false
    state.qrCode = ''
    state.pairingCode = ''

    try {
      const result = await repository.getWhatsappChannelQrCode(channelId)
      if (
        attempt !== connectionAttemptGeneration
        || state.connectionMode !== 'qr'
        || state.qrChannelId !== channelId
      ) {
        return false
      }
      if (result.channelId !== channelId) throw new Error('Unexpected QR response')

      if (state.data) {
        state.data = {
          ...state.data,
          channels: state.data.channels.map((channel) => channel.id === channelId
            ? { ...channel, connectionStatus: result.connectionStatus }
            : channel),
        }
      }

      if (result.connectionStatus === 'CONNECTED') {
        await syncChannelConnection(channelId)
        if (attempt !== connectionAttemptGeneration) return false
        markConnectionConnected(channelId)
        return true
      }

      const imageSource = result.qrCode ? whatsappQrImageSource(result.qrCode) : null
      if (!imageSource) {
        state.qrError = 'O QR Code não está disponível no momento. Tente novamente.'
        return false
      }
      state.qrCode = result.qrCode ?? ''
      startQrPolling()
      return true
    } catch {
      if (attempt === connectionAttemptGeneration) state.qrError = whatsappQrRequestError()
      return false
    } finally {
      if (attempt === connectionAttemptGeneration) state.qrLoading = false
    }
  }

  async function requestPairingCode(): Promise<boolean> {
    const channelId = state.qrChannelId
    const phone = state.pairingPhone
    if (
      !channelId
      || state.qrLoading
      || state.pairingLoading
      || state.qrCode
      || state.pairingCode
      || state.connectionMode !== 'pairing'
    ) return false
    if (!phone.trim()) {
      state.pairingError = 'Informe o número do WhatsApp.'
      return false
    }

    invalidateConnectionAttempt()
    const attempt = connectionAttemptGeneration
    state.pairingLoading = true
    clearConnectionAttemptFeedback()
    state.qrConnected = false
    state.qrCode = ''
    state.pairingCode = ''

    try {
      const result = await repository.requestWhatsappChannelPairingCode(channelId, phone)
      if (
        attempt !== connectionAttemptGeneration
        || state.connectionMode !== 'pairing'
        || state.qrChannelId !== channelId
      ) {
        return false
      }
      if (result.channelId !== channelId) throw new Error('Unexpected pairing response')

      if (state.data) {
        state.data = {
          ...state.data,
          channels: state.data.channels.map((channel) => channel.id === channelId
            ? { ...channel, connectionStatus: result.connectionStatus }
            : channel),
        }
      }

      if (result.connectionStatus === 'CONNECTED') {
        await syncChannelConnection(channelId)
        if (attempt !== connectionAttemptGeneration) return false
        markConnectionConnected(channelId)
        return true
      }
      if (!result.pairingCode) {
        state.pairingError = 'O código de pareamento não está disponível no momento. Tente novamente.'
        return false
      }

      state.pairingCode = result.pairingCode
      startQrPolling()
      return true
    } catch (error) {
      if (attempt === connectionAttemptGeneration) {
        state.pairingError = whatsappPairingCodeRequestError(errorStatus(error))
      }
      return false
    } finally {
      if (attempt === connectionAttemptGeneration) state.pairingLoading = false
    }
  }

  function setPairingPhone(value: string) {
    if (state.pairingLoading) return
    state.pairingPhone = value
    state.pairingError = ''
    state.pairingCopyMessage = ''
    state.pairingCopyError = ''
  }

  async function copyPairingCode(): Promise<boolean> {
    const pairingCode = state.pairingCode
    if (!pairingCode) return false
    const attempt = connectionAttemptGeneration
    state.pairingCopyMessage = ''
    state.pairingCopyError = ''
    try {
      await clipboard.writeText(pairingCode)
      if (
        attempt === connectionAttemptGeneration
        && state.connectionMode === 'pairing'
        && state.pairingCode === pairingCode
      ) {
        state.pairingCopyMessage = 'Código copiado.'
      }
      return true
    } catch {
      if (attempt === connectionAttemptGeneration && state.connectionMode === 'pairing') {
        state.pairingCopyError = 'Não foi possível copiar o código. Selecione e copie manualmente.'
      }
      return false
    }
  }

  async function switchConnectionMode(mode: WhatsappConnectionMode): Promise<boolean> {
    if (
      !state.qrChannelId
      || state.connectionMode === mode
      || state.qrLoading
      || state.pairingLoading
      || Boolean(state.qrCode)
      || Boolean(state.pairingCode)
    ) return false
    invalidateConnectionAttempt()
    state.connectionMode = mode
    state.qrCode = ''
    state.pairingCode = ''
    state.qrConnected = false
    state.qrConnectionChecks = 0
    clearConnectionAttemptFeedback()
    return true
  }

  async function openReconnectModal(
    channel: WhatsappChannel,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (!canManageWhatsappChannels(role) || !canReconnectWhatsapp(channel)) return false
    invalidateConnectionAttempt()
    state.qrChannelId = channel.id
    state.connectionMode = 'qr'
    state.qrCode = ''
    state.qrError = ''
    state.qrConnected = false
    state.qrConnectionChecks = 0
    state.pairingPhone = ''
    state.pairingCode = ''
    state.pairingError = ''
    state.pairingCopyMessage = ''
    state.pairingCopyError = ''
    return true
  }

  function closeReconnectModal(): boolean {
    invalidateConnectionAttempt()
    state.qrChannelId = null
    state.connectionMode = 'qr'
    state.qrCode = ''
    state.qrError = ''
    state.qrConnected = false
    state.qrConnectionChecks = 0
    state.pairingPhone = ''
    state.pairingCode = ''
    state.pairingError = ''
    state.pairingCopyMessage = ''
    state.pairingCopyError = ''
    return true
  }

  function dispose() {
    invalidateConnectionAttempt()
  }

  async function load(): Promise<boolean> {
    if (state.loading) return false
    loadGeneration += 1
    const generation = loadGeneration
    syncTokens.clear()
    state.loading = true
    state.loadError = false
    state.syncingChannelIds = []
    state.connectionSyncErrors = {}
    state.actionError = ''

    try {
      state.data = await repository.listWhatsappChannels()
      state.loading = false
      await syncAllConnections(generation)
      return true
    } catch {
      state.data = null
      state.loadError = true
      return false
    } finally {
      if (generation === loadGeneration) state.loading = false
    }
  }

  async function updateRouting(
    channel: WhatsappChannel,
    isActive: boolean,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (
      state.updatingChannelId !== null
      || channel.isActive === isActive
      || !canManageWhatsappChannels(role)
      || (isActive && channel.connectionStatus !== 'CONNECTED')
    ) {
      return false
    }

    state.updatingChannelId = channel.id
    routingRevisions.set(channel.id, (routingRevisions.get(channel.id) ?? 0) + 1)
    state.actionError = ''
    state.successMessage = ''

    try {
      const result = await repository.updateWhatsappChannelRouting(channel.id, isActive)
      if (result.channelId !== channel.id || result.isActive !== isActive) {
        throw new Error('Unexpected routing response')
      }

      if (state.data) {
        state.data = {
          ...state.data,
          channels: state.data.channels.map((item) => (
            item.id === channel.id ? { ...item, isActive: result.isActive } : item
          )),
        }
      }
      const channelIndex = state.data?.channels.findIndex((item) => item.id === channel.id) ?? -1
      const channelName = channelIndex >= 0 ? whatsappChannelLabel(channelIndex) : 'Canal WhatsApp'
      state.successMessage = isActive
        ? `${channelName} ativado para envios.`
        : `${channelName} desativado para envios.`
      return true
    } catch (error) {
      state.actionError = whatsappChannelActionError(error)
      return false
    } finally {
      state.updatingChannelId = null
    }
  }

  return {
    state,
    load,
    syncChannelConnection,
    syncAllConnections,
    updateRouting,
    requestQrCode,
    requestPairingCode,
    setPairingPhone,
    copyPairingCode,
    switchConnectionMode,
    openReconnectModal,
    closeReconnectModal,
    dispose,
  }
}

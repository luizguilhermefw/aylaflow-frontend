export const WHATSAPP_CHANNELS_ENDPOINT = '/company/messaging-channels/whatsapp'

export type WhatsappConnectionStatus =
  | 'UNKNOWN'
  | 'PROVISIONING'
  | 'WAITING_QR'
  | 'CONNECTED'
  | 'DISCONNECTED'
  | 'ERROR'

export interface WhatsappChannel {
  id: string
  connectionStatus: WhatsappConnectionStatus
  connectedPhone: string | null
  isActive: boolean
}

export interface WhatsappChannelListResponse {
  limit: number
  used: number
  available: number
  channels: WhatsappChannel[]
}

export interface WhatsappChannelRoutingResponse {
  channelId: string
  isActive: boolean
  connectionStatus: WhatsappConnectionStatus
}

export interface WhatsappChannelConnectionResponse {
  channelId: string
  connectionStatus: WhatsappConnectionStatus
  connectedPhone: string | null
  isActive: boolean
}

export interface WhatsappChannelQrResponse {
  channelId: string
  connectionStatus: WhatsappConnectionStatus
  qrCode?: string
}

export interface WhatsappChannelProvisionResponse {
  channelId: string
  connectionStatus: WhatsappConnectionStatus
  qrCode?: string
}

export interface WhatsappChannelPairingCodeResponse {
  channelId: string
  connectionStatus: WhatsappConnectionStatus
  pairingCode?: string
}

export interface WhatsappChannelHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  post<T>(
    url: string,
    payload?: unknown,
    config?: { headers?: Record<string, string> },
  ): Promise<{ data: T }>
  patch<T>(url: string, payload: unknown): Promise<{ data: T }>
}

export function whatsappChannelRoutingEndpoint(channelId: string): string {
  return `${WHATSAPP_CHANNELS_ENDPOINT}/${encodeURIComponent(channelId)}/routing`
}

export function whatsappChannelConnectionEndpoint(channelId: string): string {
  return `${WHATSAPP_CHANNELS_ENDPOINT}/${encodeURIComponent(channelId)}/connection`
}

export function whatsappChannelQrEndpoint(channelId: string): string {
  return `${WHATSAPP_CHANNELS_ENDPOINT}/${encodeURIComponent(channelId)}/qr`
}

export function whatsappChannelPairingCodeEndpoint(channelId: string): string {
  return `${WHATSAPP_CHANNELS_ENDPOINT}/${encodeURIComponent(channelId)}/pairing-code`
}

export function createWhatsappChannelRepository(http: WhatsappChannelHttpClient) {
  return {
    async listWhatsappChannels(): Promise<WhatsappChannelListResponse> {
      const { data } = await http.get<WhatsappChannelListResponse>(WHATSAPP_CHANNELS_ENDPOINT)
      return data
    },
    async provisionWhatsappChannel(
      idempotencyKey: string,
    ): Promise<WhatsappChannelProvisionResponse> {
      const { data } = await http.post<WhatsappChannelProvisionResponse>(
        WHATSAPP_CHANNELS_ENDPOINT,
        {},
        { headers: { 'Idempotency-Key': idempotencyKey } },
      )
      return data
    },
    async getWhatsappChannelConnection(
      channelId: string,
    ): Promise<WhatsappChannelConnectionResponse> {
      const { data } = await http.get<WhatsappChannelConnectionResponse>(
        whatsappChannelConnectionEndpoint(channelId),
      )
      return data
    },
    async getWhatsappChannelQrCode(channelId: string): Promise<WhatsappChannelQrResponse> {
      const { data } = await http.post<WhatsappChannelQrResponse>(
        whatsappChannelQrEndpoint(channelId),
      )
      return data
    },
    async requestWhatsappChannelPairingCode(
      channelId: string,
      phone: string,
    ): Promise<WhatsappChannelPairingCodeResponse> {
      const { data } = await http.post<WhatsappChannelPairingCodeResponse>(
        whatsappChannelPairingCodeEndpoint(channelId),
        { phone },
      )
      return data
    },
    async updateWhatsappChannelRouting(
      channelId: string,
      isActive: boolean,
    ): Promise<WhatsappChannelRoutingResponse> {
      const { data } = await http.patch<WhatsappChannelRoutingResponse>(
        whatsappChannelRoutingEndpoint(channelId),
        { isActive },
      )
      return data
    },
  }
}

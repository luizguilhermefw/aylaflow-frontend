import api from './api'
import {
  createWhatsappChannelRepository,
  type WhatsappChannelHttpClient,
} from '@/features/whatsapp-channels/whatsapp-channel.repository'

export type {
  WhatsappChannel,
  WhatsappChannelConnectionResponse,
  WhatsappChannelListResponse,
  WhatsappChannelPairingCodeResponse,
  WhatsappChannelProvisionResponse,
  WhatsappChannelQrResponse,
  WhatsappChannelRoutingResponse,
  WhatsappConnectionStatus,
} from '@/features/whatsapp-channels/whatsapp-channel.repository'

export const whatsappChannelService = createWhatsappChannelRepository(
  api as WhatsappChannelHttpClient,
)

import api from './api'
import { createCampaignRepository } from '@/features/campaigns/campaign.logic'
import type { CampaignHttpClient } from '@/features/campaigns/campaign.logic'
import type {
  CampaignAudience,
  CampaignAudiencePreviewResponse,
  CampaignAudienceType,
  CampaignAudienceUpdatePayload,
  CampaignSegmentGender,
} from '@/features/campaigns/campaign.types'

export type {
  CampaignAudience,
  CampaignAudiencePreviewPayload,
  CampaignAudiencePreviewResponse,
  CampaignAudienceType,
  CampaignAudienceUpdatePayload,
  CampaignSegmentForm,
  CampaignSegmentGender,
} from '@/features/campaigns/campaign.types'

export type AutomationType = 'REACTIVATION' | 'BIRTHDAY' | 'CAMPAIGN' | 'MAINTENANCE'

export interface Automation {
  id: string
  name: string
  type: AutomationType
  message: string | null
  daysAfter: number | null
  cooldownHours: number
  isActive: boolean
  isSystem: boolean
  createdAt: string
  campaignAudienceType: CampaignAudienceType
  segmentGender: CampaignSegmentGender | null
  segmentCity: string | null
  segmentState: string | null
  segmentMinAge: number | null
  segmentMaxAge: number | null
  segmentLastPurchaseBefore: string | null
  segmentLastPurchaseAfter: string | null
}

export interface CreateCampaignPayload {
  name: string
}

export interface CampaignTextDispatchPayload {
  type: 'TEXT'
  content: string
  audience: CampaignAudience
  mediaAssetId?: never
  caption?: never
}

export interface CampaignImageDispatchPayload {
  type: 'IMAGE'
  mediaAssetId: string
  caption?: string
  audience: CampaignAudience
  content?: never
}

export type CampaignDispatchPayload = CampaignTextDispatchPayload | CampaignImageDispatchPayload

export interface CampaignDispatchResponse {
  automationId: string
  type: 'TEXT' | 'IMAGE'
  audienceType: CampaignAudienceType
  eligibleCustomers: number
  processed: number
}

export interface AutomationService {
  list(): Promise<Automation[]>
  createCampaign(payload: CreateCampaignPayload): Promise<Automation>
  updateCampaignAudience(id: string, payload: CampaignAudienceUpdatePayload): Promise<Automation>
  previewCampaignAudience(
    id: string,
    payload: { audience: CampaignAudience },
  ): Promise<CampaignAudiencePreviewResponse>
  dispatchCampaign(id: string, payload: CampaignDispatchPayload): Promise<CampaignDispatchResponse>
}

export const automationService: AutomationService = createCampaignRepository<
  Automation,
  CampaignDispatchPayload,
  CampaignDispatchResponse
>(api as CampaignHttpClient)

import api from './api'

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
}

export interface CreateCampaignPayload {
  name: string
}

export interface CampaignAudienceAllEligible {
  type: 'ALL_ELIGIBLE'
}

export interface CampaignAudienceCustomerIds {
  type: 'CUSTOMER_IDS'
  customerIds: string[]
}

export type CampaignAudience = CampaignAudienceAllEligible | CampaignAudienceCustomerIds

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
  audienceType: 'ALL_ELIGIBLE' | 'CUSTOMER_IDS'
  eligibleCustomers: number
  processed: number
}

export const automationService = {
  async list(): Promise<Automation[]> {
    const { data } = await api.get<Automation[]>('/automation')
    return data
  },
  async createCampaign(payload: CreateCampaignPayload): Promise<Automation> {
    const { data } = await api.post<Automation>('/automation/campaign', payload)
    return data
  },
  async dispatchCampaign(
    automationId: string,
    payload: CampaignDispatchPayload,
  ): Promise<CampaignDispatchResponse> {
    const { data } = await api.post<CampaignDispatchResponse>(
      `/automation/${automationId}/campaign/dispatch`,
      payload,
    )
    return data
  },
}

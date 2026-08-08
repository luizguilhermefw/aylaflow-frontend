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

export interface CampaignTextDispatchPayload {
  type: 'TEXT'
  content: string
  audience: CampaignAudienceAllEligible
}

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
    payload: CampaignTextDispatchPayload,
  ): Promise<CampaignDispatchResponse> {
    const { data } = await api.post<CampaignDispatchResponse>(
      `/automation/${automationId}/campaign/dispatch`,
      payload,
    )
    return data
  },
}

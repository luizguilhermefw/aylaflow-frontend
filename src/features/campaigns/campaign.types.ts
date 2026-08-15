export type CampaignAudienceType = 'ALL_ELIGIBLE' | 'CUSTOMER_IDS' | 'SEGMENTED'

export type CampaignSegmentGender = 'FEMALE' | 'MALE' | 'OTHER' | 'UNSPECIFIED'

export interface CampaignSegmentForm {
  segmentGender: '' | CampaignSegmentGender
  segmentCity: string
  segmentState: string
  segmentMinAge: string
  segmentMaxAge: string
  segmentLastPurchaseBefore: string
  segmentLastPurchaseAfter: string
}

export interface CampaignSegmentationFields {
  segmentGender: CampaignSegmentGender | null
  segmentCity: string | null
  segmentState: string | null
  segmentMinAge: number | null
  segmentMaxAge: number | null
  segmentLastPurchaseBefore: string | null
  segmentLastPurchaseAfter: string | null
}

export interface PersistedCampaignAudience extends CampaignSegmentationFields {
  campaignAudienceType: CampaignAudienceType
}

export interface CampaignAudienceAllEligible {
  type: 'ALL_ELIGIBLE'
}

export interface CampaignAudienceCustomerIds {
  type: 'CUSTOMER_IDS'
  customerIds: string[]
}

export interface CampaignAudienceSegmented {
  type: 'SEGMENTED'
}

export type CampaignAudience =
  | CampaignAudienceAllEligible
  | CampaignAudienceCustomerIds
  | CampaignAudienceSegmented

export interface CampaignAudienceUpdateAllEligible {
  audienceType: 'ALL_ELIGIBLE'
}

export interface CampaignAudienceUpdateSegmented extends CampaignSegmentationFields {
  audienceType: 'SEGMENTED'
}

export type CampaignAudienceUpdatePayload =
  | CampaignAudienceUpdateAllEligible
  | CampaignAudienceUpdateSegmented

export interface CampaignAudiencePreviewPayload {
  audience: CampaignAudience
}

export interface CampaignAudiencePreviewResponse {
  audienceType: CampaignAudienceType
  matched: number
  eligible: number
  blocked: number
}

export interface CampaignAudiencePreviewState {
  fingerprint: string
  response: CampaignAudiencePreviewResponse
}

export interface AutomationLifecycleUpdatePayload {
  isActive: boolean
}

export interface DeleteAutomationResponse<TAutomation> {
  message: string
  automation: TAutomation
}

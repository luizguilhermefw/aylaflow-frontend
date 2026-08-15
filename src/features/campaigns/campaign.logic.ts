import type {
  CampaignAudience,
  CampaignAudiencePreviewPayload,
  CampaignAudiencePreviewResponse,
  CampaignAudiencePreviewState,
  CampaignAudienceType,
  CampaignAudienceUpdatePayload,
  CampaignSegmentForm,
  CampaignSegmentationFields,
  AutomationLifecycleUpdatePayload,
  DeleteAutomationResponse,
  PersistedCampaignAudience,
} from './campaign.types'

export const AUTOMATION_ENDPOINT = '/automation'

export function campaignAudiencePreviewEndpoint(automationId: string): string {
  return `${AUTOMATION_ENDPOINT}/${automationId}/campaign/audience-preview`
}

export function campaignDispatchEndpoint(automationId: string): string {
  return `${AUTOMATION_ENDPOINT}/${automationId}/campaign/dispatch`
}

export function campaignUpdateEndpoint(automationId: string): string {
  return `${AUTOMATION_ENDPOINT}/${automationId}`
}

export function emptyCampaignSegmentForm(): CampaignSegmentForm {
  return {
    segmentGender: '',
    segmentCity: '',
    segmentState: '',
    segmentMinAge: '',
    segmentMaxAge: '',
    segmentLastPurchaseBefore: '',
    segmentLastPurchaseAfter: '',
  }
}

function dateInputValue(value: string | null | undefined): string {
  return value?.slice(0, 10) ?? ''
}

export function hydrateCampaignAudience(campaign: PersistedCampaignAudience): {
  audienceType: CampaignAudienceType
  segmentFilters: CampaignSegmentForm
} {
  return {
    audienceType: campaign.campaignAudienceType === 'SEGMENTED'
      ? 'SEGMENTED'
      : 'ALL_ELIGIBLE',
    segmentFilters: {
      segmentGender: campaign.segmentGender ?? '',
      segmentCity: campaign.segmentCity ?? '',
      segmentState: campaign.segmentState ?? '',
      segmentMinAge: campaign.segmentMinAge?.toString() ?? '',
      segmentMaxAge: campaign.segmentMaxAge?.toString() ?? '',
      segmentLastPurchaseBefore: dateInputValue(campaign.segmentLastPurchaseBefore),
      segmentLastPurchaseAfter: dateInputValue(campaign.segmentLastPurchaseAfter),
    },
  }
}

function normalizedOptionalText(value: string): string | null {
  const normalized = value.trim()
  return normalized || null
}

function normalizedOptionalNumber(value: string): number | null {
  if (!value.trim()) return null
  return Number(value)
}

export function normalizeCampaignSegmentation(
  filters: CampaignSegmentForm,
): CampaignSegmentationFields {
  return {
    segmentGender: filters.segmentGender || null,
    segmentCity: normalizedOptionalText(filters.segmentCity),
    segmentState: normalizedOptionalText(filters.segmentState)?.toUpperCase() ?? null,
    segmentMinAge: normalizedOptionalNumber(filters.segmentMinAge),
    segmentMaxAge: normalizedOptionalNumber(filters.segmentMaxAge),
    segmentLastPurchaseBefore: normalizedOptionalText(filters.segmentLastPurchaseBefore),
    segmentLastPurchaseAfter: normalizedOptionalText(filters.segmentLastPurchaseAfter),
  }
}

export function validateCampaignSegmentation(filters: CampaignSegmentForm): string {
  const segmentation = normalizeCampaignSegmentation(filters)
  const values = Object.values(segmentation)

  if (values.every((value) => value === null)) {
    return 'Informe pelo menos um filtro para segmentar os clientes.'
  }

  for (const age of [segmentation.segmentMinAge, segmentation.segmentMaxAge]) {
    if (age !== null && (!Number.isInteger(age) || age < 0 || age > 120)) {
      return 'As idades devem ser números inteiros entre 0 e 120.'
    }
  }

  if (
    segmentation.segmentMinAge !== null
    && segmentation.segmentMaxAge !== null
    && segmentation.segmentMinAge > segmentation.segmentMaxAge
  ) {
    return 'A idade mínima não pode ser maior que a idade máxima.'
  }

  if (
    segmentation.segmentLastPurchaseAfter
    && segmentation.segmentLastPurchaseBefore
    && segmentation.segmentLastPurchaseAfter > segmentation.segmentLastPurchaseBefore
  ) {
    return 'A data inicial da última compra não pode ser posterior à data final.'
  }

  return ''
}

export function buildCampaignAudience(
  audienceType: CampaignAudienceType,
  selectedCustomerIds: string[],
): CampaignAudience {
  if (audienceType === 'CUSTOMER_IDS') {
    return { type: 'CUSTOMER_IDS', customerIds: [...selectedCustomerIds] }
  }
  if (audienceType === 'SEGMENTED') return { type: 'SEGMENTED' }
  return { type: 'ALL_ELIGIBLE' }
}

export function buildCampaignAudiencePreview(
  audienceType: CampaignAudienceType,
  selectedCustomerIds: string[],
): CampaignAudiencePreviewPayload {
  return { audience: buildCampaignAudience(audienceType, selectedCustomerIds) }
}

export function buildCampaignAudienceUpdate(
  audienceType: CampaignAudienceType,
  filters: CampaignSegmentForm,
): CampaignAudienceUpdatePayload {
  if (audienceType === 'SEGMENTED') {
    return {
      audienceType: 'SEGMENTED',
      ...normalizeCampaignSegmentation(filters),
    }
  }

  return { audienceType: 'ALL_ELIGIBLE' }
}

export function shouldPersistAllEligible(campaign: PersistedCampaignAudience): boolean {
  return campaign.campaignAudienceType !== 'ALL_ELIGIBLE'
}

export function isCampaignAudiencePersisted(
  campaign: PersistedCampaignAudience,
  audienceType: CampaignAudienceType,
  filters: CampaignSegmentForm,
): boolean {
  if (audienceType !== 'SEGMENTED') {
    return campaign.campaignAudienceType === 'ALL_ELIGIBLE'
  }
  if (campaign.campaignAudienceType !== 'SEGMENTED') return false

  const expected = normalizeCampaignSegmentation(filters)
  const persisted = normalizeCampaignSegmentation(hydrateCampaignAudience(campaign).segmentFilters)
  return JSON.stringify(persisted) === JSON.stringify(expected)
}

export function campaignAudienceFingerprint(
  audienceType: CampaignAudienceType,
  selectedCustomerIds: string[],
  filters: CampaignSegmentForm,
): string {
  return JSON.stringify({
    audienceType,
    customerIds: audienceType === 'CUSTOMER_IDS' ? [...selectedCustomerIds].sort() : [],
    segmentFilters: audienceType === 'SEGMENTED' ? normalizeCampaignSegmentation(filters) : null,
  })
}

export function isCampaignPreviewCurrent(
  preview: CampaignAudiencePreviewState | null,
  currentFingerprint: string,
): boolean {
  return preview?.fingerprint === currentFingerprint
}

export function campaignAudienceSummary(
  audienceType: CampaignAudienceType,
  selectedCustomerIds: string[],
  filters: CampaignSegmentForm,
): string {
  if (audienceType === 'ALL_ELIGIBLE') return 'Todos os clientes elegíveis'

  if (audienceType === 'CUSTOMER_IDS') {
    const count = selectedCustomerIds.length
    return `${count} ${count === 1 ? 'cliente selecionado' : 'clientes selecionados'}`
  }

  const segmentation = normalizeCampaignSegmentation(filters)
  const parts: string[] = []
  const genderLabels = {
    FEMALE: 'Feminino',
    MALE: 'Masculino',
    OTHER: 'Outro',
    UNSPECIFIED: 'Não informado',
  } as const

  if (segmentation.segmentGender) parts.push(genderLabels[segmentation.segmentGender])
  if (segmentation.segmentCity) parts.push(segmentation.segmentCity)
  if (segmentation.segmentState) parts.push(segmentation.segmentState)

  if (segmentation.segmentMinAge !== null && segmentation.segmentMaxAge !== null) {
    parts.push(`${segmentation.segmentMinAge}–${segmentation.segmentMaxAge} anos`)
  } else if (segmentation.segmentMinAge !== null) {
    parts.push(`A partir de ${segmentation.segmentMinAge} anos`)
  } else if (segmentation.segmentMaxAge !== null) {
    parts.push(`Até ${segmentation.segmentMaxAge} anos`)
  }

  if (segmentation.segmentLastPurchaseAfter) {
    parts.push(`Última compra após ${segmentation.segmentLastPurchaseAfter}`)
  }
  if (segmentation.segmentLastPurchaseBefore) {
    parts.push(`Última compra antes de ${segmentation.segmentLastPurchaseBefore}`)
  }

  return parts.length > 0 ? `Público segmentado · ${parts.join(' · ')}` : 'Público segmentado'
}

export function campaignPreviewError(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = error.response
    if (typeof response === 'object' && response !== null && 'status' in response) {
      if (response.status === 400) return 'Revise a configuração do público e tente novamente.'
      if (response.status === 404) return 'Campanha não encontrada ou indisponível.'
      if (response.status === 409) return 'O estado atual da campanha não permite esta operação.'
    }
  }
  return 'Não foi possível atualizar a prévia do público. Tente novamente.'
}

export interface CampaignHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  post<T>(url: string, payload: unknown): Promise<{ data: T }>
  patch<T>(url: string, payload: unknown): Promise<{ data: T }>
  delete<T>(url: string): Promise<{ data: T }>
}

export interface CampaignRepository<TAutomation, TDispatchPayload, TDispatchResponse> {
  list(): Promise<TAutomation[]>
  createCampaign(payload: { name: string }): Promise<TAutomation>
  updateCampaignAudience(id: string, payload: CampaignAudienceUpdatePayload): Promise<TAutomation>
  updateAutomation(id: string, payload: AutomationLifecycleUpdatePayload): Promise<TAutomation>
  deleteAutomation(id: string): Promise<DeleteAutomationResponse<TAutomation>>
  previewCampaignAudience(
    id: string,
    payload: CampaignAudiencePreviewPayload,
  ): Promise<CampaignAudiencePreviewResponse>
  dispatchCampaign(id: string, payload: TDispatchPayload): Promise<TDispatchResponse>
}

export function createCampaignRepository<TAutomation, TDispatchPayload, TDispatchResponse>(
  http: CampaignHttpClient,
): CampaignRepository<TAutomation, TDispatchPayload, TDispatchResponse> {
  return {
    async list() {
      const { data } = await http.get<TAutomation[]>(AUTOMATION_ENDPOINT)
      return data
    },
    async createCampaign(payload) {
      const { data } = await http.post<TAutomation>(`${AUTOMATION_ENDPOINT}/campaign`, payload)
      return data
    },
    async updateCampaignAudience(id, payload) {
      const { data } = await http.patch<TAutomation>(campaignUpdateEndpoint(id), payload)
      return data
    },
    async updateAutomation(id, payload) {
      const { data } = await http.patch<TAutomation>(campaignUpdateEndpoint(id), payload)
      return data
    },
    async deleteAutomation(id) {
      const { data } = await http.delete<DeleteAutomationResponse<TAutomation>>(
        campaignUpdateEndpoint(id),
      )
      return data
    },
    async previewCampaignAudience(id, payload) {
      const { data } = await http.post<CampaignAudiencePreviewResponse>(
        campaignAudiencePreviewEndpoint(id),
        payload,
      )
      return data
    },
    async dispatchCampaign(id, payload) {
      const { data } = await http.post<TDispatchResponse>(campaignDispatchEndpoint(id), payload)
      return data
    },
  }
}

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  AUTOMATION_ENDPOINT,
  buildCampaignAudience,
  buildCampaignAudiencePreview,
  buildCampaignAudienceUpdate,
  campaignAudienceFingerprint,
  campaignAudiencePreviewEndpoint,
  campaignAudienceSummary,
  campaignDispatchEndpoint,
  campaignUpdateEndpoint,
  createCampaignRepository,
  emptyCampaignSegmentForm,
  hydrateCampaignAudience,
  isCampaignAudiencePersisted,
  isCampaignPreviewCurrent,
  shouldPersistAllEligible,
  validateCampaignSegmentation,
} from '../src/features/campaigns/campaign.logic.ts'
import type { CampaignHttpClient } from '../src/features/campaigns/campaign.logic.ts'
import type {
  CampaignAudiencePreviewResponse,
  CampaignAudiencePreviewState,
  CampaignSegmentForm,
  PersistedCampaignAudience,
} from '../src/features/campaigns/campaign.types.ts'

function filters(overrides: Partial<CampaignSegmentForm> = {}): CampaignSegmentForm {
  return { ...emptyCampaignSegmentForm(), ...overrides }
}

function campaign(overrides: Partial<PersistedCampaignAudience> = {}): PersistedCampaignAudience {
  return {
    campaignAudienceType: 'ALL_ELIGIBLE',
    segmentGender: null,
    segmentCity: null,
    segmentState: null,
    segmentMinAge: null,
    segmentMaxAge: null,
    segmentLastPurchaseBefore: null,
    segmentLastPurchaseAfter: null,
    ...overrides,
  }
}

test('monta audience ALL_ELIGIBLE sem campos extras', () => {
  assert.deepEqual(buildCampaignAudience('ALL_ELIGIBLE', ['ignored']), { type: 'ALL_ELIGIBLE' })
})

test('monta audience CUSTOMER_IDS com os IDs selecionados', () => {
  assert.deepEqual(buildCampaignAudience('CUSTOMER_IDS', ['customer-1', 'customer-2']), {
    type: 'CUSTOMER_IDS',
    customerIds: ['customer-1', 'customer-2'],
  })
})

test('monta audience SEGMENTED sem enviar filtros no dispatch', () => {
  assert.deepEqual(buildCampaignAudience('SEGMENTED', []), { type: 'SEGMENTED' })
})

test('SEGMENTED exige pelo menos um filtro', () => {
  assert.equal(
    validateCampaignSegmentation(filters()),
    'Informe pelo menos um filtro para segmentar os clientes.',
  )
})

test('aceita segmentação com somente um filtro', () => {
  assert.equal(validateCampaignSegmentation(filters({ segmentState: 'PR' })), '')
})

test('valida idades inteiras entre 0 e 120', () => {
  assert.match(validateCampaignSegmentation(filters({ segmentMinAge: '20.5' })), /inteiros/)
  assert.match(validateCampaignSegmentation(filters({ segmentMaxAge: '121' })), /entre 0 e 120/)
})

test('impede idade mínima maior que idade máxima', () => {
  assert.equal(
    validateCampaignSegmentation(filters({ segmentMinAge: '51', segmentMaxAge: '50' })),
    'A idade mínima não pode ser maior que a idade máxima.',
  )
})

test('impede última compra após posterior à data antes', () => {
  assert.equal(
    validateCampaignSegmentation(filters({
      segmentLastPurchaseAfter: '2026-08-02',
      segmentLastPurchaseBefore: '2026-08-01',
    })),
    'A data inicial da última compra não pode ser posterior à data final.',
  )
})

test('cria PATCH SEGMENTED normalizado e envia vazios como null', () => {
  assert.deepEqual(buildCampaignAudienceUpdate('SEGMENTED', filters({
    segmentGender: 'FEMALE',
    segmentCity: ' Cascavel ',
    segmentState: 'pr',
    segmentMinAge: '25',
    segmentMaxAge: '50',
    segmentLastPurchaseAfter: '2026-01-01',
    segmentLastPurchaseBefore: '2026-08-01',
  })), {
    audienceType: 'SEGMENTED',
    segmentGender: 'FEMALE',
    segmentCity: 'Cascavel',
    segmentState: 'PR',
    segmentMinAge: 25,
    segmentMaxAge: 50,
    segmentLastPurchaseBefore: '2026-08-01',
    segmentLastPurchaseAfter: '2026-01-01',
  })

  const cleared = buildCampaignAudienceUpdate('SEGMENTED', filters({ segmentCity: 'Cascavel' }))
  assert.equal(cleared.audienceType, 'SEGMENTED')
  assert.equal(cleared.segmentGender, null)
  assert.equal(cleared.segmentMinAge, null)
})

test('troca SEGMENTED para ALL_ELIGIBLE com PATCH mínimo', () => {
  assert.deepEqual(buildCampaignAudienceUpdate('ALL_ELIGIBLE', filters()), {
    audienceType: 'ALL_ELIGIBLE',
  })
  assert.equal(shouldPersistAllEligible(campaign({ campaignAudienceType: 'SEGMENTED' })), true)
})

test('CUSTOMER_IDS nunca é persistido como campaignAudienceType', () => {
  assert.deepEqual(buildCampaignAudienceUpdate('CUSTOMER_IDS', filters()), {
    audienceType: 'ALL_ELIGIBLE',
  })
  assert.equal(shouldPersistAllEligible(campaign()), false)
  assert.equal(shouldPersistAllEligible(campaign({ campaignAudienceType: 'CUSTOMER_IDS' })), true)
})

test('monta preview ALL_ELIGIBLE com wrapper audience', () => {
  assert.deepEqual(buildCampaignAudiencePreview('ALL_ELIGIBLE', []), {
    audience: { type: 'ALL_ELIGIBLE' },
  })
})

test('monta preview CUSTOMER_IDS com wrapper e IDs', () => {
  assert.deepEqual(buildCampaignAudiencePreview('CUSTOMER_IDS', ['customer-1']), {
    audience: { type: 'CUSTOMER_IDS', customerIds: ['customer-1'] },
  })
})

test('monta preview SEGMENTED sem repetir filtros persistidos', () => {
  assert.deepEqual(buildCampaignAudiencePreview('SEGMENTED', []), {
    audience: { type: 'SEGMENTED' },
  })
})

test('preserva response real com matched, eligible e blocked', async () => {
  const response: CampaignAudiencePreviewResponse = {
    audienceType: 'SEGMENTED', matched: 18, eligible: 12, blocked: 6,
  }
  const http: CampaignHttpClient = {
    async get<T>() { return { data: [] as T } },
    async post<T>() { return { data: response as T } },
    async patch<T>() { return { data: campaign() as T } },
  }
  const repository = createCampaignRepository<PersistedCampaignAudience, unknown, unknown>(http)
  assert.deepEqual(
    await repository.previewCampaignAudience('campaign-1', buildCampaignAudiencePreview('SEGMENTED', [])),
    response,
  )
})

test('alteração de filtro invalida a prévia anterior', () => {
  const original = campaignAudienceFingerprint('SEGMENTED', [], filters({ segmentState: 'PR' }))
  const changed = campaignAudienceFingerprint('SEGMENTED', [], filters({ segmentState: 'SC' }))
  const preview: CampaignAudiencePreviewState = {
    fingerprint: original,
    response: { audienceType: 'SEGMENTED', matched: 5, eligible: 4, blocked: 1 },
  }
  assert.equal(isCampaignPreviewCurrent(preview, changed), false)
})

test('alteração de customerIds invalida a prévia anterior', () => {
  const original = campaignAudienceFingerprint('CUSTOMER_IDS', ['customer-1'], filters())
  const changed = campaignAudienceFingerprint('CUSTOMER_IDS', ['customer-1', 'customer-2'], filters())
  const preview: CampaignAudiencePreviewState = {
    fingerprint: original,
    response: { audienceType: 'CUSTOMER_IDS', matched: 1, eligible: 1, blocked: 0 },
  }
  assert.equal(isCampaignPreviewCurrent(preview, changed), false)
})

test('preview antigo não libera envio e preview atualizado libera', () => {
  const current = campaignAudienceFingerprint('ALL_ELIGIBLE', [], filters())
  const response = { audienceType: 'ALL_ELIGIBLE', matched: 2, eligible: 2, blocked: 0 } as const
  assert.equal(isCampaignPreviewCurrent({ fingerprint: 'old', response }, current), false)
  assert.equal(isCampaignPreviewCurrent({ fingerprint: current, response }, current), true)
})

test('ordem de customerIds não invalida uma seleção equivalente', () => {
  const first = campaignAudienceFingerprint('CUSTOMER_IDS', ['b', 'a'], filters())
  const second = campaignAudienceFingerprint('CUSTOMER_IDS', ['a', 'b'], filters())
  assert.equal(first, second)
})

test('filtros vazios não aparecem no resumo segmentado', () => {
  const summary = campaignAudienceSummary('SEGMENTED', [], filters({
    segmentGender: 'FEMALE', segmentState: 'PR', segmentMinAge: '25', segmentMaxAge: '50',
  }))
  assert.equal(summary, 'Público segmentado · Feminino · PR · 25–50 anos')
  assert.equal(summary.includes('null'), false)
})

test('campanha SEGMENTED existente hidrata tipo e filtros', () => {
  assert.deepEqual(hydrateCampaignAudience(campaign({
    campaignAudienceType: 'SEGMENTED',
    segmentGender: 'OTHER',
    segmentCity: 'Curitiba',
    segmentState: 'PR',
    segmentMinAge: 30,
    segmentLastPurchaseAfter: '2026-01-01T00:00:00.000Z',
  })), {
    audienceType: 'SEGMENTED',
    segmentFilters: {
      segmentGender: 'OTHER',
      segmentCity: 'Curitiba',
      segmentState: 'PR',
      segmentMinAge: '30',
      segmentMaxAge: '',
      segmentLastPurchaseBefore: '',
      segmentLastPurchaseAfter: '2026-01-01',
    },
  })
})

test('CUSTOMER_IDS persistido é tratado como ALL_ELIGIBLE na hidratação', () => {
  assert.equal(hydrateCampaignAudience(campaign({ campaignAudienceType: 'CUSTOMER_IDS' })).audienceType, 'ALL_ELIGIBLE')
})

test('confirma que configuração SEGMENTED persistida corresponde ao formulário', () => {
  const stored = campaign({
    campaignAudienceType: 'SEGMENTED',
    segmentState: 'PR',
    segmentMinAge: 25,
  })
  assert.equal(isCampaignAudiencePersisted(stored, 'SEGMENTED', filters({
    segmentState: 'PR', segmentMinAge: '25',
  })), true)
  assert.equal(isCampaignAudiencePersisted(stored, 'SEGMENTED', filters({
    segmentState: 'SC', segmentMinAge: '25',
  })), false)
})

test('payloads não calculam consentimento ou elegibilidade local', () => {
  const payload = buildCampaignAudiencePreview('CUSTOMER_IDS', ['customer-1'])
  assert.equal('isActiveForAutomation' in payload, false)
  assert.equal('contactConsentStatus' in payload, false)
  assert.equal('eligible' in payload, false)
})

test('payloads não enviam companyId', () => {
  assert.equal('companyId' in buildCampaignAudienceUpdate('SEGMENTED', filters({ segmentState: 'PR' })), false)
  assert.equal('companyId' in buildCampaignAudiencePreview('ALL_ELIGIBLE', []), false)
})

test('repositório usa os endpoints reais e preserva payloads', async () => {
  const calls: Array<{ method: string, url: string, payload?: unknown }> = []
  const previewResponse: CampaignAudiencePreviewResponse = {
    audienceType: 'ALL_ELIGIBLE', matched: 3, eligible: 2, blocked: 1,
  }
  const http: CampaignHttpClient = {
    async get<T>(url) {
      calls.push({ method: 'GET', url })
      return { data: [] as T }
    },
    async post<T>(url, payload) {
      calls.push({ method: 'POST', url, payload })
      return { data: previewResponse as T }
    },
    async patch<T>(url, payload) {
      calls.push({ method: 'PATCH', url, payload })
      return { data: campaign() as T }
    },
  }
  const repository = createCampaignRepository<PersistedCampaignAudience, { audience: unknown }, unknown>(http)
  const previewPayload = buildCampaignAudiencePreview('ALL_ELIGIBLE', [])
  const updatePayload = buildCampaignAudienceUpdate('ALL_ELIGIBLE', filters())

  await repository.list()
  await repository.updateCampaignAudience('campaign-1', updatePayload)
  await repository.previewCampaignAudience('campaign-1', previewPayload)
  await repository.dispatchCampaign('campaign-1', previewPayload)

  assert.deepEqual(calls, [
    { method: 'GET', url: AUTOMATION_ENDPOINT },
    { method: 'PATCH', url: campaignUpdateEndpoint('campaign-1'), payload: updatePayload },
    { method: 'POST', url: campaignAudiencePreviewEndpoint('campaign-1'), payload: previewPayload },
    { method: 'POST', url: campaignDispatchEndpoint('campaign-1'), payload: previewPayload },
  ])
})

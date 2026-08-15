import assert from 'node:assert/strict'
import test from 'node:test'
import {
  campaignAllowsPreparation,
  campaignLifecycleError,
  createCampaignLifecycleController,
  emptyCampaignLifecycleState,
  mergeAutomationUpdate,
  removeCampaignFromList,
} from '../src/features/campaigns/campaign-lifecycle.logic.ts'
import type {
  CampaignLifecycleItem,
  CampaignLifecycleRepository,
} from '../src/features/campaigns/campaign-lifecycle.logic.ts'
import {
  campaignUpdateEndpoint,
  createCampaignRepository,
} from '../src/features/campaigns/campaign.logic.ts'
import type { CampaignHttpClient } from '../src/features/campaigns/campaign.logic.ts'

interface Campaign extends CampaignLifecycleItem {
  message: string | null
  campaignAudienceType: 'ALL_ELIGIBLE' | 'SEGMENTED'
  segmentState: string | null
  createdAt: string
}

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'campaign-1',
    name: 'Promoção de Inverno',
    isActive: true,
    isSystem: false,
    message: 'Olá!',
    campaignAudienceType: 'SEGMENTED',
    segmentState: 'PR',
    createdAt: '2026-08-01T12:00:00.000Z',
    ...overrides,
  }
}

function repository(overrides: Partial<CampaignLifecycleRepository<Campaign>> = {}): CampaignLifecycleRepository<Campaign> {
  return {
    async updateAutomation(_id, payload) { return payload },
    async deleteAutomation() {
      return { message: 'Automação excluída com sucesso.', automation: campaign() }
    },
    ...overrides,
  }
}

test('campanha ativa envia PATCH com isActive false', async () => {
  let receivedPayload: unknown
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [campaign()]
  const controller = createCampaignLifecycleController(repository({
    async updateAutomation(_id, payload) {
      receivedPayload = payload
      return { isActive: payload.isActive }
    },
  }), state)

  controller.openAction(state.campaigns[0]!, 'DEACTIVATE')
  await controller.confirmAction()

  assert.deepEqual(receivedPayload, { isActive: false })
  assert.equal(state.campaigns[0]?.isActive, false)
})

test('campanha inativa envia PATCH com isActive true', async () => {
  let receivedPayload: unknown
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [campaign({ isActive: false })]
  const controller = createCampaignLifecycleController(repository({
    async updateAutomation(_id, payload) {
      receivedPayload = payload
      return { isActive: payload.isActive }
    },
  }), state)

  controller.openAction(state.campaigns[0]!, 'ACTIVATE')
  await controller.confirmAction()

  assert.deepEqual(receivedPayload, { isActive: true })
  assert.equal(state.campaigns[0]?.isActive, true)
})

test('payload de lifecycle nunca envia companyId', async () => {
  let receivedPayload: Record<string, unknown> = {}
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [campaign()]
  const controller = createCampaignLifecycleController(repository({
    async updateAutomation(_id, payload) {
      receivedPayload = payload
      return payload
    },
  }), state)

  controller.openAction(state.campaigns[0]!, 'DEACTIVATE')
  await controller.confirmAction()

  assert.equal('companyId' in receivedPayload, false)
  assert.deepEqual(Object.keys(receivedPayload), ['isActive'])
})

test('repositório usa endpoint PATCH /automation/:id', async () => {
  const calls: Array<{ method: string, url: string, payload?: unknown }> = []
  const http: CampaignHttpClient = {
    async get<T>() { return { data: [] as T } },
    async post<T>() { return { data: {} as T } },
    async patch<T>(url, payload) {
      calls.push({ method: 'PATCH', url, payload })
      return { data: campaign({ isActive: false }) as T }
    },
    async delete<T>() { return { data: {} as T } },
  }
  const service = createCampaignRepository<Campaign, unknown, unknown>(http)

  await service.updateAutomation('campaign-1', { isActive: false })

  assert.deepEqual(calls, [{
    method: 'PATCH',
    url: campaignUpdateEndpoint('campaign-1'),
    payload: { isActive: false },
  }])
})

test('repositório usa endpoint DELETE /automation/:id', async () => {
  const calls: Array<{ method: string, url: string }> = []
  const http: CampaignHttpClient = {
    async get<T>() { return { data: [] as T } },
    async post<T>() { return { data: {} as T } },
    async patch<T>() { return { data: campaign() as T } },
    async delete<T>(url) {
      calls.push({ method: 'DELETE', url })
      return {
        data: { message: 'Automação excluída com sucesso.', automation: campaign() } as T,
      }
    },
  }
  const service = createCampaignRepository<Campaign, unknown, unknown>(http)

  await service.deleteAutomation('campaign-1')

  assert.deepEqual(calls, [{ method: 'DELETE', url: campaignUpdateEndpoint('campaign-1') }])
})

test('sucesso do PATCH atualiza somente a campanha correspondente', async () => {
  const first = campaign()
  const second = campaign({ id: 'campaign-2', name: 'Outra campanha' })
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [first, second]
  const controller = createCampaignLifecycleController(repository(), state)

  controller.openAction(first, 'DEACTIVATE')
  await controller.confirmAction()

  assert.equal(state.campaigns[0]?.isActive, false)
  assert.equal(state.campaigns[1], second)
})

test('erro do PATCH preserva integralmente o estado anterior', async () => {
  const original = campaign()
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [original]
  const controller = createCampaignLifecycleController(repository({
    async updateAutomation() { throw new Error('network') },
  }), state)

  controller.openAction(original, 'DEACTIVATE')
  const result = await controller.confirmAction()

  assert.equal(result, false)
  assert.equal(state.campaigns[0], original)
  assert.equal(state.campaigns[0]?.isActive, true)
})

test('sucesso do DELETE remove somente a campanha correta', async () => {
  const first = campaign()
  const second = campaign({ id: 'campaign-2', name: 'Outra campanha' })
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [first, second]
  const controller = createCampaignLifecycleController(repository(), state)

  controller.openAction(first, 'DELETE')
  await controller.confirmAction()

  assert.deepEqual(state.campaigns, [second])
  assert.equal(state.successMessage, 'Campanha “Promoção de Inverno” excluída com sucesso.')
})

test('erro do DELETE preserva a lista', async () => {
  const original = campaign()
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [original]
  const controller = createCampaignLifecycleController(repository({
    async deleteAutomation() { throw new Error('network') },
  }), state)

  controller.openAction(original, 'DELETE')
  await controller.confirmAction()

  assert.deepEqual(state.campaigns, [original])
})

test('campanha inativa bloqueia preview', () => {
  assert.equal(campaignAllowsPreparation(campaign({ isActive: false })), false)
})

test('campanha inativa bloqueia dispatch', () => {
  assert.equal(campaignAllowsPreparation(campaign({ isActive: false })), false)
})

test('campanha ativa continua liberando preview e dispatch', () => {
  assert.equal(campaignAllowsPreparation(campaign()), true)
})

test('merge seguro preserva campos ausentes e aplica somente resposta parcial', () => {
  const original = campaign()
  const result = mergeAutomationUpdate([original], original.id, {
    isActive: false,
    message: undefined,
  })

  assert.equal(result[0]?.isActive, false)
  assert.equal(result[0]?.message, original.message)
  assert.equal(result[0]?.campaignAudienceType, 'SEGMENTED')
  assert.equal(result[0]?.segmentState, 'PR')
  assert.equal(result[0]?.createdAt, original.createdAt)
})

test('removeCampaignFromList não altera itens não correspondentes', () => {
  const first = campaign()
  const second = campaign({ id: 'campaign-2' })
  assert.deepEqual(removeCampaignFromList([first, second], first.id), [second])
})

test('previne duplo submit durante PATCH pendente', async () => {
  let resolveUpdate: ((update: Partial<Campaign>) => void) | undefined
  let calls = 0
  const pending = new Promise<Partial<Campaign>>((resolve) => { resolveUpdate = resolve })
  const state = emptyCampaignLifecycleState<Campaign>()
  state.campaigns = [campaign()]
  const controller = createCampaignLifecycleController(repository({
    async updateAutomation() {
      calls += 1
      return pending
    },
  }), state)

  controller.openAction(state.campaigns[0]!, 'DEACTIVATE')
  const firstSubmit = controller.confirmAction()
  const secondSubmit = controller.confirmAction()
  assert.equal(state.actionLoading, true)
  assert.equal(await secondSubmit, false)
  assert.equal(calls, 1)
  resolveUpdate?.({ isActive: false })
  assert.equal(await firstSubmit, true)
})

test('impede exclusão de automação system antes da API', async () => {
  let deleteCalls = 0
  const systemCampaign = campaign({ isSystem: true })
  const controller = createCampaignLifecycleController(repository({
    async deleteAutomation() {
      deleteCalls += 1
      return { message: '', automation: systemCampaign }
    },
  }))

  assert.equal(controller.openAction(systemCampaign, 'DELETE'), false)
  assert.equal(await controller.confirmAction(), false)
  assert.equal(deleteCalls, 0)
})

test('mapeia erro 400 sem expor detalhes internos', () => {
  assert.equal(campaignLifecycleError({ response: { status: 400, data: { message: 'internal' } } }), 'Não foi possível validar esta operação.')
})

test('mapeia erro 403', () => {
  assert.equal(campaignLifecycleError({ response: { status: 403 } }), 'Esta campanha não pode ser alterada.')
})

test('mapeia erro 404', () => {
  assert.equal(campaignLifecycleError({ response: { status: 404 } }), 'Campanha não encontrada ou não está mais disponível.')
})

test('mapeia erro 409', () => {
  assert.equal(campaignLifecycleError({ response: { status: 409 } }), 'Não foi possível alterar esta campanha no estado atual.')
})

test('mapeia erro genérico com mensagem amigável', () => {
  assert.equal(campaignLifecycleError(new Error('network')), 'Não foi possível concluir a operação. Tente novamente.')
})

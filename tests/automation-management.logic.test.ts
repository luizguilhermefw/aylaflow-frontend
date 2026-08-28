import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  automationChannelOptions,
  automationConfiguredChannelLabel,
  automationEditCapabilities,
  automationFormFromAutomation,
  automationFormError,
  automationManagementError,
  automationTypeLabel,
  buildCreateAutomationPayload,
  buildUpdateAutomationPayload,
  canDeleteAutomation,
  canEditAutomation,
  createAutomationManagementController,
  emptyAutomationForm,
  emptyAutomationManagementState,
  eligibleWhatsappChannels,
  filterManagedAutomations,
  initialWhatsappChannelIdForCreate,
  positiveInteger,
  validateAutomationForm,
} from '../src/features/automations/automation-management.logic.ts'
import type {
  AutomationFormValues,
  AutomationManagementRepository,
} from '../src/features/automations/automation-management.logic.ts'
import {
  createRecurringAutomationRepository,
  RECURRING_AUTOMATION_ENDPOINT,
  recurringAutomationEndpoint,
} from '../src/features/automations/automation.repository.ts'
import type { AutomationHttpClient } from '../src/features/automations/automation.repository.ts'
import type { Automation, AutomationType } from '../src/services/automation.service.ts'
import type { WhatsappChannel } from '../src/services/whatsapp-channel.service.ts'

function automation(
  type: AutomationType = 'REACTIVATION',
  overrides: Partial<Automation> = {},
): Automation {
  return {
    id: `automation-${type.toLowerCase()}`,
    name: `Automação ${type}`,
    type,
    message: 'Olá! Sentimos sua falta.',
    daysAfter: 30,
    cooldownHours: 24,
    isActive: true,
    isSystem: true,
    systemKey: null,
    messagingChannelId: 'channel-1',
    createdAt: '2026-08-01T12:00:00.000Z',
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

function validForm(overrides: Partial<AutomationFormValues> = {}): AutomationFormValues {
  return {
    name: 'Retorno de clientes',
    type: 'REACTIVATION',
    daysAfter: '30',
    message: 'Olá! Estamos com saudades.',
    cooldownHours: '24',
    messagingChannelId: 'channel-1',
    ...overrides,
  }
}

function whatsappChannel(
  overrides: Partial<WhatsappChannel> = {},
): WhatsappChannel {
  return {
    id: 'channel-1',
    connectionStatus: 'CONNECTED',
    connectedPhone: '5545991335359',
    isActive: true,
    ...overrides,
  }
}

function repository(
  overrides: Partial<AutomationManagementRepository> = {},
): AutomationManagementRepository {
  return {
    async list() { return [] },
    async createAutomation(payload) {
      return automation(payload.type, {
        id: 'automation-created',
        name: payload.name,
        message: payload.message,
        daysAfter: payload.daysAfter,
        cooldownHours: payload.cooldownHours ?? 24,
        messagingChannelId: payload.messagingChannelId,
        isSystem: false,
      })
    },
    async updateAutomation(id, payload) {
      return automation('REACTIVATION', { id, ...payload })
    },
    async deleteAutomation() { return { message: 'deleted' } },
    ...overrides,
  }
}

test('router registra /automations autenticada e menu usa RouterLink real', () => {
  const routerSource = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
  const layoutSource = readFileSync(new URL('../src/layouts/AppLayout.vue', import.meta.url), 'utf8')

  assert.match(routerSource, /path: '\/automations'[\s\S]*name: 'automations'[\s\S]*requiresAuth: true/)
  assert.match(layoutSource, /<RouterLink[\s\S]*id="nav-automations"[\s\S]*to="\/automations"/)
  assert.doesNotMatch(layoutSource, /<button[^>]*id="nav-automations"/)
})

test('Automation aceita messagingChannelId string ou null', () => {
  assert.equal(automation('REACTIVATION', { messagingChannelId: 'channel-2' }).messagingChannelId,
    'channel-2')
  assert.equal(automation('BIRTHDAY', { messagingChannelId: null }).messagingChannelId, null)
})

test('Automations reutiliza whatsappChannelService para carregar a listagem base', () => {
  const viewSource = readFileSync(new URL('../src/views/Automations.vue', import.meta.url), 'utf8')
  const serviceSource = readFileSync(
    new URL('../src/services/whatsapp-channel.service.ts', import.meta.url),
    'utf8',
  )

  assert.match(viewSource, /whatsappChannelService\.listWhatsappChannels\(\)/)
  assert.match(viewSource, /from '@\/services\/whatsapp-channel\.service'/)
  assert.doesNotMatch(viewSource, /getWhatsappChannelConnection|syncChannelConnection/)
  assert.doesNotMatch(`${viewSource}\n${serviceSource}`, /axios\.create/)
})

test('somente routing ACTIVE entra nas novas opções elegíveis', () => {
  const active = whatsappChannel({ id: 'active', isActive: true })
  const inactive = whatsappChannel({ id: 'inactive', isActive: false })

  assert.deepEqual(eligibleWhatsappChannels([active, inactive]), [active])
  assert.deepEqual(
    automationChannelOptions([active, inactive], null).map((option) => option.id),
    ['active'],
  )
})

test('connectionStatus não substitui routing na elegibilidade', () => {
  const activeDisconnected = whatsappChannel({
    id: 'active-disconnected',
    isActive: true,
    connectionStatus: 'DISCONNECTED',
  })
  const inactiveConnected = whatsappChannel({
    id: 'inactive-connected',
    isActive: false,
    connectionStatus: 'CONNECTED',
  })

  assert.deepEqual(
    eligibleWhatsappChannels([activeDisconnected, inactiveConnected]).map((item) => item.id),
    ['active-disconnected'],
  )
})

test('zero canais ACTIVE não inventa seleção', () => {
  const channels = [
    whatsappChannel({ id: 'inactive', isActive: false }),
  ]

  assert.equal(initialWhatsappChannelIdForCreate(channels), '')
  assert.deepEqual(automationChannelOptions(channels, null), [])
})

test('um canal ACTIVE é pré-selecionado somente na criação', () => {
  assert.equal(
    initialWhatsappChannelIdForCreate([
      whatsappChannel({ id: 'only-active', connectionStatus: 'UNKNOWN' }),
      whatsappChannel({ id: 'inactive', isActive: false }),
    ]),
    'only-active',
  )
  const modalSource = readFileSync(
    new URL('../src/features/automations/AutomationFormModal.vue', import.meta.url),
    'utf8',
  )
  assert.match(modalSource, /mode !== 'create'/)
  assert.match(modalSource, /initialWhatsappChannelIdForCreate\(props\.channels\)/)
})

test('múltiplos canais ACTIVE não criam default implícito', () => {
  assert.equal(initialWhatsappChannelIdForCreate([
    whatsappChannel({ id: 'channel-1' }),
    whatsappChannel({ id: 'channel-2' }),
  ]), '')
})

test('criação com múltiplos canais exige escolha explícita', () => {
  const form = validForm({ messagingChannelId: '' })

  assert.equal(
    validateAutomationForm(form, 'create').messagingChannelId,
    'Selecione um canal WhatsApp habilitado para envios.',
  )
  assert.equal(buildCreateAutomationPayload(form), null)
})

test('payload CREATE envia somente ID do canal e campos legítimos', () => {
  const payload = buildCreateAutomationPayload(validForm({ messagingChannelId: 'channel-2' }))

  assert.deepEqual(payload, {
    name: 'Retorno de clientes',
    type: 'REACTIVATION',
    daysAfter: 30,
    message: 'Olá! Estamos com saudades.',
    cooldownHours: 24,
    messagingChannelId: 'channel-2',
  })
  assert.equal('companyId' in payload!, false)
  assert.equal('channel' in payload!, false)
  assert.equal(typeof payload?.messagingChannelId, 'string')
})

test('edição hidrata exatamente o messagingChannelId persistido', () => {
  const existing = automation('REACTIVATION', { messagingChannelId: 'persisted-channel' })

  assert.equal(
    automationFormFromAutomation(existing).messagingChannelId,
    'persisted-channel',
  )
  assert.equal(automationFormFromAutomation(
    automation('REACTIVATION', { messagingChannelId: null }),
  ).messagingChannelId, '')
})

test('PATCH envia somente o messagingChannelId real quando o canal muda', () => {
  const existing = automation('REACTIVATION', {
    isSystem: false,
    messagingChannelId: 'channel-1',
  })
  const payload = buildUpdateAutomationPayload(
    existing,
    automationFormFromAutomation(existing),
  )
  assert.equal('messagingChannelId' in payload!, false)

  assert.deepEqual(buildUpdateAutomationPayload(existing, {
    ...automationFormFromAutomation(existing),
    messagingChannelId: 'channel-2',
  }), {
    name: existing.name,
    message: existing.message,
    daysAfter: existing.daysAfter,
    cooldownHours: existing.cooldownHours,
    messagingChannelId: 'channel-2',
  })
})

test('falha de PATCH preserva o canal anterior no card e no formulário', async () => {
  const existing = automation('REACTIVATION', {
    isSystem: false,
    messagingChannelId: 'channel-1',
  })
  const form = {
    ...automationFormFromAutomation(existing),
    messagingChannelId: 'channel-2',
  }
  const state = emptyAutomationManagementState()
  state.automations = [existing]
  const controller = createAutomationManagementController(repository({
    async updateAutomation() { throw new Error('internal detail') },
  }), state)

  assert.equal(await controller.updateAutomation(existing, form), false)
  assert.equal(state.automations[0]?.messagingChannelId, 'channel-1')
  assert.equal(form.messagingChannelId, 'channel-2')
  assert.equal(state.formError, 'Não foi possível concluir a operação. Tente novamente.')
})

test('canal atual INACTIVE permanece visível sem fallback silencioso', () => {
  const active = whatsappChannel({ id: 'active' })
  const currentInactive = whatsappChannel({
    id: 'current-inactive',
    isActive: false,
    connectedPhone: null,
  })
  const options = automationChannelOptions([active, currentInactive], currentInactive.id)

  assert.deepEqual(options.map((option) => option.id), ['active', 'current-inactive'])
  assert.equal(options[1]?.disabled, true)
  assert.match(options[1]?.label ?? '', /inativo para novos envios/)
})

test('canal persistido ausente aparece sem expor UUID', () => {
  const missingId = '11111111-1111-4111-8111-111111111111'
  const options = automationChannelOptions([whatsappChannel()], missingId)

  assert.deepEqual(options.at(-1), {
    id: missingId,
    label: 'Canal indisponível',
    disabled: true,
  })
  assert.equal(automationConfiguredChannelLabel(missingId, [whatsappChannel()]),
    'Canal indisponível')
  assert.doesNotMatch(options.at(-1)?.label ?? '', /11111111/)
})

test('card usa label amigável do canal configurado', () => {
  const channels = [
    whatsappChannel({ id: 'channel-1', connectedPhone: null }),
    whatsappChannel({ id: 'channel-2', connectedPhone: '5545991335359' }),
  ]
  const viewSource = readFileSync(new URL('../src/views/Automations.vue', import.meta.url), 'utf8')

  assert.equal(
    automationConfiguredChannelLabel('channel-2', channels),
    'WhatsApp 2 — (45) 99133-5359',
  )
  assert.equal(automationConfiguredChannelLabel(null, channels), 'Canal não definido')
  assert.match(viewSource, /<dt>Canal WhatsApp<\/dt>/)
  assert.match(viewSource, /configuredChannelLabel\(automation\)/)
})

test('connectedPhone é somente apresentação e não altera o canal', () => {
  const channel = whatsappChannel({ connectedPhone: '5545991335359' })
  const before = structuredClone(channel)

  assert.equal(
    automationConfiguredChannelLabel(channel.id, [channel]),
    'WhatsApp 1 — (45) 99133-5359',
  )
  assert.deepEqual(channel, before)
})

test('connectedPhone null mantém label limpo no seletor', () => {
  const channel = whatsappChannel({ connectedPhone: null })

  assert.equal(automationConfiguredChannelLabel(channel.id, [channel]), 'WhatsApp 1')
  assert.equal(automationChannelOptions([channel], null)[0]?.label, 'WhatsApp 1')
  assert.doesNotMatch(automationChannelOptions([channel], null)[0]?.label ?? '',
    /Número não identificado/)
})

test('UI de automações não renderiza IDs nem segredos técnicos', () => {
  const modalSource = readFileSync(
    new URL('../src/features/automations/AutomationFormModal.vue', import.meta.url),
    'utf8',
  )
  const viewSource = readFileSync(new URL('../src/views/Automations.vue', import.meta.url), 'utf8')
  const forbidden = /instanceName|provisioningKey|apiKey|webhookSecret|EVOLUTION_API_KEY/

  assert.doesNotMatch(`${modalSource}\n${viewSource}`, forbidden)
  assert.doesNotMatch(viewSource, /\{\{\s*automation\.messagingChannelId\s*\}\}/)
  assert.doesNotMatch(modalSource, /\{\{\s*option\.id\s*\}\}/)
})

test('não cria client HTTP ou repository paralelo para canais', () => {
  const viewSource = readFileSync(new URL('../src/views/Automations.vue', import.meta.url), 'utf8')
  const modalSource = readFileSync(
    new URL('../src/features/automations/AutomationFormModal.vue', import.meta.url),
    'utf8',
  )

  assert.doesNotMatch(`${viewSource}\n${modalSource}`, /axios\.create|baseURL/)
  assert.match(viewSource, /whatsappChannelService/)
})

test('troca de canal preserva bloqueio de double-submit', async () => {
  const existing = automation('REACTIVATION', {
    isSystem: false,
    messagingChannelId: 'channel-1',
  })
  let calls = 0
  let resolveUpdate: ((value: Automation) => void) | undefined
  const pending = new Promise<Automation>((resolve) => { resolveUpdate = resolve })
  const state = emptyAutomationManagementState()
  state.automations = [existing]
  const controller = createAutomationManagementController(repository({
    async updateAutomation() {
      calls += 1
      return pending
    },
  }), state)
  const form = {
    ...automationFormFromAutomation(existing),
    messagingChannelId: 'channel-2',
  }

  const first = controller.updateAutomation(existing, form)
  assert.equal(await controller.updateAutomation(existing, form), false)
  assert.equal(calls, 1)
  assert.equal(state.automations[0]?.messagingChannelId, 'channel-1')
  resolveUpdate?.(automation('REACTIVATION', {
    isSystem: false,
    messagingChannelId: 'channel-2',
  }))
  assert.equal(await first, true)
  assert.equal(state.automations[0]?.messagingChannelId, 'channel-2')
})

test('automações system editáveis aceitam canal sem liberar campos proibidos', () => {
  const birthday = automation('BIRTHDAY', {
    systemKey: 'BIRTHDAY_DEFAULT',
    messagingChannelId: 'channel-1',
  })
  const reactivation = automation('REACTIVATION', {
    systemKey: 'REACTIVATION_30_DAYS',
    messagingChannelId: 'channel-1',
  })

  assert.deepEqual(buildUpdateAutomationPayload(birthday, {
    ...automationFormFromAutomation(birthday),
    messagingChannelId: 'channel-2',
  }), {
    message: birthday.message,
    messagingChannelId: 'channel-2',
  })
  assert.deepEqual(buildUpdateAutomationPayload(reactivation, {
    ...automationFormFromAutomation(reactivation),
    messagingChannelId: 'channel-2',
  }), {
    message: reactivation.message,
    daysAfter: reactivation.daysAfter,
    messagingChannelId: 'channel-2',
  })
})

test('CAMPAIGN permanece fora da gestão recorrente com messagingChannelId', () => {
  const campaign = automation('CAMPAIGN', { messagingChannelId: 'channel-1' })

  assert.deepEqual(filterManagedAutomations([campaign]), [])
})

test('erro ao carregar canais não apaga automações nem expõe detalhe técnico', () => {
  const viewSource = readFileSync(new URL('../src/views/Automations.vue', import.meta.url), 'utf8')
  const catchBlock = viewSource.match(/async function loadWhatsappChannels[\s\S]*?catch \{([\s\S]*?)\n  \} finally/)?.[1] ?? ''

  assert.match(catchBlock, /channelsLoadError\.value = true/)
  assert.doesNotMatch(catchBlock, /state\.automations|error\.message|response\.data/)
  assert.match(viewSource, /Canal configurado — dados indisponíveis/)
  assert.match(
    readFileSync(new URL('../src/features/automations/AutomationFormModal.vue', import.meta.url), 'utf8'),
    /Não foi possível carregar os canais WhatsApp\. Tente novamente\./,
  )
  assert.match(viewSource, /@retry-channels="loadWhatsappChannels"/)
})

test('configuração de canais em automações não cria polling permanente', () => {
  const sources = [
    readFileSync(new URL('../src/views/Automations.vue', import.meta.url), 'utf8'),
    readFileSync(
      new URL('../src/features/automations/AutomationFormModal.vue', import.meta.url),
      'utf8',
    ),
    readFileSync(
      new URL('../src/features/automations/automation-management.logic.ts', import.meta.url),
      'utf8',
    ),
  ].join('\n')

  assert.doesNotMatch(sources, /setInterval|setTimeout/)
})

test('listagem usa GET /automation e ignora CAMPAIGN', async () => {
  const calls: Array<{ method: string, url: string }> = []
  const response = [automation('REACTIVATION'), automation('CAMPAIGN')]
  const http: AutomationHttpClient = {
    async get<T>(url) { calls.push({ method: 'GET', url }); return { data: response as T } },
    async post<T>() { return { data: {} as T } },
    async patch<T>() { return { data: {} as T } },
    async delete<T>() { return { data: {} as T } },
  }
  const service = createRecurringAutomationRepository<Automation, unknown>(http)
  const state = emptyAutomationManagementState()
  const controller = createAutomationManagementController(service, state)

  await controller.load()

  assert.deepEqual(calls, [{ method: 'GET', url: RECURRING_AUTOMATION_ENDPOINT }])
  assert.deepEqual(state.automations.map((item) => item.type), ['REACTIVATION'])
})

test('filtro mantém somente REACTIVATION, BIRTHDAY e MAINTENANCE', () => {
  const automations = [
    automation('REACTIVATION'),
    automation('BIRTHDAY'),
    automation('MAINTENANCE'),
    automation('CAMPAIGN'),
  ]

  assert.deepEqual(filterManagedAutomations(automations).map((item) => item.type), [
    'REACTIVATION',
    'BIRTHDAY',
    'MAINTENANCE',
  ])
  assert.equal(automationTypeLabel(automations[0]!), 'Reativação')
  assert.equal(automationTypeLabel(automations[1]!), 'Aniversário')
  assert.equal(automationTypeLabel(automations[2]!), 'Manutenção')
})

test('loading permanece ativo enquanto a listagem está pendente', async () => {
  let resolveList: ((items: Automation[]) => void) | undefined
  const pending = new Promise<Automation[]>((resolve) => { resolveList = resolve })
  const state = emptyAutomationManagementState()
  const controller = createAutomationManagementController(repository({ async list() { return pending } }), state)

  const request = controller.load()
  assert.equal(state.loading, true)
  resolveList?.([automation()])
  assert.equal(await request, true)
  assert.equal(state.loading, false)
})

test('estado vazio representa ausência de automações recorrentes', async () => {
  const state = emptyAutomationManagementState()
  const controller = createAutomationManagementController(repository({
    async list() { return [automation('CAMPAIGN')] },
  }), state)

  assert.equal(await controller.load(), true)
  assert.deepEqual(state.automations, [])
  assert.equal(state.loadError, false)
})

test('erro de listagem gera estado amigável sem mensagem técnica', async () => {
  const state = emptyAutomationManagementState()
  const controller = createAutomationManagementController(repository({
    async list() { throw new Error('SQL connection failed') },
  }), state)

  assert.equal(await controller.load(), false)
  assert.deepEqual(state.automations, [])
  assert.equal(state.loadError, true)
})

test('toggle envia somente isActive para PATCH existente', async () => {
  const original = automation('REACTIVATION')
  const updated = automation('REACTIVATION', { isActive: false })
  const calls: Array<{ method: string, url: string, payload: unknown }> = []
  const http: AutomationHttpClient = {
    async get<T>() { return { data: [] as T } },
    async post<T>() { return { data: {} as T } },
    async patch<T>(url, payload) {
      calls.push({ method: 'PATCH', url, payload })
      return { data: updated as T }
    },
    async delete<T>() { return { data: {} as T } },
  }
  const state = emptyAutomationManagementState()
  state.automations = [original]
  const controller = createAutomationManagementController(
    createRecurringAutomationRepository<Automation, unknown>(http),
    state,
  )

  controller.openToggleAction(original)
  assert.equal(await controller.confirmAction(), true)
  assert.deepEqual(calls, [{
    method: 'PATCH',
    url: recurringAutomationEndpoint(original.id),
    payload: { isActive: false },
  }])
  assert.equal('companyId' in (calls[0]?.payload as object), false)
  assert.equal(state.automations[0], updated)
})

test('toggle permite ativar e bloqueia duplo submit', async () => {
  const original = automation('BIRTHDAY', { isActive: false })
  let resolveUpdate: ((value: Automation) => void) | undefined
  let calls = 0
  const pending = new Promise<Automation>((resolve) => { resolveUpdate = resolve })
  const state = emptyAutomationManagementState()
  state.automations = [original]
  const controller = createAutomationManagementController(repository({
    async updateAutomation(_id, payload) {
      calls += 1
      assert.deepEqual(payload, { isActive: true })
      return pending
    },
  }), state)

  controller.openToggleAction(original)
  const firstSubmit = controller.confirmAction()
  const secondSubmit = controller.confirmAction()
  assert.equal(await secondSubmit, false)
  assert.equal(calls, 1)
  resolveUpdate?.(automation('BIRTHDAY', { isActive: true }))
  assert.equal(await firstSubmit, true)
})

test('erro no toggle preserva estado e usa mensagem segura', async () => {
  const original = automation('MAINTENANCE')
  const state = emptyAutomationManagementState()
  state.automations = [original]
  const controller = createAutomationManagementController(repository({
    async updateAutomation() { throw new Error('internal stack') },
  }), state)

  controller.openToggleAction(original)
  assert.equal(await controller.confirmAction(), false)
  assert.equal(state.automations[0], original)
  assert.equal(state.actionError, 'Não foi possível concluir a operação. Tente novamente.')
})

test('POST /automation usa payload real e nunca envia companyId', async () => {
  const payload = buildCreateAutomationPayload(validForm())!
  const calls: Array<{ url: string, payload: unknown }> = []
  const created = automation('REACTIVATION', { isSystem: false })
  const http: AutomationHttpClient = {
    async get<T>() { return { data: [] as T } },
    async post<T>(url, body) { calls.push({ url, payload: body }); return { data: created as T } },
    async patch<T>() { return { data: {} as T } },
    async delete<T>() { return { data: {} as T } },
  }

  await createRecurringAutomationRepository<Automation, unknown>(http).createAutomation(payload)

  assert.deepEqual(calls, [{ url: '/automation', payload }])
  assert.deepEqual(payload, {
    name: 'Retorno de clientes',
    type: 'REACTIVATION',
    daysAfter: 30,
    message: 'Olá! Estamos com saudades.',
    cooldownHours: 24,
    messagingChannelId: 'channel-1',
  })
  assert.equal('companyId' in payload, false)
})

test('CAMPAIGN não pode ser criado e tipos recorrentes são aceitos', () => {
  assert.equal(buildCreateAutomationPayload(validForm({ type: 'CAMPAIGN' as never })), null)
  for (const type of ['REACTIVATION', 'BIRTHDAY', 'MAINTENANCE'] as const) {
    assert.equal(buildCreateAutomationPayload(validForm({ type }))?.type, type)
  }
})

test('validação local cobre campos obrigatórios e inteiros positivos', () => {
  const errors = validateAutomationForm(emptyAutomationForm(), 'create')
  assert.deepEqual(errors, {
    name: 'Informe o nome da automação.',
    type: 'Selecione um tipo de automação válido.',
    daysAfter: 'Informe um número inteiro maior ou igual a 1.',
    message: 'Informe a mensagem da automação.',
    messagingChannelId: 'Selecione um canal WhatsApp habilitado para envios.',
  })
  assert.equal(validateAutomationForm(validForm({ cooldownHours: '1.5' }), 'create').cooldownHours,
    'Informe um número inteiro maior ou igual a 1.')
  assert.equal(validateAutomationForm(validForm({ cooldownHours: '' }), 'create').cooldownHours,
    'Informe um número inteiro maior ou igual a 1.')
})

test('validação de inteiro positivo aceita string e number sem lançar TypeError', () => {
  const cases: Array<{ value: unknown, expected: number | null }> = [
    { value: '180', expected: 180 },
    { value: 180, expected: 180 },
    { value: '', expected: null },
    { value: 0, expected: null },
    { value: -1, expected: null },
    { value: 1.5, expected: null },
    { value: Number.NaN, expected: null },
  ]

  for (const { value, expected } of cases) {
    assert.doesNotThrow(() => positiveInteger(value))
    assert.equal(positiveInteger(value), expected)
  }
})

test('submit aceita valores numéricos e mantém payload numérico', () => {
  const form = validForm({ daysAfter: 180, cooldownHours: 24 })

  assert.doesNotThrow(() => validateAutomationForm(form, 'create'))
  assert.deepEqual(validateAutomationForm(form, 'create'), {})
  assert.deepEqual(buildCreateAutomationPayload(form), {
    name: 'Retorno de clientes',
    type: 'REACTIVATION',
    daysAfter: 180,
    message: 'Olá! Estamos com saudades.',
    cooldownHours: 24,
    messagingChannelId: 'channel-1',
  })
})

test('automação customizada permite edição completa', () => {
  const custom = automation('MAINTENANCE', { isSystem: false })
  assert.deepEqual(automationEditCapabilities(custom), {
    name: true,
    message: true,
    daysAfter: true,
    cooldownHours: true,
    messagingChannelId: true,
  })
  assert.deepEqual(buildUpdateAutomationPayload(custom, validForm({ type: 'MAINTENANCE' })), {
    name: 'Retorno de clientes',
    message: 'Olá! Estamos com saudades.',
    daysAfter: 30,
    cooldownHours: 24,
  })
})

test('BIRTHDAY_DEFAULT system edita somente message', () => {
  const birthday = automation('BIRTHDAY', { systemKey: 'BIRTHDAY_DEFAULT' })
  const form = validForm({ name: 'Outro nome', type: 'BIRTHDAY', daysAfter: '2', cooldownHours: '48' })
  assert.deepEqual(automationEditCapabilities(birthday), {
    name: false,
    message: true,
    daysAfter: false,
    cooldownHours: false,
    messagingChannelId: true,
  })
  assert.deepEqual(buildUpdateAutomationPayload(birthday, form), {
    message: 'Olá! Estamos com saudades.',
  })
})

test('REACTIVATION_30_DAYS system edita somente message e daysAfter', () => {
  const reactivation = automation('REACTIVATION', { systemKey: 'REACTIVATION_30_DAYS' })
  const form = validForm({ name: 'Outro nome', cooldownHours: '48' })
  assert.deepEqual(buildUpdateAutomationPayload(reactivation, form), {
    message: 'Olá! Estamos com saudades.',
    daysAfter: 30,
  })
})

test('BIRTHDAY system com outra systemKey não é editável', () => {
  const birthday = automation('BIRTHDAY', { systemKey: 'BIRTHDAY_SPECIAL' })
  assert.deepEqual(automationEditCapabilities(birthday), {
    name: false,
    message: false,
    daysAfter: false,
    cooldownHours: false,
    messagingChannelId: false,
  })
  assert.equal(canEditAutomation(birthday), false)
})

test('REACTIVATION system com outra systemKey não é editável', () => {
  const reactivation = automation('REACTIVATION', { systemKey: 'REACTIVATION_60_DAYS' })
  assert.deepEqual(automationEditCapabilities(reactivation), {
    name: false,
    message: false,
    daysAfter: false,
    cooldownHours: false,
    messagingChannelId: false,
  })
  assert.equal(canEditAutomation(reactivation), false)
})

test('MAINTENANCE system não oferece edição de configuração', () => {
  const maintenance = automation('MAINTENANCE')
  assert.deepEqual(automationEditCapabilities(maintenance), {
    name: false,
    message: false,
    daysAfter: false,
    cooldownHours: false,
    messagingChannelId: false,
  })
  assert.equal(canEditAutomation(maintenance), false)
  assert.equal(buildUpdateAutomationPayload(maintenance, validForm()), null)
})

test('somente custom permite exclusão e DELETE usa endpoint real', async () => {
  const custom = automation('REACTIVATION', { id: 'custom-1', isSystem: false })
  const system = automation('REACTIVATION', { id: 'system-1', isSystem: true })
  const calls: string[] = []
  const http: AutomationHttpClient = {
    async get<T>() { return { data: [] as T } },
    async post<T>() { return { data: {} as T } },
    async patch<T>() { return { data: {} as T } },
    async delete<T>(url) { calls.push(url); return { data: { message: 'ok' } as T } },
  }

  assert.equal(canDeleteAutomation(custom), true)
  assert.equal(canDeleteAutomation(system), false)
  await createRecurringAutomationRepository<Automation, unknown>(http).deleteAutomation(custom.id)
  assert.deepEqual(calls, ['/automation/custom-1'])
})

test('controller nunca abre exclusão de automação system', async () => {
  let deleteCalls = 0
  const controller = createAutomationManagementController(repository({
    async deleteAutomation() { deleteCalls += 1 },
  }))
  const system = automation('BIRTHDAY')

  assert.equal(controller.openDeleteAction(system), false)
  assert.equal(await controller.confirmDelete(), false)
  assert.equal(deleteCalls, 0)
})

test('erro 409 preserva lista e formulário permanece disponível para correção', async () => {
  const original = automation('REACTIVATION', { isSystem: false })
  const form = automationFormFromAutomation(original)
  const state = emptyAutomationManagementState()
  state.automations = [original]
  const controller = createAutomationManagementController(repository({
    async updateAutomation() { throw { response: { status: 409, data: { message: 'limit' } } } },
  }), state)

  assert.equal(await controller.updateAutomation(original, form), false)
  assert.equal(state.automations[0], original)
  assert.deepEqual(form, automationFormFromAutomation(original))
  assert.equal(state.formError,
    'Já existe uma automação com esses dados ou o limite de automações foi atingido.')
  assert.equal(automationFormError({ response: { status: 409 } }), state.formError)
  assert.equal(
    automationManagementError({ response: { status: 409 } }),
    'Não foi possível alterar esta automação no estado atual.',
  )
})

test('criação, edição e exclusão atualizam a lista sem duplicar itens', async () => {
  const original = automation('REACTIVATION', { id: 'custom-1', isSystem: false })
  const created = automation('BIRTHDAY', { id: 'custom-2', isSystem: false, name: 'Aniversário custom' })
  const updated = automation('REACTIVATION', { id: 'custom-1', isSystem: false, name: 'Atualizada' })
  const state = emptyAutomationManagementState()
  state.automations = [original]
  const controller = createAutomationManagementController(repository({
    async createAutomation() { return created },
    async updateAutomation() { return updated },
  }), state)

  assert.equal(await controller.createAutomation(buildCreateAutomationPayload(validForm())!), true)
  assert.equal(await controller.createAutomation(buildCreateAutomationPayload(validForm())!), true)
  assert.equal(state.automations.filter((item) => item.id === created.id).length, 1)
  assert.equal(await controller.updateAutomation(original, automationFormFromAutomation(original)), true)
  assert.equal(state.automations.filter((item) => item.id === original.id).length, 1)
  assert.equal(controller.openDeleteAction(created), true)
  assert.equal(await controller.confirmDelete(), true)
  assert.deepEqual(state.automations.map((item) => item.id), [original.id])
})

test('duplo submit de criação é bloqueado', async () => {
  let resolveCreate: ((value: Automation) => void) | undefined
  let calls = 0
  const pending = new Promise<Automation>((resolve) => { resolveCreate = resolve })
  const controller = createAutomationManagementController(repository({
    async createAutomation() { calls += 1; return pending },
  }))
  const payload = buildCreateAutomationPayload(validForm())!

  const first = controller.createAutomation(payload)
  const second = controller.createAutomation(payload)
  assert.equal(await second, false)
  assert.equal(calls, 1)
  resolveCreate?.(automation('REACTIVATION', { isSystem: false }))
  assert.equal(await first, true)
})

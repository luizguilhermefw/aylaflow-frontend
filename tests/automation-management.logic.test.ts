import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
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
  filterManagedAutomations,
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
  })
})

test('automação customizada permite edição completa', () => {
  const custom = automation('MAINTENANCE', { isSystem: false })
  assert.deepEqual(automationEditCapabilities(custom), {
    name: true,
    message: true,
    daysAfter: true,
    cooldownHours: true,
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

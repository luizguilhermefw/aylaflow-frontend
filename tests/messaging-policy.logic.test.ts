import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  canManageMessagingPolicy,
  createMessagingPolicyController,
  emptyMessagingPolicyState,
} from '../src/features/messaging-policy/messaging-policy.logic.ts'
import type { MessagingPolicyRepository } from '../src/features/messaging-policy/messaging-policy.logic.ts'
import {
  createMessagingPolicyRepository,
  MESSAGING_POLICY_ENDPOINT,
  OPT_OUT_INSTRUCTIONS_ENDPOINT,
} from '../src/features/messaging-policy/messaging-policy.repository.ts'
import type {
  MessagingPolicy,
  MessagingPolicyHttpClient,
  UpdateOptOutInstructionsPayload,
} from '../src/features/messaging-policy/messaging-policy.repository.ts'

function policy(includeOptOutInstructions = true): MessagingPolicy {
  return {
    includeOptOutInstructions,
    optOutInstructionsDeclaration: {
      required: true,
      version: '2026-08',
      text: 'Declaração de responsabilidade retornada pelo backend.',
    },
  }
}

function repository(
  overrides: Partial<MessagingPolicyRepository> = {},
): MessagingPolicyRepository {
  return {
    async getMessagingPolicy() { return policy() },
    async updateOptOutInstructions() {},
    ...overrides,
  }
}

test('rota autenticada e menu expõem Configurações no AppLayout existente', () => {
  const routerSource = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
  const layoutSource = readFileSync(new URL('../src/layouts/AppLayout.vue', import.meta.url), 'utf8')

  assert.match(routerSource, /path: '\/settings'[\s\S]*name: 'settings'[\s\S]*requiresAuth: true/)
  assert.match(layoutSource, /id="nav-settings"[\s\S]*to="\/settings"/)
})

test('repositório usa somente os endpoints reais de messaging policy', async () => {
  const calls: Array<{ method: string, url: string, payload?: unknown }> = []
  const http: MessagingPolicyHttpClient = {
    async get<T>(url) {
      calls.push({ method: 'GET', url })
      return { data: policy() as T }
    },
    async patch<T>(url, payload) {
      calls.push({ method: 'PATCH', url, payload })
      return { data: {} as T }
    },
  }
  const api = createMessagingPolicyRepository(http)

  await api.getMessagingPolicy()
  await api.updateOptOutInstructions({ includeOptOutInstructions: true })

  assert.deepEqual(calls, [
    { method: 'GET', url: MESSAGING_POLICY_ENDPOINT },
    {
      method: 'PATCH',
      url: OPT_OUT_INSTRUCTIONS_ENDPOINT,
      payload: { includeOptOutInstructions: true },
    },
  ])
})

test('carrega includeOptOutInstructions=true e preserva a declaração', async () => {
  const expected = policy(true)
  const state = emptyMessagingPolicyState()
  const controller = createMessagingPolicyController(repository({
    async getMessagingPolicy() { return expected },
  }), state)

  assert.equal(await controller.load(), true)
  assert.equal(state.policy?.includeOptOutInstructions, true)
  assert.equal(state.policy?.optOutInstructionsDeclaration?.text, expected.optOutInstructionsDeclaration?.text)
})

test('carrega includeOptOutInstructions=false', async () => {
  const state = emptyMessagingPolicyState()
  const controller = createMessagingPolicyController(repository({
    async getMessagingPolicy() { return policy(false) },
  }), state)

  assert.equal(await controller.load(), true)
  assert.equal(state.policy?.includeOptOutInstructions, false)
})

test('erro no carregamento não mantém política parcial', async () => {
  const state = emptyMessagingPolicyState()
  state.policy = policy(true)
  const controller = createMessagingPolicyController(repository({
    async getMessagingPolicy() { throw new Error('network') },
  }), state)

  assert.equal(await controller.load(), false)
  assert.equal(state.loading, false)
  assert.equal(state.loadError, true)
  assert.equal(state.policy, null)
})

test('desligar abre modal e não chama API imediatamente', async () => {
  let calls = 0
  const state = emptyMessagingPolicyState()
  state.policy = policy(true)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions() { calls += 1 },
  }), state)

  assert.equal(await controller.requestChange(false, 'OWNER'), true)
  assert.equal(state.disableModalOpen, true)
  assert.equal(state.policy.includeOptOutInstructions, true)
  assert.equal(calls, 0)
})

test('confirmação exige checkbox marcado', async () => {
  let calls = 0
  const state = emptyMessagingPolicyState()
  state.policy = policy(true)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions() { calls += 1 },
  }), state)

  await controller.requestChange(false, 'OWNER')
  assert.equal(controller.canConfirmDisable(), false)
  assert.equal(await controller.confirmDisable('OWNER'), false)
  controller.setResponsibilityAcknowledged(true)
  assert.equal(controller.canConfirmDisable(), true)
  assert.equal(calls, 0)
})

test('declaração ausente impede confirmação de responsabilidade', async () => {
  const state = emptyMessagingPolicyState()
  state.policy = {
    includeOptOutInstructions: true,
    optOutInstructionsDeclaration: null,
  }
  const controller = createMessagingPolicyController(repository(), state)

  await controller.requestChange(false, 'OWNER')
  controller.setResponsibilityAcknowledged(true)

  assert.equal(controller.canConfirmDisable(), false)
  assert.equal(await controller.confirmDisable('OWNER'), false)
})

test('confirmar desativação envia false e responsibilityAcknowledged=true', async () => {
  const payloads: UpdateOptOutInstructionsPayload[] = []
  const state = emptyMessagingPolicyState()
  state.policy = policy(true)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions(payload) { payloads.push(payload) },
  }), state)

  await controller.requestChange(false, 'MANAGER')
  controller.setResponsibilityAcknowledged(true)
  assert.equal(await controller.confirmDisable('MANAGER'), true)

  assert.deepEqual(payloads, [{
    includeOptOutInstructions: false,
    responsibilityAcknowledged: true,
  }])
  assert.equal(state.policy.includeOptOutInstructions, false)
  assert.equal(state.disableModalOpen, false)
})

test('cancelar mantém configuração anterior e não chama API', async () => {
  let calls = 0
  const state = emptyMessagingPolicyState()
  state.policy = policy(true)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions() { calls += 1 },
  }), state)

  await controller.requestChange(false, 'OWNER')
  controller.setResponsibilityAcknowledged(true)
  assert.equal(controller.cancelDisable(), true)

  assert.equal(state.policy.includeOptOutInstructions, true)
  assert.equal(state.disableModalOpen, false)
  assert.equal(state.responsibilityAcknowledged, false)
  assert.equal(calls, 0)
})

test('reativar envia true sem acknowledgement', async () => {
  const payloads: UpdateOptOutInstructionsPayload[] = []
  const state = emptyMessagingPolicyState()
  state.policy = policy(false)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions(payload) { payloads.push(payload) },
  }), state)

  assert.equal(await controller.requestChange(true, 'OWNER'), true)
  assert.deepEqual(payloads, [{ includeOptOutInstructions: true }])
  assert.equal('responsibilityAcknowledged' in payloads[0]!, false)
  assert.equal(state.policy.includeOptOutInstructions, true)
})

test('erro do PATCH mantém estado anterior e modal aberto', async () => {
  const state = emptyMessagingPolicyState()
  state.policy = policy(true)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions() { throw new Error('technical backend detail') },
  }), state)

  await controller.requestChange(false, 'OWNER')
  controller.setResponsibilityAcknowledged(true)
  assert.equal(await controller.confirmDisable('OWNER'), false)

  assert.equal(state.policy.includeOptOutInstructions, true)
  assert.equal(state.disableModalOpen, true)
  assert.equal(state.actionError, 'Não foi possível salvar esta configuração. Tente novamente.')
})

test('OPERATOR e VIEWER não conseguem alterar enquanto OWNER e MANAGER podem', async () => {
  for (const role of ['OPERATOR', 'VIEWER', 'SUPPORT', undefined]) {
    let calls = 0
    const state = emptyMessagingPolicyState()
    state.policy = policy(false)
    const controller = createMessagingPolicyController(repository({
      async updateOptOutInstructions() { calls += 1 },
    }), state)

    assert.equal(canManageMessagingPolicy(role), false)
    assert.equal(await controller.requestChange(true, role), false)
    assert.equal(calls, 0)
  }

  assert.equal(canManageMessagingPolicy('OWNER'), true)
  assert.equal(canManageMessagingPolicy('MANAGER'), true)
})

test('frontend nunca envia companyId, userId ou role', async () => {
  const payloads: UpdateOptOutInstructionsPayload[] = []
  const state = emptyMessagingPolicyState()
  state.policy = policy(true)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions(payload) { payloads.push(payload) },
  }), state)

  await controller.requestChange(false, 'OWNER')
  controller.setResponsibilityAcknowledged(true)
  await controller.confirmDisable('OWNER')

  assert.deepEqual(Object.keys(payloads[0]!).sort(), [
    'includeOptOutInstructions',
    'responsibilityAcknowledged',
  ])
})

test('request pendente bloqueia double-submit', async () => {
  let resolveUpdate: (() => void) | undefined
  let calls = 0
  const pending = new Promise<void>((resolve) => { resolveUpdate = resolve })
  const state = emptyMessagingPolicyState()
  state.policy = policy(false)
  const controller = createMessagingPolicyController(repository({
    async updateOptOutInstructions() { calls += 1; return pending },
  }), state)

  const first = controller.requestChange(true, 'OWNER')
  const second = controller.requestChange(true, 'OWNER')
  assert.equal(await second, false)
  assert.equal(calls, 1)
  resolveUpdate?.()
  assert.equal(await first, true)
})

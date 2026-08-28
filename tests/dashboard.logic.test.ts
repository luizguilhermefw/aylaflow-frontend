import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  createDashboardController,
  dashboardAutomationTypeLabel,
  emptyDashboardState,
  formatDashboardDate,
  formatDashboardNumber,
} from '../src/features/dashboard/dashboard.logic.ts'
import type {
  DashboardService,
  DashboardSummary,
} from '../src/services/dashboard.service.ts'

function summary(overrides: Partial<DashboardSummary> = {}): DashboardSummary {
  return {
    activeAutomations: 3,
    contacts: 1842,
    messagesSent: 925,
    campaigns: 4,
    recentAutomations: [],
    ...overrides,
  }
}

test('service reutiliza api.ts e usa GET /dashboard/summary sem companyId', () => {
  const source = readFileSync(
    new URL('../src/services/dashboard.service.ts', import.meta.url),
    'utf8',
  )

  assert.match(source, /import api from '\.\/api'/)
  assert.match(source, /DASHBOARD_SUMMARY_ENDPOINT = '\/dashboard\/summary'/)
  assert.match(source, /http\.get<DashboardSummary>\(DASHBOARD_SUMMARY_ENDPOINT\)/)
  assert.doesNotMatch(source, /companyId/)
  assert.doesNotMatch(source, /axios\.create|baseURL/)
})

test('controller preserva a resposta real como fonte das métricas', async () => {
  const response = summary()
  const service: DashboardService = { async getSummary() { return response } }
  const state = emptyDashboardState()
  const controller = createDashboardController(service, state)

  assert.equal(await controller.load(), true)
  assert.equal(state.summary, response)
  assert.deepEqual(state.summary, response)
  assert.equal(state.loadError, false)
})

test('loading não inventa métricas enquanto a resposta está pendente', async () => {
  let resolveSummary: ((value: DashboardSummary) => void) | undefined
  const pending = new Promise<DashboardSummary>((resolve) => { resolveSummary = resolve })
  const state = emptyDashboardState()
  const controller = createDashboardController({ async getSummary() { return pending } }, state)

  const load = controller.load()
  assert.equal(state.loading, true)
  assert.equal(state.summary, null)
  resolveSummary?.(summary())
  assert.equal(await load, true)
  assert.equal(state.loading, false)
})

test('erro é seguro e uma chamada posterior permite retry', async () => {
  let calls = 0
  const service: DashboardService = {
    async getSummary() {
      calls += 1
      if (calls === 1) throw new Error('internal response')
      return summary()
    },
  }
  const state = emptyDashboardState()
  const controller = createDashboardController(service, state)

  assert.equal(await controller.load(), false)
  assert.equal(state.loadError, true)
  assert.equal(state.summary, null)
  assert.equal(await controller.load(), true)
  assert.equal(state.loadError, false)
  assert.equal(calls, 2)
})

test('formata números e datas para apresentação pt-BR', () => {
  assert.equal(formatDashboardNumber(1842), '1.842')
  assert.equal(formatDashboardDate('2026-08-20T12:00:00.000Z'), '20/08/2026')
  assert.equal(formatDashboardDate('invalid'), 'Data indisponível')
})

test('traduz os três tipos reais de automação', () => {
  assert.equal(dashboardAutomationTypeLabel('REACTIVATION'), 'Reativação')
  assert.equal(dashboardAutomationTypeLabel('BIRTHDAY'), 'Aniversário')
  assert.equal(dashboardAutomationTypeLabel('MAINTENANCE'), 'Manutenção')
})

test('Dashboard renderiza os quatro indicadores reais e Campanhas no quarto card', () => {
  const source = readFileSync(new URL('../src/views/Dashboard.vue', import.meta.url), 'utf8')

  assert.match(source, /summary\?\.activeAutomations/)
  assert.match(source, /summary\?\.contacts/)
  assert.match(source, /summary\?\.messagesSent/)
  assert.match(source, /summary\?\.campaigns/)
  assert.match(source, /id="stat-campaigns"[\s\S]*<span class="stat-label">Campanhas<\/span>/)
  assert.doesNotMatch(source, /Taxa de reativação|\+43% conversão/)
})

test('Dashboard apresenta loading com traço e erro amigável com retry', () => {
  const source = readFileSync(new URL('../src/views/Dashboard.vue', import.meta.url), 'utf8')

  assert.match(source, /return loading\.value \|\| value === undefined \? '—'/)
  assert.match(source, /Não foi possível carregar os indicadores do Dashboard\./)
  assert.match(source, /@click="loadDashboard"[\s\S]*Tentar novamente/)
  assert.doesNotMatch(source, /error\.response|status HTTP|stack/)
})

test('Dashboard alterna empty state e lista de últimas automações', () => {
  const source = readFileSync(new URL('../src/views/Dashboard.vue', import.meta.url), 'utf8')

  assert.match(source, /summary\.recentAutomations\.length === 0/)
  assert.match(source, /Nenhuma automação criada ainda/)
  assert.match(source, /summary\.recentAutomations\.length > 0/)
  assert.match(source, /Últimas automações/)
  assert.match(source, /v-for="automation in summary\.recentAutomations"/)
  assert.match(source, /automation\.isActive \? 'Ativa' : 'Inativa'/)
  assert.doesNotMatch(source, /\{\{\s*automation\.id\s*\}\}/)
})

test('todos os CTAs do Dashboard navegam para /automations', () => {
  const source = readFileSync(new URL('../src/views/Dashboard.vue', import.meta.url), 'utf8')

  assert.match(source, /id="btn-new-automation"[^>]*to="\/automations"/)
  assert.match(source, /id="btn-start-automation"[^>]*to="\/automations"/)
  assert.match(source, /id="btn-create-first"[^>]*to="\/automations"/)
})

test('Dashboard não cria client paralelo, polling ou métricas derivadas', () => {
  const viewSource = readFileSync(new URL('../src/views/Dashboard.vue', import.meta.url), 'utf8')
  const serviceSource = readFileSync(
    new URL('../src/services/dashboard.service.ts', import.meta.url),
    'utf8',
  )
  const sources = `${viewSource}\n${serviceSource}`

  assert.doesNotMatch(sources, /axios\.create|baseURL|setInterval|setTimeout/)
  assert.doesNotMatch(viewSource, /filter\(|reduce\(|messagesSent\s*[+*/-]|campaigns\s*[+*/-]/)
})

test('CompanyActivationCard e company-access state permanecem no Dashboard', () => {
  const source = readFileSync(new URL('../src/views/Dashboard.vue', import.meta.url), 'utf8')

  assert.match(source, /<CompanyActivationCard v-if="isPending"/)
  assert.match(source, /companyAccessIssue/)
  assert.match(source, /isPendingCompany/)
})

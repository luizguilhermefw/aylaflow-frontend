import assert from 'node:assert/strict'
import test from 'node:test'
import {
  COMPANY_PENDING_GATE_COPY,
  COMPANY_PENDING_ONBOARDING_COPY,
  companyAccessIssueFromCode,
  companyAccessIssueFromResponse,
  getActivationContactUrl,
  isAuthenticatedProtectedRequest,
  isBlockingCompanyStatus,
  isCompanyAccessCode,
  isPendingCompany,
  shouldShowCompanyActivationGate,
  shouldLogoutAfterUnauthorized,
} from '../src/features/company-access/company-access.logic.ts'
import {
  announceCompanyAccessIssue,
  clearCompanyAccessIssue,
  clearPendingCompanyAccessIssue,
  companyAccessIssue,
} from '../src/features/company-access/company-access.state.ts'

test('reconhece somente os quatro códigos de status da empresa', () => {
  for (const code of [
    'COMPANY_PENDING',
    'COMPANY_SUSPENDED',
    'COMPANY_CANCELLED',
    'COMPANY_INVALID_STATUS',
  ]) {
    assert.equal(isCompanyAccessCode(code), true)
  }

  assert.equal(isCompanyAccessCode('FORBIDDEN'), false)
  assert.equal(isCompanyAccessCode(undefined), false)
})

test('mapeia COMPANY_PENDING para onboarding', () => {
  assert.deepEqual(companyAccessIssueFromCode('COMPANY_PENDING'), {
    code: 'COMPANY_PENDING',
    title: 'Ative sua conta para começar a usar o AylaFlow',
    description: 'Seu cadastro foi concluído. Para utilizar campanhas, automações e os demais recursos do AylaFlow, solicite a ativação da sua empresa.',
  })
})

test('COMPANY_PENDING não é bloqueio de overlay global', () => {
  const issue = companyAccessIssueFromCode('COMPANY_PENDING')
  assert.equal(isPendingCompany(issue), true)
  assert.equal(isBlockingCompanyStatus(issue), false)
})

test('COMPANY_PENDING permite Dashboard e usa gate nos módulos', () => {
  const issue = companyAccessIssueFromCode('COMPANY_PENDING')
  assert.equal(shouldShowCompanyActivationGate(issue, 'dashboard'), false)
  assert.equal(shouldShowCompanyActivationGate(issue, 'campaigns'), true)
  assert.equal(shouldShowCompanyActivationGate(issue, 'automations'), true)
  assert.equal(shouldShowCompanyActivationGate(issue, 'contacts'), true)
  assert.equal(shouldShowCompanyActivationGate(issue, 'settings'), true)
  assert.equal(shouldShowCompanyActivationGate(issue, 'campaign-detail'), true)
})

test('mapeia COMPANY_SUSPENDED sem atribuir motivo', () => {
  const issue = companyAccessIssueFromCode('COMPANY_SUSPENDED')
  assert.equal(issue?.title, 'Conta temporariamente suspensa')
  assert.equal(issue?.description, 'O acesso aos recursos do AylaFlow está temporariamente suspenso.')
  assert.equal(issue?.guidance, 'Para regularizar o acesso, entre em contato com a equipe AylaFlow.')
  assert.equal(isBlockingCompanyStatus(issue), true)
})

test('mapeia COMPANY_CANCELLED sem sugerir acesso permitido', () => {
  const issue = companyAccessIssueFromCode('COMPANY_CANCELLED')
  assert.equal(issue?.title, 'Conta cancelada')
  assert.equal(issue?.description, 'Esta empresa não possui mais acesso aos recursos do AylaFlow.')
  assert.equal(issue?.guidance, 'Caso precise de informações sobre o cancelamento ou uma nova contratação, entre em contato com a equipe AylaFlow.')
  assert.equal(isBlockingCompanyStatus(issue), true)
})

test('mapeia COMPANY_INVALID_STATUS com mensagem genérica segura', () => {
  const issue = companyAccessIssueFromCode('COMPANY_INVALID_STATUS')
  assert.equal(issue?.title, 'Conta indisponível')
  assert.equal(issue?.description, 'Não foi possível liberar os recursos desta conta no momento.')
  assert.equal(issue?.guidance, 'Para obter mais informações, entre em contato com a equipe AylaFlow.')
  assert.equal(isBlockingCompanyStatus(issue), true)
})

test('copy do Dashboard usa a linguagem de onboarding solicitada', () => {
  assert.deepEqual(COMPANY_PENDING_ONBOARDING_COPY, {
    title: 'Ative sua conta para começar a usar o AylaFlow',
    description: 'Seu cadastro foi concluído. Para utilizar campanhas, automações e os demais recursos do AylaFlow, solicite a ativação da sua empresa.',
  })
})

test('gate de módulo usa mensagem contextual de ativação', () => {
  assert.deepEqual(COMPANY_PENDING_GATE_COPY, {
    title: 'Ative sua conta para acessar este recurso',
    description: 'Este recurso ficará disponível após a ativação da sua empresa.',
  })
})

test('CTA usa VITE_ACTIVATION_CONTACT_URL quando configurada', () => {
  assert.equal(
    getActivationContactUrl({ VITE_ACTIVATION_CONTACT_URL: 'https://example.com/ativacao' }),
    'https://example.com/ativacao',
  )
})

test('ausência ou URL inválida do canal de ativação não quebra a aplicação', () => {
  assert.equal(getActivationContactUrl({}), null)
  assert.equal(getActivationContactUrl({ VITE_ACTIVATION_CONTACT_URL: '' }), null)
  assert.equal(getActivationContactUrl({ VITE_ACTIVATION_CONTACT_URL: 'javascript:alert(1)' }), null)
})

test('ativa a UX somente para HTTP 403 com código conhecido', () => {
  assert.equal(
    companyAccessIssueFromResponse(403, { code: 'COMPANY_PENDING' })?.code,
    'COMPANY_PENDING',
  )
})

test('ignora HTTP 403 sem código de empresa', () => {
  assert.equal(companyAccessIssueFromResponse(403, { code: 'FORBIDDEN' }), null)
  assert.equal(companyAccessIssueFromResponse(403, { message: 'Forbidden' }), null)
})

test('ignora o mesmo código quando o status HTTP não é 403', () => {
  assert.equal(companyAccessIssueFromResponse(401, { code: 'COMPANY_PENDING' }), null)
  assert.equal(companyAccessIssueFromResponse(409, { code: 'COMPANY_SUSPENDED' }), null)
})

test('sucesso autenticado protegido pode limpar PENDING sem tratar login como protegido', () => {
  assert.equal(isAuthenticatedProtectedRequest('/automation', true), true)
  assert.equal(isAuthenticatedProtectedRequest('/customer/search', true), true)
  assert.equal(isAuthenticatedProtectedRequest('/auth/login', true), false)
  assert.equal(isAuthenticatedProtectedRequest('/automation', false), false)
})

test('401 preserva logout global e PENDING não remove JWT', () => {
  assert.equal(shouldLogoutAfterUnauthorized(401, '/automation'), true)
  assert.equal(shouldLogoutAfterUnauthorized(401, '/auth/login'), false)
  assert.equal(shouldLogoutAfterUnauthorized(403, '/automation'), false)
})

test('limpeza após sucesso remove somente PENDING antigo', () => {
  const pending = companyAccessIssueFromCode('COMPANY_PENDING')!
  const suspended = companyAccessIssueFromCode('COMPANY_SUSPENDED')!

  announceCompanyAccessIssue(pending)
  clearPendingCompanyAccessIssue()
  assert.equal(companyAccessIssue.value, null)

  announceCompanyAccessIssue(suspended)
  clearPendingCompanyAccessIssue()
  assert.equal(companyAccessIssue.value?.code, 'COMPANY_SUSPENDED')
  clearCompanyAccessIssue()
})

test('ignora respostas malformadas sem lançar erro', () => {
  assert.equal(companyAccessIssueFromResponse(403, null), null)
  assert.equal(companyAccessIssueFromResponse(403, 'COMPANY_PENDING'), null)
  assert.equal(companyAccessIssueFromResponse(undefined, undefined), null)
})

test('não interpreta roles nem autoriza usuários no frontend', () => {
  const response = { code: 'COMPANY_PENDING', role: 'PLATFORM_ADMIN' }
  const issue = companyAccessIssueFromResponse(403, response)
  assert.equal(issue?.code, 'COMPANY_PENDING')
  assert.equal('role' in (issue ?? {}), false)
})

test('PENDING é apenas estado de UX e não contém operação sobre JWT', () => {
  const issue = companyAccessIssueFromResponse(403, { code: 'COMPANY_PENDING' })
  assert.equal(issue?.code, 'COMPANY_PENDING')
  assert.equal('token' in (issue ?? {}), false)
  assert.equal('logout' in (issue ?? {}), false)
})

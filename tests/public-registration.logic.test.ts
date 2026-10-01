import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  MAX_PUBLIC_INTERESTS,
  buildPublicRegistrationPayload,
  publicRegistrationErrorMessage,
  togglePublicInterest,
  validPublicId,
  validatePublicRegistrationForm,
} from '../src/features/public-registration/public-registration.logic.ts'
import {
  createPublicRegistrationRepository,
  publicRegistrationEndpoint,
} from '../src/features/public-registration/public-registration.repository.ts'
import type {
  PublicRegistrationForm,
  PublicRegistrationPayload,
} from '../src/features/public-registration/public-registration.types.ts'

const routerSource = readFileSync(new URL('../src/router/index.ts', import.meta.url), 'utf8')
const viewSource = readFileSync(
  new URL('../src/views/PublicRegistrationView.vue', import.meta.url),
  'utf8',
)
const serviceSource = readFileSync(
  new URL('../src/services/public-registration.service.ts', import.meta.url),
  'utf8',
)

function form(overrides: Partial<PublicRegistrationForm> = {}): PublicRegistrationForm {
  return {
    name: 'Maria Silva',
    preferredName: '',
    phone: '(45) 99999-9999',
    cpf: '123.456.789-00',
    birthDate: '',
    gender: '',
    city: '',
    state: '',
    contactConsent: false,
    ...overrides,
  }
}

test('rota pública declara /register/:publicId sem exigir autenticação', () => {
  assert.match(routerSource, /path: '\/register\/:publicId'/)
  assert.match(routerSource, /name: 'public-registration'/)
  const routeBlock = routerSource.match(/\{\s*path: '\/register\/:publicId',[\s\S]*?\n\s*\},/)?.[0]
  assert.ok(routeBlock)
  assert.doesNotMatch(routeBlock, /requiresAuth|requiresGuest/)
})

test('publicId aceita exatamente 43 caracteres base64url', () => {
  assert.equal(validPublicId('A'.repeat(43)), true)
  assert.equal(validPublicId('A'.repeat(42)), false)
  assert.equal(validPublicId('A'.repeat(44)), false)
})

test('publicId recusa caracteres fora de base64url e valores ausentes', () => {
  assert.equal(validPublicId(`${'A'.repeat(42)}/`), false)
  assert.equal(validPublicId(`${'A'.repeat(42)}?`), false)
  assert.equal(validPublicId(undefined), false)
})

test('endpoint usa somente o publicId do path e aplica encodeURIComponent', () => {
  assert.equal(
    publicRegistrationEndpoint('public-id_1'),
    '/public/customer-registration/public-id_1',
  )
  assert.equal(
    publicRegistrationEndpoint('unsafe/value'),
    '/public/customer-registration/unsafe%2Fvalue',
  )
})

test('bootstrap chama GET no endpoint público real', async () => {
  const calls: string[] = []
  const expected = {
    company: { displayName: 'Loja Exemplo' },
    interests: { categories: [], brands: [] },
  }
  const repository = createPublicRegistrationRepository({
    async get<T>(url: string) {
      calls.push(url)
      return { data: expected as T }
    },
    async post<T>() { throw new Error('not expected') as T },
  })

  assert.deepEqual(await repository.getBootstrap('public-1'), expected)
  assert.deepEqual(calls, ['/public/customer-registration/public-1'])
})

test('submit chama POST no mesmo endpoint e preserva o payload explícito', async () => {
  const calls: Array<{ url: string; payload: unknown }> = []
  const payload = buildPublicRegistrationPayload(form(), [], new Set())
  const repository = createPublicRegistrationRepository({
    async get<T>() { throw new Error('not expected') as T },
    async post<T>(url: string, body: unknown) {
      calls.push({ url, payload: body })
      return { data: { success: true, message: 'Concluído' } as T }
    },
  })

  const result = await repository.submit('public-1', payload)
  assert.deepEqual(calls, [{ url: '/public/customer-registration/public-1', payload }])
  assert.deepEqual(result, { success: true, message: 'Concluído' })
})

test('displayName é renderizado como texto Vue e nunca como HTML', () => {
  assert.match(viewSource, /\{\{ bootstrap\.company\.displayName \}\}/)
  assert.doesNotMatch(viewSource, /v-html|innerHTML/)
})

test('categorias e marcas são renderizadas em grupos independentes', () => {
  assert.match(viewSource, /bootstrap\.interests\.categories/)
  assert.match(viewSource, />Categorias de interesse</)
  assert.match(viewSource, /bootstrap\.interests\.brands/)
  assert.match(viewSource, />Marcas de interesse</)
})

test('grupos vazios não são exibidos', () => {
  assert.match(viewSource, /v-if="bootstrap\.interests\.categories\.length"/)
  assert.match(viewSource, /v-if="bootstrap\.interests\.brands\.length"/)
})

test('múltiplos interesses permitidos são selecionados', () => {
  const allowed = new Set(['category-1', 'brand-1'])
  let selected = togglePublicInterest([], 'category-1', true, allowed)
  selected = togglePublicInterest(selected, 'brand-1', true, allowed)
  assert.deepEqual(selected, ['category-1', 'brand-1'])
})

test('IDs não fornecidos pelo bootstrap nunca entram na seleção', () => {
  assert.deepEqual(togglePublicInterest([], 'forged-id', true, new Set(['valid-id'])), [])
})

test('payload envia exclusivamente IDs de interesse permitidos e únicos', () => {
  const payload = buildPublicRegistrationPayload(
    form(),
    ['category-1', 'forged-id', 'category-1'],
    new Set(['category-1']),
  )
  assert.deepEqual(payload.interestOptionIds, ['category-1'])
  assert.equal(Object.hasOwn(payload, 'interests'), false)
})

test('consentimento marcado envia true', () => {
  const payload = buildPublicRegistrationPayload(
    form({ contactConsent: true }), [], new Set(),
  )
  assert.equal(payload.contactConsent, true)
})

test('consentimento desmarcado continua sendo payload válido com false', () => {
  const payload = buildPublicRegistrationPayload(form(), [], new Set())
  assert.equal(payload.contactConsent, false)
})

test('campos opcionais vazios são omitidos em vez de enviados como string vazia', () => {
  const payload = buildPublicRegistrationPayload(form(), [], new Set())
  assert.deepEqual(payload, {
    name: 'Maria Silva',
    phone: '(45) 99999-9999',
    cpf: '123.456.789-00',
    contactConsent: false,
    interestOptionIds: [],
  })
})

test('campos opcionais preenchidos são normalizados sem alterar valores de domínio', () => {
  const payload = buildPublicRegistrationPayload(form({
    preferredName: '  Maria  ',
    birthDate: '1990-05-20',
    gender: 'FEMALE',
    city: '  Cascavel ',
    state: 'PR',
  }), [], new Set())
  assert.equal(payload.preferredName, 'Maria')
  assert.equal(payload.birthDate, '1990-05-20')
  assert.equal(payload.gender, 'FEMALE')
  assert.equal(payload.city, 'Cascavel')
  assert.equal(payload.state, 'PR')
})

test('gênero usa o enum real e a view mapeia rótulos traduzidos', () => {
  const payload = buildPublicRegistrationPayload(form({ gender: 'UNSPECIFIED' }), [], new Set())
  assert.equal(payload.gender, 'UNSPECIFIED')
  assert.match(viewSource, /value="UNSPECIFIED">Prefiro não informar/)
})

test('estado envia UF e o campo vazio é omitido', () => {
  assert.equal(buildPublicRegistrationPayload(form({ state: 'SC' }), [], new Set()).state, 'SC')
  assert.equal(Object.hasOwn(buildPublicRegistrationPayload(form(), [], new Set()), 'state'), false)
})

test('seleção de interesses é limitada a 100', () => {
  const allowed = new Set(Array.from({ length: 101 }, (_, index) => `id-${index}`))
  let selected: string[] = []
  for (const id of allowed) selected = togglePublicInterest(selected, id, true, allowed)
  assert.equal(selected.length, MAX_PUBLIC_INTERESTS)
  assert.equal(selected.includes('id-100'), false)
})

test('payload também aplica defesa de limite máximo de 100 interesses', () => {
  const ids = Array.from({ length: 110 }, (_, index) => `id-${index}`)
  const payload = buildPublicRegistrationPayload(form(), ids, new Set(ids))
  assert.equal(payload.interestOptionIds.length, 100)
})

test('campos obrigatórios recebem mensagens acessíveis de validação', () => {
  assert.deepEqual(validatePublicRegistrationForm(form({ name: '', phone: '', cpf: '' })), {
    name: 'Informe seu nome completo.',
    phone: 'Informe seu telefone.',
    cpf: 'Informe seu CPF.',
  })
  assert.match(viewSource, /aria-invalid/)
  assert.match(viewSource, /aria-describedby/)
})

test('duplo submit é bloqueado por estado antes de chamar o serviço', () => {
  assert.match(viewSource, /if \(submitting\.value \|\| !bootstrap\.value\) return/)
  assert.match(viewSource, /:disabled="submitting"/)
})

test('sucesso substitui o formulário e remove dados sensíveis da memória do form', () => {
  assert.match(viewSource, /v-else-if="pageState === 'success'"/)
  assert.match(viewSource, />Cadastro realizado!</)
  assert.match(viewSource, /clearSensitiveFormData\(\)/)
})

test('404 no bootstrap apresenta estado indisponível sem detalhe técnico', () => {
  assert.match(viewSource, /error\.response\?\.status === 404/)
  assert.match(viewSource, />Cadastro indisponível</)
  assert.match(viewSource, /Este link não está disponível no momento\./)
})

test('400 possui mensagem amigável', () => {
  assert.equal(publicRegistrationErrorMessage(400), 'Revise os dados informados e tente novamente.')
})

test('404 de submit possui mensagem amigável', () => {
  assert.equal(publicRegistrationErrorMessage(404), 'Este cadastro não está mais disponível.')
})

test('409 possui mensagem amigável', () => {
  assert.equal(
    publicRegistrationErrorMessage(409),
    'Não foi possível concluir o cadastro com os dados informados.',
  )
})

test('429 possui mensagem amigável', () => {
  assert.match(publicRegistrationErrorMessage(429), /Muitas tentativas/)
})

test('erros 5xx e de rede usam feedback genérico seguro', () => {
  const expected = 'Não foi possível concluir o cadastro agora. Tente novamente mais tarde.'
  assert.equal(publicRegistrationErrorMessage(500), expected)
  assert.equal(publicRegistrationErrorMessage(undefined), expected)
})

test('payload não contém companyId, tenantId ou publicId', () => {
  const payload: PublicRegistrationPayload = buildPublicRegistrationPayload(form(), [], new Set())
  assert.equal(Object.hasOwn(payload, 'companyId'), false)
  assert.equal(Object.hasOwn(payload, 'tenantId'), false)
  assert.equal(Object.hasOwn(payload, 'publicId'), false)
})

test('query params não participam da resolução de tenant ou publicId', () => {
  assert.match(viewSource, /route\.params\.publicId/)
  assert.doesNotMatch(viewSource, /route\.query|URLSearchParams|location\.search/)
})

test('cliente público usa VITE_API_URL sem JWT ou interceptors globais', () => {
  assert.match(serviceSource, /axios\.create/)
  assert.match(serviceSource, /import\.meta\.env\.VITE_API_URL/)
  assert.doesNotMatch(serviceSource, /from ['"]\.\/api['"]|Authorization|localStorage|interceptors/)
})

test('CPF e telefone não são persistidos nem enviados por query string', () => {
  assert.doesNotMatch(viewSource, /localStorage|sessionStorage|console\.log/)
  assert.match(viewSource, /inputmode="numeric"/)
  assert.match(viewSource, /inputmode="tel"/)
})

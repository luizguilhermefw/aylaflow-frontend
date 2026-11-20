import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { salesContactHref } from '../src/features/landing/landing.logic.ts'
import { salesWhatsappHref, showLandingTop, landingTopBehavior } from '../src/features/landing/landing.logic.ts'
import { landingFeatures, landingScenarios, scenarioAt } from '../src/features/landing/landing-demos.ts'
import { readingProgress, demoStage, automationStates } from '../src/features/landing/landing-motion.ts'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const router = read('../src/router/index.ts')
const home = read('../src/views/Home.vue')
const header = read('../src/components/landing/LandingHeader.vue')
test('ações únicas usam threshold, movimento reduzido e WhatsApp codificado', () => {
  assert.equal(showLandingTop(599), false)
  assert.equal(showLandingTop(600), true)
  assert.equal(landingTopBehavior(true), 'auto')
  assert.equal(landingTopBehavior(false), 'smooth')
  const href = salesWhatsappHref()
  const url = new URL(href)
  assert.equal(url.origin, 'https://wa.me')
  assert.equal(url.pathname, '/5545991335359')
  assert.equal(url.searchParams.get('text'), 'Olá! Quero conhecer melhor o AylaFlow e entender como a solução pode funcionar na minha empresa.')
  assert.ok(href.includes(encodeURIComponent('Olá! Quero')))
  const actions = read('../src/components/landing/LandingFloatingActions.vue')
  assert.match(actions, /rel="noopener noreferrer"/)
  assert.match(actions, /footerVisible/)
  assert.match(home, /<LandingFloatingActions/)
  assert.doesNotMatch(home + read('../src/views/Legal.vue'), /BackToTop/)
})
test('logo preserva link para home e intercepta apenas navegação normal', () => {
  assert.match(header, /to="\/" class="landing-header-brand"/)
  assert.match(header, /@click="goHome"/)
  assert.match(header, /event.preventDefault\(\)/)
  assert.match(header, /await router.push\('\/'\)/)
  assert.match(header, /window.scrollTo/)
})
test('rotas legais são públicas e footer identifica produto e instituição', () => {
  assert.match(router, /path: '\/privacidade', name: 'privacy', component:/)
  assert.match(router, /path: '\/termos', name: 'terms', component:/)
  const footer = read('../src/components/landing/LandingFooter.vue')
  for (const value of ['/privacidade', '/termos', 'LFWeb Studio', '62.510.089/0001-93', 'www.aylaflow.com.br', 'www.lfwebstudio.com.br']) assert.ok(footer.includes(value))
  assert.match(home, /<LandingFooter/)
  assert.match(router, /return \{ name: 'login' \}/)
})

test('home pública e login guest possuem rotas distintas e guards preservados', () => {
  assert.match(router, /path: '\/',\s+name: 'home',\s+component: \(\) => import\('@\/views\/Home.vue'\)/)
  assert.match(router, /path: '\/login',\s+name: 'login',[\s\S]*?Login.vue'[\s\S]*?requiresGuest: true/)
  assert.match(router, /requiresAuth && !authStore.isAuthenticated[\s\S]*?return \{ name: 'login' \}/)
  assert.match(router, /requiresGuest && authStore.isAuthenticated[\s\S]*?name: 'dashboard'/)
})
test('landing apresenta proposta, recursos, contato e logo oficial', () => {
  const page = home + read('../src/components/landing/LandingExplorers.vue') + read('../src/components/landing/LandingScrollStory.vue')
  for (const text of ['Seu cliente já comprou de você.', 'como-funciona', 'recursos', 'para-sua-empresa', 'Automação com controle.', 'Quero ver o AylaFlow funcionando']) assert.ok(page.includes(text))
  assert.equal((home.match(/<h1>/g) ?? []).length, 1)
  assert.match(header, /to="\/login"/)
  assert.match(header, /ui\/AylaFlowLogo.vue/)
  assert.match(read('../src/views/Register.vue'), /to="\/login" class="link">Fazer login/)
})

test('progresso de leitura limita valores e trata página sem scroll', () => {
  assert.equal(readingProgress(0, 2000, 1000), 0)
  assert.equal(readingProgress(500, 2000, 1000), .5)
  assert.equal(readingProgress(1500, 2000, 1000), 1)
  assert.equal(readingProgress(-50, 2000, 1000), 0)
  assert.equal(readingProgress(0, 500, 1000), 0)
})
test('demo progride em ordem e reduced motion resolve no estado final', () => {
  assert.equal(automationStates.length, 6)
  assert.equal(demoStage(0, false), 0)
  assert.equal(demoStage(3000, false), 2)
  assert.equal(demoStage(12000, false), 5)
  assert.equal(demoStage(0, true), 5)
})
test('contato usa prioridade comercial, ativação e fallback neutro', () => {
  assert.equal(salesContactHref('https://wa.me/5511999999999', 'https://example.com'), 'https://wa.me/5511999999999')
  assert.equal(salesContactHref(undefined, 'https://example.com/contact'), 'https://example.com/contact')
  assert.equal(salesContactHref(), '/login')
  assert.equal(salesContactHref('javascript:alert(1)'), '/login')
  assert.equal(salesContactHref('invalid'), '/login')
})
test('metadados são restaurados ao sair e configuração pública não inclui segredos', () => {
  const meta = read('../src/features/landing/page-meta.ts')
  assert.match(meta, /document.title = previousTitle/)
  assert.match(meta, /previousDescription/)
  assert.match(home, /usePageMeta/)
  assert.match(home, /VITE_SALES_CONTACT_URL/)
  assert.doesNotMatch(home + header, /apiKey|webhookSecret|access_token|Bearer /)
})

test('páginas legais compartilham header, footer e metadados com destinos institucionais', () => {
  const legal = read('../src/views/Legal.vue')
  assert.match(legal, /<LandingHeader :contact="contact" institutional/)
  assert.match(legal, /<LandingFooter/)
  assert.match(legal, /usePageMeta/)
  assert.match(legal, /title.value \+ ' \| AylaFlow'/)
  assert.match(legal, /'Política de Privacidade' : 'Termos de Uso'/)
  assert.match(legal, /Consulte a Política de Privacidade do AylaFlow e entenda como informações pessoais podem ser tratadas e quais são os direitos dos titulares\./)
  assert.match(legal, /Consulte os Termos de Uso do AylaFlow e as condições gerais aplicáveis ao acesso e utilização da plataforma\./)
  assert.match(header, /props.institutional \? '\/#' \+ id : '#' \+ id/)
  for (const id of ['como-funciona', 'recursos', 'para-sua-empresa']) assert.ok(header.includes("homeSection('" + id + "')"))
  assert.match(header, /if \(props.institutional \|\|/)
  const legalRoutes = router.split('\n').filter(line => line.includes("path: '/privacidade'") || line.includes("path: '/termos'"))
  assert.equal(legalRoutes.length, 2)
  legalRoutes.forEach(line => assert.doesNotMatch(line, /requiresAuth|requiresGuest/))
})

test('explorador cobre os seis recursos e cenários têm início e troca determinísticos', () => {
  assert.deepEqual(landingFeatures.map(item => item.label), ['Reativação', 'Campanhas', 'Aniversários', 'QR Code / Link', 'Interesses', 'Histórico'])
  assert.equal(scenarioAt(0), landingScenarios[0])
  assert.equal(scenarioAt(1).rows[0][1], 'Aniversário do cliente')
  assert.equal(scenarioAt(2).rows[1][0], 'Público')
  assert.equal(scenarioAt(-1), landingScenarios[0])
})
test('exploradores e jornada usam botões com estado acessível e observers são limpos', () => {
  const explorers = read('../src/components/landing/LandingExplorers.vue')
  const journey = read('../src/components/landing/LandingRegistrationJourney.vue')
  assert.match(explorers, /id="recursos"/)
  assert.match(explorers, /id="para-sua-empresa"/)
  assert.match(explorers + journey, /aria-pressed/)
  assert.match(journey, /Cadastro concluído/)
  assert.match(header, /observer\?\.disconnect/)
  assert.match(home, /revealObserver\?\.disconnect/)
})

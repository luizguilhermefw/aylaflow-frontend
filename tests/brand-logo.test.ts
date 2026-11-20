import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const logoComponentUrl = new URL('../src/components/ui/AylaFlowLogo.vue', import.meta.url)
const logoAssetUrl = new URL('../src/assets/brand/aylaflow-logo.png', import.meta.url)
const globalStylesUrl = new URL('../src/style.css', import.meta.url)

test('logo oficial está disponível nas dimensões originais', () => {
  const png = readFileSync(logoAssetUrl)

  assert.equal(png.toString('ascii', 1, 4), 'PNG')
  assert.equal(png.readUInt32BE(16), 500)
  assert.equal(png.readUInt32BE(20), 500)
})

test('componente de marca possui texto alternativo e dimensões intrínsecas', () => {
  const source = readFileSync(logoComponentUrl, 'utf8')

  assert.match(source, /:alt="alt"/)
  assert.match(source, /alt: 'AylaFlow'/)
  assert.match(source, /width="500"/)
  assert.match(source, /height="500"/)
})

test('logo preserva proporção, recorta somente margens e responde ao container', () => {
  const source = readFileSync(logoComponentUrl, 'utf8')

  assert.match(source, /width: min\(100%, var\(--aylaflow-logo-width, 220px\)\)/)
  assert.match(source, /aspect-ratio: 355 \/ 228/)
  assert.match(source, /height: auto/)
  assert.match(source, /object-fit: contain/)
  assert.match(source, /overflow: hidden/)
})

test('logo possui tratamento específico para contraste no tema escuro', () => {
  const source = readFileSync(logoComponentUrl, 'utf8')
  const globalStyles = readFileSync(globalStylesUrl, 'utf8')

  assert.match(source, /filter: var\(--brand-logo-filter\)/)
  assert.match(source, /mix-blend-mode: var\(--brand-logo-blend-mode\)/)
  assert.doesNotMatch(source, /:global\(:root/)
  assert.match(globalStyles, /--brand-logo-filter: invert\(1\) hue-rotate\(180deg\)/)
  assert.match(globalStyles, /--brand-logo-blend-mode: screen/)
})

test('painel do Login, Register e AppLayout usam a logo oficial sem AppIcon brand', () => {
  const identityFiles = [
    '../src/components/landing/LoginExperience.vue',
    '../src/views/Register.vue',
    '../src/layouts/AppLayout.vue',
  ]

  for (const file of identityFiles) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.match(source, /<AylaFlowLogo/)
    assert.doesNotMatch(source, /<AppIcon[^>]+name="brand"/)
  }
})

test('login integra painel visual isolado e mantém links de conta e retorno', () => {
  const login = readFileSync(new URL('../src/views/Login.vue', import.meta.url), 'utf8')
  const experience = readFileSync(new URL('../src/components/landing/LoginExperience.vue', import.meta.url), 'utf8')
  assert.match(login, /<LoginExperience/)
  assert.match(login, /to="\/register"/)
  assert.match(login, /to="\/"/)
  assert.match(login, /@submit.prevent="handleLogin"/)
  assert.doesNotMatch(experience, /authStore|authService|axios/)
  assert.match(experience, /if \(motion\?\.matches \|\| !desktop\?\.matches\) return/)
  assert.match(experience, /onUnmounted\(\(\) => \{\s+clearInterval\(timer\)/)
})

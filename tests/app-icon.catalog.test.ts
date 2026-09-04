import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  APP_ICON_CATALOG,
  APP_ICON_NAMES,
  isAppIconName,
  type AppIconName,
} from '../src/components/ui/app-icon.catalog.ts'

const expectedProductIcons: AppIconName[] = [
  'dashboard',
  'campaign',
  'automation',
  'contacts',
  'reports',
  'settings',
  'whatsapp',
  'company',
  'users',
  'appearance',
  'edit',
  'delete',
  'activate',
  'pause',
  'send',
  'upload',
  'import',
  'confirm',
  'close',
  'back',
  'search',
  'filter',
  'consentGranted',
  'optOut',
  'channel',
  'calendar',
  'birthday',
  'reactivation',
  'maintenance',
]

test('catálogo central cobre os conceitos principais do AylaFlow', () => {
  for (const name of expectedProductIcons) {
    assert.ok(APP_ICON_NAMES.includes(name), `ícone ausente: ${name}`)
    assert.ok(APP_ICON_CATALOG[name].length > 0, `ícone sem desenho: ${name}`)
  }
})

test('catálogo rejeita nomes desconhecidos em runtime e expõe união tipada', () => {
  assert.equal(isAppIconName('dashboard'), true)
  assert.equal(isAppIconName('unknown-icon'), false)
})

test('desenhos não definem fill, stroke ou cor próprios', () => {
  for (const nodes of Object.values(APP_ICON_CATALOG)) {
    for (const node of nodes) {
      assert.equal('fill' in node.attrs, false)
      assert.equal('stroke' in node.attrs, false)
      assert.equal('color' in node.attrs, false)
    }
  }
})

test('AppIcon centraliza currentColor, stroke e acessibilidade', () => {
  const source = readFileSync(new URL('../src/components/ui/AppIcon.vue', import.meta.url), 'utf8')

  assert.match(source, /name: AppIconName/)
  assert.match(source, /stroke="currentColor"/)
  assert.match(source, /stroke-width="2"/)
  assert.match(source, /aria-hidden/)
  assert.match(source, /aria-label/)
  assert.match(source, /<title v-if="title">/)
})

test('componentes da migração inicial usam AppIcon sem SVG inline', () => {
  const migratedFiles = [
    '../src/layouts/AppLayout.vue',
    '../src/views/Settings.vue',
    '../src/views/Dashboard.vue',
    '../src/views/Automations.vue',
    '../src/components/settings/WhatsappChannelsSettings.vue',
    '../src/components/settings/WhatsappQrModal.vue',
    '../src/components/settings/OptOutInstructionsConfirmModal.vue',
  ]

  for (const file of migratedFiles) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.match(source, /<AppIcon/)
    assert.doesNotMatch(source, /<svg/)
  }
})

test('logos e Dashboard não usam emojis como ícones de interface', () => {
  const migratedFiles = [
    '../src/layouts/AppLayout.vue',
    '../src/views/Login.vue',
    '../src/views/Register.vue',
    '../src/views/Dashboard.vue',
  ]
  const interfaceEmoji = /⚡|✨|📲|🤖|📈|🚀/

  for (const file of migratedFiles) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8')
    assert.doesNotMatch(source, interfaceEmoji)
  }
})

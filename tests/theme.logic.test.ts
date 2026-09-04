import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import {
  THEME_STORAGE_KEY,
  initializeTheme,
  setThemePreference,
  storedTheme,
} from '../src/features/theme/theme.logic.ts'

function memoryStorage(initial?: string) {
  const values = new Map<string, string>()
  if (initial !== undefined) values.set(THEME_STORAGE_KEY, initial)

  return {
    getItem(key: string) {
      return values.get(key) ?? null
    },
    setItem(key: string, value: string) {
      values.set(key, value)
    },
  }
}

test('usa o tema claro por padrão quando não há preferência salva', () => {
  const storage = memoryStorage()
  const root = { dataset: {} as DOMStringMap }

  assert.equal(initializeTheme(storage, root), 'light')
  assert.equal(root.dataset.theme, 'light')
})

test('a troca para tema escuro é aplicada imediatamente e persistida', () => {
  const storage = memoryStorage()
  const root = { dataset: {} as DOMStringMap }

  setThemePreference('dark', storage, root)

  assert.equal(root.dataset.theme, 'dark')
  assert.equal(storage.getItem(THEME_STORAGE_KEY), 'dark')
})

test('a preferência persistida é restaurada em um novo carregamento', () => {
  const storage = memoryStorage('dark')
  const reloadedRoot = { dataset: {} as DOMStringMap }

  assert.equal(initializeTheme(storage, reloadedRoot), 'dark')
  assert.equal(reloadedRoot.dataset.theme, 'dark')
})

test('valores de storage desconhecidos não substituem o padrão claro', () => {
  assert.equal(storedTheme(memoryStorage('system')), 'light')
})

test('a raiz global alterna de forma consistente entre data-theme light e dark', () => {
  const root = { dataset: {} as DOMStringMap }

  setThemePreference('light', null, root)
  assert.deepEqual(root.dataset, { theme: 'light' })

  setThemePreference('dark', null, root)
  assert.deepEqual(root.dataset, { theme: 'dark' })
})

test('os seletores de tema são exclusivos e o dark usa superfícies escuras opacas', () => {
  const stylesheet = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8')

  assert.match(stylesheet, /:root:not\(\[data-theme\]\),\s*:root\[data-theme='light'\]\s*\{/)
  assert.match(stylesheet, /:root\[data-theme='dark'\]\s*\{/)
  assert.doesNotMatch(stylesheet, /:root,\s*:root\[data-theme='light'\]/)

  const darkTheme = stylesheet.match(/:root\[data-theme='dark'\]\s*\{([\s\S]*?)\n\}/)?.[1]
  assert.ok(darkTheme)
  assert.match(darkTheme, /--bg-page:\s*#0a0f14;/)
  assert.match(darkTheme, /--bg-surface:\s*#10171c;/)
  assert.match(darkTheme, /--bg-surface-secondary:\s*#0f2a2e;/)
  assert.match(darkTheme, /--sidebar-bg:\s*#0f2a2e;/)
  assert.match(darkTheme, /--card-bg:\s*#10171c;/)
  assert.match(darkTheme, /--input-bg:\s*#121c23;/)
  assert.match(darkTheme, /--bg-gradient:\s*#0a0f14;/)
  assert.match(darkTheme, /--text-primary:\s*#f2f6f7;/)
  assert.match(darkTheme, /--text-secondary:\s*#c5d0d3;/)
  assert.match(darkTheme, /--text-muted:\s*#a0a7b5;/)
})

test('a inicialização do tema acontece antes da montagem da aplicação', () => {
  const main = readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8')

  assert.ok(main.indexOf('initializeTheme()') < main.indexOf('createApp(App)'))
})

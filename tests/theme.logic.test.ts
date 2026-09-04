import assert from 'node:assert/strict'
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

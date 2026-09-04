import { readonly, ref } from 'vue'

export const THEME_STORAGE_KEY = 'aylaflow.theme'

export type ThemePreference = 'light' | 'dark'

type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>
type ThemeRoot = Pick<HTMLElement, 'dataset'>

const activeTheme = ref<ThemePreference>('light')

export const themePreference = readonly(activeTheme)

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark'
}

export function storedTheme(storage?: Pick<ThemeStorage, 'getItem'> | null): ThemePreference {
  if (!storage) return 'light'

  try {
    const value = storage.getItem(THEME_STORAGE_KEY)
    return isThemePreference(value) ? value : 'light'
  } catch {
    return 'light'
  }
}

export function applyTheme(theme: ThemePreference, root?: ThemeRoot | null) {
  activeTheme.value = theme
  if (root) root.dataset.theme = theme
}

export function initializeTheme(
  storage: Pick<ThemeStorage, 'getItem'> | null = browserStorage(),
  root: ThemeRoot | null = documentRoot(),
) {
  const theme = storedTheme(storage)
  applyTheme(theme, root)
  return theme
}

export function setThemePreference(
  theme: ThemePreference,
  storage: Pick<ThemeStorage, 'setItem'> | null = browserStorage(),
  root: ThemeRoot | null = documentRoot(),
) {
  applyTheme(theme, root)

  try {
    storage?.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // A preferência continua aplicada nesta sessão quando o storage não está disponível.
  }
}

function browserStorage(): ThemeStorage | null {
  if (typeof window === 'undefined') return null

  try {
    return window.localStorage
  } catch {
    return null
  }
}

function documentRoot(): ThemeRoot | null {
  return typeof document === 'undefined' ? null : document.documentElement
}

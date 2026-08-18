export type CompanyAccessCode =
  | 'COMPANY_PENDING'
  | 'COMPANY_SUSPENDED'
  | 'COMPANY_CANCELLED'
  | 'COMPANY_INVALID_STATUS'

export interface CompanyAccessIssue {
  code: CompanyAccessCode
  title: string
  description: string
  guidance?: string
}

export const COMPANY_PENDING_ONBOARDING_COPY = {
  title: 'Ative sua conta para começar a usar o AylaFlow',
  description: 'Seu cadastro foi concluído. Para utilizar campanhas, automações e os demais recursos do AylaFlow, solicite a ativação da sua empresa.',
} as const

export const COMPANY_PENDING_GATE_COPY = {
  title: 'Ative sua conta para acessar este recurso',
  description: 'Este recurso ficará disponível após a ativação da sua empresa.',
} as const

const COMPANY_ACCESS_ISSUES: Record<CompanyAccessCode, Omit<CompanyAccessIssue, 'code'>> = {
  COMPANY_PENDING: {
    ...COMPANY_PENDING_ONBOARDING_COPY,
  },
  COMPANY_SUSPENDED: {
    title: 'Conta temporariamente suspensa',
    description: 'O acesso aos recursos do AylaFlow está temporariamente suspenso.',
    guidance: 'Para regularizar o acesso, entre em contato com a equipe AylaFlow.',
  },
  COMPANY_CANCELLED: {
    title: 'Conta cancelada',
    description: 'Esta empresa não possui mais acesso aos recursos do AylaFlow.',
    guidance: 'Caso precise de informações sobre o cancelamento ou uma nova contratação, entre em contato com a equipe AylaFlow.',
  },
  COMPANY_INVALID_STATUS: {
    title: 'Conta indisponível',
    description: 'Não foi possível liberar os recursos desta conta no momento.',
    guidance: 'Para obter mais informações, entre em contato com a equipe AylaFlow.',
  },
}

export function isCompanyAccessCode(value: unknown): value is CompanyAccessCode {
  return typeof value === 'string' && value in COMPANY_ACCESS_ISSUES
}

export function companyAccessIssueFromCode(code: unknown): CompanyAccessIssue | null {
  if (!isCompanyAccessCode(code)) return null
  return { code, ...COMPANY_ACCESS_ISSUES[code] }
}

export function isPendingCompany(issue: CompanyAccessIssue | null): boolean {
  return issue?.code === 'COMPANY_PENDING'
}

export function isBlockingCompanyStatus(issue: CompanyAccessIssue | null): boolean {
  return issue !== null && issue.code !== 'COMPANY_PENDING'
}

export function shouldShowCompanyActivationGate(
  issue: CompanyAccessIssue | null,
  routeName: unknown,
): boolean {
  return isPendingCompany(issue) && routeName !== 'dashboard'
}

interface ActivationContactEnvironment {
  VITE_ACTIVATION_CONTACT_URL?: unknown
}

export function getActivationContactUrl(
  environment?: ActivationContactEnvironment,
): string | null {
  const source = environment
    ?? (import.meta.env as unknown as ActivationContactEnvironment)
  const value = source.VITE_ACTIVATION_CONTACT_URL
  if (typeof value !== 'string' || !value.trim()) return null

  try {
    const url = new URL(value.trim())
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function isAuthenticatedProtectedRequest(
  url: string | undefined,
  hasToken: boolean,
): boolean {
  return hasToken && Boolean(url && !url.includes('/auth/'))
}

export function shouldLogoutAfterUnauthorized(
  status: number | undefined,
  url: string | undefined,
): boolean {
  return status === 401 && !url?.includes('/auth/login')
}

export function companyAccessIssueFromResponse(
  status: number | undefined,
  data: unknown,
): CompanyAccessIssue | null {
  if (status !== 403 || typeof data !== 'object' || data === null || !('code' in data)) return null
  return companyAccessIssueFromCode(data.code)
}

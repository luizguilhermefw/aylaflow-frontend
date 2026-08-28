import type {
  DashboardRecentAutomationType,
  DashboardService,
  DashboardSummary,
} from '../../services/dashboard.service.ts'

export interface DashboardState {
  summary: DashboardSummary | null
  loading: boolean
  loadError: boolean
}

export function emptyDashboardState(): DashboardState {
  return {
    summary: null,
    loading: false,
    loadError: false,
  }
}

export function formatDashboardNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value)
}

export function dashboardAutomationTypeLabel(
  type: DashboardRecentAutomationType,
): string {
  const labels: Record<DashboardRecentAutomationType, string> = {
    REACTIVATION: 'Reativação',
    BIRTHDAY: 'Aniversário',
    MAINTENANCE: 'Manutenção',
  }
  return labels[type]
}

export function formatDashboardDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Data indisponível'
  return new Intl.DateTimeFormat('pt-BR').format(date)
}

export function createDashboardController(
  service: DashboardService,
  state: DashboardState = emptyDashboardState(),
) {
  async function load(): Promise<boolean> {
    if (state.loading) return false
    state.loading = true
    state.loadError = false

    try {
      state.summary = await service.getSummary()
      return true
    } catch {
      state.loadError = true
      return false
    } finally {
      state.loading = false
    }
  }

  return { state, load }
}

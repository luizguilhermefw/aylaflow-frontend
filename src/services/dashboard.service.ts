import api from './api'

export const DASHBOARD_SUMMARY_ENDPOINT = '/dashboard/summary'

export type DashboardRecentAutomationType =
  | 'REACTIVATION'
  | 'BIRTHDAY'
  | 'MAINTENANCE'

export interface DashboardRecentAutomation {
  id: string
  name: string
  type: DashboardRecentAutomationType
  isActive: boolean
  createdAt: string
}

export interface DashboardSummary {
  activeAutomations: number
  contacts: number
  messagesSent: number
  campaigns: number
  recentAutomations: DashboardRecentAutomation[]
}

export interface DashboardHttpClient {
  get<T>(url: string): Promise<{ data: T }>
}

export interface DashboardService {
  getSummary(): Promise<DashboardSummary>
}

export function createDashboardService(http: DashboardHttpClient): DashboardService {
  return {
    async getSummary() {
      const { data } = await http.get<DashboardSummary>(DASHBOARD_SUMMARY_ENDPOINT)
      return data
    },
  }
}

export const dashboardService = createDashboardService(api as DashboardHttpClient)

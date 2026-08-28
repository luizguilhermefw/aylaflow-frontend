export const RECURRING_AUTOMATION_ENDPOINT = '/automation'

export type RecurringAutomationType = 'REACTIVATION' | 'BIRTHDAY' | 'MAINTENANCE'

export interface CreateRecurringAutomationPayload {
  name: string
  type: RecurringAutomationType
  daysAfter: number
  message: string
  cooldownHours?: number
  messagingChannelId: string
}

export interface UpdateRecurringAutomationPayload {
  name?: string
  daysAfter?: number
  cooldownHours?: number
  message?: string
  isActive?: boolean
  messagingChannelId?: string | null
}

export interface AutomationHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  post<T>(url: string, payload: unknown): Promise<{ data: T }>
  patch<T>(url: string, payload: unknown): Promise<{ data: T }>
  delete<T>(url: string): Promise<{ data: T }>
}

export function recurringAutomationEndpoint(id: string): string {
  return `${RECURRING_AUTOMATION_ENDPOINT}/${id}`
}

export function createRecurringAutomationRepository<TAutomation, TDeleteResponse>(
  http: AutomationHttpClient,
) {
  return {
    async list(): Promise<TAutomation[]> {
      const { data } = await http.get<TAutomation[]>(RECURRING_AUTOMATION_ENDPOINT)
      return data
    },
    async createAutomation(payload: CreateRecurringAutomationPayload): Promise<TAutomation> {
      const { data } = await http.post<TAutomation>(RECURRING_AUTOMATION_ENDPOINT, payload)
      return data
    },
    async updateAutomation(
      id: string,
      payload: UpdateRecurringAutomationPayload,
    ): Promise<TAutomation> {
      const { data } = await http.patch<TAutomation>(recurringAutomationEndpoint(id), payload)
      return data
    },
    async deleteAutomation(id: string): Promise<TDeleteResponse> {
      const { data } = await http.delete<TDeleteResponse>(recurringAutomationEndpoint(id))
      return data
    },
  }
}

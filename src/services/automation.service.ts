import api from './api'

export type AutomationType = 'REACTIVATION' | 'BIRTHDAY' | 'CAMPAIGN' | 'MAINTENANCE'

export interface Automation {
  id: string
  name: string
  type: AutomationType
  message: string
  daysAfter: number
  cooldownHours: number
  isActive: boolean
  isSystem: boolean
  createdAt: string
}

export const automationService = {
  async list(): Promise<Automation[]> {
    const { data } = await api.get<Automation[]>('/automation')
    return data
  },
}

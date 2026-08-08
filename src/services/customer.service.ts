import api from './api'

export interface Customer {
  id: string
  name: string
  phone: string
  isActiveForAutomation: boolean
  lastPurchaseDate?: string
  birthDate?: string | null
  createdAt?: string
}

export const customerService = {
  async list(): Promise<Customer[]> {
    const { data } = await api.get<Customer[]>('/customer')
    return data
  },
}

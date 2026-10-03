export const CUSTOMER_INTEREST_OPTIONS_ENDPOINT = '/customer-interests/options'

export type CustomerInterestType = 'CATEGORY' | 'BRAND'

export interface CustomerInterestOption {
  id: string
  type: CustomerInterestType
  name: string
  active: boolean
}

export interface CreateCustomerInterestOptionPayload {
  type: CustomerInterestType
  name: string
}

export interface UpdateCustomerInterestOptionPayload {
  name: string
}

export interface UpdateCustomerInterestOptionStatusPayload {
  active: boolean
}

export interface CustomerInterestCatalogHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  post<T>(url: string, payload: unknown): Promise<{ data: T }>
  put<T>(url: string, payload: unknown): Promise<{ data: T }>
  patch<T>(url: string, payload: unknown): Promise<{ data: T }>
}

export function createCustomerInterestCatalogRepository(
  http: CustomerInterestCatalogHttpClient,
) {
  return {
    async list(): Promise<CustomerInterestOption[]> {
      const { data } = await http.get<CustomerInterestOption[]>(
        CUSTOMER_INTEREST_OPTIONS_ENDPOINT,
      )
      return data
    },

    async create(type: CustomerInterestType, name: string): Promise<CustomerInterestOption> {
      const payload: CreateCustomerInterestOptionPayload = { type, name }
      const { data } = await http.post<CustomerInterestOption>(
        CUSTOMER_INTEREST_OPTIONS_ENDPOINT,
        payload,
      )
      return data
    },

    async update(id: string, name: string): Promise<CustomerInterestOption> {
      const payload: UpdateCustomerInterestOptionPayload = { name }
      const { data } = await http.put<CustomerInterestOption>(
        `${CUSTOMER_INTEREST_OPTIONS_ENDPOINT}/${id}`,
        payload,
      )
      return data
    },

    async updateStatus(id: string, active: boolean): Promise<CustomerInterestOption> {
      const payload: UpdateCustomerInterestOptionStatusPayload = { active }
      const { data } = await http.patch<CustomerInterestOption>(
        `${CUSTOMER_INTEREST_OPTIONS_ENDPOINT}/${id}/status`,
        payload,
      )
      return data
    },
  }
}

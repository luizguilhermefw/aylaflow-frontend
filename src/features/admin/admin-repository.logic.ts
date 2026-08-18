export type AdminCompanyStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

export interface AdminCompany {
  id: string
  displayName: string
  cnpj: string
  status: AdminCompanyStatus
  createdAt: string
  approvedAt: string | null
}

export interface AdminCompanyMutationResponse {
  message: string
  company: AdminCompany
}

export interface AdminHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  patch<T>(url: string): Promise<{ data: T }>
}

export function adminCompanyActionEndpoint(
  id: string,
  action: 'activate' | 'suspend' | 'cancel',
): string {
  return `/admin/company/${encodeURIComponent(id)}/${action}`
}

export function createAdminRepository(http: AdminHttpClient) {
  return {
    async listCompanies(): Promise<AdminCompany[]> {
      const { data } = await http.get<AdminCompany[]>('/admin/companies')
      return data
    },
    async activateCompany(id: string): Promise<AdminCompany> {
      const { data } = await http.patch<AdminCompanyMutationResponse>(
        adminCompanyActionEndpoint(id, 'activate'),
      )
      return data.company
    },
    async suspendCompany(id: string): Promise<AdminCompany> {
      const { data } = await http.patch<AdminCompanyMutationResponse>(
        adminCompanyActionEndpoint(id, 'suspend'),
      )
      return data.company
    },
    async cancelCompany(id: string): Promise<AdminCompany> {
      const { data } = await http.patch<AdminCompanyMutationResponse>(
        adminCompanyActionEndpoint(id, 'cancel'),
      )
      return data.company
    },
  }
}

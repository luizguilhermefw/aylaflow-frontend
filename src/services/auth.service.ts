import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

export interface RegisterCompanyPayload {
  name: string
  cnpj: string
  userName: string
  email: string
  password: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials)
    return data
  },
  async registerCompany(payload: RegisterCompanyPayload): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/register-company', payload)
    return data
  },
}

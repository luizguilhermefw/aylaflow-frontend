import api from './api'

export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/auth/login', credentials)
    return data
  },
}

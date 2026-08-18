export interface LoginCredentials {
  email: string
  password: string
}

export interface LoginResponse {
  access_token: string
}

export interface AuthenticatedUser {
  userId: string
  name: string
  email: string
  companyId: string | null
  role: string
}

export interface RegisterCompanyPayload {
  name: string
  cnpj: string
  userName: string
  email: string
  password: string
}

export interface AuthHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  post<T>(url: string, payload: unknown): Promise<{ data: T }>
}

export function createAuthRepository(http: AuthHttpClient) {
  return {
    async login(credentials: LoginCredentials): Promise<LoginResponse> {
      const { data } = await http.post<LoginResponse>('/auth/login', credentials)
      return data
    },
    async registerCompany(payload: RegisterCompanyPayload): Promise<LoginResponse> {
      const { data } = await http.post<LoginResponse>('/auth/register-company', payload)
      return data
    },
    async getProfile(): Promise<AuthenticatedUser> {
      const { data } = await http.get<AuthenticatedUser>('/auth/me')
      return data
    },
  }
}

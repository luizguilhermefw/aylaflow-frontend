import api from './api'
import { createAuthRepository } from '@/features/auth/auth-repository.logic'

export type {
  AuthenticatedUser,
  LoginCredentials,
  LoginResponse,
  RegisterCompanyPayload,
} from '@/features/auth/auth-repository.logic'

export const authService = createAuthRepository(api)

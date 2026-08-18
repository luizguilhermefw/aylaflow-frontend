import api from './api'
import { createAdminRepository } from '@/features/admin/admin-repository.logic'

export type {
  AdminCompany,
  AdminCompanyMutationResponse,
  AdminCompanyStatus,
} from '@/features/admin/admin-repository.logic'

export const adminService = createAdminRepository(api)

import api from './api'
import {
  createCustomerRegistrationLinkRepository,
  type CustomerRegistrationLinkHttpClient,
} from '@/features/customer-registration-link/customer-registration-link.repository'

export type {
  CustomerRegistrationLink,
  CustomerRegistrationQrCode,
  UpdateCustomerRegistrationLinkStatusPayload,
} from '@/features/customer-registration-link/customer-registration-link.repository'

export const customerRegistrationLinkService = createCustomerRegistrationLinkRepository(
  api as CustomerRegistrationLinkHttpClient,
)

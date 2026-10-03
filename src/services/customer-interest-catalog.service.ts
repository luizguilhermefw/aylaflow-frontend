import api from './api'
import {
  createCustomerInterestCatalogRepository,
  type CustomerInterestCatalogHttpClient,
} from '@/features/customer-interest-catalog/customer-interest-catalog.repository'

export type {
  CustomerInterestOption,
  CustomerInterestType,
} from '@/features/customer-interest-catalog/customer-interest-catalog.repository'

export const customerInterestCatalogService = createCustomerInterestCatalogRepository(
  api as CustomerInterestCatalogHttpClient,
)

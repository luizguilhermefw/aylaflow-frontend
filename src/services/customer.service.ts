import api from './api'
import { createCustomerRepository } from '@/features/contacts/contact.logic'
import type { CustomerHttpClient } from '@/features/contacts/contact.logic'

export type { Customer } from '@/features/contacts/contact.types'

export const customerService = createCustomerRepository(api as CustomerHttpClient)

import axios from 'axios'
import { createPublicRegistrationRepository } from '@/features/public-registration/public-registration.repository'

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
})

export const publicRegistrationService = createPublicRegistrationRepository(publicApi)

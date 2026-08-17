import axios from 'axios'
import {
  companyAccessIssueFromResponse,
  isAuthenticatedProtectedRequest,
  shouldLogoutAfterUnauthorized,
} from '@/features/company-access/company-access.logic'
import {
  announceCompanyAccessIssue,
  clearCompanyAccessIssue,
  clearPendingCompanyAccessIssue,
} from '@/features/company-access/company-access.state'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 10000,
})

// Request interceptor — injeta o token JWT automaticamente
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

// Response interceptor — trata 401 globalmente, exceto na rota de login
api.interceptors.response.use(
  (response) => {
    if (isAuthenticatedProtectedRequest(
      response.config?.url,
      Boolean(response.config?.headers?.Authorization),
    )) {
      clearPendingCompanyAccessIssue()
    }

    return response
  },
  (error) => {
    const companyAccessIssue = companyAccessIssueFromResponse(
      error.response?.status,
      error.response?.data,
    )

    if (companyAccessIssue) {
      announceCompanyAccessIssue(companyAccessIssue)
    }

    if (shouldLogoutAfterUnauthorized(error.response?.status, error.config?.url)) {
      clearCompanyAccessIssue()
      localStorage.removeItem('token')
      window.location.href = '/'
    }

    return Promise.reject(error)
  },
)

export default api

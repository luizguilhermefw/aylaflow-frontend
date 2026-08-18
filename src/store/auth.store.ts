import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  authService,
  type AuthenticatedUser,
  type LoginCredentials,
  type RegisterCompanyPayload,
} from '@/services/auth.service'
import { isPlatformAdminProfile } from '@/features/auth/auth.logic'
import { clearCompanyAccessIssue } from '@/features/company-access/company-access.state'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const profile = ref<AuthenticatedUser | null>(null)
  const profileResolved = ref(false)
  let profileRequest: Promise<AuthenticatedUser | null> | null = null

  const isAuthenticated = computed(() => !!token.value)
  const isPlatformAdmin = computed(() => isPlatformAdminProfile(profile.value))

  function resetProfile() {
    profile.value = null
    profileResolved.value = false
    profileRequest = null
  }

  async function ensureProfile(): Promise<AuthenticatedUser | null> {
    if (!token.value) return null
    if (profileResolved.value) return profile.value
    if (profileRequest) return profileRequest

    profileRequest = authService.getProfile()
      .then((authenticatedUser) => {
        profile.value = authenticatedUser
        profileResolved.value = true
        return authenticatedUser
      })
      .catch((error: unknown) => {
        profileResolved.value = false
        throw error
      })
      .finally(() => {
        profileRequest = null
      })

    return profileRequest
  }

  async function login(credentials: LoginCredentials) {
    const response = await authService.login(credentials)
    resetProfile()
    clearCompanyAccessIssue()
    token.value = response.access_token
    localStorage.setItem('token', response.access_token)
    await router.push('/dashboard')
  }

  function logout() {
    resetProfile()
    clearCompanyAccessIssue()
    token.value = null
    localStorage.removeItem('token')
    router.push('/')
  }

  async function register(payload: RegisterCompanyPayload) {
    const response = await authService.registerCompany(payload)
    resetProfile()
    clearCompanyAccessIssue()
    token.value = response.access_token
    localStorage.setItem('token', response.access_token)
    await router.push('/dashboard')
  }

  return {
    token,
    profile,
    isAuthenticated,
    isPlatformAdmin,
    ensureProfile,
    login,
    logout,
    register,
  }
})

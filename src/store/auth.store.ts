import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService, type LoginCredentials, type RegisterCompanyPayload } from '@/services/auth.service'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!token.value)

  async function login(credentials: LoginCredentials) {
    const response = await authService.login(credentials)
    token.value = response.access_token
    localStorage.setItem('token', response.access_token)
    await router.push('/dashboard')
  }

  function logout() {
    token.value = null
    localStorage.removeItem('token')
    router.push('/')
  }

  async function register(payload: RegisterCompanyPayload) {
    const response = await authService.registerCompany(payload)
    token.value = response.access_token
    localStorage.setItem('token', response.access_token)
    await router.push('/dashboard')
  }

  return {
    token,
    isAuthenticated,
    login,
    logout,
    register,
  }
})

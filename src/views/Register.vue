<template>
  <AuthLayout>
    <div class="login-card register-card">
      <div class="login-header">
        <div class="logo">
          <AylaFlowLogo class="auth-brand-logo" />
        </div>
        <p class="subtitle">Crie sua conta para começar</p>
      </div>

      <form class="login-form" @submit.prevent="handleRegister" novalidate>

        <!-- Company Name -->
        <div class="field">
          <label for="name">Nome da Empresa</label>
          <div class="input-wrapper" :class="{ 'input-error': errors.name }">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>
            </span>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Minha Empresa Ltda"
              :disabled="loading"
            />
          </div>
          <span v-if="errors.name" class="error-msg">{{ errors.name }}</span>
        </div>

        <!-- CNPJ -->
        <div class="field">
          <label for="cnpj">CNPJ</label>
          <div class="input-wrapper" :class="{ 'input-error': errors.cnpj }">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="14" x="3" y="5" rx="2"/><path d="M3 9h18"/><path d="M9 15h6"/></svg>
            </span>
            <input
              id="cnpj"
              v-model="form.cnpj"
              type="text"
              placeholder="00.000.000/0000-00"
              :disabled="loading"
              @input="formatCnpj"
              maxlength="18"
            />
          </div>
          <span v-if="errors.cnpj" class="error-msg">{{ errors.cnpj }}</span>
        </div>

        <!-- UserName -->
        <div class="field">
          <label for="userName">Seu Nome</label>
          <div class="input-wrapper" :class="{ 'input-error': errors.userName }">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </span>
            <input
              id="userName"
              v-model="form.userName"
              type="text"
              placeholder="João da Silva"
              :disabled="loading"
            />
          </div>
          <span v-if="errors.userName" class="error-msg">{{ errors.userName }}</span>
        </div>

        <!-- Email -->
        <div class="field">
          <label for="email">E-mail</label>
          <div class="input-wrapper" :class="{ 'input-error': errors.email }">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
            </span>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="seu@email.com"
              autocomplete="email"
              :disabled="loading"
            />
          </div>
          <span v-if="errors.email" class="error-msg">{{ errors.email }}</span>
        </div>

        <!-- Password -->
        <div class="field">
          <label for="password">Senha</label>
          <div class="input-wrapper" :class="{ 'input-error': errors.password }">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="new-password"
              :disabled="loading"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </button>
          </div>
          <span v-if="errors.password" class="error-msg">{{ errors.password }}</span>
        </div>

        <!-- Confirm Password -->
        <div class="field">
          <label for="confirmPassword">Confirmar senha</label>
          <div class="input-wrapper" :class="{ 'input-error': errors.confirmPassword }">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </span>
            <input
              id="confirmPassword"
              v-model="form.confirmPassword"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="new-password"
              :disabled="loading"
            />
            <button type="button" class="toggle-password" @click="showPassword = !showPassword" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'">
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="error-msg">{{ errors.confirmPassword }}</span>
        </div>

        <transition name="fade">
          <div v-if="serverError" class="alert alert-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {{ serverError }}
          </div>
        </transition>

        <button
          id="btn-register"
          type="submit"
          class="btn-primary"
          :class="{ loading }"
          :disabled="loading"
        >
          <span v-if="!loading">Criar conta</span>
          <span v-else class="spinner" aria-hidden="true" />
        </button>

        <div class="footer-links">
          <span class="text-muted">Já tem uma conta?</span>
          <RouterLink to="/" class="link">Fazer login</RouterLink>
        </div>
      </form>
    </div>
  </AuthLayout>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AylaFlowLogo from '@/components/ui/AylaFlowLogo.vue'
import { useAuthStore } from '@/store/auth.store'
import { AxiosError } from 'axios'
import { RouterLink } from 'vue-router'

const authStore = useAuthStore()

const form = reactive({
  name: '',
  cnpj: '',
  userName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const errors = reactive({
  name: '',
  cnpj: '',
  userName: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const serverError = ref('')
const loading = ref(false)
const showPassword = ref(false)

function formatCnpj(event: Event) {
  const input = event.target as HTMLInputElement
  let value = input.value.replace(/\D/g, '')

  if (value.length > 14) value = value.slice(0, 14)

  // Format as 00.000.000/0000-00
  if (value.length > 12) {
    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2}).*/, '$1.$2.$3/$4-$5')
  } else if (value.length > 8) {
    value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4}).*/, '$1.$2.$3/$4')
  } else if (value.length > 5) {
    value = value.replace(/^(\d{2})(\d{3})(\d{1,3}).*/, '$1.$2.$3')
  } else if (value.length > 2) {
    value = value.replace(/^(\d{2})(\d{1,3}).*/, '$1.$2')
  }

  form.cnpj = value
}

function validate(): boolean {
  // Reset errors
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  let valid = true

  if (!form.name.trim()) {
    errors.name = 'O nome da empresa é obrigatório.'
    valid = false
  }

  const cleanCnpj = form.cnpj.replace(/\D/g, '')
  if (!cleanCnpj) {
    errors.cnpj = 'O CNPJ é obrigatório.'
    valid = false
  } else if (cleanCnpj.length !== 14) {
    errors.cnpj = 'O CNPJ deve ter 14 dígitos válidos.'
    valid = false
  }

  if (!form.userName.trim()) {
    errors.userName = 'O nome de usuário é obrigatório.'
    valid = false
  }

  if (!form.email) {
    errors.email = 'O e-mail é obrigatório.'
    valid = false
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Insira um e-mail válido.'
    valid = false
  }

  if (!form.password) {
    errors.password = 'A senha é obrigatória.'
    valid = false
  } else if (form.password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.'
    valid = false
  }

  if (!form.confirmPassword) {
    errors.confirmPassword = 'A confirmação de senha é obrigatória.'
    valid = false
  } else if (form.confirmPassword !== form.password) {
    errors.confirmPassword = 'As senhas não coincidem.'
    valid = false
  }

  return valid
}

async function handleRegister() {
  serverError.value = ''
  if (!validate()) return

  loading.value = true
  try {
    const payload = {
      name: form.name.trim(),
      cnpj: form.cnpj.replace(/\D/g, ''),
      userName: form.userName.trim(),
      email: form.email.trim(),
      password: form.password
    }

    await authStore.register(payload)
  } catch (err) {
    const axiosErr = err as AxiosError<{ message: string | string[] }>
    if (axiosErr.response?.data?.message) {
      const msg = axiosErr.response.data.message
      serverError.value = Array.isArray(msg) ? msg.join(', ') : msg
    } else {
      serverError.value = 'Erro ao criar conta. Tente novamente mais tarde.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-card {
  width: 100%;
  max-width: 460px; /* Slightly wider to accommodate more fields better */
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  box-shadow: var(--card-shadow);
  backdrop-filter: blur(20px);
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  margin: 2rem 0;
}

.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.75rem;
}

.auth-brand-logo {
  --aylaflow-logo-width: 210px;
}

.subtitle {
  color: var(--text-muted);
  font-size: 0.9rem;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--input-bg);
  border: 1.5px solid var(--input-border);
  border-radius: 10px;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.input-wrapper:focus-within {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.input-wrapper.input-error {
  border-color: var(--error);
}

.input-icon {
  padding: 0 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.75rem 0.5rem 0.75rem 0;
  color: var(--text-primary);
  font-size: 0.95rem;
  font-family: inherit;
  min-width: 0;
}

input::placeholder {
  color: var(--text-muted);
}

input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-password {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0 0.75rem;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  transition: color 0.2s;
}

.toggle-password:hover {
  color: var(--text-primary);
}

.error-msg {
  font-size: 0.78rem;
  color: var(--error);
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 500;
}

.alert-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #f87171;
}

.btn-primary {
  width: 100%;
  padding: 0.85rem;
  border: none;
  border-radius: 10px;
  background: var(--gradient-brand);
  color: var(--text-on-brand);
  font-size: 0.95rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
  box-shadow: 0 4px 20px var(--brand-glow);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 48px;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.92;
  transform: translateY(-1px);
  box-shadow: 0 6px 28px var(--brand-glow);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}

.spinner {
  display: block;
  width: 20px;
  height: 20px;
  border: 2.5px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.footer-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: 0.875rem;
}

.text-muted {
  color: var(--text-muted);
}

.link {
  color: var(--brand-light);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s;
}

.link:hover {
  color: var(--brand-light);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

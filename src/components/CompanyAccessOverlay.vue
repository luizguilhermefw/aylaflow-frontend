<template>
  <div v-if="issue" class="company-access-backdrop">
    <section
      class="company-access-card"
      role="dialog"
      aria-modal="true"
      aria-labelledby="company-access-title"
      aria-describedby="company-access-description"
    >
      <div class="status-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M6 21V7l6-4 6 4v14"/><path d="M9 9h1"/><path d="M14 9h1"/><path d="M9 13h1"/><path d="M14 13h1"/><path d="M9 17h6"/></svg>
      </div>

      <span class="eyebrow">Acesso à empresa</span>
      <h1 id="company-access-title">{{ issue.title }}</h1>
      <p id="company-access-description">{{ issue.description }}</p>
      <p class="session-help">Sua sessão continua segura. Saia da conta para acessar com outro usuário.</p>

      <button ref="logoutButton" type="button" class="logout-button" @click="handleLogout">
        Sair da conta
      </button>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useAuthStore } from '@/store/auth.store'
import { isBlockingCompanyStatus } from '@/features/company-access/company-access.logic'
import {
  companyAccessIssue,
  clearCompanyAccessIssue,
} from '@/features/company-access/company-access.state'

const authStore = useAuthStore()
const issue = computed(() => (
  isBlockingCompanyStatus(companyAccessIssue.value) ? companyAccessIssue.value : null
))
const logoutButton = ref<HTMLButtonElement | null>(null)

async function focusLogoutButton() {
  await nextTick()
  logoutButton.value?.focus()
}

function handleLogout() {
  clearCompanyAccessIssue()
  authStore.logout()
}

watch(issue, (value) => {
  if (value) void focusLogoutButton()
}, { immediate: true, flush: 'post' })
</script>

<style scoped>
.company-access-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1000;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(7, 5, 16, 0.88);
  backdrop-filter: blur(10px);
}

.company-access-card {
  width: min(100%, 480px);
  padding: 2.25rem;
  color: var(--text-primary);
  background: var(--sidebar-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  box-shadow: var(--card-shadow);
  text-align: center;
}

.status-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.1);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 16px;
}

.eyebrow {
  color: var(--brand-light);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h1 {
  margin-top: 0.5rem;
  font-size: 1.45rem;
}

#company-access-description {
  margin-top: 0.75rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.6;
}

.session-help {
  margin-top: 1rem;
  color: var(--text-muted);
  font-size: 0.78rem;
  line-height: 1.5;
}

.logout-button {
  width: 100%;
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 10px;
  color: #fff;
  background: var(--gradient-brand);
  box-shadow: 0 4px 16px var(--brand-glow);
  font: inherit;
  font-size: 0.9rem;
  font-weight: 700;
  cursor: pointer;
}

.logout-button:hover {
  opacity: 0.92;
}

.logout-button:focus-visible {
  outline: 2px solid var(--brand-light);
  outline-offset: 3px;
}

@media (max-width: 520px) {
  .company-access-card {
    padding: 1.75rem 1.25rem;
  }
}
</style>

<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">AylaFlow</span>
      </div>

      <nav class="sidebar-nav" aria-label="Navegação principal">
        <RouterLink
          id="nav-dashboard"
          to="/dashboard"
          class="nav-item"
          exact-active-class="active"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Dashboard
        </RouterLink>
        <RouterLink
          id="nav-campaigns"
          to="/campaigns"
          class="nav-item"
          :class="{ active: route.name === 'campaigns' || route.name === 'campaign-detail' }"
          exact-active-class="active"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 11 18-5v12L3 14v-3Z"/><path d="M11.6 16.8 13 21H7l-1.8-6.2"/><path d="M8 9v6"/></svg>
          Campanhas
        </RouterLink>
        <RouterLink
          id="nav-automations"
          to="/automations"
          class="nav-item"
          exact-active-class="active"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Automações
        </RouterLink>
        <RouterLink
          id="nav-contacts"
          to="/contacts"
          class="nav-item"
          exact-active-class="active"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Contatos
        </RouterLink>
        <button id="nav-reports" type="button" class="nav-item nav-placeholder" aria-disabled="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
          Relatórios
        </button>
        <RouterLink
          id="nav-settings"
          to="/settings"
          class="nav-item"
          exact-active-class="active"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
          Configurações
        </RouterLink>

        <div v-if="authStore.isPlatformAdmin" class="admin-nav-section">
          <span class="nav-section-label">Administração</span>
          <RouterLink
            id="nav-admin-companies"
            to="/admin/companies"
            class="nav-item"
            exact-active-class="active"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M6 21V7l6-4 6 4v14"/><path d="M9 9h1"/><path d="M14 9h1"/><path d="M9 13h1"/><path d="M14 13h1"/></svg>
            Empresas
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button id="btn-logout" class="logout-btn" type="button" aria-label="Sair da conta" @click="handleLogout">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Sair
        </button>
      </div>
    </aside>

    <main class="main-content">
      <header class="topbar">
        <div>
          <h1 class="page-title">{{ title }}</h1>
          <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions && !showActivationGate" class="topbar-actions">
          <slot name="actions" />
        </div>
      </header>

      <CompanyActivationGate v-if="showActivationGate" />
      <div class="page-content" :hidden="showActivationGate">
        <slot />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/store/auth.store'
import CompanyActivationGate from '@/components/company-access/CompanyActivationGate.vue'
import { shouldShowCompanyActivationGate } from '@/features/company-access/company-access.logic'
import { companyAccessIssue } from '@/features/company-access/company-access.state'

defineProps<{
  title: string
  subtitle?: string
}>()

const authStore = useAuthStore()
const route = useRoute()
const showActivationGate = computed(() => shouldShowCompanyActivationGate(
  companyAccessIssue.value,
  route.name,
))

function handleLogout() {
  authStore.logout()
}

onMounted(() => {
  void authStore.ensureProfile().catch(() => {
    // O menu comum permanece disponível se o perfil não puder ser carregado.
  })
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--sidebar-bg);
  border-right: 1px solid var(--sidebar-border);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 0;
  position: fixed;
  height: 100vh;
  top: 0;
  left: 0;
  z-index: 10;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 1.25rem 1.75rem;
  border-bottom: 1px solid var(--sidebar-border);
}

.logo-icon {
  font-size: 1.4rem;
  filter: drop-shadow(0 0 6px #7c3aed88);
}

.logo-text {
  font-size: 1.2rem;
  font-weight: 800;
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 1.25rem 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.875rem;
  border-radius: 10px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: var(--nav-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--brand-subtle);
  color: var(--brand-light);
  font-weight: 600;
}

.nav-placeholder {
  width: 100%;
  border: none;
  background: none;
  font-family: inherit;
  text-align: left;
  cursor: default;
}

.admin-nav-section {
  margin-top: 0.75rem;
  padding-top: 1rem;
  border-top: 1px solid var(--sidebar-border);
}

.nav-section-label {
  display: block;
  padding: 0 0.875rem 0.45rem;
  color: var(--text-muted);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.sidebar-footer {
  padding: 1rem 0.75rem 0;
  border-top: 1px solid var(--sidebar-border);
}

.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.65rem 0.875rem;
  border: none;
  border-radius: 10px;
  background: none;
  color: var(--text-muted);
  font-size: 0.875rem;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}

.logout-btn:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #f87171;
}

.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.6rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
  margin: 0;
}

.page-subtitle {
  color: var(--text-muted);
  font-size: 0.875rem;
  margin-top: 0.3rem;
}

.topbar-actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.page-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-content[hidden] {
  display: none;
}
</style>

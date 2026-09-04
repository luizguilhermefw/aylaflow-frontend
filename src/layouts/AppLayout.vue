<template>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <AylaFlowLogo class="sidebar-brand-logo" />
      </div>

      <nav class="sidebar-nav" aria-label="Navegação principal">
        <RouterLink
          id="nav-dashboard"
          to="/dashboard"
          class="nav-item"
          exact-active-class="active"
        >
          <AppIcon name="dashboard" />
          Dashboard
        </RouterLink>
        <RouterLink
          id="nav-campaigns"
          to="/campaigns"
          class="nav-item"
          :class="{ active: route.name === 'campaigns' || route.name === 'campaign-detail' }"
          exact-active-class="active"
        >
          <AppIcon name="campaign" />
          Campanhas
        </RouterLink>
        <RouterLink
          id="nav-automations"
          to="/automations"
          class="nav-item"
          exact-active-class="active"
        >
          <AppIcon name="automation" />
          Automações
        </RouterLink>
        <RouterLink
          id="nav-contacts"
          to="/contacts"
          class="nav-item"
          exact-active-class="active"
        >
          <AppIcon name="contacts" />
          Contatos
        </RouterLink>
        <button id="nav-reports" type="button" class="nav-item nav-placeholder" aria-disabled="true">
          <AppIcon name="reports" />
          Relatórios
        </button>
        <RouterLink
          id="nav-settings"
          to="/settings"
          class="nav-item"
          exact-active-class="active"
        >
          <AppIcon name="settings" />
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
            <AppIcon name="company" />
            Empresas
          </RouterLink>
        </div>
      </nav>

      <div class="sidebar-footer">
        <button id="btn-logout" class="logout-btn" type="button" aria-label="Sair da conta" @click="handleLogout">
          <AppIcon name="logout" />
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
import AppIcon from '@/components/ui/AppIcon.vue'
import AylaFlowLogo from '@/components/ui/AylaFlowLogo.vue'
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
  justify-content: center;
  padding: 0 1.25rem 1.75rem;
  border-bottom: 1px solid var(--sidebar-border);
}

.sidebar-brand-logo {
  --aylaflow-logo-width: 154px;
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

.nav-item svg,
.logout-btn svg {
  flex-shrink: 0;
  color: currentColor;
}

.nav-item:hover {
  background: var(--nav-hover);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--brand-subtle);
  color: var(--nav-active-text);
  font-weight: 600;
}

.nav-item.active svg {
  color: var(--nav-active-icon);
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

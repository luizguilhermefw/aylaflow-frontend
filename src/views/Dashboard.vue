<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <span class="logo-icon">⚡</span>
        <span class="logo-text">AylaFlow</span>
      </div>

      <nav class="sidebar-nav" aria-label="Navegação principal">
        <a href="#" class="nav-item active" id="nav-dashboard" aria-current="page">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
          Dashboard
        </a>
        <a href="#" class="nav-item" id="nav-automations">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          Automações
        </a>
        <a href="#" class="nav-item" id="nav-contacts">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Contatos
        </a>
        <a href="#" class="nav-item" id="nav-reports">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
          Relatórios
        </a>
      </nav>

      <div class="sidebar-footer">
        <button id="btn-logout" class="logout-btn" @click="handleLogout" aria-label="Sair da conta">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>
          Sair
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="topbar">
        <div>
          <h1 class="page-title">Dashboard</h1>
          <p class="page-subtitle">Visão geral das suas automações</p>
        </div>
        <div class="topbar-actions">
          <button id="btn-new-automation" class="btn-action">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/></svg>
            Nova Automação
          </button>
        </div>
      </header>

      <!-- Welcome Banner -->
      <div class="welcome-banner">
        <div class="welcome-content">
          <div class="welcome-badge">✨ Bem-vindo ao AylaFlow</div>
          <h2 class="welcome-title">Reative seus clientes com automações inteligentes</h2>
          <p class="welcome-desc">Configure fluxos automáticos no WhatsApp e recupere clientes inativos com mensagens personalizadas no momento certo.</p>
          <button id="btn-start-automation" class="btn-start">Criar primeira automação</button>
        </div>
        <div class="welcome-illustration" aria-hidden="true">
          <div class="float-card fc1">
            <span>📲</span>
            <span>WhatsApp</span>
          </div>
          <div class="float-card fc2">
            <span>🤖</span>
            <span>Automação</span>
          </div>
          <div class="float-card fc3">
            <span>📈</span>
            <span>+43% conversão</span>
          </div>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="stats-grid">
        <div class="stat-card" id="stat-active">
          <div class="stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">0</span>
            <span class="stat-label">Automações ativas</span>
          </div>
        </div>

        <div class="stat-card" id="stat-contacts">
          <div class="stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">0</span>
            <span class="stat-label">Contatos importados</span>
          </div>
        </div>

        <div class="stat-card" id="stat-messages">
          <div class="stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">0</span>
            <span class="stat-label">Mensagens enviadas</span>
          </div>
        </div>

        <div class="stat-card" id="stat-conversion">
          <div class="stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
          </div>
          <div class="stat-data">
            <span class="stat-value">0%</span>
            <span class="stat-label">Taxa de reativação</span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div class="empty-state" id="empty-automations">
        <div class="empty-icon">🚀</div>
        <h3>Nenhuma automação criada ainda</h3>
        <p>Crie sua primeira automação e comece a recuperar clientes inativos automaticamente.</p>
        <button id="btn-create-first" class="btn-action">Criar automação</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/store/auth.store'

const authStore = useAuthStore()

function handleLogout() {
  authStore.logout()
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-primary);
}

/* ── Sidebar ── */
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

.logo-icon { font-size: 1.4rem; filter: drop-shadow(0 0 6px #7c3aed88); }
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

.sidebar-footer {
  padding: 0 0.75rem;
  border-top: 1px solid var(--sidebar-border);
  padding-top: 1rem;
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

/* ── Main ── */
.main-content {
  flex: 1;
  margin-left: 240px;
  padding: 2rem 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* ── Topbar ── */
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

.topbar-actions { display: flex; gap: 0.75rem; align-items: center; }

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.25rem;
  background: var(--gradient-brand);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px var(--brand-glow);
  transition: opacity 0.2s, transform 0.1s;
}

.btn-action:hover { opacity: 0.9; transform: translateY(-1px); }

/* ── Welcome Banner ── */
.welcome-banner {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 2.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.5s ease both;
}

.welcome-banner::before {
  content: '';
  position: absolute;
  top: -60px;
  right: -60px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, #7c3aed22, transparent 70%);
  pointer-events: none;
}

.welcome-badge {
  display: inline-block;
  padding: 0.3rem 0.875rem;
  background: var(--brand-subtle);
  color: var(--brand-light);
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 0.875rem;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1.3;
  margin: 0 0 0.75rem;
  max-width: 440px;
}

.welcome-desc {
  color: var(--text-muted);
  font-size: 0.9rem;
  line-height: 1.6;
  max-width: 420px;
  margin-bottom: 1.5rem;
}

.btn-start {
  padding: 0.75rem 1.5rem;
  background: var(--gradient-brand);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 20px var(--brand-glow);
  transition: opacity 0.2s, transform 0.1s;
}

.btn-start:hover { opacity: 0.9; transform: translateY(-1px); }

.welcome-illustration {
  position: relative;
  width: 200px;
  height: 130px;
  flex-shrink: 0;
}

.float-card {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: var(--float-card-bg);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 0.5rem 0.875rem;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary);
  backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  white-space: nowrap;
}

.fc1 { top: 0; left: 0; animation: floatA 4s ease-in-out infinite; }
.fc2 { top: 50px; right: 0; animation: floatB 4s ease-in-out infinite 0.7s; }
.fc3 { bottom: 0; left: 20px; animation: floatA 4s ease-in-out infinite 1.4s; }

/* ── Stats Grid ── */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.25rem;
  animation: fadeInUp 0.5s ease 0.1s both;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px rgba(0,0,0,0.2);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-icon.purple { background: rgba(124, 58, 237, 0.15); color: #a78bfa; }
.stat-icon.green  { background: rgba(34, 197, 94, 0.15);  color: #4ade80; }
.stat-icon.blue   { background: rgba(59, 130, 246, 0.15); color: #60a5fa; }
.stat-icon.orange { background: rgba(251, 146, 60, 0.15); color: #fb923c; }

.stat-data { display: flex; flex-direction: column; gap: 0.2rem; }
.stat-value { font-size: 1.75rem; font-weight: 800; color: var(--text-primary); line-height: 1; }
.stat-label { font-size: 0.8rem; color: var(--text-muted); font-weight: 500; }

/* ── Empty State ── */
.empty-state {
  background: var(--card-bg);
  border: 1px dashed var(--card-border);
  border-radius: 20px;
  padding: 3.5rem 2rem;
  text-align: center;
  animation: fadeInUp 0.5s ease 0.2s both;
}

.empty-icon { font-size: 3rem; margin-bottom: 1rem; }
.empty-state h3 { color: var(--text-primary); font-size: 1.1rem; margin-bottom: 0.5rem; }
.empty-state p { color: var(--text-muted); font-size: 0.875rem; max-width: 380px; margin: 0 auto 1.5rem; line-height: 1.6; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes floatA {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes floatB {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(8px); }
}
</style>

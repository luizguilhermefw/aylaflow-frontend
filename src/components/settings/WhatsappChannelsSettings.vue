<template>
  <section class="channels-section" aria-labelledby="whatsapp-channels-title">
    <div class="section-heading">
      <div class="section-title-group">
        <span class="section-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
        </span>
        <div>
          <h2 id="whatsapp-channels-title">Canais WhatsApp</h2>
          <p>Consulte a conexão de cada canal e defina quais podem participar dos envios.</p>
        </div>
      </div>
      <span v-if="state.data" class="usage-badge">
        {{ channelUsageLabel }}
      </span>
    </div>

    <p v-if="channelEntitlementNotice" class="entitlement-notice">
      {{ channelEntitlementNotice }}
    </p>

    <div v-if="state.successMessage" class="success-feedback" role="status" aria-live="polite">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
      {{ state.successMessage }}
    </div>

    <div v-if="state.loading" class="channels-state" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando canais WhatsApp...</p>
    </div>

    <div v-else-if="state.loadError" class="channels-state error-state" role="alert">
      <span class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </span>
      <h3>Não foi possível carregar os canais WhatsApp.</h3>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn-primary" @click="loadChannels">Tentar novamente</button>
    </div>

    <div v-else-if="state.data?.channels.length === 0" class="channels-state empty-state">
      <span class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>
      </span>
      <h3>Nenhum canal WhatsApp configurado.</h3>
      <p>Quando um canal for disponibilizado, ele aparecerá aqui.</p>
    </div>

    <template v-else-if="state.data">
      <p v-if="state.actionError" class="action-error" role="alert">{{ state.actionError }}</p>
      <p v-if="profileLoading" class="permission-note">Verificando permissões...</p>
      <p v-else-if="!canEdit" class="permission-note readonly-note">
        Somente proprietários e gestores podem alterar o routing. Seu acesso é somente leitura.
      </p>

      <div class="channels-grid">
        <article v-for="(channel, index) in state.data.channels" :key="channel.id" class="channel-card">
          <div class="card-heading">
            <div>
              <span class="channel-kicker">Canal da empresa</span>
              <h3>{{ whatsappChannelLabel(index) }}</h3>
              <p class="channel-phone">{{ formatConnectedPhoneForDisplay(channel.connectedPhone) }}</p>
            </div>
            <span class="routing-badge" :class="channel.isActive ? 'active' : 'inactive'">
              <span class="status-dot" aria-hidden="true" />
              {{ whatsappRoutingLabel(channel.isActive) }}
            </span>
          </div>

          <dl class="channel-details">
            <div>
              <dt>Estado técnico</dt>
              <dd>
                <span class="connection-badge" :class="connectionTone(channel.connectionStatus)">
                  {{ whatsappConnectionStatusLabel(channel.connectionStatus) }}
                </span>
              </dd>
            </div>
            <div>
              <dt>Participação nos envios</dt>
              <dd>{{ whatsappRoutingDescription(channel.isActive) }}</dd>
            </div>
          </dl>

          <p
            v-if="state.syncingChannelIds.includes(channel.id)"
            class="connection-sync-state"
            role="status"
          >
            Atualizando conexão...
          </p>
          <p
            v-else-if="state.connectionSyncErrors[channel.id]"
            class="connection-sync-error"
            role="status"
          >
            {{ state.connectionSyncErrors[channel.id] }}
          </p>

          <p
            v-if="shouldShowUnconfirmedConnectionNotice(channel)"
            class="connection-warning"
          >
            O canal está habilitado para envios, mas a conexão com o WhatsApp não está confirmada.
          </p>

          <p
            v-if="!channel.isActive && channel.connectionStatus !== 'CONNECTED'"
            class="connection-note"
          >
            O canal precisa estar conectado para que o routing possa ser ativado.
          </p>

          <div class="channel-actions">
            <div class="connection-actions">
              <button
                type="button"
                class="status-button"
                :disabled="connectionActionDisabled(channel)"
                @click="refreshConnection(channel)"
              >
                {{ state.syncingChannelIds.includes(channel.id) ? 'Atualizando...' : 'Atualizar status' }}
              </button>
              <button
                v-if="canReconnectWhatsapp(channel)"
                type="button"
                class="reconnect-button"
                :disabled="reconnectDisabled"
                @click="reconnectWhatsapp(channel)"
              >
                Reconectar WhatsApp
              </button>
            </div>

            <button
              type="button"
              class="routing-button"
              :class="channel.isActive ? 'deactivate' : 'activate'"
              :disabled="routingDisabled(channel)"
              :aria-describedby="!channel.isActive && channel.connectionStatus !== 'CONNECTED' ? `channel-note-${channel.id}` : undefined"
              @click="toggleRouting(channel)"
            >
              <span v-if="state.updatingChannelId === channel.id" class="button-spinner" aria-hidden="true" />
              {{ state.updatingChannelId === channel.id
                ? 'Salvando...'
                : channel.isActive ? 'Desativar routing' : 'Ativar routing' }}
            </button>
          </div>
          <span
            v-if="!channel.isActive && channel.connectionStatus !== 'CONNECTED'"
            :id="`channel-note-${channel.id}`"
            class="sr-only"
          >Canal não conectado.</span>
        </article>
      </div>
    </template>
  </section>

  <WhatsappQrModal
    :open="state.qrChannelId !== null"
    :channel-label="qrChannelLabel"
    :mode="state.connectionMode"
    :image-source="qrImageSource"
    :qr-loading="state.qrLoading"
    :qr-error="state.qrError"
    :connected="state.qrConnected"
    :checking-connection="Boolean(state.qrCode || state.pairingCode) && !state.qrConnected"
    :method-locked="connectionMethodLocked"
    :pairing-phone="state.pairingPhone"
    :pairing-code="state.pairingCode"
    :pairing-loading="state.pairingLoading"
    :pairing-error="state.pairingError"
    :copy-message="state.pairingCopyMessage"
    :copy-error="state.pairingCopyError"
    @close="controller.closeReconnectModal"
    @change-mode="changeConnectionMode"
    @update:pairing-phone="controller.setPairingPhone"
    @generate-pairing="controller.requestPairingCode"
    @copy-code="controller.copyPairingCode"
    @generate-qr="generateQrCode"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive } from 'vue'
import WhatsappQrModal from '@/components/settings/WhatsappQrModal.vue'
import {
  canChangeWhatsappChannelRouting,
  canManageWhatsappChannels,
  canReconnectWhatsapp,
  createWhatsappChannelController,
  emptyWhatsappChannelState,
  formatConnectedPhoneForDisplay,
  shouldShowUnconfirmedConnectionNotice,
  whatsappChannelLabel,
  whatsappChannelEntitlementNotice,
  whatsappConnectionStatusLabel,
  whatsappChannelUsageLabel,
  whatsappRoutingDescription,
  whatsappRoutingLabel,
  whatsappQrImageSource,
} from '@/features/whatsapp-channels/whatsapp-channel.logic'
import type { WhatsappConnectionMode } from '@/features/whatsapp-channels/whatsapp-channel.logic'
import { whatsappChannelService } from '@/services/whatsapp-channel.service'
import type {
  WhatsappChannel,
  WhatsappConnectionStatus,
} from '@/services/whatsapp-channel.service'

const props = defineProps<{
  role?: string | null
  profileLoading: boolean
}>()

const state = reactive(emptyWhatsappChannelState())
const controller = createWhatsappChannelController(whatsappChannelService, state)
const canEdit = computed(() => canManageWhatsappChannels(props.role))
const reconnectDisabled = computed(() => (
  props.profileLoading || !canEdit.value || state.qrLoading || state.pairingLoading
))
const connectionMethodLocked = computed(() => (
  state.qrLoading
  || state.pairingLoading
  || Boolean(state.qrCode)
  || Boolean(state.pairingCode)
))
const channelUsageLabel = computed(() => (
  state.data ? whatsappChannelUsageLabel(state.data) : ''
))
const channelEntitlementNotice = computed(() => (
  state.data ? whatsappChannelEntitlementNotice(state.data) : null
))
const qrChannelLabel = computed(() => {
  const index = state.data?.channels.findIndex((channel) => channel.id === state.qrChannelId) ?? -1
  return index >= 0 ? whatsappChannelLabel(index) : 'Canal WhatsApp'
})
const qrImageSource = computed(() => whatsappQrImageSource(state.qrCode))

function loadChannels() {
  void controller.load()
}

function routingDisabled(channel: WhatsappChannel): boolean {
  return state.updatingChannelId !== null
    || props.profileLoading
    || !canChangeWhatsappChannelRouting(channel, props.role)
}

function connectionActionDisabled(channel: WhatsappChannel): boolean {
  return props.profileLoading
    || !canEdit.value
    || state.syncingChannelIds.includes(channel.id)
}

function refreshConnection(channel: WhatsappChannel) {
  if (connectionActionDisabled(channel)) return
  void controller.syncChannelConnection(channel.id)
}

function reconnectWhatsapp(channel: WhatsappChannel) {
  if (reconnectDisabled.value || !canReconnectWhatsapp(channel)) return
  void controller.openReconnectModal(channel, props.role)
}

function generateQrCode() {
  if (state.qrChannelId) void controller.requestQrCode(state.qrChannelId)
}

function changeConnectionMode(mode: WhatsappConnectionMode) {
  void controller.switchConnectionMode(mode)
}

function toggleRouting(channel: WhatsappChannel) {
  if (routingDisabled(channel)) return
  void controller.updateRouting(channel, !channel.isActive, props.role)
}

function connectionTone(status: WhatsappConnectionStatus): string {
  if (status === 'CONNECTED') return 'connected'
  if (status === 'ERROR') return 'error'
  return 'neutral'
}

onMounted(loadChannels)
onUnmounted(controller.dispose)
</script>

<style scoped>
.channels-section { padding: 1.5rem; background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 18px; box-shadow: var(--card-shadow); }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1.5rem; }
.section-title-group { display: flex; align-items: flex-start; gap: 1rem; }
.section-icon { width: 48px; height: 48px; flex-shrink: 0; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 13px; }
.section-heading h2 { color: var(--text-primary); font-size: 1.05rem; }
.section-heading p { max-width: 620px; margin-top: .35rem; color: var(--text-muted); font-size: .82rem; line-height: 1.55; }
.usage-badge { flex-shrink: 0; padding: .35rem .6rem; color: var(--text-secondary); background: var(--input-bg); border: 1px solid var(--card-border); border-radius: 999px; font-size: .7rem; font-weight: 600; }
.entitlement-notice { margin-top: 1rem; padding-left: .7rem; color: var(--text-muted); border-left: 2px solid var(--card-border); font-size: .74rem; line-height: 1.5; }
.success-feedback { margin-top: 1.25rem; padding: .8rem .9rem; display: flex; align-items: center; gap: .625rem; color: var(--success); background: rgba(34,197,94,.1); border: 1px solid rgba(34,197,94,.25); border-radius: 11px; font-size: .8rem; font-weight: 500; }
.channels-state { min-height: 180px; margin-top: 1.25rem; padding: 2rem; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; background: var(--bg-primary); border: 1px dashed var(--card-border); border-radius: 14px; }
.channels-state h3 { margin-top: .8rem; color: var(--text-primary); font-size: .95rem; }
.channels-state p { max-width: 390px; margin-top: .35rem; color: var(--text-muted); font-size: .78rem; line-height: 1.5; }
.state-icon { width: 48px; height: 48px; display: grid; place-items: center; color: var(--brand-light); background: var(--brand-subtle); border-radius: 13px; }
.error-state .state-icon { color: var(--error); background: rgba(239,68,68,.1); }
.channels-state .btn-primary { margin-top: 1rem; }
.spinner { width: 28px; height: 28px; border: 3px solid var(--card-border); border-top-color: var(--brand); border-radius: 50%; animation: spin .75s linear infinite; }
.action-error { margin-top: 1.25rem; padding: .75rem .9rem; color: var(--error); background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.2); border-radius: 10px; font-size: .8rem; }
.permission-note { margin-top: 1.1rem; color: var(--text-muted); font-size: .76rem; }
.readonly-note { padding-left: .7rem; border-left: 2px solid var(--card-border); }
.channels-grid { margin-top: 1.25rem; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 520px)); justify-content: start; gap: 1rem; }
.channel-card { padding: 1.15rem; display: flex; flex-direction: column; background: var(--bg-primary); border: 1px solid var(--card-border); border-radius: 14px; }
.card-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: .8rem; }
.channel-kicker { color: var(--brand-light); font-size: .62rem; font-weight: 700; letter-spacing: .05em; text-transform: uppercase; }
.channel-card h3 { margin-top: .2rem; color: var(--text-primary); font-size: .95rem; }
.channel-phone { margin-top: .2rem; color: var(--text-muted); font-size: .72rem; }
.routing-badge, .connection-badge { display: inline-flex; align-items: center; gap: .35rem; padding: .3rem .5rem; border-radius: 999px; font-size: .65rem; font-weight: 700; }
.routing-badge.active { color: var(--success); background: rgba(34,197,94,.1); }
.routing-badge.inactive { color: var(--text-muted); background: var(--input-bg); }
.status-dot { width: 6px; height: 6px; flex-shrink: 0; background: currentColor; border-radius: 50%; }
.channel-details { margin-top: 1rem; display: grid; gap: .65rem; }
.channel-details div { padding-top: .65rem; display: grid; gap: .3rem; border-top: 1px solid var(--card-border); }
.channel-details dt { color: var(--text-muted); font-size: .68rem; }
.channel-details dd { color: var(--text-secondary); font-size: .75rem; font-weight: 500; overflow-wrap: anywhere; }
.connection-badge.connected { color: var(--success); background: rgba(34,197,94,.08); }
.connection-badge.error { color: var(--error); background: rgba(239,68,68,.08); }
.connection-badge.neutral { color: var(--text-secondary); background: var(--input-bg); }
.connection-sync-state, .connection-sync-error { margin-top: .85rem; padding-left: .65rem; border-left: 2px solid var(--card-border); font-size: .7rem; line-height: 1.45; }
.connection-sync-state { color: var(--text-muted); }
.connection-sync-error { color: var(--error); }
.connection-warning { margin-top: .85rem; padding: .65rem .75rem; color: var(--text-secondary); background: var(--input-bg); border-left: 2px solid var(--text-muted); border-radius: 8px; font-size: .7rem; line-height: 1.45; }
.connection-note { margin-top: .85rem; color: var(--text-muted); font-size: .7rem; line-height: 1.45; }
.channel-actions { margin-top: auto; padding-top: .9rem; display: grid; gap: .65rem; }
.connection-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.status-button, .reconnect-button, .routing-button { padding: .62rem .75rem; border-radius: 9px; font: inherit; font-size: .75rem; font-weight: 600; cursor: pointer; }
.status-button { flex: 1; color: var(--text-secondary); background: transparent; border: 1px solid var(--card-border); }
.reconnect-button { flex: 1; color: var(--brand-light); background: var(--brand-subtle); border: 1px solid rgba(139,92,246,.3); }
.routing-button { width: 100%; display: inline-flex; align-items: center; justify-content: center; }
.routing-button.activate { color: var(--brand-light); background: var(--brand-subtle); border: 1px solid rgba(139,92,246,.3); }
.routing-button.deactivate { color: var(--text-secondary); background: transparent; border: 1px solid var(--card-border); }
.status-button:disabled, .reconnect-button:disabled, .routing-button:disabled { cursor: not-allowed; opacity: .5; }
.btn-primary { padding: .65rem 1rem; color: #fff; background: var(--gradient-brand); border: none; border-radius: 10px; font: inherit; font-size: .8rem; font-weight: 600; cursor: pointer; }
.button-spinner { width: 14px; height: 14px; margin-right: .45rem; border: 2px solid var(--card-border); border-top-color: currentColor; border-radius: 50%; animation: spin .7s linear infinite; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 680px) { .section-heading { flex-direction: column; } .section-title-group { flex-direction: column; } .usage-badge { align-self: flex-start; } }
</style>

<template>
  <AppLayout
    :title="campaign?.name ?? 'Campanha'"
    subtitle="Prepare o conteúdo e o público antes do envio"
  >
    <template #actions>
      <RouterLink to="/campaigns" class="back-link">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="19" x2="5" y1="12" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        Voltar para campanhas
      </RouterLink>
    </template>

    <section v-if="loading" class="state-card" role="status" aria-live="polite">
      <span class="spinner" aria-hidden="true" />
      <p>Carregando campanha...</p>
    </section>

    <section v-else-if="loadError" class="state-card error-state" role="alert">
      <div class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
      </div>
      <h2>Não foi possível carregar a campanha.</h2>
      <p>Verifique sua conexão e tente novamente.</p>
      <button type="button" class="btn-primary" @click="loadCampaign">Tentar novamente</button>
    </section>

    <section v-else-if="!campaign" class="state-card not-found-state">
      <div class="state-icon" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><line x1="11" x2="11" y1="8" y2="14"/></svg>
      </div>
      <h2>Campanha não encontrada.</h2>
      <p>Ela pode não estar disponível ou não pertencer ao tipo campanha.</p>
      <RouterLink to="/campaigns" class="btn-primary">Voltar para campanhas</RouterLink>
    </section>

    <div v-else class="composer">
      <section v-if="!campaign.isActive" class="inactive-warning" role="status">
        <span aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
        </span>
        <div>
          <strong>Esta campanha está inativa.</strong>
          <p>Reative a campanha para preparar novos envios.</p>
        </div>
      </section>

      <section v-if="dispatchResult" class="success-card" role="status" aria-live="polite">
        <div class="success-heading">
          <span class="success-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </span>
          <div>
            <h2>Campanha preparada com sucesso.</h2>
            <p>O processamento continuará de forma assíncrona. Para realizar um novo envio, crie uma nova campanha.</p>
          </div>
        </div>
        <dl class="result-metrics">
          <div>
            <dt>Clientes elegíveis</dt>
            <dd>{{ dispatchResult.eligibleCustomers }}</dd>
          </div>
          <div>
            <dt>Processados</dt>
            <dd>{{ dispatchResult.processed }}</dd>
          </div>
        </dl>
      </section>

      <section class="composer-card" aria-labelledby="content-heading">
        <div class="card-heading">
          <span class="step-number">1</span>
          <div>
            <h2 id="content-heading">{{ messageType === 'TEXT' ? 'Mensagem' : 'Imagem da campanha' }}</h2>
            <p>Escolha o formato e prepare o conteúdo da campanha.</p>
          </div>
        </div>

        <div class="channel-field form-field">
          <label for="campaign-whatsapp-channel">Canal WhatsApp</label>
          <select
            id="campaign-whatsapp-channel"
            v-model="selectedMessagingChannelId"
            :disabled="channelSelectionDisabled"
            :aria-invalid="channelTouched && Boolean(channelConfigurationError)"
            aria-describedby="campaign-whatsapp-channel-help"
            @blur="channelTouched = true"
            @change="handleChannelChange"
          >
            <option value="" disabled>Selecione um canal</option>
            <option
              v-for="option in channelOptions"
              :key="option.id"
              :value="option.id"
              :disabled="option.disabled"
            >
              {{ option.label }}
            </option>
          </select>
          <span
            id="campaign-whatsapp-channel-help"
            :class="displayedChannelError ? 'field-error channel-help' : 'channel-help'"
            aria-live="polite"
          >
            {{ displayedChannelError || channelHint }}
          </span>
          <button
            v-if="channelsLoadError"
            type="button"
            class="retry-channels-button"
            :disabled="sending || previewingAudience || channelsLoading || Boolean(dispatchResult)"
            @click="loadWhatsappChannels"
          >
            Tentar carregar canais novamente
          </button>
        </div>

        <div class="message-type-selector" role="radiogroup" aria-label="Tipo de mensagem">
          <button
            type="button"
            class="type-option"
            :class="{ selected: messageType === 'TEXT' }"
            role="radio"
            :aria-checked="messageType === 'TEXT'"
            :disabled="sending || Boolean(dispatchResult)"
            @click="setMessageType('TEXT')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <span>
              <strong>Texto</strong>
              <small>Mensagem personalizada</small>
            </span>
          </button>
          <button
            type="button"
            class="type-option"
            :class="{ selected: messageType === 'IMAGE' }"
            role="radio"
            :aria-checked="messageType === 'IMAGE'"
            :disabled="sending || Boolean(dispatchResult)"
            @click="setMessageType('IMAGE')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
            <span>
              <strong>Imagem</strong>
              <small>JPG ou PNG com legenda</small>
            </span>
          </button>
        </div>

        <div v-if="messageType === 'TEXT'" class="form-field">
          <label for="campaign-message">Mensagem</label>
          <textarea
            id="campaign-message"
            v-model="message"
            rows="8"
            maxlength="2000"
            placeholder="Olá, {{nome}}! Temos uma novidade para você."
            :disabled="sending || Boolean(dispatchResult)"
            :aria-invalid="messageTouched && Boolean(messageValidationError)"
            aria-describedby="message-error message-counter"
            @blur="messageTouched = true"
            @input="handleComposerInput"
          />
          <div class="field-meta">
            <span id="message-error" class="field-error" aria-live="polite">
              {{ messageTouched ? messageValidationError : '' }}
            </span>
            <span id="message-counter" class="character-counter">{{ message.length }}/2000</span>
          </div>
          <p class="personalization-help">Use <code v-pre>{{nome}}</code> para personalização. A substituição será feita pelo backend.</p>
        </div>

        <div v-else class="image-fields">
          <CampaignImageUpload
            :model-value="imageFile"
            :disabled="sending || !campaign.isActive || Boolean(dispatchResult)"
            :error="displayedImageError"
            @update:model-value="handleImageFileChange"
            @validation-error="handleImageValidationError"
            @preview-url="imagePreviewUrl = $event"
          />

          <div class="form-field">
            <label for="campaign-caption">Legenda <span>(opcional)</span></label>
            <textarea
              id="campaign-caption"
              v-model="caption"
              rows="5"
              maxlength="2000"
              placeholder="Olá, {{nome}}! Confira esta novidade."
              :disabled="sending || Boolean(dispatchResult)"
              aria-describedby="caption-counter caption-help"
              @input="handleComposerInput"
            />
            <div class="field-meta">
              <span id="caption-help" class="caption-help">Use <code v-pre>{{nome}}</code> para personalização.</span>
              <span id="caption-counter" class="character-counter">{{ caption.length }}/2000</span>
            </div>
          </div>
        </div>
      </section>

      <section class="composer-card" aria-labelledby="audience-heading">
        <div class="card-heading">
          <span class="step-number">2</span>
          <div>
            <h2 id="audience-heading">Público</h2>
            <p>Defina quem poderá receber esta campanha.</p>
          </div>
        </div>

        <CampaignAudienceSelector
          :audience-type="audienceType"
          :customers="customers"
          :selected-customer-ids="selectedCustomerIds"
          :segment-filters="segmentFilters"
          :preview="audiencePreview"
          :previewing="previewingAudience"
          :preview-error="previewError"
          :preview-disabled="!campaign.isActive || Boolean(channelSendEligibilityError)"
          :loading="customersLoading"
          :error="customersError"
          :validation-error="displayedAudienceError"
          :disabled="sending || previewingAudience || Boolean(dispatchResult)"
          @update:audience-type="setAudienceType"
          @update:selected-customer-ids="setSelectedCustomerIds"
          @update:segment-filters="setSegmentFilters"
          @preview="previewAudience"
          @retry="loadCustomers"
        />
      </section>

      <section class="composer-card" aria-labelledby="review-heading">
        <div class="card-heading">
          <span class="step-number">3</span>
          <div>
            <h2 id="review-heading">Revisão</h2>
            <p>Confira os dados antes de preparar o envio.</p>
          </div>
        </div>

        <dl class="review-list">
          <div>
            <dt>Campanha</dt>
            <dd>{{ campaign.name }}</dd>
          </div>
          <div>
            <dt>Tipo</dt>
            <dd>{{ messageType === 'TEXT' ? 'Texto' : 'Imagem' }}</dd>
          </div>
          <div>
            <dt>Canal WhatsApp</dt>
            <dd>{{ selectedChannelLabel }}</dd>
          </div>
          <div>
            <dt>Público</dt>
            <dd>{{ audienceSummary }}</dd>
          </div>
          <div v-if="audiencePreview">
            <dt>Prévia do público</dt>
            <dd>{{ audiencePreview.eligible }} elegíveis · {{ audiencePreview.blocked }} bloqueados</dd>
          </div>
        </dl>

        <div v-if="messageType === 'TEXT'" class="message-preview">
          <span>Preview da mensagem</span>
          <p>{{ message.trim() || 'Sua mensagem aparecerá aqui.' }}</p>
        </div>

        <div v-else class="image-review">
          <img
            v-if="imagePreviewUrl && imageFile"
            :src="imagePreviewUrl"
            :alt="`Prévia da imagem ${imageFile.name}`"
          />
          <div class="image-review-details">
            <span>Imagem selecionada</span>
            <strong>{{ imageFile?.name || 'Nenhuma imagem selecionada' }}</strong>
            <p v-if="caption.trim()">{{ caption.trim() }}</p>
            <p v-else class="empty-caption">Sem legenda</p>
          </div>
        </div>
      </section>

      <div class="composer-actions">
        <div>
          <p>O envio só será preparado após sua confirmação.</p>
          <p v-if="dispatchError && !confirmModalOpen" class="dispatch-error" role="alert">
            {{ dispatchError }}
          </p>
        </div>
        <button
          type="button"
          class="btn-primary send-button"
          :disabled="sending || !campaign.isActive || Boolean(channelSendEligibilityError) || Boolean(dispatchResult)"
          @click="openConfirmModal"
        >
          {{ dispatchResult ? 'Campanha preparada' : campaign.isActive ? 'Enviar campanha' : 'Campanha inativa' }}
        </button>
      </div>
    </div>
  </AppLayout>

  <div v-if="confirmModalOpen" class="modal-backdrop" @click.self="closeConfirmModal">
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dispatch-title"
    >
      <div class="modal-heading">
        <span class="modal-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </span>
        <div>
          <h2 id="confirm-dispatch-title">Confirmar envio</h2>
          <p>{{ confirmationDescription }}</p>
        </div>
      </div>

      <dl class="confirmation-list">
        <div>
          <dt>Campanha</dt>
          <dd>{{ campaign?.name }}</dd>
        </div>
        <div>
          <dt>Público</dt>
          <dd>{{ audienceSummary }}</dd>
        </div>
        <div>
          <dt>Tipo</dt>
          <dd>{{ messageType === 'TEXT' ? 'Texto' : 'Imagem' }}</dd>
        </div>
        <div>
          <dt>Canal WhatsApp</dt>
          <dd>{{ selectedChannelLabel }}</dd>
        </div>
        <div v-if="audiencePreview">
          <dt>Prévia do público</dt>
          <dd>{{ audiencePreview.eligible }} elegíveis · {{ audiencePreview.blocked }} bloqueados</dd>
        </div>
      </dl>

      <p v-if="dispatchError" class="dispatch-error" role="alert">{{ dispatchError }}</p>

      <div class="modal-actions">
        <button type="button" class="btn-cancel" :disabled="sending" @click="closeConfirmModal">
          Cancelar
        </button>
        <button
          ref="confirmButton"
          type="button"
          class="btn-primary"
          :disabled="sending"
          @click="confirmDispatch"
        >
          <span v-if="sending" class="button-spinner" aria-hidden="true" />
          {{ sending ? (uploading ? 'Enviando imagem...' : 'Preparando...') : 'Confirmar envio' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import CampaignAudienceSelector from '@/components/campaign/CampaignAudienceSelector.vue'
import CampaignImageUpload from '@/components/campaign/CampaignImageUpload.vue'
import {
  campaignAllowsPreparation,
} from '@/features/campaigns/campaign-lifecycle.logic'
import {
  automationService,
  type Automation,
  type CampaignDispatchPayload,
  type CampaignDispatchResponse,
} from '@/services/automation.service'
import {
  buildCampaignAudience,
  buildCampaignAudiencePreview,
  buildCampaignAudienceUpdate,
  persistCampaignChannel,
  campaignAudienceFingerprint,
  campaignAudienceSummary,
  campaignChannelConfigurationError,
  campaignChannelSendEligibilityError,
  campaignPreviewError,
  emptyCampaignSegmentForm,
  hydrateCampaignAudience,
  isCampaignAudiencePersisted,
  isCampaignPreviewCurrent,
  shouldPersistAllEligible,
  validateCampaignSegmentation,
} from '@/features/campaigns/campaign.logic'
import type {
  CampaignAudiencePreviewState,
  CampaignAudienceType,
  CampaignSegmentForm,
} from '@/features/campaigns/campaign.types'
import { customerService, type Customer } from '@/services/customer.service'
import { mediaAssetService } from '@/services/media-asset.service'
import {
  whatsappChannelService,
  type WhatsappChannel,
} from '@/services/whatsapp-channel.service'
import {
  configuredWhatsappChannelLabel,
  eligibleWhatsappChannels,
  whatsappChannelSelectionOptions,
} from '@/features/whatsapp-channels/whatsapp-channel.logic'

type CampaignMessageType = 'TEXT' | 'IMAGE'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png']

const route = useRoute()

const campaign = ref<Automation | null>(null)
const loading = ref(true)
const loadError = ref(false)
const audienceType = ref<CampaignAudienceType>('ALL_ELIGIBLE')
const customers = ref<Customer[]>([])
const customersLoading = ref(false)
const customersError = ref(false)
const customersRequested = ref(false)
const selectedCustomerIds = ref<string[]>([])
const segmentFilters = ref<CampaignSegmentForm>(emptyCampaignSegmentForm())
const audienceTouched = ref(false)
const audiencePreviewState = ref<CampaignAudiencePreviewState | null>(null)
const previewingAudience = ref(false)
const previewError = ref('')
const messageType = ref<CampaignMessageType>('TEXT')
const message = ref('')
const messageTouched = ref(false)
const caption = ref('')
const imageFile = ref<File | null>(null)
const imageTouched = ref(false)
const imageSelectionError = ref('')
const imagePreviewUrl = ref('')
const uploadedMediaAssetId = ref<string | null>(null)
const confirmModalOpen = ref(false)
const confirmButton = ref<HTMLButtonElement | null>(null)
const sending = ref(false)
const uploading = ref(false)
const dispatchError = ref('')
const dispatchResult = ref<CampaignDispatchResponse | null>(null)
const whatsappChannels = ref<WhatsappChannel[]>([])
const channelsLoading = ref(false)
const channelsLoadError = ref(false)
const selectedMessagingChannelId = ref('')
const channelTouched = ref(false)
const channelError = ref('')
let channelsLoadGeneration = 0

const messageValidationError = computed(() => {
  const content = message.value.trim()

  if (!content) return 'A mensagem é obrigatória.'
  if (content.length > 2000) return 'A mensagem deve ter no máximo 2000 caracteres.'

  return ''
})

const imageValidationError = computed(() => {
  if (imageSelectionError.value) return imageSelectionError.value
  if (!imageFile.value) return 'Selecione uma imagem JPG ou PNG.'
  if (imageFile.value.size === 0) return 'A imagem selecionada está vazia.'
  if (!ALLOWED_IMAGE_TYPES.includes(imageFile.value.type)) return 'Selecione uma imagem JPG ou PNG.'
  if (imageFile.value.size > MAX_IMAGE_SIZE) return 'A imagem deve ter no máximo 5 MB.'

  return ''
})

const displayedImageError = computed(() => {
  if (imageSelectionError.value) return imageSelectionError.value
  return imageTouched.value ? imageValidationError.value : ''
})

const currentContentInvalid = computed(() => (
  messageType.value === 'TEXT'
    ? Boolean(messageValidationError.value)
    : Boolean(imageValidationError.value)
))

const audienceValidationError = computed(() => {
  if (audienceType.value === 'CUSTOMER_IDS' && selectedCustomerIds.value.length === 0) {
    return 'Selecione pelo menos um cliente.'
  }
  if (audienceType.value === 'SEGMENTED') {
    return validateCampaignSegmentation(segmentFilters.value)
  }
  return ''
})

const displayedAudienceError = computed(() => (
  audienceTouched.value ? audienceValidationError.value : ''
))

const activeWhatsappChannels = computed(() => eligibleWhatsappChannels(whatsappChannels.value))
const channelOptions = computed(() => whatsappChannelSelectionOptions(
  whatsappChannels.value,
  campaign.value?.messagingChannelId ?? null,
))
const channelSelectionDisabled = computed(() => (
  sending.value
  || previewingAudience.value
  || Boolean(dispatchResult.value)
  || channelsLoading.value
  || channelsLoadError.value
  || activeWhatsappChannels.value.length === 0
))
const channelConfigurationError = computed(() => {
  if (channelsLoadError.value) return 'Não foi possível carregar os canais WhatsApp.'
  if (channelsLoading.value) return 'Aguarde o carregamento dos canais WhatsApp.'
  return campaignChannelConfigurationError(
    selectedMessagingChannelId.value,
    campaign.value?.messagingChannelId ?? null,
    whatsappChannels.value,
  )
})
const channelSendEligibilityError = computed(() => {
  if (channelsLoadError.value) return 'Não foi possível carregar os canais WhatsApp.'
  if (channelsLoading.value) return 'Aguarde o carregamento dos canais WhatsApp.'
  return campaignChannelSendEligibilityError(
    selectedMessagingChannelId.value,
    campaign.value?.messagingChannelId ?? null,
    whatsappChannels.value,
  )
})
const displayedChannelError = computed(() => (
  channelError.value || (channelTouched.value ? channelConfigurationError.value : '')
))
const channelHint = computed(() => {
  if (channelsLoading.value) return 'Carregando canais WhatsApp...'
  if (channelsLoadError.value) return 'Os canais estão indisponíveis no momento.'
  if (channelSendEligibilityError.value) return channelSendEligibilityError.value
  if (activeWhatsappChannels.value.length === 0) return 'Não há canal habilitado para envios.'
  return 'Somente canais com routing ativo estão disponíveis para nova seleção.'
})
const selectedChannelLabel = computed(() => {
  if (channelsLoadError.value && selectedMessagingChannelId.value) {
    return 'Canal configurado — dados indisponíveis'
  }
  return configuredWhatsappChannelLabel(
    selectedMessagingChannelId.value || null,
    whatsappChannels.value,
  )
})

const currentAudienceFingerprint = computed(() => campaignAudienceFingerprint(
  audienceType.value,
  selectedCustomerIds.value,
  segmentFilters.value,
  selectedMessagingChannelId.value || null,
))

const audiencePreviewIsCurrent = computed(() => isCampaignPreviewCurrent(
  audiencePreviewState.value,
  currentAudienceFingerprint.value,
))

const audiencePreview = computed(() => (
  audiencePreviewIsCurrent.value ? audiencePreviewState.value?.response ?? null : null
))

const audienceSummary = computed(() => campaignAudienceSummary(
  audienceType.value,
  selectedCustomerIds.value,
  segmentFilters.value,
))

const confirmationDescription = computed(() => {
  const audience = audienceType.value === 'ALL_ELIGIBLE'
    ? 'os clientes elegíveis'
    : audienceType.value === 'CUSTOMER_IDS'
      ? 'os clientes selecionados'
      : 'o público segmentado'

  return messageType.value === 'IMAGE'
    ? `Esta ação irá enviar a imagem para o armazenamento seguro e preparar a campanha para ${audience}.`
    : `Esta ação irá preparar o envio para ${audience}.`
})

const currentFormInvalid = computed(() => (
  currentContentInvalid.value
  || Boolean(audienceValidationError.value)
  || Boolean(channelSendEligibilityError.value)
))

function getCampaignId() {
  const id = route.params.id
  return Array.isArray(id) ? (id[0] ?? '') : (id ?? '')
}

async function loadCampaign() {
  void loadWhatsappChannels()
  loading.value = true
  loadError.value = false
  campaign.value = null
  dispatchResult.value = null
  audienceType.value = 'ALL_ELIGIBLE'
  customers.value = []
  customersLoading.value = false
  customersError.value = false
  customersRequested.value = false
  selectedCustomerIds.value = []
  segmentFilters.value = emptyCampaignSegmentForm()
  audienceTouched.value = false
  audiencePreviewState.value = null
  previewingAudience.value = false
  previewError.value = ''
  messageType.value = 'TEXT'
  message.value = ''
  messageTouched.value = false
  caption.value = ''
  imageFile.value = null
  imageTouched.value = false
  imageSelectionError.value = ''
  imagePreviewUrl.value = ''
  uploadedMediaAssetId.value = null
  dispatchError.value = ''
  selectedMessagingChannelId.value = ''
  channelTouched.value = false
  channelError.value = ''

  try {
    const automations = await automationService.list()
    const currentCampaign = automations.find(
      (automation) => automation.id === getCampaignId() && automation.type === 'CAMPAIGN',
    )

    campaign.value = currentCampaign ?? null
    message.value = currentCampaign?.message ?? ''
    selectedMessagingChannelId.value = currentCampaign?.messagingChannelId ?? ''

    if (currentCampaign) {
      const hydratedAudience = hydrateCampaignAudience(currentCampaign)
      audienceType.value = hydratedAudience.audienceType
      segmentFilters.value = hydratedAudience.segmentFilters
    }
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function loadWhatsappChannels() {
  if (channelsLoading.value) return
  channelsLoadGeneration += 1
  const generation = channelsLoadGeneration
  channelsLoading.value = true
  channelsLoadError.value = false
  try {
    const response = await whatsappChannelService.listWhatsappChannels()
    if (generation !== channelsLoadGeneration) return
    whatsappChannels.value = response.channels
  } catch {
    if (generation !== channelsLoadGeneration) return
    channelsLoadError.value = true
  } finally {
    if (generation === channelsLoadGeneration) channelsLoading.value = false
  }
}

function handleComposerInput() {
  dispatchError.value = ''
}

function handleChannelChange() {
  if (sending.value || previewingAudience.value || dispatchResult.value) return
  channelTouched.value = true
  channelError.value = ''
  previewError.value = ''
  dispatchError.value = ''
}

async function loadCustomers() {
  if (customersLoading.value || dispatchResult.value) return

  customersRequested.value = true
  customersLoading.value = true
  customersError.value = false

  try {
    customers.value = await customerService.list()

    const eligibleIds = new Set(
      customers.value
        .filter((customer) => customer.isActiveForAutomation)
        .map((customer) => customer.id),
    )
    selectedCustomerIds.value = selectedCustomerIds.value.filter((id) => eligibleIds.has(id))
  } catch {
    customersError.value = true
  } finally {
    customersLoading.value = false
  }
}

function setAudienceType(type: CampaignAudienceType) {
  if (sending.value || previewingAudience.value || dispatchResult.value) return

  audienceType.value = type
  audienceTouched.value = false
  previewError.value = ''
  dispatchError.value = ''

  if (type === 'CUSTOMER_IDS' && !customersRequested.value) {
    void loadCustomers()
  }
}

function setSelectedCustomerIds(ids: string[]) {
  if (sending.value || previewingAudience.value || dispatchResult.value) return

  selectedCustomerIds.value = ids
  audienceTouched.value = true
  previewError.value = ''
  dispatchError.value = ''
}

function setSegmentFilters(filters: CampaignSegmentForm) {
  if (sending.value || previewingAudience.value || dispatchResult.value) return

  segmentFilters.value = filters
  audienceTouched.value = true
  previewError.value = ''
  dispatchError.value = ''
}

async function previewAudience() {
  if (previewingAudience.value || sending.value || dispatchResult.value || !campaign.value) return

  if (!campaignAllowsPreparation(campaign.value)) {
    previewError.value = 'Reative a campanha para atualizar a prévia do público.'
    return
  }

  audienceTouched.value = true
  channelTouched.value = true
  previewError.value = ''
  channelError.value = ''
  dispatchError.value = ''

  if (audienceValidationError.value || channelSendEligibilityError.value) return

  const fingerprint = currentAudienceFingerprint.value
  const campaignId = campaign.value.id
  previewingAudience.value = true

  try {
    if (campaign.value.messagingChannelId !== selectedMessagingChannelId.value) {
      try {
        campaign.value = await persistCampaignChannel(
          automationService,
          campaign.value,
          selectedMessagingChannelId.value,
        )
      } catch {
        channelError.value = 'Não foi possível salvar o canal WhatsApp. Tente novamente.'
        return
      }
    }

    if (fingerprint !== currentAudienceFingerprint.value) return

    if (audienceType.value === 'SEGMENTED') {
      campaign.value = await automationService.updateCampaignAudience(
        campaignId,
        buildCampaignAudienceUpdate('SEGMENTED', segmentFilters.value),
      )
    } else if (shouldPersistAllEligible(campaign.value)) {
      campaign.value = await automationService.updateCampaignAudience(
        campaignId,
        buildCampaignAudienceUpdate('ALL_ELIGIBLE', segmentFilters.value),
      )
    }

    if (fingerprint !== currentAudienceFingerprint.value) return

    const response = await automationService.previewCampaignAudience(
      campaignId,
      buildCampaignAudiencePreview(audienceType.value, selectedCustomerIds.value),
    )

    if (fingerprint === currentAudienceFingerprint.value) {
      audiencePreviewState.value = { fingerprint, response }
    }
  } catch (error) {
    previewError.value = campaignPreviewError(error)
  } finally {
    previewingAudience.value = false
  }
}

function setMessageType(type: CampaignMessageType) {
  if (sending.value || dispatchResult.value) return

  messageType.value = type
  dispatchError.value = ''
}

function handleImageFileChange(file: File | null) {
  if (sending.value || dispatchResult.value) return

  imageFile.value = file
  imageTouched.value = true
  uploadedMediaAssetId.value = null
  dispatchError.value = ''

  if (file) imageSelectionError.value = ''
}

function handleImageValidationError(error: string) {
  imageSelectionError.value = error
  if (error) imageTouched.value = true
}

async function openConfirmModal() {
  if (dispatchResult.value) return

  if (!campaign.value || !campaignAllowsPreparation(campaign.value)) {
    dispatchError.value = 'Reative a campanha para preparar novos envios.'
    return
  }

  if (messageType.value === 'TEXT') {
    messageTouched.value = true
  } else {
    imageTouched.value = true
  }
  audienceTouched.value = true
  channelTouched.value = true
  dispatchError.value = ''

  if (currentFormInvalid.value) return

  if (!audiencePreviewIsCurrent.value) {
    dispatchError.value = 'Atualize a prévia do público antes de enviar.'
    return
  }

  if (!isCampaignAudiencePersisted(campaign.value, audienceType.value, segmentFilters.value)) {
    dispatchError.value = 'Atualize a prévia do público antes de enviar.'
    return
  }

  confirmModalOpen.value = true
  await nextTick()
  confirmButton.value?.focus()
}

function closeConfirmModal() {
  if (sending.value) return

  confirmModalOpen.value = false
  dispatchError.value = ''
}

function setUploadError(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 413) {
    dispatchError.value = 'A imagem excede o tamanho permitido.'
  } else if (isAxiosError(error) && error.response?.status === 400) {
    dispatchError.value = 'Não foi possível validar esta imagem.'
  } else {
    dispatchError.value = 'Não foi possível enviar a imagem. Tente novamente.'
  }
}

async function getUploadedMediaAssetId() {
  if (!campaign.value || !campaignAllowsPreparation(campaign.value)) {
    dispatchError.value = 'Reative a campanha para preparar novos envios.'
    return null
  }
  if (uploadedMediaAssetId.value) return uploadedMediaAssetId.value
  if (!imageFile.value || imageValidationError.value) return null

  uploading.value = true

  try {
    const mediaAsset = await mediaAssetService.uploadImage(imageFile.value)
    if (mediaAsset.status !== 'READY') {
      dispatchError.value = 'Não foi possível validar esta imagem.'
      return null
    }

    uploadedMediaAssetId.value = mediaAsset.id
    return mediaAsset.id
  } catch (error) {
    setUploadError(error)
    return null
  } finally {
    uploading.value = false
  }
}

function setDispatchError(error: unknown) {
  if (isAxiosError(error) && error.response?.status === 404) {
    dispatchError.value = 'Campanha não encontrada ou indisponível.'
  } else if (isAxiosError(error) && error.response?.status === 409) {
    dispatchError.value = 'Não foi possível preparar a campanha no estado atual.'
  } else {
    dispatchError.value = 'Não foi possível preparar o envio. Tente novamente.'
  }
}

async function confirmDispatch() {
  if (
    sending.value
    || dispatchResult.value
    || !campaign.value
    || currentFormInvalid.value
  ) return

  if (!campaignAllowsPreparation(campaign.value)) {
    dispatchError.value = 'Reative a campanha para preparar novos envios.'
    return
  }

  if (
    !audiencePreviewIsCurrent.value
    || !isCampaignAudiencePersisted(campaign.value, audienceType.value, segmentFilters.value)
  ) {
    dispatchError.value = 'Atualize a prévia do público antes de enviar.'
    return
  }

  const campaignId = campaign.value.id
  const audience = buildCampaignAudience(audienceType.value, selectedCustomerIds.value)
  let payload: CampaignDispatchPayload

  sending.value = true
  dispatchError.value = ''

  if (messageType.value === 'IMAGE') {
    const mediaAssetId = await getUploadedMediaAssetId()
    if (!mediaAssetId) {
      sending.value = false
      return
    }

    const trimmedCaption = caption.value.trim()
    payload = {
      type: 'IMAGE',
      mediaAssetId,
      ...(trimmedCaption ? { caption: trimmedCaption } : {}),
      audience,
    }
  } else {
    payload = {
      type: 'TEXT',
      content: message.value.trim(),
      audience,
    }
  }

  try {
    dispatchResult.value = await automationService.dispatchCampaign(campaignId, payload)
    confirmModalOpen.value = false
  } catch (error) {
    setDispatchError(error)
  } finally {
    sending.value = false
  }
}

watch(() => route.params.id, loadCampaign, { immediate: true })
</script>

<style scoped>
.back-link,
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 600;
}

.back-link {
  padding: 0.6rem 0.875rem;
  color: var(--text-secondary);
  border-radius: 9px;
  transition: color 0.15s, background 0.15s;
}

.back-link:hover {
  color: var(--text-primary);
  background: var(--nav-hover);
}

.btn-primary {
  padding: 0.7rem 1.25rem;
  border: none;
  border-radius: 10px;
  color: #fff;
  background: var(--gradient-brand);
  box-shadow: 0 4px 16px var(--brand-glow);
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
}

.btn-primary:hover:not(:disabled) {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled,
.btn-cancel:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.state-card {
  min-height: 300px;
  padding: 3rem 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: var(--card-bg);
  border: 1px dashed var(--card-border);
  border-radius: 20px;
}

.state-card h2 {
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-size: 1.15rem;
}

.state-card p {
  max-width: 420px;
  margin-bottom: 1.5rem;
  color: var(--text-muted);
  font-size: 0.875rem;
}

.spinner {
  width: 30px;
  height: 30px;
  margin-bottom: 1rem;
  border: 3px solid rgba(167, 139, 250, 0.2);
  border-top-color: var(--brand-light);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.state-icon {
  width: 58px;
  height: 58px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border-radius: 16px;
}

.not-found-state .state-icon {
  color: var(--brand-light);
  background: var(--brand-subtle);
}

.composer {
  width: 100%;
  max-width: 980px;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.composer-card,
.success-card {
  padding: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 16px;
}

.inactive-warning {
  padding: 1rem 1.125rem;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  color: #fbbf24;
  background: rgba(245, 158, 11, 0.09);
  border: 1px solid rgba(245, 158, 11, 0.25);
  border-radius: 12px;
}

.inactive-warning > span {
  flex-shrink: 0;
}

.inactive-warning strong {
  display: block;
  color: var(--text-primary);
  font-size: 0.9rem;
}

.inactive-warning p {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.card-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
  margin-bottom: 1.5rem;
}

.card-heading > div {
  flex: 1;
}

.card-heading h2 {
  color: var(--text-primary);
  font-size: 1.05rem;
}

.card-heading p {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.8rem;
}

.step-number {
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-radius: 9px;
  font-size: 0.8rem;
  font-weight: 700;
}

.message-type-selector {
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.type-option {
  min-width: 0;
  padding: 0.875rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 1px solid var(--card-border);
  border-radius: 11px;
  color: var(--text-muted);
  background: var(--input-bg);
  text-align: left;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}

.type-option:hover:not(:disabled) {
  color: var(--text-primary);
  border-color: var(--input-border);
  background: var(--nav-hover);
}

.type-option.selected {
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-color: rgba(124, 58, 237, 0.45);
}

.type-option:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.type-option > span {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.type-option strong {
  color: currentColor;
  font-size: 0.875rem;
}

.type-option small {
  margin-top: 0.1rem;
  color: var(--text-muted);
  font-size: 0.72rem;
}

.form-field {
  display: flex;
  flex-direction: column;
}

.form-field label {
  margin-bottom: 0.45rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
}

.form-field label span {
  color: var(--text-muted);
  font-weight: 400;
}

.channel-field {
  margin-bottom: 1.5rem;
}

.form-field select {
  width: 100%;
  padding: 0.75rem 0.875rem;
  border: 1.5px solid var(--input-border);
  border-radius: 10px;
  outline: none;
  color: var(--text-primary);
  background: var(--input-bg);
  font: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-field select:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.form-field select[aria-invalid='true'] {
  border-color: var(--error);
}

.form-field select:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.channel-help {
  min-height: 1.25rem;
  margin-top: 0.35rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.retry-channels-button {
  align-self: flex-start;
  padding: 0;
  border: 0;
  color: var(--brand-light);
  background: transparent;
  font: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
}

.form-field textarea {
  width: 100%;
  resize: vertical;
  min-height: 170px;
  padding: 0.875rem;
  border: 1.5px solid var(--input-border);
  border-radius: 10px;
  outline: none;
  color: var(--text-primary);
  background: var(--input-bg);
  font: inherit;
  line-height: 1.6;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-field textarea:focus {
  border-color: var(--brand);
  box-shadow: 0 0 0 3px var(--brand-glow);
}

.form-field textarea[aria-invalid='true'] {
  border-color: var(--error);
}

.form-field textarea::placeholder {
  color: var(--text-muted);
}

.form-field textarea:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.field-meta {
  min-height: 1.5rem;
  margin-top: 0.35rem;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.field-error {
  color: var(--error);
  font-size: 0.78rem;
}

.character-counter {
  flex-shrink: 0;
  color: var(--text-muted);
  font-size: 0.75rem;
}

.personalization-help {
  margin-top: 0.5rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.personalization-help code {
  padding: 0.1rem 0.3rem;
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-radius: 4px;
}

.image-fields {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.caption-help {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.caption-help code {
  padding: 0.1rem 0.3rem;
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-radius: 4px;
}

.review-list,
.confirmation-list {
  display: grid;
  gap: 0.75rem;
}

.review-list {
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.review-list > div,
.confirmation-list > div {
  padding: 0.875rem;
  background: rgba(255, 255, 255, 0.025);
  border: 1px solid var(--card-border);
  border-radius: 10px;
}

.review-list dt,
.confirmation-list dt {
  margin-bottom: 0.2rem;
  color: var(--text-muted);
  font-size: 0.72rem;
}

.review-list dd,
.confirmation-list dd {
  color: var(--text-primary);
  font-size: 0.85rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}

.message-preview {
  margin-top: 1rem;
  padding: 1rem;
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
}

.message-preview > span {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.message-preview p {
  margin-top: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.image-review {
  min-height: 150px;
  margin-top: 1rem;
  display: grid;
  grid-template-columns: minmax(150px, 220px) 1fr;
  overflow: hidden;
  background: var(--input-bg);
  border: 1px solid var(--card-border);
  border-radius: 10px;
}

.image-review img {
  width: 100%;
  height: 100%;
  min-height: 150px;
  display: block;
  object-fit: cover;
  background: var(--bg-primary);
}

.image-review-details {
  min-width: 0;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.image-review-details > span {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.image-review-details strong {
  max-width: 100%;
  margin-top: 0.25rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  overflow-wrap: anywhere;
}

.image-review-details p {
  max-width: 100%;
  margin-top: 0.75rem;
  display: -webkit-box;
  overflow: hidden;
  color: var(--text-secondary);
  font-size: 0.82rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.image-review-details .empty-caption {
  color: var(--text-muted);
  font-style: italic;
}

.composer-actions {
  padding: 0.25rem 0 1rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
}

.composer-actions p {
  color: var(--text-muted);
  font-size: 0.78rem;
}

.send-button {
  min-width: 160px;
}

.success-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  border-color: rgba(34, 197, 94, 0.25);
  background: rgba(34, 197, 94, 0.08);
}

.success-heading {
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.success-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--success);
  background: rgba(34, 197, 94, 0.12);
  border-radius: 12px;
}

.success-heading h2 {
  color: var(--success);
  font-size: 1rem;
}

.success-heading p {
  margin-top: 0.2rem;
  color: var(--text-muted);
  font-size: 0.78rem;
}

.result-metrics {
  display: flex;
  gap: 1.5rem;
}

.result-metrics div {
  min-width: 90px;
}

.result-metrics dt {
  color: var(--text-muted);
  font-size: 0.72rem;
}

.result-metrics dd {
  margin-top: 0.15rem;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 800;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  background: rgba(0, 0, 0, 0.72);
  backdrop-filter: blur(4px);
}

.modal {
  width: 100%;
  max-width: 500px;
  padding: 1.5rem;
  background: var(--sidebar-bg);
  border: 1px solid var(--card-border);
  border-radius: 18px;
  box-shadow: var(--card-shadow);
  animation: modalIn 0.2s ease both;
}

.modal-heading {
  display: flex;
  align-items: flex-start;
  gap: 0.875rem;
}

.modal-icon {
  width: 42px;
  height: 42px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--brand-light);
  background: var(--brand-subtle);
  border-radius: 12px;
}

.modal-heading h2 {
  color: var(--text-primary);
  font-size: 1.15rem;
}

.modal-heading p {
  margin-top: 0.3rem;
  color: var(--text-muted);
  font-size: 0.82rem;
}

.confirmation-list {
  margin-top: 1.25rem;
}

.dispatch-error {
  margin-top: 1rem;
  padding: 0.75rem 0.875rem;
  color: var(--error);
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.25);
  border-radius: 9px;
  font-size: 0.8rem;
}

.modal-actions {
  margin-top: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-cancel {
  padding: 0.65rem 1rem;
  border: 1px solid var(--card-border);
  border-radius: 10px;
  color: var(--text-secondary);
  background: transparent;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.btn-cancel:hover:not(:disabled) {
  color: var(--text-primary);
  background: var(--nav-hover);
}

.button-spinner {
  width: 15px;
  height: 15px;
  border: 2px solid rgba(255, 255, 255, 0.35);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes modalIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

@media (max-width: 720px) {
  .message-type-selector,
  .review-list {
    grid-template-columns: 1fr;
  }

  .image-review {
    grid-template-columns: 1fr;
  }

  .image-review img {
    height: 190px;
  }

  .composer-actions,
  .success-card {
    align-items: stretch;
    flex-direction: column;
  }

  .result-metrics {
    justify-content: space-between;
  }
}
</style>

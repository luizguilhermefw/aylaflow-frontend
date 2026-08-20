import type {
  MessagingPolicy,
  UpdateOptOutInstructionsPayload,
} from './messaging-policy.repository'

export interface MessagingPolicyRepository {
  getMessagingPolicy(): Promise<MessagingPolicy>
  updateOptOutInstructions(payload: UpdateOptOutInstructionsPayload): Promise<void>
}

export interface MessagingPolicyState {
  policy: MessagingPolicy | null
  loading: boolean
  loadError: boolean
  saving: boolean
  disableModalOpen: boolean
  responsibilityAcknowledged: boolean
  actionError: string
  successMessage: string
}

export function emptyMessagingPolicyState(): MessagingPolicyState {
  return {
    policy: null,
    loading: false,
    loadError: false,
    saving: false,
    disableModalOpen: false,
    responsibilityAcknowledged: false,
    actionError: '',
    successMessage: '',
  }
}

export function canManageMessagingPolicy(role: string | null | undefined): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) return undefined
  return typeof response.status === 'number' ? response.status : undefined
}

export function messagingPolicyActionError(error: unknown): string {
  if (errorStatus(error) === 403) {
    return 'Você não tem permissão para alterar esta configuração.'
  }
  return 'Não foi possível salvar esta configuração. Tente novamente.'
}

export function hasOptOutDeclaration(policy: MessagingPolicy | null): boolean {
  const text = policy?.optOutInstructionsDeclaration?.text
  return typeof text === 'string' && Boolean(text.trim())
}

export function createMessagingPolicyController(
  repository: MessagingPolicyRepository,
  state: MessagingPolicyState = emptyMessagingPolicyState(),
) {
  async function load(): Promise<boolean> {
    if (state.loading) return false
    state.loading = true
    state.loadError = false
    state.actionError = ''

    try {
      state.policy = await repository.getMessagingPolicy()
      return true
    } catch {
      state.policy = null
      state.loadError = true
      return false
    } finally {
      state.loading = false
    }
  }

  async function persist(
    payload: UpdateOptOutInstructionsPayload,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (state.saving || !state.policy || !canManageMessagingPolicy(role)) return false
    const previousValue = state.policy.includeOptOutInstructions
    state.saving = true
    state.actionError = ''
    state.successMessage = ''

    try {
      await repository.updateOptOutInstructions(payload)
      state.policy = {
        ...state.policy,
        includeOptOutInstructions: payload.includeOptOutInstructions,
      }
      state.successMessage = payload.includeOptOutInstructions
        ? 'Instrução de cancelamento reativada com sucesso.'
        : 'Instrução de cancelamento desativada com sucesso.'
      return true
    } catch (error) {
      state.policy = {
        ...state.policy,
        includeOptOutInstructions: previousValue,
      }
      state.actionError = messagingPolicyActionError(error)
      return false
    } finally {
      state.saving = false
    }
  }

  async function requestChange(
    includeOptOutInstructions: boolean,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (
      state.saving
      || !state.policy
      || !canManageMessagingPolicy(role)
      || state.policy.includeOptOutInstructions === includeOptOutInstructions
    ) return false

    state.actionError = ''
    state.successMessage = ''

    if (!includeOptOutInstructions) {
      state.disableModalOpen = true
      state.responsibilityAcknowledged = false
      return true
    }

    return persist({ includeOptOutInstructions: true }, role)
  }

  function setResponsibilityAcknowledged(acknowledged: boolean): void {
    if (!state.saving && state.disableModalOpen) {
      state.responsibilityAcknowledged = acknowledged
    }
  }

  function canConfirmDisable(): boolean {
    return state.disableModalOpen
      && state.responsibilityAcknowledged
      && hasOptOutDeclaration(state.policy)
      && !state.saving
  }

  function cancelDisable(): boolean {
    if (state.saving) return false
    state.disableModalOpen = false
    state.responsibilityAcknowledged = false
    state.actionError = ''
    return true
  }

  async function confirmDisable(role: string | null | undefined): Promise<boolean> {
    if (!canConfirmDisable() || !canManageMessagingPolicy(role)) return false
    const updated = await persist({
      includeOptOutInstructions: false,
      responsibilityAcknowledged: true,
    }, role)

    if (updated) {
      state.disableModalOpen = false
      state.responsibilityAcknowledged = false
    }
    return updated
  }

  return {
    state,
    load,
    requestChange,
    setResponsibilityAcknowledged,
    canConfirmDisable,
    cancelDisable,
    confirmDisable,
  }
}

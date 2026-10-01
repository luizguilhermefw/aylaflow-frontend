import type {
  CustomerRegistrationLink,
  CustomerRegistrationQrCode,
} from './customer-registration-link.repository'

export interface CustomerRegistrationLinkRepository {
  getLink(): Promise<CustomerRegistrationLink>
  createLink(): Promise<CustomerRegistrationLink>
  rotateLink(): Promise<CustomerRegistrationLink>
  updateStatus(active: boolean): Promise<CustomerRegistrationLink>
  getQrCode(): Promise<CustomerRegistrationQrCode>
}

export interface CustomerRegistrationLinkClipboard {
  writeText(value: string): Promise<void>
}

export type CustomerRegistrationLinkViewState =
  | 'idle'
  | 'loading'
  | 'not-created'
  | 'ready'
  | 'error'

export interface CustomerRegistrationLinkState {
  view: CustomerRegistrationLinkViewState
  link: CustomerRegistrationLink | null
  qrCode: CustomerRegistrationQrCode | null
  creating: boolean
  rotating: boolean
  updatingStatus: boolean
  loadingQr: boolean
  rotationModalOpen: boolean
  loadError: string
  actionError: string
  qrError: string
  successMessage: string
  copyMessage: string
}

export function emptyCustomerRegistrationLinkState(): CustomerRegistrationLinkState {
  return {
    view: 'idle',
    link: null,
    qrCode: null,
    creating: false,
    rotating: false,
    updatingStatus: false,
    loadingQr: false,
    rotationModalOpen: false,
    loadError: '',
    actionError: '',
    qrError: '',
    successMessage: '',
    copyMessage: '',
  }
}

export function canManageCustomerRegistrationLink(
  role: string | null | undefined,
): boolean {
  return role === 'OWNER' || role === 'MANAGER'
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) return undefined
  return typeof response.status === 'number' ? response.status : undefined
}

export function customerRegistrationLinkActionError(error: unknown): string {
  const status = errorStatus(error)
  if (status === 403) return 'Você não possui permissão para gerenciar o cadastro público.'
  if (status === 409) return 'Já existe um link de cadastro para esta empresa.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function customerRegistrationLinkQrError(error: unknown): string {
  if (errorStatus(error) === 503) {
    return 'O link está disponível, mas o QR Code não pôde ser gerado no momento.'
  }
  return 'O link está disponível, mas não foi possível carregar o QR Code.'
}

const browserClipboard: CustomerRegistrationLinkClipboard = {
  async writeText(value: string): Promise<void> {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      throw new Error('Clipboard unavailable')
    }
    await navigator.clipboard.writeText(value)
  },
}

export function createCustomerRegistrationLinkController(
  repository: CustomerRegistrationLinkRepository,
  state: CustomerRegistrationLinkState = emptyCustomerRegistrationLinkState(),
  clipboard: CustomerRegistrationLinkClipboard = browserClipboard,
) {
  let qrGeneration = 0

  function clearFeedback() {
    state.actionError = ''
    state.successMessage = ''
    state.copyMessage = ''
  }

  function invalidateQr() {
    qrGeneration += 1
    state.qrCode = null
    state.loadingQr = false
    state.qrError = ''
    state.copyMessage = ''
  }

  async function loadQrCode(): Promise<boolean> {
    if (!state.link || state.loadingQr) return false
    const generation = ++qrGeneration
    const linkPublicId = state.link.publicId
    state.loadingQr = true
    state.qrError = ''
    state.copyMessage = ''

    try {
      const qrCode = await repository.getQrCode()
      if (generation !== qrGeneration || state.link?.publicId !== linkPublicId) return false
      state.qrCode = qrCode
      return true
    } catch (error) {
      if (generation === qrGeneration && state.link?.publicId === linkPublicId) {
        state.qrCode = null
        state.qrError = customerRegistrationLinkQrError(error)
      }
      return false
    } finally {
      if (generation === qrGeneration) state.loadingQr = false
    }
  }

  async function load(role: string | null | undefined): Promise<boolean> {
    if (state.view === 'loading' || !canManageCustomerRegistrationLink(role)) return false
    state.view = 'loading'
    state.loadError = ''
    clearFeedback()
    invalidateQr()

    try {
      state.link = await repository.getLink()
      state.view = 'ready'
      await loadQrCode()
      return true
    } catch (error) {
      state.link = null
      if (errorStatus(error) === 404) {
        state.view = 'not-created'
        return true
      }
      state.view = 'error'
      state.loadError = customerRegistrationLinkActionError(error)
      return false
    }
  }

  async function createLink(role: string | null | undefined): Promise<boolean> {
    if (
      state.creating
      || state.view !== 'not-created'
      || !canManageCustomerRegistrationLink(role)
    ) return false
    state.creating = true
    clearFeedback()

    try {
      state.link = await repository.createLink()
      state.view = 'ready'
      invalidateQr()
      state.successMessage = 'Link criado.'
      await loadQrCode()
      return true
    } catch (error) {
      state.actionError = customerRegistrationLinkActionError(error)
      return false
    } finally {
      state.creating = false
    }
  }

  function requestRotation(role: string | null | undefined): boolean {
    if (
      state.rotating
      || !state.link
      || !canManageCustomerRegistrationLink(role)
    ) return false
    clearFeedback()
    state.rotationModalOpen = true
    return true
  }

  function cancelRotation(): boolean {
    if (state.rotating) return false
    state.rotationModalOpen = false
    return true
  }

  async function confirmRotation(role: string | null | undefined): Promise<boolean> {
    if (
      state.rotating
      || !state.rotationModalOpen
      || !state.link
      || !canManageCustomerRegistrationLink(role)
    ) return false
    state.rotating = true
    clearFeedback()
    invalidateQr()

    try {
      state.link = await repository.rotateLink()
      state.view = 'ready'
      state.rotationModalOpen = false
      state.successMessage = 'Novo link gerado.'
      await loadQrCode()
      return true
    } catch (error) {
      state.actionError = customerRegistrationLinkActionError(error)
      await loadQrCode()
      return false
    } finally {
      state.rotating = false
    }
  }

  async function updateStatus(
    active: boolean,
    role: string | null | undefined,
  ): Promise<boolean> {
    if (
      state.updatingStatus
      || state.rotating
      || !state.link
      || state.link.active === active
      || !canManageCustomerRegistrationLink(role)
    ) return false
    state.updatingStatus = true
    clearFeedback()

    try {
      state.link = await repository.updateStatus(active)
      state.successMessage = active
        ? 'Cadastro público ativado.'
        : 'Cadastro público desativado.'
      return true
    } catch (error) {
      state.actionError = customerRegistrationLinkActionError(error)
      return false
    } finally {
      state.updatingStatus = false
    }
  }

  async function copyLink(): Promise<boolean> {
    if (!state.qrCode || state.rotating) return false
    const publicUrl = state.qrCode.publicUrl
    state.copyMessage = ''
    state.actionError = ''
    try {
      await clipboard.writeText(publicUrl)
      if (state.qrCode?.publicUrl === publicUrl) state.copyMessage = 'Link copiado.'
      return true
    } catch {
      state.actionError = 'Não foi possível copiar o link. Tente novamente.'
      return false
    }
  }

  return {
    state,
    load,
    loadQrCode,
    createLink,
    requestRotation,
    cancelRotation,
    confirmRotation,
    updateStatus,
    copyLink,
  }
}

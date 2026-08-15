import type {
  AutomationLifecycleUpdatePayload,
  DeleteAutomationResponse,
} from './campaign.types'

export type CampaignLifecycleActionType = 'ACTIVATE' | 'DEACTIVATE' | 'DELETE'

export interface CampaignLifecycleItem {
  id: string
  name: string
  isActive: boolean
  isSystem: boolean
}

export interface CampaignLifecycleRepository<TCampaign extends CampaignLifecycleItem> {
  updateAutomation(
    id: string,
    payload: AutomationLifecycleUpdatePayload,
  ): Promise<Partial<TCampaign>>
  deleteAutomation(id: string): Promise<DeleteAutomationResponse<TCampaign>>
}

export interface CampaignLifecycleState<TCampaign extends CampaignLifecycleItem> {
  campaigns: TCampaign[]
  actionCampaign: TCampaign | null
  actionType: CampaignLifecycleActionType | null
  actionLoading: boolean
  actionError: string
  successMessage: string
}

export function emptyCampaignLifecycleState<
  TCampaign extends CampaignLifecycleItem,
>(): CampaignLifecycleState<TCampaign> {
  return {
    campaigns: [],
    actionCampaign: null,
    actionType: null,
    actionLoading: false,
    actionError: '',
    successMessage: '',
  }
}

export function campaignLifecycleActionLabel(campaign: CampaignLifecycleItem): 'Desativar' | 'Reativar' {
  return campaign.isActive ? 'Desativar' : 'Reativar'
}

export function campaignAllowsPreparation(campaign: Pick<CampaignLifecycleItem, 'isActive'>): boolean {
  return campaign.isActive
}

export function mergeAutomationUpdate<TCampaign extends { id: string }>(
  campaigns: TCampaign[],
  campaignId: string,
  update: Partial<TCampaign>,
): TCampaign[] {
  const definedUpdate = Object.fromEntries(
    Object.entries(update).filter(([, value]) => value !== undefined),
  ) as Partial<TCampaign>

  return campaigns.map((campaign) => (
    campaign.id === campaignId ? { ...campaign, ...definedUpdate } : campaign
  ))
}

export function removeCampaignFromList<TCampaign extends { id: string }>(
  campaigns: TCampaign[],
  campaignId: string,
): TCampaign[] {
  return campaigns.filter((campaign) => campaign.id !== campaignId)
}

function errorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null || !('response' in error)) return undefined
  const response = error.response
  if (typeof response !== 'object' || response === null || !('status' in response)) return undefined
  return typeof response.status === 'number' ? response.status : undefined
}

export function campaignLifecycleError(error: unknown): string {
  const status = errorStatus(error)
  if (status === 400) return 'Não foi possível validar esta operação.'
  if (status === 403) return 'Esta campanha não pode ser alterada.'
  if (status === 404) return 'Campanha não encontrada ou não está mais disponível.'
  if (status === 409) return 'Não foi possível alterar esta campanha no estado atual.'
  return 'Não foi possível concluir a operação. Tente novamente.'
}

export function createCampaignLifecycleController<
  TCampaign extends CampaignLifecycleItem,
>(
  repository: CampaignLifecycleRepository<TCampaign>,
  state: CampaignLifecycleState<TCampaign> = emptyCampaignLifecycleState<TCampaign>(),
) {
  function openAction(campaign: TCampaign, actionType: CampaignLifecycleActionType): boolean {
    if (state.actionLoading || (actionType === 'DELETE' && campaign.isSystem)) return false
    state.actionCampaign = campaign
    state.actionType = actionType
    state.actionError = ''
    state.successMessage = ''
    return true
  }

  function closeAction(): boolean {
    if (state.actionLoading) return false
    state.actionCampaign = null
    state.actionType = null
    state.actionError = ''
    return true
  }

  async function confirmAction(): Promise<boolean> {
    if (state.actionLoading || !state.actionCampaign || !state.actionType) return false

    const campaign = state.actionCampaign
    const actionType = state.actionType
    state.actionLoading = true
    state.actionError = ''

    try {
      if (actionType === 'DELETE') {
        await repository.deleteAutomation(campaign.id)
        state.campaigns = removeCampaignFromList(state.campaigns, campaign.id)
        state.successMessage = `Campanha “${campaign.name}” excluída com sucesso.`
      } else {
        const isActive = actionType === 'ACTIVATE'
        const update = await repository.updateAutomation(campaign.id, { isActive })
        state.campaigns = mergeAutomationUpdate(state.campaigns, campaign.id, update)
        state.successMessage = isActive
          ? `Campanha “${campaign.name}” reativada com sucesso.`
          : `Campanha “${campaign.name}” desativada com sucesso.`
      }

      state.actionCampaign = null
      state.actionType = null
      return true
    } catch (error) {
      state.actionError = campaignLifecycleError(error)
      return false
    } finally {
      state.actionLoading = false
    }
  }

  return { state, openAction, closeAction, confirmAction }
}

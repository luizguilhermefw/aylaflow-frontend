import api from './api'
import {
  createMessagingPolicyRepository,
  type MessagingPolicyHttpClient,
} from '@/features/messaging-policy/messaging-policy.repository'

export type {
  DisableOptOutInstructionsPayload,
  EnableOptOutInstructionsPayload,
  MessagingPolicy,
  OptOutInstructionsDeclaration,
  UpdateOptOutInstructionsPayload,
} from '@/features/messaging-policy/messaging-policy.repository'

export const messagingPolicyService = createMessagingPolicyRepository(
  api as MessagingPolicyHttpClient,
)

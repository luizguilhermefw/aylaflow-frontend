export const MESSAGING_POLICY_ENDPOINT = '/company/messaging-policy'
export const OPT_OUT_INSTRUCTIONS_ENDPOINT = `${MESSAGING_POLICY_ENDPOINT}/opt-out-instructions`

export interface OptOutInstructionsDeclaration {
  required: boolean
  version: string
  text: string
}

export interface MessagingPolicy {
  includeOptOutInstructions: boolean
  optOutInstructionsDeclaration: OptOutInstructionsDeclaration | null
}

export interface EnableOptOutInstructionsPayload {
  includeOptOutInstructions: true
}

export interface DisableOptOutInstructionsPayload {
  includeOptOutInstructions: false
  responsibilityAcknowledged: true
}

export type UpdateOptOutInstructionsPayload =
  | EnableOptOutInstructionsPayload
  | DisableOptOutInstructionsPayload

export interface MessagingPolicyHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  patch<T>(url: string, payload: unknown): Promise<{ data: T }>
}

export function createMessagingPolicyRepository(http: MessagingPolicyHttpClient) {
  return {
    async getMessagingPolicy(): Promise<MessagingPolicy> {
      const { data } = await http.get<MessagingPolicy>(MESSAGING_POLICY_ENDPOINT)
      return data
    },
    async updateOptOutInstructions(payload: UpdateOptOutInstructionsPayload): Promise<void> {
      await http.patch<unknown>(OPT_OUT_INSTRUCTIONS_ENDPOINT, payload)
    },
  }
}

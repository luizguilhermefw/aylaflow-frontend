import type {
  PublicRegistrationBootstrap,
  PublicRegistrationPayload,
  PublicRegistrationResponse,
} from './public-registration.types'

export interface PublicRegistrationHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  post<T>(url: string, payload: unknown): Promise<{ data: T }>
}

export function publicRegistrationEndpoint(publicId: string): string {
  return `/public/customer-registration/${encodeURIComponent(publicId)}`
}

export function createPublicRegistrationRepository(http: PublicRegistrationHttpClient) {
  return {
    async getBootstrap(publicId: string): Promise<PublicRegistrationBootstrap> {
      const { data } = await http.get<PublicRegistrationBootstrap>(
        publicRegistrationEndpoint(publicId),
      )
      return data
    },

    async submit(
      publicId: string,
      payload: PublicRegistrationPayload,
    ): Promise<PublicRegistrationResponse> {
      const { data } = await http.post<PublicRegistrationResponse>(
        publicRegistrationEndpoint(publicId),
        payload,
      )
      return data
    },
  }
}

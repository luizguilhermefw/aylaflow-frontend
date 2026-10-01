export const CUSTOMER_REGISTRATION_LINK_ENDPOINT = '/customer-registration-link'
export const CUSTOMER_REGISTRATION_LINK_ROTATE_ENDPOINT = `${CUSTOMER_REGISTRATION_LINK_ENDPOINT}/rotate`
export const CUSTOMER_REGISTRATION_LINK_STATUS_ENDPOINT = `${CUSTOMER_REGISTRATION_LINK_ENDPOINT}/status`
export const CUSTOMER_REGISTRATION_LINK_QR_ENDPOINT = `${CUSTOMER_REGISTRATION_LINK_ENDPOINT}/qr-code`

export interface CustomerRegistrationLink {
  publicId: string
  active: boolean
  createdAt: string
  updatedAt: string
  publicPath: string
}

export interface CustomerRegistrationQrCode {
  publicUrl: string
  qrCodeDataUrl: string
}

export interface UpdateCustomerRegistrationLinkStatusPayload {
  active: boolean
}

export interface CustomerRegistrationLinkHttpClient {
  get<T>(url: string): Promise<{ data: T }>
  post<T>(url: string, payload: unknown): Promise<{ data: T }>
  patch<T>(url: string, payload: unknown): Promise<{ data: T }>
}

export function createCustomerRegistrationLinkRepository(
  http: CustomerRegistrationLinkHttpClient,
) {
  return {
    async getLink(): Promise<CustomerRegistrationLink> {
      const { data } = await http.get<CustomerRegistrationLink>(
        CUSTOMER_REGISTRATION_LINK_ENDPOINT,
      )
      return data
    },

    async createLink(): Promise<CustomerRegistrationLink> {
      const { data } = await http.post<CustomerRegistrationLink>(
        CUSTOMER_REGISTRATION_LINK_ENDPOINT,
        {},
      )
      return data
    },

    async rotateLink(): Promise<CustomerRegistrationLink> {
      const { data } = await http.post<CustomerRegistrationLink>(
        CUSTOMER_REGISTRATION_LINK_ROTATE_ENDPOINT,
        {},
      )
      return data
    },

    async updateStatus(active: boolean): Promise<CustomerRegistrationLink> {
      const payload: UpdateCustomerRegistrationLinkStatusPayload = { active }
      const { data } = await http.patch<CustomerRegistrationLink>(
        CUSTOMER_REGISTRATION_LINK_STATUS_ENDPOINT,
        payload,
      )
      return data
    },

    async getQrCode(): Promise<CustomerRegistrationQrCode> {
      const { data } = await http.get<CustomerRegistrationQrCode>(
        CUSTOMER_REGISTRATION_LINK_QR_ENDPOINT,
      )
      return data
    },
  }
}

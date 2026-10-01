export type CustomerGender = 'FEMALE' | 'MALE' | 'OTHER' | 'UNSPECIFIED'

export interface PublicInterestOption {
  id: string
  type: 'CATEGORY' | 'BRAND'
  name: string
}

export interface PublicRegistrationBootstrap {
  company: {
    displayName: string
  }
  interests: {
    categories: PublicInterestOption[]
    brands: PublicInterestOption[]
  }
}

export interface PublicRegistrationPayload {
  name: string
  preferredName?: string | null
  phone: string
  cpf: string
  birthDate?: string
  gender?: CustomerGender
  city?: string | null
  state?: string | null
  contactConsent: boolean
  interestOptionIds: string[]
}

export interface PublicRegistrationResponse {
  success: true
  message: string
}

export interface PublicRegistrationForm {
  name: string
  preferredName: string
  phone: string
  cpf: string
  birthDate: string
  gender: CustomerGender | ''
  city: string
  state: string
  contactConsent: boolean
}

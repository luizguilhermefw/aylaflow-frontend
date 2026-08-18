export type CustomerGender = 'FEMALE' | 'MALE' | 'UNSPECIFIED'

export type ContactConsentStatus = 'UNKNOWN' | 'GRANTED' | 'OPTED_OUT'

export type ManagedContactConsentStatus = Exclude<ContactConsentStatus, 'UNKNOWN'>

export interface Customer {
  id: string
  name: string
  phone: string
  gender: CustomerGender
  city: string | null
  state: string | null
  birthDate: string | null
  lastPurchaseDate: string | null
  isActiveForAutomation: boolean
  contactConsentStatus: ContactConsentStatus
  consentGrantedAt: string | null
  optedOutAt: string | null
  companyId: string
  createdAt: string
}

export interface CustomerMutationPayload {
  name: string
  phone: string
  gender?: CustomerGender
  city?: string | null
  state?: string | null
  birthDate?: string
  lastPurchaseDate?: string | null
}

export interface CustomerConsentPayload {
  status: ManagedContactConsentStatus
}

export interface CustomerConsentUpdate {
  id: string
  contactConsentStatus: ContactConsentStatus
  consentGrantedAt: string | null
  optedOutAt: string | null
}

export interface CustomerAutomationUpdate {
  id: string
  name: string
  phone: string
  birthDate: string | null
  lastPurchaseDate: string | null
  isActiveForAutomation: boolean
  companyId: string
  createdAt: string
}

export interface CustomerSearchFilters {
  gender?: CustomerGender
  city?: string
  state?: string
  minAge?: number
  maxAge?: number
  lastPurchaseBefore?: string
  lastPurchaseAfter?: string
  page: number
  pageSize: number
}

export interface CustomerSearchResult {
  items: Customer[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface ContactFormValues {
  name: string
  phone: string
  gender: CustomerGender
  city: string
  state: string
  birthDate: string
  lastPurchaseDate: string
}

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>

export interface ContactFilterValues {
  gender: '' | CustomerGender
  city: string
  state: string
  minAge: string
  maxAge: string
  lastPurchaseBefore: string
  lastPurchaseAfter: string
  pageSize: number
}

export type CustomerImportRowStatus = 'NEW' | 'EXISTING' | 'INVALID' | 'DUPLICATE_IN_FILE'

export type CustomerImportField =
  | 'name'
  | 'phone'
  | 'birthDate'
  | 'lastPurchaseDate'
  | 'gender'
  | 'city'
  | 'state'
  | 'contactConsent'

export interface CustomerImportRowError {
  field: CustomerImportField
  code: string
  message: string
}

export interface CustomerImportRow {
  rowNumber: number
  data: {
    name: string
    phone: string
    birthDate: string | null
    lastPurchaseDate: string | null
    gender: CustomerGender
    city: string | null
    state: string | null
    contactConsentStatus: ContactConsentStatus
  }
  errors: CustomerImportRowError[]
  status: CustomerImportRowStatus
}

export interface CustomerImportPreview {
  summary: {
    totalRows: number
    new: number
    existing: number
    invalid: number
    duplicateInFile: number
  }
  ignoredHeaders: string[]
  rows: CustomerImportRow[]
}

export interface CustomerImportExecuteResult {
  summary: {
    totalRows: number
    imported: number
    existing: number
    invalid: number
    duplicateInFile: number
  }
  rows: CustomerImportRow[]
}

export interface CustomerImportTemplate {
  blob: Blob
  fileName: string
}

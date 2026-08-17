import { readonly, shallowRef } from 'vue'
import type { CompanyAccessIssue } from './company-access.logic'

const currentIssue = shallowRef<CompanyAccessIssue | null>(null)

export const companyAccessIssue = readonly(currentIssue)

export function announceCompanyAccessIssue(issue: CompanyAccessIssue): void {
  currentIssue.value = issue
}

export function clearCompanyAccessIssue(): void {
  currentIssue.value = null
}

export function clearPendingCompanyAccessIssue(): void {
  if (currentIssue.value?.code === 'COMPANY_PENDING') {
    currentIssue.value = null
  }
}

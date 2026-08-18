import type { AuthenticatedUser } from './auth-repository.logic'

export function isPlatformAdminProfile(
  profile: AuthenticatedUser | null | undefined,
): boolean {
  return profile?.role === 'PLATFORM_ADMIN'
}

export function canAccessPlatformAdminArea(
  profile: AuthenticatedUser | null | undefined,
): boolean {
  return isPlatformAdminProfile(profile)
}

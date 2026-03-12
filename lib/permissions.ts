import { PlatformRole, ClubRole } from '@prisma/client'
import { Session } from 'next-auth'

export type Permission =
  | 'VIEW_PLATFORM_ANALYTICS'
  | 'MANAGE_FEATURE_REQUESTS'
  | 'CREATE_CLUB'
  | 'DELETE_CLUB'
  | 'EDIT_CLUB_SETTINGS'
  | 'MANAGE_MEMBERS'
  | 'START_SESSION'
  | 'END_SESSION'
  | 'OVERRIDE_GAME_FORMAT'
  | 'OVERRIDE_PLAYER_CLASS'
  | 'ENTER_SCORES'
  | 'MARK_AVAILABILITY'
  | 'VIEW_STANDINGS'
  | 'SUBMIT_FEATURE_REQUEST'
  | 'SEARCH_PLATFORM'

export function hasPermission(
  session: Session | null,
  permission: Permission,
  clubRole?: ClubRole
): boolean {
  if (!session?.user) return false

  const { platformRole } = session.user

  // Platform admin has all permissions
  if (platformRole === 'PLATFORM_ADMIN') return true

  switch (permission) {
    case 'VIEW_PLATFORM_ANALYTICS':
    case 'MANAGE_FEATURE_REQUESTS':
      return false // Only platform admins — already handled above

    case 'CREATE_CLUB':
      return true // All authenticated users can create clubs

    case 'DELETE_CLUB':
    case 'EDIT_CLUB_SETTINGS':
    case 'MANAGE_MEMBERS':
      return clubRole === 'OWNER' || clubRole === 'ADMIN'

    case 'START_SESSION':
    case 'END_SESSION':
    case 'OVERRIDE_GAME_FORMAT':
    case 'OVERRIDE_PLAYER_CLASS':
      return clubRole === 'OWNER' || clubRole === 'ADMIN'

    case 'ENTER_SCORES':
    case 'MARK_AVAILABILITY':
    case 'VIEW_STANDINGS':
    case 'SUBMIT_FEATURE_REQUEST':
    case 'SEARCH_PLATFORM':
      return true // All authenticated users

    default:
      return false
  }
}

export function canAccessClubSettings(
  session: Session | null,
  clubRole: ClubRole
): boolean {
  return hasPermission(session, 'EDIT_CLUB_SETTINGS', clubRole)
}

export function canManageSession(
  session: Session | null,
  clubRole: ClubRole
): boolean {
  return hasPermission(session, 'START_SESSION', clubRole)
}

export function canEnterScores(session: Session | null): boolean {
  return hasPermission(session, 'ENTER_SCORES')
}

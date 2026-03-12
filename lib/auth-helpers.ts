import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'
import { ClubRole } from '@prisma/client'

export async function getSession() {
  return await getServerSession(authOptions)
}

export async function requireAuth() {
  const session = await getSession()
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

export async function getUserClubRole(
  userId: string,
  clubId: string
): Promise<ClubRole | null> {
  const membership = await prisma.clubMembership.findUnique({
    where: {
      userId_clubId: {
        userId,
        clubId,
      },
    },
    select: {
      role: true,
      status: true,
    },
  })

  if (!membership || membership.status !== 'ACTIVE') {
    return null
  }

  return membership.role
}

export async function requireClubAccess(
  userId: string,
  clubId: string,
  requiredRole?: ClubRole
) {
  const role = await getUserClubRole(userId, clubId)

  if (!role) {
    throw new Error('Not a member of this club')
  }

  if (requiredRole && role !== requiredRole && role !== 'OWNER') {
    throw new Error('Insufficient permissions')
  }

  return role
}

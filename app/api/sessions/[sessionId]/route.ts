import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateSessionSchema = z.object({
  status: z.enum(['UPCOMING', 'ACTIVE', 'ENDED']).optional(),
  name: z.string().max(100).optional(),
  pairingAlgorithm: z.enum(['RANDOM', 'EQUAL_WEIGHT', 'FIXED', 'PER_GAME']).optional(),
  opponentAlgorithm: z.enum(['RANDOM', 'EQUAL_WEIGHT', 'OPPONENT_WEIGHT', 'PLAY_WITHIN_CLASS']).optional(),
  scoringSystem: z.enum(['RALLY_21', 'RALLY_21_SETTING', 'RALLY_21_NO_SETTING', 'SHORT_15', 'SHORT_7', 'CUSTOM_CAP', 'SERVICE_OVER_15']).optional(),
})

async function getSessionAndRole(sessionId: string, userId: string) {
  const clubSession = await prisma.clubSession.findUnique({
    where: { id: sessionId },
    select: { clubId: true },
  })
  if (!clubSession) return { clubSession: null, role: null }
  const role = await getUserClubRole(userId, clubSession.clubId)
  return { clubSession, role }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role } = await getSessionAndRole(params.sessionId, session.user.id)
  if (!role) {
    return NextResponse.json({ error: 'Not found or no access' }, { status: 404 })
  }

  const clubSession = await prisma.clubSession.findUnique({
    where: { id: params.sessionId },
    include: {
      club: { select: { id: true, name: true } },
      sessionPlayers: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: 'asc' },
      },
      games: {
        include: {
          sets: { orderBy: { setNumber: 'asc' } },
          gamePlayers: {
            include: {
              sessionPlayer: {
                include: {
                  user: { select: { id: true, name: true } },
                },
              },
            },
          },
        },
        orderBy: { startedAt: 'desc' },
      },
    },
  })

  return NextResponse.json({ ...clubSession, userRole: role })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { clubSession, role } = await getSessionAndRole(
    params.sessionId,
    session.user.id
  )
  if (!clubSession || !role) {
    return NextResponse.json({ error: 'Not found or no access' }, { status: 404 })
  }
  if (role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.clubSession.update({
    where: { id: params.sessionId },
    data: parsed.data,
  })

  return NextResponse.json(updated)
}

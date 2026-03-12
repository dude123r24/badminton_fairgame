import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const updateClubSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  location: z.string().max(200).optional(),
  defaultCourts: z.number().int().min(1).max(20).optional(),
  defaultPairingAlgorithm: z
    .enum(['RANDOM', 'EQUAL_WEIGHT', 'FIXED', 'PER_GAME'])
    .optional(),
  defaultOpponentAlgorithm: z
    .enum(['RANDOM', 'EQUAL_WEIGHT', 'OPPONENT_WEIGHT', 'PLAY_WITHIN_CLASS'])
    .optional(),
  defaultScoringSystem: z
    .enum([
      'RALLY_21',
      'RALLY_21_SETTING',
      'RALLY_21_NO_SETTING',
      'SHORT_15',
      'SHORT_7',
      'CUSTOM_CAP',
      'SERVICE_OVER_15',
    ])
    .optional(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getUserClubRole(session.user.id, params.clubId)
  if (!role) {
    return NextResponse.json({ error: 'Not a member' }, { status: 403 })
  }

  const club = await prisma.club.findUnique({
    where: { id: params.clubId },
    include: {
      _count: { select: { memberships: true } },
      clubSessions: {
        orderBy: { date: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          date: true,
          status: true,
          courts: true,
          _count: { select: { sessionPlayers: true, games: true } },
        },
      },
    },
  })

  if (!club) {
    return NextResponse.json({ error: 'Club not found' }, { status: 404 })
  }

  return NextResponse.json({ ...club, userRole: role })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getUserClubRole(session.user.id, params.clubId)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updateClubSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const club = await prisma.club.update({
    where: { id: params.clubId },
    data: parsed.data,
  })

  return NextResponse.json(club)
}

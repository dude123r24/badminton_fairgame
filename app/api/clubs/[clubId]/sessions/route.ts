import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const createSessionSchema = z.object({
  name: z.string().max(100).optional(),
  date: z.string().datetime(),
  courts: z.number().int().min(1).max(20),
  courtNumbers: z.array(z.number().int().min(1)).min(1),
  pairingAlgorithm: z.enum(['RANDOM', 'EQUAL_WEIGHT', 'FIXED', 'PER_GAME']),
  opponentAlgorithm: z.enum([
    'RANDOM',
    'EQUAL_WEIGHT',
    'OPPONENT_WEIGHT',
    'PLAY_WITHIN_CLASS',
  ]),
  pairingMode: z.enum(['FIXED', 'PER_GAME']),
  matchFormat: z.enum(['FIXED_PAIR', 'ROTATING_PARTNER', 'RANDOM_PAIR']),
  tournamentStructure: z.enum([
    'CLUB_ROTATION',
    'ROUND_ROBIN',
    'SWISS',
    'SINGLE_ELIM',
    'DOUBLE_ELIM',
    'COMBO',
  ]),
  scoringSystem: z.enum([
    'RALLY_21',
    'RALLY_21_SETTING',
    'RALLY_21_NO_SETTING',
    'SHORT_15',
    'SHORT_7',
    'CUSTOM_CAP',
    'SERVICE_OVER_15',
  ]),
  customCapScore: z.number().int().min(1).optional(),
  seasonId: z.string().optional(),
})

export async function GET(
  req: NextRequest,
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

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const sessions = await prisma.clubSession.findMany({
    where: {
      clubId: params.clubId,
      ...(status ? { status: status as 'UPCOMING' | 'ACTIVE' | 'ENDED' } : {}),
    },
    orderBy: { date: 'desc' },
    select: {
      id: true,
      name: true,
      date: true,
      status: true,
      courts: true,
      scoringSystem: true,
      pairingAlgorithm: true,
      _count: { select: { sessionPlayers: true, games: true } },
    },
  })

  return NextResponse.json(sessions)
}

export async function POST(
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
  const parsed = createSessionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { seasonId, ...rest } = parsed.data

  const clubSession = await prisma.clubSession.create({
    data: {
      ...rest,
      date: new Date(rest.date),
      clubId: params.clubId,
      createdBy: session.user.id,
      ...(seasonId ? { seasonId } : {}),
    },
  })

  return NextResponse.json(clubSession, { status: 201 })
}

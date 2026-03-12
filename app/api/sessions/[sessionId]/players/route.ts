import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const addPlayerSchema = z.union([
  z.object({ userId: z.string().min(1), guestName: z.undefined().optional(), guestEmail: z.undefined().optional() }),
  z.object({ guestName: z.string().min(1), guestEmail: z.string().email().optional(), userId: z.undefined().optional() }),
])

async function getClubRole(sessionId: string, userId: string) {
  const s = await prisma.clubSession.findUnique({
    where: { id: sessionId },
    select: { clubId: true },
  })
  if (!s) return null
  return getUserClubRole(userId, s.clubId)
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getClubRole(params.sessionId, session.user.id)
  if (!role) {
    return NextResponse.json({ error: 'Not found or no access' }, { status: 404 })
  }

  const players = await prisma.sessionPlayer.findMany({
    where: { sessionId: params.sessionId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { joinedAt: 'asc' },
  })

  return NextResponse.json(players)
}

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getClubRole(params.sessionId, session.user.id)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = addPlayerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // If guest has email, check if a registered user exists — auto-link
  let resolvedUserId = parsed.data.userId ?? null
  const guestEmail = ('guestEmail' in parsed.data ? parsed.data.guestEmail : null) ?? null

  if (!resolvedUserId && guestEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: guestEmail },
      select: { id: true },
    })
    if (existingUser) resolvedUserId = existingUser.id
  }

  // Check for duplicate
  if (resolvedUserId) {
    const existing = await prisma.sessionPlayer.findFirst({
      where: { sessionId: params.sessionId, userId: resolvedUserId },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'Player already in session' },
        { status: 409 }
      )
    }
  }

  const player = await prisma.sessionPlayer.create({
    data: {
      sessionId: params.sessionId,
      userId: resolvedUserId,
      guestName: resolvedUserId ? null : (parsed.data.guestName ?? null),
      guestEmail: resolvedUserId ? null : guestEmail,
      status: 'AVAILABLE',
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  })

  return NextResponse.json(player, { status: 201 })
}

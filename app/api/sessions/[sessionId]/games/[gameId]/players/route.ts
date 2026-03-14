import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { z } from 'zod'

const swapPlayerSchema = z.object({
  oldSessionPlayerId: z.string().min(1),
  newSessionPlayerId: z.string().min(1),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string; gameId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await prisma.game.findUnique({
    where: { id: params.gameId },
    include: {
      session: { select: { clubId: true } },
      gamePlayers: { select: { id: true, sessionPlayerId: true, team: true } },
    },
  })

  if (!game || game.sessionId !== params.sessionId) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  const role = await getUserClubRole(session.user.id, game.session.clubId)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  if (game.status === 'COMPLETED') {
    return NextResponse.json({ error: 'Cannot modify a completed game' }, { status: 400 })
  }

  const body = await req.json()
  const parsed = swapPlayerSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { oldSessionPlayerId, newSessionPlayerId } = parsed.data

  if (oldSessionPlayerId === newSessionPlayerId) {
    return NextResponse.json({ error: 'Same player selected' }, { status: 400 })
  }

  const gamePlayer = game.gamePlayers.find(gp => gp.sessionPlayerId === oldSessionPlayerId)
  if (!gamePlayer) {
    return NextResponse.json({ error: 'Player not found in this game' }, { status: 400 })
  }

  const alreadyInGame = game.gamePlayers.some(gp => gp.sessionPlayerId === newSessionPlayerId)
  if (alreadyInGame) {
    return NextResponse.json({ error: 'Replacement player is already in this game' }, { status: 409 })
  }

  const busyInOtherGame = await prisma.gamePlayer.findFirst({
    where: {
      sessionPlayerId: newSessionPlayerId,
      game: {
        sessionId: params.sessionId,
        status: { in: ['IN_PROGRESS', 'QUEUED'] },
        id: { not: params.gameId },
      },
    },
  })

  if (busyInOtherGame) {
    return NextResponse.json({ error: 'Replacement player is in another active game' }, { status: 409 })
  }

  const newPlayer = await prisma.sessionPlayer.findUnique({
    where: { id: newSessionPlayerId },
    include: { user: { select: { id: true, name: true } } },
  })

  if (!newPlayer || newPlayer.sessionId !== params.sessionId) {
    return NextResponse.json({ error: 'Replacement player not found in this session' }, { status: 404 })
  }

  const oldPlayer = await prisma.sessionPlayer.findUnique({
    where: { id: oldSessionPlayerId },
    include: { user: { select: { id: true, name: true } } },
  })

  const oldName = oldPlayer?.user?.name ?? oldPlayer?.guestName ?? 'Unknown'
  const newName = newPlayer.user?.name ?? newPlayer.guestName ?? 'Unknown'

  await prisma.$transaction([
    prisma.gamePlayer.update({
      where: { id: gamePlayer.id },
      data: { sessionPlayerId: newSessionPlayerId },
    }),
    prisma.gameAuditLog.create({
      data: {
        gameId: params.gameId,
        action: 'PLAYER_SWAP',
        details: {
          oldSessionPlayerId,
          newSessionPlayerId,
          oldPlayerName: oldName,
          newPlayerName: newName,
          team: gamePlayer.team,
        },
        performedBy: session.user.id,
      },
    }),
  ])

  const updated = await prisma.game.findUnique({
    where: { id: params.gameId },
    include: {
      gamePlayers: {
        include: {
          sessionPlayer: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
      auditLogs: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { user: { select: { id: true, name: true } } },
      },
    },
  })

  return NextResponse.json(updated)
}

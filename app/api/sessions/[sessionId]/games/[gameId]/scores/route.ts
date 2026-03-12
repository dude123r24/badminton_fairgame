import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { updatePlayersRatings } from '@/lib/algorithms/rating'
import { z } from 'zod'

const scoreSchema = z.object({
  teamAScore: z.number().int().min(0),
  teamBScore: z.number().int().min(0),
})

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string; gameId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Validate club access
  const s = await prisma.clubSession.findUnique({
    where: { id: params.sessionId },
    select: { clubId: true },
  })
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const role = await getUserClubRole(session.user.id, s.clubId)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = scoreSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { teamAScore, teamBScore } = parsed.data

  if (teamAScore === teamBScore) {
    return NextResponse.json(
      { error: 'Scores cannot be equal — there must be a winner' },
      { status: 400 }
    )
  }

  // Fetch game with players
  const game = await prisma.game.findUnique({
    where: { id: params.gameId },
    include: {
      gamePlayers: {
        include: {
          sessionPlayer: {
            select: { id: true, userId: true },
          },
        },
      },
      sets: true,
    },
  })

  if (!game || game.sessionId !== params.sessionId) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  }

  if (game.status === 'COMPLETED') {
    return NextResponse.json(
      { error: 'Game already completed' },
      { status: 409 }
    )
  }

  const winner: 'A' | 'B' = teamAScore > teamBScore ? 'A' : 'B'
  const setNumber = game.sets.length + 1
  const isDeuceApplied =
    (teamAScore >= 20 && teamBScore >= 20) ||
    (teamAScore >= 14 && teamBScore >= 14 && game.sessionId.length > 0)

  // Create the set and mark game complete in a transaction
  const [gameSet] = await prisma.$transaction(async (tx) => {
    const set = await tx.gameSet.create({
      data: {
        gameId: params.gameId,
        setNumber,
        teamAScore,
        teamBScore,
        winner,
        isDeuceApplied,
        enteredBy: session.user.id,
      },
    })

    await tx.game.update({
      where: { id: params.gameId },
      data: { status: 'COMPLETED', endedAt: new Date() },
    })

    return [set]
  })

  // Update ELO ratings for real users
  const teamAPlayerIds = game.gamePlayers
    .filter((gp) => gp.team === 'A' && gp.sessionPlayer.userId)
    .map((gp) => gp.sessionPlayer.userId!)
  const teamBPlayerIds = game.gamePlayers
    .filter((gp) => gp.team === 'B' && gp.sessionPlayer.userId)
    .map((gp) => gp.sessionPlayer.userId!)

  if (teamAPlayerIds.length > 0 || teamBPlayerIds.length > 0) {
    const allUserIds = [...teamAPlayerIds, ...teamBPlayerIds]
    const profiles = await prisma.playerProfile.findMany({
      where: { userId: { in: allUserIds }, clubId: s.clubId },
      select: { userId: true, rating: true, class: true },
    })
    const profileMap = new Map(profiles.map((p) => [p.userId, p]))

    const toRatingPlayer = (id: string) => {
      const p = profileMap.get(id)
      return { id, rating: p?.rating ?? 1500, class: p?.class ?? ('INTERMEDIATE' as const) }
    }

    const winners = (winner === 'A' ? teamAPlayerIds : teamBPlayerIds).map(toRatingPlayer)
    const losers = (winner === 'A' ? teamBPlayerIds : teamAPlayerIds).map(toRatingPlayer)

    if (winners.length > 0 && losers.length > 0) {
      const ratingUpdates = updatePlayersRatings(winners, losers)

      await prisma.$transaction(
        ratingUpdates.map((update) =>
          prisma.playerProfile.update({
            where: { userId_clubId: { userId: update.playerId, clubId: s.clubId } },
            data: { rating: update.newRating },
          })
        )
      )
    }
  }

  return NextResponse.json(gameSet, { status: 201 })
}

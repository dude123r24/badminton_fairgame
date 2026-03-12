import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: { clubId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const role = await getUserClubRole(session.user.id, params.clubId)
  if (!role) return NextResponse.json({ error: 'No access' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('sessionId') ?? undefined

  // Get all PlayerProfiles for this club
  const profiles = await prisma.playerProfile.findMany({
    where: { clubId: params.clubId },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  })

  if (profiles.length === 0) {
    return NextResponse.json([])
  }

  // Determine which session IDs to scope to
  let sessionIds: string[]
  if (sessionId) {
    sessionIds = [sessionId]
  } else {
    const sessions = await prisma.clubSession.findMany({
      where: { clubId: params.clubId },
      select: { id: true },
    })
    sessionIds = sessions.map((s) => s.id)
  }

  if (sessionIds.length === 0) {
    return NextResponse.json(
      profiles.map((p) => ({
        userId: p.userId,
        name: p.user.name ?? 'Unknown',
        image: p.user.image,
        rating: p.rating,
        class: p.class,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
      }))
    )
  }

  // Load all completed games with players for these sessions
  const completedGames = await prisma.game.findMany({
    where: {
      sessionId: { in: sessionIds },
      status: 'COMPLETED',
    },
    include: {
      sets: { orderBy: { setNumber: 'asc' }, take: 1 },
      gamePlayers: {
        include: {
          sessionPlayer: { select: { userId: true } },
        },
      },
    },
  })

  // Compute per-user stats
  const statsMap = new Map<string, { games: number; wins: number }>()
  // Initialize all profiled users at 0
  profiles.forEach((p) => {
    statsMap.set(p.userId, { games: 0, wins: 0 })
  })

  for (const game of completedGames) {
    const gameSet = game.sets[0]
    if (!gameSet) continue

    for (const gp of game.gamePlayers) {
      const userId = gp.sessionPlayer.userId
      if (!userId) continue
      // Only count profiled players (club members)
      if (!statsMap.has(userId)) continue

      const stats = statsMap.get(userId)!
      stats.games++
      if (gameSet.winner === gp.team) {
        stats.wins++
      }
    }
  }

  // Build response
  const standings = profiles
    .map((p) => {
      const stats = statsMap.get(p.userId) ?? { games: 0, wins: 0 }
      const losses = stats.games - stats.wins
      const winRate = stats.games > 0 ? stats.wins / stats.games : 0
      return {
        userId: p.userId,
        name: p.user.name ?? 'Unknown',
        image: p.user.image,
        rating: Math.round(p.rating),
        class: p.class,
        gamesPlayed: stats.games,
        wins: stats.wins,
        losses,
        winRate: Math.round(winRate * 100),
      }
    })
    // Sort by rating desc, then wins desc
    .sort((a, b) => b.rating - a.rating || b.wins - a.wins)

  return NextResponse.json(standings)
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: { playerId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const clubId = searchParams.get('clubId') ?? undefined

  // Verify the requested player exists
  const player = await prisma.user.findUnique({
    where: { id: params.playerId },
    select: { id: true, name: true, image: true },
  })
  if (!player) return NextResponse.json({ error: 'Player not found' }, { status: 404 })

  // Build profile filter
  const profileWhere = clubId
    ? { userId: params.playerId, clubId }
    : { userId: params.playerId }

  const profiles = await prisma.playerProfile.findMany({
    where: profileWhere,
    include: { club: { select: { id: true, name: true } } },
  })

  // Get all session IDs the player has participated in (scoped to club if provided)
  const sessionPlayerWhere = clubId
    ? { userId: params.playerId, session: { clubId } }
    : { userId: params.playerId }

  const sessionPlayers = await prisma.sessionPlayer.findMany({
    where: sessionPlayerWhere,
    select: { id: true, sessionId: true },
  })

  const sessionPlayerIds = sessionPlayers.map((sp) => sp.id)
  const uniqueSessionIds = [...new Set(sessionPlayers.map((sp) => sp.sessionId))]

  if (sessionPlayerIds.length === 0) {
    return NextResponse.json({
      userId: player.id,
      name: player.name ?? 'Unknown',
      image: player.image,
      profiles: profiles.map((p) => ({
        clubId: p.clubId,
        clubName: p.club.name,
        rating: Math.round(p.rating),
        class: p.class,
      })),
      sessionsAttended: 0,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      opponents: [],
    })
  }

  // Load all completed games this player participated in
  const gamePlayers = await prisma.gamePlayer.findMany({
    where: {
      sessionPlayerId: { in: sessionPlayerIds },
      game: { status: 'COMPLETED' },
    },
    include: {
      game: {
        include: {
          sets: { orderBy: { setNumber: 'asc' }, take: 1 },
          gamePlayers: {
            include: {
              sessionPlayer: { select: { userId: true, guestName: true } },
            },
          },
        },
      },
    },
  })

  let gamesPlayed = 0
  let wins = 0
  // Track opponent encounter counts
  const opponentMap = new Map<string, { name: string; games: number; wins: number }>()

  for (const gp of gamePlayers) {
    const gameSet = gp.game.sets[0]
    if (!gameSet) continue

    gamesPlayed++
    const won = gameSet.winner === gp.team
    if (won) wins++

    // Track opponents (the other team)
    for (const other of gp.game.gamePlayers) {
      if (other.team === gp.team) continue // same team — skip
      const oppUserId = other.sessionPlayer.userId
      const oppName = other.sessionPlayer.userId ? null : other.sessionPlayer.guestName
      if (!oppUserId && !oppName) continue

      const key = oppUserId ?? `guest:${oppName}`
      if (!opponentMap.has(key)) {
        opponentMap.set(key, { name: oppName ?? 'Unknown', games: 0, wins: 0 })
      }
      const opp = opponentMap.get(key)!
      opp.games++
      if (won) opp.wins++ // player won against this opponent
    }
  }

  // Fetch names for user-based opponents
  const oppUserIds = [...opponentMap.keys()].filter((k) => !k.startsWith('guest:'))
  if (oppUserIds.length > 0) {
    const oppUsers = await prisma.user.findMany({
      where: { id: { in: oppUserIds } },
      select: { id: true, name: true },
    })
    oppUsers.forEach((u) => {
      const entry = opponentMap.get(u.id)
      if (entry) entry.name = u.name ?? entry.name
    })
  }

  const opponents = [...opponentMap.entries()]
    .map(([key, data]) => ({
      userId: key.startsWith('guest:') ? null : key,
      name: data.name,
      gamesAgainst: data.games,
      winsAgainst: data.wins,
    }))
    .sort((a, b) => b.gamesAgainst - a.gamesAgainst)
    .slice(0, 10) // top 10 opponents

  return NextResponse.json({
    userId: player.id,
    name: player.name ?? 'Unknown',
    image: player.image,
    profiles: profiles.map((p) => ({
      clubId: p.clubId,
      clubName: p.club.name,
      rating: Math.round(p.rating),
      class: p.class,
    })),
    sessionsAttended: uniqueSessionIds.length,
    gamesPlayed,
    wins,
    losses: gamesPlayed - wins,
    winRate: gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0,
    opponents,
  })
}

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import { generatePairs, generateMatches } from '@/lib/algorithms/pairing'
import type { Player } from '@/lib/algorithms/pairing'

async function getSessionData(sessionId: string) {
  return prisma.clubSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      clubId: true,
      courts: true,
      courtNumbers: true,
      pairingAlgorithm: true,
      opponentAlgorithm: true,
      status: true,
    },
  })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const s = await getSessionData(params.sessionId)
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const role = await getUserClubRole(session.user.id, s.clubId)
  if (!role) return NextResponse.json({ error: 'No access' }, { status: 403 })

  const games = await prisma.game.findMany({
    where: { sessionId: params.sessionId },
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
  })

  return NextResponse.json(games)
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const s = await getSessionData(params.sessionId)
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const role = await getUserClubRole(session.user.id, s.clubId)
  if (!role || (role !== 'OWNER' && role !== 'ADMIN')) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  if (s.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Session must be active to generate games' },
      { status: 400 }
    )
  }

  // Get players already in an active or queued game
  const busyGamePlayerIds = await prisma.gamePlayer.findMany({
    where: {
      game: { sessionId: params.sessionId, status: { in: ['IN_PROGRESS', 'QUEUED'] } },
    },
    select: { sessionPlayerId: true },
  })
  const busyIds = new Set(busyGamePlayerIds.map((gp) => gp.sessionPlayerId))

  const availablePlayers = await prisma.sessionPlayer.findMany({
    where: {
      sessionId: params.sessionId,
      status: 'AVAILABLE',
      id: { notIn: [...busyIds] },
    },
    include: {
      user: { select: { id: true, name: true } },
    },
  })

  if (availablePlayers.length < 4) {
    return NextResponse.json(
      { error: 'Need at least 4 available players to generate a game' },
      { status: 400 }
    )
  }

  const profileMap = new Map<string, { rating: number; class: 'AMATEUR' | 'INTERMEDIATE' | 'ADVANCED' }>()
  const userIds = availablePlayers
    .filter((p) => p.userId)
    .map((p) => p.userId!)

  const profiles = await prisma.playerProfile.findMany({
    where: { userId: { in: userIds }, clubId: s.clubId },
    select: { userId: true, rating: true, class: true },
  })
  profiles.forEach((p) => profileMap.set(p.userId, { rating: p.rating, class: p.class }))

  // Build session history for each player (partners, opponents, game counts, wait times)
  const completedGames = await prisma.game.findMany({
    where: { sessionId: params.sessionId, status: 'COMPLETED' },
    include: { gamePlayers: { select: { sessionPlayerId: true, team: true } } },
    orderBy: { endedAt: 'desc' },
  })

  const historyMap = new Map<string, {
    gamesPlayed: number
    lastGameEndedAt: number | null
    recentPartnerIds: string[]
    recentOpponentIds: string[]
  }>()

  for (const g of completedGames) {
    const endedAt = g.endedAt ? g.endedAt.getTime() : null
    const teamA = g.gamePlayers.filter(gp => gp.team === 'A').map(gp => gp.sessionPlayerId)
    const teamB = g.gamePlayers.filter(gp => gp.team === 'B').map(gp => gp.sessionPlayerId)

    for (const gp of g.gamePlayers) {
      const id = gp.sessionPlayerId
      const prev = historyMap.get(id) ?? {
        gamesPlayed: 0,
        lastGameEndedAt: null,
        recentPartnerIds: [],
        recentOpponentIds: [],
      }
      prev.gamesPlayed++
      if (endedAt && (prev.lastGameEndedAt === null || endedAt > prev.lastGameEndedAt)) {
        prev.lastGameEndedAt = endedAt
      }
      const myTeam = gp.team === 'A' ? teamA : teamB
      const oppTeam = gp.team === 'A' ? teamB : teamA
      const partner = myTeam.find(pid => pid !== id)
      if (partner) prev.recentPartnerIds.push(partner)
      prev.recentOpponentIds.push(...oppTeam)
      historyMap.set(id, prev)
    }
  }

  const players: Player[] = availablePlayers.map((sp) => {
    const profile = sp.userId ? profileMap.get(sp.userId) : undefined
    const history = historyMap.get(sp.id)
    return {
      id: sp.id,
      name: sp.user?.name ?? sp.guestName ?? 'Guest',
      rating: profile?.rating ?? 1500,
      class: profile?.class ?? 'INTERMEDIATE',
      gamesPlayed: history?.gamesPlayed ?? 0,
      lastGameEndedAt: history?.lastGameEndedAt ?? null,
      recentPartnerIds: history?.recentPartnerIds ?? [],
      recentOpponentIds: history?.recentOpponentIds ?? [],
    }
  })

  // Find the first free court, or queue if all occupied
  const inProgressGames = await prisma.game.findMany({
    where: { sessionId: params.sessionId, status: 'IN_PROGRESS' },
    select: { courtNumber: true },
  })
  const occupiedCourts = new Set(inProgressGames.map((g) => g.courtNumber))
  const courtNums = s.courtNumbers
  const freeCourt = courtNums.find((c: number) => !occupiedCourts.has(c))

  // Generate exactly one match
  const pairs = generatePairs(players, s.pairingAlgorithm)
  const matches = generateMatches(pairs, s.courts, s.opponentAlgorithm, players, 1)

  if (matches.length === 0) {
    return NextResponse.json(
      { error: 'Could not generate a match with available players' },
      { status: 400 }
    )
  }

  const match = matches[0]
  const game = await prisma.game.create({
    data: {
      sessionId: params.sessionId,
      courtNumber: freeCourt ?? 0,
      type: 'DOUBLES',
      status: freeCourt ? 'IN_PROGRESS' : 'QUEUED',
      pairingAlgorithm: s.pairingAlgorithm,
      opponentAlgorithm: s.opponentAlgorithm,
      gamePlayers: {
        create: [
          { sessionPlayerId: match.teamA.player1.id, team: 'A' },
          { sessionPlayerId: match.teamA.player2.id, team: 'A' },
          { sessionPlayerId: match.teamB.player1.id, team: 'B' },
          { sessionPlayerId: match.teamB.player2.id, team: 'B' },
        ],
      },
    },
    include: {
      gamePlayers: {
        include: {
          sessionPlayer: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  })

  return NextResponse.json(game, { status: 201 })
}

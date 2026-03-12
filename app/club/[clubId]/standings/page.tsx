import { getSession } from '@/lib/auth-helpers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getUserClubRole } from '@/lib/auth-helpers'
import Link from 'next/link'

interface StandingRow {
  userId: string
  name: string
  image: string | null
  rating: number
  class: 'AMATEUR' | 'INTERMEDIATE' | 'ADVANCED'
  gamesPlayed: number
  wins: number
  losses: number
  winRate: number
}

const classConfig = {
  ADVANCED: { label: 'Adv', color: 'bg-amber-100 text-amber-700' },
  INTERMEDIATE: { label: 'Int', color: 'bg-blue-50 text-blue-600' },
  AMATEUR: { label: 'Ama', color: 'bg-gray-100 text-gray-500' },
}

function PlayerAvatar({ name, image, size = 32 }: { name: string; image: string | null; size?: number }) {
  const initial = name.charAt(0).toUpperCase()
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt={name} width={size} height={size} className="rounded-full object-cover" />
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initial}
    </div>
  )
}

async function getStandings(clubId: string): Promise<StandingRow[]> {
  const profiles = await prisma.playerProfile.findMany({
    where: { clubId },
    include: { user: { select: { id: true, name: true, image: true } } },
  })

  if (profiles.length === 0) return []

  const sessionIds = await prisma.clubSession
    .findMany({ where: { clubId }, select: { id: true } })
    .then((s) => s.map((s) => s.id))

  if (sessionIds.length === 0) {
    return profiles.map((p) => ({
      userId: p.userId,
      name: p.user.name ?? 'Unknown',
      image: p.user.image,
      rating: Math.round(p.rating),
      class: p.class,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
    }))
  }

  const completedGames = await prisma.game.findMany({
    where: { sessionId: { in: sessionIds }, status: 'COMPLETED' },
    include: {
      sets: { orderBy: { setNumber: 'asc' }, take: 1 },
      gamePlayers: { include: { sessionPlayer: { select: { userId: true } } } },
    },
  })

  const statsMap = new Map<string, { games: number; wins: number }>()
  profiles.forEach((p) => statsMap.set(p.userId, { games: 0, wins: 0 }))

  for (const game of completedGames) {
    const gameSet = game.sets[0]
    if (!gameSet) continue
    for (const gp of game.gamePlayers) {
      const userId = gp.sessionPlayer.userId
      if (!userId || !statsMap.has(userId)) continue
      const stats = statsMap.get(userId)!
      stats.games++
      if (gameSet.winner === gp.team) stats.wins++
    }
  }

  return profiles
    .map((p) => {
      const stats = statsMap.get(p.userId) ?? { games: 0, wins: 0 }
      const losses = stats.games - stats.wins
      return {
        userId: p.userId,
        name: p.user.name ?? 'Unknown',
        image: p.user.image,
        rating: Math.round(p.rating),
        class: p.class,
        gamesPlayed: stats.games,
        wins: stats.wins,
        losses,
        winRate: stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0,
      }
    })
    .sort((a, b) => b.rating - a.rating || b.wins - a.wins)
}

export default async function StandingsPage({ params }: { params: { clubId: string } }) {
  const session = await getSession()
  if (!session) redirect('/')

  const role = await getUserClubRole(session.user.id, params.clubId)
  if (!role) redirect('/dashboard')

  const club = await prisma.club.findUnique({
    where: { id: params.clubId },
    select: { id: true, name: true },
  })
  if (!club) redirect('/dashboard')

  const standings = await getStandings(params.clubId)

  const topThree = standings.slice(0, 3)
  const rest = standings.slice(3)

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[48px] pt-[24px]">
      {/* Back nav */}
      <Link
        href={`/club/${params.clubId}`}
        className="mb-[20px] flex items-center gap-[6px] text-[13px] text-gray-400 hover:text-gray-600"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {club.name}
      </Link>

      {/* Header */}
      <div className="mb-[24px]">
        <h1 className="text-[24px] font-bold tracking-tight text-gray-900">Standings</h1>
        <p className="mt-[2px] text-[13px] text-gray-400">All-time leaderboard · {standings.length} players</p>
      </div>

      {standings.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed border-gray-200 py-[48px] text-center">
          <span className="mb-[12px] text-[48px]">🏆</span>
          <p className="mb-[4px] text-[16px] font-semibold text-gray-900">No standings yet</p>
          <p className="text-[14px] text-gray-500">Standings appear after players complete games</p>
        </div>
      ) : (
        <>
          {/* Podium for top 3 */}
          {topThree.length >= 2 && (
            <div className="mb-[24px] flex items-end justify-center gap-[12px]">
              {/* 2nd place */}
              {topThree[1] && (
                <div className="flex flex-col items-center gap-[8px]">
                  <PlayerAvatar name={topThree[1].name} image={topThree[1].image} size={40} />
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-gray-700">{topThree[1].name.split(' ')[0]}</p>
                    <p className="text-[11px] text-gray-400">{topThree[1].rating}</p>
                  </div>
                  <div className="flex h-[56px] w-[80px] items-center justify-center rounded-t-xl bg-gray-100">
                    <span className="text-[20px] font-bold text-gray-400">2</span>
                  </div>
                </div>
              )}
              {/* 1st place */}
              <div className="flex flex-col items-center gap-[8px]">
                <span className="text-[20px]">🏆</span>
                <PlayerAvatar name={topThree[0].name} image={topThree[0].image} size={48} />
                <div className="text-center">
                  <p className="text-[13px] font-bold text-gray-900">{topThree[0].name.split(' ')[0]}</p>
                  <p className="text-[11px] text-gray-400">{topThree[0].rating}</p>
                </div>
                <div className="flex h-[72px] w-[80px] items-center justify-center rounded-t-xl bg-amber-400/20">
                  <span className="text-[24px] font-bold text-amber-500">1</span>
                </div>
              </div>
              {/* 3rd place */}
              {topThree[2] && (
                <div className="flex flex-col items-center gap-[8px]">
                  <PlayerAvatar name={topThree[2].name} image={topThree[2].image} size={40} />
                  <div className="text-center">
                    <p className="text-[12px] font-semibold text-gray-700">{topThree[2].name.split(' ')[0]}</p>
                    <p className="text-[11px] text-gray-400">{topThree[2].rating}</p>
                  </div>
                  <div className="flex h-[40px] w-[80px] items-center justify-center rounded-t-xl bg-amber-100/50">
                    <span className="text-[18px] font-bold text-amber-700/50">3</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full leaderboard table */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_12px_rgba(0,0,0,0.02)]">
            {/* Table header */}
            <div className="grid grid-cols-[32px_1fr_56px_56px_56px_56px] items-center gap-[8px] border-b border-gray-100 px-[16px] py-[10px]">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">#</span>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Player</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">Rating</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">G</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">W</span>
              <span className="text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400">Win%</span>
            </div>

            {/* All rows */}
            {standings.map((player, idx) => {
              const cls = classConfig[player.class]
              const isCurrentUser = player.userId === session.user.id
              return (
                <div
                  key={player.userId}
                  className={`grid grid-cols-[32px_1fr_56px_56px_56px_56px] items-center gap-[8px] px-[16px] py-[12px] ${
                    idx < standings.length - 1 ? 'border-b border-gray-50' : ''
                  } ${isCurrentUser ? 'bg-primary/[0.03]' : ''}`}
                >
                  {/* Rank */}
                  <span className={`text-center text-[13px] font-bold ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700/50' : 'text-gray-300'}`}>
                    {idx + 1}
                  </span>

                  {/* Player */}
                  <div className="flex min-w-0 items-center gap-[10px]">
                    <PlayerAvatar name={player.name} image={player.image} size={28} />
                    <div className="min-w-0">
                      <p className={`truncate text-[13px] font-semibold ${isCurrentUser ? 'text-primary' : 'text-gray-900'}`}>
                        {player.name}
                        {isCurrentUser && <span className="ml-[4px] text-[10px] font-medium text-primary/60">you</span>}
                      </p>
                      <span className={`inline-block rounded-full px-[6px] py-[1px] text-[10px] font-semibold ${cls.color}`}>
                        {cls.label}
                      </span>
                    </div>
                  </div>

                  {/* Rating */}
                  <span className="text-center text-[13px] font-semibold text-gray-700">{player.rating}</span>

                  {/* Games */}
                  <span className="text-center text-[13px] text-gray-500">{player.gamesPlayed}</span>

                  {/* Wins */}
                  <span className="text-center text-[13px] text-gray-500">{player.wins}</span>

                  {/* Win% */}
                  <span className={`text-center text-[13px] font-medium ${player.winRate >= 60 ? 'text-primary' : player.winRate >= 40 ? 'text-gray-600' : 'text-gray-400'}`}>
                    {player.gamesPlayed > 0 ? `${player.winRate}%` : '–'}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-[16px] flex items-center gap-[12px] text-[11px] text-gray-400">
            <span>G = Games played</span>
            <span>·</span>
            <span>W = Wins</span>
            <span>·</span>
            <span>Win% = Win percentage</span>
          </div>
        </>
      )}
    </main>
  )
}

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
    return <img src={image} alt={`${name} avatar`} width={size} height={size} className="rounded-full object-cover" />
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
    <main className="mx-auto max-w-[768px] px-[16px] pb-[80px] pt-[16px] sm:px-[24px] sm:pt-[24px]">
      <Link
        href={`/club/${params.clubId}`}
        className="mb-[16px] inline-flex min-h-[44px] items-center gap-[6px] text-sm transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {club.name}
      </Link>

      <div className="mb-[24px]">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Standings</h1>
        <p className="mt-[4px] text-sm" style={{ color: 'var(--text-tertiary)' }}>All-time leaderboard · {standings.length} players</p>
      </div>

      {standings.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border-2 border-dashed py-[48px] text-center" style={{ borderColor: 'var(--border-default)' }}>
          <span className="mb-[12px] text-[48px]">🏆</span>
          <p className="mb-[4px] text-base font-semibold" style={{ color: 'var(--text-primary)' }}>No standings yet</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Standings appear after players complete games</p>
        </div>
      ) : (
        <>
          {topThree.length >= 2 && (
            <div className="mb-[24px] flex items-end justify-center gap-[12px] sm:gap-[16px]">
              {topThree[1] && (
                <div className="flex flex-col items-center gap-[8px]">
                  <PlayerAvatar name={topThree[1].name} image={topThree[1].image} size={40} />
                  <div className="text-center">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{topThree[1].name.split(' ')[0]}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{topThree[1].rating}</p>
                  </div>
                  <div className="flex h-[56px] w-[72px] items-center justify-center rounded-t-xl sm:w-[80px]" style={{ backgroundColor: 'var(--bg-hover)' }}>
                    <span className="text-xl font-bold" style={{ color: 'var(--text-tertiary)' }}>2</span>
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center gap-[8px]">
                <span className="text-xl">🏆</span>
                <PlayerAvatar name={topThree[0].name} image={topThree[0].image} size={48} />
                <div className="text-center">
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{topThree[0].name.split(' ')[0]}</p>
                  <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{topThree[0].rating}</p>
                </div>
                <div className="flex h-[72px] w-[72px] items-center justify-center rounded-t-xl bg-amber-400/20 sm:w-[80px]">
                  <span className="text-2xl font-bold text-amber-500">1</span>
                </div>
              </div>
              {topThree[2] && (
                <div className="flex flex-col items-center gap-[8px]">
                  <PlayerAvatar name={topThree[2].name} image={topThree[2].image} size={40} />
                  <div className="text-center">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{topThree[2].name.split(' ')[0]}</p>
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{topThree[2].rating}</p>
                  </div>
                  <div className="flex h-[40px] w-[72px] items-center justify-center rounded-t-xl bg-amber-100/50 sm:w-[80px]">
                    <span className="text-lg font-bold text-amber-700/50">3</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Mobile: Card layout */}
          <div className="space-y-[6px] sm:hidden">
            {standings.map((player, idx) => {
              const cls = classConfig[player.class]
              const isCurrentUser = player.userId === session.user.id
              return (
                <div
                  key={player.userId}
                  className={`card flex items-center gap-[12px] px-[14px] py-[12px] ${isCurrentUser ? 'ring-1 ring-primary/20' : ''}`}
                >
                  <span className={`w-[24px] text-center text-sm font-bold ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700/50' : ''}`}
                    style={{ color: idx > 2 ? 'var(--text-tertiary)' : undefined }}>
                    {idx + 1}
                  </span>
                  <PlayerAvatar name={player.name} image={player.image} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-semibold ${isCurrentUser ? 'text-primary' : ''}`}
                      style={{ color: isCurrentUser ? undefined : 'var(--text-primary)' }}>
                      {player.name}
                      {isCurrentUser && <span className="ml-[4px] text-xs font-medium text-primary/60">you</span>}
                    </p>
                    <div className="flex items-center gap-[8px] text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      <span className={`inline-block rounded-full px-[6px] py-[1px] text-xs font-semibold ${cls.color}`}>{cls.label}</span>
                      <span>{player.gamesPlayed}G</span>
                      <span>{player.wins}W</span>
                      <span>{player.gamesPlayed > 0 ? `${player.winRate}%` : '-'}</span>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{player.rating}</span>
                </div>
              )
            })}
          </div>

          {/* Desktop: Table layout */}
          <div className="card hidden overflow-hidden sm:block">
            <div className="grid grid-cols-[32px_1fr_56px_56px_56px_56px] items-center gap-[8px] border-b px-[16px] py-[10px]" style={{ borderColor: 'var(--border-default)' }}>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>#</span>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Player</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Rating</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>G</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>W</span>
              <span className="text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Win%</span>
            </div>

            {standings.map((player, idx) => {
              const cls = classConfig[player.class]
              const isCurrentUser = player.userId === session.user.id
              return (
                <div
                  key={player.userId}
                  className={`grid grid-cols-[32px_1fr_56px_56px_56px_56px] items-center gap-[8px] px-[16px] py-[12px] ${
                    idx < standings.length - 1 ? 'border-b' : ''
                  } ${isCurrentUser ? 'bg-primary/[0.03]' : ''}`}
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className={`text-center text-sm font-bold ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-gray-400' : idx === 2 ? 'text-amber-700/50' : ''}`}
                    style={{ color: idx > 2 ? 'var(--text-tertiary)' : undefined }}>
                    {idx + 1}
                  </span>

                  <div className="flex min-w-0 items-center gap-[10px]">
                    <PlayerAvatar name={player.name} image={player.image} size={28} />
                    <div className="min-w-0">
                      <p className={`truncate text-sm font-semibold ${isCurrentUser ? 'text-primary' : ''}`}
                        style={{ color: isCurrentUser ? undefined : 'var(--text-primary)' }}>
                        {player.name}
                        {isCurrentUser && <span className="ml-[4px] text-xs font-medium text-primary/60">you</span>}
                      </p>
                      <span className={`inline-block rounded-full px-[6px] py-[1px] text-xs font-semibold ${cls.color}`}>
                        {cls.label}
                      </span>
                    </div>
                  </div>

                  <span className="text-center text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{player.rating}</span>
                  <span className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{player.gamesPlayed}</span>
                  <span className="text-center text-sm" style={{ color: 'var(--text-secondary)' }}>{player.wins}</span>
                  <span className={`text-center text-sm font-medium ${player.winRate >= 60 ? 'text-primary' : ''}`}
                    style={{ color: player.winRate >= 60 ? undefined : player.winRate >= 40 ? 'var(--text-secondary)' : 'var(--text-tertiary)' }}>
                    {player.gamesPlayed > 0 ? `${player.winRate}%` : '-'}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-[16px] flex items-center gap-[12px] text-xs" style={{ color: 'var(--text-tertiary)' }}>
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

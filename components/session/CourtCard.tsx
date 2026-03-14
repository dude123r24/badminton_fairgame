interface GamePlayer {
  id: string
  team: 'A' | 'B'
  sessionPlayer: {
    id: string
    user: { id: string; name: string } | null
    guestName?: string | null
  }
}

interface GameSet {
  id: string
  teamAScore: number
  teamBScore: number
  winner: 'A' | 'B'
}

interface Game {
  id: string
  courtNumber: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'QUEUED'
  gamePlayers: GamePlayer[]
  sets: GameSet[]
}

interface CourtCardProps {
  game?: Game
  courtNumber: number
  isAdmin: boolean
  onEnterScore: (game: Game) => void
  onEditPlayers?: (game: Game) => void
  isEmpty?: boolean
}

function shortName(gp: GamePlayer): string {
  return gp.sessionPlayer.user?.name?.split(' ')[0] ?? gp.sessionPlayer.guestName ?? 'Guest'
}

function EmptyCourt({ courtNumber }: { courtNumber: number }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-2 border-dashed" style={{ borderColor: 'var(--border-default)' }}>
      <div className="flex items-center justify-between px-[14px] py-[8px]">
        <span className="text-xs font-bold tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
          Court {courtNumber}
        </span>
      </div>
      <div className="flex h-[80px] items-center justify-center">
        <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>
          Available
        </span>
      </div>
    </div>
  )
}

export default function CourtCard({ game, courtNumber, isAdmin, onEnterScore, onEditPlayers, isEmpty }: CourtCardProps) {
  if (isEmpty || !game) return <EmptyCourt courtNumber={courtNumber} />

  const teamA = game.gamePlayers.filter((gp) => gp.team === 'A')
  const teamB = game.gamePlayers.filter((gp) => gp.team === 'B')
  const score = game.sets[game.sets.length - 1]
  const isPlaying = game.status === 'IN_PROGRESS'
  const isQueued = game.status === 'QUEUED'
  const isTappable = isAdmin && isPlaying

  const Wrapper = isTappable ? 'button' : 'div'

  return (
    <Wrapper
      {...(isTappable ? { onClick: () => onEnterScore(game), type: 'button' as const } : {})}
      className={`relative w-full overflow-hidden rounded-2xl text-left transition-transform ${isTappable ? 'cursor-pointer active:scale-[0.97]' : ''}`}
      style={{
        backgroundColor: isQueued ? 'var(--bg-card)' : '#1a5e2a',
        border: isQueued ? '1px dashed var(--border-default)' : 'none',
      }}
    >
      {/* Court surface with lines */}
      {!isQueued && (
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(180deg, #1a6e30 0%, #1a5e2a 50%, #1a6e30 100%)',
          }} />
          <div className="absolute inset-[6px] rounded-lg border-[1.5px] border-white/30" />
          <div className="absolute left-1/2 top-[6px] bottom-[6px] w-[1.5px] -translate-x-1/2 bg-white/40" />
          <div className="absolute left-[25%] top-[6px] bottom-[6px] w-[1px] bg-white/15" />
          <div className="absolute right-[25%] top-[6px] bottom-[6px] w-[1px] bg-white/15" />
          <div className="absolute top-1/2 left-[6px] right-[6px] h-[1px] -translate-y-1/2 bg-white/15" />
        </div>
      )}

      {/* Header */}
      <div className="relative flex items-center justify-between px-[14px] py-[8px]">
        <div className="flex items-center gap-[8px]">
          <span className="text-xs font-bold tabular-nums" style={{
            color: isQueued ? 'var(--text-secondary)' : 'rgba(255,255,255,0.8)',
          }}>
            {isQueued ? 'Up Next' : `Court ${game.courtNumber}`}
          </span>
          {isPlaying && (
            <span className="relative flex h-[6px] w-[6px]">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-60" />
              <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-white" />
            </span>
          )}
        </div>
        <div className="flex items-center gap-[6px]">
          {isAdmin && (isPlaying || isQueued) && onEditPlayers && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditPlayers(game) }}
              className="flex h-[28px] w-[28px] items-center justify-center rounded-lg transition-all active:scale-90"
              style={{
                backgroundColor: isQueued ? 'var(--bg-hover)' : 'rgba(255,255,255,0.12)',
                color: isQueued ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.7)',
              }}
              aria-label="Edit players"
              type="button"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </button>
          )}
          {isTappable && (
            <span className="rounded-full bg-white/15 px-[10px] py-[3px] text-[10px] font-semibold uppercase tracking-wide text-white/70">
              Tap for score
            </span>
          )}
        </div>
      </div>

      {/* Teams */}
      <div className="relative grid grid-cols-[1fr_auto_1fr] items-center gap-[4px] px-[14px] pb-[14px] pt-[4px]">
        <div className="text-center">
          {teamA.map((gp) => (
            <p key={gp.id} className="truncate text-sm font-semibold leading-[1.6]" style={{
              color: isQueued ? 'var(--text-primary)' : 'rgba(255,255,255,0.95)',
            }}>
              {shortName(gp)}
            </p>
          ))}
        </div>

        <div className="flex flex-col items-center">
          {score ? (
            <div className="flex items-center gap-[4px]">
              <span className="min-w-[24px] text-center text-lg font-bold tabular-nums leading-none" style={{
                color: score.winner === 'A'
                  ? (isQueued ? '#16a34a' : '#86efac')
                  : (isQueued ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.4)'),
              }}>{score.teamAScore}</span>
              <span className="text-xs" style={{ color: isQueued ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.3)' }}>-</span>
              <span className="min-w-[24px] text-center text-lg font-bold tabular-nums leading-none" style={{
                color: score.winner === 'B'
                  ? (isQueued ? '#16a34a' : '#86efac')
                  : (isQueued ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.4)'),
              }}>{score.teamBScore}</span>
            </div>
          ) : (
            <span className="rounded-full px-[8px] py-[2px] text-[10px] font-bold uppercase tracking-wider" style={{
              color: isQueued ? 'var(--text-tertiary)' : 'rgba(255,255,255,0.4)',
              backgroundColor: isQueued ? 'transparent' : 'rgba(255,255,255,0.08)',
            }}>vs</span>
          )}
        </div>

        <div className="text-center">
          {teamB.map((gp) => (
            <p key={gp.id} className="truncate text-sm font-semibold leading-[1.6]" style={{
              color: isQueued ? 'var(--text-primary)' : 'rgba(255,255,255,0.95)',
            }}>
              {shortName(gp)}
            </p>
          ))}
        </div>
      </div>
    </Wrapper>
  )
}

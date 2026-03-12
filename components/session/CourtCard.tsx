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
  status: 'IN_PROGRESS' | 'COMPLETED'
  gamePlayers: GamePlayer[]
  sets: GameSet[]
}

interface CourtCardProps {
  game: Game
  isAdmin: boolean
  onEnterScore: (game: Game) => void
}

function shortName(gp: GamePlayer): string {
  return gp.sessionPlayer.user?.name?.split(' ')[0] ?? gp.sessionPlayer.guestName ?? 'Guest'
}

export default function CourtCard({ game, isAdmin, onEnterScore }: CourtCardProps) {
  const teamA = game.gamePlayers.filter((gp) => gp.team === 'A')
  const teamB = game.gamePlayers.filter((gp) => gp.team === 'B')
  const score = game.sets[game.sets.length - 1]
  const isPlaying = game.status === 'IN_PROGRESS'

  const aNamesStr = teamA.map(shortName).join(' & ')
  const bNamesStr = teamB.map(shortName).join(' & ')

  return (
    <div className={`overflow-hidden rounded-xl border ${
      isPlaying
        ? 'border-primary/20 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]'
        : 'border-gray-100 bg-gray-50/80'
    }`}>
      {/* Row 1: Court label + live badge + score button */}
      <div className="flex items-center justify-between px-[12px] py-[8px]">
        <div className="flex items-center gap-[8px]">
          <span className={`text-[11px] font-bold tabular-nums ${isPlaying ? 'text-gray-500' : 'text-gray-400'}`}>
            Ct {game.courtNumber}
          </span>
          {isPlaying && (
            <span className="flex items-center gap-[4px]">
              <span className="relative flex h-[5px] w-[5px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-primary" />
              </span>
            </span>
          )}
        </div>
        {isAdmin && isPlaying && (
          <button
            onClick={() => onEnterScore(game)}
            className="flex items-center gap-[4px] rounded-lg bg-primary/[0.08] px-[10px] py-[4px] text-[11px] font-semibold text-primary transition-colors hover:bg-primary/[0.15] active:scale-95"
          >
            Score
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 2l3.5 3-3.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        )}
      </div>

      {/* Row 2: Team A  vs  Team B with scores */}
      <div className="flex items-center gap-[6px] px-[12px] pb-[10px]">
        <span className={`flex-1 truncate text-right text-[13px] leading-tight ${
          score?.winner === 'A' ? 'font-semibold text-gray-900' : isPlaying ? 'font-medium text-gray-700' : 'text-gray-500'
        }`}>
          {aNamesStr}
        </span>

        {score ? (
          <div className="flex shrink-0 items-center gap-[3px]">
            <span className={`min-w-[20px] text-center text-[15px] font-bold tabular-nums leading-none ${
              score.winner === 'A' ? 'text-primary' : 'text-gray-300'
            }`}>{score.teamAScore}</span>
            <span className="text-[10px] text-gray-300">–</span>
            <span className={`min-w-[20px] text-center text-[15px] font-bold tabular-nums leading-none ${
              score.winner === 'B' ? 'text-primary' : 'text-gray-300'
            }`}>{score.teamBScore}</span>
          </div>
        ) : (
          <span className="shrink-0 text-[11px] font-medium text-gray-300">vs</span>
        )}

        <span className={`flex-1 truncate text-[13px] leading-tight ${
          score?.winner === 'B' ? 'font-semibold text-gray-900' : isPlaying ? 'font-medium text-gray-700' : 'text-gray-500'
        }`}>
          {bNamesStr}
        </span>
      </div>
    </div>
  )
}

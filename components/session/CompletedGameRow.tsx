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

function shortName(gp: GamePlayer): string {
  return gp.sessionPlayer.user?.name?.split(' ')[0] ?? gp.sessionPlayer.guestName ?? 'Guest'
}

export default function CompletedGameRow({ game }: { game: Game }) {
  const teamA = game.gamePlayers.filter((gp) => gp.team === 'A')
  const teamB = game.gamePlayers.filter((gp) => gp.team === 'B')
  const score = game.sets[game.sets.length - 1]

  const aNames = teamA.map(shortName).join(' & ')
  const bNames = teamB.map(shortName).join(' & ')

  if (!score) {
    return (
      <div className="flex min-h-[48px] items-center gap-[8px] px-[14px] py-[10px]" style={{
        borderLeft: '3px solid var(--border-default)',
        opacity: 0.6,
      }}>
        <span className="flex-1 text-right text-sm" style={{ color: 'var(--text-tertiary)' }}>{aNames}</span>
        <span className="shrink-0 rounded-lg px-[8px] py-[2px] text-[10px] font-semibold uppercase"
          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
          No Result
        </span>
        <span className="flex-1 text-sm" style={{ color: 'var(--text-tertiary)' }}>{bNames}</span>
      </div>
    )
  }

  const aWon = score.winner === 'A'

  return (
    <div className="flex min-h-[48px] items-center gap-[8px] px-[14px] py-[10px]" style={{
      borderLeft: '3px solid #16a34a',
    }}>
      <div className="flex w-[18px] shrink-0 justify-center">
        {aWon ? <span className="text-[12px]">🏆</span> : <span className="w-[12px]" />}
      </div>

      <span className={`flex-1 text-right text-sm leading-tight ${aWon ? 'font-bold' : 'font-normal'}`}
        style={{ color: aWon ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
        {aNames}
      </span>

      <div className="flex shrink-0 items-center gap-[4px] rounded-lg px-[6px] py-[2px]"
        style={{ backgroundColor: 'var(--bg-hover)' }}>
        <span className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${aWon ? 'text-primary' : ''}`}
          style={{ color: aWon ? undefined : 'var(--text-tertiary)' }}>
          {score.teamAScore}
        </span>
        <span className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>–</span>
        <span className={`min-w-[20px] text-center text-sm font-bold tabular-nums ${!aWon ? 'text-primary' : ''}`}
          style={{ color: !aWon ? undefined : 'var(--text-tertiary)' }}>
          {score.teamBScore}
        </span>
      </div>

      <span className={`flex-1 text-sm leading-tight ${!aWon ? 'font-bold' : 'font-normal'}`}
        style={{ color: !aWon ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
        {bNames}
      </span>

      <div className="flex w-[18px] shrink-0 justify-center">
        {!aWon ? <span className="text-[12px]">🏆</span> : <span className="w-[12px]" />}
      </div>
    </div>
  )
}

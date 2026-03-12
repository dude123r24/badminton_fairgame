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

function shortName(gp: GamePlayer): string {
  return gp.sessionPlayer.user?.name?.split(' ')[0] ?? gp.sessionPlayer.guestName ?? 'Guest'
}

export default function CompletedGameRow({ game }: { game: Game }) {
  const teamA = game.gamePlayers.filter((gp) => gp.team === 'A')
  const teamB = game.gamePlayers.filter((gp) => gp.team === 'B')
  const score = game.sets[game.sets.length - 1]
  if (!score) return null

  const aWon = score.winner === 'A'
  const aNames = teamA.map(shortName).join(' & ')
  const bNames = teamB.map(shortName).join(' & ')

  return (
    <div className="flex items-center gap-[8px] px-[14px] py-[10px]">
      <span className={`flex-1 text-right text-[13px] leading-tight ${aWon ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
        {aNames}
      </span>
      <div className="flex shrink-0 items-center gap-[4px]">
        <span className={`min-w-[24px] text-center text-[15px] font-bold tabular-nums ${aWon ? 'text-primary' : 'text-gray-300'}`}>
          {score.teamAScore}
        </span>
        <span className="text-[11px] text-gray-300">–</span>
        <span className={`min-w-[24px] text-center text-[15px] font-bold tabular-nums ${!aWon ? 'text-primary' : 'text-gray-300'}`}>
          {score.teamBScore}
        </span>
      </div>
      <span className={`flex-1 text-[13px] leading-tight ${!aWon ? 'font-semibold text-gray-900' : 'text-gray-400'}`}>
        {bNames}
      </span>
    </div>
  )
}

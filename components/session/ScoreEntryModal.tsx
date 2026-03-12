'use client'

import { useState } from 'react'

interface GamePlayer {
  id: string
  team: 'A' | 'B'
  sessionPlayer: {
    id: string
    user: { id: string; name: string } | null
    guestName?: string | null
  }
}

interface Game {
  id: string
  courtNumber: number
  gamePlayers: GamePlayer[]
}

interface ScoreEntryModalProps {
  game: Game
  sessionId: string
  scoringSystem: string
  onClose: () => void
  onScoreEntered: () => void
}

function playerName(gp: GamePlayer): string {
  return gp.sessionPlayer.user?.name?.split(' ')[0] ?? gp.sessionPlayer.guestName ?? 'Guest'
}

function scoreHint(system: string): string {
  switch (system) {
    case 'RALLY_21': return 'First to 21, win by 2'
    case 'RALLY_21_SETTING': return 'First to 21, setting at 29'
    case 'RALLY_21_NO_SETTING': return 'Exactly 21'
    case 'SHORT_15': return 'First to 15'
    case 'SHORT_7': return 'First to 7'
    default: return ''
  }
}

export default function ScoreEntryModal({ game, sessionId, scoringSystem, onClose, onScoreEntered }: ScoreEntryModalProps) {
  const [aScore, setAScore] = useState('')
  const [bScore, setBScore] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const teamA = game.gamePlayers.filter((gp) => gp.team === 'A')
  const teamB = game.gamePlayers.filter((gp) => gp.team === 'B')
  const hint = scoreHint(scoringSystem)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const a = parseInt(aScore, 10), b = parseInt(bScore, 10)
    if (isNaN(a) || isNaN(b) || a < 0 || b < 0) { setError('Enter valid scores'); return }
    if (a === b) { setError('Scores cannot be tied'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/sessions/${sessionId}/games/${game.id}/scores`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamAScore: a, teamBScore: b }),
      })
      if (!res.ok) { setError((await res.json()).error ?? 'Failed'); setLoading(false); return }
      onScoreEntered()
    } catch { setError('Something went wrong'); setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="safe-bottom w-full max-w-[380px] rounded-t-3xl bg-white p-[24px] sm:rounded-2xl">
        <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full bg-gray-200 sm:hidden" />

        <div className="mb-[20px] flex items-center justify-between">
          <div>
            <p className="text-[16px] font-bold text-gray-900">Court {game.courtNumber}</p>
            {hint && <p className="mt-[2px] text-[12px] text-gray-400">{hint}</p>}
          </div>
          <button onClick={onClose} className="flex h-[28px] w-[28px] items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10.5 3.5L3.5 10.5M3.5 3.5l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-[16px]">
          <div className="grid grid-cols-2 gap-[16px]">
            <div className="text-center">
              <div className="mb-[8px] rounded-lg bg-primary/[0.06] px-[8px] py-[6px]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary">Team A</p>
                {teamA.map((gp) => (
                  <p key={gp.id} className="text-[12px] font-medium leading-[1.4] text-gray-700">{playerName(gp)}</p>
                ))}
              </div>
              <input
                type="number" inputMode="numeric" min={0} placeholder="0"
                value={aScore} onChange={(e) => setAScore(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-[16px] text-center text-[44px] font-bold text-gray-900 transition-colors focus:border-primary focus:bg-white focus:outline-none"
                autoFocus required
              />
            </div>
            <div className="text-center">
              <div className="mb-[8px] rounded-lg bg-gray-50 px-[8px] py-[6px]">
                <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Team B</p>
                {teamB.map((gp) => (
                  <p key={gp.id} className="text-[12px] font-medium leading-[1.4] text-gray-700">{playerName(gp)}</p>
                ))}
              </div>
              <input
                type="number" inputMode="numeric" min={0} placeholder="0"
                value={bScore} onChange={(e) => setBScore(e.target.value)}
                className="w-full rounded-2xl border-2 border-gray-200 bg-gray-50 py-[16px] text-center text-[44px] font-bold text-gray-900 transition-colors focus:border-primary focus:bg-white focus:outline-none"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-center text-[13px] text-red-500">{error}</p>
          )}

          <button type="submit" disabled={loading || !aScore || !bScore}
            className="w-full rounded-2xl bg-primary py-[16px] text-[15px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-40 disabled:shadow-none active:scale-[0.98] active:bg-primary-dark">
            {loading ? 'Saving…' : 'Confirm Score'}
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2 } from 'lucide-react'

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
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        onClick={(e) => e.target === e.currentTarget && onClose()}
        style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
      >
        <motion.div
          className="safe-bottom w-full max-w-[400px] rounded-t-3xl p-[24px] sm:rounded-2xl"
          style={{ backgroundColor: 'var(--bg-card)' }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        >
          <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full sm:hidden" style={{ backgroundColor: 'var(--border-default)' }} />

          <div className="mb-[20px] flex items-center justify-between">
            <div>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Court {game.courtNumber}</p>
              {hint && <p className="mt-[2px] text-xs" style={{ color: 'var(--text-tertiary)' }}>{hint}</p>}
            </div>
            <button onClick={onClose} className="icon-btn h-[44px] w-[44px]" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-[16px]">
            <div className="grid grid-cols-2 gap-[16px]">
              <div className="text-center">
                <div className="mb-[8px] rounded-xl bg-primary/[0.06] px-[10px] py-[8px]">
                  <p className="text-xs font-bold uppercase tracking-wide text-primary">Team A</p>
                  {teamA.map((gp) => (
                    <p key={gp.id} className="text-sm font-medium leading-[1.4]" style={{ color: 'var(--text-primary)' }}>{playerName(gp)}</p>
                  ))}
                </div>
                <input
                  type="number" inputMode="numeric" min={0} placeholder="0"
                  value={aScore} onChange={(e) => setAScore(e.target.value)}
                  className="w-full rounded-2xl border-2 py-[16px] text-center text-[44px] font-bold transition-colors focus:border-primary focus:outline-none"
                  style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                  autoFocus required
                />
              </div>
              <div className="text-center">
                <div className="mb-[8px] rounded-xl px-[10px] py-[8px]" style={{ backgroundColor: 'var(--bg-hover)' }}>
                  <p className="text-xs font-bold uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>Team B</p>
                  {teamB.map((gp) => (
                    <p key={gp.id} className="text-sm font-medium leading-[1.4]" style={{ color: 'var(--text-primary)' }}>{playerName(gp)}</p>
                  ))}
                </div>
                <input
                  type="number" inputMode="numeric" min={0} placeholder="0"
                  value={bScore} onChange={(e) => setBScore(e.target.value)}
                  className="w-full rounded-2xl border-2 py-[16px] text-center text-[44px] font-bold transition-colors focus:border-primary focus:outline-none"
                  style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                  required
                />
              </div>
            </div>

            {error && (
              <p className="text-center text-sm text-red-500">{error}</p>
            )}

            <button type="submit" disabled={loading || !aScore || !bScore}
              className="w-full rounded-2xl bg-primary py-[16px] text-base font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-40 disabled:shadow-none active:scale-[0.98] active:bg-primary-dark">
              {loading ? 'Saving...' : 'Confirm Score'}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

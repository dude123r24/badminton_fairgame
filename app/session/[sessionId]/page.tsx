'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import CourtCard from '@/components/session/CourtCard'
import CompletedGameRow from '@/components/session/CompletedGameRow'
import ScoreEntryModal from '@/components/session/ScoreEntryModal'

interface SessionPlayer {
  id: string
  userId: string | null
  guestName: string | null
  status: 'AVAILABLE' | 'SITTING_OUT' | 'ABSENT'
  user: { id: string; name: string; email: string } | null
}

interface GamePlayer {
  id: string
  team: 'A' | 'B'
  sessionPlayer: { id: string; user: { id: string; name: string } | null; guestName?: string | null }
}

interface GameSet { id: string; teamAScore: number; teamBScore: number; winner: 'A' | 'B' }

interface Game {
  id: string; courtNumber: number; status: 'IN_PROGRESS' | 'COMPLETED'
  gamePlayers: GamePlayer[]; sets: GameSet[]
  endedAt?: string | null; startedAt?: string
}

interface Session {
  id: string; name: string | null; date: string
  status: 'UPCOMING' | 'ACTIVE' | 'ENDED'
  courts: number; scoringSystem: string
  club: { id: string; name: string }
  sessionPlayers: SessionPlayer[]
  games: Game[]
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER'
}

function SectionHeader({ title, count, action }: { title: string; count: number; action?: React.ReactNode }) {
  return (
    <div className="mb-[8px] flex items-center gap-[8px]">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">{title}</h2>
      <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gray-100 px-[5px] text-[10px] font-bold text-gray-500">
        {count}
      </span>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

export default function LiveSessionPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [error, setError] = useState('')
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [showAllCompleted, setShowAllCompleted] = useState(false)

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${params.sessionId}`)
    if (!res.ok) { router.push('/dashboard'); return }
    setSession(await res.json())
    setLoading(false)
  }, [params.sessionId, router])

  useEffect(() => { load() }, [load])

  async function generateGames() {
    setBusy(true); setError('')
    const res = await fetch(`/api/sessions/${params.sessionId}/games`, { method: 'POST' })
    if (!res.ok) setError((await res.json()).error ?? 'Could not generate games')
    await load(); setBusy(false)
  }

  async function endSession() {
    setBusy(true)
    await fetch(`/api/sessions/${params.sessionId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ENDED' }),
    })
    setShowEndConfirm(false)
    await load(); setBusy(false)
  }

  if (loading || !session) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-neutral">Loading…</p></main>
  }

  const isAdmin = session.userRole === 'OWNER' || session.userRole === 'ADMIN'
  const active = session.games.filter((g) => g.status === 'IN_PROGRESS')
  const done = session.games.filter((g) => g.status === 'COMPLETED')
  const busyIds = new Set(active.flatMap((g) => g.gamePlayers.map((gp) => gp.sessionPlayer.id)))
  const waiting = session.sessionPlayers.filter((p) => p.status === 'AVAILABLE' && !busyIds.has(p.id))
  const sittingOut = session.sessionPlayers.filter((p) => p.status !== 'AVAILABLE')

  const title = session.name ?? new Date(session.date).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
  const gamesPlayed = done.length
  const dateStr = new Date(session.date).toLocaleDateString('en-AU', {
    weekday: 'long', day: 'numeric', month: 'short',
  })

  // Per-player stats
  const playerStats = new Map<string, { gamesPlayed: number; lastGameEndedAt: Date | null }>()
  for (const g of session.games) {
    if (g.status !== 'COMPLETED') continue
    const endedAt = g.endedAt ? new Date(g.endedAt) : null
    for (const gp of g.gamePlayers) {
      const id = gp.sessionPlayer.id
      const prev = playerStats.get(id) ?? { gamesPlayed: 0, lastGameEndedAt: null }
      prev.gamesPlayed++
      if (endedAt && (!prev.lastGameEndedAt || endedAt > prev.lastGameEndedAt)) {
        prev.lastGameEndedAt = endedAt
      }
      playerStats.set(id, prev)
    }
  }

  function formatWait(lastEnded: Date | null): string {
    if (!lastEnded) return 'new'
    const mins = Math.floor((Date.now() - lastEnded.getTime()) / 60000)
    if (mins < 1) return 'just now'
    return `${mins}m`
  }

  // Sort waiting by longest wait first (no games yet → top, then oldest lastGameEndedAt)
  const waitingSorted = [...waiting].sort((a, b) => {
    const sa = playerStats.get(a.id)
    const sb = playerStats.get(b.id)
    const ta = sa?.lastGameEndedAt?.getTime() ?? 0
    const tb = sb?.lastGameEndedAt?.getTime() ?? 0
    return ta - tb
  })

  const occupiedCourts = new Set(active.map((g) => g.courtNumber))
  const allCourts = Array.from({ length: session.courts }, (_, i) => i + 1)
  const freeCourts = allCourts.filter((c) => !occupiedCourts.has(c))

  const onCourt = session.sessionPlayers.filter((p) => p.status === 'AVAILABLE' && busyIds.has(p.id))

  // Completed: show last 3 unless expanded
  const completedVisible = showAllCompleted ? done : done.slice(0, 3)
  const completedHidden = done.length - completedVisible.length

  // --- Sidebar content (waiting + sitting out) ---
  const sidebarContent = (
    <>
      {/* Waiting queue */}
      {waitingSorted.length > 0 && (
        <section className="mb-[20px]">
          <SectionHeader title="Waiting" count={waitingSorted.length} />
          <div className="space-y-[4px]">
            {waitingSorted.map((p, i) => {
              const stats = playerStats.get(p.id)
              const gp = stats?.gamesPlayed ?? 0
              const wait = formatWait(stats?.lastGameEndedAt ?? null)
              const isLongWait = !stats?.lastGameEndedAt || (stats.lastGameEndedAt && Date.now() - stats.lastGameEndedAt.getTime() > 600000)
              return (
                <div
                  key={p.id}
                  className={`flex items-center gap-[8px] rounded-lg px-[10px] py-[6px] ${
                    i === 0 ? 'bg-amber-50/80' : 'bg-white'
                  }`}
                >
                  <span className={`flex h-[6px] w-[6px] shrink-0 rounded-full ${
                    isLongWait ? 'bg-amber-400' : 'bg-primary/50'
                  }`} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-gray-700">
                    {p.user?.name?.split(' ')[0] ?? p.guestName ?? 'Guest'}
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                    {gp}g
                  </span>
                  <span className={`shrink-0 text-[11px] tabular-nums ${isLongWait ? 'font-medium text-amber-600' : 'text-gray-400'}`}>
                    {wait}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Sitting out */}
      {sittingOut.length > 0 && (
        <section className="mb-[20px]">
          <SectionHeader title="Sitting Out" count={sittingOut.length} />
          <div className="flex flex-wrap gap-[4px]">
            {sittingOut.map((p) => (
              <span
                key={p.id}
                className="rounded-md bg-gray-100 px-[8px] py-[3px] text-[11px] text-gray-400"
              >
                {p.user?.name?.split(' ')[0] ?? p.guestName ?? 'Guest'}
              </span>
            ))}
          </div>
        </section>
      )}
    </>
  )

  return (
    <main className="mx-auto max-w-[960px] px-[16px] pb-[120px] pt-[16px]">
      {/* Back link */}
      <Link
        href={`/club/${session.club.id}`}
        className="mb-[12px] inline-flex items-center gap-[4px] text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        {session.club.name}
      </Link>

      {/* Header — compact inline bar */}
      <div className="mb-[16px] flex flex-wrap items-center gap-x-[16px] gap-y-[8px] rounded-xl bg-white px-[16px] py-[12px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          <h1 className="truncate text-[18px] font-bold tracking-tight text-gray-900">{title}</h1>
          {session.status === 'ACTIVE' && (
            <span className="flex shrink-0 items-center gap-[4px] rounded-full bg-primary/10 px-[8px] py-[2px] text-[10px] font-bold uppercase tracking-wide text-primary">
              <span className="relative flex h-[5px] w-[5px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-[5px] w-[5px] rounded-full bg-primary" />
              </span>
              Live
            </span>
          )}
          {session.status === 'ENDED' && (
            <span className="shrink-0 rounded-full bg-gray-100 px-[8px] py-[2px] text-[10px] font-semibold text-gray-500">Ended</span>
          )}
        </div>

        {/* Stats pills */}
        <div className="flex items-center gap-[12px] text-[12px]">
          <span className="flex items-center gap-[4px] text-gray-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.2"/><path d="M2.5 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span className="font-semibold text-gray-600">{onCourt.length + waiting.length}</span>
          </span>
          <span className="flex items-center gap-[4px] text-gray-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2"/><path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
            <span className="font-semibold text-gray-600">{gamesPlayed}</span>
          </span>
          <span className="flex items-center gap-[4px] text-gray-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/><path d="M7 3v8" stroke="currentColor" strokeWidth="1.2"/></svg>
            <span className="font-semibold text-gray-600">{session.courts}</span>
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex shrink-0 gap-[6px]">
          {isAdmin && (
            <Link href={`/session/${params.sessionId}/settings`}
              className="flex h-[32px] w-[32px] items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-gray-300 hover:text-gray-600 active:scale-95"
              aria-label="Session settings"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5.86 1.57l.53-1a.7.7 0 011.22 0l.53 1 1.1.08a.7.7 0 01.56.98l-.48.96.48.96a.7.7 0 01-.56.98l-1.1.08-.53 1a.7.7 0 01-1.22 0l-.53-1-1.1-.08a.7.7 0 01-.56-.98l.48-.96-.48-.96a.7.7 0 01.56-.98l1.1-.08z" stroke="currentColor" strokeWidth="1.1"/><circle cx="7" cy="4.2" r="1" stroke="currentColor" strokeWidth="0.9"/></svg>
            </Link>
          )}
          <button
            onClick={load}
            className="flex h-[32px] w-[32px] items-center justify-center rounded-lg border border-gray-200 text-gray-400 transition-all hover:border-gray-300 hover:text-gray-600 active:scale-95"
            aria-label="Refresh"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M11.9 2.1V4.9H9.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.1 7A4.9 4.9 0 0111 3.9L11.9 4.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2.1 11.9V9.1H4.9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M11.9 7A4.9 4.9 0 013 10.1L2.1 9.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-[12px] flex items-center gap-[8px] rounded-xl bg-red-50 px-[14px] py-[10px] text-[13px] text-red-600">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v2.5M7 8.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      {/* === Two-column layout on md+ === */}
      <div className="md:grid md:grid-cols-[1fr_260px] md:gap-[20px]">
        {/* Left: Courts */}
        <div>
          {active.length > 0 && (
            <section className="mb-[20px]">
              <SectionHeader title="On Court" count={active.length} />
              <div className="grid grid-cols-1 gap-[8px] sm:grid-cols-2">
                {active.map((g) => (
                  <CourtCard key={g.id} game={g} isAdmin={isAdmin} onEnterScore={setSelectedGame} />
                ))}
              </div>
            </section>
          )}

          {/* On mobile: show sidebar content inline after courts */}
          <div className="md:hidden">
            {sidebarContent}
          </div>

          {/* Completed games — collapsed by default */}
          {done.length > 0 && (
            <section className="mb-[20px]">
              <SectionHeader
                title="Completed"
                count={done.length}
                action={
                  done.length > 3 && (
                    <button
                      onClick={() => setShowAllCompleted(!showAllCompleted)}
                      className="text-[11px] font-medium text-primary hover:text-primary-dark"
                    >
                      {showAllCompleted ? 'Show less' : `Show all ${done.length}`}
                    </button>
                  )
                }
              />
              <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white">
                {completedVisible.map((g) => (
                  <CompletedGameRow key={g.id} game={g} />
                ))}
              </div>
              {completedHidden > 0 && !showAllCompleted && (
                <button
                  onClick={() => setShowAllCompleted(true)}
                  className="mt-[6px] w-full rounded-lg py-[6px] text-center text-[11px] font-medium text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600"
                >
                  +{completedHidden} more
                </button>
              )}
            </section>
          )}

          {active.length === 0 && done.length === 0 && (
            <div className="rounded-xl border-2 border-dashed border-gray-200 py-[40px] text-center">
              <div className="mb-[6px] text-[28px]">🏸</div>
              <p className="text-[13px] font-medium text-gray-500">
                {session.status === 'ACTIVE' ? 'Tap "Generate Round" to start' : 'No games played'}
              </p>
            </div>
          )}
        </div>

        {/* Right sidebar: Waiting + Sitting out (tablet+) */}
        <aside className="hidden md:block">
          <div className="sticky top-[80px]">
            {sidebarContent}
          </div>
        </aside>
      </div>

      {/* Sticky bottom bar */}
      {isAdmin && session.status === 'ACTIVE' && (
        <div className="safe-bottom-bar fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/90 px-[16px] py-[10px] backdrop-blur-md">
          <div className="mx-auto flex max-w-[960px] gap-[8px]">
            <button
              onClick={generateGames}
              disabled={busy || waiting.length < 4}
              title={waiting.length < 4 ? 'Need 4+ waiting players' : ''}
              className="flex-1 rounded-xl bg-primary py-[12px] text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-40 disabled:shadow-none active:scale-[0.98] active:bg-primary-dark"
            >
              {busy ? (
                <span className="inline-flex items-center gap-[6px]">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                  Generating…
                </span>
              ) : (
                `Generate Round${waiting.length >= 4 ? ` · ${waiting.length} waiting${freeCourts.length > 0 && freeCourts.length < session.courts ? ` · ${freeCourts.length}ct free` : ''}` : ''}`
              )}
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="rounded-xl border border-gray-200 bg-white px-[14px] py-[12px] text-[13px] font-semibold text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              End
            </button>
          </div>
        </div>
      )}

      {/* Score modal */}
      {selectedGame && (
        <ScoreEntryModal
          game={selectedGame}
          sessionId={params.sessionId}
          scoringSystem={session.scoringSystem}
          onClose={() => setSelectedGame(null)}
          onScoreEntered={async () => { setSelectedGame(null); await load() }}
        />
      )}

      {/* End session confirm */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setShowEndConfirm(false)}>
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-[24px] pb-[32px] sm:rounded-2xl sm:pb-[24px]">
            <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full bg-gray-200 sm:hidden" />
            <h2 className="mb-[8px] text-[18px] font-bold text-gray-900">End Session?</h2>
            <p className="mb-[20px] text-[14px] leading-relaxed text-gray-500">This will close the session. You can still view results afterwards.</p>
            <div className="flex gap-[10px]">
              <button onClick={endSession} disabled={busy}
                className="flex-1 rounded-xl bg-red-500 py-[12px] text-[14px] font-semibold text-white transition-colors disabled:opacity-50 hover:bg-red-600">
                {busy ? 'Ending…' : 'End Session'}
              </button>
              <button onClick={() => setShowEndConfirm(false)}
                className="flex-1 rounded-xl border border-gray-200 py-[12px] text-[14px] font-semibold text-gray-700 transition-colors hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

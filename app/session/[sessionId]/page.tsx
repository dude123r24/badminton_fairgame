'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Settings, RefreshCw, Users, Hash, LayoutGrid,
  AlertCircle, Moon, Sun, UserPlus, X, Loader2, Search,
  MoreHorizontal, Pencil, Trash2,
} from 'lucide-react'
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
  id: string; courtNumber: number; status: 'IN_PROGRESS' | 'COMPLETED' | 'QUEUED'
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
      <h2 className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-tertiary)' }}>{title}</h2>
      <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-[6px] text-xs font-bold" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
        {count}
      </span>
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

interface ClubMember {
  id: string
  userId: string
  user: { id: string; name: string; email: string; image: string | null }
}

interface PastGuest {
  guestName: string
  guestEmail: string | null
  sessionCount: number
}

function AddPlayerSearch({
  searchQuery, setSearchQuery, showDropdown, setShowDropdown,
  addPlayerRef, dropdownRef, clubMembers, pastGuests, sessionPlayers,
  addingPlayer, onAddMember, onAddGuest, onClose,
}: {
  searchQuery: string
  setSearchQuery: (v: string) => void
  showDropdown: boolean
  setShowDropdown: (v: boolean) => void
  addPlayerRef: React.RefObject<HTMLInputElement>
  dropdownRef: React.RefObject<HTMLDivElement>
  clubMembers: ClubMember[]
  pastGuests: PastGuest[]
  sessionPlayers: SessionPlayer[]
  addingPlayer: boolean
  onAddMember: (userId: string) => void
  onAddGuest: (name: string, email?: string) => void
  onClose: () => void
}) {
  const addedUserIds = new Set(sessionPlayers.filter(p => p.userId).map(p => p.userId!))
  const addedGuestNames = new Set(sessionPlayers.filter(p => p.guestName).map(p => p.guestName!.toLowerCase()))
  const query = searchQuery.toLowerCase().trim()

  const filteredMembers = clubMembers.filter(m =>
    !addedUserIds.has(m.userId) &&
    (query === '' || m.user.name?.toLowerCase().includes(query) || m.user.email.toLowerCase().includes(query))
  )

  const filteredGuests = pastGuests.filter(g =>
    !addedGuestNames.has(g.guestName.toLowerCase()) &&
    (query === '' || g.guestName.toLowerCase().includes(query))
  )

  const exactMemberMatch = clubMembers.some(m => m.user.name?.toLowerCase() === query)
  const exactGuestMatch = pastGuests.some(g => g.guestName.toLowerCase() === query)
  const canAddNew = query.length > 0 && !exactMemberMatch && !exactGuestMatch && !addedGuestNames.has(query)

  const hasResults = filteredMembers.length > 0 || filteredGuests.length > 0 || canAddNew

  return (
    <div ref={dropdownRef} className="relative mb-[8px]">
      <div className="flex items-center gap-[8px] rounded-xl px-[12px] py-[8px] transition-colors focus-within:ring-2 focus-within:ring-primary/30"
        style={{ backgroundColor: 'var(--bg-hover)' }}>
        <Search size={14} style={{ color: 'var(--text-tertiary)' }} className="shrink-0" />
        <input
          ref={addPlayerRef}
          type="text"
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setShowDropdown(true) }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && canAddNew) onAddGuest(searchQuery)
            if (e.key === 'Escape') onClose()
          }}
          placeholder="Search members or add guest..."
          className="min-w-0 flex-1 bg-transparent text-sm focus:outline-none"
          style={{ color: 'var(--text-primary)' }}
        />
        {addingPlayer && <Loader2 size={14} className="shrink-0 animate-spin text-primary" />}
        <button onClick={onClose}
          className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-active)]"
          style={{ color: 'var(--text-tertiary)' }}>
          <X size={14} />
        </button>
      </div>

      {showDropdown && hasResults && (
        <div className="absolute left-0 right-0 z-20 mt-[4px] max-h-[240px] overflow-y-auto rounded-2xl border shadow-[var(--shadow-elevated)]"
          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}>

          {filteredMembers.map(m => (
            <button key={m.userId}
              onClick={() => onAddMember(m.userId)}
              disabled={addingPlayer}
              className="flex w-full items-center gap-[10px] px-[12px] py-[10px] text-left transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              {m.user.image ? (
                <img src={m.user.image} alt="" className="h-[28px] w-[28px] shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                  {(m.user.name ?? m.user.email)[0].toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{m.user.name}</p>
                <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.user.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 px-[8px] py-[2px] text-[10px] font-semibold text-primary">
                Member
              </span>
            </button>
          ))}

          {filteredMembers.length > 0 && filteredGuests.length > 0 && (
            <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />
          )}

          {filteredGuests.map(g => (
            <button key={g.guestName}
              onClick={() => onAddGuest(g.guestName, g.guestEmail ?? undefined)}
              disabled={addingPlayer}
              className="flex w-full items-center gap-[10px] px-[12px] py-[10px] text-left transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-50"
            >
              <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                {g.guestName[0].toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{g.guestName}</p>
                <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {g.sessionCount} past session{g.sessionCount !== 1 ? 's' : ''}
                </p>
              </div>
              <span className="shrink-0 rounded-full px-[8px] py-[2px] text-[10px] font-semibold"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                Guest
              </span>
            </button>
          ))}

          {canAddNew && (
            <>
              {(filteredMembers.length > 0 || filteredGuests.length > 0) && (
                <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />
              )}
              <button
                onClick={() => onAddGuest(searchQuery)}
                disabled={addingPlayer}
                className="flex w-full items-center gap-[10px] px-[12px] py-[10px] text-left transition-colors hover:bg-[var(--bg-hover)]"
              >
                <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <UserPlus size={14} className="text-primary" />
                </span>
                <p className="text-sm font-medium text-primary">
                  Add &ldquo;{searchQuery.trim()}&rdquo; as guest
                </p>
              </button>
            </>
          )}
        </div>
      )}
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
  const [togglingPlayer, setTogglingPlayer] = useState<string | null>(null)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [addingPlayer, setAddingPlayer] = useState(false)
  const [clubMembers, setClubMembers] = useState<ClubMember[]>([])
  const [pastGuests, setPastGuests] = useState<PastGuest[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<SessionPlayer | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingPlayer, setDeletingPlayer] = useState<SessionPlayer | null>(null)
  const [playerMenuId, setPlayerMenuId] = useState<string | null>(null)
  const [swapGame, setSwapGame] = useState<Game | null>(null)
  const [swapOutPlayerId, setSwapOutPlayerId] = useState<string | null>(null)
  const addPlayerRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${params.sessionId}`)
    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`[Session Load] API returned ${res.status}: ${errText}`)
      router.push('/dashboard'); return
    }
    const data = await res.json()
    setSession(data)
    setLoading(false)
    return data as Session
  }, [params.sessionId, router])

  useEffect(() => { load() }, [load])

  // Fetch club members & past guests when add-player opens
  useEffect(() => {
    if (!showAddPlayer || !session) return
    const clubId = session.club.id
    Promise.all([
      fetch(`/api/clubs/${clubId}/members`).then(r => r.ok ? r.json() : []),
      fetch(`/api/clubs/${clubId}/past-guests`).then(r => r.ok ? r.json() : []),
    ]).then(([m, g]) => {
      setClubMembers(m)
      setPastGuests(g)
    })
  }, [showAddPlayer, session])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setPlayerMenuId(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  async function generateGames() {
    setBusy(true); setError('')
    const res = await fetch(`/api/sessions/${params.sessionId}/games`, { method: 'POST' })
    if (!res.ok) setError((await res.json()).error ?? 'Could not generate games')
    await load(); setBusy(false)
  }

  async function togglePlayerSleep(playerId: string, currentStatus: string) {
    setTogglingPlayer(playerId)
    const newStatus = currentStatus === 'AVAILABLE' ? 'SITTING_OUT' : 'AVAILABLE'
    await fetch(`/api/sessions/${params.sessionId}/players/${playerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    await load()
    setTogglingPlayer(null)
  }

  async function addPlayerByUserId(userId: string) {
    setAddingPlayer(true)
    const res = await fetch(`/api/sessions/${params.sessionId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
    if (res.ok) { setSearchQuery(''); setShowDropdown(false) }
    await load()
    setAddingPlayer(false)
  }

  async function addPlayerAsGuest(name: string, email?: string) {
    if (!name.trim()) return
    setAddingPlayer(true)
    const payload: { guestName: string; guestEmail?: string } = { guestName: name.trim() }
    if (email?.trim()) payload.guestEmail = email.trim()
    const res = await fetch(`/api/sessions/${params.sessionId}/players`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) { setSearchQuery(''); setShowDropdown(false) }
    await load()
    setAddingPlayer(false)
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

  async function renamePlayer() {
    if (!editingPlayer || !editName.trim()) return
    setBusy(true)
    await fetch(`/api/sessions/${params.sessionId}/players/${editingPlayer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestName: editName.trim() }),
    })
    setEditingPlayer(null)
    setEditName('')
    await load(); setBusy(false)
  }

  async function removePlayer() {
    if (!deletingPlayer) return
    setBusy(true); setError('')
    const res = await fetch(`/api/sessions/${params.sessionId}/players/${deletingPlayer.id}`, {
      method: 'DELETE',
    })
    if (!res.ok && res.status !== 204) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Could not remove player')
    }
    setDeletingPlayer(null)
    await load(); setBusy(false)
  }

  async function swapPlayer(newSessionPlayerId: string) {
    if (!swapGame || !swapOutPlayerId) return
    setBusy(true); setError('')
    const res = await fetch(`/api/sessions/${params.sessionId}/games/${swapGame.id}/players`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldSessionPlayerId: swapOutPlayerId, newSessionPlayerId }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Could not swap player')
    }
    setSwapGame(null); setSwapOutPlayerId(null)
    await load(); setBusy(false)
  }

  if (loading || !session) {
    return <main className="flex min-h-screen items-center justify-center"><p style={{ color: 'var(--text-secondary)' }}>Loading...</p></main>
  }

  const isAdmin = session.userRole === 'OWNER' || session.userRole === 'ADMIN'
  const active = session.games.filter((g) => g.status === 'IN_PROGRESS')
  const queued = session.games.filter((g) => g.status === 'QUEUED')
  const done = session.games.filter((g) => g.status === 'COMPLETED')

  const committedIds = new Set(
    [...active, ...queued].flatMap((g) => g.gamePlayers.map((gp) => gp.sessionPlayer.id))
  )
  const waiting = session.sessionPlayers.filter((p) => p.status === 'AVAILABLE' && !committedIds.has(p.id))
  const sleeping = session.sessionPlayers.filter((p) => p.status === 'SITTING_OUT')
  const absent = session.sessionPlayers.filter((p) => p.status === 'ABSENT')

  const title = session.name ?? new Date(session.date).toLocaleDateString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
  const gamesPlayed = done.length

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

  const waitingSorted = [...waiting].sort((a, b) => {
    const sa = playerStats.get(a.id)
    const sb = playerStats.get(b.id)
    const ta = sa?.lastGameEndedAt?.getTime() ?? 0
    const tb = sb?.lastGameEndedAt?.getTime() ?? 0
    return ta - tb
  })

  const occupiedCourts = new Map(active.map((g) => [g.courtNumber, g]))
  const allCourts = Array.from({ length: session.courts }, (_, i) => i + 1)
  const freeCourts = allCourts.filter((c) => !occupiedCourts.has(c))
  const onCourtPlayers = session.sessionPlayers.filter((p) => p.status === 'AVAILABLE' && committedIds.has(p.id))
  const totalActivePlayers = onCourtPlayers.length + waiting.length

  const completedVisible = showAllCompleted ? done : done.slice(0, 3)
  const completedHidden = done.length - completedVisible.length

  const sidebarContent = (
    <>
      {/* Waiting Players */}
      <section className="mb-[20px]">
        <SectionHeader
          title="Waiting"
          count={waitingSorted.length}
          action={isAdmin && session.status === 'ACTIVE' && (
            <button
              onClick={() => { setShowAddPlayer(true); setTimeout(() => addPlayerRef.current?.focus(), 100) }}
              className="flex min-h-[32px] items-center gap-[4px] rounded-lg px-[8px] text-xs font-medium text-primary transition-colors hover:bg-primary/10"
            >
              <UserPlus size={14} />
              Add
            </button>
          )}
        />

        {/* Searchable add player */}
        <AnimatePresence>
          {showAddPlayer && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <AddPlayerSearch
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                showDropdown={showDropdown}
                setShowDropdown={setShowDropdown}
                addPlayerRef={addPlayerRef}
                dropdownRef={dropdownRef}
                clubMembers={clubMembers}
                pastGuests={pastGuests}
                sessionPlayers={session.sessionPlayers}
                addingPlayer={addingPlayer}
                onAddMember={addPlayerByUserId}
                onAddGuest={addPlayerAsGuest}
                onClose={() => { setShowAddPlayer(false); setSearchQuery(''); setShowDropdown(false) }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {waitingSorted.length > 0 ? (
          <div className="space-y-[4px]">
            {waitingSorted.map((p, i) => {
              const stats = playerStats.get(p.id)
              const gp = stats?.gamesPlayed ?? 0
              const wait = formatWait(stats?.lastGameEndedAt ?? null)
              const isLongWait = !stats?.lastGameEndedAt || (stats.lastGameEndedAt && Date.now() - stats.lastGameEndedAt.getTime() > 600000)
              const isToggling = togglingPlayer === p.id
              const isMenuOpen = playerMenuId === p.id
              const displayName = p.user?.name?.split(' ')[0] ?? p.guestName ?? 'Guest'
              return (
                <div
                  key={p.id}
                  className="relative flex min-h-[44px] items-center gap-[10px] rounded-xl px-[12px] py-[8px]"
                  style={{ backgroundColor: i === 0 ? 'rgba(251, 191, 36, 0.1)' : 'var(--bg-card)' }}
                >
                  <span className={`flex h-[7px] w-[7px] shrink-0 rounded-full ${
                    isLongWait ? 'bg-amber-400' : 'bg-primary/50'
                  }`} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {displayName}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--text-tertiary)' }}>
                    {gp}g
                  </span>
                  <span className={`shrink-0 text-xs tabular-nums ${isLongWait ? 'font-medium text-amber-600' : ''}`}
                    style={{ color: isLongWait ? undefined : 'var(--text-tertiary)' }}>
                    {wait}
                  </span>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => togglePlayerSleep(p.id, 'AVAILABLE')}
                        disabled={isToggling}
                        className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg transition-all hover:bg-amber-500/10 active:scale-90 disabled:opacity-40"
                        title="Put player to sleep"
                        aria-label="Put player to sleep"
                      >
                        <Moon size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                      <button
                        onClick={() => setPlayerMenuId(isMenuOpen ? null : p.id)}
                        className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] active:scale-90"
                        aria-label="Player options"
                      >
                        <MoreHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                      {isMenuOpen && (
                        <div ref={menuRef}
                          className="absolute right-[8px] top-[42px] z-30 min-w-[150px] overflow-hidden rounded-xl border shadow-[var(--shadow-elevated)]"
                          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}
                        >
                          <button
                            onClick={() => { setEditingPlayer(p); setEditName(p.guestName ?? p.user?.name ?? ''); setPlayerMenuId(null) }}
                            className="flex w-full min-h-[44px] items-center gap-[10px] px-[14px] py-[10px] text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <Pencil size={14} style={{ color: 'var(--text-tertiary)' }} />
                            Rename
                          </button>
                          <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                          <button
                            onClick={() => { setDeletingPlayer(p); setPlayerMenuId(null) }}
                            className="flex w-full min-h-[44px] items-center gap-[10px] px-[14px] py-[10px] text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        ) : !showAddPlayer && (
          <p className="py-[8px] text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>No players waiting</p>
        )}
      </section>

      {/* Sleeping Players */}
      {sleeping.length > 0 && (
        <section className="mb-[20px]">
          <SectionHeader title="Sleeping" count={sleeping.length} />
          <div className="space-y-[4px]">
            {sleeping.map((p) => {
              const isToggling = togglingPlayer === p.id
              const isMenuOpen = playerMenuId === p.id
              return (
                <div
                  key={p.id}
                  className="relative flex min-h-[40px] items-center gap-[10px] rounded-xl px-[12px] py-[8px]"
                  style={{ backgroundColor: 'var(--bg-hover)', opacity: 0.7 }}
                >
                  <Moon size={14} style={{ color: 'var(--text-tertiary)' }} />
                  <span className="min-w-0 flex-1 truncate text-sm" style={{ color: 'var(--text-tertiary)' }}>
                    {p.user?.name?.split(' ')[0] ?? p.guestName ?? 'Guest'}
                  </span>
                  {isAdmin && (
                    <>
                      <button
                        onClick={() => togglePlayerSleep(p.id, 'SITTING_OUT')}
                        disabled={isToggling}
                        className="flex h-[32px] shrink-0 items-center gap-[4px] rounded-lg px-[10px] text-xs font-medium transition-all hover:bg-primary/10 active:scale-95 disabled:opacity-40"
                        style={{ color: 'var(--text-secondary)' }}
                      >
                        <Sun size={12} />
                        Wake
                      </button>
                      <button
                        onClick={() => setPlayerMenuId(isMenuOpen ? null : p.id)}
                        className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-active)] active:scale-90"
                        aria-label="Player options"
                      >
                        <MoreHorizontal size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </button>
                      {isMenuOpen && (
                        <div ref={menuRef}
                          className="absolute right-[8px] top-[42px] z-30 min-w-[150px] overflow-hidden rounded-xl border shadow-[var(--shadow-elevated)]"
                          style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}
                        >
                          <button
                            onClick={() => { setEditingPlayer(p); setEditName(p.guestName ?? p.user?.name ?? ''); setPlayerMenuId(null) }}
                            className="flex w-full min-h-[44px] items-center gap-[10px] px-[14px] py-[10px] text-left text-sm transition-colors hover:bg-[var(--bg-hover)]"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <Pencil size={14} style={{ color: 'var(--text-tertiary)' }} />
                            Rename
                          </button>
                          <div className="border-t" style={{ borderColor: 'var(--border-subtle)' }} />
                          <button
                            onClick={() => { setDeletingPlayer(p); setPlayerMenuId(null) }}
                            className="flex w-full min-h-[44px] items-center gap-[10px] px-[14px] py-[10px] text-left text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                          >
                            <Trash2 size={14} />
                            Remove
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Absent players */}
      {absent.length > 0 && (
        <section className="mb-[20px]">
          <SectionHeader title="Absent" count={absent.length} />
          <div className="flex flex-wrap gap-[6px]">
            {absent.map((p) => (
              <span
                key={p.id}
                className="rounded-lg px-[10px] py-[5px] text-xs"
                style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}
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
    <main className="mx-auto max-w-[960px] px-[16px] pb-[120px] pt-[16px] sm:px-[24px]">
      <Link
        href={`/club/${session.club.id}`}
        className="mb-[12px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronLeft size={16} />
        {session.club.name}
      </Link>

      {/* Session Header */}
      <div className="card mb-[16px] flex flex-wrap items-center gap-x-[16px] gap-y-[8px] px-[16px] py-[12px]">
        <div className="flex min-w-0 flex-1 items-center gap-[10px]">
          <h1 className="truncate text-lg font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>{title}</h1>
          {session.status === 'ACTIVE' && (
            <span className="flex shrink-0 items-center gap-[4px] rounded-full bg-primary/10 px-[10px] py-[3px] text-xs font-bold uppercase tracking-wide text-primary">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-[6px] w-[6px] rounded-full bg-primary" />
              </span>
              Live
            </span>
          )}
          {session.status === 'ENDED' && (
            <span className="shrink-0 rounded-full px-[10px] py-[3px] text-xs font-semibold" style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>Ended</span>
          )}
        </div>

        <div className="flex items-center gap-[12px] text-xs" style={{ color: 'var(--text-tertiary)' }}>
          <span className="flex items-center gap-[4px]">
            <Users size={14} />
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{totalActivePlayers}</span>
          </span>
          <span className="flex items-center gap-[4px]">
            <Hash size={14} />
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{gamesPlayed}</span>
          </span>
          <span className="flex items-center gap-[4px]">
            <LayoutGrid size={14} />
            <span className="font-semibold" style={{ color: 'var(--text-secondary)' }}>{session.courts}</span>
          </span>
        </div>

        <div className="flex shrink-0 gap-[6px]">
          {isAdmin && (
            <Link href={`/session/${params.sessionId}/settings`}
              className="icon-btn border"
              style={{ borderColor: 'var(--border-default)' }}
              aria-label="Session settings"
            >
              <Settings size={18} />
            </Link>
          )}
          <button
            onClick={load}
            className="icon-btn border" style={{ borderColor: 'var(--border-default)' }}
            aria-label="Refresh"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-[12px] flex items-center gap-[8px] rounded-xl bg-red-50 px-[14px] py-[12px] text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-[24px]">
        <div>
          {/* Courts Section */}
          <section className="mb-[20px]">
            <SectionHeader title="Courts" count={session.courts} />
            <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
              {allCourts.map((courtNum, i) => {
                const game = occupiedCourts.get(courtNum)
                return (
                  <motion.div
                    key={courtNum}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <CourtCard
                      game={game}
                      courtNumber={courtNum}
                      isAdmin={isAdmin}
                      onEnterScore={setSelectedGame}
                      onEditPlayers={(g) => { setSwapGame(g); setSwapOutPlayerId(null) }}
                      isEmpty={!game}
                    />
                  </motion.div>
                )
              })}
            </div>
          </section>

          {/* Up Next Queue */}
          {queued.length > 0 && (
            <section className="mb-[20px]">
              <SectionHeader title="Up Next" count={queued.length} />
              <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
                {queued.map((g, i) => (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <CourtCard
                      game={g}
                      courtNumber={0}
                      isAdmin={isAdmin}
                      onEnterScore={setSelectedGame}
                      onEditPlayers={(g) => { setSwapGame(g); setSwapOutPlayerId(null) }}
                    />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Sidebar content on mobile */}
          <div className="lg:hidden">
            {sidebarContent}
          </div>

          {/* Completed Games */}
          {done.length > 0 && (
            <section className="mb-[20px]">
              <SectionHeader
                title="Completed"
                count={done.length}
                action={
                  done.length > 3 && (
                    <button
                      onClick={() => setShowAllCompleted(!showAllCompleted)}
                      className="min-h-[36px] rounded-lg px-[8px] text-xs font-medium text-primary hover:text-primary-dark"
                    >
                      {showAllCompleted ? 'Show less' : `Show all ${done.length}`}
                    </button>
                  )
                }
              />
              <div className="card divide-y overflow-hidden" style={{ borderColor: 'var(--border-default)' }}>
                {completedVisible.map((g) => (
                  <CompletedGameRow key={g.id} game={g} />
                ))}
              </div>
              {completedHidden > 0 && !showAllCompleted && (
                <button
                  onClick={() => setShowAllCompleted(true)}
                  className="mt-[6px] w-full rounded-xl py-[10px] text-center text-xs font-medium transition-colors"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  +{completedHidden} more
                </button>
              )}
            </section>
          )}

          {active.length === 0 && queued.length === 0 && done.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed py-[48px] text-center" style={{ borderColor: 'var(--border-default)' }}>
              <div className="mb-[8px] text-[32px]">🏸</div>
              <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {session.status === 'ACTIVE' ? 'Tap "Next Game" to start' : 'No games played'}
              </p>
            </div>
          )}
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-[80px]">
            {sidebarContent}
          </div>
        </aside>
      </div>

      {/* Bottom action bar */}
      {isAdmin && session.status === 'ACTIVE' && (
        <div className="safe-bottom-bar fixed bottom-0 left-0 right-0 z-40 border-t px-[16px] py-[10px]" style={{ borderColor: 'var(--border-default)', backgroundColor: 'color-mix(in srgb, var(--bg-card) 90%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div className="mx-auto flex max-w-[960px] gap-[8px]">
            <button
              onClick={generateGames}
              disabled={busy || waiting.length < 4}
              title={waiting.length < 4 ? 'Need 4+ waiting players' : ''}
              className="flex-1 rounded-xl bg-primary py-[14px] text-sm font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-40 disabled:shadow-none active:scale-[0.98] active:bg-primary-dark"
            >
              {busy ? (
                <span className="inline-flex items-center gap-[6px]">
                  <Loader2 size={16} className="animate-spin" />
                  Generating...
                </span>
              ) : (
                `Next Game${waiting.length >= 4 ? ` · ${waiting.length} waiting` : ''}`
              )}
            </button>
            <button
              onClick={() => setShowEndConfirm(true)}
              className="rounded-xl border px-[16px] py-[14px] text-sm font-semibold transition-colors"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-secondary)' }}
            >
              End
            </button>
          </div>
        </div>
      )}

      {selectedGame && (
        <ScoreEntryModal
          game={selectedGame}
          sessionId={params.sessionId}
          scoringSystem={session.scoringSystem}
          onClose={() => setSelectedGame(null)}
          onScoreEntered={async () => { setSelectedGame(null); await load() }}
        />
      )}

      {/* Swap player modal */}
      <AnimatePresence>
        {swapGame && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && (() => { setSwapGame(null); setSwapOutPlayerId(null) })()}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          >
            <motion.div
              className="w-full max-w-md rounded-t-3xl p-[24px] pb-[32px] sm:rounded-2xl sm:pb-[24px]"
              style={{ backgroundColor: 'var(--bg-card)' }}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            >
              <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full sm:hidden" style={{ backgroundColor: 'var(--border-default)' }} />
              <div className="mb-[4px] flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                  {swapOutPlayerId ? 'Choose Replacement' : 'Edit Players'}
                </h2>
                <button onClick={() => { setSwapGame(null); setSwapOutPlayerId(null) }}
                  className="flex h-[36px] w-[36px] items-center justify-center rounded-lg transition-colors hover:bg-[var(--bg-hover)]"
                  style={{ color: 'var(--text-tertiary)' }}>
                  <X size={18} />
                </button>
              </div>
              <p className="mb-[16px] text-sm" style={{ color: 'var(--text-secondary)' }}>
                {swapOutPlayerId
                  ? 'Pick a waiting player to swap in.'
                  : 'Tap a player to swap them out.'}
              </p>

              {!swapOutPlayerId ? (
                <div className="space-y-[6px]">
                  {(['A', 'B'] as const).map(team => {
                    const teamPlayers = swapGame.gamePlayers.filter(gp => gp.team === team)
                    return (
                      <div key={team}>
                        <p className="mb-[4px] text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-tertiary)' }}>
                          Team {team}
                        </p>
                        {teamPlayers.map(gp => (
                          <button key={gp.id}
                            onClick={() => setSwapOutPlayerId(gp.sessionPlayer.id)}
                            className="flex w-full min-h-[48px] items-center gap-[10px] rounded-xl px-[14px] py-[10px] text-left transition-colors hover:bg-[var(--bg-hover)]"
                          >
                            <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-xs font-bold"
                              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                              {(gp.sessionPlayer.user?.name ?? gp.sessionPlayer.guestName ?? 'G')[0].toUpperCase()}
                            </span>
                            <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                              {gp.sessionPlayer.user?.name ?? gp.sessionPlayer.guestName ?? 'Guest'}
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Swap</span>
                          </button>
                        ))}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="max-h-[300px] space-y-[2px] overflow-y-auto">
                  <button
                    onClick={() => setSwapOutPlayerId(null)}
                    className="mb-[8px] flex min-h-[36px] items-center gap-[6px] text-xs font-medium text-primary"
                  >
                    <ChevronLeft size={14} />
                    Back to players
                  </button>
                  {(() => {
                    const gamePlayerIds = new Set(swapGame.gamePlayers.map(gp => gp.sessionPlayer.id))
                    const swappable = session.sessionPlayers.filter(p =>
                      p.status === 'AVAILABLE' && !gamePlayerIds.has(p.id) && !committedIds.has(p.id)
                    )
                    if (swappable.length === 0) {
                      return <p className="py-[16px] text-center text-sm" style={{ color: 'var(--text-tertiary)' }}>No available players to swap in</p>
                    }
                    return swappable.map(p => (
                      <button key={p.id}
                        onClick={() => swapPlayer(p.id)}
                        disabled={busy}
                        className="flex w-full min-h-[48px] items-center gap-[10px] rounded-xl px-[14px] py-[10px] text-left transition-colors hover:bg-[var(--bg-hover)] disabled:opacity-50"
                      >
                        <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-xs font-bold"
                          style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                          {(p.user?.name ?? p.guestName ?? 'G')[0].toUpperCase()}
                        </span>
                        <span className="flex-1 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                          {p.user?.name ?? p.guestName ?? 'Guest'}
                        </span>
                        <span className="rounded-full bg-primary/10 px-[10px] py-[3px] text-xs font-semibold text-primary">
                          Swap in
                        </span>
                      </button>
                    ))
                  })()}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rename modal */}
      <AnimatePresence>
        {editingPlayer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setEditingPlayer(null)}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          >
            <motion.div
              className="w-full max-w-sm rounded-t-3xl p-[24px] pb-[32px] sm:rounded-2xl sm:pb-[24px]"
              style={{ backgroundColor: 'var(--bg-card)' }}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            >
              <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full sm:hidden" style={{ backgroundColor: 'var(--border-default)' }} />
              <h2 className="mb-[8px] text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Rename Player</h2>
              <p className="mb-[16px] text-sm" style={{ color: 'var(--text-secondary)' }}>
                {editingPlayer.user ? 'This will set a display name for this session.' : 'Update the guest name.'}
              </p>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') renamePlayer() }}
                autoFocus
                className="mb-[16px] w-full rounded-xl border px-[14px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
                style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
                placeholder="Player name"
              />
              <div className="flex gap-[10px]">
                <button onClick={renamePlayer} disabled={busy || !editName.trim()}
                  className="flex-1 rounded-xl bg-primary py-[14px] text-sm font-semibold text-white transition-colors disabled:opacity-50 active:scale-[0.98]">
                  {busy ? 'Saving...' : 'Save'}
                </button>
                <button onClick={() => setEditingPlayer(null)}
                  className="flex-1 rounded-xl border py-[14px] text-sm font-semibold transition-colors"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deletingPlayer && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setDeletingPlayer(null)}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          >
            <motion.div
              className="w-full max-w-sm rounded-t-3xl p-[24px] pb-[32px] sm:rounded-2xl sm:pb-[24px]"
              style={{ backgroundColor: 'var(--bg-card)' }}
              initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            >
              <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full sm:hidden" style={{ backgroundColor: 'var(--border-default)' }} />
              <h2 className="mb-[8px] text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Remove Player?</h2>
              <p className="mb-[20px] text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                Remove <strong>{deletingPlayer.user?.name ?? deletingPlayer.guestName ?? 'Guest'}</strong> from this session? Their completed game history will be kept.
              </p>
              <div className="flex gap-[10px]">
                <button onClick={removePlayer} disabled={busy}
                  className="flex-1 rounded-xl bg-red-500 py-[14px] text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:bg-red-600">
                  {busy ? 'Removing...' : 'Remove'}
                </button>
                <button onClick={() => setDeletingPlayer(null)}
                  className="flex-1 rounded-xl border py-[14px] text-sm font-semibold transition-colors"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}>
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* End session confirmation */}
      <AnimatePresence>
        {showEndConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => e.target === e.currentTarget && setShowEndConfirm(false)}
            style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
          >
            <motion.div
              className="w-full max-w-sm rounded-t-3xl p-[24px] pb-[32px] sm:rounded-2xl sm:pb-[24px]"
              style={{ backgroundColor: 'var(--bg-card)' }}
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            >
              <div className="mx-auto mb-[16px] h-[4px] w-[40px] rounded-full sm:hidden" style={{ backgroundColor: 'var(--border-default)' }} />
              <h2 className="mb-[8px] text-lg font-bold" style={{ color: 'var(--text-primary)' }}>End Session?</h2>
              <p className="mb-[20px] text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>This will close the session. You can still view results afterwards.</p>
              <div className="flex gap-[10px]">
                <button onClick={endSession} disabled={busy}
                  className="flex-1 rounded-xl bg-red-500 py-[14px] text-sm font-semibold text-white transition-colors disabled:opacity-50 hover:bg-red-600">
                  {busy ? 'Ending...' : 'End Session'}
                </button>
                <button onClick={() => setShowEndConfirm(false)}
                  className="flex-1 rounded-xl border py-[14px] text-sm font-semibold transition-colors"
                  style={{ borderColor: 'var(--border-default)', color: 'var(--text-primary)' }}
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

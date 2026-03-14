'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface SessionPlayer {
  id: string
  userId: string | null
  guestName: string | null
  status: 'AVAILABLE' | 'SITTING_OUT' | 'ABSENT'
  user: { id: string; name: string; email: string } | null
}

interface ClubMember {
  id: string
  userId: string
  user: { id: string; name: string; email: string }
}

interface PastGuest {
  guestName: string
  guestEmail: string | null
  sessionCount: number
}

interface Session {
  id: string
  name: string | null
  date: string
  status: string
  club: { id: string; name: string }
  sessionPlayers: SessionPlayer[]
}

export default function SessionSetupPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [members, setMembers] = useState<ClubMember[]>([])
  const [pastGuests, setPastGuests] = useState<PastGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [guestSearch, setGuestSearch] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [showGuestForm, setShowGuestForm] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${params.sessionId}`)
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setSession(data)
    const [mr, gr] = await Promise.all([
      fetch(`/api/clubs/${data.club.id}/members`),
      fetch(`/api/clubs/${data.club.id}/past-guests`),
    ])
    if (mr.ok) setMembers(await mr.json())
    if (gr.ok) setPastGuests(await gr.json())
    setLoading(false)
  }, [params.sessionId, router])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const addedUserIds = new Set(session?.sessionPlayers.filter((p) => p.userId).map((p) => p.userId!) ?? [])
  const addedGuestNames = new Set(session?.sessionPlayers.filter((p) => p.guestName).map((p) => p.guestName!.toLowerCase()) ?? [])
  const available = session?.sessionPlayers.filter((p) => p.status === 'AVAILABLE') ?? []

  async function toggleMember(userId: string) {
    setBusy(true)
    if (addedUserIds.has(userId)) {
      const sp = session?.sessionPlayers.find((p) => p.userId === userId)
      if (sp) await fetch(`/api/sessions/${params.sessionId}/players/${sp.id}`, { method: 'DELETE' })
    } else {
      await fetch(`/api/sessions/${params.sessionId}/players`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })
    }
    await load(); setBusy(false)
  }

  async function addGuest(name: string, email?: string) {
    if (!name.trim()) return
    setBusy(true)
    const payload: { guestName: string; guestEmail?: string } = { guestName: name.trim() }
    if (email?.trim()) payload.guestEmail = email.trim()
    await fetch(`/api/sessions/${params.sessionId}/players`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setGuestSearch(''); setGuestEmail(''); setShowGuestForm(false); setShowDropdown(false)
    await load(); setBusy(false)
  }

  async function removePlayer(id: string) {
    setBusy(true)
    await fetch(`/api/sessions/${params.sessionId}/players/${id}`, { method: 'DELETE' })
    await load(); setBusy(false)
  }

  async function toggleAvailability(id: string, status: string) {
    setBusy(true)
    const next = status === 'AVAILABLE' ? 'SITTING_OUT' : 'AVAILABLE'
    await fetch(`/api/sessions/${params.sessionId}/players/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    await load(); setBusy(false)
  }

  async function startSession() {
    if (available.length < 4) { setError('Need at least 4 available players'); return }
    setBusy(true)
    const res = await fetch(`/api/sessions/${params.sessionId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ACTIVE' }),
    })
    if (res.ok) router.push(`/session/${params.sessionId}`)
    else { setError('Failed to start session'); setBusy(false) }
  }

  if (loading) return (
    <main className="flex min-h-screen items-center justify-center">
      <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
    </main>
  )
  if (!session) return null

  const query = guestSearch.toLowerCase().trim()
  const filteredPastGuests = pastGuests.filter((g) =>
    !addedGuestNames.has(g.guestName.toLowerCase()) &&
    (query === '' || g.guestName.toLowerCase().includes(query))
  )
  const exactMatch = pastGuests.some((g) => g.guestName.toLowerCase() === query)
  const canAddNew = query.length > 0 && !exactMatch && !addedGuestNames.has(query)

  const guestPlayers = session.sessionPlayers.filter((p) => !p.userId)

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[140px] pt-[16px] sm:px-[24px]">
      <button onClick={() => router.back()}
        className="mb-[12px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium transition-colors"
        style={{ color: 'var(--text-tertiary)' }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      <div className="mb-[20px]">
        <h1 className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Add Players</h1>
        <p className="mt-[4px] text-sm" style={{ color: 'var(--text-tertiary)' }}>
          {session.name ?? new Date(session.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}{session.club.name}
        </p>
      </div>

      {error && (
        <div className="mb-[12px] flex items-center gap-[8px] rounded-xl bg-red-50 px-[14px] py-[12px] text-sm text-red-600">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v2.5M7 8.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      {members.length > 0 && (
        <section className="mb-[20px]">
          <div className="mb-[8px] flex items-center gap-[8px]">
            <h2 className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-tertiary)' }}>Club Members</h2>
            <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-[6px] text-xs font-bold"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              {members.length}
            </span>
          </div>
          <div className="card overflow-hidden">
            {members.map((m, i) => {
              const isIn = addedUserIds.has(m.userId)
              const sp = session.sessionPlayers.find((p) => p.userId === m.userId)
              return (
                <div key={m.id}
                  className={`flex items-center gap-[12px] px-[14px] py-[12px] ${i < members.length - 1 ? 'border-b' : ''}`}
                  style={{ borderColor: 'var(--border-subtle)' }}>
                  <button
                    onClick={() => toggleMember(m.userId)}
                    disabled={busy}
                    className={`relative flex h-[28px] w-[52px] shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      isIn ? 'bg-primary' : ''
                    }`}
                    style={{ backgroundColor: isIn ? undefined : 'var(--bg-active)' }}
                    aria-label={`Toggle ${m.user.name}`}
                  >
                    <span className={`absolute h-[24px] w-[24px] rounded-full bg-white shadow-sm transition-transform ${
                      isIn ? 'translate-x-[26px]' : 'translate-x-[2px]'
                    }`} />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium`}
                      style={{ color: isIn ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                      {m.user.name}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>{m.user.email}</p>
                  </div>

                  {sp && (
                    <button
                      onClick={() => toggleAvailability(sp.id, sp.status)}
                      disabled={busy}
                      className={`shrink-0 rounded-full px-[12px] py-[6px] text-xs font-semibold transition-colors ${
                        sp.status === 'AVAILABLE'
                          ? 'bg-primary/10 text-primary'
                          : ''
                      }`}
                      style={sp.status !== 'AVAILABLE' ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' } : undefined}>
                      {sp.status === 'AVAILABLE' ? 'Playing' : 'Out'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="mb-[20px]">
        <div className="mb-[8px] flex items-center gap-[8px]">
          <h2 className="text-xs font-semibold uppercase tracking-[0.08em]" style={{ color: 'var(--text-tertiary)' }}>Guests</h2>
          {guestPlayers.length > 0 && (
            <span className="flex h-[20px] min-w-[20px] items-center justify-center rounded-full px-[6px] text-xs font-bold"
              style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
              {guestPlayers.length}
            </span>
          )}
        </div>

        {guestPlayers.length > 0 && (
          <div className="card mb-[8px] overflow-hidden">
            {guestPlayers.map((sp, i) => (
              <div key={sp.id}
                className={`flex items-center gap-[12px] px-[14px] py-[12px] ${i < guestPlayers.length - 1 ? 'border-b' : ''}`}
                style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                  {(sp.guestName ?? 'G')[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {sp.guestName}
                    <span className="ml-[6px] text-xs font-normal" style={{ color: 'var(--text-tertiary)' }}>guest</span>
                  </p>
                </div>
                <button
                  onClick={() => toggleAvailability(sp.id, sp.status)}
                  disabled={busy}
                  className={`shrink-0 rounded-full px-[12px] py-[6px] text-xs font-semibold transition-colors ${
                    sp.status === 'AVAILABLE'
                      ? 'bg-primary/10 text-primary'
                      : ''
                  }`}
                  style={sp.status !== 'AVAILABLE' ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' } : undefined}>
                  {sp.status === 'AVAILABLE' ? 'Playing' : 'Out'}
                </button>
                <button onClick={() => removePlayer(sp.id)} disabled={busy}
                  className="icon-btn h-[44px] w-[44px] shrink-0 text-sm" style={{ color: 'var(--text-tertiary)' }}
                  aria-label={`Remove ${sp.guestName}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-[8px] rounded-xl border px-[14px] py-[12px] transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-[var(--ring-focus)]"
            style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0" style={{ color: 'var(--text-tertiary)' }}>
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={guestSearch}
              onChange={(e) => { setGuestSearch(e.target.value); setShowDropdown(true); setShowGuestForm(false) }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search past guests or type new name..."
              className="min-w-0 flex-1 bg-transparent text-[16px] focus:outline-none"
              style={{ color: 'var(--text-primary)' }}
            />
            {guestSearch && (
              <button onClick={() => { setGuestSearch(''); setGuestEmail(''); setShowDropdown(false); setShowGuestForm(false) }}
                className="icon-btn h-[36px] w-[36px] shrink-0" aria-label="Clear search">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M10 4L4 10M4 4l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            )}
          </div>

          {showDropdown && (filteredPastGuests.length > 0 || canAddNew) && (
            <div className="absolute left-0 right-0 z-20 mt-[4px] max-h-[280px] overflow-y-auto rounded-2xl border shadow-[var(--shadow-elevated)]"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)' }}>
              {filteredPastGuests.map((g) => (
                <button
                  key={g.guestName}
                  onClick={() => addGuest(g.guestName, g.guestEmail ?? undefined)}
                  disabled={busy}
                  className="flex w-full items-center gap-[12px] px-[14px] py-[12px] text-left transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-hover)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-xs font-semibold"
                    style={{ backgroundColor: 'var(--bg-hover)', color: 'var(--text-tertiary)' }}>
                    {g.guestName[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{g.guestName}</p>
                    <p className="truncate text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {g.guestEmail ? g.guestEmail + ' · ' : ''}
                      {g.sessionCount} past session{g.sessionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-primary">
                    <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                    <path d="M5.5 8h5M8 5.5v5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                  </svg>
                </button>
              ))}

              {canAddNew && (
                <button
                  onClick={() => { setShowDropdown(false); setShowGuestForm(true) }}
                  className="flex w-full items-center gap-[12px] border-t px-[14px] py-[12px] text-left transition-colors"
                  style={{ borderColor: 'var(--border-subtle)' }}
                >
                  <span className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    +
                  </span>
                  <p className="text-sm font-medium text-primary">
                    Add &ldquo;{guestSearch.trim()}&rdquo; as new guest
                  </p>
                </button>
              )}
            </div>
          )}
        </div>

        {showGuestForm && guestSearch.trim() && (
          <div className="card mt-[8px] p-[14px]">
            <p className="mb-[8px] text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Adding: <span className="font-semibold">{guestSearch.trim()}</span>
            </p>
            <input
              type="email"
              placeholder="Email (optional - links stats if they register)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGuest(guestSearch, guestEmail))}
              className="mb-[10px] w-full rounded-xl border px-[14px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-hover)', color: 'var(--text-primary)' }}
              autoFocus
            />
            <div className="flex gap-[8px]">
              <button onClick={() => addGuest(guestSearch, guestEmail)} disabled={busy}
                className="rounded-xl bg-primary px-[16px] py-[12px] text-sm font-semibold text-white transition-colors disabled:opacity-50 active:scale-[0.98]">
                Add Guest
              </button>
              <button onClick={() => { setShowGuestForm(false); setGuestSearch(''); setGuestEmail('') }}
                className="rounded-xl border px-[14px] py-[12px] text-sm transition-colors"
                style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      <div className="safe-bottom-bar fixed bottom-0 left-0 right-0 border-t px-[16px] py-[10px]"
        style={{ borderColor: 'var(--border-default)', backgroundColor: 'color-mix(in srgb, var(--bg-card) 90%, transparent)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="mx-auto max-w-[640px]">
          <button onClick={startSession} disabled={busy || available.length < 4}
            className="w-full rounded-xl bg-primary py-[14px] text-base font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-40 disabled:shadow-none active:scale-[0.98] active:bg-primary-dark">
            {busy ? (
              <span className="inline-flex items-center gap-[6px]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                Starting...
              </span>
            ) : `Start Session · ${available.length} player${available.length !== 1 ? 's' : ''} ready`}
          </button>
          {available.length < 4 && (
            <p className="mt-[6px] text-center text-xs" style={{ color: 'var(--text-tertiary)' }}>Need at least 4 available players</p>
          )}
        </div>
      </div>
    </main>
  )
}

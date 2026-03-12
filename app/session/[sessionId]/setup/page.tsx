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

  // Guest search state
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

  // Close dropdown on outside click
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
      <p className="text-neutral">Loading…</p>
    </main>
  )
  if (!session) return null

  // Filter past guests for dropdown (not already in session, matching search)
  const query = guestSearch.toLowerCase().trim()
  const filteredPastGuests = pastGuests.filter((g) =>
    !addedGuestNames.has(g.guestName.toLowerCase()) &&
    (query === '' || g.guestName.toLowerCase().includes(query))
  )
  const exactMatch = pastGuests.some((g) => g.guestName.toLowerCase() === query)
  const canAddNew = query.length > 0 && !exactMatch && !addedGuestNames.has(query)

  const guestPlayers = session.sessionPlayers.filter((p) => !p.userId)

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[120px] pt-[16px]">
      {/* Back link */}
      <button onClick={() => router.back()}
        className="mb-[12px] inline-flex items-center gap-[4px] text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-[20px]">
        <h1 className="text-[20px] font-bold tracking-tight text-gray-900">Add Players</h1>
        <p className="mt-[2px] text-[13px] text-gray-400">
          {session.name ?? new Date(session.date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}
          {' · '}{session.club.name}
        </p>
      </div>

      {error && (
        <div className="mb-[12px] flex items-center gap-[8px] rounded-xl bg-red-50 px-[14px] py-[10px] text-[13px] text-red-600">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 4.5v2.5M7 8.5h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          {error}
        </div>
      )}

      {/* ========= Club Members — Toggle On/Off ========= */}
      {members.length > 0 && (
        <section className="mb-[20px]">
          <div className="mb-[8px] flex items-center gap-[8px]">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Club Members</h2>
            <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gray-100 px-[5px] text-[10px] font-bold text-gray-500">
              {members.length}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
            {members.map((m, i) => {
              const isIn = addedUserIds.has(m.userId)
              const sp = session.sessionPlayers.find((p) => p.userId === m.userId)
              return (
                <div key={m.id}
                  className={`flex items-center gap-[10px] px-[12px] py-[10px] ${i < members.length - 1 ? 'border-b border-gray-100' : ''}`}>
                  {/* Toggle switch */}
                  <button
                    onClick={() => toggleMember(m.userId)}
                    disabled={busy}
                    className={`relative flex h-[24px] w-[42px] shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                      isIn ? 'bg-primary' : 'bg-gray-200'
                    }`}
                    aria-label={`Toggle ${m.user.name}`}
                  >
                    <span className={`absolute h-[20px] w-[20px] rounded-full bg-white shadow-sm transition-transform ${
                      isIn ? 'translate-x-[20px]' : 'translate-x-[2px]'
                    }`} />
                  </button>

                  {/* Name + email */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13px] font-medium ${isIn ? 'text-gray-900' : 'text-gray-400'}`}>
                      {m.user.name}
                    </p>
                    <p className="truncate text-[11px] text-gray-400">{m.user.email}</p>
                  </div>

                  {/* Status toggle (only for players in session) */}
                  {sp && (
                    <button
                      onClick={() => toggleAvailability(sp.id, sp.status)}
                      disabled={busy}
                      className={`shrink-0 rounded-full px-[8px] py-[3px] text-[10px] font-semibold transition-colors ${
                        sp.status === 'AVAILABLE'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                      {sp.status === 'AVAILABLE' ? 'Playing' : 'Out'}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ========= Guest Players ========= */}
      <section className="mb-[20px]">
        <div className="mb-[8px] flex items-center gap-[8px]">
          <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">Guests</h2>
          {guestPlayers.length > 0 && (
            <span className="flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-gray-100 px-[5px] text-[10px] font-bold text-gray-500">
              {guestPlayers.length}
            </span>
          )}
        </div>

        {/* Current guests in session */}
        {guestPlayers.length > 0 && (
          <div className="mb-[8px] overflow-hidden rounded-xl border border-gray-100 bg-white">
            {guestPlayers.map((sp, i) => (
              <div key={sp.id}
                className={`flex items-center gap-[10px] px-[12px] py-[10px] ${i < guestPlayers.length - 1 ? 'border-b border-gray-100' : ''}`}>
                <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-400">
                  {(sp.guestName ?? 'G')[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-gray-900">
                    {sp.guestName}
                    <span className="ml-[6px] text-[10px] font-normal text-gray-400">guest</span>
                  </p>
                </div>
                <button
                  onClick={() => toggleAvailability(sp.id, sp.status)}
                  disabled={busy}
                  className={`shrink-0 rounded-full px-[8px] py-[3px] text-[10px] font-semibold transition-colors ${
                    sp.status === 'AVAILABLE'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                  {sp.status === 'AVAILABLE' ? 'Playing' : 'Out'}
                </button>
                <button onClick={() => removePlayer(sp.id)} disabled={busy}
                  className="shrink-0 text-[14px] text-gray-300 transition-colors hover:text-red-400">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Guest search combobox */}
        <div ref={searchRef} className="relative">
          <div className="flex items-center gap-[8px] rounded-xl border border-gray-200 bg-white px-[12px] py-[8px] transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-gray-300">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M10.5 10.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              value={guestSearch}
              onChange={(e) => { setGuestSearch(e.target.value); setShowDropdown(true); setShowGuestForm(false) }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search past guests or type new name…"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
            {guestSearch && (
              <button onClick={() => { setGuestSearch(''); setGuestEmail(''); setShowDropdown(false); setShowGuestForm(false) }}
                className="shrink-0 text-[14px] text-gray-300 hover:text-gray-500">×</button>
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (filteredPastGuests.length > 0 || canAddNew) && (
            <div className="absolute left-0 right-0 z-20 mt-[4px] max-h-[240px] overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
              {filteredPastGuests.map((g) => (
                <button
                  key={g.guestName}
                  onClick={() => addGuest(g.guestName, g.guestEmail ?? undefined)}
                  disabled={busy}
                  className="flex w-full items-center gap-[10px] px-[12px] py-[10px] text-left transition-colors hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-semibold text-gray-400">
                    {g.guestName[0].toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-gray-700">{g.guestName}</p>
                    <p className="truncate text-[11px] text-gray-400">
                      {g.guestEmail ? g.guestEmail + ' · ' : ''}
                      {g.sessionCount} past session{g.sessionCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0 text-primary">
                    <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2"/>
                    <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                </button>
              ))}

              {canAddNew && (
                <button
                  onClick={() => { setShowDropdown(false); setShowGuestForm(true) }}
                  className="flex w-full items-center gap-[10px] border-t border-gray-100 px-[12px] py-[10px] text-left transition-colors hover:bg-gray-50"
                >
                  <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-primary/10 text-[13px] font-semibold text-primary">
                    +
                  </span>
                  <p className="text-[13px] font-medium text-primary">
                    Add &ldquo;{guestSearch.trim()}&rdquo; as new guest
                  </p>
                </button>
              )}
            </div>
          )}
        </div>

        {/* New guest form (expanded when "Add new guest" is clicked) */}
        {showGuestForm && guestSearch.trim() && (
          <div className="mt-[8px] rounded-xl border border-gray-200 bg-white p-[12px]">
            <p className="mb-[8px] text-[13px] font-medium text-gray-700">
              Adding: <span className="font-semibold">{guestSearch.trim()}</span>
            </p>
            <input
              type="email"
              placeholder="Email (optional — links stats if they register)"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGuest(guestSearch, guestEmail))}
              className="mb-[8px] w-full rounded-lg border border-gray-200 bg-gray-50/50 px-[12px] py-[8px] text-[13px] text-gray-700 focus:border-primary focus:bg-white focus:outline-none"
              autoFocus
            />
            <div className="flex gap-[8px]">
              <button onClick={() => addGuest(guestSearch, guestEmail)} disabled={busy}
                className="rounded-lg bg-primary px-[14px] py-[8px] text-[12px] font-semibold text-white transition-colors disabled:opacity-50 active:scale-[0.98]">
                Add Guest
              </button>
              <button onClick={() => { setShowGuestForm(false); setGuestSearch(''); setGuestEmail('') }}
                className="rounded-lg border border-gray-200 px-[12px] py-[8px] text-[12px] text-gray-500 transition-colors hover:bg-gray-50">
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Sticky bottom CTA */}
      <div className="safe-bottom-bar fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/90 px-[16px] py-[10px] backdrop-blur-md">
        <div className="mx-auto max-w-[640px]">
          <button onClick={startSession} disabled={busy || available.length < 4}
            className="w-full rounded-xl bg-primary py-[12px] text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-40 disabled:shadow-none active:scale-[0.98] active:bg-primary-dark">
            {busy ? (
              <span className="inline-flex items-center gap-[6px]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                Starting…
              </span>
            ) : `Start Session · ${available.length} player${available.length !== 1 ? 's' : ''} ready`}
          </button>
          {available.length < 4 && (
            <p className="mt-[6px] text-center text-[11px] text-gray-400">Need at least 4 available players</p>
          )}
        </div>
      </div>
    </main>
  )
}

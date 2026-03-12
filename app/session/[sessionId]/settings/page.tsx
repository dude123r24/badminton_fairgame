'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface SessionData {
  id: string
  name: string | null
  pairingAlgorithm: string
  opponentAlgorithm: string
  scoringSystem: string
  courts: number
  status: string
  club: { id: string; name: string }
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER'
}

const pairingOptions = [
  { value: 'RANDOM', label: 'Random' },
  { value: 'EQUAL_WEIGHT', label: 'Equal Weight' },
  { value: 'PER_GAME', label: 'Per Game' },
]

const opponentOptions = [
  { value: 'RANDOM', label: 'Random' },
  { value: 'EQUAL_WEIGHT', label: 'Equal Weight' },
  { value: 'OPPONENT_WEIGHT', label: 'Opponent Weight' },
  { value: 'PLAY_WITHIN_CLASS', label: 'Within Class' },
]

const scoringOptions = [
  { value: 'RALLY_21', label: 'Rally 21' },
  { value: 'RALLY_21_SETTING', label: 'Rally 21 (Setting)' },
  { value: 'SHORT_15', label: 'Short 15' },
  { value: 'SHORT_7', label: 'Short 7' },
]

export default function SessionSettingsPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter()
  const [session, setSession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [pairing, setPairing] = useState('')
  const [opponent, setOpponent] = useState('')
  const [scoring, setScoring] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${params.sessionId}`)
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setSession(data)
    setPairing(data.pairingAlgorithm)
    setOpponent(data.opponentAlgorithm)
    setScoring(data.scoringSystem)
    setLoading(false)
  }, [params.sessionId, router])

  useEffect(() => { load() }, [load])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false)
    const res = await fetch(`/api/sessions/${params.sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pairingAlgorithm: pairing,
        opponentAlgorithm: opponent,
        scoringSystem: scoring,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading || !session) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-[14px] text-gray-400">Loading…</p></main>
  }

  const isAdmin = session.userRole === 'OWNER' || session.userRole === 'ADMIN'
  if (!isAdmin) { router.push(`/session/${params.sessionId}`); return null }

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[80px] pt-[20px]">
      <Link href={`/session/${params.sessionId}`}
        className="mb-[20px] inline-flex items-center gap-[4px] text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to session
      </Link>

      <h1 className="mb-[4px] text-[22px] font-bold tracking-tight text-gray-900">Session Settings</h1>
      <p className="mb-[24px] text-[13px] text-gray-400">
        {session.name ?? 'Unnamed session'} · {session.status}
      </p>

      <form onSubmit={save} className="space-y-[20px]">
        <SettingSelect label="Pairing Algorithm" options={pairingOptions} value={pairing} onChange={setPairing} />
        <SettingSelect label="Opponent Selection" options={opponentOptions} value={opponent} onChange={setOpponent} />
        <SettingSelect label="Scoring System" options={scoringOptions} value={scoring} onChange={setScoring} />

        <button type="submit" disabled={saving}
          className="w-full rounded-xl bg-primary py-[14px] text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
        </button>
      </form>
    </main>
  )
}

function SettingSelect({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <label className="mb-[8px] block text-[13px] font-semibold text-gray-900">{label}</label>
      <div className="flex flex-wrap gap-[6px]">
        {options.map((opt) => (
          <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
            className={`rounded-lg px-[12px] py-[8px] text-[13px] font-medium transition-all ${
              value === opt.value
                ? 'bg-primary/[0.1] text-primary ring-1 ring-primary/20'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

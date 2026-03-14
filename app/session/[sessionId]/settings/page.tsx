'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Minus, Plus } from 'lucide-react'

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
  { value: 'RANDOM', label: 'Random', icon: '🎲', desc: 'Shuffle and pair — pure chance, maximum variety' },
  { value: 'EQUAL_WEIGHT', label: 'Balanced', icon: '⚖️', desc: 'Strong + weak partner so every team is equal' },
  { value: 'LADDER', label: 'Ladder', icon: '🪜', desc: 'Similar-rated players pair up together' },
  { value: 'PEG', label: 'Peg Board', icon: '📋', desc: 'Longest-waiting players go on next — pure fairness' },
]

const opponentOptions = [
  { value: 'RANDOM', label: 'Random', icon: '🎲', desc: 'Play any available team on the day' },
  { value: 'EQUAL_WEIGHT', label: 'Balanced', icon: '⚖️', desc: 'Face the team closest to your combined rating' },
  { value: 'LADDER', label: 'Ladder', icon: '🪜', desc: 'Adjacent-ranked teams play each other' },
  { value: 'PEG', label: 'Peg Board', icon: '📋', desc: 'Matched by queue position — first come first served' },
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
  const [courts, setCourts] = useState(1)

  const load = useCallback(async () => {
    const res = await fetch(`/api/sessions/${params.sessionId}`)
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setSession(data)
    setPairing(data.pairingAlgorithm)
    setOpponent(data.opponentAlgorithm)
    setScoring(data.scoringSystem)
    setCourts(data.courts)
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
        courts,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading || !session) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></main>
  }

  const isAdmin = session.userRole === 'OWNER' || session.userRole === 'ADMIN'
  if (!isAdmin) { router.push(`/session/${params.sessionId}`); return null }

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[100px] pt-[16px] sm:px-[24px]">
      <Link href={`/session/${params.sessionId}`}
        className="mb-[16px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <ChevronLeft size={16} />
        Back to session
      </Link>

      <h1 className="mb-[4px] text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Session Settings</h1>
      <p className="mb-[24px] text-sm" style={{ color: 'var(--text-tertiary)' }}>
        {session.name ?? 'Unnamed session'} · {session.status}
      </p>

      <form onSubmit={save} className="space-y-[20px]">
        {/* Courts */}
        <div className="card p-[16px]">
          <label className="mb-[8px] block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Number of Courts</label>
          <div className="flex items-center gap-[16px]">
            <button
              type="button"
              onClick={() => setCourts(c => Math.max(1, c - 1))}
              disabled={courts <= 1}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-30"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <Minus size={18} />
            </button>
            <span className="min-w-[40px] text-center text-2xl font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
              {courts}
            </span>
            <button
              type="button"
              onClick={() => setCourts(c => Math.min(20, c + 1))}
              disabled={courts >= 20}
              className="flex h-[44px] w-[44px] items-center justify-center rounded-xl border transition-all active:scale-95 disabled:opacity-30"
              style={{ borderColor: 'var(--border-default)', color: 'var(--text-secondary)' }}
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

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
  options: { value: string; label: string; icon?: string; desc?: string }[]
  value: string
  onChange: (v: string) => void
}) {
  const hasDesc = options.some(o => o.desc)
  return (
    <div className="card p-[16px]">
      <label className="mb-[10px] block text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{label}</label>
      {hasDesc ? (
        <div className="grid gap-[6px]">
          {options.map((opt) => {
            const selected = value === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                className={`flex min-h-[52px] items-start gap-[10px] rounded-xl px-[14px] py-[10px] text-left transition-all ${
                  selected ? 'bg-primary/[0.1] ring-1 ring-primary/20' : ''
                }`}
                style={!selected ? { backgroundColor: 'var(--bg-hover)' } : undefined}
              >
                {opt.icon && <span className="mt-[1px] text-base leading-none">{opt.icon}</span>}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${selected ? 'text-primary' : ''}`}
                    style={!selected ? { color: 'var(--text-primary)' } : undefined}>
                    {opt.label}
                  </p>
                  {opt.desc && (
                    <p className="mt-[2px] text-xs leading-snug" style={{ color: 'var(--text-tertiary)' }}>
                      {opt.desc}
                    </p>
                  )}
                </div>
                {selected && (
                  <span className="mt-[2px] shrink-0 text-primary">✓</span>
                )}
              </button>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-wrap gap-[6px]">
          {options.map((opt) => (
            <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
              className={`min-h-[40px] rounded-xl px-[14px] py-[10px] text-sm font-medium transition-all ${
                value === opt.value
                  ? 'bg-primary/[0.1] text-primary ring-1 ring-primary/20'
                  : ''
              }`}
              style={value !== opt.value ? { backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)' } : undefined}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

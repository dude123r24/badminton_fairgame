'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Club {
  id: string
  name: string
  location: string | null
  defaultCourts: number
  defaultPairingAlgorithm: string
  defaultOpponentAlgorithm: string
  defaultScoringSystem: string
  userRole: 'OWNER' | 'ADMIN' | 'MEMBER'
}

const pairingOptions = [
  { value: 'RANDOM', label: 'Random', desc: 'Fully random partner assignment' },
  { value: 'EQUAL_WEIGHT', label: 'Equal Weight', desc: 'Balanced by games played' },
  { value: 'PER_GAME', label: 'Per Game', desc: 'Re-pair every game based on sitting time' },
]

const opponentOptions = [
  { value: 'RANDOM', label: 'Random', desc: 'Random opponent selection' },
  { value: 'EQUAL_WEIGHT', label: 'Equal Weight', desc: 'Balanced by game count' },
  { value: 'OPPONENT_WEIGHT', label: 'Opponent Weight', desc: 'Avoid repeat matchups' },
  { value: 'PLAY_WITHIN_CLASS', label: 'Within Class', desc: 'Match similar skill levels' },
]

const scoringOptions = [
  { value: 'RALLY_21', label: 'Rally 21', desc: 'First to 21, win by 2' },
  { value: 'RALLY_21_SETTING', label: 'Rally 21 (Setting)', desc: 'Setting at 29-all' },
  { value: 'RALLY_21_NO_SETTING', label: 'Rally 21 (No Setting)', desc: 'Exactly 21 to win' },
  { value: 'SHORT_15', label: 'Short 15', desc: 'First to 15' },
  { value: 'SHORT_7', label: 'Short 7', desc: 'First to 7' },
]

export default function SettingsPage({ params }: { params: { clubId: string } }) {
  const router = useRouter()
  const [club, setClub] = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [courts, setCourts] = useState(2)
  const [pairing, setPairing] = useState('EQUAL_WEIGHT')
  const [opponent, setOpponent] = useState('EQUAL_WEIGHT')
  const [scoring, setScoring] = useState('RALLY_21')

  const load = useCallback(async () => {
    const res = await fetch(`/api/clubs/${params.clubId}`)
    if (!res.ok) { router.push('/dashboard'); return }
    const data = await res.json()
    setClub(data)
    setName(data.name)
    setLocation(data.location ?? '')
    setCourts(data.defaultCourts)
    setPairing(data.defaultPairingAlgorithm)
    setOpponent(data.defaultOpponentAlgorithm)
    setScoring(data.defaultScoringSystem)
    setLoading(false)
  }, [params.clubId, router])

  useEffect(() => { load() }, [load])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false)
    const res = await fetch(`/api/clubs/${params.clubId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        location: location.trim() || null,
        defaultCourts: courts,
        defaultPairingAlgorithm: pairing,
        defaultOpponentAlgorithm: opponent,
        defaultScoringSystem: scoring,
      }),
    })
    setSaving(false)
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  if (loading || !club) {
    return <main className="flex min-h-screen items-center justify-center"><p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading...</p></main>
  }

  if (club.userRole !== 'OWNER') { router.push(`/club/${params.clubId}`); return null }

  return (
    <main className="mx-auto max-w-[640px] px-[16px] pb-[100px] pt-[16px] sm:px-[24px]">
      <Link
        href={`/club/${params.clubId}`}
        className="mb-[16px] inline-flex min-h-[44px] items-center gap-[6px] text-sm font-medium transition-colors"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        Back to club
      </Link>

      <h1 className="mb-[24px] text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Club Settings</h1>

      <form onSubmit={save} className="space-y-[24px]">
        {/* Basic info */}
        <SettingsSection title="General">
          <FieldGroup label="Club Name">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border px-[14px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
              required
            />
          </FieldGroup>
          <FieldGroup label="Location">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Melbourne Sports Centre"
              className="w-full rounded-xl border px-[14px] py-[12px] text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />
          </FieldGroup>
          <FieldGroup label="Default Courts">
            <input
              type="number"
              min={1}
              max={20}
              value={courts}
              onChange={(e) => setCourts(parseInt(e.target.value, 10) || 1)}
              className="w-[100px] rounded-xl border px-[14px] py-[12px] text-center text-[16px] transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-[var(--ring-focus)]"
              style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />
          </FieldGroup>
        </SettingsSection>

        {/* Pairing */}
        <SettingsSection title="Pairing Algorithm">
          <p className="mb-[10px] text-xs" style={{ color: 'var(--text-tertiary)' }}>How partners are assigned each round</p>
          <RadioGroup options={pairingOptions} value={pairing} onChange={setPairing} name="pairing" />
        </SettingsSection>

        {/* Opponent */}
        <SettingsSection title="Opponent Selection">
          <p className="mb-[10px] text-xs" style={{ color: 'var(--text-tertiary)' }}>How opposing teams are matched</p>
          <RadioGroup options={opponentOptions} value={opponent} onChange={setOpponent} name="opponent" />
        </SettingsSection>

        {/* Scoring */}
        <SettingsSection title="Scoring System">
          <p className="mb-[10px] text-xs" style={{ color: 'var(--text-tertiary)' }}>Default scoring for new sessions</p>
          <RadioGroup options={scoringOptions} value={scoring} onChange={setScoring} name="scoring" />
        </SettingsSection>

        {/* Save */}
        <div className="sticky bottom-0 border-t py-[16px]" style={{ borderColor: 'var(--border-default)', backgroundColor: 'var(--bg-app)' }}>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary py-[14px] text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-50 active:scale-[0.98]"
          >
            {saving ? 'Saving…' : saved ? 'Saved ✓' : 'Save Changes'}
          </button>
        </div>
      </form>
    </main>
  )
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card p-[20px]">
      <h2 className="mb-[16px] text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
      {children}
    </section>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-[14px] last:mb-0">
      <label className="mb-[6px] block text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}

function RadioGroup({ options, value, onChange, name }: {
  options: { value: string; label: string; desc: string }[]
  value: string
  onChange: (v: string) => void
  name: string
}) {
  return (
    <div className="space-y-[6px]">
      {options.map((opt) => (
        <label
          key={opt.value}
          className={`flex min-h-[44px] cursor-pointer items-center gap-[12px] rounded-xl px-[14px] py-[12px] transition-colors ${
            value === opt.value
              ? 'bg-primary/[0.06] ring-1 ring-primary/20'
              : ''
          }`}
          style={value !== opt.value ? { backgroundColor: 'transparent' } : undefined}
        >
          <input
            type="radio"
            name={name}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="h-[18px] w-[18px] text-primary focus:ring-primary/20"
            style={{ borderColor: 'var(--border-default)' }}
          />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
            <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>{opt.desc}</p>
          </div>
        </label>
      ))}
    </div>
  )
}

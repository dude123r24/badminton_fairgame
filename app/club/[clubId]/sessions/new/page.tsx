'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import OptionCard from '@/components/ui/OptionCard'

const PAIRING = [
  { value: 'EQUAL_WEIGHT', icon: '⚖️', title: 'Equal Weight', description: 'Pair strongest with weakest for balanced teams' },
  { value: 'RANDOM', icon: '🎲', title: 'Random', description: 'Shuffle and pair — pure chance' },
  { value: 'PER_GAME', icon: '🔄', title: 'Per Game', description: 'Re-pair players fresh every round' },
  { value: 'FIXED', icon: '🔒', title: 'Fixed', description: 'Pre-set partnerships, same team all session' },
]

const OPPONENT = [
  { value: 'EQUAL_WEIGHT', icon: '⚖️', title: 'Equal Weight', description: 'Face the pair closest to your combined skill' },
  { value: 'RANDOM', icon: '🎲', title: 'Random', description: 'Play anyone available on the day' },
  { value: 'OPPONENT_WEIGHT', icon: '🏆', title: 'Competitive', description: 'Weighted by individual opponent history' },
  { value: 'PLAY_WITHIN_CLASS', icon: '🎯', title: 'Within Class', description: 'Amateurs vs amateurs, advanced vs advanced' },
]

const SCORING = [
  { value: 'RALLY_21', icon: '🏸', title: 'Rally 21', description: 'Standard BWF: first to 21, win by 2, cap 30' },
  { value: 'RALLY_21_SETTING', icon: '🏸', title: 'Rally 21 + Setting', description: 'To 21 with setting at 29-all' },
  { value: 'RALLY_21_NO_SETTING', icon: '🏸', title: 'Rally 21 Strict', description: 'Exactly 21, no deuce play' },
  { value: 'SHORT_15', icon: '⚡', title: 'Short 15', description: 'Quick game, first to 15' },
  { value: 'SHORT_7', icon: '⚡', title: 'Short 7', description: 'Lightning round, first to 7' },
  { value: 'CUSTOM_CAP', icon: '🔧', title: 'Custom Cap', description: 'Set your own point target' },
]

const FORMAT = [
  { value: 'ROTATING_PARTNER', icon: '🔄', title: 'Rotating Partner', description: 'Switch partners between games' },
  { value: 'FIXED_PAIR', icon: '👫', title: 'Fixed Pair', description: 'Keep the same partner all session' },
  { value: 'RANDOM_PAIR', icon: '🎲', title: 'Random Pair', description: 'Randomly assigned every single game' },
]

const STRUCTURE = [
  { value: 'CLUB_ROTATION', icon: '🔄', title: 'Club Rotation', description: 'Casual — everyone rotates courts freely' },
  { value: 'ROUND_ROBIN', icon: '🔁', title: 'Round Robin', description: 'Every pair faces every other pair' },
  { value: 'SWISS', icon: '🇨🇭', title: 'Swiss', description: 'Paired by wins, tournament-style' },
  { value: 'SINGLE_ELIM', icon: '🏆', title: 'Single Elim', description: 'Lose once and you\'re out' },
  { value: 'DOUBLE_ELIM', icon: '🥈', title: 'Double Elim', description: 'Two losses required to exit' },
  { value: 'COMBO', icon: '🎭', title: 'Combo', description: 'Mix of formats for longer events' },
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-[24px]">
      <h2 className="mb-[10px] text-[12px] font-semibold uppercase tracking-[0.08em] text-gray-400">{title}</h2>
      {children}
    </section>
  )
}

function OptionGrid({ options, value, onChange, cols }: {
  options: typeof PAIRING
  value: string
  onChange: (v: string) => void
  cols?: string
}) {
  return (
    <div className={cols ?? 'grid grid-cols-1 gap-[8px] sm:grid-cols-2 md:grid-cols-4'}>
      {options.map((opt) => (
        <OptionCard
          key={opt.value}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          icon={opt.icon}
          title={opt.title}
          description={opt.description}
        />
      ))}
    </div>
  )
}

export default function NewSessionPage({ params }: { params: { clubId: string } }) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [date, setDate] = useState(() => {
    const d = new Date(); d.setMinutes(0, 0, 0)
    return d.toISOString().slice(0, 16)
  })
  const [courts, setCourts] = useState(2)
  const [courtNumbers, setCourtNumbers] = useState('1,2')
  const [pairing, setPairing] = useState('EQUAL_WEIGHT')
  const [opponent, setOpponent] = useState('EQUAL_WEIGHT')
  const [format, setFormat] = useState('ROTATING_PARTNER')
  const [structure, setStructure] = useState('CLUB_ROTATION')
  const [scoring, setScoring] = useState('RALLY_21')
  const [customCap, setCustomCap] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setCourtNumbers(Array.from({ length: courts }, (_, i) => i + 1).join(','))
  }, [courts])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    const parsedCourtNums = courtNumbers
      .split(',').map((n) => parseInt(n.trim(), 10)).filter((n) => !isNaN(n) && n > 0)

    if (parsedCourtNums.length !== courts) {
      setError(`Enter exactly ${courts} court number(s), comma-separated`)
      return
    }
    if (scoring === 'CUSTOM_CAP' && !customCap) {
      setError('Enter the custom cap score')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/clubs/${params.clubId}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || undefined,
          date: new Date(date).toISOString(),
          courts,
          courtNumbers: parsedCourtNums,
          pairingAlgorithm: pairing,
          opponentAlgorithm: opponent,
          pairingMode: pairing === 'PER_GAME' ? 'PER_GAME' : 'FIXED',
          matchFormat: format,
          tournamentStructure: structure,
          scoringSystem: scoring,
          customCapScore: scoring === 'CUSTOM_CAP' ? parseInt(customCap, 10) : undefined,
        }),
      })
      if (!res.ok) { setError('Failed to create session'); setLoading(false); return }
      const s = await res.json()
      router.push(`/session/${s.id}/setup`)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-[720px] px-[16px] pb-[120px] pt-[20px]">
      {/* Back link */}
      <button onClick={() => router.back()}
        className="mb-[16px] inline-flex items-center gap-[4px] text-[13px] font-medium text-gray-400 transition-colors hover:text-gray-600">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-gray-400">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="mb-[24px]">
        <h1 className="text-[22px] font-bold tracking-tight text-gray-900">New Session</h1>
        <p className="mt-[4px] text-[13px] text-gray-400">Set up how you want to play today.</p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basics card */}
        <div className="mb-[24px] rounded-2xl bg-white p-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] sm:p-[20px]">
          <Section title="Basics">
            <div className="space-y-[12px]">
              <div>
                <label className="mb-[6px] block text-[13px] font-medium text-gray-600">
                  Session name <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tuesday Night Badminton"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-[14px] py-[10px] text-[14px] text-gray-700 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="grid grid-cols-1 gap-[12px] sm:grid-cols-2">
                <div>
                  <label className="mb-[6px] block text-[13px] font-medium text-gray-600">Date & Time</label>
                  <input
                    type="datetime-local"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-[14px] py-[10px] text-[14px] text-gray-700 transition-colors focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div>
                  <label className="mb-[6px] block text-[13px] font-medium text-gray-600">Courts</label>
                  <div className="flex items-center gap-[8px] rounded-xl border border-gray-200 bg-gray-50/50 px-[10px] py-[6px]">
                    <button type="button" onClick={() => setCourts(Math.max(1, courts - 1))}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-white text-[16px] font-bold text-gray-500 shadow-sm transition-colors hover:bg-gray-100 active:scale-95">−</button>
                    <span className="flex-1 text-center text-[15px] font-semibold text-gray-800">{courts}</span>
                    <button type="button" onClick={() => setCourts(Math.min(20, courts + 1))}
                      className="flex h-[32px] w-[32px] items-center justify-center rounded-lg bg-white text-[16px] font-bold text-gray-500 shadow-sm transition-colors hover:bg-gray-100 active:scale-95">+</button>
                  </div>
                  <input type="text" value={courtNumbers} onChange={(e) => setCourtNumbers(e.target.value)}
                    className="mt-[8px] w-full rounded-xl border border-gray-200 bg-gray-50/50 px-[14px] py-[8px] text-[13px] text-gray-600 transition-colors focus:border-primary focus:bg-white focus:outline-none"
                    placeholder="Court numbers e.g. 1,2" />
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Algorithm cards */}
        <div className="mb-[24px] rounded-2xl bg-white p-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] sm:p-[20px]">
          <Section title="How to pair partners">
            <OptionGrid options={PAIRING} value={pairing} onChange={setPairing} />
          </Section>

          <Section title="How to choose opponents">
            <OptionGrid options={OPPONENT} value={opponent} onChange={setOpponent} />
          </Section>
        </div>

        {/* Format + Scoring card */}
        <div className="mb-[24px] rounded-2xl bg-white p-[16px] shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.03)] sm:p-[20px]">
          <Section title="Match format">
            <OptionGrid options={FORMAT} value={format} onChange={setFormat}
              cols="grid grid-cols-1 gap-[8px] sm:grid-cols-3" />
          </Section>

          <Section title="Scoring system">
            <OptionGrid options={SCORING} value={scoring} onChange={setScoring}
              cols="grid grid-cols-1 gap-[8px] sm:grid-cols-2 md:grid-cols-3" />
            {scoring === 'CUSTOM_CAP' && (
              <div className="mt-[12px]">
                <label className="mb-[6px] block text-[13px] font-medium text-gray-600">Point target</label>
                <input type="number" min={1} placeholder="e.g. 25" value={customCap}
                  onChange={(e) => setCustomCap(e.target.value)}
                  className="w-[120px] rounded-xl border border-gray-200 bg-gray-50/50 px-[14px] py-[10px] text-[14px] text-gray-700 focus:border-primary focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            )}
          </Section>

          <Section title="Tournament structure">
            <OptionGrid options={STRUCTURE} value={structure} onChange={setStructure}
              cols="grid grid-cols-1 gap-[8px] sm:grid-cols-2 md:grid-cols-3" />
          </Section>
        </div>

        {error && (
          <div className="mb-[16px] flex items-center gap-[8px] rounded-xl bg-red-50 px-[14px] py-[12px] text-[13px] text-red-600">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3M8 10h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            {error}
          </div>
        )}
      </form>

      {/* Sticky bottom CTA */}
      <div className="safe-bottom-bar fixed bottom-0 left-0 right-0 border-t border-gray-100 bg-white/90 px-[16px] py-[12px] backdrop-blur-md">
        <div className="mx-auto max-w-[720px]">
          <button onClick={handleSubmit as unknown as React.MouseEventHandler}
            disabled={loading}
            className="w-full rounded-xl bg-primary py-[14px] text-[14px] font-semibold text-white shadow-[0_2px_8px_rgba(22,163,74,0.25)] transition-all disabled:opacity-40 disabled:shadow-none active:scale-[0.98] active:bg-primary-dark">
            {loading ? (
              <span className="inline-flex items-center gap-[6px]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20"/><path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/></svg>
                Creating…
              </span>
            ) : 'Create Session & Add Players →'}
          </button>
        </div>
      </div>
    </main>
  )
}
